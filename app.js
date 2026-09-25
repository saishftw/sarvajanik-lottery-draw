import {EVENT, PRIZES, GROUPS, COUPON_FORMAT, DRAW_ORDER, MANDAL_PERSONNEL, DRAW_WITNESSES, prizeById} from './data.js';
import {
  createState, loadState, saveState, storageKey, updateDraft, commitResult,
  getDuplicates, updateSettings, serializeBackup, parseBackup, recoverState,
} from './state.js';
import {VEHICLE_IMAGES, VEHICLE_SURFACES, VEHICLE_OVERVIEW_FRAMING, WELCOME_VIDEO, SPONSOR_PANELS} from './media.js';
import {downloadFile, exportResults} from './export.js';
import {createWelcomeStage} from './welcome.js';
import {escapeHtml as escape, money, monogram, prizeLabel as label, prizeTier, prizeMarker, prizeCaption, prizeCash} from './presentation.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const message = error => error instanceof Error ? error.message : 'An unexpected error occurred. Please reload before continuing.';
const PREF_KEY = `${EVENT.id}:presentation`;
const AUTOPLAY_INTERVAL_MS = 5000;
const couponRange = `${String(COUPON_FORMAT.min).padStart(COUPON_FORMAT.digits, '0')} to ${String(COUPON_FORMAT.max).padStart(COUPON_FORMAT.digits, '0')}`;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let preferences = {mode: 'rehearsal', margin: 2, still: false, volume: 35};
let storage;
let state;
let storageProblem = '';
let preferenceProblem = '';
let selectedId = DRAW_ORDER[0].id;
let screen = 'welcome';
let editing = false;
let pendingSubmission = false;
let overview = false;
let focusMode = false;
let lightDraw = false;
let showcase = 'all';
let prizePage = 0;
let sponsorPage = 0;
let rotatePrizes = false;
let toastTimer;
let celebrationTimer;
let rotationTimer;
let audioContext;
let soundEnabled = false;
const welcomeStage = createWelcomeStage({root: $('#app'), source: WELCOME_VIDEO, notify: toast});

try {
  storage = window.localStorage;
  try {
    const rawPreferences = storage.getItem(PREF_KEY);
    if (rawPreferences !== null) {
      const parsed = JSON.parse(rawPreferences);
      if (!parsed || !['event', 'rehearsal'].includes(parsed.mode) || !Number.isFinite(parsed.margin) || parsed.margin < 0 || parsed.margin > 6 || typeof parsed.still !== 'boolean' || !Number.isFinite(parsed.volume) || parsed.volume < 0 || parsed.volume > 100) {
        throw new Error('The saved options have an unsupported format.');
      }
      preferences = parsed;
    }
  } catch (error) {
    preferenceProblem = `Presentation options could not load: ${message(error)} Defaults and the rehearsal record are shown. Both draw records are unchanged. Open Settings to repair presentation options or deliberately select a record.`;
  }
  state = loadState(storage, preferences.mode);
} catch (error) {
  storageProblem = message(error);
  state = createState(preferences.mode);
}
selectedId = firstUndrawnId();

function firstUndrawnId() {
  return DRAW_ORDER.find(prize => !state.results[prize.id])?.id ?? DRAW_ORDER[DRAW_ORDER.length - 1].id;
}

function toast(text) {
  clearTimeout(toastTimer);
  $('#toast').textContent = text;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 6000);
}

function refreshStorageStatus() {
  $('#storage-alert').hidden = !storageProblem && !preferenceProblem;
  $('#storage-alert').textContent = [
    storageProblem ? `Saving is blocked for ${state.mode}: ${storageProblem} Open Settings to back up and recover this record, or switch to the other record. Reload after resolving a storage conflict.` : '',
    preferenceProblem,
  ].filter(Boolean).join(' ');
  $('#save-status').textContent = storageProblem ? 'Saving unavailable' : `${state.mode === 'rehearsal' ? 'Rehearsal' : 'Event'} saved locally`;
}

function persist(next) {
  if (storageProblem) throw new Error('Saving is blocked. Resolve the storage warning before announcing a number.');
  try {
    state = saveState(storage, next, state.revision);
  } catch (error) {
    storageProblem = message(error);
    refreshStorageStatus();
    renderEntry();
    throw error;
  }
  refreshStorageStatus();
  return state;
}

function applyPresentation() {
  $('#app').style.setProperty('--safe-margin', `${preferences.margin}vw`);
  $('#app').classList.toggle('still-mode', preferences.still);
  $('#app').classList.toggle('motion-paused', document.hidden);
  $('#motion-button').textContent = reducedMotion.matches ? 'Reduced motion' : preferences.still ? 'Resume motion' : 'Pause motion';
  $('#motion-button').setAttribute('aria-pressed', String(preferences.still || reducedMotion.matches));
  $('#motion-button').disabled = reducedMotion.matches;
  welcomeStage.update({
    active: screen === 'welcome',
    motionPaused: preferences.still || reducedMotion.matches,
    background: document.hidden,
  });
  restartRotation();
}

