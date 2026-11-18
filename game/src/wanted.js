const crimes = { theft: 1, vehicleRecovery: 1, traffic: 1, pedestrian: 2, melee: 1 };
const searchFrames = 420;
export const ARREST_FRAMES = 150;

export function createWanted() {
  return { stars: 0, unseen: 0, arrest: 0, busted: 0, lastSeen: null };
}

export function reportCrime(wanted, crime, { x, y }) {
  wanted.stars = Math.min(5, wanted.stars + crimes[crime]);
  wanted.unseen = 0;
  wanted.lastSeen = { x, y };
}

export function updateWanted(wanted, target, visible, restrained) {
  if (!wanted.stars) return;
  wanted.arrest = restrained ? wanted.arrest + 1 : Math.max(0, wanted.arrest - 2);
  if (wanted.arrest >= ARREST_FRAMES) {
    wanted.busted = 120;
    return;
  }
  if (visible) {
    wanted.lastSeen = { x: target.x, y: target.y };
    wanted.unseen = 0;
  } else if (++wanted.unseen >= searchFrames) {
    wanted.stars -= 1;
    wanted.unseen = 0;
    if (!wanted.stars) wanted.arrest = 0;
  }
}
