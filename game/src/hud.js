import { CITY, PALETTE, VIEW } from './config.js';
import { districtAtPosition, districts } from './districts.js';
import { drawMissionHud, drawMissionMapMarker } from './mission-render.js';
import { ARREST_FRAMES } from './wanted.js';

export function drawHud(ctx, world, player, { driving, canEnter, wanted, mission, health, cash }) {
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

  const marker = mission?.marker;
  const area = districtAtPosition(player).name;
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
      block.size / world.height * map.h, districts[block.district].mapColor);
  }
  star(mx(world.locations.plaza.x + 75), my(world.locations.plaza.y), 6.5, PALETTE.ink);
  star(mx(world.locations.plaza.x + 75), my(world.locations.plaza.y), 5, '#ffe39c');
  if (marker) drawMissionMapMarker(ctx, mx(marker.x), my(marker.y));
  ellipse(mx(player.x), my(player.y), 4, 4, PALETTE.ink);
  ellipse(mx(player.x), my(player.y), 2.4, 2.4, '#fff4d8');

  rect(map.x - 4, 130, map.w + 8, 53, '#27374bed');
  label('$' + cash, map.x + 6, 149, 'bold 15px system-ui', '#ffd388');
  label('HP ' + health, map.x + 6, 166, 'bold 11px system-ui', '#fff1d7');
  rect(map.x + 6, 172, 98, 4, '#566176');
  rect(map.x + 6, 172, 98 * health / 100, 4, health <= 25 ? '#ff7282' : '#80dfb0');
  if (wanted.stars) {
    const center = VIEW.width / 2;
    rect(center - 80, 17, 160, 36, '#27374bed');
    for (let i = 0; i < 5; i += 1) {
      star(center + (i - 2) * 28, 35, 11, i < wanted.stars ? '#ffd388' : '#6c7483');
    }
    if (wanted.arrest) {
      rect(center - 80, 55, 160, 5, '#27374bed');
      rect(center - 80, 55, 160 * wanted.arrest / ARREST_FRAMES, 5, '#ff6179');
    }
  }

  if (canEnter !== undefined) {
    const actions = '  ·  F SHOVE';
    const controls = driving ? 'WASD / ARROW KEYS  ·  E EXIT'
      : (canEnter ? 'WASD / ARROW KEYS  ·  E ENTER' : 'WASD / ARROW KEYS') + actions;
    ctx.font = '600 12px system-ui';
    rect(18, VIEW.height - 42, ctx.measureText(controls).width + 22, 24, '#27374bed');
    label(controls, 29, VIEW.height - 26, '600 12px system-ui', '#fff1d7');
  }
  if (mission) drawMissionHud(ctx, mission);
}
