import { cityEnd, cityWidth, CITY_GRID, hasVerticalSegment, horizontalWidth, isBoulevard, PLAYER, STEP,
  streetWidthsX, streetX, streetY } from './config.js';
import { createRandom } from './random.js';
import { CAR } from './vehicles.js';

const { columns, rows } = CITY_GRID;
const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const colors = ['#c15b50', '#5d849f', '#e0ad55', '#4c8b79', '#936c9d', '#e8dbbf'];

function point(x, y, direction, distance, lane) {
  const [dx, dy] = directions[direction];
  return { x: x + dx * distance - dy * lane, y: y + dy * distance + dx * lane };
}

export function buildRoads(parkedCars) {
  const nodes = Array.from({ length: (rows + 1) * (columns + 1) }, (_, index) => ({
    x: streetX[index % (columns + 1)],
    y: streetY[Math.floor(index / (columns + 1))],
    edges: [],
  }));
  for (const [index, node] of nodes.entries()) {
    for (const [direction, [dx, dy]] of directions.entries()) {
      const fromColumn = index % (columns + 1);
      const fromRow = Math.floor(index / (columns + 1));
      const column = fromColumn + dx;
      const row = fromRow + dy;
      if (column < 0 || column > columns || row < 0 || row > rows) continue;
      if (dy && !hasVerticalSegment(column, Math.min(row, fromRow))) continue;
      const end = nodes[row * (columns + 1) + column];
      const distance = Math.hypot(end.x - node.x, end.y - node.y);
      const boulevard = dx !== 0 && isBoulevard(row, (node.x + end.x) / 2);
      const lane = boulevard ? 23 : 13;
      const middle = point(node.x, node.y, direction, distance / 2, lane);
      if (middle.x < 0 || middle.x > cityWidth || middle.y < 0 ||
          middle.y > cityEnd - CAR.width / 2) continue;
      const blocked = parkedCars.some((car) =>
        Math.abs((car.x - middle.x) * dy - (car.y - middle.y) * dx) < CAR.width &&
        Math.abs((car.x - middle.x) * dx + (car.y - middle.y) * dy) < distance / 2 + CAR.length / 2);
      if (blocked) continue;
      const approach = dx ? streetWidthsX[fromColumn] / 2 : horizontalWidth(fromRow, middle.x) / 2;
      const departure = dx ? streetWidthsX[column] / 2 : horizontalWidth(row, middle.x) / 2;
      const length = distance - approach - departure;
      node.edges.push({ direction, from: node, end, length, speedMultiplier: boulevard ? 1.5 : 1,
        start: point(node.x, node.y, direction, approach, lane),
        finish: point(end.x, end.y, direction, -departure, lane) });
    }
  }
  // Keep lanes with a continuation through the junction. Parked cars can close
  // a lane, so remove dead ends before spawning or choosing any routes.
  function exits(edge) {
    return edge.end.edges.filter(({ direction }) => direction !== (edge.direction + 2) % 4);
  }
  let changed;
  do {
    changed = false;
    for (const node of nodes) {
      const open = node.edges.filter((edge) => exits(edge).length > 0);
      changed ||= open.length !== node.edges.length;
      node.edges = open;
    }
  } while (changed);
  const edges = nodes.flatMap((node) => node.edges);
  for (const edge of edges) edge.exits = exits(edge);
  return edges;
}

function turnBetween(edge, next) {
  const start = edge.finish;
  const finish = next.start;
  const horizontal = edge.direction % 2 === 0;
  const control = edge.direction === next.direction
    ? { x: (start.x + finish.x) / 2, y: (start.y + finish.y) / 2 }
    : { x: horizontal ? finish.x : start.x, y: horizontal ? start.y : finish.y };
  const length = (Math.hypot(finish.x - start.x, finish.y - start.y) +
    Math.hypot(control.x - start.x, control.y - start.y) +
    Math.hypot(finish.x - control.x, finish.y - control.y)) / 2;
  return { start, finish, control, length };
}

