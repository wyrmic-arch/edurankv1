// Geometry for the MZANSI CITY navigation hub — kept for compatibility but
// the visual map is now ASCII. Districts are placed on a fixed character
// grid; each subject gets a short 2-3 char code that becomes its glyph on
// the map (e.g. "Mathematics" -> "MT").

export interface District {
  id: string;
  name: string;
  short: string;
  code: string; // 2-3 char glyph used on the ASCII map
  color: string; // hex — used for hairline borders/labels, not glow
}

export const CITY_VIEWBOX = { w: 1600, h: 1000 };

// Bounding box on a 100x50 character grid.
interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const DISTRICTS: (District & Bounds)[] = [
  { id: "history",          name: "History",          short: "Old Town",         code: "HI", color: "#A07A4F", x0:  4, y0:  2, x1: 22, y1: 11 },
  { id: "physical-sciences", name: "Physical Sciences", short: "Industrial North", code: "PS", color: "#3D5A80", x0: 26, y0:  2, x1: 48, y1: 11 },
  { id: "accounting",        name: "Accounting",       short: "Financial West",   code: "AC", color: "#B58A2E", x0:  4, y0: 14, x1: 22, y1: 23 },
  { id: "mathematics",       name: "Mathematics",      short: "Downtown Core",    code: "MT", color: "#0A0A0A", x0: 26, y0: 14, x1: 48, y1: 23 },
  { id: "english",           name: "English",          short: "Broadcast Hill",   code: "EN", color: "#5C5C5C", x0:  4, y0: 26, x1: 22, y1: 35 },
  { id: "business-studies",  name: "Business Studies", short: "Midtown",          code: "BS", color: "#A85A6E", x0: 26, y0: 26, x1: 48, y1: 35 },
  { id: "life-sciences",     name: "Life Sciences",    short: "Green Belt",       code: "LS", color: "#4A6B3A", x0: 52, y0:  6, x1: 72, y1: 16 },
  { id: "economics",         name: "Economics",        short: "Harbour Docks",    code: "EC", color: "#C25A1F", x0: 52, y0: 19, x1: 72, y1: 28 },
  { id: "geography",         name: "Geography",        short: "South Peninsula",  code: "GG", color: "#1F7561", x0: 38, y0: 36, x1: 58, y1: 45 },
  { id: "cat-it",            name: "CAT & IT",         short: "Tech Island",      code: "IT", color: "#1F6B7A", x0: 74, y0: 22, x1: 92, y1: 31 },
];

// Roads drawn between district centres as ascii lines (start, end on grid).
export interface Road {
  from: [number, number];
  to: [number, number];
}

export const ROADS: Road[] = [
  { from: [13,  6], to: [37,  6]  },
  { from: [37,  6], to: [37, 18]  },
  { from: [13,  6], to: [13, 18]  },
  { from: [13, 18], to: [37, 18]  },
  { from: [37, 18], to: [62, 11]  },
  { from: [37, 18], to: [62, 23]  },
  { from: [62, 23], to: [83, 26]  },
  { from: [37, 30], to: [62, 23]  },
  { from: [13, 30], to: [37, 30]  },
  { from: [37, 30], to: [48, 40]  },
  { from: [62, 23], to: [48, 40]  },
];

export interface MapMarker {
  id: string;
  href: string;
  label: string;
  x: number;
  y: number;
  glyph: string;
}

export const MARKERS: MapMarker[] = [
  { id: "rank",    href: "/leaderboard", label: "RANK UP",      x: 37, y: 16, glyph: "[#]" },
  { id: "daily",   href: "/challenges",  label: "DAILY HEISTS", x: 37, y: 28, glyph: "[!]" },
  { id: "shop",    href: "/shop",        label: "AMMU-NOTES",   x: 62, y: 21, glyph: "[$]" },
  { id: "uploads", href: "/upload",      label: "DROP ZONE",    x: 37, y:  4, glyph: "[+]" },
];

