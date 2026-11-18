import { CITY_GRID, PALETTE, VIEW } from './config.js';
import { districtAt, districts } from './districts.js';
import { drawCharacter, PROTAGONIST_SCALE } from './character.js';
import { drawMissionMarker } from './mission-render.js';
import { CAR } from './vehicles.js';
import { drawHud } from './hud.js';
import { drawTitleBackdrop } from './title.js';

const { columns, rows, tile, road } = CITY_GRID;
const protagonistStyle = { scale: PROTAGONIST_SCALE, outfit: '#ad287f' };

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

  function palm(x, y) {
    ellipse(x + 7, y + 5, 14, 6, '#58665560');
    line([[x, y + 6], [x + 1, y - 5], [x - 3, y - 15]], '#8d6753', 4);
    for (const [dx, dy] of [[-16, 2], [-13, -9], [-3, -15], [12, -10], [16, 2], [5, 10]]) {
      line([[x - 3, y - 15], [x + dx * 0.6, y - 19 + dy * 0.5],
        [x + dx, y - 15 + dy]], dy < 0 ? '#649c71' : '#3e826b', 3);
    }
  }

  function sundial(x, y, color) {
    ellipse(x + 6, y + 6, 42, 32, '#986d5960');
    ellipse(x, y, 42, 32, '#fff1ce');
    ellipse(x, y, 37, 27, color);
    for (let i = 0; i < 12; i += 1) {
      const angle = i * Math.PI / 6;
      ellipse(x + 32 * Math.cos(angle), y + 23 * Math.sin(angle), 1.6, 1.6, '#fff1ce');
    }
    star(x, y, 23, '#f9d687');
    ctx.fillStyle = '#31465c';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 5);
    ctx.lineTo(x + 5, y - 19);
    ctx.lineTo(x + 12, y + 5);
    ctx.fill();
    label('N', x, y - 23, 'bold 8px system-ui', '#fff1ce', 'center');
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
    const { promenade, trim, sundial: dialColor } = districts.resort.props;
    rect(0, cityEnd, width, 29, promenade);
    rect(0, cityEnd + 2, width, 2, trim);
    rect(0, cityEnd + 25, width, 3, trim);
    for (let x = 21; x < width; x += 48) {
      rect(x, cityEnd + 8, 1, 13, '#cbb28f');
      palm(x, cityEnd + 42 + (x % 3) * 6);
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
    sundial(world.locations.coast.x, world.locations.coast.y, dialColor);
  }

  function roads(world) {
    const half = road / 2;
    // Each half of a shared street takes its surface from the adjacent block.
    for (const block of world.blocks) {
      const { x, y, district } = block;
      const { surface } = districts[district].road;
      const right = block.column === columns - 1 ? half : 0;
      const bottom = block.row === rows - 1 ? half : 0;
      rect(x - half, y - half, tile + right, tile + bottom, surface);
    }
    for (let row = 0; row <= rows; row += 1) {
      for (let column = 0; column <= columns; column += 1) {
        const x = column * tile;
        const y = row * tile;
        const { marking, dash } = districts[districtAt(Math.min(column, columns - 1), Math.min(row, rows - 1))].road;
        for (let offset = 43; offset <= tile - 43; offset += 29) {
          if (column < columns) rect(x + offset, y - 1, dash, 2, marking);
          if (row < rows) rect(x - 1, y + offset, 2, dash, marking);
        }
        for (let stripe = -19; stripe <= 19; stripe += 7) {
          if (column < columns) rect(x + 27, y + stripe, 10, 3, marking);
          if (column > 0) rect(x - 37, y + stripe, 10, 3, marking);
          if (row < rows) rect(x + stripe, y + 27, 3, 10, marking);
          if (row > 0) rect(x + stripe, y - 37, 3, 10, marking);
        }
      }
    }
  }

  function blockGround(block) {
    const { x, y, size, kind, plant, district } = block;
    const { curb, ground, garden, road: street, props } = districts[district];
    const shoulder = street.shoulder ?? 0;
    rect(x, y, size, size, street.surface);
    ctx.strokeStyle = street.edge;
    ctx.lineWidth = district === 'downtown' ? 2 : 1;
    const edgeInset = shoulder ? shoulder - 2 : -2;
    ctx.strokeRect(x + edgeInset, y + edgeInset, size - 2 * edgeInset, size - 2 * edgeInset);
    rect(x + shoulder, y + shoulder, size - 2 * shoulder, size - 2 * shoulder, curb);
    rect(x + shoulder + 2, y + shoulder + 2, size - 2 * shoulder - 4, size - 2 * shoulder - 4, ground);

    if (district === 'residential') {
      for (const [lotX, lotY] of districts.residential.buildings.lots) {
        rect(x + lotX - 6, y + lotY - 6, 53, 57, garden);
        rect(x + lotX + 14, y + lotY + 32, 6, 19, curb);
      }
    }
    if (district === 'academy') {
      rect(x + 11, y + 11, size - 22, size - 22, garden);
      const pathX = kind === 'observatory' ? 48 : 86;
      rect(x + pathX, y + 11, 27, size - 22, curb);
      rect(x + 11, y + 140, size - 22, 24, curb);
      if (kind !== 'observatory') {
        const [mx, my] = props.monument;
        ellipse(x + mx, y + my, 18, 14, curb);
        ellipse(x + mx, y + my, 14, 10, '#477d83');
        star(x + mx, y + my - 1, 11, '#fff2bb');
      }
    }
    for (const [tx, ty] of props?.trees ?? []) tree(x + tx, y + ty, plant);
    for (const [px, py] of props?.palms ?? []) palm(x + px, y + py);
    if (kind === 'observatory') {
      const points = [[x + 25, y + 78], [x + 41, y + 54], [x + 65, y + 64], [x + 80, y + 43]];
      line(points, '#fbefc5', 2);
      for (const [sx, sy] of points) star(sx, sy, 6, '#fff2bb');
      ellipse(x + 46, y + 112, 24, 17, '#f5e3bd');
      ellipse(x + 46, y + 112, 20, 13, '#6db7b0');
      star(x + 46, y + 112, 10, '#fff2bb');
      label('OBSERVATORY', x + 108, y + 179, '600 10px system-ui', PALETTE.ink, 'center');
    }
  }

  function crane(x, y, color) {
    line([[x - 11, y + 8], [x + 6, y + 8], [x, y - 59], [x - 11, y + 8]], color, 4);
    line([[x - 34, y - 43], [x, y - 60], [x + 51, y - 43], [x - 34, y - 43]], color, 3);
    line([[x + 43, y - 43], [x + 43, y - 13], [x + 38, y - 10]], color, 2);
    for (let offset = -33; offset < 46; offset += 12) {
      rect(x + offset, y - 44, 7, 3, '#f4c661');
    }
  }

  function drawBuilding(building) {
    const { x, y, width: w, depth: d, height: h, kind, style, district } = building;
    const { buildings: plan, props } = districts[district];
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

    if (kind === 'container') {
      rect(x, y, w, d, '#424957');
      rect(x, y, w, d - 3, props.containerColors[style]);
      for (let offset = 3; offset < w; offset += 4) rect(x + offset, y + 1, 1, d - 5, '#24324440');
      return;
    }

    const rise = Math.round(h / 3);
    const roofY = y - rise;
    const roofDepth = d - rise;
    rect(x, y, w, d, plan.walls[style]);
    rect(x, roofY, w, roofDepth, plan.roofs[style]);
    rect(x + 2, roofY + 2, w - 4, 2, '#fff6dc80');

    if (plan.style === 'warehouse') {
      for (let offset = 12; offset < w - 6; offset += 15) {
        rect(x + offset, roofY + 7, 2, roofDepth - 12, plan.accent);
      }
      for (let offset = 8; offset < w - 14; offset += 24) {
        rect(x + offset, y + d - 10, 15, 10, '#283b49');
        rect(x + offset, y + d - 2, 15, 2, '#ffda64');
      }
    } else if (plan.style === 'house' || plan.style === 'villa') {
      const ridge = roofY + roofDepth / 2;
      rect(x + 2, ridge, w - 4, roofDepth / 2, '#46304d24');
      line([[x + 3, ridge], [x + w - 3, ridge]], plan.accent, 2);
      rect(x + w / 2 - 4, y + d - 7, 8, 7, '#594f5c');
      if (plan.style === 'villa') {
        rect(x + 3, y + d - 13, w - 6, 4, plan.accent);
        for (let offset = 7; offset < w - 4; offset += 9) rect(x + offset, y + d - 13, 3, 4, plan.roofs[style]);
      }
    } else {
      rect(x + 7, roofY + 8, w - 14, roofDepth - 16, '#293b5128');
      for (let offset = 8; offset < w - 5; offset += 11) {
        rect(x + offset, y + d - rise, 5, 3, plan.accent);
      }
      if (plan.style === 'tower') {
        const signY = y + d - 15;
        rect(x + 6, signY - 2, w - 12, 16, '#e580e55c');
        rect(x + 9, signY, w - 18, 12, '#242137');
        star(x + 18, signY + 6, 5, '#ffa5fb');
        label('ASTER', x + 26, signY + 9, 'bold 8px system-ui', plan.accent);
      }
    }
  }

  function drawPlayerRing(x, y, rx, ry, opacity) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = '#ffc47a';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.globalAlpha = opacity * 2;
    ctx.strokeStyle = '#fff0b8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawCar({ x, y, heading, color, police, flash }, active) {
    const halfLength = CAR.length / 2;
    const halfWidth = CAR.width / 2;
    ellipse(x + 3, y + 4, 18, 10, '#423b4e60');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    if (active) drawPlayerRing(0, 0, halfLength + 6, halfWidth + 6, 0.25);
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
    const harborCrane = districts.harbor.props.crane;
    const craneBlock = world.blocks[harborCrane.row * columns + harborCrane.column];
    const craneX = craneBlock.x + harborCrane.x;
    const craneY = craneBlock.y + harborCrane.y;
    layers.push({ depth: craneBlock.y + 120, draw: () => crane(craneX, craneY, harborCrane.color) });
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
    if (!active) {
      layers.push({ depth: player.y, draw: () => {
        const pulse = Math.sin(player.stride * Math.PI);
        drawPlayerRing(player.x, player.y, 18 + pulse, 9 + 0.5 * pulse, 0.34 + 0.08 * pulse);
        drawCharacter(ctx, player, protagonistStyle);
      } });
    }
    layers.sort((a, b) => a.depth - b.depth);
    for (const layer of layers) layer.draw();
    ctx.restore();
    if (titleCamera) {
      drawTitleBackdrop(ctx);
      ctx.restore();
      return;
    }
    if (mission?.marker) drawMissionMarker(ctx, mission.marker, { x: cameraX, y: cameraY }, target);
    const markerX = target.x - cameraX;
    const markerY = target.y - cameraY - (active ? CAR.length / 2 + 14 : 45 * PROTAGONIST_SCALE + 13);
    star(markerX, markerY, 11, '#47314c');
    star(markerX, markerY, 8, '#ffe08b');
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
