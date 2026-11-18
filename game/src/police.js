import { CITY_GRID, STEP, VIEW } from './config.js';
import { cameraPosition } from './render.js';
import { touchesCar } from './vehicles.js';
import { hitsBuilding } from './world.js';

const { columns, rows, tile } = CITY_GRID;
const sightRange = 260;
const pace = [
  { topSpeed: 216, acceleration: 185 },
  { topSpeed: 232, acceleration: 205 },
  { topSpeed: 248, acceleration: 225 },
  { topSpeed: 264, acceleration: 245 },
  { topSpeed: 272, acceleration: 260 },
];
const streetX = Array.from({ length: columns + 1 }, (_, i) =>
  Math.max(14, Math.min(columns * tile - 14, i * tile)));
const streetY = Array.from({ length: rows + 1 }, (_, i) => Math.max(14, i * tile));
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (values, value) => values.reduce((best, next) =>
  Math.abs(next - value) < Math.abs(best - value) ? next : best);
const clamp = (value, values) => Math.max(values[0], Math.min(values.at(-1), value));

function roadPoint({ x, y }) {
  const vertical = { x: nearest(streetX, x), y: clamp(y, streetY) };
  const horizontal = { x: clamp(x, streetX), y: nearest(streetY, y) };
  return gap({ x, y }, vertical) < gap({ x, y }, horizontal) ? vertical : horizontal;
}

function junction(point, goal) {
  if (streetX.includes(point.x) && streetY.includes(point.y)) return point;
  const xs = streetX.filter((x) => x <= point.x);
  const ys = streetY.filter((y) => y <= point.y);
  const x = xs.at(-1);
  const y = ys.at(-1);
  const left = { x, y: point.y };
  const right = { x: streetX[xs.length] ?? x, y: point.y };
  const top = { x: point.x, y };
  const bottom = { x: point.x, y: streetY[ys.length] ?? y };
  const ends = point.y === y ? [left, right] : [top, bottom];
  return ends.reduce((first, second) => gap(point, first) + manhattan(first, goal) <=
    gap(point, second) + manhattan(second, goal) ? first : second);
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function roadWaypoint(point, goal) {
  if ((point.x === goal.x && streetX.includes(point.x)) ||
      (point.y === goal.y && streetY.includes(point.y))) return goal;
  const turn = junction(point, goal);
  if (gap(point, turn) > 0) return turn;
  return streetY.includes(goal.y) ? { x: point.x, y: goal.y } : { x: goal.x, y: point.y };
}

const spawnPoints = [
  ...streetY.flatMap((y) => streetX.slice(1).map((x, i) => ({ x: (x + streetX[i]) / 2, y }))),
  ...streetX.flatMap((x) => streetY.slice(1).map((y, i) => ({ x, y: (y + streetY[i]) / 2 }))),
];

function spawn(world, target, cars, obstacles) {
  const camera = cameraPosition(world, target);
  const point = spawnPoints.filter((candidate) => {
    const { x, y } = candidate;
    return (x < camera.x - 25 || x > camera.x + VIEW.width + 25 ||
      y < camera.y - 25 || y > camera.y + VIEW.height + 25) &&
      cars.every((car) => gap(car, candidate) > 46 && gap(car.origin, candidate) >= tile * 0.7) &&
      obstacles.every((car) => gap(car, candidate) > 46);
  }).sort((a, b) => gap(a, target) - gap(b, target))[0];
  if (point) cars.push({ ...point, origin: point, road: point, police: true, heading: 0, speed: 0, flash: false });
}

function clearPath(world, a, b, radius) {
  const steps = Math.ceil(gap(a, b) / 8);
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    if (hitsBuilding(world, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, radius)) return false;
  }
  return true;
}

function advance(car, goal, speed) {
  const distance = gap(car, goal);
  if (distance === 0) return;
  car.heading = Math.atan2(goal.y - car.y, goal.x - car.x);
  const t = Math.min(1, speed * STEP / distance);
  const next = t === 1 ? goal : { x: car.x + (goal.x - car.x) * t, y: car.y + (goal.y - car.y) * t };
  Object.assign(car, { x: next.x, y: next.y });
}

export function updatePolice(world, police, wanted, target, driving, obstacles) {
  const { cars } = police;
  const count = wanted.stars ? wanted.stars + 1 : 0;
  cars.length = Math.min(cars.length, count);
  if (!count) return { visible: false, nearby: false };
  if (cars.length < count && police.frame % 14 === 0) spawn(world, target, cars, obstacles);
  police.frame += 1;
  const { topSpeed, acceleration } = pace[wanted.stars - 1];
  const canSee = (car) => gap(car, target) <= sightRange && clearPath(world, car, target, 0);
  const observers = cars.filter(canSee);
  const objective = observers.length ? target : wanted.lastSeen;
  const road = roadPoint(objective);
  for (const [index, car] of cars.entries()) {
    car.flash = Math.floor(police.frame / 7) % 2 === 0;
    const distance = gap(car, target);
    const trailing = driving && target.speed * (
      (target.x - car.x) * Math.cos(target.heading) + (target.y - car.y) * Math.sin(target.heading)
    ) > 0;
    const catchUp = trailing ? 12 * Math.max(0, Math.min(1, (distance - 120) / 200)) : 0;
    car.speed = Math.min(topSpeed + catchUp, car.speed + acceleration * STEP);
    const angle = (target.heading ?? 0) + index * Math.PI * 2 / count;
    const offset = driving ? 40 : 13;
    const intercept = { x: target.x + Math.cos(angle) * offset, y: target.y + Math.sin(angle) * offset };
    const close = observers.includes(car) && distance < 92 && gap(road, target) < 62 &&
      intercept.x >= 12 && intercept.x <= world.width - 12 &&
      intercept.y >= 12 && intercept.y <= world.waterline - 12 && clearPath(world, car, intercept, 11);
    if (close) {
      advance(car, intercept, car.speed);
    } else if (gap(car, car.road) > 0) {
      advance(car, car.road, car.speed);
    } else {
      advance(car, roadWaypoint(car.road, road), car.speed);
      car.road = { x: car.x, y: car.y };
    }
  }
  const visible = observers.length > 0 || cars.some(canSee);
  const nearby = cars.some((car) => gap(car, target) <= 50 &&
    (driving || touchesCar(car, target, 9)) && clearPath(world, car, target, 0));
  return { visible, nearby };
}

export function createPolice() {
  return { cars: [], frame: 0 };
}
