// Tram 6, after it stopped. Everything is heard from where Ines is, which is
// usually too far away, or too close.

export const SPAN = {
  wake: [
    { id: 'sp_w1', speaker: 'inesThought', text: 'Floor.', auto: 1800 },
    { id: 'sp_w2', speaker: 'teo', text: 'Mum. Mum, she\'s here.', auto: 2200 },
    { id: 'sp_w3', speaker: 'mara', text: 'Stay down. Teo, stay down.', auto: 2400 },
  ],
  getUp: 'Get up',

  // Seen through the doors: she is already standing on the deck.
  arrive: [
    { id: 'sp_a1', speaker: 'star', text: 'Everyone off the span. West end. Walk, don\'t run.' },
    { id: 'sp_a2', speaker: 'inesThought', text: 'She didn\'t turn around. She said it to the whole bridge at once.' },
  ],
  // Carried down the deck on the wind; half of it is lost.
  meet: [
    { id: 'sp_m1', speaker: 'parallax', text: 'Look at them. They\'d hold still for you forever if you asked.', voiceGain: 0.05 },
    { id: 'sp_m2', speaker: 'star', text: 'Leave the bridge. This is between us.' },
    { id: 'sp_m3', speaker: 'parallax', text: 'It\'s always been between us.', voiceGain: 0.05 },
    { id: 'sp_m4', speaker: 'inesThought', text: 'She knows him. You can hear it.' },
  ],

  evacHint: (k) => `Get them off · look at a passenger · ${k}`,
  evacHintTouch: 'Get them off · look at a passenger and tap',
  people: {
    mara: {
      label: 'Off',
      lines: [
        { id: 'sp_ma1', speaker: 'ines', text: 'Mara. West end. Now.' },
        { id: 'sp_ma2', speaker: 'teo', text: 'It\'s her. Mum, it\'s really her.' },
        { id: 'sp_ma3', speaker: 'mara', text: 'I know, love. Shoes. Walk.' },
      ],
    },
    couple: {
      label: 'Off',
      lines: [
        { id: 'sp_c1', speaker: 'sami', text: 'We can\'t go out there.' },
        { id: 'sp_c2', speaker: 'ines', text: 'You can\'t stay in here.' },
        { id: 'sp_c3', speaker: 'nell', text: 'Sami. Tonight. After. You said.', pause: 400 },
        { id: 'sp_c4', speaker: 'sami', text: '…Okay.' },
      ],
    },
    aurelio: {
      label: 'Help',
      lines: [
        { id: 'sp_au1', speaker: 'aurelio', text: 'Give me your arm. My knees are older than this bridge.' },
        { id: 'sp_au2', speaker: 'ines', text: 'Up you come.' },
        { id: 'sp_au3', speaker: 'aurelio', text: 'Don\'t drop the lilies. She\'d never let me hear the end of it.' },
      ],
    },
    sleeper: {
      label: 'Wake',
      lines: [
        { id: 'sp_s1', speaker: 'ines', text: 'Hey. Hey. Up. Off the tram.' },
        { id: 'sp_s2', speaker: 'sleeper', text: '…Cinder Street?' },
        { id: 'sp_s3', speaker: 'ines', text: 'Not tonight. Walk west. Don\'t stop.' },
      ],
    },
    door: {
      label: 'Go',
      lines: [],
    },
  },
  doorHint: 'The door',
  leftHim: [
    { id: 'sp_l1', speaker: 'inesThought', text: 'Every night. He\'s always asleep.', auto: 2600 },
  ],
  duck: (k) => `${k} — get down`,
  duckOk: [{ id: 'sp_d1', speaker: 'inesThought', text: 'The hanger. It just— let go.', auto: 2400 }],
  duckFail: [{ id: 'sp_d2', speaker: 'inesThought', text: 'Get up. Get up. Get up.', auto: 2200 }],

  // On the deck.
  outside: [
    { id: 'sp_o1', speaker: 'inesThought', text: 'Every lantern on the span is out. It\'s only them, up there, lighting it.', auto: 4200 },
  ],
  teoRuns: [
    { id: 'sp_t1', speaker: 'teo', text: 'STAR!', auto: 1200 },
    { id: 'sp_t2', speaker: 'mara', text: 'Teo— TEO!', auto: 1600 },
  ],
  chase: (k) => `${k} — run`,
  reach: (k) => `${k} — reach`,
  short: [
    { id: 'sp_r1', speaker: 'inesThought', text: '—', auto: 900 },
  ],
  caught: [
    { id: 'sp_k1', speaker: 'star', text: 'Got you.' },
  ],
  handOver: [
    { id: 'sp_k2', speaker: 'star', text: 'Take him.', pause: 700 },
    { id: 'sp_k3', speaker: 'star', text: 'West end.' },
  ],
  calledAway: [
    { id: 'sp_k4', speaker: 'parallax', text: 'There it is.', voiceGain: 0.05 },
  ],
  teoWarm: [
    { id: 'sp_k5', speaker: 'teo', text: 'Her hand was warm.', auto: 2400 },
  ],

  // The span. Nobody explains it; it happens.
  failing: [
    { id: 'sp_f1', speaker: 'teo', text: 'She\'s holding it. Look. She\'s holding it up.', auto: 3200 },
  ],
  looked: [
    { id: 'sp_f2', speaker: 'teo', text: 'She\'s looking at us.', auto: 2600 },
  ],
  lookedAway: [
    { id: 'sp_f3', speaker: 'teo', text: 'Why\'s she looking at him?', auto: 2800 },
  ],

  run: (k) => `Hold ${k} — run`,
  runTouch: 'Hold to run',
  aurelio: [
    { id: 'sp_ar1', speaker: 'ines', text: 'Aurelio—', auto: 1200 },
    { id: 'sp_ar2', speaker: 'aurelio', text: 'Go on. You\'ve got the boy.', auto: 2200 },
    { id: 'sp_ar3', speaker: 'aurelio', text: 'She\'ll wait up.', auto: 2600 },
  ],
  tower: [
    { id: 'sp_tw1', speaker: 'mara', text: 'Teo! Oh— give him, give him here—', auto: 2200 },
  ],
  turn: 'Look back',
  rise: [
    { id: 'sp_u1', speaker: 'teo', text: 'Mum. They\'re going up.', auto: 2400 },
  ],
  time: '23:41:07',
};