// Character grid for the ASCII map. 100 cols x 50 rows. Each row is a string
// of exactly 100 chars. Empty string '' = transparent / pad. Special keys:
//   '+' = road corner / junction, '-' = horizontal road, '|' = vertical road
//   'X' = coast (water), '.' = open ground, '#' = block of buildings
//   District codes ('HI', 'PS', ...) render inside their bounds.
const ROAD_CHARS = new Set(["-", "|", "+", "/", "\\"]);

function buildAsciiMap(): string[] {
  const rows: string[][] = Array.from({ length: 50 }, () => Array(100).fill(""));

  const get = (y: number, x: number): string | undefined => rows[y]?.[x];
  const set = (y: number, x: number, v: string): void => {
    if (y >= 0 && y < 50 && x >= 0 && x < 100) rows[y]![x] = v;
  };

  // Coast — bottom right curve, matches original geometry approximately.
  const coast: Array<[number, number]> = [
    [60, 49], [65, 48], [70, 47], [75, 46], [80, 45], [85, 43], [88, 40], [91, 36],
    [93, 32], [95, 27], [96, 22], [97, 16], [98, 10], [99, 4],
  ];
  coast.forEach(([x, y]) => set(y, x, "X"));

  // soft water to the right + bottom of the coast line.
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 100; x++) {
      if (get(y, x) === "X") continue;
      if (x > 95) set(y, x, ".");
      if (y > 47) set(y, x, ".");
    }
  }

  // Roads
  for (const r of ROADS) {
    const [x0, y0] = r.from;
    const [x1, y1] = r.to;
    if (x0 === x1) {
      const step = y1 > y0 ? 1 : -1;
      for (let y = y0; y !== y1 + step; y += step) {
        if (get(y, x0) === "") set(y, x0, "|");
      }
    } else if (y0 === y1) {
      const step = x1 > x0 ? 1 : -1;
      for (let x = x0; x !== x1 + step; x += step) {
        if (get(y0, x) === "") set(y0, x, "-");
      }
    } else {
      let x = x0, y = y0;
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
      const dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      while (true) {
        if (get(y, x) === "") set(y, x, dx > dy ? "-" : "|");
        if (x === x1 && y === y1) break;
        const e2 = err * 2;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
    }
  }
  // Road crossings → '+'
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 100; x++) {
      const c = get(y, x);
      if (c === "-" || c === "|") {
        const neighbours = [get(y - 1, x), get(y + 1, x), get(y, x - 1), get(y, x + 1)];
        if (neighbours.some((n) => ROAD_CHARS.has(n ?? ""))) set(y, x, "+");
      }
    }
  }

  // Districts — borders + centred code label + count placeholder.
  for (const d of DISTRICTS) {
    const cy = Math.floor((d.y0 + d.y1) / 2);
    for (let x = d.x0; x <= d.x1; x++) {
      if (get(d.y0, x) === "" || get(d.y0, x) === ".") set(d.y0, x, "_");
      if (get(d.y1, x) === "" || get(d.y1, x) === ".") set(d.y1, x, "_");
    }
    for (let y = d.y0; y <= d.y1; y++) {
      if (get(y, d.x0) === "" || get(y, d.x0) === ".") set(y, d.x0, "|");
      if (get(y, d.x1) === "" || get(y, d.x1) === ".") set(y, d.x1, "|");
    }
    const inner = d.x1 - d.x0 - 1;
    const code = d.code.padEnd(inner).slice(0, inner);
    for (let i = 0; i < code.length; i++) set(cy - 1, d.x0 + 1 + i, code[i]!);
    const countRow = ` ${String(0).padStart(2, "0")} NOTES `;
    for (let i = 0; i < countRow.length && d.x0 + 1 + i <= d.x1 - 1; i++) {
      set(cy + 1, d.x0 + 1 + i, countRow[i]!);
    }
  }

  // Marker glyphs
  for (const m of MARKERS) set(m.y, m.x, m.glyph);

  return rows.map((r) => r.join(""));
}

export const ASCII_MAP = buildAsciiMap();

export function districtById(id: string): District | undefined {
  return DISTRICTS.find((d) => d.id === id);
}

export function districtCentroid(d: District & Bounds): [number, number] {
  return [Math.floor((d.x0 + d.x1) / 2), Math.floor((d.y0 + d.y1) / 2)];
}