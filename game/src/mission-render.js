import { VIEW } from './config.js';

const gold = '#ffdc83';
const ink = '#1e293e';
const paper = '#fff2d7';
const titleFont = 'bold 18px system-ui, sans-serif';
const bodyFont = '16px system-ui, sans-serif';

function text(ctx, value, x, y, font, color = paper) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function wrap(ctx, value, width) {
  const lines = [];
  let line = '';
  for (const char of value) {
    if (line && ctx.measureText(line + char).width > width) {
      lines.push(line);
      line = '';
    }
    line += char;
  }
  return [...lines, line];
}

export function drawMissionMarker(ctx, marker, camera, target) {
  const x = marker.x - camera.x;
  const y = marker.y - camera.y;
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.fillStyle = gold;
  ctx.lineWidth = 2;
  if (x >= 24 && x <= VIEW.width - 24 && y >= 138 && y <= VIEW.height - 30) {
    const beam = ctx.createLinearGradient(x, y - 65, x, y);
    beam.addColorStop(0, '#ffdc8300');
    beam.addColorStop(1, '#ffdc8388');
    ctx.fillStyle = beam;
    ctx.fillRect(x - 6, y - 65, 12, 65);
    ctx.beginPath();
    ctx.ellipse(x, y, 19, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.translate(Math.max(24, Math.min(VIEW.width - 24, x)),
      Math.max(138, Math.min(VIEW.height - 145, y)));
    ctx.rotate(Math.atan2(marker.y - target.y, marker.x - target.x));
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-9, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.fill();
  }
  ctx.restore();
}

export function drawMissionMapMarker(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.strokeRect(-4, -4, 8, 8);
  ctx.restore();
}

export function drawMissionHud(ctx, { title, objective, story, ending }, panelY) {
  ctx.save();
  ctx.textAlign = 'left';
  if (title) {
    const objectiveFont = '600 21px system-ui, sans-serif';
    ctx.font = objectiveFont;
    const width = Math.max(240, Math.ceil(ctx.measureText(objective).width) + 28);
    ctx.fillStyle = '#27374bed';
    ctx.fillRect(18, panelY, width, 61);
    text(ctx, title, 32, panelY + 23, titleFont, gold);
    text(ctx, objective, 32, panelY + 49, objectiveFont);
  }
  if (story) {
    const x = 18;
    const width = VIEW.width - 36;
    ctx.font = bodyFont;
    const lines = wrap(ctx, story.text, width - 32);
    const height = 32 + 20 * lines.length;
    const y = VIEW.height - 50 - height;
    ctx.fillStyle = '#202d43e8';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = gold;
    ctx.fillRect(x, y, 3, height);
    text(ctx, story.heading, x + 16, y + 22, titleFont, gold);
    for (const [i, line] of lines.entries()) text(ctx, line, x + 16, y + 43 + 20 * i, bodyFont);
    ctx.textAlign = 'right';
    text(ctx, 'SPACE で送る', x + width - 16, y + 22, '600 13px system-ui, sans-serif');
  }
  if (ending) {
    ctx.fillStyle = '#101b39f2';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    for (let i = 0; i < 74; i += 1) {
      ctx.fillStyle = i % 4 === 0 ? gold : '#a4b8e3';
      ctx.fillRect((i * 173 + 59) % VIEW.width, (i * i * 31 + 19) % VIEW.height, 2, 2);
    }
    for (const [x, y, length] of [[326, 91, 80], [571, 127, 125], [683, 63, 55]]) {
      const streak = ctx.createLinearGradient(x, y, x + length, y - length * 0.44);
      streak.addColorStop(0, gold);
      streak.addColorStop(1, '#ffdc8300');
      ctx.strokeStyle = streak;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y - length * 0.44);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    const center = VIEW.width / 2;
    text(ctx, '流星群が見られた', center, 271, 'bold 44px system-ui, sans-serif', gold);
    text(ctx, 'ミナが数えるのをやめるころには、部のみんなも黙って空を見上げていた。', center, 319, bodyFont);
    text(ctx, 'SPACE で自由走行へ', center, 405, titleFont);
  }
  ctx.restore();
}
