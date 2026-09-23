import test from 'node:test';
import assert from 'node:assert/strict';
import { COUPON_FORMAT, DRAW_ORDER, EVENT, GROUPS, MANDAL_PERSONNEL, PRIZES, prizeById } from './data.js';
import {
  DrawError,
  storageKey,
  createState,
  validateState,
  loadState,
  saveState,
  recoverState,
  updateDraft,
  getDuplicates,
  commitResult,
  updateSettings,
  parseBackup,
  serializeBackup,
} from './state.js';

const T1 = '2026-09-25T10:00:00.000Z';
const T2 = '2026-09-25T10:01:00.000Z';
const T3 = '2026-09-25T10:02:00.000Z';

function memoryStorage() {
  const entries = new Map();
  return {
    entries,
    writes: 0,
    readError: null,
    writeError: null,
    getItem(key) {
      if (this.readError) throw this.readError;
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      if (this.writeError) throw this.writeError;
      this.writes += 1;
      entries.set(key, value);
    },
  };
}

function confirm(state, id = 'prize-01', number = '000001', options = {}) {
  return commitResult(state, id, number, { now: T1, ...options });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function legacyState({
  number = '000001',
  history = [],
  mode = 'event',
  revision = 4,
  updatedAt = T1,
  draft = '000001',
} = {}) {
  return {
    version: 1,
    eventId: EVENT.id,
    mode,
    revision,
    updatedAt,
    results: {
      'book-01': {
        number,
        confirmedAt: T1,
        updatedAt: T1,
        history,
      },
    },
    drafts: {
      'prize-01': draft,
    },
    settings: {
      autoSubmit: false,
      bookDigits: 5,
      bookMin: 0,
      bookMax: 99999,
      bookFormatConfirmed: false,
    },
  };
}

test('catalog exports the confirmed event data, personnel, coupon format, and draw order', () => {
  assert.deepEqual(EVENT, {
    id: 'sanvordem-2026',
    name: 'Sarvajanik Ganeshotsav Mandal',
    location: 'Sanvordem, Goa',
    title: 'Mahaprasad Pavti Coupons Draw',
    date: '25 September 2026',
    year: 2026,
    established: 1978,
    celebrationYear: 49,
  });
  assert.deepEqual(GROUPS.map(({ id }) => id), ['cars', 'scooters', 'books']);
  assert.deepEqual(COUPON_FORMAT, { digits: 6, min: 0, max: 119999, total: 120000 });
  assert.deepEqual(MANDAL_PERSONNEL, [
    { name: 'Vasudev Vithal Sahakari', role: 'President', phone: '9850484293' },
    { name: 'Shirish M. Naik', role: 'Secretary', phone: '9604665213' },
    { name: 'Narayan V. Salgaonkar', role: 'Treasurer', phone: '9823078313' },
    { name: 'Sudin Pratap Kakodkar', role: 'Donation Coupon In-charge', phone: '9423307876' },
    { name: 'Ratish D. Naik', role: 'Donation Coupon Receipt In-charge', phone: '7775808559' },
  ]);
  assert.equal(PRIZES.length, 45);
  assert.equal(new Set(PRIZES.map(({ id }) => id)).size, 45);
  assert.deepEqual(
    DRAW_ORDER.map(({ id }) => id),
    [
      'book-15', 'book-14', 'book-13', 'book-12', 'book-11',
      'book-10', 'book-09', 'book-08', 'book-07', 'book-06',
      'book-05', 'book-04', 'book-03', 'book-02', 'book-01',
      'prize-30', 'prize-29', 'prize-28', 'prize-27', 'prize-26',
      'prize-25', 'prize-24', 'prize-23', 'prize-22', 'prize-21',
      'prize-20', 'prize-19', 'prize-18', 'prize-17', 'prize-16',
      'prize-15', 'prize-14', 'prize-13', 'prize-12', 'prize-11',
      'prize-10', 'prize-09', 'prize-08', 'prize-07', 'prize-06',
      'prize-05', 'prize-04', 'prize-03', 'prize-02', 'prize-01',
    ],
  );
  assert.equal(DRAW_ORDER.at(-1).name, 'BMW iX1 eDrive 20L');
  for (const id of ['prize-00', 'book-16', '__proto__', 'constructor', 1, null]) {
    assert.throws(() => prizeById(id));
  }
  assert.throws(() => { PRIZES[0].name = 'changed'; }, TypeError);
});

test('new states start at version 2 with only auto-submit settings and independent copies', () => {
  const event = createState('event');
  assert.deepEqual(event, {
    version: 2,
    eventId: EVENT.id,
    mode: 'event',
    revision: 0,
    updatedAt: null,
    results: {},
    drafts: {},
    settings: { autoSubmit: false },
  });
  const other = createState('event');
  event.settings.autoSubmit = true;
  event.drafts['prize-01'] = '000';
  assert.equal(other.settings.autoSubmit, false);
  assert.deepEqual(other.drafts, {});
  assert.notEqual(storageKey('event'), storageKey('rehearsal'));
  assert.throws(() => createState('live'), DrawError);
  assert.throws(() => storageKey('live'), DrawError);
});

test('coupon numbers accept the full shared range and preserve leading zeros', () => {
  const storage = memoryStorage();
  let state = confirm(createState('event'), 'prize-01', '000000');
  state = confirm(state, 'book-01', '119999', { allowDuplicate: true });
  state = updateDraft(state, 'book-02', '000001');
  const saved = saveState(storage, state, 0);
  assert.equal(saved.results['prize-01'].number, '000000');
  assert.equal(saved.results['book-01'].number, '119999');
  assert.equal(saved.drafts['book-02'], '000001');
  assert.deepEqual(loadState(storage, 'event'), saved);
  assert.deepEqual(parseBackup(serializeBackup(saved), 'event'), saved);
  assert.equal(storage.writes, 1);
});

test('draft updates stay partial, preserve other entries, and reject invalid shapes', () => {
  const original = createState('event');
  let state = updateDraft(original, 'prize-01', '000');
  state = updateDraft(state, 'book-01', '001');
  state = updateDraft(state, 'prize-02', '');
  assert.deepEqual(state.drafts, {
    'prize-01': '000',
    'book-01': '001',
    'prize-02': '',
  });
  assert.deepEqual(original.drafts, {});
  state = confirm(state, 'prize-01', '000001');
  assert.equal(Object.hasOwn(state.drafts, 'prize-01'), false);
  assert.equal(state.drafts['book-01'], '001');
  for (const value of ['0000000', '0x1', '0 1', '00000\n', 123, null]) {
    assert.throws(() => updateDraft(state, 'prize-03', value));
  }
  assert.throws(() => updateDraft(state, '__proto__', '1'));
  assert.equal(updateDraft(state, 'prize-04', '999999').drafts['prize-04'], '999999');
});

test('updateSettings only accepts autoSubmit and preserves current results', () => {
  const state = confirm(createState('event'), 'prize-01', '000001');
  const updated = updateSettings(state, { autoSubmit: true });
  assert.equal(updated.settings.autoSubmit, true);
  assert.equal(state.settings.autoSubmit, false);
  assert.deepEqual(updated.results, state.results);
  for (const patch of [
    null,
    [],
    'settings',
    { unknown: true },
    { bookDigits: 5 },
    { bookMin: 0 },
    { bookMax: 119999 },
    { bookFormatConfirmed: true },
    { autoSubmit: 'true' },
    { autoSubmit: 1 },
  ]) {
    assert.throws(() => updateSettings(state, patch));
  }
});

test('duplicates warn across all prizes and explicit override still works', () => {
  let state = confirm(createState('event'), 'prize-01', '000001');
  assert.deepEqual(getDuplicates(state, 'book-01', '000001'), [prizeById('prize-01')]);
  assert.throws(() => confirm(state, 'book-01', '000001'), /Duplicate number/);
  state = confirm(state, 'book-01', '000001', { allowDuplicate: true });
  assert.deepEqual(
    getDuplicates(state, 'prize-16', '000001').map(({ id }) => id),
    ['prize-01', 'book-01'],
  );
  assert.deepEqual(
    getDuplicates(state, 'book-01', '000001').map(({ id }) => id),
    ['prize-01'],
  );
});

test('corrections keep history and still require duplicate permission', () => {
  let state = confirm(createState('event'), 'prize-01', '000001');
  state = confirm(state, 'prize-02', '000002');
  assert.throws(
    () => confirm(state, 'prize-02', '000001', { correction: true, now: T2 }),
    /Duplicate number/,
  );
  const corrected = confirm(state, 'prize-02', '000001', {
    correction: true,
    allowDuplicate: true,
    now: T2,
  });
  assert.deepEqual(corrected.results['prize-02'], {
    number: '000001',
    confirmedAt: T1,
    updatedAt: T2,
    history: [{ number: '000002', changedAt: T2 }],
  });
  const again = confirm(corrected, 'prize-02', '000003', { correction: true, now: T3 });
  assert.deepEqual(again.results['prize-02'].history, [
    { number: '000002', changedAt: T2 },
    { number: '000001', changedAt: T3 },
  ]);
  assert.equal(Object.hasOwn(corrected.drafts, 'prize-02'), false);
  assert.throws(() => confirm(again, 'prize-02', '000004', { correction: true, now: T2 }), /cannot precede/);
});

test('validation returns a deep independent copy of current records', () => {
  const original = confirm(confirm(createState('event'), 'prize-01', '000001'), 'prize-01', '000002', {
    correction: true,
    now: T2,
  });
  original.drafts['book-01'] = '000';
  const normalized = validateState(original);
  assert.deepEqual(normalized, original);
  normalized.settings.autoSubmit = true;
  normalized.results['prize-01'].history[0].number = '000003';
  normalized.results['prize-01'].number = '000004';
  normalized.drafts['book-01'] = '001';
  assert.equal(original.settings.autoSubmit, false);
  assert.equal(original.results['prize-01'].history[0].number, '000001');
  assert.equal(original.results['prize-01'].number, '000002');
  assert.equal(original.drafts['book-01'], '000');
});

test('current backups round-trip and legacy backups upgrade to version 2 without writes', () => {
  const storage = memoryStorage();
  const legacy = legacyState();
  storage.entries.set(storageKey('event'), JSON.stringify(legacy));
  const loaded = loadState(storage, 'event');
  assert.equal(storage.writes, 0);
  assert.deepEqual(storage.entries.get(storageKey('event')), JSON.stringify(legacy));
  assert.deepEqual(loaded, {
    version: 2,
    eventId: EVENT.id,
    mode: 'event',
    revision: 4,
    updatedAt: T1,
    results: {
      'book-01': {
        number: '000001',
        confirmedAt: T1,
        updatedAt: T1,
        history: [],
      },
    },
    drafts: {
      'prize-01': '000001',
    },
    settings: { autoSubmit: false },
  });
  const saved = saveState(storage, updateSettings(loaded, { autoSubmit: true }), 4);
  assert.equal(saved.version, 2);
  assert.equal(saved.settings.autoSubmit, true);
  assert.equal(storage.writes, 1);
  assert.deepEqual(parseBackup(JSON.stringify(legacy), 'event'), loaded);
  assert.deepEqual(parseBackup(serializeBackup(saved), 'event'), saved);
});

test('legacy confirmed book results and history entries must already be six-digit coupons', () => {
  for (const bad of [legacyState({ number: '00001' }), legacyState({ history: [{ number: '00001', changedAt: T1 }] })]) {
    assert.throws(() => validateState(bad), /Older book results need correction using an exported backup/);
    assert.throws(() => parseBackup(JSON.stringify(bad), 'event'), /Older book results need correction using an exported backup/);
  }
  const validLegacy = legacyState({ number: '119999', history: [{ number: '000001', changedAt: T1 }] });
  const upgraded = validateState(validLegacy);
  assert.equal(upgraded.version, 2);
  assert.equal(upgraded.results['book-01'].number, '119999');
  assert.deepEqual(upgraded.results['book-01'].history, [{ number: '000001', changedAt: T1 }]);
});

test('backups reject malformed input, wrong mode, and prototype pollution without mutating globals', () => {
  const state = confirm(confirm(createState('event'), 'prize-01', '000001'), 'prize-01', '000002', {
    correction: true,
    now: T2,
  });
  assert.deepEqual(parseBackup(serializeBackup(state), 'event'), state);
  assert.throws(() => parseBackup(serializeBackup(state), 'rehearsal'), /mode mismatch/);
  assert.throws(() => parseBackup('not json', 'event'), /Invalid backup/);
  assert.throws(() => parseBackup({ ...state }, 'event'), /as text/);
  assert.throws(
    () => parseBackup(JSON.stringify({ ...createState('event'), version: 99 }), 'event'),
    /Unsupported draw state version/,
  );
  const polluted = clone(createState('event'));
  Object.defineProperty(polluted, '__proto__', {
    value: { polluted: true },
    enumerable: true,
  });
  assert.throws(() => validateState(polluted), /unsupported field/);
  assert.throws(() => parseBackup(JSON.stringify(polluted), 'event'), /unsupported field/);
  const inherited = Object.create(state);
  assert.throws(() => validateState(inherited), /inherited data/);
  let reads = 0;
  const accessor = clone(state);
  Object.defineProperty(accessor, 'mode', {
    get() {
      reads += 1;
      return 'event';
    },
  });
  assert.throws(() => validateState(accessor), /data properties/);
  assert.equal(reads, 0);
  assert.equal(Object.prototype.polluted, undefined);
});

test('persistence keeps exact revisions and rejects conflicts without rewriting state', () => {
  const storage = memoryStorage();
  const initial = saveState(storage, confirm(createState('event')), 0);
  const duplicate = loadState(storage, 'event');
  assert.deepEqual(duplicate, initial);
  assert.equal(storage.writes, 1);
  const next = saveState(storage, updateSettings(initial, { autoSubmit: true }), 1);
  assert.equal(next.revision, 2);
  assert.throws(() => saveState(storage, initial, 0), /Revision conflict/);
  storage.entries.delete(storageKey('event'));
  assert.throws(() => saveState(storage, next, 2), /Revision conflict/);
  assert.equal(storage.writes, 2);
});

test('recovery uses the exact raw text and never removes the old record first', () => {
  const storage = memoryStorage();
  const raw = '{broken legacy record';
  storage.entries.set(storageKey('event'), raw);
  storage.removeItem = () => assert.fail('Recovery must never remove the existing record first.');
  const rehearsal = saveState(storage, confirm(createState('rehearsal')), 0);
  const writesBefore = storage.writes;
  assert.throws(() => recoverState(storage, 'event', `${raw} `), /Recovery conflict/);
  assert.equal(storage.entries.get(storageKey('event')), raw);
  const recovered = recoverState(storage, 'event', raw);
  assert.equal(recovered.version, 2);
  assert.equal(recovered.revision, 1);
  assert.equal(storage.writes, writesBefore + 1);
  assert.deepEqual(loadState(storage, 'rehearsal'), rehearsal);
  assert.deepEqual(loadState(storage, 'event'), recovered);
});

test('immutable failures leave caller objects and stored data unchanged', () => {
  const storage = memoryStorage();
  const saved = saveState(storage, confirm(createState('event')), 0);
  const pending = confirm(saved, 'prize-01', '000002', { correction: true, now: T2 });
  const savedSnapshot = clone(saved);
  const pendingSnapshot = clone(pending);
  const text = storage.entries.get(storageKey('event'));
  storage.writeError = new Error('QuotaExceededError: storage is full');
  assert.throws(() => saveState(storage, pending, 1), /Unable to save.*QuotaExceededError/);
  assert.deepEqual(saved, savedSnapshot);
  assert.deepEqual(pending, pendingSnapshot);
  assert.equal(storage.entries.get(storageKey('event')), text);
  assert.equal(storage.writes, 1);
  storage.writeError = null;
  const retried = saveState(storage, pending, 1);
  assert.equal(retried.revision, 2);
  assert.equal(retried.results['prize-01'].number, '000002');
  assert.equal(storage.writes, 2);
});
