import { COUPON_FORMAT, EVENT, prizeById } from './data.js';

const STATE_KEYS = ['version', 'eventId', 'mode', 'revision', 'updatedAt', 'results', 'drafts', 'settings'];
const LEGACY_SETTINGS_KEYS = ['autoSubmit', 'bookDigits', 'bookMin', 'bookMax', 'bookFormatConfirmed'];
const CURRENT_SETTINGS_KEYS = ['autoSubmit'];
const RESULT_KEYS = ['number', 'confirmedAt', 'updatedAt', 'history'];
const HISTORY_KEYS = ['number', 'changedAt'];
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const COUPON_MIN_TEXT = String(COUPON_FORMAT.min).padStart(COUPON_FORMAT.digits, '0');
const COUPON_MAX_TEXT = String(COUPON_FORMAT.max).padStart(COUPON_FORMAT.digits, '0');

export class DrawError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DrawError';
  }
}

function fail(message) {
  throw new DrawError(message);
}

function requireMode(mode) {
  if (mode !== 'event' && mode !== 'rehearsal') {
    fail('Draw mode must be "event" or "rehearsal".');
  }
}

function requireRecord(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object.`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${label} must be a plain object without inherited data.`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor || !hasOwn(descriptor, 'value')) {
      fail(`${label} must contain only string-keyed data properties.`);
    }
  }
}

function requireKeys(value, keys, label, partial = false) {
  requireRecord(value, label);
  for (const key of Reflect.ownKeys(value)) {
    if (!keys.includes(key)) {
      fail(`${label} contains an unsupported field: "${key}".`);
    }
  }
  if (!partial) {
    for (const key of keys) {
      if (!hasOwn(value, key)) {
        fail(`${label} is missing "${key}".`);
      }
    }
  }
}

function requireTimestamp(value, label) {
  const match = typeof value === 'string'
    ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value)
    : null;
  if (!match || match[0] !== value) {
    fail(`${label} must be a valid ISO date and time, including a timezone.`);
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zoneHour, zoneMinute] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const timestamp = Date.parse(value);
  if (
    month < 1 || month > 12 || Number(dayText) < 1 || Number(dayText) > monthDays[month - 1]
    || Number(hourText) > 23 || Number(minuteText) > 59 || Number(secondText) > 59
    || (zoneHour !== undefined && (Number(zoneHour) > 23 || Number(zoneMinute) > 59))
    || !Number.isFinite(timestamp)
  ) {
    fail(`${label} must be a real, valid ISO date and time.`);
  }
  return timestamp;
}

function requireDraft(value, label) {
  if (typeof value !== 'string' || value.length > COUPON_FORMAT.digits || /[^0-9]/.test(value)) {
    fail(`${label} must be a string of up to ${COUPON_FORMAT.digits} digits (0–9); leading zeros are preserved.`);
  }
}

function requireCouponNumber(value, label, legacyBook = false) {
  const failCoupon = (reason) => {
    if (legacyBook) {
      fail(`Older book results need correction using an exported backup; ${label} ${reason}`);
    }
    fail(`${label} ${reason}`);
  };
  if (typeof value !== 'string' || value.length !== COUPON_FORMAT.digits || /[^0-9]/.test(value)) {
    failCoupon(`must be a string of exactly ${COUPON_FORMAT.digits} digits (0–9), including leading zeros.`);
  }
  const numericValue = Number(value);
  if (!Number.isSafeInteger(numericValue) || numericValue < COUPON_FORMAT.min || numericValue > COUPON_FORMAT.max) {
    failCoupon(`must be between ${COUPON_MIN_TEXT} and ${COUPON_MAX_TEXT}.`);
  }
}

function validateSettings(settings, version) {
  if (version === 1) {
    requireKeys(settings, LEGACY_SETTINGS_KEYS, 'Settings');
    if (typeof settings.autoSubmit !== 'boolean' || typeof settings.bookFormatConfirmed !== 'boolean') {
      fail('Auto-submit and book-format confirmation settings must be true or false.');
    }
    if (!Number.isInteger(settings.bookDigits) || settings.bookDigits < 1 || settings.bookDigits > 16) {
      fail('Book digits must be a whole number from 1 to 16.');
    }
    if (
      !Number.isSafeInteger(settings.bookMin) || !Number.isSafeInteger(settings.bookMax)
      || settings.bookMin < 0 || settings.bookMax < settings.bookMin
    ) {
      fail('Book minimum and maximum must be non-negative safe integers, minimum ≤ maximum.');
    }
    return { autoSubmit: settings.autoSubmit };
  }
  requireKeys(settings, CURRENT_SETTINGS_KEYS, 'Settings');
  if (typeof settings.autoSubmit !== 'boolean') {
    fail('Auto-submit setting must be true or false.');
  }
  return { autoSubmit: settings.autoSubmit };
}

