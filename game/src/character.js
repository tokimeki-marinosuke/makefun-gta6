// Original sprite drawn around the player's feet in world coordinates.
export function drawCharacter(ctx, player) {
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
  ellipse(2, 1, 15, 7, '#44334b50');
  ctx.scale(player.facing, 1);
  const hair = '#573458';
  const navy = '#353958';
  const skin = '#ffdbba';
  for (const side of [-1, 1]) {
    const footY = side * bob * 2;
    ellipse(side * 5, -4 + footY, 3.4, 6.5, '#fff3de');
    ellipse(side * 5 + 1, footY, 4.5, 2.8, navy);
  }
  ellipse(-12, -23, 6.5, 14, hair);
  ellipse(12, -23, 6.5, 14, hair);
  ellipse(-13, -26, 3, 7, '#9a587b');
  ellipse(13, -26, 3, 7, '#9a587b');
  ellipse(-9, -15, 3.3, 5, skin);
  ellipse(9, -15, 3.3, 5, skin);
  shape([[-7, -20], [7, -20], [11, -8], [4, -6], [-10, -8]], navy);
  ellipse(0, -20, 9, 7, '#fff2dc');
  shape([[-8, -24], [8, -24], [1, -16]], '#5c668c');
  shape([[-5, -20], [0, -18], [5, -20], [4, -15], [0, -17], [-4, -15]], '#eb726e');
  ellipse(0, -32, 14, 13, hair);
  ellipse(1, -29, 11, 9, skin);
  shape([[-12, -31], [-10, -39], [-1, -43], [9, -39], [12, -33], [6, -33], [0, -30], [1, -36], [-6, -31]], hair);
  for (const x of [-3, 6]) {
    ellipse(x, -28, 1.5, 2.5, navy);
    ellipse(x + 0.3, -29, 0.55, 0.65, '#fff9e6');
    ellipse(x, -25, 1.8, 0.75, '#f89596');
  }
  shape([[-10, -41], [-8, -37], [-4, -36], [-8, -35], [-10, -31], [-11, -35], [-15, -36], [-11, -37]], '#ffe08b');
  ctx.restore();
}
