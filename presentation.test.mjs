import assert from 'node:assert/strict';
import test from 'node:test';
import {prizeById} from './data.js';
import {escapeHtml, ordinal, prizeTier, prizeMarker, prizeCaption} from './presentation.js';

test('only the first three main prizes receive premium markers', () => {
  assert.equal(prizeTier(prizeById('prize-01')), 1);
  assert.equal(prizeTier(prizeById('prize-02')), 2);
  assert.equal(prizeTier(prizeById('prize-03')), 3);
  assert.equal(prizeTier(prizeById('prize-04')), 0);
  assert.equal(prizeTier(prizeById('book-01')), 0);
  assert.match(prizeMarker(prizeById('prize-01')), /prize-medallion/);
  assert.match(prizeMarker(prizeById('prize-04')), /prize-tab/);
});

test('markers distinguish individual prizes from five-scooter groups', () => {
  const scooter = prizeById('prize-16');
  assert.match(prizeMarker(scooter), /16th/);
  assert.match(prizeMarker(scooter, true), /16\u201320/);
  assert.match(prizeMarker(scooter, true), /Prizes 16 to 20/);
  assert.match(prizeMarker(prizeById('book-01'), true), /15 book prizes/);
  assert.equal(ordinal(11), '11th');
  assert.equal(ordinal(12), '12th');
  assert.equal(ordinal(13), '13th');
  assert.equal(ordinal(21), '21st');
});

test('captions carry the prize name only, without the printed cash component', () => {
  assert.doesNotMatch(prizeCaption(prizeById('prize-01')), /20,46,415/);
  assert.doesNotMatch(prizeCaption(prizeById('prize-16')), /58,345/);
  assert.doesNotMatch(prizeCaption(prizeById('book-01')), /10,000/);
  assert.match(prizeCaption(prizeById('prize-01')), /BMW iX1/);
});

test('shared captions escape text and distinguish book entries', () => {
  assert.equal(escapeHtml('<"&\'>'), '&lt;&quot;&amp;&#39;&gt;');
  assert.match(prizeCaption(prizeById('book-03')), /Book prize 3/);
  const unsafe = {...prizeById('prize-01'), shortName: '<img src=x onerror=alert(1)>'};
  assert.doesNotMatch(prizeCaption(unsafe), /<img/);
  assert.match(prizeCaption(unsafe), /&lt;img/);
});
