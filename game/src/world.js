import { CITY_GRID, PLAYER } from './config.js';

const { columns, rows, tile, road, beach, sea } = CITY_GRID;
const halfRoad = road / 2;
const carColors = ['#d96263', '#6c9eb9', '#f3c16d', '#6da995', '#a887b0', '#eee2cb'];

function placeParkedCars(random, spawn) {
  const cars = [];
  const park = (x, y, heading) => {
    cars.push({ x, y, heading, color: carColors[Math.floor(random() * carColors.length)] });
  };
  park(spawn.x + 46, spawn.y + 17, 0);
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (random() < 0.42) continue;
      const side = row === 0 ? 1 : row === rows ? -1 : random() < 0.5 ? -1 : 1;
      const x = column * tile + 112 + Math.floor(random() * 50);
      park(x, row * tile + side * 17, side === 1 ? 0 : Math.PI);
    }
  }
  return cars;
}

export function isRoad(world, x, y) {
  if (x < 0 || x > world.width || y < 0 || y >= world.cityEnd) return false;
  const distance = (value) => Math.abs(value - Math.round(value / tile) * tile);
  return distance(x) <= halfRoad || distance(y) <= halfRoad;
}

export function hitsBuilding(world, x, y, radius = PLAYER.radius) {
  return world.buildings.some((building) => {
    const dx = x - Math.max(building.x, Math.min(x, building.x + building.width));
    const dy = y - Math.max(building.y, Math.min(y, building.y + building.depth));
    return dx * dx + dy * dy <= radius * radius;
  });
}

export function createWorld(random) {
  const width = columns * tile;
  const cityEnd = rows * tile + halfRoad;
  const waterline = cityEnd + beach;
  const blocks = [];
  const buildings = [];
  const spawn = { x: tile * 3, y: tile * 3, facing: 1, stride: 0 };
  const locations = {
    plaza: { x: tile * 3 + 88, y: tile * 3 + 124, facing: 1, stride: 0.18 },
    coast: { x: tile * 5 + 32, y: waterline - 43, facing: -1, stride: 0.38 },
  };

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * tile + halfRoad;
      const y = row * tile + halfRoad;
      const kind = column === 3 && row === 3 ? 'observatory'
        : (column + row * 2) % 9 === 2 ? 'garden' : 'buildings';
      const block = { x, y, size: tile - road, kind, plant: random() };
      blocks.push(block);
      if (kind === 'observatory') {
        buildings.push({ x: x + 97, y: y + 51, width: 83, depth: 91, height: 19, kind });
      }
      if (kind !== 'buildings') continue;
      for (const lotX of [12, 107]) {
        for (const lotY of [12, 107]) {
          buildings.push({
            x: x + lotX + Math.floor(random() * 9),
            y: y + lotY + Math.floor(random() * 9),
            width: 51 + Math.floor(random() * 25),
            depth: 47 + Math.floor(random() * 27),
            height: 9 + Math.floor(random() * 22),
            style: Math.floor(random() * 5),
            kind,
          });
        }
      }
    }
  }
  const parkedCars = placeParkedCars(random, spawn);
  return { width, height: waterline + sea, cityEnd, waterline, blocks, buildings, spawn, locations, parkedCars };
}

export function canWalk(world, x, y) {
  const { radius } = PLAYER;
  return x >= radius && x <= world.width - radius && y >= radius &&
    y <= world.waterline - radius && !hitsBuilding(world, x, y);
}
