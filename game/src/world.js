import { CITY_GRID, PLAYER } from './config.js';

import { districtAt, districts, observatoryBlock } from './districts.js';

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
      const district = districtAt(column, row);
      const observatory = column === observatoryBlock.column && row === observatoryBlock.row;
      const kind = observatory ? 'observatory' : 'buildings';
      const block = { x, y, column, row, size: tile - road, district, kind, plant: random() };
      blocks.push(block);
      if (observatory) {
        buildings.push({ x: x + 97, y: y + 51, width: 83, depth: 91, height: 19, kind, district });
        continue;
      }
      const { buildings: plan, props } = districts[district];
      const lots = plan.alternateLots && block.plant > 0.5 ? plan.alternateLots : plan.lots;
      const [jitter, spread, baseHeight, heightSpread] = plan.variation;
      const roll = (limit) => Math.floor(random() * limit);
      for (const [lotX, lotY, minWidth, minDepth] of lots) {
        buildings.push({
          x: x + lotX + roll(jitter),
          y: y + lotY + roll(jitter),
          width: minWidth + roll(spread),
          depth: minDepth + roll(spread),
          height: baseHeight + roll(heightSpread),
          style: roll(plan.roofs.length),
          kind,
          district,
        });
      }
      for (const offset of props?.containerRows ?? []) {
        for (let slot = 0; slot < 4; slot += 1) {
          buildings.push({
            x: x + 23 + slot * 40, y: y + offset, width: 32, depth: 13, height: 5,
            style: roll(props.containerColors.length), kind: 'container', district,
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
