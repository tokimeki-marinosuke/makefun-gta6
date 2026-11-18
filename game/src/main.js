import { CITY, DEFAULT_SEED, PLAYER, STEP } from './config.js';
import { createInput } from './input.js';
import { createRandom } from './random.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';
import { canWalk, createWorld } from './world.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : DEFAULT_SEED;
const world = createWorld(createRandom(seed));
const renderer = createRenderer(document.getElementById('game'));
const player = { ...world.spawn };

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

function runGame() {
  const input = createInput();
  let previousFrame;
  let accumulated = 0;

  function frame(now) {
    accumulated += Math.min((now - (previousFrame ?? now)) / 1000, 0.1);
    previousFrame = now;
    const direction = input.direction();
    while (accumulated >= STEP) {
      walk(direction);
      accumulated -= STEP;
    }
    renderer.draw(world, player);
    requestAnimationFrame(frame);
  }

  document.getElementById('status').textContent = `${CITY}. Walk with WASD or the arrow keys.`;
  requestAnimationFrame(frame);
}

if (params.has('shot')) {
  const pose = stageShot(params.get('shot'), world);
  requestAnimationFrame(() => {
    renderer.draw(world, pose);
    requestAnimationFrame(() => {
      renderer.draw(world, pose);
      window.__shotReady = true;
    });
  });
} else {
  runGame();
}
