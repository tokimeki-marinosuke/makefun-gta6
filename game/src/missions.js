import { playSound } from './sound.js';
import { reportCrime } from './wanted.js';

const missions = [
  {
    title: '天文台へ急げ',
    objective: 'メリディアン天文台に向かう',
    start: '天文部のミナは、今夜の流星群を部のみんなに見せたい。まずは天文台で待つ部長のナギに会おう。',
    complete: 'ナギ「海岸に運ぶはずの望遠鏡が、回収業者の車に積まれちゃった。車はまだ天文台の北側にいるよ」',
    reward: 100,
  },
  {
    title: '望遠鏡を取り戻せ',
    objective: '目印のついた回収車に E で乗る',
    start: 'ミナ「流星が来る前に取り返そう。あの車ごと持ってくれば、鏡筒を抱えて走らずにすむ」',
    complete: 'ナギ「鏡筒は無事！ 部のみんなと先に海岸へ運ぶね。待って、通りの向こうにまたパトカーが」',
    reward: 250,
  },
  {
    title: '星降る夜の逃走劇',
    objective: '手配度を消して、日時計海岸の観測地点へ',
    start: '車の回収を知らせる無線が入り、巡回が戻ってきた。ミナは追跡を振り切り、みんなの待つ海岸を目指す。',
    complete: 'ナギ「ミナ、こっち！ 最初の一筋は、まだ誰も見てないよ」',
    reward: 400,
  },
];

const introFrames = 360;
const completionFrames = 240;
const arrived = (target, point) => Math.hypot(target.x - point.x, target.y - point.y) <= 32;

export const MISSION_COUNT = missions.length;

export function createMissions(save) {
  const completed = save?.completed.length ?? 0;
  return {
    progress: missions.map((_, index) => index < completed ? '完了' : '未開始'),
    index: completed,
    cash: save?.cash ?? 0,
    story: null,
    car: null,
    ending: false,
  };
}

// An arrest rebuilds the city, so restart the active mission with its initial setup.
export function startMission(state, world, vehicles, wanted, target) {
  const mission = missions[state.index];
  if (!mission || state.progress[state.index] === '完了') return;
  state.progress[state.index] = '進行中';
  playSound('missionStart');
  state.story = { heading: mission.title, text: mission.start, frames: introFrames };
  if (state.index === 1) {
    const { x, y } = world.locations.plaza;
    state.car = { x, y: y - 79, heading: Math.PI / 2, color: '#654ba8', speed: 0 };
    vehicles.cars.push(state.car);
  }
  if (state.index === 2) reportCrime(wanted, 'vehicleRecovery', target);
}

export function advanceStory(state, world, vehicles, wanted, player, advance) {
  if (state.ending) {
    if (advance) state.ending = false;
    return;
  }
  if (!state.story || (!advance && --state.story.frames > 0)) return;
  state.story = null;
  if (state.progress[state.index] !== '完了') return;
  state.index += 1;
  if (state.index === missions.length) state.ending = true;
  else startMission(state, world, vehicles, wanted, vehicles.active ?? player);
}

export function checkMission(state, world, vehicles, wanted, player) {
  if (state.progress[state.index] !== '進行中' || wanted.busted) return;
  const target = vehicles.active ?? player;
  const { plaza, coast } = world.locations;
  const reached = [
    arrived(target, plaza),
    vehicles.active === state.car && wanted.stars === 0 && arrived(target, plaza),
    wanted.stars === 0 && arrived(target, coast),
  ][state.index];
  if (!reached) return;
  const mission = missions[state.index];
  state.progress[state.index] = '完了';
  state.cash += mission.reward;
  playSound('missionComplete');
  state.car = null;
  state.story = { heading: mission.title + '　完了', text: mission.complete, frames: completionFrames };
  return { completed: state.progress.flatMap((status, index) => status === '完了' ? [index + 1] : []), cash: state.cash };
}

export function missionDisplay(state, world, active, wanted) {
  if (!state) return null;
  const { index, progress, story, ending } = state;
  if (progress[index] !== '進行中') return { story, ending };
  const recovering = index === 1;
  const needsCar = recovering && active !== state.car;
  const marker = needsCar ? state.car : index === 2 ? world.locations.coast : world.locations.plaza;
  let objective = missions[index].objective;
  if (recovering && !needsCar) {
    objective = wanted.stars ? '建物の陰に入り、手配度を消す' : '回収車を天文台へ届ける';
  } else if (needsCar && state.car.stolen) {
    objective = '目印のついた回収車に戻る';
  } else if (index === 2 && wanted.stars) {
    objective = '建物の陰で追跡を振り切ってから海岸へ';
  }
  return { title: missions[index].title, objective, marker, story, ending };
}
