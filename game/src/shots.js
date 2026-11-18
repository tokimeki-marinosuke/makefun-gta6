import { CITY_GRID } from './config.js';
import { drive } from './vehicles.js';

// Each pose uses the same camera and renderer as free exploration.
export function stageShot(name, world, vehicles, updatePopulation, chase) {
  if (name === 'downtown' || name === 'start' || name === 'start-traffic') {
    const pose = name === 'downtown'
      ? { ...world.spawn, x: 4 * CITY_GRID.tile, y: CITY_GRID.tile + 20 }
      : world.spawn;
    for (let tick = 0; tick < 90; tick += 1) updatePopulation(pose);
    return pose;
  }
  if (name === 'observatory') return world.locations.plaza;
  if (name === 'coast') {
    const { coast } = world.locations;
    return { ...coast, x: coast.x + 60, y: coast.y - 30 };
  }
  if (name === 'harbor') {
    const { tile } = CITY_GRID;
    const pose = { ...world.spawn, x: tile * 5 + 65, y: tile * 2 - 10, stride: 0.26 };
    for (let tick = 0; tick < 90; tick += 1) updatePopulation(pose);
    return pose;
  }
  if (name === 'police-chase') {
    const { tile } = CITY_GRID;
    const car = vehicles.cars[0];
    Object.assign(car, { x: tile * 3 + 65, y: tile * 2, heading: 0 });
    vehicles.active = car;
    chase.startPursuit(car);
    // Let the patrols close in, then accelerate east and steer north.
    // Freeze with the trailing unit and both cross-street units in frame.
    for (let tick = 0; tick < 115; tick += 1) {
      if (tick >= 68) drive(world, vehicles, { x: tick >= 96 ? -1 : 0, y: -1 });
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
