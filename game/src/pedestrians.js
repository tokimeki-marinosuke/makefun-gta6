import { STEP } from './config.js';
import { hitsBuilding } from './world.js';

const inset = 7;
const outfits = [
  { outfit: '#a8535f', hair: '#50342d', skin: '#b87152', style: 'bun' },
  { outfit: '#38716c', hair: '#322d46', skin: '#e9ac86', style: 'short' },
  { outfit: '#a46a32', hair: '#7b4548', skin: '#ffd5a6', style: 'bob' },
  { outfit: '#5f548a', hair: '#392b38', skin: '#a86b4c', style: 'bob' },
  { outfit: '#456b95', hair: '#9c663c', skin: '#f2bea0', style: 'bun' },
];

function sidewalkPosition(block, distance, offset) {
  const side = block.size - 2 * inset;
  const edge = Math.floor(distance / side);
  const along = distance % side;
  const near = inset + offset;
  const far = block.size - near;
  const tangent = Math.max(near, Math.min(far, inset + along));
  const position = [[tangent, near], [far, tangent],
    [block.size - tangent, far], [near, block.size - tangent]][edge];
  return { x: block.x + position[0], y: block.y + position[1] };
}

export function createPedestrians(world, random) {
  return world.blocks.flatMap((block) => {
    const perimeter = 4 * (block.size - 2 * inset);
    const count = block.kind === 'buildings' ? 2 : 3;
    return Array.from({ length: count }, (_, index) => {
      const distance = perimeter * (index + random() * 0.7) / count;
      return { ...sidewalkPosition(block, distance, 0), block, perimeter, distance,
        facing: random() < 0.5 ? -1 : 1, direction: random() < 0.5 ? -1 : 1,
        stride: random(), speed: 29 + random() * 16, offset: 0, evade: 0,
        appearance: outfits[Math.floor(random() * outfits.length)] };
    });
  });
}

export function knockDown(person, source) {
  const ahead = sidewalkPosition(person.block, (person.distance + 18) % person.perimeter, 0);
  const behind = sidewalkPosition(person.block, (person.distance - 18 + person.perimeter) % person.perimeter, 0);
  const gap = ({ x, y }) => Math.hypot(x - source.x, y - source.y);
  person.direction = gap(ahead) >= gap(behind) ? 1 : -1;
  person.down = 42;
  person.evade = 120;
}

export function updatePedestrians(world, pedestrians, car, nearby) {
  const projectedX = car && car.x + Math.cos(car.heading) * car.speed * 0.24;
  const projectedY = car && car.y + Math.sin(car.heading) * car.speed * 0.24;
  for (const person of pedestrians) {
    if (person.down) {
      person.down -= 1;
      continue;
    }
    if (!nearby(person)) continue;
    const { block, perimeter } = person;
    const wrap = (distance) => (distance + perimeter) % perimeter;
    const danger = car && (Math.hypot(person.x - car.x, person.y - car.y) < 49 ||
      Math.hypot(person.x - projectedX, person.y - projectedY) < 49);
    if (danger && !person.evade) {
      const ahead = sidewalkPosition(block, wrap(person.distance + 18), 0);
      const behind = sidewalkPosition(block, wrap(person.distance - 18), 0);
      person.direction = Math.hypot(ahead.x - projectedX, ahead.y - projectedY) >=
        Math.hypot(behind.x - projectedX, behind.y - projectedY) ? 1 : -1;
    }
    person.evade = Math.max(danger ? 36 : 0, person.evade - 1);
    const distance = wrap(person.distance + person.direction * (person.evade ? 92 : person.speed) * STEP);
    let offset = person.evade ? Math.min(8, person.offset + 0.6) : Math.max(0, person.offset - 0.4);
    let pose = sidewalkPosition(block, distance, offset);
    if (offset && hitsBuilding(world, pose.x, pose.y, 4)) {
      offset = 0;
      pose = sidewalkPosition(block, distance, offset);
    }
    if (pose.x !== person.x) person.facing = Math.sign(pose.x - person.x);
    person.stride += Math.hypot(pose.x - person.x, pose.y - person.y) / 32;
    Object.assign(person, pose, { offset, distance });
  }
}
