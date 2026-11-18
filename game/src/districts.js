import { streetX, streetY } from './config.js';

// North to south, with one entry per city block.
const layout = [
  ['residential', 'residential', 'downtown', 'downtown', 'downtown', 'harbor', 'harbor'],
  ['residential', 'residential', 'downtown', 'downtown', 'downtown', 'harbor', 'harbor'],
  ['residential', 'residential', 'downtown', 'academy', 'downtown', 'harbor', 'harbor'],
  ['residential', 'residential', 'academy', 'academy', 'academy', 'harbor', 'harbor'],
  ['resort', 'resort', 'resort', 'resort', 'resort', 'resort', 'resort'],
];

export const observatoryBlock = { column: 3, row: 3 };

// Lots specify x, y, minimum width and minimum depth in block coordinates.
export const districts = {
  downtown: {
    name: 'Aster Downtown', mapColor: '#805cb4',
    curb: '#525273', ground: '#403e57',
    road: { surface: '#28283c', edge: '#e975e8', marking: '#9fb7ea', dash: 16 },
    buildings: {
      style: 'tower', lots: [[17, 20, 69, 147], [101, 22, 65, 68], [101, 107, 65, 63]],
      variation: [5, 7, 38, 19], roofs: ['#6b6999', '#555986', '#7f688f'],
      walls: ['#373957', '#30354f', '#493953'], accent: '#83f3f0',
    },
  },
  residential: {
    name: 'Old Town', mapColor: '#728853',
    curb: '#fff0cc', ground: '#e4cba6', garden: '#a5b77f',
    road: { surface: '#b99b85', edge: '#e6c7a5', marking: '#f5dfba', dash: 8 },
    buildings: {
      style: 'house', lots: [[20, 22, 34, 30], [78, 28, 34, 32], [137, 22, 31, 31],
        [29, 112, 37, 32], [89, 126, 29, 35], [142, 113, 27, 35]],
      variation: [10, 7, 10, 7], roofs: ['#d88b72', '#cfad73', '#8ea998'],
      walls: ['#a45f52', '#967346', '#5c8272'], accent: '#fff0ce',
    },
    props: { trees: [[31, 87], [113, 91], [162, 83], [70, 166], [129, 170]] },
  },
  harbor: {
    name: 'Harbor District', mapColor: '#477487',
    curb: '#a9b2af', ground: '#8b989d',
    road: { surface: '#aab1ad', edge: '#e1b547', marking: '#ffda64', dash: 21, shoulder: 7 },
    buildings: {
      style: 'warehouse',
      lots: [[20, 23, 145, 82]],
      alternateLots: [[20, 23, 67, 82], [100, 23, 66, 82]],
      variation: [4, 6, 13, 3], roofs: ['#607b8c', '#6a8490', '#776f65'],
      walls: ['#3e5362', '#475b65', '#514c4a'], accent: '#b6cacc',
    },
    props: {
      containerRows: [127, 154], containerColors: ['#b45b53', '#dfab55', '#477989'],
      crane: { column: 5, row: 1, x: 142, y: 72, color: '#242f3f' },
    },
  },
  resort: {
    name: 'Palm Coast', mapColor: '#ba6e76',
    curb: '#fff4d3', ground: '#ebd5bd',
    road: { surface: '#b78f86', edge: '#ffe2bf', marking: '#fff1d3', dash: 14 },
    buildings: {
      style: 'villa', lots: [[24, 29, 61, 67], [108, 68, 57, 77]],
      variation: [8, 9, 17, 6], roofs: ['#efaea9', '#a8d6ce', '#d4bbdf'],
      walls: ['#bb777d', '#649d9c', '#a78ab6'], accent: '#fff4d3',
    },
    props: {
      palms: [[117, 39], [161, 34], [38, 142], [76, 164], [156, 172]],
      promenade: '#e4bea3', trim: '#fff2d1', sundial: '#427e88',
    },
  },
  academy: {
    name: 'Meridian Observatory', mapColor: '#545d70',
    curb: '#f0e8d5', ground: '#d6d7ce', garden: '#86aaa0',
    road: { surface: '#788a95', edge: '#bcd6d1', marking: '#e8e8d4', dash: 10 },
    buildings: {
      style: 'hall', lots: [[21, 26, 53, 103], [117, 31, 49, 68]],
      variation: [4, 6, 18, 5], roofs: ['#b6b0cf', '#ccd8e2', '#a5bdc6'],
      walls: ['#777797', '#798ba0', '#657f90'], accent: '#fff2bb',
    },
    props: { trees: [[31, 171], [168, 167], [165, 23]], monument: [99, 128] },
  },
};

export function districtAt(column, row) {
  return layout[row][column];
}

export function districtAtPosition({ x, y }) {
  // Follow the road colors: the grid lines divide shared streets in half.
  // The southernmost row also supplies the district for the beach.
  const cell = (centers, value) => Math.min(centers.length - 2,
    Math.max(0, centers.findLastIndex((center) => value >= center)));
  const column = cell(streetX, x);
  const row = cell(streetY, y);
  return districts[districtAt(column, row)];
}
