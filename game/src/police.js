import { cityWidth, hasVerticalSegment, horizontalWidth, removedSegments, spur, STEP,
  streetWidthsX, streetX, streetY, VIEW } from './config.js';
import { cameraPosition } from './render.js';
import { touchesCar } from './vehicles.js';
import { hitsBuilding, isRoad } from './world.js';

const patrolSpacing = 175;
const sightRange = 260;
const pace = [
  { topSpeed: 216, acceleration: 185 },
  { topSpeed: 232, acceleration: 205 },
  { topSpeed: 248, acceleration: 225 },
  { topSpeed: 264, acceleration: 245 },
  { topSpeed: 272, acceleration: 260 },
];
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function buildPoliceGraph() {
  const grid = streetY.map((y) => streetX.map((x) => ({
    // Keep patrol bodies inside the perimeter streets.
    x: Math.max(14, Math.min(cityWidth - 14, x)), y: Math.max(14, y), neighbors: [],
  })));
  const branch = { x: spur.x, y: spur.y, neighbors: [] };
  const deadEnd = { x: spur.endX, y: spur.y, neighbors: [] };
  const segments = [];
  function connect(a, b) {
    a.neighbors.push(b);
    b.neighbors.push(a);
    segments.push([a, b]);
  }
  for (const [row, line] of grid.entries()) {
    for (const [column, node] of line.entries()) {
      if (column > 0) connect(line[column - 1], node);
      if (!hasVerticalSegment(column, row)) continue;
      const south = grid[row + 1][column];
      if (column === spur.column && row === spur.row) {
        connect(node, branch);
        connect(branch, south);
      } else {
        connect(node, south);
      }
    }
  }
  connect(branch, deadEnd);
  return { nodes: [...grid.flat(), branch, deadEnd], segments };
}

export const policeGraph = buildPoliceGraph();
const spawnPoints = policeGraph.segments.map(([a, b]) => ({
  x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ends: [a, b],
}));
const nearest = (point, nodes) => nodes.reduce((best, node) =>
  gap(point, node) < gap(point, best) ? node : best);

export function policeRoute(start, goal, target = goal) {
  const previous = new Map([[start, null]]);
  const queue = [start];
  for (let i = 0; i < queue.length && !previous.has(goal); i += 1) {
    for (const node of queue[i].neighbors) {
      if (previous.has(node)) continue;
      previous.set(node, queue[i]);
      queue.push(node);
    }
  }

  const path = [];
  const end = previous.has(goal) ? goal : nearest(target, queue);
  for (let node = end; node !== start; node = previous.get(node)) path.push(node);
  return path.reverse();
}

function streetProjection(node, target) {
  const points = node.neighbors.map((end) => {
    const clamp = (value, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
    return { x: clamp(target.x, node.x, end.x), y: clamp(target.y, node.y, end.y) };
  });
  return nearest(target, [node, ...points]);
}

function crossesRemovedStreet(x, y) {
  return removedSegments.some(({ column, row }) => {
    const center = streetX[column];
    return Math.abs(x - center) <= streetWidthsX[column] / 2 &&
      y > streetY[row] + horizontalWidth(row, x) / 2 &&
      y < streetY[row + 1] - horizontalWidth(row + 1, x) / 2;
  });
}

function spawn(world, target, cars, obstacles) {
  const camera = cameraPosition(world, target);
  const point = spawnPoints.filter((candidate) => {
    const { x, y } = candidate;
    return (x < camera.x - 25 || x > camera.x + VIEW.width + 25 ||
      y < camera.y - 25 || y > camera.y + VIEW.height + 25) &&
      cars.every((car) => gap(car, candidate) > 46 && gap(car.origin, candidate) >= patrolSpacing) &&
      obstacles.every((car) => gap(car, candidate) > 46);
  }).sort((a, b) => gap(a, target) - gap(b, target))[0];
  if (point) cars.push({ x: point.x, y: point.y, origin: point, road: point,
    nextNode: nearest(point, point.ends), police: true, heading: 0, speed: 0, flash: false });
}

function clearPath(world, a, b, radius, onPursuit = false) {
  const steps = Math.ceil(gap(a, b) / 8);
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (hitsBuilding(world, x, y, radius) || (onPursuit && crossesRemovedStreet(x, y))) return false;
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
  const goal = nearest(objective, policeGraph.nodes);
  const onRoad = isRoad(world, target.x, target.y);
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
    const atGoal = car.node === goal && !car.nextNode;
    const start = car.nextNode ?? car.node;
    if (car.routeStart !== start || car.routeGoal !== goal || !car.reachable) {
      car.route = policeRoute(start, goal, objective);
      car.routeStart = start;
      car.routeGoal = goal;
      car.reachable = start === goal || car.route.at(-1) === goal;
    }
    const close = car.reachable && observers.includes(car) && (onRoad ? distance < 92 : atGoal) &&
      intercept.x >= 12 && intercept.x <= world.width - 12 &&
      intercept.y >= 12 && intercept.y <= world.waterline - 12 && clearPath(world, car, intercept, 11, true) &&
      (onRoad || clearPath(world, car, target, 11, true));
    if (close) {
      advance(car, intercept, car.speed);
    } else if (gap(car, car.road) > 0) {
      advance(car, car.road, car.speed);
    } else if (atGoal) {
      const projection = streetProjection(goal, objective);
      const aligned = (car.x === goal.x && projection.x === goal.x) ||
        (car.y === goal.y && projection.y === goal.y);
      const sameSide = (car.x - goal.x) * (projection.x - goal.x) >= 0 &&
        (car.y - goal.y) * (projection.y - goal.y) >= 0;
      advance(car, aligned && sameSide ? projection : goal, Math.min(45, car.speed));
      car.road = { x: car.x, y: car.y };
    } else {
      if (!car.nextNode) {
        // Return from a partial edge projection before taking another edge.
        if (gap(car, car.node) > 0) car.nextNode = car.node;
        else car.nextNode = car.route[0];
      }
      if (car.nextNode) {
        advance(car, car.nextNode, car.speed);
        car.road = { x: car.x, y: car.y };
        if (gap(car, car.nextNode) === 0) {
          car.node = car.nextNode;
          car.nextNode = null;
        }
      }
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