function placeholder(prize, unavailable = false) {
  const scooter = prize.category === 'scooters';
  const books = prize.category === 'books';
  const drawing = books
    ? '<path d="M85 30h150v85H85zM100 46h120M100 58h120M100 70h60M175 81h42v20h-42zM72 20h150M72 20v84"/>'
    : scooter
      ? '<circle cx="98" cy="107" r="22"/><circle cx="234" cy="107" r="22"/><path d="m234 107-24-78h-32m23 0 14-9m-105 87h82l-8-27h-63l-10-15h-32v18h31l20 24m-18-42h59m43 18h-29m-82 24 15-25"/>'
      : '<circle cx="80" cy="105" r="23"/><circle cx="249" cy="105" r="23"/><path d="M56 106H29V80l25-13 35-35h111l44 31 44 12 10 31h-25M105 106h121M74 64l28-23h45v23zm85 0V41h37l34 23zM35 83h24m208-2h20M154 76h15"/>';
  return `<div class="vehicle-placeholder"><svg viewBox="0 0 320 145" aria-hidden="true">${drawing}</svg><p class="placeholder-model">${escape(books ? 'Book prizes' : prize.shortName)}</p><p>${books ? 'Donation coupon prize' : unavailable ? 'Image unavailable' : 'Vehicle image coming soon'}</p></div>`;
}

function vehicle(prize, cropped = false) {
  const path = prize.imageKey && VEHICLE_IMAGES[prize.imageKey];
  const surface = VEHICLE_SURFACES[prize.imageKey];
  const framing = cropped && VEHICLE_OVERVIEW_FRAMING[prize.imageKey];
  const artwork = path ? framing
    ? sourceCrop(path, framing.width, framing.height, framing.crop, prize.name, true)
    : `<img src="${escape(path)}" alt="${escape(prize.name)}" data-vehicle-image>`
    : placeholder(prize);
  return `<div class="vehicle-visual${path ? ' vehicle-studio' : ''}${surface ? ' grey-studio' : ''}" data-vehicle="${escape(prize.id)}" data-model="${escape(prize.imageKey || '')}"${surface ? ` style="--vehicle-paper:${surface}"` : ''}>${artwork}</div>`;
}

document.addEventListener('error', event => {
  if (event.target instanceof Element && event.target.hasAttribute('data-vehicle-image')) {
    const container = event.target.closest('[data-vehicle]');
    const prize = prizeById(container.dataset.vehicle);
    container.classList.remove('vehicle-studio', 'grey-studio');
    container.innerHTML = placeholder(prize, true);
    toast(`The image for ${prize.shortName} could not load. Check its path in media.js.`);
  }
}, true);

function sourceCrop(source, width, height, crop, title, vehicleImage = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${crop[2]} ${crop[3]}" role="img" aria-label="${escape(title)}"><svg viewBox="${crop.join(' ')}" width="${crop[2]}" height="${crop[3]}" overflow="hidden"><image href="${escape(source)}" width="${width}" height="${height}"${vehicleImage ? ' data-vehicle-image' : ''}/></svg></svg>`;
}

// A silhouette mark keeps only its alpha, so one colour matrix repaints it in the supporter's ink.
function tintedCrop(mark, colour, label) {
  const [x, y, width, height] = mark.crop;
  const id = `mark-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const channels = [1, 3, 5].map(offset => (parseInt(colour.slice(offset, offset + 2), 16) / 255).toFixed(4));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="presentation" aria-hidden="true"><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 ${channels[0]} 0 0 0 0 ${channels[1]} 0 0 0 0 ${channels[2]} 0 0 0 1 0"/></filter><svg viewBox="${mark.crop.join(' ')}" width="${width}" height="${height}" overflow="hidden"><image href="${escape(mark.source)}" width="${mark.width}" height="${mark.height}" filter="url(#${id})"/></svg></svg>`;
}

// Supporter panels combine supplied artwork with the lettering printed alongside it on the coupon.
function sponsorCard(panel) {
  const art = panel.source
    ? sourceCrop(panel.source, panel.width, panel.height, panel.crop, panel.label)
    : '';
  const mark = panel.mark ? `<span class="sponsor-mark">${tintedCrop(panel.mark, panel.titleColour, panel.label)}</span>` : '';
  const title = panel.title ? `<p class="sponsor-title">${escape(panel.title)}</p>` : '';
  const printed = panel.printed ? `<p class="sponsor-printed">${panel.printed.map(line => `<span>${escape(line)}</span>`).join('')}</p>` : '';
  // A printed line sits inside the frame, so those panels leave it room; a caption sits below
  // the frame and the photograph simply takes whatever height is left.
  const sizing = panel.source ? `--art-width:${panel.crop[2]}px;--art-ratio:${(panel.crop[2] / panel.crop[3]).toFixed(3)}${panel.printed ? ';--art-height:46vh' : ''}` : `--supporter-accent:${panel.titleColour};--title-length:${panel.title.length}`;
  return `<div class="sponsor-art${panel.source ? '' : ' sponsor-lettering'}" style="${sizing}">${art}${mark}${title}${printed}</div>`;
}

function pager(page, total, prefix, playing) {  return `<span>${String(page + 1).padStart(2, '0')} <span aria-hidden="true">/</span> ${String(total).padStart(2, '0')}</span><div class="page-controls"><button data-action="${prefix}-previous" aria-label="Previous ${prefix} page">&larr;</button><button class="pause-button" data-action="${prefix}-rotate" aria-pressed="${playing}">${playing ? 'Pause rotation' : 'Auto-play'}</button><button data-action="${prefix}-next" aria-label="Next ${prefix} page">&rarr;</button></div>`;
}

