import { DEFAULT_SEED, PLAYER, STEP, VIEW } from './config.js';
import { createInput } from './input.js';
import { MISSION_COUNT, advanceStory, checkMission, createMissions, missionDisplay, startMission } from './missions.js';
import { createPedestrians, knockDown, updatePedestrians } from './pedestrians.js';
import { createPolice, updatePolice } from './police.js';
import { createWanted, reportCrime, updateWanted } from './wanted.js';
import { createRandom } from './random.js';
import { cameraPosition, createRenderer } from './render.js';
import { loadSave, writeSave } from './save.js';
import { showTitle } from './title.js';
import { listenForSound, playSound, updateSound } from './sound.js';
import { stageShot } from './shots.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createVehicles, drive, nearbyCar, toggleVehicle, touchesCar } from './vehicles.js';
import { canWalk, createWorld } from './world.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : DEFAULT_SEED;
const world = createWorld(createRandom(seed));
const renderer = createRenderer(document.getElementById('game'));
const player = { ...world.spawn };
let vehicles;
let population;
let wanted;
let police;
let contacts;
const status = document.getElementById('status');
let missions;
let health;
let damageCooldown;

function reset() {
  Object.assign(player, world.spawn, { swing: 0 });
  vehicles = createVehicles(world);
  wanted = createWanted();
  police = createPolice();
  contacts = new Set();
  health = 100;
  damageCooldown = 0;
  population = {
    traffic: createTraffic(vehicles, createRandom(seed ^ 0x41c64e6d)),
    pedestrians: createPedestrians(world, createRandom(seed ^ 0x9e3779b9)),
  };
  if (missions) startMission(missions, world, vehicles, wanted, player);
}

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
  updateTraffic(population.traffic, { ...vehicles, cars: [...vehicles.cars, ...police.cars] }, pose, nearby);
  updatePedestrians(world, population.pedestrians, vehicles.active, nearby);
}

function melee() {
  if (vehicles.active || player.swing) return;
  player.swing = 18;
  const person = population.pedestrians.filter((other) => !other.down &&
    Math.hypot(other.x - player.x, other.y - player.y) < 34)
    .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) -
      Math.hypot(b.x - player.x, b.y - player.y))[0];
  if (!person) return;
  player.facing = Math.sign(person.x - player.x) || player.facing;
  knockDown(person, player);
  reportCrime(wanted, 'melee', player);
}

function takeDamage(amount) {
  if (damageCooldown) return;
  health = Math.max(0, health - amount);
  damageCooldown = 45;
}

function updateContacts(impact, moved) {
  const car = vehicles.active;
  const target = car ?? player;
  const overlapping = new Set();
  for (const other of [...vehicles.cars, ...population.traffic, ...police.cars]) {
    if (other === car) continue;
    if (other === impact || (!car && touchesCar(other, player, PLAYER.radius))) {
      overlapping.add(other);
      if (!contacts.has(other)) {
        takeDamage(25);
        if (population.traffic.includes(other) && (moved || impact)) reportCrime(wanted, 'traffic', target);
      }
    }
  }
  for (const person of population.pedestrians) {
    const touching = car ? touchesCar(car, person, 7)
      : Math.hypot(person.x - player.x, person.y - player.y) < 15;
    if (!touching) continue;
    overlapping.add(person);
    if (contacts.has(person) || person.down) continue;
    takeDamage(10);
    if (!moved) continue;
    reportCrime(wanted, 'pedestrian', target);
    if (car) knockDown(person, target);
  }
  contacts = overlapping;
}

function pursue(pose, walkingSpeed = 0) {
  const target = vehicles.active ?? pose;
  const { visible, nearby } = updatePolice(world, police, wanted, target, Boolean(vehicles.active),
    [...vehicles.cars, ...population.traffic]);
  const speed = vehicles.active ? Math.abs(target.speed) : walkingSpeed;
  updateWanted(wanted, target, visible, nearby, speed);
}

