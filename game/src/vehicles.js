import { PLAYER, STEP } from './config.js';
import { canWalk, hitsBuilding } from './world.js';

export const CAR = { length: 42, width: 18 };
const bodyRadius = 11;
const bodyOffsets = [-13, -6.5, 0, 6.5, 13];
const entryDistance = 54;
const maxForward = 285;
const maxReverse = 105;

function footprint({ x, y, heading }) {
  return bodyOffsets.map((offset) => ({
    x: x + Math.cos(heading) * offset,
    y: y + Math.sin(heading) * offset,
  }));
}

export function touchesCar(car, target, radius) {
  return footprint(car).some((point) => Math.hypot(point.x - target.x, point.y - target.y) < bodyRadius + radius);
}

export function createVehicles(world) {
  return { cars: world.parkedCars.map((car) => ({ ...car, speed: 0 })), active: null };
}

export function nearbyCar({ cars }, player) {
  let nearest = null;
  let distance = entryDistance;
  for (const car of cars) {
    const gap = Math.hypot(car.x - player.x, car.y - player.y);
    if (gap < distance) {
      nearest = car;
      distance = gap;
    }
  }
  return nearest;
}

export function toggleVehicle(world, vehicles, player, traffic = []) {
  const car = vehicles.active;
  if (!car) {
    vehicles.active = nearbyCar(vehicles, player);
    return vehicles.active;
  }

  const forwardX = Math.cos(car.heading);
  const forwardY = Math.sin(car.heading);
  const occupied = [...vehicles.cars, ...traffic].flatMap(footprint);
  const clearance = bodyRadius + PLAYER.radius;
  for (const [forward, side] of [[0, -24], [0, 24], [-35, 0], [35, 0]]) {
    const x = car.x + forward * forwardX - side * forwardY;
    const y = car.y + forward * forwardY + side * forwardX;
    if (!canWalk(world, x, y) ||
        occupied.some((point) => Math.hypot(point.x - x, point.y - y) <= clearance)) continue;
    Object.assign(player, { x, y, stride: 0 });
    car.speed = 0;
    vehicles.active = null;
    return;
  }
}

export function drive(world, { active: car, cars }, { x: steer, y }, traffic = []) {
  if (!car) return;
  const throttle = -y;
  const braking = throttle && car.speed * throttle < 0;
  const acceleration = braking ? 490 : throttle > 0 ? 245 : 180;
  let speed = throttle
    ? car.speed + throttle * acceleration * STEP
    : Math.sign(car.speed) * Math.max(0, Math.abs(car.speed) - 130 * STEP);
  if (braking && speed * throttle > 0) speed = 0;
  speed = Math.max(-maxReverse, Math.min(maxForward, speed));

  const turn = steer * Math.sign(speed) * Math.min(Math.abs(speed) / 70, 1);
  const heading = (car.heading + turn * 2.5 * STEP) % (Math.PI * 2);
  const next = {
    x: car.x + Math.cos(heading) * speed * STEP,
    y: car.y + Math.sin(heading) * speed * STEP,
    heading,
  };
  const nearby = [...cars, ...traffic].filter((other) => other !== car &&
    Math.hypot(other.x - next.x, other.y - next.y) < 2 * (bodyRadius + 13));
  const body = footprint(next);
  const impact = nearby.find((other) => body.some((point) => touchesCar(other, point, bodyRadius)));
  const blocked = body.some(({ x, y }) =>
    x < bodyRadius || x > world.width - bodyRadius || y < bodyRadius ||
    y > world.waterline - bodyRadius || hitsBuilding(world, x, y, bodyRadius));
  if (blocked || impact) {
    car.speed = 0;
    return impact;
  }
  Object.assign(car, next, { speed });
}
