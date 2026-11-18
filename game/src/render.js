import { CITY_GRID, PALETTE, VIEW } from './config.js';
import { drawCharacter } from './character.js';
import { drawMissionMarker } from './mission-render.js';
import { CAR } from './vehicles.js';
import { drawHud } from './hud.js';
import { drawTitleBackdrop } from './title.js';

const { columns, rows, tile, road } = CITY_GRID;
const roofs = ['#e8a68b', '#f1d3a1', '#c1d7c6', '#c9b5cd', '#d9b394'];
const walls = ['#a65f59', '#b88a62', '#729b91', '#8b779b', '#ab795f'];

export function cameraPosition(world, target) {
  return {
    x: Math.max(0, Math.min(target.x - VIEW.width / 2, world.width - VIEW.width)),
    y: Math.max(0, Math.min(target.y - VIEW.height / 2, world.height - VIEW.height)),
  };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale;
  let insetX;
  let insetY;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
    insetX = (canvas.width - VIEW.width * scale) / 2;
    insetY = (canvas.height - VIEW.height * scale) / 2;
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function ellipse(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function line(points, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  }

  function label(value, x, y, font, color, align = 'left') {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  }

  function star(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4;
      const radius = i % 2 ? r * 0.27 : r;
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    ctx.fill();
  }

  function tree(x, y, variety) {
    ellipse(x + 8, y + 6, 16, 10, '#515b5060');
    rect(x - 1.5, y, 3, 9, '#89624e');
    ellipse(x, y - 5, 12, 11, variety > 0.5 ? '#557f71' : '#638967');
    ellipse(x - 4, y - 8, 7, 6, variety > 0.5 ? '#84aa83' : '#96ad70');
  }

  function coast(world) {
    const { width, cityEnd, waterline, height } = world;
    rect(0, cityEnd, width, height - cityEnd, PALETTE.sand);
    rect(0, waterline - 15, width, 15, PALETTE.wetSand);
    const tide = ctx.createLinearGradient(0, waterline, 0, waterline + 220);
    tide.addColorStop(0, PALETTE.shallow);
    tide.addColorStop(0.34, '#48acb0');
    tide.addColorStop(1, PALETTE.sea);
    rect(0, waterline, width, height - waterline, tide);
    rect(0, cityEnd + 4, width, 21, '#ecd7b7');
    rect(0, cityEnd + 24, width, 2, '#fff0cb');
    for (let x = 21; x < width; x += 48) {
      rect(x, cityEnd + 8, 1, 13, '#cbb28f');
      tree(x, cityEnd + 41 + (x % 3) * 6, x % 5 / 5);
      ellipse(x + 24, waterline - 36 - x % 13, 2, 0.75, '#c69578');
    }
    for (let band = 0; band < 8; band += 1) {
      const points = [];
      for (let x = 0; x <= width; x += 5) {
        points.push([x, waterline + band * 24 + Math.sin(x / 27 + band) * (band ? 3 : 2)]);
      }
      line(points, band ? '#d0fff047' : '#fff5cf', band ? 1.5 : 3);
    }
    for (let x = 9; x < width; x += 29) {
      const y = waterline + 12 + (x * 17) % 195;
      line([[x, y], [x + 5 + x % 13, y]], '#f1fff288', 1);
    }
    for (const [x, y, color] of [
      [1104, -58, '#d86772'], [1211, -75, '#6d90ae'], [1362, -35, '#eb956b'],
      [1470, -62, '#a076a0'],
    ]) {
      ellipse(x + 7, waterline + y + 5, 17, 11, '#815c534d');
      ellipse(x, waterline + y, 15, 13, '#fff0c6');
      ellipse(x, waterline + y, 12, 10, color);
      star(x, waterline + y, 9, '#fff0c6');
    }
  }

  function roads(world) {
    rect(0, 0, world.width, world.cityEnd, PALETTE.road);
    for (let row = 0; row <= rows; row += 1) {
      for (let column = 0; column <= columns; column += 1) {
        const x = column * tile;
        const y = row * tile;
        for (let offset = 43; offset <= tile - 43; offset += 24) {
          if (column < columns) rect(x + offset, y - 1, 12, 2, '#f7d9a0');
          if (row < rows) rect(x - 1, y + offset, 2, 12, '#f7d9a0');
        }
        for (let stripe = -19; stripe <= 19; stripe += 7) {
          if (column < columns) rect(x + 27, y + stripe, 10, 3, '#f5e4c8');
          if (column > 0) rect(x - 37, y + stripe, 10, 3, '#f5e4c8');
          if (row < rows) rect(x + stripe, y + 27, 3, 10, '#f5e4c8');
          if (row > 0) rect(x + stripe, y - 37, 3, 10, '#f5e4c8');
        }
      }
    }
  }

  function blockGround(block) {
    const { x, y, size, kind, plant } = block;
    rect(x, y, size, size, PALETTE.curb);
    rect(x + 2, y + 2, size - 4, size - 4, PALETTE.sidewalk);
    for (let offset = 12; offset < size; offset += 14) {
      rect(x + offset, y + 2, 0.8, 7, '#ae8c774f');
      rect(x + 2, y + offset, 7, 0.8, '#ae8c774f');
    }
    if (kind !== 'buildings') {
      rect(x + 11, y + 11, size - 22, size - 22, PALETTE.garden);
      rect(x + 48, y + 11, 27, size - 22, '#f1d9b1');
      rect(x + 11, y + 140, size - 22, 24, '#f1d9b1');
    }
    if (kind === 'observatory') {
      const points = [[x + 25, y + 78], [x + 41, y + 54], [x + 65, y + 64], [x + 80, y + 43]];
      line(points, '#fbefc5', 2);
      for (const [sx, sy] of points) star(sx, sy, 6, '#fff2bb');
      ellipse(x + 46, y + 112, 24, 17, '#f5e3bd');
      ellipse(x + 46, y + 112, 20, 13, '#6db7b0');
      star(x + 46, y + 112, 10, '#fff2bb');
      label('OBSERVATORY', x + 108, y + 179, '600 10px system-ui', PALETTE.ink, 'center');
    } else if (kind === 'garden') {
      star(x + 125, y + 100, 32, '#f4dfb0');
      tree(x + 142, y + 48, plant);
    }
    tree(x + 88, y + 24, plant);
    tree(x + 24, y + 173, 1 - plant);
    tree(x + 173, y + 174, plant);
  }

  function drawBuilding(building) {
    const { x, y, width: w, depth: d, height: h, kind, style } = building;
    rect(x + 7, y + 6, w + h * 0.45, d + h * 0.28, '#5542583c');
    if (kind === 'observatory') {
      rect(x, y + 9, w, d - 9, '#85829e');
      rect(x, y + 5, w, d - 17, '#eadad7');
      for (let i = 8; i < w - 5; i += 13) rect(x + i, y + d - 11, 6, 6, '#3e6179');
      ellipse(x + w / 2, y + 32, 38, 32, '#646382');
      ellipse(x + w / 2, y + 25, 38, 31, '#c1bbd6');
      ellipse(x + w / 2 - 8, y + 17, 27, 20, '#e2d7e9');
      line([[x + 27, y + 48], [x + 41, y + 23], [x + 53, y + 2]], '#766c99', 9);
      star(x + w / 2, y + 67, 7, '#a27187');
      return;
    }

    rect(x, y, w, d, walls[style]);
    for (let offset = 7; offset < w - 6; offset += 12) {
      rect(x + offset, y + d - h * 0.32, 6, 4, '#463f51');
    }
    const roofDepth = d - h * 0.55;
    rect(x, y - h * 0.25, w, roofDepth, roofs[style]);
    rect(x + 2, y - h * 0.25 + 2, w - 4, 2, '#fff6dc99');
    rect(x + 4, y - h * 0.25 + 5, 2, roofDepth - 8, '#fff6dc76');
    rect(x + w - 21, y + 9, 12, 9, '#53516b55');
    rect(x + w - 23, y + 7, 12, 8, '#eee0cb');
    if (style === 3) star(x + w / 2, y + roofDepth / 2, 9, '#fff1c8');
  }

  function drawCar({ x, y, heading, color, police, flash }, active) {
    const halfLength = CAR.length / 2;
    const halfWidth = CAR.width / 2;
    ellipse(x + 3, y + 4, 18, 10, '#423b4e60');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    for (const axle of [-13, 13]) {
      rect(axle - 3, -halfWidth - 1, 6, CAR.width + 2, '#27374b');
    }
    ctx.beginPath();
    ctx.roundRect(-halfLength, -halfWidth, CAR.length, CAR.width, 4);
    ctx.fillStyle = police ? '#222b38' : color;
    ctx.fill();
    if (police) rect(-9, -9, 19, 18, '#fff6e8');
    rect(-11, -7, 20, 14, '#35495d');
    rect(-6, -6, 11, 12, police ? '#fff6e8' : color);
    rect(-5, -5, 9, 2, '#fff1d799');
    rect(8, -7, 2, 14, '#7fabb4');
    if (police) {
      if (flash) ellipse(0, -7, 9, 6, '#ff375d55');
      else ellipse(0, 7, 9, 6, '#378dff66');
      rect(-3, -8, 6, 16, '#263348');
      rect(-2, -7, 4, 6, flash ? '#ff4160' : '#a92f52');
      rect(-2, 1, 4, 6, flash ? '#315eae' : '#59adff');
    }
    for (const side of [-6, 4]) {
      rect(17, side, 3, 2, active ? '#fffad3' : '#eadabf');
      rect(-20, side, 2, 2, '#8e3b4d');
    }
    ctx.restore();
  }

  function draw(world, player, { cars, active }, { traffic, pedestrians }, { canEnter, wanted, patrols, mission, health, cash, titleCamera }) {
    const target = active ?? player;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    rect(0, 0, canvas.width, canvas.height, PALETTE.backdrop);
    ctx.setTransform(scale, 0, 0, scale, insetX, insetY);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEW.width, VIEW.height);
    ctx.clip();
    const { x: cameraX, y: cameraY } = cameraPosition(world, titleCamera ?? target);
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    roads(world);
    coast(world);
    for (const block of world.blocks) blockGround(block);
    const visible = world.buildings.filter(({ x, y, width, depth, height }) =>
      x + width + height >= cameraX && x <= cameraX + VIEW.width &&
      y + depth + height >= cameraY && y - height <= cameraY + VIEW.height);
    const layers = visible.map((building) => ({
      depth: building.y + building.depth,
      draw: () => drawBuilding(building),
    }));
    const inView = ({ x, y }, margin) => x >= cameraX - margin &&
      x <= cameraX + VIEW.width + margin && y >= cameraY - margin &&
      y <= cameraY + VIEW.height + margin;
    for (const car of [...cars, ...traffic, ...patrols]) {
      if (inView(car, CAR.length)) {
        layers.push({ depth: car.y, draw: () => drawCar(car, car === active) });
      }
    }
    for (const person of pedestrians) {
      if (inView(person, 48)) layers.push({ depth: person.y, draw: () => drawCharacter(ctx, person) });
    }
    if (!active) layers.push({ depth: player.y, draw: () => drawCharacter(ctx, player) });
    layers.sort((a, b) => a.depth - b.depth);
    for (const layer of layers) layer.draw();
    ctx.restore();
    if (titleCamera) {
      drawTitleBackdrop(ctx);
      ctx.restore();
      return;
    }
    if (mission?.marker) drawMissionMarker(ctx, mission.marker, { x: cameraX, y: cameraY }, target);
    drawHud(ctx, world, target, { driving: Boolean(active), canEnter, wanted, mission, health, cash });
    if (wanted.busted) {
      rect(0, 0, VIEW.width, VIEW.height, '#1c2236dc');
      label('BUSTED', VIEW.width / 2, VIEW.height / 2, 'bold 62px system-ui', '#ff7282', 'center');
    }
    ctx.restore();
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
