// Keep source filenames intact. A null entry still supports an intentional placeholder.
export const VEHICLE_IMAGES = {
  'bmw-ix1': 'vehicles/bmw-ix1.avif',
  'audi-a4': 'vehicles/audi-a4.avif',
  'innova-hycross': 'vehicles/toyota-Innova HyCross GX-7S.jpeg',
  'mg-windsor': 'vehicles/MG Windsor EV Essence 38 kWh.avif',
  'skoda-kushaq': 'vehicles/koda Kushaq Signature MT.avif',
  'tata-sierra': 'vehicles/Tata Sierra Pure Petrol.webp',
  'mahindra-thar': 'vehicles/Mahindra Thar LXT DMT.avif',
  'honda-elevate': 'vehicles/Honda Elevate VX MT.jpg',
  'suzuki-victoris': 'vehicles/Maruti Suzuki Victoris VXI.avif',
  'renault-duster': 'vehicles/Renault Duster Evolution MT.avif',
  'skoda-kylaq': 'vehicles/\u0160koda Kylaq Classic 1.0 TSI.webp',
  'suzuki-fronx': 'vehicles/Maruti Suzuki Fronx ISS Delta 1.2L AGS ESP.jpeg',
  'suzuki-dzire': 'vehicles/Maruti Suzuki Dzire VXI.webp',
  'hyundai-nios': 'vehicles/Hyundai Grand i10 NIOS Sportz AMT.jpg',
  'renault-kiger': 'vehicles/Renault Kiger RXL AMT.png',
  'vespa-s125': 'vehicles/Vespa S125 CBS BSVI.avif',
  'vida-vx2': 'vehicles/VIDA VX2 Plus electric scooter.webp',
  'hero-destini': 'vehicles/Hero Destini 11.jpg',
};

// These studio images have grey, rather than white, backgrounds.
export const VEHICLE_SURFACES = {
  'audi-a4': '#e0e0e2',
  'suzuki-victoris': '#e0e0e2',
  'renault-duster': '#e0e0e2',
  'vespa-s125': '#dbdbdb',
};

// Source-pixel windows used by All vehicles and the draw screen. Originals and spotlight framing stay unchanged.
export const VEHICLE_OVERVIEW_FRAMING = {
  'bmw-ix1': {width: 1056, height: 594, crop: [23, 50, 989, 503]},
  'audi-a4': {width: 930, height: 620, crop: [0, 98, 930, 463]},
  'innova-hycross': {width: 925, height: 724, crop: [37, 101, 819, 523]},
  'mg-windsor': {width: 642, height: 361, crop: [32, 15, 610, 346]},
  'skoda-kushaq': {width: 1920, height: 1080, crop: [119, 110, 1693, 861]},
  'mahindra-thar': {width: 1280, height: 720, crop: [84, 19, 1123, 662]},
  'honda-elevate': {width: 930, height: 620, crop: [126, 149, 697, 345]},
  'suzuki-victoris': {width: 930, height: 620, crop: [0, 31, 930, 589]},
  'renault-duster': {width: 930, height: 620, crop: [0, 71, 930, 525]},
  'skoda-kylaq': {width: 1200, height: 900, crop: [3, 136, 1197, 663]},
  'suzuki-fronx': {width: 925, height: 724, crop: [0, 139, 884, 499]},
  'suzuki-dzire': {width: 925, height: 724, crop: [18, 138, 891, 448]},
  'hyundai-nios': {width: 736, height: 1104, crop: [9, 340, 702, 410]},
  'vespa-s125': {width: 1280, height: 720, crop: [176, 0, 921, 720]},
  'hero-destini': {width: 2560, height: 1706, crop: [602, 0, 1780, 1706]},
};

// Set to null to use only the full-screen poster fallback.
// Welcome keeps its title and event details over this background video.
// welcome.css crops the selected source's 72px top/bottom bars without changing the MP4.
export const WELCOME_VIDEO = 'resources/ganesh-video-01.mp4';

// Crops preserve the supplied 2025 record, including names, without retranscription.
export const PREVIOUS_WINNERS = [
  ...Array.from({length: 7}, (_, index) => ({rank: index + 1, crop: [18, 143 + index * 125, 410, 117]})),
  ...Array.from({length: 7}, (_, index) => ({rank: index + 8, crop: [433, 143 + index * 125, 408, 117]})),
  ...Array.from({length: 6}, (_, index) => ({rank: index + 15, crop: [848, 268 + index * 125, 410, 117]})),
];

