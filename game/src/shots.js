// Each pose uses the same camera and renderer as free exploration.
export function stageShot(name, world) {
  if (name === 'observatory') return world.locations.plaza;
  if (name === 'coast') return world.locations.coast;
  return world.spawn;
}