const showcasePrizes = [...PRIZES.filter(prize => prize.category === 'cars'), PRIZES[15], PRIZES[20], PRIZES[25], PRIZES[30]];
function renderVehicleOverview() {
  $('#vehicle-overview').innerHTML = [
    {id: 'cars', title: 'Cars', subtitle: 'One prize per model'},
    {id: 'scooters', title: 'Scooters', subtitle: 'Five of each model'},
  ].map(group => `<section class="vehicle-group vehicle-group-${group.id}" aria-labelledby="vehicle-group-${group.id}"><header class="vehicle-group-heading"><h2 id="vehicle-group-${group.id}">${group.title}</h2><p>${group.subtitle}</p></header><div class="vehicle-group-grid">${showcasePrizes.filter(prize => prize.category === group.id).map(prize => {
    const rank = prize.category === 'scooters' ? `Prizes ${prize.rank}-${prize.rank + 4}` : label(prize);
    return `<button class="vehicle-tile" data-feature-prize="${prize.id}" data-prize-tier="${prizeTier(prize)}" style="--vehicle-paper:${VEHICLE_SURFACES[prize.imageKey] || '#fffdf7'}" aria-label="${escape(`${rank}: ${prize.name}, cash component ${prizeCash(prize, true)}. Open spotlight.`)}">${prizeMarker(prize, true)}<span class="vehicle-tile-surface">${vehicle(prize, true)}${prizeCaption(prize, true)}</span></button>`;
  }).join('')}</div></section>`).join('');
}