function validateResult(result, prize, version) {
  const label = `Result for ${prize.id}`;
  requireKeys(result, RESULT_KEYS, label);
  const legacyBook = version === 1 && prize.category === 'books';
  requireCouponNumber(result.number, label, legacyBook);
  const confirmedTime = requireTimestamp(result.confirmedAt, `${label} confirmation time`);
  const updatedTime = requireTimestamp(result.updatedAt, `${label} update time`);
  if (updatedTime < confirmedTime) {
    fail(`${label} cannot be updated before it was confirmed.`);
  }
  if (
    !Array.isArray(result.history) || Object.getPrototypeOf(result.history) !== Array.prototype
    || Reflect.ownKeys(result.history).length !== result.history.length + 1
  ) {
    fail(`${label} history must be an ordinary array without extra fields or missing entries.`);
  }
  let previousTime = confirmedTime;
  let previousNumber = null;
  const history = [];
  for (let index = 0; index < result.history.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(result.history, String(index));
    if (!descriptor || !hasOwn(descriptor, 'value')) {
      fail(`${label} history must not contain missing entries or accessors.`);
    }
    const entry = descriptor.value;
    const entryLabel = `${label} history entry ${index + 1}`;
    requireKeys(entry, HISTORY_KEYS, entryLabel);
    requireCouponNumber(entry.number, entryLabel, legacyBook);
    const changedTime = requireTimestamp(entry.changedAt, `${entryLabel} change time`);
    if (changedTime < previousTime || changedTime > updatedTime) {
      fail(`${label} correction history must be chronological, between confirmation and the latest update.`);
    }
    if (entry.number === previousNumber) {
      fail(`${label} history contains a correction that did not change the number.`);
    }
    history.push({ number: entry.number, changedAt: entry.changedAt });
    previousTime = changedTime;
    previousNumber = entry.number;
  }
  if (previousTime !== updatedTime || previousNumber === result.number) {
    fail(`${label} update time and number must agree with its correction history.`);
  }
  return {
    number: result.number,
    confirmedAt: result.confirmedAt,
    updatedAt: result.updatedAt,
    history,
  };
}

function normalizeState(input) {
  requireKeys(input, STATE_KEYS, 'Draw state');
  const version = input.version;
  if (version !== 1 && version !== 2) {
    fail('Unsupported draw state version; this display supports version 1 and 2 records only.');
  }
  if (input.eventId !== EVENT.id) {
    fail('This draw state belongs to a different event.');
  }
  requireMode(input.mode);
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) {
    fail('Draw revision must be a non-negative safe integer.');
  }
  if (input.updatedAt !== null) {
    requireTimestamp(input.updatedAt, 'Draw update time');
  }
  const settings = validateSettings(input.settings, version);
  requireRecord(input.results, 'Results');
  requireRecord(input.drafts, 'Drafts');
  const results = {};
  const drafts = {};
  for (const id of Reflect.ownKeys(input.results)) {
    const prize = prizeById(id);
    results[id] = validateResult(input.results[id], prize, version);
  }
  for (const id of Reflect.ownKeys(input.drafts)) {
    const prize = prizeById(id);
    requireDraft(input.drafts[id], `Draft for ${id}`);
    drafts[id] = input.drafts[id];
  }
  return {
    version: 2,
    eventId: EVENT.id,
    mode: input.mode,
    revision: input.revision,
    updatedAt: input.updatedAt,
    results,
    drafts,
    settings,
  };
}

export function storageKey(mode) {
  requireMode(mode);
  return `sarvajanik-lottery:${EVENT.id}:${mode}`;
}

export function createState(mode) {
  requireMode(mode);
  return {
    version: 2,
    eventId: EVENT.id,
    mode,
    revision: 0,
    updatedAt: null,
    results: {},
    drafts: {},
    settings: {
      autoSubmit: false,
    },
  };
}

export function validateState(input, expectedMode) {
  if (expectedMode !== undefined) requireMode(expectedMode);
  const state = normalizeState(input);
  if (expectedMode !== undefined && state.mode !== expectedMode) {
    fail(`Draw mode mismatch: expected ${expectedMode}, received ${state.mode}. Event and rehearsal data must stay separate.`);
  }
  return state;
}

function errorDetail(error) {
  return error instanceof Error ? error.message : 'an unknown storage or data error occurred';
}

function readStoredText(storage, mode) {
  const key = storageKey(mode);
  let text;
  try {
    text = storage.getItem(key);
  } catch (error) {
    fail(`Unable to read ${mode} draw storage: ${errorDetail(error)}. Saved data has not been reset.`);
  }
  if (text !== null && typeof text !== 'string') {
    fail(`The ${mode} draw storage returned invalid data instead of a string. Saved data has not been reset.`);
  }
  return text;
}

function readStoredState(storage, mode) {
  const text = readStoredText(storage, mode);
  if (text === null) return null;
  try {
    return validateState(JSON.parse(text), mode);
  } catch (error) {
    fail(`Saved ${mode} draw data is invalid: ${errorDetail(error)} Saved data has not been reset; restore a verified backup.`);
  }
}

export function loadState(storage, mode) {
  return readStoredState(storage, mode) ?? createState(mode);
}

