// Chapter Two — The Starfall Record. All on-screen text for the vigil, the
// archive reconstruction of the Lantern Bridge, and the sky.
//
// The Record is assembled from public sources. Where sources disagree, both
// are kept — and the player is asked which one the reconstruction follows.

export const VIGIL = {
  place: 'Vesper Plaza · the seventh anniversary',
  screen: [
    'THE STARFALL RECORD',
    'Compiled by the Vesper Civic Network from 1,412 public sources.',
    'Where sources disagree, both are kept.',
  ],
  hint: 'Walk among them',
  barks: [
    { x: 520, who: '', text: 'Seven years. Doesn’t feel like seven.' },
    { x: 760, who: '', text: 'My dad was on the bridge. West end. He walked home and never talked about it.' },
    { x: 1010, who: '', text: 'Mum, which one’s Parallax? — He’s not on the screen, love. They don’t show him.' },
    { x: 1260, who: '', text: 'They’re running every camera this year. All of it. Even the bits nobody agrees on.' },
    { x: 1500, who: '', text: 'I don’t want to watch it again. — Then don’t. — I always do.' },
    { x: 1740, who: '', text: 'Half these people came dressed as her. Look at them. Gold paint everywhere.' },
    { x: 1990, who: '', text: 'She could’ve gone anywhere after. Anyone with that much light could.' },
    { x: 2230, who: '', text: 'Shh. It’s starting.' },
  ],
  close: [
    { id: 'v.child', speaker: 'crowd', text: 'Did she win?' },
    { id: 'v.parent', speaker: 'crowd', text: '…She stopped him.', pause: 900 },
  ],
  interrupt: 'ASTRONOMICAL EVENT UNDER INVESTIGATION',
  interruptSub: 'Vesper Civic Network · broadcast suspended',
  murmurs: ['Is that— is that the sky?', 'Look up. Everyone, look up.', 'That’s not a plane.'],
};

export const RECORD = {
  open: [
    'THE LANTERN BRIDGE · 23:31',
    'The eastern districts have been burning for an hour.',
    '2,140 people are on the bridge.',
  ],
  sources: {
    heli: 'CH9 · NEWS HELICOPTER',
    west: 'CAM 14 · WEST TOWER',
    tram: 'CAM 03 · TRAM 6 INTERIOR',
    phone212: 'PHONE · WITNESS 212',
    phone88: 'PHONE · WITNESS 88',
    deck: 'CAM 22 · DECK, MID-SPAN',
    east: 'CAM 31 · EAST TOWER',
    recon: 'RECONSTRUCTION · NO SINGLE SOURCE',
  },
  landing: { wit: 'WITNESS 212 · TRAM CONDUCTOR', text: 'She came down like— you know when you look at the sun, then look away, and it’s still there? Like that.' },
  starArrive: [
    { id: 'r.star1', speaker: 'star', text: 'Everyone off the span. West end. Walk, don’t run.' },
  ],
  move: 'Move',
  r1: {
    approach: 'Tram 6',
    prompt: 'Lift',
    lines: [{ id: 'r.r1a', speaker: 'star', text: 'Hold on. I have the weight.' }],
    ok: { wit: 'WITNESS 140 · PASSENGER, TRAM 6', text: 'She lifted it like it was a coat somebody had dropped on us.' },
    fail: { wit: 'WITNESS 140 · PASSENGER, TRAM 6', text: 'It took her a long time. The Record says forty seconds. It was longer. I was under it.' },
    after: [{ id: 'r.r1b', speaker: 'star', text: 'West end. Go. Don’t look back.' }],
  },
  r2: {
    prompt: 'Catch',
    ok: { wit: 'WITNESS 19 · AGE 9 AT THE TIME', text: 'She caught me by the wrist. I remember her hand was warm. Everything else was cold.' },
    fail: { wit: 'WITNESS 19 · AGE 9 AT THE TIME', text: 'She caught me by the ankle and my arm hit the rail. It broke in two places. She still saved my life. I want that in the Record.' },
    lineOk: [{ id: 'r.r2a', speaker: 'star', text: 'Got you.' }],
    lineFail: [{ id: 'r.r2b', speaker: 'star', text: 'Got you. I’m sorry. I’ve got you.' }],
  },
  r3: {
    prompt: 'Hold',
    lines: [{ id: 'r.r3a', speaker: 'star', text: 'Not yet.' }],
    ok: { wit: 'WITNESS 63 · BUS DRIVER', text: 'She held a cable as thick as my leg. Held it. The deck stopped moving.' },
    fail: { wit: 'WITNESS 63 · BUS DRIVER', text: 'The deck dropped about a metre before she got it. We all went sliding. Then it stopped.' },
  },
  lightsOut: { wit: 'WITNESS 212 · TRAM CONDUCTOR', text: 'Then the lanterns went out. From the far end, one at a time, like someone walking toward us.' },
  meet: [
    { id: 'r.px1', speaker: 'parallax', text: 'Look at them. They’d hold still for you forever if you asked.' },
    { id: 'r.st1', speaker: 'star', text: 'Leave the bridge. This is between us.' },
    { id: 'r.px2', speaker: 'parallax', text: 'It’s always been between us.' },
  ],
  interference: 'SIGNAL INTERFERENCE',
  choice1: {
    title: 'Who moved first?',
    sub: 'The sources disagree. The Record keeps both.',
    a: { key: 'him', wit: 'WITNESS 212 · TRAM CONDUCTOR', text: 'He went for her first. I’ll swear to that. She was still turned toward us.' },
    b: { key: 'her', wit: 'WITNESS 88 · RIVER PILOT', text: 'She went for him. I had the best view on the river. She went first.' },
    kept: 'Both accounts are kept. This reconstruction follows the one you chose.',
  },
  duel: {
    hintDodge: (k) => `${k} — dodge as his visor flares`,
    hintStrike: (k) => `${k} — strike while he is open`,
    hintParry: 'He is guarding. Wait for him to commit.',
    hintBolt: (k) => `${k} — dodge through it`,
    clash: 'Push',
    pxBarks: [
      'You’re slower when they’re watching.',
      'Every one of them is a reason to flinch.',
      'You taught me that one.',
      'Still holding back. Still.',
    ],
    pxBarks2: [
      'Three hundred people on this span, and you’re looking at me.',
      'Go on. Save them. I’ll wait.',
      'Brighter. You can do brighter than that.',
    ],
    stBarks: ['Enough.', 'Not here.', 'Stay down.'],
    afterClash: { id: 'r.px3', speaker: 'parallax', text: 'There it is.' },
    hitWit: { wit: 'WITNESS 88 · RIVER PILOT', text: 'Every time he hit her the lights on the whole bridge dipped. Like she was what was holding them on.' },
  },
  choice2: {
    title: 'The span',
    sub: '23:40:58 · The last hangers on the centre span are failing.',
    a: { key: 'chose', wit: 'WITNESS 31 · NURSE, TRAM 4', text: 'She could have caught it. She looked at the bridge, and then she looked at him.' },
    b: { key: 'couldnt', wit: 'WITNESS 140 · CITY STRUCTURAL ENGINEER', text: 'Nobody could have held that span. I have run the numbers for seven years. Nobody.' },
    hold: 'Hold the span',
  },
  spanLines: {
    chose: [{ id: 'r.px4', speaker: 'parallax', text: 'Your move.', voiceGain: 0.08 }],
    couldnt: [{ id: 'r.st2', speaker: 'star', text: 'No— no, no, no—' }],
  },
  failed: ['THE SPAN FAILED AT 23:41:07.', '311 PEOPLE WERE ON IT.'],
  noFootage: 'NO FOOTAGE',
  noFootageSub: 'All cameras on the centre span lost signal between 23:41:02 and 23:41:31.',
  w07: { wit: 'WITNESS 07 · STUDENT', text: 'They moved the same. Like they’d rehearsed it. I don’t know why that’s the thing I remember.' },
  continues: 'The Record continues · CH9 news helicopter · 23:44',
};

