import {EVENT, GROUPS, PRIZES} from './data.js';
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
const CREST_SPACE = 150;
const GANESH_MARK = 'artwork/ganesh-icon.png';
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

async function tintedMark(source, colour) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const mark = document.createElement('canvas');
  mark.width = image.naturalWidth;
  mark.height = image.naturalHeight;
  const context = mark.getContext('2d');
  context.drawImage(image, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = colour;
  context.fillRect(0, 0, mark.width, mark.height);
  return mark;
}

function drawHeader(context, width, state, {cream, gold, mark}) {
  context.textAlign = 'center';
  const centre = width / 2;
  context.save();
  if (mark) {
    const size = 150;
    context.drawImage(mark, centre - size / 2, 62, size, size);
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

export async function exportResults(state, category = null) {
  validateState(state, state.mode);
  await document.fonts.ready;
  const groups = category ? GROUPS.filter(group => group.id === category) : GROUPS;
  if (!groups.length) throw new Error('Choose a valid results category.');
  const width = 1800;
  const rowHeight = 90;
  const groupHeight = 110 + 15 * rowHeight;
  const gold = '#ddbb72';
  const mark = await tintedMark(GANESH_MARK, gold).catch(() => null);
  const headerHeight = HEADER_HEIGHT + (mark ? CREST_SPACE : 0);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = headerHeight + groups.length * groupHeight + groups.filter(group => group.id === 'cars').length * 3 * TIER_ROW_BONUS + 120;
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
  let y = headerHeight;
  context.textAlign = 'left';
  for (const group of groups) {
    context.fillStyle = gold;
    context.font = '38px Georgia';
    context.fillText(group.label, 85, y + 49);
    y += 95;
    const prizes = PRIZES.filter(prize => prize.category === group.id);
    for (const prize of prizes) {
      const result = state.results[prize.id];
      const tier = prizeTier(prize);
      const height = tier ? rowHeight + TIER_ROW_BONUS : rowHeight;
      const box = height - 7;
      const mid = y + box / 2;
      context.fillStyle = tier ? TIER_PAPER[tier - 1] : cream;
      context.fillRect(75, y, width - 150, box);
      if (tier) {
        context.strokeStyle = gold;
        context.lineWidth = 3;
        context.strokeRect(76.5, y + 1.5, width - 153, box - 3);
        context.fillStyle = ink;
        context.beginPath();
        context.arc(126, mid, 29, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = TIER_PAPER[tier - 1];
        context.textAlign = 'center';
        context.font = 'bold 30px Arial';
        context.fillText(String(prize.rank), 126, mid + 11);
        context.textAlign = 'left';
      } else {
        context.fillStyle = ink;
        context.font = 'bold 30px Arial';
        context.fillText(String(prize.rank).padStart(2, '0'), 102, mid + 10);
      }
      context.fillStyle = ink;
      const name = prize.category === 'books' ? 'Lucky book prize' : prize.name;
      let size = tier ? 34 : 29;
      context.font = `${tier ? 'bold ' : ''}${size}px Arial`;
      while (context.measureText(name).width > 910 && size > 17) context.font = `${tier ? 'bold ' : ''}${--size}px Arial`;
      context.fillText(name, 190, mid + size / 3);
      context.font = result ? `bold ${tier ? 58 : 46}px Arial` : '26px Arial';
      context.textAlign = 'right';
      context.fillText(result ? result.number : 'Not announced', width - 105, mid + (result ? (tier ? 20 : 16) : 9));
      context.textAlign = 'left';
      y += height;
    }
    y += 15;
  }
  context.font = '21px Arial';
  context.fillStyle = cream;
  context.fillText('Confirmed numbers only. Retain the original donation coupon for prize claims.', 85, y + 39);
  context.fillStyle = gold;
  context.font = '19px Arial';
  context.fillText(`Snapshot: ${new Date().toLocaleString('en-IN')}  |  Record revision ${state.revision}`, 85, y + 75);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed. Download a JSON backup and try again.')), 'image/png');
  });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadFile(blob, `sanvordem-2026-${state.mode}-${category || 'all-results'}-${stamp}.png`, 'image/png');
}
