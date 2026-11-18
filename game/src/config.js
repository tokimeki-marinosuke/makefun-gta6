export const CITY = 'ASTER TIDE';
export const DEFAULT_SEED = 1;
export const VIEW = { width: 960, height: 540 };
export const CITY_GRID = { columns: 7, rows: 5, beach: 134, sea: 240 };
export const streetX = [0, 240, 490, 740, 1025, 1265, 1510, 1755];
export const streetY = [0, 275, 535, 795, 1040, 1295];
export const streetWidthsX = streetX.map(() => 54);
export const streetWidthsY = [54, 54, 88, 54, 54, 54];
export const boulevardRow = 2;
export const cityWidth = streetX.at(-1);
export const cityEnd = streetY.at(-1) + streetWidthsY.at(-1) / 2;

export function isBoulevard(row, x) {
  return row === boulevardRow && x >= streetX[1] && x <= streetX[6];
}

export function horizontalWidth(row, x) {
  return row === boulevardRow && !isBoulevard(row, x) ? streetWidthsY[0] : streetWidthsY[row];
}

export function blockRect(column, row) {
  const x = streetX[column] + streetWidthsX[column] / 2;
  const right = streetX[column + 1] - streetWidthsX[column + 1] / 2;
  const midpoint = (x + right) / 2;
  const y = streetY[row] + horizontalWidth(row, midpoint) / 2;
  const bottom = streetY[row + 1] - horizontalWidth(row + 1, midpoint) / 2;
  return { x, y, width: right - x, depth: bottom - y };
}

// Vertical segments are identified by their column and northern row.
export const removedSegments = [{ column: 1, row: 0 }, { column: 3, row: 0 }];
export const mergedBlocks = [
  { columns: [0, 1], row: 0, kind: 'buildings' },
  { columns: [2, 3], row: 0, kind: 'plaza' },
];
export const spur = {
  column: 1,
  row: 2,
  x: streetX[1],
  y: (streetY[2] + streetY[3]) / 2,
  endX: 410,
  width: 38,
  radius: 34,
};

export function hasVerticalSegment(column, row) {
  return row >= 0 && row < CITY_GRID.rows &&
    !removedSegments.some((segment) => segment.column === column && segment.row === row);
}

export function spurContains(x, y) {
  return (x >= spur.x && x <= spur.endX && Math.abs(y - spur.y) <= spur.width / 2) ||
    Math.hypot(x - spur.endX, y - spur.y) <= spur.radius;
}

export const PLAYER = { radius: 9, speed: 164 };
export const STEP = 1 / 60;

export const PALETTE = {
  backdrop: '#182b36',
  road: '#ad8d79',
  curb: '#fff0cc',
  sidewalk: '#dec7a5',
  garden: '#91b293',
  sand: '#f6d29a',
  wetSand: '#edb989',
  sea: '#288f9e',
  shallow: '#62c3ba',
  ink: '#27374b',
};