// One supporter per panel. Supporters who supplied original artwork use it; the rest stay
// cut on the red rules printed on the coupon back until their own artwork arrives.
// `caption` carries the printed name below panels whose photograph has no lettering of its own,
// `printed` repeats the lines printed beside a logo, and a panel with only a `title` sets the
// coupon's lettering in type rather than enlarging a soft crop of it. A lettering-only panel may
// also carry a `mark`: a silhouette cropped from supplied artwork and recoloured to the title's ink.
const COUPON_BACK = {source: 'resources/coupon-back.jpeg', width: 1600, height: 815};

export const SPONSOR_PANELS = [
  {label: 'Shri Deepak Prabhu Pauskar', source: 'resources/supporters/deepak-pauskar.jpeg', width: 1066, height: 1600, crop: [60, 40, 950, 1210], caption: ['Shri Deepak Prabhu Pauskar', 'Ex PWD Minister, Government of Goa \u00b7 Ex MLA, Sanvordem constituency']},
  {label: 'Jubilant MotorWorks', source: 'resources/supporters/jubilant-motorworks.jpeg', width: 554, height: 554, crop: [60, 110, 435, 335]},
  {label: 'Emporium Automobiles', source: 'resources/supporters/emporium-skoda.jpeg', width: 3594, height: 778, crop: [0, 0, 3594, 778]},
  {label: 'Landmark MG Goa', source: 'resources/supporters/landmark-mg-goa.png', width: 1600, height: 1142, crop: [90, 180, 1400, 780], printed: ['Call: 9022901940']},
  {label: 'Sharayu Toyota', source: 'resources/supporters/sharayu-toyota.jpeg', width: 1050, height: 750, crop: [0, 0, 1050, 750]},
  {label: 'Tata', source: 'resources/supporters/tata-logo.webp', width: 915, height: 915, crop: [44, 137, 828, 646]},
  {label: 'Shri Sanket Arsekar', source: 'resources/supporters/sanket-arsekar.jpeg', width: 1246, height: 891, crop: [0, 0, 1246, 891]},
  {label: 'Goa Hyundai', source: 'resources/supporters/goa-hyundai.jpeg', width: 1600, height: 1135, crop: [10, 140, 1580, 960]},
  {label: 'Pristine Renault', source: 'resources/supporters/pristine-renault.jpeg', width: 1280, height: 306, crop: [0, 0, 1280, 306]},
  {label: 'Hero', source: 'resources/supporters/hero-logo.png', width: 3840, height: 2160, crop: [200, 620, 3480, 1090]},
  {label: 'Honda', source: 'resources/supporters/honda-logo.png', width: 1280, height: 861, crop: [0, 0, 1280, 861], printed: ['The Power of Dreams']},
  {label: 'Shri Rupesh Ramnath Dessai', source: 'resources/supporters/rupesh-dessai.jpeg', width: 1280, height: 960, crop: [240, 0, 820, 960], caption: ['Shri Rupesh Ramnath Dessai', 'Zilla Panchayat, Dharbandora']},
  {label: 'Amonkar Caterers', source: 'resources/supporters/amonkar-caterers.jpeg', width: 1280, height: 854, crop: [0, 0, 1280, 854]},
  {label: 'GLCS', source: 'resources/supporters/glcs.jpeg', width: 1440, height: 657, crop: [0, 50, 1420, 570]},
  {label: 'Bandekar Offset', ...COUPON_BACK, crop: [697, 349, 205, 148]},
  {label: 'Raj Housing', source: 'resources/supporters/raj-housing.jpeg', width: 1280, height: 867, crop: [10, 60, 1265, 722]},
  {label: 'Rajesh Kudalkar', title: 'Rajesh Kudalkar', titleColour: '#a33421'},
  // The supplied sheet repeats the mark in six colours; the green one matches the printed coupon.
  {label: 'Sandy Toes', source: 'resources/supporters/sandy-toes-sheet.jpeg', width: 1600, height: 646, crop: [467, 44, 466, 200], printed: ['Gogol, Margao - Goa.', '9960272676']},
  {label: 'Sai Opticians, Panaji', title: 'SAI OPTICIANS', titleColour: '#12489b', mark: {source: 'resources/supporters/sai-opticians-glasses.webp', width: 525, height: 350, crop: [68, 116, 392, 134]}, printed: ['Panaji - Goa.', '9822310722 / 9423307676']},
  {label: 'A7 Graphics', source: 'resources/supporters/a7-graphics.jpeg', width: 1600, height: 800, crop: [0, 0, 1600, 800]},
  {label: 'Yes Bank', source: 'resources/supporters/yes-bank.webp', width: 3840, height: 1434, crop: [0, 0, 3840, 1434], printed: ['Official Banking Partner']},
];