function draw(pose, canEnter, titleCamera) {
  const view = missionDisplay(missions, world, vehicles.active, wanted);
  renderer.draw(world, pose, vehicles, population, {
    canEnter, wanted, patrols: police.cars, mission: view, health, cash: missions?.cash ?? 0, titleCamera,
  });
}

function tick(input, direction) {
  const advance = input.takeStory();
  const interact = input.takeInteract();
  const attack = input.takeMelee();
  if (wanted.busted) {
    if (--wanted.busted === 0) reset();
    return;
  }
  const wasEnding = missions.ending;
  advanceStory(missions, world, vehicles, wanted, player, advance);
  if (wasEnding || missions.ending) return;
  if (player.swing) player.swing -= 1;
  if (interact) {
    const car = toggleVehicle(world, vehicles, player, [...population.traffic, ...police.cars]);
    if (car && !car.stolen) {
      car.stolen = true;
      reportCrime(wanted, 'theft', car);
    }
  }
  if (attack) melee();
  const target = vehicles.active ?? player;
  const { x, y } = target;
  let impact;
  if (vehicles.active) impact = drive(world, vehicles, direction, [...population.traffic, ...police.cars]);
  else walk(direction);
  if (damageCooldown) damageCooldown -= 1;
  updateContacts(impact, target.x !== x || target.y !== y);
  if (health === 0) {
    reset();
    return;
  }
  updatePopulation(player);
  pursue(player, Math.hypot(target.x - x, target.y - y) / STEP);
  const checkpoint = checkMission(missions, world, vehicles, wanted, player);
  if (checkpoint) writeSave(checkpoint);
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
      tick(input, direction);
      accumulated -= STEP;
    }
    updateSound(vehicles.active, wanted, police.cars, player);
    const canEnter = !vehicles.active && Boolean(nearbyCar(vehicles, player));
    const message = wanted.busted ? 'BUSTED. Returning to the start.' : (vehicles.active
      ? 'Driving. Use WASD or the arrow keys. Press E to exit.'
      : canEnter ? 'Walk with WASD or the arrow keys. Press E to enter the nearby car.'
        : 'Walk with WASD or the arrow keys. Approach a car to drive.') +
      (vehicles.active ? '' : ' Press F to shove.') +
      (wanted.stars ? ` Wanted level ${wanted.stars} of 5.` : '');
    const view = missionDisplay(missions, world, vehicles.active, wanted);
    const missionMessage = view.ending ? '流星群が見られた。スペースで自由走行へ。'
      : [view.objective, view.story?.heading, view.story?.text].filter(Boolean).join('。');
    const announcement = wanted.busted ? message
      : [message, `HP ${health} of 100. Cash $${missions.cash}.`, missionMessage].filter(Boolean).join(' ');
    if (status.textContent !== announcement) status.textContent = announcement;
    draw(player, canEnter);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

reset();

if (params.has('shot')) {
  const pose = stageShot(params.get('shot'), world, vehicles, updatePopulation, {
    startPursuit(car) {
      missions = createMissions({ completed: [1, 2], cash: 350 });
      startMission(missions, world, vehicles, wanted, car);
      missions.story = null;
      reportCrime(wanted, 'pedestrian', car);
    },
    pursue,
  });
  requestAnimationFrame(() => {
    draw(pose);
    requestAnimationFrame(() => {
      draw(pose);
      window.__shotReady = true;
    });
  });
} else {
  listenForSound();
  const save = loadSave(MISSION_COUNT);
  const menu = document.getElementById('title-menu');
  let startTime;
  function titleFrame(now) {
    if (menu.hidden) return;
    startTime ??= now;
    const phase = (now - startTime) / 1000;
    const camera = { x: 740 + 245 * Math.sin(phase / 11), y: 650 + 125 * Math.sin(phase / 15) };
    draw(player, undefined, camera);
    requestAnimationFrame(titleFrame);
  }
  showTitle(menu, Boolean(save), (resume) => {
    playSound('confirm');
    missions = createMissions(resume ? save : undefined);
    if (!resume) writeSave({ completed: [], cash: 0 });
    reset();
    runGame();
  });
  requestAnimationFrame(titleFrame);
}
