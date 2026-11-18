import { blockRect, cityEnd, cityWidth, CITY_GRID, hasVerticalSegment, horizontalWidth, isBoulevard, PLAYER,
  mergedBlocks, spur, spurContains, streetWidthsX, streetX, streetY } from './config.js';

import { districtAt, districts, observatoryBlock } from './districts.js';

const { columns, rows, beach, sea } = CITY_GRID;
const lotMargin = 12;
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
      const side = row === 0 || row === rows ? 1 : random() < 0.5 ? -1 : 1;
      const x = streetX[column] + 112 + Math.floor(random() * 50);
      // Leave the perimeter traffic loop and the boulevard lanes clear.
      if (row === 0 || isBoulevard(row, x) ||
          (row === observatoryBlock.row && column === observatoryBlock.column)) continue;
      park(x, streetY[row] + side * 17, side === 1 ? 0 : Math.PI);
    }
  }
  park(spur.x + 80, spur.y + 8, 0);
  return cars;
}

export function isRoad(world, x, y) {
  if (x < 0 || x > world.width || y < 0 || y >= world.cityEnd) return false;
  const row = streetY.findLastIndex((center) => center <= y);
  return spurContains(x, y) || streetX.some((center, i) =>
    hasVerticalSegment(i, row) && Math.abs(x - center) <= streetWidthsX[i] / 2) ||
    streetY.some((center, row) => Math.abs(y - center) <= horizontalWidth(row, x) / 2);
}

export function hitsBuilding(world, x, y, radius = PLAYER.radius) {
  return world.buildings.some((building) => {
    const dx = x - Math.max(building.x, Math.min(x, building.x + building.width));
    const dy = y - Math.max(building.y, Math.min(y, building.y + building.depth));
    return dx * dx + dy * dy <= radius * radius;
  });
}

export function createWorld(random) {
  const width = cityWidth;
  const waterline = cityEnd + beach;
  const blocks = [];
  const buildings = [];
  const academy = blockRect(observatoryBlock.column, observatoryBlock.row);
  const spawn = { x: streetX[observatoryBlock.column] + 19, y: streetY[observatoryBlock.row], facing: 1, stride: 0 };
  const locations = {
    plaza: { x: academy.x + 61, y: academy.y + 97, facing: 1, stride: 0.18 },
    coast: { x: streetX[5] + 32, y: waterline - 43, facing: -1, stride: 0.38 },
  };

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const rect = blockRect(column, row);
      const { x, y } = rect;
      const district = districtAt(column, row);
      const observatory = column === observatoryBlock.column && row === observatoryBlock.row;
      const kind = observatory ? 'observatory' : 'buildings';
      const block = { ...rect, column, row, district, kind, plant: random() };
      blocks.push(block);
      if (observatory) {
        buildings.push({ x: x + 97, y: y + 51, width: 83, depth: 91, height: 19, kind, district });
        continue;
      }
      const { buildings: plan, props } = districts[district];
      const lots = plan.alternateLots && block.plant > 0.5 ? plan.alternateLots : plan.lots;
      const [jitter, spread, baseHeight, heightSpread] = plan.variation;
      const roll = (limit) => Math.floor(random() * limit);
      const firstBuilding = buildings.length;
      const fits = (lot) => lot.x >= x + lotMargin && lot.y >= y + lotMargin &&
        lot.x + lot.width <= x + rect.width - lotMargin &&
        lot.y + lot.depth <= y + rect.depth - lotMargin;
      let firstLot;
      for (const [lotX, lotY, minWidth, minDepth] of lots) {
        const lot = {
          x: x + lotX + roll(jitter),
          y: y + lotY + roll(jitter),
          width: minWidth + roll(spread),
          depth: minDepth + roll(spread),
          height: baseHeight + roll(heightSpread),
          style: roll(plan.roofs.length),
          kind,
          district,
        };
        firstLot ??= lot;
        if (fits(lot)) buildings.push(lot);
      }
      for (const offset of props?.containerRows ?? []) {
        for (let slot = 0; slot < 4; slot += 1) {
          const container = {
            x: x + 23 + slot * 40, y: y + offset, width: 32, depth: 13, height: 5,
            style: roll(props.containerColors.length), kind: 'container', district,
          };
          if (fits(container)) buildings.push(container);
        }
      }
      if (buildings.length === firstBuilding) {
        const scale = Math.min(0.75, (rect.width - 2 * lotMargin) / firstLot.width,
          (rect.depth - 2 * lotMargin) / firstLot.depth);
        buildings.push({ ...firstLot, x: x + lotMargin, y: y + lotMargin,
          width: firstLot.width * scale, depth: firstLot.depth * scale,
          height: firstLot.height * scale });
      }
    }
  }
  // Keep the original random draws for lots and parking outside the edited blocks.
  applySpecialBlocks(blocks, buildings);
  const parkedCars = placeParkedCars(random, spawn);
  return { width, height: waterline + sea, cityEnd, waterline, blocks, buildings, spawn, locations, parkedCars };
}

function applySpecialBlocks(blocks, buildings) {
  const find = (column, row) => blocks.find((block) => block.column === column && block.row === row);
  const inBlock = (building, block) => building.x >= block.x && building.x < block.x + block.width &&
    building.y >= block.y && building.y < block.y + block.depth;
  for (const { columns: [left, right], row, kind } of mergedBlocks) {
    const west = find(left, row);
    const east = find(right, row);
    blocks.splice(blocks.indexOf(east), 1);
    west.width = east.x + east.width - west.x;
    west.endColumn = right + 1;
    west.kind = kind;
    if (kind === 'plaza') {
      west.plaza = { x: west.x + west.width / 2 - 85, y: west.y + 13, width: 170, depth: west.depth - 26 };
      for (let i = buildings.length - 1; i >= 0; i -= 1) {
        const building = buildings[i];
        if (inBlock(building, west) && building.x < west.plaza.x + west.plaza.width &&
            building.x + building.width > west.plaza.x) buildings.splice(i, 1);
      }
    }
  }

  const block = find(spur.column, spur.row);
  for (let i = buildings.length - 1; i >= 0; i -= 1) {
    if (inBlock(buildings[i], block)) buildings.splice(i, 1);
  }
  for (const [index, x] of [block.x + 16, block.x + 76, block.x + 137].entries()) {
    for (const y of [block.y + 13, block.y + block.depth - 45]) {
      buildings.push({ x, y, width: 34, depth: 32, height: 12, style: index,
        kind: 'buildings', district: block.district });
    }
  }
}

export function canWalk(world, x, y) {
  const { radius } = PLAYER;
  return x >= radius && x <= world.width - radius && y >= radius &&
    y <= world.waterline - radius && !hitsBuilding(world, x, y);
}
