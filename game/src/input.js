const horizontal = [['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']];
const vertical = [['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']];
const movementKeys = new Set([...horizontal.flat(), ...vertical.flat()]);

export function createInput() {
  const held = new Set();
  window.addEventListener('keydown', (event) => {
    if (!movementKeys.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) held.clear();
  });

  function axis([negative, positive]) {
    return Number(positive.some((key) => held.has(key))) -
      Number(negative.some((key) => held.has(key)));
  }

  return { direction: () => ({ x: axis(horizontal), y: axis(vertical) }) };
}
