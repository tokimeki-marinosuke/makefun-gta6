import { CITY, CITY_GRID, PALETTE, VIEW } from './config.js';
import { drawCharacter } from './character.js';

const { columns, rows, tile, road } = CITY_GRID;
const roofs = ['#e8a68b', '#f1d3a1', '#c1d7c6', '#c9b5cd', '#d9b394'];
const walls = ['#a65f59', '#b88a62', '#729b91', '#8b779b', '#ab795f'];

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

  function hud(world, player) {
    const area = player.y >= world.cityEnd ? 'Sundial Beach'
      : Math.hypot(player.x - world.locations.plaza.x, player.y - world.locations.plaza.y) < 145
        ? 'Meridian Observatory' : 'Meridian District';
    rect(18, 17, 210, 62, '#27374bed');
    rect(18, 17, 3, 62, '#ffd388');
    star(39, 41, 8, '#ffd388');
    label(CITY, 55, 47, 'bold 20px system-ui', '#fff1d7');
    label(area, 36, 66, '13px system-ui', '#f7dfbe');

    const map = { x: VIEW.width - 128, y: 18, w: 110, h: 103 };
    rect(map.x - 4, map.y - 4, map.w + 8, map.h + 8, '#27374bed');
    rect(map.x, map.y, map.w, map.h, '#bcab97');
    const mx = (x) => map.x + x / world.width * map.w;
    const my = (y) => map.y + y / world.height * map.h;
    rect(map.x, my(world.cityEnd), map.w, my(world.waterline) - my(world.cityEnd), PALETTE.sand);
    rect(map.x, my(world.waterline), map.w, my(world.height) - my(world.waterline), PALETTE.sea);
    for (const block of world.blocks) {
      rect(mx(block.x), my(block.y), block.size / world.width * map.w,
        block.size / world.height * map.h, block.kind === 'buildings' ? '#596878' : '#799581');
    }
    star(mx(world.locations.plaza.x + 75), my(world.locations.plaza.y), 5, '#ffe39c');
    ellipse(mx(player.x), my(player.y), 4, 4, PALETTE.ink);
    ellipse(mx(player.x), my(player.y), 2.4, 2.4, '#fff4d8');

    rect(18, VIEW.height - 42, 187, 24, '#27374bed');
    label('WASD / ARROW KEYS', 29, VIEW.height - 26, '600 12px system-ui', '#fff1d7');
  }

  function draw(world, player) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    rect(0, 0, canvas.width, canvas.height, PALETTE.backdrop);
    ctx.setTransform(scale, 0, 0, scale, insetX, insetY);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEW.width, VIEW.height);
    ctx.clip();
    const cameraX = Math.max(0, Math.min(player.x - VIEW.width / 2, world.width - VIEW.width));
    const cameraY = Math.max(0, Math.min(player.y - VIEW.height / 2, world.height - VIEW.height));
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    roads(world);
    coast(world);
    for (const block of world.blocks) blockGround(block);
    const visible = world.buildings.filter(({ x, y, width, depth, height }) =>
      x + width + height >= cameraX && x <= cameraX + VIEW.width &&
      y + depth + height >= cameraY && y - height <= cameraY + VIEW.height);
    visible.sort((a, b) => a.y + a.depth - b.y - b.depth);
    for (const building of visible) {
      if (building.y + building.depth > player.y) break;
      drawBuilding(building);
    }
    drawCharacter(ctx, player);
    for (const building of visible) {
      if (building.y + building.depth > player.y) drawBuilding(building);
    }
    ctx.restore();
    hud(world, player);
    ctx.restore();
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
