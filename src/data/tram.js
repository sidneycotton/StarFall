// Tram 6, the last run. Everything here is heard from where Ines stands.
// `auto` lines play over the drive without stopping it.

export const TRAM = {
  open: [
    { id: 'tr_open1', speaker: 'dispatch', text: 'Six, Hollin Yard. You\'re the last one across tonight.' },
    { id: 'tr_open2', speaker: 'ines', text: 'Copy, Yard. Six is last.' },
    { id: 'tr_open3', speaker: 'dispatch', text: 'Bring her home.' },
  ],

  // Keyed by the distance along the bridge (metres) at which they play.
  drive: [
    { at: -50, lines: [{ id: 'tr_d1', speaker: 'inesThought', text: 'Four minutes across, if nobody rings.', auto: 3200 }] },
    { at: 10, lines: [
      { id: 'tr_d2', speaker: 'teo', text: 'Mum. Mum. Are they all on?', auto: 2600 },
      { id: 'tr_d3', speaker: 'mara', text: 'All of them, love. Sit down.', auto: 2600 },
    ] },
    { at: 108, lines: [{ id: 'tr_d4', speaker: 'ines', text: 'Evening.', auto: 1800 }] },
    { at: 128, lines: [{ id: 'tr_d5', speaker: 'inesThought', text: 'Twenty-two years, and I still say it to the tower. It has never once answered.', auto: 4400 }] },
    { at: 200, lines: [
      { id: 'tr_d6', speaker: 'dispatch', text: 'Six, someone rang for Midspan. Probably the lamplighter. Pick them up, they\'ll want to get home.', auto: 4600 },
      { id: 'tr_d7', speaker: 'ines', text: 'Stopping at Midspan.', auto: 2000 },
    ] },
  ],

  midspan: [
    { id: 'tr_m1', speaker: 'inesThought', text: 'Nobody.' },
    { id: 'tr_m2', speaker: 'inesThought', text: 'Ladder\'s still here, though.' },
    { id: 'tr_m3', speaker: 'inesThought', text: 'Timetable says two minutes. Tickets, then.' },
  ],

  // Passengers. `first` plays on the first visit; `again` after that.
  people: {
    mara: {
      label: 'Tickets',
      first: [
        { id: 'tr_ma1', speaker: 'ines', text: 'Tickets, please.' },
        { id: 'tr_ma2', speaker: 'mara', text: 'One and a half. Sorry — he\'s the half.' },
        { id: 'tr_ma3', speaker: 'teo', text: 'I\'m seven.' },
        { id: 'tr_ma4', speaker: 'mara', text: 'He\'s the half. Twelve hours at Saint Ondine and then he fell asleep in the break room, so now he\'s awake forever.' },
        { id: 'tr_ma5', speaker: 'teo', text: 'Who lights them?' },
        { id: 'tr_ma6', speaker: 'ines', text: 'The lanterns?' },
        { id: 'tr_ma7', speaker: 'teo', text: 'All of them. Every night. Who does it?' },
        { id: 'tr_ma8', speaker: 'ines', text: 'Someone who\'s very good with ladders.' },
        { id: 'tr_ma9', speaker: 'teo', text: 'I\'d do it with my eyes.' },
        { id: 'tr_ma10', speaker: 'mara', text: 'He means he\'d look at them very hard.' },
      ],
      again: [
        { id: 'tr_ma11', speaker: 'teo', text: 'With my eyes. Like this.' },
      ],
    },
    couple: {
      label: 'Tickets',
      first: [
        { id: 'tr_c1', speaker: 'nell', text: '— you said you\'d tell her.' },
        { id: 'tr_c2', speaker: 'sami', text: 'Tonight. After.' },
        { id: 'tr_c3', speaker: 'ines', text: 'Tickets, please.' },
        { id: 'tr_c4', speaker: 'sami', text: 'Sorry. Here. Long day.' },
        { id: 'tr_c5', speaker: 'nell', text: 'After what, Sami?', pause: 500 },
        { id: 'tr_c6', speaker: 'inesThought', text: 'He doesn\'t answer. She goes back to the window.' },
      ],
      again: [
        { id: 'tr_c7', speaker: 'inesThought', text: 'Neither of them looks up.' },
      ],
    },
    aurelio: {
      label: 'Tickets',
      first: [
        { id: 'tr_a1', speaker: 'ines', text: 'Tickets, please.' },
        { id: 'tr_a2', speaker: 'aurelio', text: 'Lilies. She hates lilies.' },
        { id: 'tr_a3', speaker: 'aurelio', text: 'I bring them every year so she has something to complain about. Forty-one tomorrow.' },
        { id: 'tr_a4', speaker: 'aurelio', text: 'Today, I suppose. In — what is it — eleven minutes.' },
        { id: 'tr_a5', speaker: 'aurelio', text: 'Are we late?' },
        { id: 'tr_a6', speaker: 'ines', text: 'We\'re never late. We\'re the last.' },
        { id: 'tr_a7', speaker: 'aurelio', text: 'Then she\'ll have to wait up.' },
      ],
      again: [
        { id: 'tr_a8', speaker: 'aurelio', text: 'Eleven minutes.' },
      ],
    },
    sleeper: {
      label: 'Look',
      first: [
        { id: 'tr_s1', speaker: 'inesThought', text: 'Him, every night. Rides to Cinder Street and back again, asleep both ways.' },
        { id: 'tr_s2', speaker: 'inesThought', text: 'I let him. It\'s the warmest place he goes.' },
      ],
      again: [
        { id: 'tr_s3', speaker: 'inesThought', text: 'Still asleep.' },
      ],
    },
  },

  // When the tickets are done.
  wrong: [
    { id: 'tr_w1', speaker: 'inesThought', text: 'Two minutes.' },
  ],
  lookUp: [
    { id: 'tr_w2', speaker: 'teo', text: 'Mum.', auto: 1600 },
    { id: 'tr_w3', speaker: 'teo', text: 'Mum, look up.', auto: 2400 },
  ],
  sky: [
    { id: 'tr_k1', speaker: 'inesThought', text: 'Two lights. No —', auto: 2600 },
    { id: 'tr_k2', speaker: 'inesThought', text: 'One light. And one place where the stars aren\'t.', auto: 3600 },
    { id: 'tr_k3', speaker: 'teo', text: 'It\'s her. It\'s Star.', auto: 2600 },
    { id: 'tr_k4', speaker: 'aurelio', text: 'Who\'s the other one?', auto: 3200 },
  ],
  mirror: [
    { id: 'tr_k5', speaker: 'inesThought', text: 'They move the same. Exactly the same. Like someone standing at a mirror.', auto: 4400 },
  ],
  drop: [
    { id: 'tr_k6', speaker: 'mara', text: 'Teo. Teo, come here—', auto: 1400 },
  ],
};