function poseOn(car, distance) {
  const { edge, turn } = car;
  if (distance < edge.length) {
    return {
      x: edge.start.x + directions[edge.direction][0] * distance,
      y: edge.start.y + directions[edge.direction][1] * distance,
      heading: edge.direction * Math.PI / 2 };
  }
  const t = Math.min(1, (distance - edge.length) / turn.length);
  const u = 1 - t;
  const { start, finish, control } = turn;
  const heading = Math.atan2(
    u * (control.y - start.y) + t * (finish.y - control.y),
    u * (control.x - start.x) + t * (finish.x - control.x));
  const x = u * u * start.x + 2 * u * t * control.x + t * t * finish.x;
  const y = u * u * start.y + 2 * u * t * control.y + t * t * finish.y;
  const cos = Math.abs(Math.cos(heading));
  const sin = Math.abs(Math.sin(heading));
  const halfWidth = (CAR.length * cos + CAR.width * sin) / 2 + 0.01;
  const halfHeight = (CAR.length * sin + CAR.width * cos) / 2 + 0.01;
  return {
    x: Math.max(halfWidth, Math.min(x, cityWidth - halfWidth)),
    y: Math.max(halfHeight, Math.min(y, cityEnd - halfHeight)),
    heading,
  };
}

function chooseExit(car) {
  const { edge, random } = car;
  const straight = edge.exits.find(({ direction }) => direction === edge.direction);
  car.next = straight && random() < 0.54
    ? straight : edge.exits[Math.floor(random() * edge.exits.length)];
  car.turn = turnBetween(edge, car.next);
}

export function createTraffic(vehicles, random) {
  const cars = [];
  for (const edge of buildRoads(vehicles.cars)) {
    if (random() < 0.75) continue;
    const car = { edge, random: createRandom(Math.floor(random() * 0x100000000)),
      distance: 36 + random() * 100, speed: 0, cruise: 62 + random() * 32,
      color: colors[Math.floor(random() * colors.length)] };
    chooseExit(car);
    Object.assign(car, poseOn(car, car.distance));
    cars.push(car);
  }
  return cars;
}

function clearance({ x, y, heading }, obstacle) {
  // Approximate each vehicle by the centerline of its rounded body.
  const dx = obstacle.x - x;
  const dy = obstacle.y - y;
  const along = dx * Math.cos(heading) + dy * Math.sin(heading);
  const side = -dx * Math.sin(heading) + dy * Math.cos(heading);
  return Math.hypot(Math.max(0, Math.abs(along) - 13), side);
}

function blocked(pose, obstacles, player) {
  if (player && clearance(pose, player) < PLAYER.radius + CAR.width / 2 + 2) return true;
  return obstacles.some((other) => {
    const dx = Math.cos(other.heading) * 13;
    const dy = Math.sin(other.heading) * 13;
    return [-1, -0.5, 0, 0.5, 1].some((offset) =>
      clearance(pose, { x: other.x + dx * offset, y: other.y + dy * offset }) < CAR.width + 2);
  });
}

export function updateTraffic(cars, vehicles, player, nearbyView) {
  const walking = vehicles.active ? null : player;
  const obstacles = [...vehicles.cars, ...cars];
  for (const car of cars) {
    if (!nearbyView(car)) continue;
    if (car.junction && car.distance >= 26 && car.edge.end !== car.junction) {
      car.junction.occupant = null;
      car.junction = null;
    }
    const junction = car.edge.end;
    const stopLine = car.edge.length - 36;
    if (!junction.occupant && car.distance >= stopLine - 1 &&
        !cars.some((other) => other.edge === car.next && other.distance < 76)) {
      junction.occupant = car;
      car.junction = junction;
    }
    const limit = junction.occupant === car ? Infinity : stopLine;
    const nearby = obstacles.filter((other) => other !== car &&
      Math.abs(car.x - other.x) < 108 && Math.abs(car.y - other.y) < 108);
    let desired = Math.min(car.cruise * car.edge.speedMultiplier, Math.sqrt(2 * 220 * Math.max(0, limit - car.distance)));
    for (const ahead of [8, 20, 34, 50]) {
      if (!blocked(poseOn(car, car.distance + ahead), nearby, walking)) continue;
      desired = Math.min(desired, (ahead - 8) * 2);
      break;
    }
    car.speed += Math.max(-220 * STEP, Math.min(75 * STEP, desired - car.speed));
    const nextDistance = Math.min(limit, car.distance + car.speed * STEP);
    const pose = poseOn(car, nextDistance);
    if (blocked(pose, nearby, walking)) {
      car.speed = 0;
      continue;
    }
    car.distance = nextDistance;
    Object.assign(car, pose);
    const segmentLength = car.edge.length + car.turn.length;
    if (car.distance >= segmentLength) {
      car.distance -= segmentLength;
      car.edge = car.next;
      chooseExit(car);
    }
  }
}
