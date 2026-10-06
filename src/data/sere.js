// Chapter Four — Under the Sere. Dowser's chapter. All its words, in one place.

export const SERE = {
  title: { chapter: 'Chapter Four', sub: 'Under the Sere' },

  cc: {
    printer: '[ a printer, warming up ]',
    shutter: '[ a camera shutter ]',
    shutterAlone: '[ a camera shutter; nobody near it ]',
    speaker: '[ a speaker, clearing its throat ]',
    under: '[ water, a long way down, going round ]',
    van: '[ an engine, idling outside ]',
  },

  // 4.1 — A Network annex at six in the morning. Not the room with the wall:
  // the corridor behind it, where they do the paperwork.
  annex: {
    place: 'Civic Network Annex B · 06:02',
    open: [
      { id: 'sr_a1', speaker: 'dowserThought', text: 'They took our phones at the door. Then our names. Then they gave the phones back.', auto: 4200 },
      { id: 'sr_a2', speaker: 'dowserThought', text: 'Nobody\'s said why we\'re here. Nobody\'s said we can go.', auto: 3400 },
    ],
    walkHint: 'Look around',
    items: {
      forms: { label: 'Forms', lines: [
        { id: 'sr_i1', speaker: 'dowserThought', text: 'Form 9C. Next of kin, blood group, "nature of ability". I wrote "finds leaks". It\'s what it says on the van.' },
      ] },
      drain: { label: 'Floor drain', hold: 1.4, holdLabel: 'Feel for water', lines: [
        { id: 'sr_i2', speaker: 'dowserThought', text: 'There\'s water under this floor. A lot of it, deep down. It isn\'t running off anywhere.' },
        { id: 'sr_i3', speaker: 'dowserThought', text: 'It\'s going round.' },
      ] },
      panel: { label: 'Frosted glass', lines: [
        { id: 'sr_i4', speaker: 'dowserThought', text: 'The big room\'s through there. A wall of cards, all dark, and one lit at the bottom.' },
        { id: 'sr_i5', speaker: 'dowserThought', text: 'The clerk hasn\'t printed ours yet.' },
      ] },
      grille: { label: 'Speaker', lines: [
        { id: 'sr_i6', speaker: 'dowserThought', text: 'Somebody\'s on the other end. You can hear them not saying anything.' },
      ] },
      paperweight: { label: 'Paperweight', lines: [
        { id: 'sr_i7', speaker: 'paperweight', text: 'They asked me to demonstrate. I held a biro still for a minute. He wrote down "a minute".' },
      ] },
      humdrum: { label: 'Humdrum', lines: [
        { id: 'sr_i8', speaker: 'humdrum', text: 'Lights in here buzz in B flat. Has anyone else noticed? Nobody else has noticed.' },
      ] },
      lukewarm: { label: 'Lukewarm', lines: [
        { id: 'sr_i9', speaker: 'lukewarm', text: 'I\'ve rung work. I said family. It\'s not a lie if nobody asks which family.' },
      ] },
      bench: { label: 'Bench', lines: [
        { id: 'sr_i10', speaker: 'dowserThought', text: 'Warm. The end of the bench is warm, like somebody just got up.' },
        { id: 'sr_i11', speaker: 'dowserThought', text: 'Nobody\'s sat there. I\'d have seen.' },
      ] },
    },
    // The clerk works down the list.
    clerk: [
      { id: 'sr_c1', speaker: 'clerk', text: 'Photographs. One at a time. Stand on the cross.', auto: 3000 },
    ],
    call: {
      dowser: [
        { id: 'sr_c2', speaker: 'clerk', text: 'Dowser.', auto: 1600 },
      ],
      paperweight: [
        { id: 'sr_c3', speaker: 'clerk', text: 'Paperweight. D-tier. Keeps one object where it is.', auto: 3400 },
      ],
      humdrum: [
        { id: 'sr_c4', speaker: 'clerk', text: 'Humdrum. D-tier. Resonance, low.', auto: 2800 },
      ],
      lukewarm: [
        { id: 'sr_c5', speaker: 'clerk', text: 'Lukewarm. D-tier. Brings things to room temperature.', auto: 3200 },
      ],
    },
    standHint: 'Stand on the cross',
    photo: { label: 'Stand for the photograph' },
    readMe: [
      { id: 'sr_c6', speaker: 'clerk', text: 'D-tier. Locates water. Vesper Water co-operative.', auto: 3000 },
      { id: 'sr_c7', speaker: 'clerk', text: 'Says here "finds leaks".', auto: 2000 },
      { id: 'sr_d1', speaker: 'dowser', text: 'It\'s what I do.', auto: 1600 },
    ],
    four: [
      { id: 'sr_c8', speaker: 'clerk', text: 'That\'s four. Cards in a minute.', auto: 2600 },
    ],
    // The camera goes off on its own, at the end of the bench.
    alone: [
      { id: 'sr_c9', speaker: 'clerk', text: '…Who touched that?', auto: 2000 },
      { id: 'sr_d2', speaker: 'dowserThought', text: 'Nobody touched it. I was looking at it.', auto: 3000 },
    ],
    monitor: { label: 'Monitor', lines: [
      { id: 'sr_i12', speaker: 'dowserThought', text: 'The last picture. The end of the bench, from the camera\'s side.' },
      { id: 'sr_i13', speaker: 'dowserThought', text: 'Somebody\'s sitting there.' },
    ], linesNone: [
      { id: 'sr_i14', speaker: 'dowserThought', text: 'The last picture. The end of the bench, from the camera\'s side. It\'s blurred, like the lens couldn\'t settle.' },
    ] },
    cards: [
      { id: 'sr_c10', speaker: 'clerk', text: 'Four cards. Here. Here. Here. Here.', auto: 3000 },
      { id: 'sr_c11', speaker: 'clerk', text: 'And— I didn\'t print that.', auto: 2400 },
    ],
    fifthCard: [
      { id: 'sr_d3', speaker: 'dowserThought', text: 'A fifth card, warm from the printer. No photograph. A name in handwriting, the same hand as the letters.', auto: 4800 },
      { id: 'sr_d4', speaker: 'dowserThought', text: 'Wallflower.', auto: 2000 },
    ],
    fifthKnown: [
      { id: 'sr_d5', speaker: 'humdrum', text: 'Oh. Them. They were at the hospital.', auto: 2600 },
      { id: 'sr_d6', speaker: 'lukewarm', text: 'They were on the telly.', auto: 2000 },
      { id: 'sr_d7', speaker: 'dowserThought', text: 'I\'d have remembered. I\'d have remembered somebody on the telly.', auto: 3400 },
    ],
    fifthUnknown: [
      { id: 'sr_d8', speaker: 'paperweight', text: 'Five. She said five, on the screens.', auto: 2600 },
      { id: 'sr_d9', speaker: 'humdrum', text: 'Well, we\'re four.', auto: 1800 },
      { id: 'sr_d10', speaker: 'dowserThought', text: 'Nobody picked up the fifth card. Nobody had to. When I looked again it wasn\'t on the counter.', auto: 4600 },
    ],
    voice: [
      { id: 'sr_p1', speaker: 'parallax', text: 'Thank you. That\'s everything.', voiceGain: 0.07 },
      { id: 'sr_p2', speaker: 'parallax', text: 'There\'s a van outside. Lodestar will drive. You\'re going into the Sere.', voiceGain: 0.07 },
      { id: 'sr_d11', speaker: 'paperweight', text: 'The desert? What\'s in the desert?', auto: 2200 },
      { id: 'sr_p3', speaker: 'parallax', text: 'Water.', voiceGain: 0.07, pause: 900 },
      { id: 'sr_p4', speaker: 'parallax', text: 'Dowser. Bring the rod.', voiceGain: 0.07 },
    ],
    leave: [
      { id: 'sr_d12', speaker: 'dowserThought', text: 'I hadn\'t told anyone about the rod. It was in my pocket. It was in my pocket the whole time.', auto: 4400 },
    ],
  },
};