function renderShowcase() {
  $$('[data-showcase]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.showcase === showcase)));
  $('#prizes-title').textContent = {committee: 'Mandal committee', hall: 'Community hall', sponsors: 'Supporters'}[showcase] ?? 'Prizes';
  $('#prize-showcase').hidden = showcase !== 'prizes';
  $('#sponsor-showcase').hidden = showcase !== 'sponsors';
  $('#coupon-showcase').hidden = showcase !== 'coupon';
  $('#hall-showcase').hidden = showcase !== 'hall';
  $('#vehicle-overview').hidden = showcase !== 'all';
  $('#committee-showcase').hidden = showcase !== 'committee';
  $('#prize-hall-ad').hidden = ['all', 'spotlight', 'committee', 'sponsors', 'hall'].includes(showcase);
  $('#screen-prizes').classList.toggle('show-all-vehicles', showcase === 'all');
  $('#screen-prizes').classList.toggle('show-committee', ['committee', 'sponsors', 'hall'].includes(showcase));
  $('#prize-pagination').hidden = !['prizes', 'sponsors'].includes(showcase);
  if (showcase === 'prizes') {
    const prize = showcasePrizes[prizePage];
    $('#prize-showcase').innerHTML = `<article class="featured-prize">${vehicle(prize)}<div class="prize-copy">${prizeMarker(prize, true)}<h2>${escape(prize.name)}</h2><p class="prize-amount">${escape(prizeCash(prize, true))}</p><p class="cash-note">${prize.category === 'books' ? '15 lucky-book cash prizes. Coupon terms apply.' : 'Cash component. Coupon terms & taxes apply.'}</p></div></article>`;
    $('#prize-pagination').innerHTML = pager(prizePage, showcasePrizes.length, 'prize', rotatePrizes);
  } else if (showcase === 'sponsors') {
    const panel = SPONSOR_PANELS[sponsorPage];
    const caption = panel.caption ? `<p class="sponsor-caption"><strong>${escape(panel.caption[0])}</strong>${escape(panel.caption[1])}</p>` : '';
    $('#sponsor-showcase').innerHTML = `${sponsorCard(panel)}${caption}`;
    $('#prize-pagination').innerHTML = pager(sponsorPage, SPONSOR_PANELS.length, 'prize', rotatePrizes);
  } else if (showcase === 'all') {
    renderVehicleOverview();
  } else if (showcase === 'committee') {
    $('#committee-list').innerHTML = MANDAL_PERSONNEL.map(person => `<article class="committee-person"><span class="committee-seal" aria-hidden="true">${escape(monogram(person.name))}</span><h2>${escape(person.name)}</h2><p class="committee-role">${escape(person.role)}</p><p class="committee-phone">${escape(person.phone.replace(/^(\d{5})(\d{5})$/, '$1 $2'))}</p></article>`).join('');
  }
  restartRotation();
}

function fillPrizeSelect() {
  for (const category of new Set(DRAW_ORDER.map(prize => prize.category))) {
    const group = GROUPS.find(item => item.id === category);
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;
    for (const prize of DRAW_ORDER.filter(item => item.category === category)) {
      optgroup.append(new Option(`${label(prize)} - ${prize.shortName}`, prize.id));
    }
    $('#prize-select').append(optgroup);
  }
}

function renderEntry() {
  const result = state.results[selectedId];
  const locked = Boolean(result) && !editing;
  const digits = COUPON_FORMAT.digits;
  const value = locked ? result.number : (state.drafts[selectedId] ?? (editing ? result.number : ''));
  const input = $('#ticket-input');
  if (input.value !== value) input.value = value;
  input.disabled = locked || Boolean(storageProblem) || pendingSubmission;
  input.setAttribute('aria-label', `Winning coupon number, ${digits} digits`);
  $('#number-label').textContent = 'Winning coupon number';
  $('#digit-field').classList.toggle('confirmed', locked);
  $('#digit-panels').style.setProperty('--digit-count', digits);
  const caret = input.selectionStart ?? value.length;
  $('#digit-panels').innerHTML = Array.from({length: digits}, (_, index) => `<span class="digit-panel${value[index] ? '' : ' empty'}${!locked && index === Math.min(caret, digits - 1) ? ' active' : ''}">${value[index] ?? '&middot;'}</span>`).join('');
  $('#number-status').textContent = locked ? 'Confirmed & saved' : editing ? 'Correcting result' : value ? 'Not yet confirmed' : 'Awaiting number';
  $('#entry-hint').hidden = locked;
  if (locked) {
    $('#entry-hint').textContent = '';
    $('#correct-button').title = `Saved ${new Date(result.updatedAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}${result.history.length ? `; ${result.history.length} correction(s) retained in the backup` : ''}`;
  } else {
    $('#entry-hint').textContent = state.settings.autoSubmit && !editing
      ? `${couponRange}. Auto-submit on: the final digit confirms.`
      : `${couponRange}. Press Enter to ${editing ? 'save the correction' : 'confirm'}.`;
  }
  $('#confirm-button').hidden = locked;
  $('#confirm-button').disabled = Boolean(storageProblem) || pendingSubmission || value.length !== digits;
  $('#confirm-button').innerHTML = `${editing ? 'Save correction' : 'Confirm number'} <kbd>Enter</kbd>`;
  $('#correct-button').hidden = !locked;
  $('#correct-button').disabled = Boolean(storageProblem);
  $('#cancel-correction-button').hidden = !editing;
  $('#next-button').hidden = editing;
  syncActiveCell();
}

function renderActivePrize() {
  const prize = prizeById(selectedId);
  $('#prize-select').value = selectedId;
  $('#active-prize').dataset.prizeTier = prizeTier(prize);
  $('#active-prize').innerHTML = `${vehicle(prize, true)}<div class="active-prize-info">${prizeMarker(prize)}<div class="active-prize-nameplate"><h2>${escape(prize.name)}</h2><p class="prize-amount">${escape(prizeCash(prize))}</p></div></div>`;
}

function cellDigits(value, {active = false} = {}) {
  const caret = Math.min(value.length, COUPON_FORMAT.digits - 1);
  return `<span class="cell-digits">${Array.from({length: COUPON_FORMAT.digits}, (_, index) =>
    `<i class="cell-digit${value[index] ? '' : ' empty'}${active && index === caret ? ' active' : ''}">${value[index] ? escape(value[index]) : ''}</i>`).join('')}</span>`;
}

function cellValue(prize) {
  const result = state.results[prize.id];
  const active = overview && prize.id === selectedId;
  if (result && !(active && editing)) return cellDigits(result.number);
  if (!active) return cellDigits('');
  return cellDigits(state.drafts[prize.id] ?? (editing ? result.number : ''), {active: true});
}

function renderMandalStrip() {
  // The strip has one line per person, so the longer coupon roles lose their "Donation" prefix.
  const role = person => person.role.replace(/^Donation /, '');
  const witnesses = `<div class="witness-row"><p class="strip-heading">Draw held in the presence of</p><ol class="draw-witnesses">${DRAW_WITNESSES.map(person => `<li><span class="witness-name">${escape(person.name)}</span><span class="witness-role">${escape(person.role)}</span></li>`).join('')}</ol></div>`;
  $('#mandal-strip').innerHTML = `${witnesses}<p class="collection-notice">Prizes must be collected strictly within 30 days from date of draw</p><ul class="mandal-contacts">${MANDAL_PERSONNEL.map(person => `<li><span class="mandal-name">Shri. ${escape(person.name)}</span><span class="mandal-meta"><span class="mandal-role">${escape(role(person))}</span><span class="mandal-sep" aria-hidden="true">\u25c6</span><span class="mandal-phone">${escape(person.phone)}</span></span></li>`).join('')}</ul>`;
}

function renderResults() {
  const confirmed = PRIZES.filter(prize => state.results[prize.id]);
  $('#result-count').textContent = `${confirmed.length} / 45`;
  $('#board-headings').innerHTML = [
    'Prizes 1 \u2013 15',
    'Prizes 16 \u2013 30',
    `15 Lucky Book Number Prizes \u00b7 ${money(PRIZES.at(-1).amount)} each`,
  ].map(heading => `<span>${escape(heading)}</span>`).join('');
  $('#recent-results').innerHTML = confirmed.length
    ? confirmed.map(prize => `<button class="recent-result" data-prize="${prize.id}" aria-label="${escape(`${label(prize)}, ${prize.shortName}, cash component ${prizeCash(prize)}, ${state.results[prize.id].number}`)}" style="--result-digits:${Math.max(6, state.results[prize.id].number.length)}"><span class="recent-number-row">${prizeMarker(prize)}<strong>${escape(state.results[prize.id].number)}</strong></span>${prizeCaption(prize)}</button>`).join('')
    : '<div class="empty-results"><h3>No results yet</h3></div>';
  $('#results-grid').innerHTML = PRIZES.map(prize => {
    const result = state.results[prize.id];
    const active = overview && prize.id === selectedId;
    const name = prize.category === 'books' ? `Lucky book prize ${prize.rank}` : prize.name;
    const compact = prize.category === 'books' ? `Book prize ${prize.rank}` : prize.shortName;
    const money_ = `<span class="result-money">${escape(prizeCash(prize))}</span>`;
    return `<button class="result-cell${result ? ' saved' : ''}${active ? ' active' : ''}" data-prize="${prize.id}" data-prize-tier="${prizeTier(prize)}" style="--result-digits:${Math.max(6, result?.number.length ?? 6)}" aria-label="${escape(`${label(prize)}, ${prize.shortName}, cash component ${prizeCash(prize)}, ${result ? result.number : 'not announced'}`)}"><span class="result-surface">${prizeMarker(prize)}<span class="result-copy"><span class="result-name">${escape(name)}</span><span class="result-name-compact" aria-hidden="true">${escape(compact)}</span>${money_}</span><span class="cell-value">${cellValue(prize)}</span></span></button>`;
  }).join('');
  mountEntryField();
}

// The single live input moves to the overview so grid entry reuses the draw's validation.
function mountEntryField() {
  const input = $('#ticket-input');
  const host = overview ? $('#entry-anchor') : $('#digit-field');
  if (host && input.parentElement !== host) host.append(input);
}

function syncActiveCell() {
  if (!overview) return;
  const cell = $(`.result-cell[data-prize="${selectedId}"]`);
  if (cell) cell.querySelector('.cell-value').innerHTML = cellValue(prizeById(selectedId));
}

function setOverview(value) {
  overview = value;
  $('#live-view').hidden = value;
  $('#overview-view').hidden = !value;
  $('#app').classList.toggle('board-mode', value);
  $('#overview-button').textContent = value ? 'Back to draw' : 'All results \u2197';
  $('#focus-button').hidden = value;
  $('#export-all-button').hidden = !value;
  $('#draw-title').textContent = value ? 'Winning numbers' : 'Prize draw';
  renderResults();
  renderEntry();
  if (value) $('#ticket-input').focus();
}

function selectPrize(id) {
  prizeById(id);
  selectedId = id;
  editing = false;
  $('#entry-error').textContent = '';
  $('#celebration').classList.remove('running');
  $('#celebration').replaceChildren();
  renderActivePrize();
  renderEntry();
  if (overview) {
    renderResults();
    $('#ticket-input').focus();
  }
}

function showScreen(name) {
  if (!['welcome', 'prizes', 'winners', 'draw'].includes(name)) name = 'welcome';
  screen = name;
  $('#app').dataset.screen = name;
  $$('.screen').forEach(section => { section.hidden = section.id !== `screen-${name}`; });
  $$('.stage-nav [data-screen]').forEach(button => {
    if (button.dataset.screen === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (name === 'prizes') renderShowcase();
  if (name === 'draw') {
    renderActivePrize();
    renderEntry();
    renderResults();
  }
  // The compact board chrome belongs to the draw screen only.
  $('#app').classList.toggle('board-mode', overview && name === 'draw');
  applyPresentation();
  history.replaceState(null, '', `#${name}`);
}

function confirmation({title, description, action = 'Confirm', phrase = ''}) {
  const dialog = $('#confirm-dialog');
  $('#confirmation-title').textContent = title;
  $('#confirmation-message').textContent = description;
  $('#confirmation-submit').textContent = action;
  $('#confirmation-phrase-label').hidden = !phrase;
  $('#confirmation-phrase-hint').textContent = phrase ? `Type ${phrase} to continue` : '';
  $('#confirmation-phrase').value = '';
  $('#confirmation-phrase').dataset.expected = phrase;
  $('#confirmation-error').textContent = '';
  dialog.returnValue = '';
  dialog.showModal();
  if (phrase) $('#confirmation-phrase').focus();
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirmed'), {once: true});
  });
}

$('#confirmation-form').addEventListener('submit', event => {
  event.preventDefault();
  const expected = $('#confirmation-phrase').dataset.expected;
  if (expected && $('#confirmation-phrase').value !== expected) {
    $('#confirmation-error').textContent = `Type ${expected} exactly. Nothing has been changed.`;
    return;
  }
  $('#confirm-dialog').close('confirmed');
});

// The live view's error line is hidden while the board is showing, so repeat it as a toast there.
function showEntryError(error) {
  $('#entry-error').textContent = message(error);
  if (overview) toast(message(error));
}

async function submitNumber() {
  if (pendingSubmission || (state.results[selectedId] && !editing)) return;
  const id = selectedId;
  const number = $('#ticket-input').value;
  const revision = state.revision;
  const correction = editing;
  pendingSubmission = true;
  renderEntry();
  $('#entry-error').textContent = '';
  try {
    // Validate before asking about duplicates, but do not persist until approval.
    commitResult(state, id, number, {correction, allowDuplicate: true});
    const duplicates = getDuplicates(state, id, number);
    if (duplicates.length) {
      const approved = await confirmation({
        title: 'This number already has a prize',
        description: `${number} is recorded for ${duplicates.map(label).join(', ')}. Only continue if the organisers permit repeat winners in this draw.`,
        action: 'Allow repeat & confirm',
      });
      if (!approved) return;
    }
    if (correction) {
      const approved = await confirmation({
        title: 'Save this correction?',
        description: `${label(prizeById(id))}: replace ${state.results[id].number} with ${number}. The previous number remains in the local correction history and JSON backup.`,
        action: 'Save correction',
      });
      if (!approved) return;
    }
    if (state.revision !== revision || selectedId !== id) throw new Error('The draw changed while confirming. Review the current record and submit again.');
    persist(commitResult(state, id, number, {allowDuplicate: duplicates.length > 0, correction}));
    editing = false;
    renderResults();
    const prize = prizeById(id);
    if (!correction) celebrate(prize);
    playSound('confirm', correction || prize.category === 'books' ? 0 : prize.rank);
    if (correction) toast('Correction saved. Previous numbers remain in the backup history.');
  } catch (error) {
    showEntryError(error);
  } finally {
    pendingSubmission = false;
    renderEntry();
  }
}

function celebrate(prize) {
  if (preferences.still || reducedMotion.matches) return;
  const layer = $('#celebration');
  clearTimeout(celebrationTimer);
  layer.replaceChildren();
  layer.classList.remove('running');
  const tier = prize.category !== 'books' && prize.rank <= 3 ? prize.rank : 0;
  layer.dataset.tier = tier;
  const count = tier === 1 ? 48 : tier === 2 ? 32 : tier === 3 ? 24 : 12;
  for (let index = 0; index < count; index++) {
    const petal = document.createElement('i');
    petal.className = 'petal';
    petal.style.setProperty('--x', `${(index * 37) % 101}%`);
    petal.style.setProperty('--delay', `${(index % 7) * .07}s`);
    petal.style.setProperty('--duration', `${tier ? 2.8 + (index % 3) * .2 : 1.6}s`);
    petal.style.setProperty('--drift', `${(index % 2 ? 1 : -1) * (20 + index % 50)}px`);
    petal.style.setProperty('--spin', `${120 + index * 17}deg`);
    layer.append(petal);
  }
  void layer.offsetWidth;
  layer.classList.add('running');
  celebrationTimer = setTimeout(() => { layer.classList.remove('running'); layer.replaceChildren(); }, tier ? 4100 : 2300);
}

async function enableSound() {
  $('#playback-error').textContent = '';
  if (soundEnabled) {
    soundEnabled = false;
  } else {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio is not supported in this browser.');
      audioContext ??= new Audio();
      await audioContext.resume();
      if (audioContext.state !== 'running') throw new Error('Allow audio playback in the browser before enabling sound.');
      soundEnabled = true;
    } catch (error) {
      $('#playback-error').textContent = message(error);
      soundEnabled = false;
    }
  }
  $('#sound-button').textContent = soundEnabled ? 'Sound effects on' : 'Sound effects off';
  $('#sound-button').setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled) playSound('digit');
}