export const SKY = {
  source: 'CH9 · NEWS HELICOPTER · 23:44 · ABOVE THE AUREATE SPIRE',
  pilot: { wit: 'CH9 PILOT · RADIO', text: 'They’re above us. They’re above the cloud. I can’t— I’m not going up there.' },
  prompts: { evade: 'Evade', strike: 'Strike', meet: 'Meet him', burn: 'Burn brighter' },
  lines1: [
    { id: 's.px1', speaker: 'parallax', text: 'Nobody’s watching now.' },
  ],
  lines2: [
    { id: 's.px2', speaker: 'parallax', text: 'Go on, then. Burn.' },
    { id: 's.st1', speaker: 'star', text: '…I’m sorry.', pause: 600 },
  ],
  whiteout: { wit: 'CH9 PILOT · RADIO', text: 'It was like the sun came up in the wrong place. For a second it was day. Then nothing.' },
  cape: { wit: 'WITNESS 402 · FISHERMAN, AUREATE QUAY', text: 'Her cape came down in the harbour at 4 a.m. Just the cape. I gave it to the Guard. I wish I’d kept it.' },
  end: ['Star was not found.', 'Parallax was not seen again.'],
};

// Names for the scroll. Generated, seeded, never the same name twice.
const FIRST = ['Ada', 'Bram', 'Celia', 'Dorian', 'Edda', 'Felix', 'Greta', 'Hal', 'Ines', 'Jonah', 'Kasia', 'Leon', 'Mara', 'Nils', 'Odile', 'Pavel', 'Quinn', 'Rosa', 'Soren', 'Tamsin', 'Ugo', 'Vera', 'Wen', 'Xavi', 'Yara', 'Zeno', 'Amal', 'Beatrix', 'Cyrus', 'Dalia', 'Emil', 'Farah', 'Gideon', 'Hana', 'Ivo', 'Juno', 'Kofi', 'Lior', 'Mei', 'Nadia', 'Otto', 'Priya', 'Rafe', 'Sana', 'Teo', 'Una', 'Viktor', 'Wren', 'Yusuf', 'Zora'];
const LAST = ['Abara', 'Bell', 'Castellan', 'Doyle', 'Eskildsen', 'Farrow', 'Grieve', 'Hollis', 'Ibarra', 'Janssen', 'Kade', 'Lund', 'Marsh', 'Novak', 'Okafor', 'Pell', 'Quill', 'Rourke', 'Sato', 'Thorne', 'Underhill', 'Vance', 'Wilde', 'Yilmaz', 'Zeller', 'Achterberg', 'Bramwell', 'Coyle', 'Delacroix', 'Ferreira', 'Galloway', 'Haddad', 'Ishikawa', 'Kowal', 'Lindqvist', 'Moreau', 'Nakamura', 'Orsini', 'Petrov', 'Reyes', 'Sauer', 'Tan', 'Varga', 'Whitlock'];

export function theNames(count = 311) {
  let s = 311;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const seen = new Set();
  const out = [];
  while (out.length < count) {
    const n = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}
