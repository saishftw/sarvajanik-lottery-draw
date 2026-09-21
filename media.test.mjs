import assert from 'node:assert/strict';
import {stat, readFile} from 'node:fs/promises';
import test from 'node:test';
import {PRIZES} from './data.js';
import {VEHICLE_IMAGES, VEHICLE_SURFACES, VEHICLE_OVERVIEW_FRAMING, PREVIOUS_WINNERS, SPONSOR_PANELS, WELCOME_VIDEO} from './media.js';

test('all eighteen vehicle models reference supplied local images', async () => {
  const models = [...new Set(PRIZES.map(prize => prize.imageKey).filter(Boolean))];
  assert.equal(models.length, 18);
  assert.deepEqual(Object.keys(VEHICLE_IMAGES).sort(), [...models].sort());
  for (const model of models) {
    const source = VEHICLE_IMAGES[model];
    assert.match(source, /^vehicles\/[^/]+\.(avif|webp|png|jpe?g)$/i);
    assert.ok((await stat(new URL(source, import.meta.url))).isFile(), model);
  }
});

test('studio background overrides belong to known models and use opaque colours', () => {
  for (const [model, colour] of Object.entries(VEHICLE_SURFACES)) {
    assert.ok(VEHICLE_IMAGES[model]);
    assert.match(colour, /^#[a-f0-9]{6}$/i);
  }
});

test('overview framing windows stay within their source images', () => {
  for (const [model, {width, height, crop}] of Object.entries(VEHICLE_OVERVIEW_FRAMING)) {
    assert.ok(VEHICLE_IMAGES[model]);
    assert.equal(crop.length, 4);
    assert.ok([width, height, ...crop].every(Number.isInteger));
    const [x, y, cropWidth, cropHeight] = crop;
    assert.ok(x >= 0 && y >= 0 && cropWidth > 0 && cropHeight > 0);
    assert.ok(x + cropWidth <= width && y + cropHeight <= height);
  }
  const honda = VEHICLE_OVERVIEW_FRAMING['honda-elevate'];
  assert.ok(honda.crop[2] < honda.width * .85 && honda.crop[3] < honda.height * .65);
});

test('past-winner crops retain all twenty records inside the original poster', () => {
  assert.deepEqual(PREVIOUS_WINNERS.map(winner => winner.rank), Array.from({length: 20}, (_, index) => index + 1));
  for (const {crop: [x, y, width, height]} of PREVIOUS_WINNERS) {
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0);
    assert.ok(x + width <= 1280 && y + height <= 1024);
  }
});

test('readable sponsor groups remain inside the original coupon artwork', () => {
  assert.equal(SPONSOR_PANELS.length, 19);
  for (const {label, crop: [x, y, width, height]} of SPONSOR_PANELS) {
    assert.ok(label.length > 0 && x >= 0 && y >= 0 && width > 0 && height > 0);
    assert.ok(x + width <= 1600 && y + height <= 815);
  }
});

test('the supplied identity and transparent title crop are preserved as local PNG assets', async () => {
  for (const [name, width, height] of [['ganesh-title-source.png', 535, 645], ['ganesh-title.png', 535, 207]]) {
    const image = await readFile(new URL(`artwork/${name}`, import.meta.url));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.equal(image.readUInt32BE(16), width);
    assert.equal(image.readUInt32BE(20), height);
  }
});

test('the selected welcome loop exists in resources', async () => {
  assert.match(WELCOME_VIDEO, /^resources\/[^/]+\.mp4$/);
  const video = await stat(new URL(WELCOME_VIDEO, import.meta.url));
  assert.ok(video.isFile() && video.size > 0);
});

test('static and dynamically cropped artwork resolve after the resources move', async () => {
  const sources = new Set();
  const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/(?:src|href|data-image)="([^"]+\.(?:jpe?g|png|svg|avif|webp))"/g)) sources.add(match[1]);
  const app = await readFile(new URL('app.js', import.meta.url), 'utf8');
  for (const match of app.matchAll(/sourceCrop\('([^']+)'/g)) sources.add(match[1]);
  for (const name of ['styles.css', 'prizes.css', 'prize-treatment.css', 'all-vehicles.css', 'welcome.css']) {
    const css = await readFile(new URL(name, import.meta.url), 'utf8');
    for (const match of css.matchAll(/url\("([^"]+\.(?:jpe?g|png|svg|avif|webp))"\)/g)) sources.add(match[1]);
  }
  for (const path of ['resources/ganesh-01.jpeg', 'resources/coupon-front.jpeg', 'resources/coupon-back.jpeg', 'resources/hall-ad.jpeg', 'resources/previous-winners.jpeg']) {
    assert.ok(sources.has(path), `${path} is used by the presentation`);
  }
  for (const source of sources) {
    assert.ok((await stat(new URL(source, import.meta.url))).isFile(), source);
  }
});
