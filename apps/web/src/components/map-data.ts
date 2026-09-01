// Geometry for the MZANSI CITY navigation hub.
// Districts = CAPS subjects. Colours mirror the DB `subjects.color` values.

export interface District {
  id: string;
  name: string;
  short: string;
  color: string;
  points: string;
  cx: number;
  cy: number;
}

export const CITY_VIEWBOX = { w: 1600, h: 1000 };

export const DISTRICTS: District[] = [
  {
    id: "history",
    name: "History",
    short: "OLD TOWN",
    color: "#D4A373",
    points: "120,150 300,110 430,180 410,330 240,360 120,280",
    cx: 272,
    cy: 236,
  },
  {
    id: "physical-sciences",
    name: "Physical Sciences",
    short: "INDUSTRIAL NORTH",
    color: "#43D9FF",
    points: "480,80 750,60 830,150 800,310 600,340 480,250",
    cx: 652,
    cy: 196,
  },
  {
    id: "accounting",
    name: "Accounting",
    short: "FINANCIAL WEST",
    color: "#FFC24B",
    points: "130,420 370,390 440,500 400,650 210,670 110,550",
    cx: 271,
    cy: 528,
  },
  {
    id: "mathematics",
    name: "Mathematics",
    short: "DOWNTOWN CORE",
    color: "#A6FF3F",
    points: "500,390 730,360 870,440 850,620 650,680 490,600",
    cx: 673,
    cy: 512,
  },
  {
    id: "english",
    name: "English",
    short: "BROADCAST HILL",
    color: "#E2E8F0",
    points: "120,720 330,700 420,790 380,900 190,920 90,810",
    cx: 252,
    cy: 808,
  },
  {
    id: "business-studies",
    name: "Business Studies",
    short: "MIDTOWN",
    color: "#FF6B9D",
    points: "470,720 680,700 770,790 710,920 520,935 445,830",
    cx: 607,
    cy: 813,
  },
  {
    id: "life-sciences",
    name: "Life Sciences",
    short: "GREEN BELT",
    color: "#4ADE80",
    points: "910,230 1130,190 1250,260 1220,430 1030,470 905,370",
    cx: 1068,
    cy: 326,
  },
  {
    id: "economics",
    name: "Economics",
    short: "HARBOUR DOCKS",
    color: "#FF8A3D",
    points: "950,510 1140,530 1190,640 1090,740 950,700 895,595",
    cx: 1039,
    cy: 624,
  },
  {
    id: "geography",
    name: "Geography",
    short: "SOUTH PENINSULA",
    color: "#2DD4BF",
    points: "770,855 970,795 1080,865 1045,965 850,985 755,925",
    cx: 912,
    cy: 884,
  },
  {
    id: "cat-it",
    name: "CAT & IT",
    short: "TECH ISLAND",
    color: "#22D3EE",
    points: "1230,640 1330,610 1420,670 1400,760 1290,785 1205,725",
    cx: 1310,
    cy: 697,
  },
];

/** Coastline / bay water body (bottom-right). */
export const WATER_POINTS =
  "1600,380 1600,1000 600,1000 760,880 950,780 1150,690 1320,560 1460,460";

export interface Road {
  from: [number, number];
  to: [number, number];
}

export const ROADS: Road[] = [
  { from: [272, 236], to: [652, 196] },
  { from: [652, 196], to: [673, 512] },
  { from: [272, 236], to: [271, 528] },
  { from: [271, 528], to: [673, 512] },
  { from: [673, 512], to: [1068, 326] },
  { from: [673, 512], to: [1039, 624] },
  { from: [1039, 624], to: [1285, 668] },
  { from: [673, 512], to: [607, 813] },
  { from: [252, 808], to: [607, 813] },
  { from: [607, 813], to: [912, 884] },
  { from: [1039, 624], to: [912, 884] },
];

export interface MapMarker {
  id: string;
  href: string;
  label: string;
  x: number;
  y: number;
  glyph: "crown" | "bolt" | "bag" | "upload";
  color: string;
}

export const MARKERS: MapMarker[] = [
  { id: "rank", href: "/leaderboard", label: "RANK UP", x: 673, y: 452, glyph: "crown", color: "#FFC24B" },
  { id: "daily", href: "/challenges", label: "DAILY HEISTS", x: 607, y: 762, glyph: "bolt", color: "#A6FF3F" },
  { id: "shop", href: "/shop", label: "AMMU-NOTES SHOP", x: 1039, y: 574, glyph: "bag", color: "#FF6B9D" },
  { id: "uploads", href: "/upload", label: "DROP ZONE", x: 652, y: 148, glyph: "upload", color: "#43D9FF" },
];
