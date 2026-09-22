import {DRAW_WITNESSES, EVENT, GROUPS, MANDAL_PERSONNEL, PRIZES} from './data.js';
import {validateState} from './state.js';
import {prizeTier} from './presentation.js';

export function downloadFile(content, filename, type = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

const DEVANAGARI = '"Noto Serif Devanagari", "Kohinoor Devanagari", "Devanagari MN", "Nirmala UI", "Mangal", Georgia, serif';
const HEADER_HEIGHT = 430;
const CREST_SPACE = 225;
const GANESH_MARK = 'artwork/ganesh-icon-03.png';
// Path data mirrors artwork/weave.svg and ornament.svg so the sheet draws without extra image requests.
const WEAVE = [
  'M40 7Q56 25 40 40Q24 25 40 7ZM73 40Q55 56 40 40Q55 24 73 40ZM40 73Q24 55 40 40Q56 55 40 73ZM7 40Q25 24 40 40Q25 56 7 40Z',
  'M40 1 79 40 40 79 1 40Z',
  'm0 0 6 6m74-6-6 6M0 80l6-6m74 6-6-6',
  'M46 40a6 6 0 1 1-12 0 6 6 0 1 1 12 0',
];
const PETAL = 'M50 7C61 24 64 33 50 50C36 33 39 24 50 7Z';
const TIER_ROW_BONUS = 22;
const TIER_PAPER = ['#fdeaba', '#f7e6cb', '#f2ddc0'];
// The sheet is laid out in landscape: one column per prize group, side by side.
const SHEET_MARGIN = 75;
const COLUMN_WIDTH = 1050;
const COLUMN_GAP = 55;
const MIN_SHEET_WIDTH = 1800;
const ROW_HEIGHT = 90;
const GROUP_HEADING = 95;
const WITNESS_GAP = 30;
const CONTACT_GAP = 24;

function drawWeave(context, width, height, gold) {
  const paths = WEAVE.map(data => new Path2D(data));
  const tile = 95;
  const scale = tile / 80;
  context.save();
  context.strokeStyle = gold;
  context.globalAlpha = .07;
  context.lineWidth = 1 / scale;
  for (let y = 0; y < height + tile; y += tile) {
    for (let x = 0; x < width + tile; x += tile) {
      context.save();
      context.translate(x, y);
      context.scale(scale, scale);
      for (const path of paths) context.stroke(path);
      context.restore();
    }
  }
  context.restore();
}

function drawFlower(context, x, y, size, alpha, gold) {
  const petal = new Path2D(PETAL);
  context.save();
  context.translate(x, y);
  context.scale(size / 100, size / 100);
  context.translate(-50, -50);
  context.strokeStyle = gold;
  context.fillStyle = gold;
  context.lineWidth = 1.8;
  for (let turn = 0; turn < 8; turn++) {
    context.save();
    context.translate(50, 50);
    context.rotate(turn * Math.PI / 4);
    context.translate(-50, -50);
    context.globalAlpha = alpha * .35;
    context.fill(petal);
    context.globalAlpha = alpha;
    context.stroke(petal);
    context.restore();
  }
  context.globalAlpha = alpha;
  context.beginPath();
  context.arc(50, 50, 8, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = alpha * .5;
  context.beginPath();
  context.arc(50, 50, 46, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

// Canvas ignores an unsupported letterSpacing, so tracked lines degrade to plain text.
function tracked(context, spacing, draw) {
  context.letterSpacing = `${spacing}px`;
  draw();
  context.letterSpacing = '0px';
}

async function loadMark(source) {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

function drawHeader(context, width, state, {cream, gold, mark}) {
  context.textAlign = 'center';
  const centre = width / 2;
  context.save();
  if (mark) {
    const size = 240;
    context.drawImage(mark, centre - size / 2, 36, size, size);
    context.translate(0, CREST_SPACE);
  }

  context.fillStyle = cream;
  context.font = '50px Georgia';
  context.fillText(EVENT.name.toUpperCase(), centre, 108);

  context.fillStyle = gold;
  context.font = '23px Arial';
  tracked(context, 7, () => context.fillText(EVENT.location.replace(',', '  \u00b7').toUpperCase(), centre, 148));

  const milestones = `ESTD ${EVENT.established}    \u25c6    ${EVENT.celebrationYear}TH YEAR`;
  context.font = '25px Arial';
  let rule = 0;
  tracked(context, 7, () => {
    context.fillText(milestones, centre, 208);
    rule = context.measureText(milestones).width / 2 + 55;
  });
  context.strokeStyle = gold;
  context.lineWidth = 1;
  context.globalAlpha = .55;
  context.beginPath();
  context.moveTo(centre - rule - 150, 200);
  context.lineTo(centre - rule, 200);
  context.moveTo(centre + rule, 200);
  context.lineTo(centre + rule + 150, 200);
  context.stroke();
  context.globalAlpha = 1;

  context.font = `58px ${DEVANAGARI}`;
  const title = '\u0938\u093e\u0935\u0930\u094d\u0921\u0947\u091a\u093e \u0930\u093e\u091c\u093e';
  context.fillText(title, centre, 288);
  const flank = context.measureText(title).width / 2 + 58;
  drawFlower(context, centre - flank, 270, 46, .8, gold);
  drawFlower(context, centre + flank, 270, 46, .8, gold);

  context.fillStyle = cream;
  context.font = 'bold 36px Arial';
  tracked(context, 3, () => context.fillText(`${EVENT.title.toUpperCase()} ${EVENT.year}`, centre, 348));

  context.fillStyle = gold;
  context.font = '24px Arial';
  const count = PRIZES.filter(prize => state.results[prize.id]).length;
  context.fillText(`${EVENT.date}  |  ${state.mode === 'rehearsal' ? 'REHEARSAL - NOT EVENT RESULTS  |  ' : ''}${count} of 45 results confirmed`, centre, 394);
  context.restore();
}

// One result row, drawn relative to its column so the same design reflows into any column width.
function drawRow(context, prize, result, x, y, columnWidth, {ink, cream, gold}) {
  const tier = prizeTier(prize);
  const height = tier ? ROW_HEIGHT + TIER_ROW_BONUS : ROW_HEIGHT;
  const box = height - 7;
  const mid = y + box / 2;
  context.textAlign = 'left';
  context.fillStyle = tier ? TIER_PAPER[tier - 1] : cream;
  context.fillRect(x, y, columnWidth, box);
  if (tier) {
    context.strokeStyle = gold;
    context.lineWidth = 3;
    context.strokeRect(x + 1.5, y + 1.5, columnWidth - 3, box - 3);
    context.fillStyle = ink;
    context.beginPath();
    context.arc(x + 51, mid, 29, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = TIER_PAPER[tier - 1];
    context.textAlign = 'center';
    context.font = 'bold 30px Arial';
    context.fillText(String(prize.rank), x + 51, mid + 11);
    context.textAlign = 'left';
  } else {
    context.fillStyle = ink;
    context.font = 'bold 30px Arial';
    context.fillText(String(prize.rank).padStart(2, '0'), x + 27, mid + 10);
  }
  context.fillStyle = ink;
  const name = prize.category === 'books' ? 'Lucky book prize' : prize.name;
  const limit = columnWidth - 375;
  let size = tier ? 34 : 29;
  context.font = `${tier ? 'bold ' : ''}${size}px Arial`;
  while (context.measureText(name).width > limit && size > 17) context.font = `${tier ? 'bold ' : ''}${--size}px Arial`;
  context.fillText(name, x + 115, mid + size / 3);
  context.font = result ? `bold ${tier ? 58 : 46}px Arial` : '26px Arial';
  context.textAlign = 'right';
  context.fillText(result ? result.number : 'Not announced', x + columnWidth - 30, mid + (result ? (tier ? 20 : 16) : 9));
  context.textAlign = 'left';
  return height;
}

// The officials are credited across the foot of the sheet, mirroring the strip under the draw screen.
function drawWitnesses(context, left, right, top, {cream, gold}) {
  const centre = (left + right) / 2;
  context.save();
  context.textAlign = 'center';
  context.strokeStyle = gold;
  context.globalAlpha = .45;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(right, top);
  context.stroke();
  context.globalAlpha = 1;
  context.fillStyle = gold;
  context.font = '22px Arial';
  tracked(context, 6, () => context.fillText('DRAW HELD IN THE PRESENCE OF', centre, top + 40));

  const column = (right - left - WITNESS_GAP * (DRAW_WITNESSES.length - 1)) / DRAW_WITNESSES.length;
  DRAW_WITNESSES.forEach((person, index) => {
    const middle = left + index * (column + WITNESS_GAP) + column / 2;
    context.fillStyle = cream;
    context.font = 'bold 24px Arial';
    context.fillText(`${index + 1}.  ${person.name}`, middle, top + 88);
    context.fillStyle = gold;
    let size = 20;
    context.font = `${size}px Arial`;
    while (context.measureText(person.role).width > column && size > 12) context.font = `${--size}px Arial`;
    context.fillText(person.role, middle, top + 118);
  });
  context.restore();
}

function drawCollectionDetails(context, left, right, top, {cream, gold}) {
  const centre = (left + right) / 2;
  const width = right - left;
  const notice = 'Prizes must be collected strictly within 30 days from date of draw. Retain the original donation coupon for prize claims.';
  context.save();
  context.textAlign = 'center';
  context.strokeStyle = gold;
  context.lineWidth = 1;
  context.strokeRect(left, top, width, 52);
  context.fillStyle = gold;
  let noticeSize = 21;
  context.font = `bold ${noticeSize}px Arial`;
  while (context.measureText(notice).width > width - 36 && noticeSize > 14) {
    context.font = `bold ${--noticeSize}px Arial`;
  }
  context.fillText(notice, centre, top + 34);

  const column = (width - CONTACT_GAP * (MANDAL_PERSONNEL.length - 1)) / MANDAL_PERSONNEL.length;
  MANDAL_PERSONNEL.forEach((person, index) => {
    const middle = left + index * (column + CONTACT_GAP) + column / 2;
    const role = person.role.replace(/^Donation /, '');
    context.fillStyle = cream;
    let nameSize = 18;
    context.font = `bold ${nameSize}px Arial`;
    const name = `Shri. ${person.name}`;
    while (context.measureText(name).width > column && nameSize > 12) {
      context.font = `bold ${--nameSize}px Arial`;
    }
    context.fillText(name, middle, top + 91);
    context.fillStyle = gold;
    let roleSize = 15;
    context.font = `${roleSize}px Arial`;
    while (context.measureText(role).width > column && roleSize > 10) {
      context.font = `${--roleSize}px Arial`;
    }
    context.fillText(role.toUpperCase(), middle, top + 116);
    context.fillStyle = cream;
    context.font = '17px Arial';
    context.fillText(person.phone, middle, top + 142);
  });
  context.restore();
}

export async function exportResults(state, category = null) {
  validateState(state, state.mode);
  await document.fonts.ready;
  const groups = category ? GROUPS.filter(group => group.id === category) : GROUPS;
  if (!groups.length) throw new Error('Choose a valid results category.');
  const gold = '#ddbb72';
  const mark = await loadMark(GANESH_MARK).catch(() => null);
  const headerHeight = HEADER_HEIGHT + (mark ? CREST_SPACE : 0);
  const prizesOf = group => PRIZES.filter(prize => prize.category === group.id);
  const bodyHeight = group => prizesOf(group)
    .reduce((total, prize) => total + (prizeTier(prize) ? ROW_HEIGHT + TIER_ROW_BONUS : ROW_HEIGHT), 0);
  const blockWidth = groups.length * COLUMN_WIDTH + (groups.length - 1) * COLUMN_GAP;
  const width = Math.max(MIN_SHEET_WIDTH, SHEET_MARGIN * 2 + blockWidth);
  const blockLeft = Math.round((width - blockWidth) / 2);
  const columnsHeight = GROUP_HEADING + Math.max(...groups.map(bodyHeight));
  const witnessTop = headerHeight + columnsHeight + 46;
  const collectionTop = witnessTop + 160;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = collectionTop + 220;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not create a results image. Download a JSON backup instead.');
  const ink = '#491c1b';
  const cream = '#fff3dd';
  context.fillStyle = '#601b20';
  context.fillRect(0, 0, width, canvas.height);
  drawWeave(context, width, canvas.height, gold);
  drawFlower(context, width - 250, canvas.height - 190, 330, .08, gold);
  context.strokeStyle = gold;
  context.lineWidth = 2;
  context.strokeRect(35, 35, width - 70, canvas.height - 70);
  context.globalAlpha = .45;
  context.lineWidth = 1;
  context.strokeRect(48, 48, width - 96, canvas.height - 96);
  context.globalAlpha = 1;
  drawHeader(context, width, state, {cream, gold, mark});
  context.textAlign = 'left';
  groups.forEach((group, index) => {
    const x = blockLeft + index * (COLUMN_WIDTH + COLUMN_GAP);
    let y = headerHeight;
    context.fillStyle = gold;
    context.font = '38px Georgia';
    context.fillText(group.label, x + 10, y + 49);
    y += GROUP_HEADING;
    for (const prize of prizesOf(group)) {
      y += drawRow(context, prize, state.results[prize.id], x, y, COLUMN_WIDTH, {ink, cream, gold});
    }
  });
  drawWitnesses(context, blockLeft, blockLeft + blockWidth, witnessTop, {cream, gold});
  drawCollectionDetails(context, blockLeft, blockLeft + blockWidth, collectionTop, {cream, gold});
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed. Download a JSON backup and try again.')), 'image/png');
  });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadFile(blob, `sanvordem-2026-${state.mode}-${category || 'all-results'}-${stamp}.png`, 'image/png');
}
