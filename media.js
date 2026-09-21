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

// One supporter per panel, cut on the red rules printed on the coupon back.
export const SPONSOR_PANELS = [
  {label: 'Shri Deepak Prabhu Pauskar', crop: [70, 46, 205, 147]},
  {label: 'Jubilant MotorWorks', crop: [279, 46, 206, 147]},
  {label: 'Emporium Automobiles', crop: [489, 46, 413, 147]},
  {label: 'Landmark MG Goa', crop: [906, 46, 205, 147]},
  {label: 'Sharayu Toyota', crop: [1115, 46, 205, 147]},
  {label: 'Tata', crop: [1324, 46, 205, 147]},
  {label: 'Shri Sanket Arsekar', crop: [70, 197, 205, 148]},
  {label: 'Goa Hyundai', crop: [279, 197, 206, 148]},
  {label: 'Pristine Renault', crop: [489, 197, 622, 148]},
  {label: 'Hero', crop: [1115, 197, 205, 148]},
  {label: 'Honda', crop: [1324, 197, 205, 148]},
  {label: 'Shri Rupesh Ramnath Dessai', crop: [70, 349, 205, 148]},
  {label: 'Amonkar Caterers', crop: [279, 349, 205, 148]},
  {label: 'GLCS', crop: [488, 349, 205, 148]},
  {label: 'Bandekar Offset', crop: [697, 349, 205, 148]},
  {label: 'Raj Housing', crop: [906, 349, 205, 148]},
  {label: 'Rajesh Kudalkar', crop: [1115, 349, 205, 148]},
  {label: 'Sandy Toes', crop: [1324, 349, 205, 148]},
  {label: 'Sai Opticians, Panaji', crop: [1115, 501, 414, 106]},
];
