import { VIEW_W } from '../../config.js';

// Where everything in the penthouse lives (world x, left → right):
//
//  | SPINE (corridor) | BEDROOM | LOUNGE | GALLERY | SANCTUM |
//  0               3000      4700     6300      7400      8500
//
// The player wakes in the bedroom, explores right to the sanctum, then runs
// all the way back left, through the eclipse door and down the Spine.

export const WORLD_W = 8500;

export const AREAS = {
  spine: [0, 3000],
  bedroom: [3000, 4700],
  lounge: [4700, 6300],
  gallery: [6300, 7400],
  sanctum: [7400, 8500],
};

export const SF = {
  sky: 0,
  cityFar: 0.05,
  cityMid: 0.12,
  traffic: 0.2,
  wall: 0.92,
  disc: 1.04,
  fg: 1.25,
};

// Place an object on a parallax layer so it lines up with world x `X`
// when the camera is centred on X.
export function px(X, sf) {
  return sf * X + (1 - sf) * (VIEW_W / 2);
}

export const L = {
  floorTop: 690,
  lane: 800,

  chamberDoor: 200,
  eclipseDoor: 3000,
  spineSlits: [450, 870, 1290, 1710, 2130, 2550],
  spineScreens: [660, 1080, 1500, 1920, 2340],

  bed: 3850,
  nightstand: 3330,
  lampL: 3190,
  lampR: 4600,
  sleeperX: 3880,
  dress: 4330,
  heels: 4420,
  mask: 4450,
  iceBucket: 4250,
  chairJacket: 4530,

  sofa: 5050,
  capeReplica: 5170,
  helmetReplica: 4930,
  lowTable: 5530,
  chandelier: 5530,
  newsScreen: 5880,
  bar: 6050,
  bottle: 5930,
  speaker: 6220,
  arches: [5000, 5470, 5940],

  niches: [6470, 7020],
  gallerySlit: 6750,
  console: 6620,
  crate: 6950,
  trophy: 6870,
  figurine: 7090,
  portrait: 7260,

  sanctumWall: 8120,
  vestry: 7645,
  pedestal: 7745,
  chair: 7860,
  seat: 7890,
  altar: 8160,
  glass: 8160,

  partitions: [4700, 6300, 7400],

  // Player limits per phase.
  exploreMin: 3090,
  exploreMax: 8300,
  equipTrigger: 7530,
};