function playSound(kind, rank = 0) {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  const notes = kind === 'digit' ? [620] : rank === 1 ? [392, 494, 587, 784] : rank === 2 ? [392, 494, 659] : [523, 659];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * .14;
    const duration = kind === 'digit' ? .085 : .45;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(preferences.volume / 100 * (kind === 'digit' ? .055 : .13), start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}

function openSettings() {
  $('#setting-mode').value = state.mode;
  $('#setting-auto').checked = state.settings.autoSubmit;
  $('#setting-volume').value = preferences.volume;
  $('#setting-margin').value = preferences.margin;
  $('#margin-value').textContent = `${preferences.margin}%`;
  $('#settings-error').textContent = '';
  $('#playback-error').textContent = '';
  $('#presentation-recovery').hidden = !preferenceProblem;
  setModeControlsDisabled(false);
  $('#settings-dialog').showModal();
}

function setModeControlsDisabled(disabled) {
  $$('#settings-form .settings-grid input').forEach(input => { input.disabled = disabled; });
}

function backup() {
  if (!storage) throw new Error('Browser storage is unavailable. There is no readable local record to export.');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (storageProblem) {
    const raw = storage.getItem(storageKey(state.mode));
    if (raw === null) throw new Error('There is no stored draw record to back up.');
    downloadFile(raw, `sanvordem-2026-${state.mode}-recovery-${stamp}.json`);
  } else {
    downloadFile(serializeBackup(state), `sanvordem-2026-${state.mode}-${stamp}.json`);
  }
}

$('#settings-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const nextMode = $('#setting-mode').value;
    if (nextMode !== state.mode) {
      let target;
      let targetProblem = '';
      try {
        target = loadState(storage, nextMode);
      } catch (error) {
        target = createState(nextMode);
        targetProblem = message(error);
      }
      const nextPreferences = {...preferences, mode: nextMode};
      storage.setItem(PREF_KEY, JSON.stringify(nextPreferences));
      state = target;
      selectedId = firstUndrawnId();
      preferences = nextPreferences;
      preferenceProblem = '';
      storageProblem = targetProblem;
      editing = false;
      toast(targetProblem
        ? `The ${nextMode} record needs recovery. Its stored data has not been changed. Open Settings to back it up and recover it.`
        : `Switched to ${nextMode === 'event' ? 'the live event' : 'rehearsal'}. Its own saved settings and results are loaded.`);
    } else {
      if (storageProblem) throw new Error('Resolve this record\'s storage warning before saving its settings, or switch to the other record.');
      const next = updateSettings(state, {
        autoSubmit: $('#setting-auto').checked,
      });
      persist(next);
      const nextPreferences = {...preferences, volume: Number($('#setting-volume').value), margin: Number($('#setting-margin').value)};
      storage.setItem(PREF_KEY, JSON.stringify(nextPreferences));
      preferences = nextPreferences;
      preferenceProblem = '';
      toast('Stage settings saved.');
    }
    applyPresentation();
    refreshStorageStatus();
    renderActivePrize();
    renderEntry();
    renderResults();
    $('#settings-dialog').close();
  } catch (error) {
    $('#settings-error').textContent = message(error);
  }
});

