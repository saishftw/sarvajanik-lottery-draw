export const EVENT = Object.freeze({
  id: 'sanvordem-2026',
  name: 'Sarvajanik Ganeshotsav Mandal',
  location: 'Sanvordem, Goa',
  title: 'Mahaprasad Pavti Coupons Draw',
  date: '25 September 2026',
  year: 2026,
  established: 1978,
  celebrationYear: 49,
});

export const GROUPS = Object.freeze([
  Object.freeze({ id: 'cars', label: 'Car prizes' }),
  Object.freeze({ id: 'scooters', label: 'Scooter prizes' }),
  Object.freeze({ id: 'books', label: 'Lucky book prizes' }),
]);

const cars = [
  ['BMW iX1 eDrive 20L', 'BMW iX1', 2046415, 'bmw-ix1'],
  ['Audi A4 40 TFSI Premium Plus', 'Audi A4', 1931000, 'audi-a4'],
  ['Toyota Innova HyCross GX-7S', 'Toyota Innova HyCross', 980434, 'innova-hycross'],
  ['MG Windsor EV Essence 38kWh', 'MG Windsor EV', 643239, 'mg-windsor'],
  ['Skoda Kushaq Signature MT', 'Skoda Kushaq', 704010, 'skoda-kushaq'],
  ['Tata Sierra Pure Petrol', 'Tata Sierra', 628298, 'tata-sierra'],
  ['Mahindra Thar LXT DMT', 'Mahindra Thar', 626584, 'mahindra-thar'],
  ['Honda Elevate VX MT', 'Honda Elevate', 596143, 'honda-elevate'],
  ['Suzuki Victoris VXI', 'Suzuki Victoris', 580532, 'suzuki-victoris'],
  ['Renault Duster Evolution MT', 'Renault Duster', 574612, 'renault-duster'],
  ['Skoda Kylaq Classic 1.0 TSI', 'Skoda Kylaq', 372184, 'skoda-kylaq'],
  ['Suzuki Fronx ISS Delta 1.2L AGS ESP', 'Suzuki Fronx', 368102, 'suzuki-fronx'],
  ['Suzuki Dzire VXI', 'Suzuki Dzire', 321071, 'suzuki-dzire'],
  ['Hyundai i10 NIOS Sportz AMT', 'Hyundai i10 NIOS', 320530, 'hyundai-nios'],
  ['Renault Kiger RXL AMT', 'Renault Kiger', 318715, 'renault-kiger'],
];

const scooters = [
  ['Vespa S125 CBS BSVI (ROUND)', 'Vespa S125', 58345, 'vespa-s125'],
  ['VIDA VX2 Plus (EV Scooter)', 'VIDA VX2 Plus', 46176, 'vida-vx2'],
  ['Hero Destini 110', 'Hero Destini 110', 39615, 'hero-destini'],
].flatMap((model) => Array.from({ length: 5 }, () => model));

export const PRIZES = Object.freeze([
  ...[...cars, ...scooters].map(([name, shortName, amount, imageKey], index) => ({
    id: `prize-${String(index + 1).padStart(2, '0')}`,
    rank: index + 1,
    category: index < cars.length ? 'cars' : 'scooters',
    name,
    shortName,
    amount,
    imageKey,
  })),
  ...Array.from({ length: 15 }, (_, index) => ({
    id: `book-${String(index + 1).padStart(2, '0')}`,
    rank: index + 1,
    category: 'books',
    name: 'Lucky book prize',
    shortName: 'Lucky book prize',
    amount: 10000,
    imageKey: null,
  })),
].map(Object.freeze));

export const COUPON_FORMAT = Object.freeze({
  digits: 6,
  min: 0,
  max: 119999,
  total: 120000,
});

export const DRAW_ORDER = Object.freeze([
  ...PRIZES.filter((prize) => prize.category === 'books').reverse(),
  ...PRIZES.filter((prize) => prize.category !== 'books').reverse(),
]);

export const MANDAL_PERSONNEL = Object.freeze([
  Object.freeze({ name: 'Vasudev Vithal Sahakari', role: 'President', phone: '9850484293' }),
  Object.freeze({ name: 'Shirish M. Naik', role: 'Secretary', phone: '9604665213' }),
  Object.freeze({ name: 'Narayan V. Salgaonkar', role: 'Treasurer', phone: '9823078313' }),
  Object.freeze({
    name: 'Sudin Pratap Kakodkar',
    role: 'Donation Coupon In-charge',
    phone: '9423307876',
  }),
  Object.freeze({
    name: 'Ratish D. Naik',
    role: 'Donation Coupon Receipt In-charge',
    phone: '7775808559',
  }),
]);

// Read out and printed on the results sheet as the official record of who witnessed the draw.
export const DRAW_WITNESSES = Object.freeze([
  Object.freeze({ name: 'Shri. Viraj Malkarni', role: 'Mamlatdar, Sanguem - Goa' }),
  Object.freeze({
    name: 'Shri. Nilesh Rane',
    role: 'Deputy Superintendent of Police, Canacona - Goa',
  }),
  Object.freeze({
    name: 'Shri. Devidas Borkar',
    role: 'Executive Engineer, DDW Fatorda, Margao - Goa',
  }),
  Object.freeze({
    name: 'Shri. Yatin Naik',
    role: 'Assistant Engineer, Sub Div. 2 Ward 22 PWD Fatorda, Margao - Goa',
  }),
  Object.freeze({
    name: 'Mrs. Manisha Upadhya',
    role: 'Principal, CTN Higher Secondary School, Curchorem - Goa',
  }),
]);

const prizesById = new Map(PRIZES.map((prize) => [prize.id, prize]));

export function prizeById(id) {
  const prize = prizesById.get(id);
  if (!prize) {
    throw new Error(typeof id === 'string' ? `Unknown prize ID: "${id}".` : 'Prize ID must be a string.');
  }
  return prize;
}