export function saveState(storage, next, expectedRevision) {
  const state = validateState(next);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    fail('Expected revision must be a non-negative safe integer.');
  }
  if (state.revision !== expectedRevision) {
    fail('Revision conflict: this state does not match the expected revision. Reload the saved draw before retrying.');
  }
  if (expectedRevision === Number.MAX_SAFE_INTEGER) {
    fail('The draw revision limit has been reached. Export a backup before continuing.');
  }
  const current = readStoredState(storage, state.mode);
  if (
    (current === null && expectedRevision !== 0)
    || (current !== null && current.revision !== expectedRevision)
  ) {
    fail('Revision conflict: the saved draw changed or was removed in another tab. Reload before saving; no data was overwritten.');
  }
  const saved = {
    ...state,
    revision: expectedRevision + 1,
    updatedAt: new Date().toISOString(),
  };
  try {
    storage.setItem(storageKey(state.mode), JSON.stringify(saved));
  } catch (error) {
    fail(`Unable to save ${state.mode} draw: ${errorDetail(error)}. Keep this page open and export a backup before leaving.`);
  }
  return saved;
}

// Only call after the operator's typed reset confirmation and raw backup download.
export function recoverState(storage, mode, expectedRaw) {
  const saved = validateState({
    ...createState(mode),
    revision: 1,
    updatedAt: new Date().toISOString(),
  }, mode);
  if (typeof expectedRaw !== 'string') {
    fail('Recovery requires the exact saved raw text that was backed up before reset.');
  }
  const text = JSON.stringify(saved);
  if (readStoredText(storage, mode) !== expectedRaw) {
    fail('Recovery conflict: the saved draw changed or was removed after the backup. Reload and back up the current data before retrying; no data was overwritten.');
  }
  try {
    storage.setItem(storageKey(mode), text);
  } catch (error) {
    fail(`Unable to recover ${mode} draw: ${errorDetail(error)}. Keep the raw backup and retry; recovery was not confirmed saved.`);
  }
  return saved;
}

export function updateDraft(state, id, value) {
  const next = validateState(state);
  prizeById(id);
  requireDraft(value, `Draft for ${id}`);
  next.drafts[id] = value;
  return next;
}

function findDuplicates(state, number) {
  return Object.keys(state.results)
    .filter((id) => state.results[id].number === number)
    .map(prizeById);
}

export function getDuplicates(state, id, number) {
  const safe = validateState(state);
  prizeById(id);
  requireDraft(number, `Number for ${id}`);
  return findDuplicates(safe, number).filter((prize) => prize.id !== id);
}

export function commitResult(state, id, number, options = {}) {
  const next = validateState(state);
  prizeById(id);
  requireKeys(options, ['allowDuplicate', 'correction', 'now'], 'Confirmation options', true);
  const allowDuplicate = hasOwn(options, 'allowDuplicate') ? options.allowDuplicate : false;
  const correction = hasOwn(options, 'correction') ? options.correction : false;
  const now = hasOwn(options, 'now') ? options.now : new Date().toISOString();
  if (typeof allowDuplicate !== 'boolean' || typeof correction !== 'boolean') {
    fail('Duplicate permission and correction permission must be explicitly true or false.');
  }
  requireCouponNumber(number, `Number for ${id}`);
  const nowTime = requireTimestamp(now, 'Confirmation time');
  const previous = next.results[id];
  if (previous && !correction) {
    fail('This prize already has a confirmed result. Use explicit correction to change it and retain its history.');
  }
  if (!previous && correction) {
    fail('There is no confirmed result to correct for this prize. Confirm it as a new result instead.');
  }
  if (previous && previous.number === number) {
    fail('The corrected number is unchanged. Enter a different number or cancel the correction.');
  }
  if (previous && nowTime < Date.parse(previous.updatedAt)) {
    fail('Correction time cannot precede the previous update. Check the device clock before continuing.');
  }
  const duplicates = findDuplicates(next, number).filter((other) => other.id !== id);
  if (duplicates.length && !allowDuplicate) {
    fail(`Duplicate number: already confirmed for ${duplicates.map((item) => item.id).join(', ')}. Explicitly allow this duplicate to continue.`);
  }
  next.results[id] = {
    number,
    confirmedAt: previous ? previous.confirmedAt : now,
    updatedAt: now,
    history: previous ? [...previous.history, { number: previous.number, changedAt: now }] : [],
  };
  delete next.drafts[id];
  return next;
}

export function updateSettings(state, patch) {
  const next = validateState(state);
  requireKeys(patch, CURRENT_SETTINGS_KEYS, 'Settings patch', true);
  const settings = { ...next.settings };
  for (const key of Reflect.ownKeys(patch)) settings[key] = patch[key];
  try {
    return validateState({ ...next, settings });
  } catch (error) {
    fail(`Settings were not changed: ${errorDetail(error)}`);
  }
}

export function parseBackup(text, mode) {
  requireMode(mode);
  if (typeof text !== 'string') fail('A JSON backup must be supplied as text.');
  try {
    return validateState(JSON.parse(text), mode);
  } catch (error) {
    fail(`Invalid backup: ${errorDetail(error)}`);
  }
}

export function serializeBackup(state) {
  return JSON.stringify(validateState(state), null, 2);
}
