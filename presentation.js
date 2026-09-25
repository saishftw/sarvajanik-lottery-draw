export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
export const money = value => `\u20b9 ${value.toLocaleString('en-IN')}`;
export const ordinal = value => `${value}${value % 100 >= 11 && value % 100 <= 13 ? 'th' : ({1: 'st', 2: 'nd', 3: 'rd'}[value % 10] || 'th')}`;
export const monogram = name => {
  const words = String(name).trim().split(/\s+/).filter(word => !/^[A-Za-z]\.$/.test(word));
  return `${words[0]?.[0] ?? ''}${words.length > 1 ? words[words.length - 1][0] : ''}`.toUpperCase();
};
export const prizeLabel = prize => prize.category === 'books' ? `Book prize ${prize.rank}` : `${ordinal(prize.rank)} prize`;
export const prizeTier = prize => prize.category !== 'books' && prize.rank <= 3 ? prize.rank : 0;

export function prizeMarker(prize, group = false) {
  const tier = prizeTier(prize);
  const range = group && prize.category === 'scooters';
  const text = range ? `${prize.rank}\u2013${prize.rank + 4}`
    : group && prize.category === 'books' ? '15'
      : prize.category === 'books' ? String(prize.rank).padStart(2, '0') : ordinal(prize.rank);
  const description = range ? `Prizes ${prize.rank} to ${prize.rank + 4}`
    : group && prize.category === 'books' ? '15 book prizes' : prizeLabel(prize);
  return `<span class="prize-marker ${tier ? 'prize-medallion' : 'prize-tab'}" data-tier="${tier}" role="img" aria-label="${escapeHtml(description)}"><span class="prize-marker-value" aria-hidden="true">${escapeHtml(text)}</span></span>`;
}

export const prizeCash = (prize, group = false) => `${prize.category === 'books' ? '' : '+ '}${money(prize.amount)}${group && prize.category !== 'cars' ? ' each' : ''}`;

export function prizeCaption(prize, group = false) {
  const name = prize.category === 'books' ? `Book prize ${prize.rank}` : prize.shortName;
  return `<span class="prize-caption"><span class="prize-caption-name">${escapeHtml(name)}</span><span class="prize-caption-amount">${escapeHtml(prizeCash(prize, group))}</span></span>`;
}
