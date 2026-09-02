// Geometry for the EDURANK school map — a stylised map of South Africa.
// School coordinates are projected (equirectangular) onto the same 800x900
// viewBox as the country outline, so every dot lands in the right place.

import type { School } from "@/lib/api";

export type { School };

export const MAP_W = 800;
export const MAP_H = 900;

// Bounding box of South Africa (approx), used for the projection.
const LAT_MIN = -34.83;
const LAT_MAX = -22.09;
const LNG_MIN = 16.34;
const LNG_MAX = 32.83;

export function project(lat: number, lng: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return [x, y];
}

// South Africa outline (simplified, from world.geo.json). Two rings:
// the mainland and a small enclave; render together with even-odd fill.
export const SA_OUTLINE = [
  "M 736.5 506.3 L 727.0 516.5 L 706.5 552.4 L 692.9 588.7 L 665.4 639.3 L 610.6 712.2 L 576.3 754.6 L 539.7 786.8 L 489.0 814.2 L 464.3 817.8 L 458.0 837.5 L 428.5 827.0 L 404.5 840.5 L 351.9 826.8 L 322.5 835.5 L 302.4 831.8 L 252.4 859.7 L 211.0 870.8 L 181.0 897.5 L 159.0 899.2 L 138.4 874.0 L 122.0 872.8 L 101.1 841.2 L 98.8 851.0 L 92.4 832.0 L 92.7 790.6 L 76.9 743.3 L 92.6 730.4 L 91.3 676.2 L 59.5 610.1 L 35.1 550.2 L 35.1 550.0 L 0.2 458.2 L 23.5 423.3 L 42.6 442.6 L 50.8 472.9 L 72.6 478.0 L 103.1 491.4 L 129.2 486.2 L 172.5 450.1 L 172.5 189.2 L 185.6 199.8 L 214.4 266.9 L 209.9 309.9 L 220.7 334.7 L 255.5 327.5 L 279.7 296.0 L 302.7 274.8 L 314.6 240.9 L 338.2 224.6 L 358.7 233.1 L 381.9 252.9 L 421.4 256.4 L 452.4 240.0 L 457.3 217.9 L 465.8 184.1 L 492.2 178.5 L 506.8 151.9 L 523.0 104.9 L 566.5 52.1 L 635.2 0.1 L 654.9 0.9 L 678.4 12.8 L 694.7 4.3 L 720.5 11.4 L 743.7 110.8 L 756.4 161.0 L 747.7 239.8 L 751.9 265.1 L 727.4 252.2 L 713.4 257.2 L 708.8 277.8 L 695.5 304.3 L 696.0 328.8 L 724.9 367.1 L 753.3 359.4 L 763.2 328.1 L 800.0 328.6 L 787.9 380.1 L 782.2 438.8 L 769.6 470.7 L 736.5 506.3 Z",
  "M 613.1 485.0 L 592.0 463.2 L 569.3 477.7 L 543.0 505.3 L 517.1 550.0 L 553.5 604.4 L 570.9 597.3 L 579.8 574.8 L 606.8 563.7 L 615.1 540.7 L 630.0 506.3 L 613.1 485.0 Z",
];

// Province centre points (projected) for optional province labels/legend.
export const PROVINCES: { name: string; lat: number; lng: number }[] = [
  { name: "Gauteng", lat: -26.2, lng: 28.2 },
  { name: "KwaZulu-Natal", lat: -29.3, lng: 30.5 },
  { name: "Western Cape", lat: -33.5, lng: 21.0 },
  { name: "Eastern Cape", lat: -32.5, lng: 26.5 },
  { name: "Free State", lat: -28.7, lng: 26.5 },
  { name: "Limpopo", lat: -23.9, lng: 29.5 },
  { name: "Mpumalanga", lat: -25.5, lng: 30.5 },
  { name: "Northern Cape", lat: -29.5, lng: 23.0 },
  { name: "North West", lat: -26.0, lng: 25.5 },
];

export function schoolPos(s: School): [number, number] | null {
  if (s.lat == null || s.lng == null) return null;
  return project(s.lat, s.lng);
}
