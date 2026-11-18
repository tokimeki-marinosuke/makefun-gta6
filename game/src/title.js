import { drawCharacter } from './character.js';
import { VIEW } from './config.js';

export function drawTitleBackdrop(ctx) {
  const shade = ctx.createLinearGradient(0, 0, VIEW.width, 0);
  shade.addColorStop(0, '#101b32ed');
  shade.addColorStop(0.56, '#101b32c9');
  shade.addColorStop(1, '#101b3244');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.save();
  ctx.translate(746, 408);
  ctx.scale(6, 6);
  drawCharacter(ctx, { x: 0, y: 0, facing: 1, stride: 0 });
  ctx.restore();
}

export function showTitle(menu, hasSave, start) {
  const continueButton = menu.querySelector('#continue');
  const newButton = menu.querySelector('#new-game');
  continueButton.hidden = !hasSave;
  menu.hidden = false;

  function begin(resume) {
    window.removeEventListener('keydown', onKey);
    menu.hidden = true;
    start(resume);
  }

  function onKey(event) {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
        ['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key) ||
        /^F\d+$/.test(event.key)) return;
    if (event.target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    begin(hasSave);
  }

  continueButton.onclick = () => begin(true);
  newButton.onclick = () => begin(false);
  menu.onclick = (event) => {
    if (event.target === menu) begin(hasSave);
  };
  window.addEventListener('keydown', onKey);
}