$('#setting-mode').addEventListener('change', () => {
  setModeControlsDisabled($('#setting-mode').value !== state.mode);
  if ($('#setting-mode').value !== state.mode) {
    $('#settings-error').textContent = 'Save to switch records. Its saved results and auto-submit setting will be loaded.';
  } else $('#settings-error').textContent = '';
});
$('#reset-presentation-button').addEventListener('click', async () => {
  if (!await confirmation({title: 'Restore presentation defaults?', description: 'This resets only screen margins, volume and motion preferences. Both draw records and all results stay unchanged.', action: 'Reset presentation options'})) return;
  try {
    const defaults = {mode: state.mode, margin: 2, still: false, volume: 35};
    storage.setItem(PREF_KEY, JSON.stringify(defaults));
    preferences = defaults;
    preferenceProblem = '';
    applyPresentation();
    refreshStorageStatus();
    $('#settings-dialog').close();
    toast('Presentation options repaired. Both draw records are unchanged.');
  } catch (error) {
    $('#settings-error').textContent = message(error);
  }
});
$('#setting-margin').addEventListener('input', event => { $('#margin-value').textContent = `${event.target.value}%`; });
$('#backup-button').addEventListener('click', () => {
  try { backup(); toast('JSON backup download started. Keep this file with the event records.'); }
  catch (error) { $('#settings-error').textContent = message(error); }
});
$('#restore-button').addEventListener('click', () => {
  if (storageProblem) {
    $('#settings-error').textContent = 'Back up the unreadable record and explicitly reset it before restoring a valid backup.';
    return;
  }
  $('#restore-input').click();
});
$('#restore-input').addEventListener('change', async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error('That backup is too large. Select a draw JSON backup smaller than 2 MB.');
    const revision = state.revision;
    const mode = state.mode;
    const imported = parseBackup(await file.text(), mode);
    const approved = await confirmation({
      title: 'Replace this draw with the backup?',
      description: `This will replace the ${mode} record with ${Object.keys(imported.results).length} confirmed results from ${file.name}. A backup of the current record will download first.`,
      action: 'Back up & restore',
      phrase: 'RESTORE 2026',
    });
    if (!approved) return;
    if (revision !== state.revision || mode !== state.mode) throw new Error('The record changed while restoring. Select the backup again.');
    backup();
    persist({...imported, revision: state.revision});
    editing = false;
    selectedId = firstUndrawnId();
    renderActivePrize();
    renderEntry();
    renderResults();
    openSettingsFieldsAfterRestore();
    toast('Backup restored. No announcements or celebrations were replayed.');
  } catch (error) {
    $('#settings-error').textContent = message(error);
  }
});

