// All words in the opening, in one place. Line ids are stable so narrative
// state can record dialogue progress.

export const CAPTIONS = {
  siren: '[ a siren, very far away ]',
  vibration: '[ something vibrating against glass ]',
  glass: '[ glass ]',
  alarmNear: '[ the alarm, clearer now — three tones ]',
  helmet: '[ seals engage ]',
  gunshot: '[ gunshot ]',
  silence: '[ silence ]',
  sirensNear: '[ sirens, everywhere ]',
};

// Optional bedroom/penthouse interactions. `label` is the quiet prompt text.
export const INTERACTABLES = {
  door: { label: 'Door', lines: [{ id: 'ex.door', speaker: 'self', text: 'Not now.' }] },
  sleeper: { label: 'Her', lines: [{ id: 'ex.sleeper', speaker: 'self', text: 'Go back to sleep.' }] },
  mask: {
    label: 'Mask',
    lines: [
      { id: 'ex.mask.1', speaker: 'self', text: 'Everyone came as a hero.' },
      { id: 'ex.mask.2', speaker: 'self', text: 'They always do.' },
    ],
  },
  cape: { label: 'Costume', lines: [{ id: 'ex.cape', speaker: 'self', text: 'The shoulders are wrong.' }] },
  bottle: { label: 'Bottle', lines: [{ id: 'ex.bottle', speaker: 'self', text: 'Never buying that again.' }] },
  letters: { label: 'Letters', lines: [{ id: 'ex.letters', speaker: 'self', text: 'Later.' }] },
  trophy: { label: 'Commendation', lines: [{ id: 'ex.trophy', speaker: 'self', text: '...' }] },
  figurine: { label: 'Figurine', lines: [{ id: 'ex.figurine', speaker: 'self', text: 'Cheap thing.' }] },
};

// The Seer call.
export const CALL = {
  open1: { id: 'call.p1', speaker: 'parallax', text: "I assume we've all seen the same vision." },
  open2: { id: 'call.p2', speaker: 'parallax', text: 'I witnessed what must not come to pass.' },
  almanacRuin: { id: 'call.a1', speaker: 'almanac', text: 'Ruin speaks first. As always.' },
  toAlmanac: { id: 'call.p3', speaker: 'parallax', text: 'Almanac. Tell us what will come.' },
  toCandlemas1: { id: 'call.p4', speaker: 'parallax', text: 'And you...' },
  toCandlemas2: { id: 'call.p5', speaker: 'parallax', text: 'Tell us what survives.' },
  almanac1: { id: 'call.a2', speaker: 'almanac', text: "It doesn't begin in the sky." },
  almanac2: { id: 'call.a3', speaker: 'almanac', text: 'Everyone will look up. That is the mistake.' },
  almanac3: { id: 'call.a4', speaker: 'almanac', text: "It's already moving. Under the Sere." },
  almanac4: { id: 'call.a5', speaker: 'almanac', text: 'I saw five—' },
  name: { id: 'call.p6', speaker: 'parallax', text: 'Candlemas.' },
  candlemas: { id: 'call.c1', speaker: 'candlemas', text: 'You were always the honest one.' },
  wait: { id: 'call.p7', speaker: 'parallax', text: 'Wait—', auto: 260 },
  whatDidHeSee: { id: 'call.p8', speaker: 'parallax', text: 'What did he see?', voiceGain: 0.07 },
};

export const RUN = {
  her: 'Where are you going?',
};

// News fragments surfacing during the run. Never explained.
export const NEWS = [
  { kicker: 'VESPER CIVIC NETWORK', text: 'ASTRONOMICAL EVENT UNDER INVESTIGATION' },
  { kicker: 'GEOLOGICAL SURVEY', text: 'UNUSUAL SEISMIC READINGS BENEATH THE SERE' },
  { kicker: 'AUREATE HOUSE', text: 'AUREATE RESPONSE NETWORK ACTIVATED' },
];

export const SPINE_ALERTS = [
  'ALL SEER HOUSES SEALED',
  'AIR CORRIDORS CLOSING',
  'MERIDIAN ARCHIVE: NO COMMENT',
  'SEISMIC ACTIVITY: 7 NATIONS',
  'CANDLEMAS — NO STATEMENT',
];

export const STAR_PROTOCOL = { kicker: 'PRIORITY HERO NETWORK', text: 'STAR PROTOCOL' };

export const CHAMBER = {
  you: { id: 'ch.p1', speaker: 'parallax', text: '...you?', voiceGain: 0.07 },
  ofCourse: { id: 'ch.p2', speaker: 'parallax', text: 'Of course.', voiceGain: 0.08 },
};
