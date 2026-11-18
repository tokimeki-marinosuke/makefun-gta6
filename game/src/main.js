import { DEFAULT_SEED, PLAYER, STEP, VIEW } from './config.js';
import { createInput } from './input.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { createRandom } from './random.js';
import { cameraPosition, createRenderer } from './render.js';
import { stageShot } from './shots.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createVehicles, drive, nearbyCar, toggleVehicle } from './vehicles.js';
import { canWalk, createWorld } from './world.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : DEFAULT_SEED;
const world = createWorld(createRandom(seed));
const renderer = createRenderer(document.getElementById('game'));
const player = { ...world.spawn };
const vehicles = createVehicles(world);
const population = {
  traffic: createTraffic(vehicles, createRandom(seed ^ 0x41c64e6d)),
  pedestrians: createPedestrians(world, createRandom(seed ^ 0x9e3779b9)),
};
const status = document.getElementById('status');

function walk({ x, y }) {
  const length = Math.hypot(x, y);
  if (!length) return;
  const distance = PLAYER.speed * STEP / length;
  const nextX = player.x + x * distance;
  const nextY = player.y + y * distance;
  const previousX = player.x;
  const previousY = player.y;
  if (x) player.facing = x;
  if (canWalk(world, nextX, player.y)) player.x = nextX;
  if (canWalk(world, player.x, nextY)) player.y = nextY;
  player.stride += Math.hypot(player.x - previousX, player.y - previousY) / 32;
}

function updatePopulation(pose) {
  const { x, y } = cameraPosition(world, vehicles.active ?? pose);
  const margin = 140;
  const nearby = (entity) => entity.x >= x - margin && entity.x <= x + VIEW.width + margin &&
    entity.y >= y - margin && entity.y <= y + VIEW.height + margin;
  updateTraffic(population.traffic, vehicles, pose, nearby);
  updatePedestrians(world, population.pedestrians, vehicles.active, nearby);
}

function runGame() {
  const input = createInput();
  let previousFrame;
  let accumulated = 0;

  function frame(now) {
    accumulated += Math.min((now - (previousFrame ?? now)) / 1000, 0.1);
    previousFrame = now;
    const direction = input.direction();
    while (accumulated >= STEP) {
      if (input.takeInteract()) toggleVehicle(world, vehicles, player, population.traffic);
      if (vehicles.active) drive(world, vehicles, direction, population.traffic);
      else walk(direction);
      updatePopulation(player);
      accumulated -= STEP;
    }
    const canEnter = !vehicles.active && Boolean(nearbyCar(vehicles, player));
    const message = vehicles.active
      ? 'Driving. Use WASD or the arrow keys. Press E to exit.'
      : canEnter ? 'Walk with WASD or the arrow keys. Press E to enter the nearby car.'
        : 'Walk with WASD or the arrow keys. Approach a car to drive.';
    if (status.textContent !== message) status.textContent = message;
    renderer.draw(world, player, vehicles, population, canEnter);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if (params.has('shot')) {
  const pose = stageShot(params.get('shot'), world, vehicles, updatePopulation);
  requestAnimationFrame(() => {
    renderer.draw(world, pose, vehicles, population);
    requestAnimationFrame(() => {
      renderer.draw(world, pose, vehicles, population);
      window.__shotReady = true;
    });
  });
} else {
  runGame();
}