function openSettingsFieldsAfterRestore() {
  $('#setting-auto').checked = state.settings.autoSubmit;
}

$('#reset-button').addEventListener('click', async () => {
  try {
    const revision = state.revision;
    const mode = state.mode;
    if (!storage) throw new Error('Browser storage is unavailable. Enable it or use a normal browser profile, then reload.');
    const raw = storage.getItem(storageKey(mode));
    const approved = await confirmation({
      title: `Reset ${mode === 'event' ? 'the live event' : 'rehearsal'}?`,
      description: 'This clears all numbers, drafts, corrections and draw settings in this record only. A copy of the stored record will download first. The other record is not affected.',
      action: 'Back up & reset',
      phrase: 'RESET 2026',
    });
    if (!approved) return;
    if (revision !== state.revision || mode !== state.mode) throw new Error('The record changed while confirming. Review it before resetting.');
    if (raw !== null) backup();
    if (storageProblem) {
      state = raw === null ? saveState(storage, createState(mode), 0) : recoverState(storage, mode, raw);
      preferences = {...preferences, mode};
      storage.setItem(PREF_KEY, JSON.stringify(preferences));
      storageProblem = '';
      preferenceProblem = '';
    } else {
      persist({...createState(mode), revision: state.revision});
    }
    editing = false;
    selectedId = firstUndrawnId();
    refreshStorageStatus();
    renderActivePrize();
    renderEntry();
    renderResults();
    openSettingsFieldsAfterRestore();
    $('#settings-error').textContent = '';
    toast(`${mode === 'event' ? 'Live event' : 'Rehearsal'} reset. The other record is unchanged.`);
  } catch (error) {
    $('#settings-error').textContent = message(error);
  }
});

$('#draw-form').addEventListener('submit', event => { event.preventDefault(); submitNumber(); });
$('#ticket-input').addEventListener('input', event => {
  if (pendingSubmission || (state.results[selectedId] && !editing)) return;
  const value = event.target.value;
  const previous = state.drafts[selectedId] ?? (editing ? state.results[selectedId].number : '');
  $('#entry-error').textContent = '';
  try {
    persist(updateDraft(state, selectedId, value));
    renderEntry();
    if (value.length > previous.length) playSound('digit');
    const length = COUPON_FORMAT.digits;
    if (state.settings.autoSubmit && !editing && value.length === length) submitNumber();
  } catch (error) {
    event.target.value = previous;
    showEntryError(error);
    renderEntry();
  }
});
$('#ticket-input').addEventListener('keyup', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) renderEntry(); });
$('#ticket-input').addEventListener('keydown', event => {
  // In the overview the field sits outside the form, so Enter has to be submitted by hand.
  if (event.key === 'Enter' && overview) { event.preventDefault(); submitNumber(); }
});
$('#ticket-input').addEventListener('click', renderEntry);
$('#prize-select').addEventListener('change', event => selectPrize(event.target.value));
$('#correct-button').addEventListener('click', async () => {
  if (await confirmation({title: 'Correct this confirmed result?', description: `${label(prizeById(selectedId))} is currently ${state.results[selectedId].number}. The confirmed result stays on the results board until you explicitly save a correction.`, action: 'Edit number'})) {
    try {
      persist(updateDraft(state, selectedId, state.results[selectedId].number));
      editing = true;
      renderEntry();
      $('#ticket-input').focus();
      $('#ticket-input').select();
    } catch (error) { showEntryError(error); }
  }
});
$('#cancel-correction-button').addEventListener('click', () => {
  editing = false;
  $('#entry-error').textContent = '';
  renderEntry();
});
$('#next-button').addEventListener('click', () => {
  const current = DRAW_ORDER.findIndex(prize => prize.id === selectedId);
  const remaining = [...DRAW_ORDER.slice(current + 1), ...DRAW_ORDER.slice(0, current + 1)];
  const next = remaining.find(prize => !state.results[prize.id]);
  if (!next) { toast('All 45 prizes have a confirmed number. Open All results to export the draw.'); return; }
  selectPrize(next.id);
  $('#ticket-input').focus();
});
function stepPrize(direction) {
  // The overview lists prizes in board order; the live view follows the announcement order.
  const order = overview ? PRIZES : DRAW_ORDER;
  const current = order.findIndex(prize => prize.id === selectedId);
  const focused = document.activeElement === $('#ticket-input');
  selectPrize(order[(current + direction + order.length) % order.length].id);
  if (focused && !$('#ticket-input').disabled) $('#ticket-input').focus();
}
document.addEventListener('keydown', event => {
  const direction = {ArrowLeft: -1, ArrowRight: 1}[event.key];
  if (!direction || screen !== 'draw' || event.altKey || event.ctrlKey || event.metaKey || $('dialog[open]')) return;
  const input = $('#ticket-input');
  const target = event.target;
  // Inside the number field the arrows stay a caret control until the caret reaches an edge.
  if (target === input) {
    const caret = direction < 0 ? input.selectionStart : input.selectionEnd;
    if (input.selectionStart !== input.selectionEnd || caret !== (direction < 0 ? 0 : input.value.length)) return;
  } else if (target instanceof Element && target.matches('input, select, textarea')) return;
  event.preventDefault();
  stepPrize(direction);
});
$('#overview-button').addEventListener('click', () => setOverview(!overview));
$('#rail-overview-button').addEventListener('click', () => setOverview(true));
$('#focus-button').addEventListener('click', () => {
  focusMode = !focusMode;
  $('#screen-draw').classList.toggle('focus-mode', focusMode);
  $('#focus-button').textContent = focusMode ? 'Show recent results' : 'Expand number';
  $('#focus-button').setAttribute('aria-pressed', String(focusMode));
});
$('#light-button').addEventListener('click', () => {
  lightDraw = !lightDraw;
  $('#app').classList.toggle('light-draw', lightDraw);
  const label = lightDraw ? 'Dark theme' : 'Light theme';
  $('#light-button').setAttribute('aria-label', label);
  $('#light-button').setAttribute('title', label);
  $('#light-button').setAttribute('aria-pressed', String(lightDraw));
});
$('#sound-button').addEventListener('click', enableSound);
$('#motion-button').addEventListener('click', () => {
  $('#playback-error').textContent = '';
  preferences = {...preferences, still: !preferences.still};
  applyPresentation();
  try {
    storage.setItem(PREF_KEY, JSON.stringify(preferences));
  } catch (error) {
    $('#playback-error').textContent = `Motion changed for this page only; the preference could not be saved: ${message(error)}`;
  }
});
$('#settings-button').addEventListener('click', openSettings);
$('#fullscreen-button').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else throw new Error('Use your browser fullscreen command on this device.');
  } catch (error) { toast(`Fullscreen: ${message(error)}`); }
});
document.addEventListener('fullscreenchange', () => {
  $('#fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
});

$('#export-all-button').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    if (storageProblem) throw new Error('Resolve the storage warning before exporting a results image. You can still download the stored JSON recovery file.');
    await exportResults(state);
    toast('Results image download started. Only confirmed numbers are included.');
  } catch (error) { toast(message(error)); }
  finally { button.disabled = false; }
});

