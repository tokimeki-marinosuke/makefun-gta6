const horizontal = [['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']];
const vertical = [['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']];
const gameKeys = new Set([...horizontal.flat(), ...vertical.flat(), 'KeyE', 'KeyF']);

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  window.addEventListener('keydown', (event) => {
    if (!gameKeys.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    if ((event.code === 'KeyE' || event.code === 'KeyF') && !event.repeat && !held.has(event.code)) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  function clear() {
    held.clear();
    pressed.clear();
  }
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
  });

  function axis([negative, positive]) {
    return Number(positive.some((key) => held.has(key))) -
      Number(negative.some((key) => held.has(key)));
  }

  return {
    direction: () => ({ x: axis(horizontal), y: axis(vertical) }),
    takeInteract: () => pressed.delete('KeyE'),
    takeMelee: () => pressed.delete('KeyF'),
  };
}
