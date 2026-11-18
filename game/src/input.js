const horizontal = [['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']];
const vertical = [['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']];
const gameKeys = new Set([...horizontal.flat(), ...vertical.flat(), 'KeyE']);

export function createInput() {
  const held = new Set();
  let interact = false;
  window.addEventListener('keydown', (event) => {
    if (!gameKeys.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    if (event.code === 'KeyE' && !event.repeat && !held.has(event.code)) interact = true;
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  function clear() {
    held.clear();
    interact = false;
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
    takeInteract() {
      const pressed = interact;
      interact = false;
      return pressed;
    },
  };
}