function advanceShowcase(direction) {
  if (showcase === 'sponsors') sponsorPage = (sponsorPage + direction + SPONSOR_PANELS.length) % SPONSOR_PANELS.length;
  else prizePage = (prizePage + direction + showcasePrizes.length) % showcasePrizes.length;
  renderShowcase();
}

function openImage(source, title) {
  $('#full-image').src = source;
  $('#full-image').alt = title;
  $('#image-title').textContent = title;
  if (!$('#image-dialog').open) $('#image-dialog').showModal();
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('button, a') : null;
  if (!target) return;
  if (target.matches('.close-dialog')) target.closest('dialog').close('cancelled');
  if (target.dataset.screen) showScreen(target.dataset.screen);
  if (target.matches('.identity')) { event.preventDefault(); showScreen('welcome'); }
  if (target.dataset.showcase) { showcase = target.dataset.showcase; renderShowcase(); }
  if (target.dataset.featurePrize) {
    prizePage = showcasePrizes.findIndex(prize => prize.id === target.dataset.featurePrize);
    showcase = 'prizes';
    renderShowcase();
  }
  if (target.dataset.prize) { selectPrize(target.dataset.prize); if (!overview) setOverview(false); }
  if (target.dataset.image) {
    openImage(target.dataset.image, target.dataset.imageTitle);
  }
  switch (target.dataset.action) {
    case 'prize-previous': advanceShowcase(-1); break;
    case 'prize-next': advanceShowcase(1); break;
    case 'prize-rotate': rotatePrizes = !rotatePrizes; renderShowcase(); break;
  }
  restartRotation();
});

function restartRotation() {
  clearTimeout(rotationTimer);
  if (document.hidden || $('dialog[open]') || preferences.still || reducedMotion.matches) return;
  if (screen !== 'prizes' || !rotatePrizes || !['prizes', 'sponsors'].includes(showcase)) return;
  rotationTimer = setTimeout(() => {
    if (document.hidden || $('dialog[open]') || preferences.still || reducedMotion.matches) return;
    advanceShowcase(1);
  }, AUTOPLAY_INTERVAL_MS);
}

document.addEventListener('close', restartRotation, true);

window.addEventListener('storage', event => {
  if (event.key !== storageKey(state.mode) && event.key !== null) return;
  storageProblem = 'This record changed in another window. Reload to review the latest saved results before continuing.';
  refreshStorageStatus();
  renderEntry();
});
window.addEventListener('hashchange', () => showScreen(location.hash.slice(1)));
reducedMotion.addEventListener('change', applyPresentation);
document.addEventListener('visibilitychange', applyPresentation);

$$('[data-coupon-range]').forEach(element => {
  element.innerHTML = `Only ${COUPON_FORMAT.total.toLocaleString('en-IN')} coupons<br><span class="coupon-range-value">Nos. from ${escape(couponRange)}</span>`;
});
fillPrizeSelect();
refreshStorageStatus();
renderMandalStrip();
renderActivePrize();
renderEntry();
renderResults();
showScreen(location.hash.slice(1) || 'welcome');