// What the Record says about Tram 6, seven years on. Keyed by what happened.
export const SPAN_RECORD = {
  sleeperLeft: { wit: 'WITNESS 212 · TRAM CONDUCTOR', text: 'There was a man asleep at the back. Every night, both ways. I never knew his name. I look for it in the list every year.' },
  sleeperWoke: { wit: 'WITNESS 212 · TRAM CONDUCTOR', text: 'A man I used to let ride for nothing wrote to me after. He signed it Cinder Street. That\'s all. Cinder Street.' },
  aurelio: { wit: 'WITNESS 212 · TRAM CONDUCTOR', text: 'The old man with the lilies sat down. He wasn\'t tired. He\'d just decided.' },
  teo: { wit: 'WITNESS 19 · AGE 9 AT THE TIME', text: 'She caught me by the wrist. I remember her hand was warm. Everything else was cold.' },
  nurse: { wit: 'WITNESS 31 · NURSE, TRAM 4', text: 'She could have caught it. She looked at the bridge, and then she looked at him.' },
  engineer: { wit: 'WITNESS 140 · CITY STRUCTURAL ENGINEER', text: 'Nobody could have held that span. I have run the numbers for seven years. Nobody.' },
  mirror: { wit: 'WITNESS 07 · STUDENT', text: 'They moved the same. Like they\'d rehearsed it. I don\'t know why that\'s the thing I remember.' },
};
