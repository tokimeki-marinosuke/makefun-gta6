export const PROTAGONIST_SCALE = 1.12;

// Original sprite drawn around the character's feet in world coordinates.
export function drawCharacter(ctx, player, { scale = 1, outfit = '#353958' } = {}) {
  const bob = Math.sin(player.stride * Math.PI * 4);
  function ellipse(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function shape(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [index, [x, y]] of points.entries()) {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(scale, scale);
  ellipse(2, 1, 15, 7, '#44334b50');
  ctx.scale(player.facing, 1);
  if (player.down) ctx.rotate(Math.PI / 2);
  const appearance = player.appearance;
  const hair = appearance?.hair ?? '#573458';
  const clothing = appearance?.outfit ?? outfit;
  const skin = appearance?.skin ?? '#ffdbba';
  for (const side of [-1, 1]) {
    const footY = side * bob * 2;
    ellipse(side * 5, -4 + footY, 3.4, 6.5, '#fff3de');
    ellipse(side * 5 + 1, footY, 4.5, 2.8, clothing);
  }
  if (!appearance || appearance.style === 'bob') {
    const length = appearance ? 8 : 14;
    ellipse(-12, -23, 6.5, length, hair);
    ellipse(12, -23, 6.5, length, hair);
    if (!appearance) {
      ellipse(-13, -26, 3, 7, '#9a587b');
      ellipse(13, -26, 3, 7, '#9a587b');
    }
  }
  if (appearance?.style === 'bun') ellipse(-8, -43, 6, 6, hair);
  ellipse(-9, -15, 3.3, 5, skin);
  if (player.swing > 7) {
    shape([[7, -20], [21, -19], [21, -13], [7, -13]], clothing);
    ellipse(23, -16, 4, 3, skin);
  } else {
    ellipse(9, -15, 3.3, 5, skin);
  }
  shape([[-7, -20], [7, -20], [11, -8], [4, -6], [-10, -8]], clothing);
  ellipse(0, -20, 9, 7, '#fff2dc');
  shape([[-8, -24], [8, -24], [1, -16]], '#5c668c');
  shape([[-5, -20], [0, -18], [5, -20], [4, -15], [0, -17], [-4, -15]], '#eb726e');
  ellipse(0, -32, 14, 13, hair);
  ellipse(1, -29, 11, 9, skin);
  shape([[-12, -31], [-10, -39], [-1, -43], [9, -39], [12, -33], [6, -33], [0, -30], [1, -36], [-6, -31]], hair);
  for (const x of [-3, 6]) {
    ellipse(x, -28, 1.5, 2.5, appearance?.outfit ?? '#353958');
    ellipse(x + 0.3, -29, 0.55, 0.65, '#fff9e6');
    ellipse(x, -25, 1.8, 0.75, '#f89596');
  }
  if (!appearance) shape([[-10, -41], [-8, -37], [-4, -36], [-8, -35], [-10, -31], [-11, -35], [-15, -36], [-11, -37]], '#ffe08b');
  ctx.restore();
}
