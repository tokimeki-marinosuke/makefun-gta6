import { CITY_GRID } from './config.js';
import { drive } from './vehicles.js';

// Each pose uses the same camera and renderer as free exploration.
export function stageShot(name, world, vehicles, updatePopulation, chase) {
  if (name === 'downtown' || name === 'start' || name === 'start-traffic') {
    for (let tick = 0; tick < 90; tick += 1) updatePopulation(world.spawn);
    return world.spawn;
  }
  if (name === 'observatory') return world.locations.plaza;
  if (name === 'coast') return world.locations.coast;
  if (name === 'police-chase') {
    const { tile } = CITY_GRID;
    const car = vehicles.cars[0];
    Object.assign(car, { x: tile * 3 + 80, y: tile * 3 - 13, heading: 0 });
    vehicles.active = car;
    chase.startPursuit(car);
    for (let tick = 0; tick < 105; tick += 1) {
      if (tick >= 68) drive(world, vehicles, { x: 0, y: -1 });
      chase.pursue(world.spawn);
    }
    return world.spawn;
  }
  if (name === 'coast-drive') {
    const { tile, rows } = CITY_GRID;
    const car = vehicles.cars[0];
    Object.assign(car, { x: tile * 4 + 65, y: rows * tile + 13, heading: 0 });
    vehicles.active = car;
    for (let tick = 0; tick < 62; tick += 1) drive(world, vehicles, { x: 0, y: -1 });
  }
  return world.spawn;
}
