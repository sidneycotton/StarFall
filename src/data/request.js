// Chapter Three — The Request. Everything is seen by Wallflower, who is very
// hard to see. Nobody in this chapter is looking at them, until somebody is.
//
// `auto` lines play over the action without stopping it.

export const REQUEST = {
  title: { chapter: 'Chapter Three', sub: 'The Request' },

  // Sound, for anyone who can't hear it. Shown with subtitles on.
  cc: {
    cup: '[ a cup, set down on a shoulder ]',
    quake: '[ the ground, groaning ]',
    sirens: '[ sirens ]',
    post: '[ metal, falling ]',
    steam: '[ steam, screaming ]',
    water: '[ water, breaking through stone ]',
    hoarding: '[ a hoarding, shaking ]',
    hum: '[ someone humming, very low ]',
    screens: '[ every screen, cutting out ]',
    letter: '[ paper, sliding under the door ]',
    door: '[ the door ]',
    kettle: '[ the kettle, ticking as it cools ]',
    officeDoor: '[ a stuck door, giving ]',
    ringing: '[ ringing ]',
    lights: '[ the lamps, going out one by one ]',
    her: '[ footsteps that don\'t echo ]',
    lintel: '[ the lintel, coming down ]',
    backDoor: '[ the back door ]',
    power: '[ the power, cut ]',
    leaving: '[ the door, closing behind her ]',
    car: '[ brakes; a car door ]',
    broadcast: '[ every screen changes at once ]',
    radio: '[ a radio, between stations ]',
  },

  // 3.1 — Vesper Plaza, the vigil, the minutes before the screens cut out.
  crowd: {
    place: 'Vesper Plaza · the seventh anniversary',
    open: [
      { id: 'rq_c1', speaker: 'wallflowerThought', text: 'Every year I stand at the back, and every year somebody puts a drink down on me.', auto: 4200 },
      { id: 'rq_c2', speaker: 'crowd', text: '—oh, sorry, I didn\'t— sorry.', auto: 2200 },
      { id: 'rq_c3', speaker: 'wallflowerThought', text: 'They never finish the apology. They forget, halfway, who it was for.', auto: 4000 },
    ],
    stillHint: 'Let go of everything — stand still',
    stillHintTouch: 'Let go — stand still',
    moveHint: (k) => `${k} — move`,
    stillLearned: [
      { id: 'rq_c4', speaker: 'wallflowerThought', text: 'There. The crowd goes round me like water round a post.', auto: 3600 },
    ],
    quake: [
      { id: 'rq_q1', speaker: 'crowd', text: 'What was—', auto: 900 },
      { id: 'rq_q2', speaker: 'crowd', text: 'Get back! Get BACK—', auto: 1400 },
    ],
    child: {
      prompt: 'Pull her out',
      lines: [
        { id: 'rq_k1', speaker: 'wallflower', text: 'I\'ve got you. Hold on to my coat.', auto: 2400 },
        { id: 'rq_k2', speaker: 'crowdChild', text: 'Where did you come from?', auto: 2400 },
        { id: 'rq_k3', speaker: 'wallflowerThought', text: 'She looked right at me. Nobody does that.', auto: 3000 },
      ],
    },
    // Four other people doing something impossible, in four places at once.
    // Nobody else sees any of it.
    others: {
      paperweight: [
        { id: 'rq_o1', speaker: 'wallflowerThought', text: 'A lamp post came down on a pram, and stopped. A woman was holding one hand under it. Not touching it. Under it.', auto: 5200 },
      ],
      lukewarm: [
        { id: 'rq_o2', speaker: 'wallflowerThought', text: 'The steam main burst and a woman put her hand flat on it. The steam came out cold.', auto: 4600 },
      ],
      dowser: [
        { id: 'rq_o3', speaker: 'dowser', text: 'Not that way — the water\'s coming up that way!', auto: 2600 },
        { id: 'rq_o4', speaker: 'wallflowerThought', text: 'Nothing was coming up. Then the culvert went, exactly where he\'d pointed.', auto: 4200 },
      ],
      humdrum: [
        { id: 'rq_o5', speaker: 'wallflowerThought', text: 'A man had his ear against the hoarding, humming. It stopped shaking. Then it stopped humming back.', auto: 4800 },
      ],
    },
    after: [
      { id: 'rq_a1', speaker: 'wallflowerThought', text: 'Nobody thanked any of them. None of them saw each other.', auto: 3800 },
      { id: 'rq_a2', speaker: 'wallflowerThought', text: 'I saw all four.', auto: 2600 },
    ],
    screen: 'ASTRONOMICAL EVENT UNDER INVESTIGATION',
  },

  // 3.2 — The bedsit, the next morning.
  bedsit: {
    place: 'Cinder Street · the next morning',
    open: [
      { id: 'rq_b1', speaker: 'wallflowerThought', text: 'Four hours\' sleep. The building was still ticking from the quake.', auto: 3600 },
    ],
    items: {
      card: {
        label: 'Registration card',
        lines: [
          { id: 'rq_i1', speaker: 'wallflowerThought', text: 'REG —·————. They never finished issuing the number. The clerk kept forgetting I was at the counter.' },
        ],
      },
      rejection: {
        label: 'Letter',
        lines: [
          { id: 'rq_i2', speaker: 'wallflowerThought', text: '"We regret that the Guild was unable to observe the applicant\'s ability during assessment."' },
          { id: 'rq_i3', speaker: 'wallflowerThought', text: 'That was the ability.' },
        ],
      },
      phone: {
        label: 'Phone',
        lines: [
          { id: 'rq_i4', speaker: 'wallflowerThought', text: 'No missed calls. There never are. I check anyway.' },
        ],
      },
      mirror: {
        label: 'Mirror',
        lines: [
          { id: 'rq_i5', speaker: 'wallflowerThought', text: 'I don\'t look for long. If I stand still in front of it, it gets hard to find me.' },
        ],
      },
      window: {
        label: 'Window',
        lines: [
          { id: 'rq_i6', speaker: 'wallflowerThought', text: 'Every screen on the street is showing the sky from last night. Nobody can say what it was.' },
        ],
      },
      radio: {
        label: 'Radio',
        lines: [
          { id: 'rq_i7', speaker: 'radio', text: '—four incidents in Vesper Plaza during the vigil. A burst main, a hoarding, a lamp post, flooding at the old culvert.' },
          { id: 'rq_i8', speaker: 'radio', text: 'No deaths. A girl of six was found unhurt under the statue. She says somebody pulled her out. Officers found nobody near her.' },
          { id: 'rq_i9', speaker: 'wallflowerThought', text: 'I was near her. I had hold of her hand.' },
        ],
      },
      cutting: {
        label: 'Cutting',
        lines: [
          { id: 'rq_i10', speaker: 'wallflowerThought', text: 'The Starfall. Everyone has this picture; the Network gave it away. Star over the Lantern Bridge, and a second light the papers call a flaw in the lens.' },
          { id: 'rq_i11', speaker: 'wallflowerThought', text: 'The longer I look, the less it looks like a flaw. It\'s facing her.' },
        ],
      },
      tally: {
        label: 'Marks on the wall',
        lines: [
          { id: 'rq_i12', speaker: 'wallflowerThought', text: 'A tally, behind the bed. One for every time somebody said my name without being told it.' },
          { id: 'rq_i13', speaker: 'wallflowerThought', text: 'Eleven. Twenty-nine years.' },
        ],
      },
      coat: {
        label: 'Coat',
        lines: [
          { id: 'rq_i14', speaker: 'wallflowerThought', text: 'Last night\'s coat. A small muddy handprint on the cuff, where she held on.' },
          { id: 'rq_i15', speaker: 'wallflowerThought', text: 'I haven\'t washed it. It\'s the only proof.' },
        ],
      },
    },
    tallyAfter: [
      { id: 'rq_l3', speaker: 'wallflowerThought', text: 'I made a twelfth mark. Then I sat on the bed and looked at it for a while.', auto: 4200 },
    ],
    letterHint: 'Something under the door',
    letter: {
      label: 'Letter',
      text: [
        'Wallflower —',
        'I saw what you did in the plaza last night. I don\'t think anyone else did.',
        'I need help that the Guild won\'t give me. Tonight, the old Aureate relay station on the Sere road. Come alone. There will be others.',
        '— Lodestar',
      ],
      after: [
        { id: 'rq_l1', speaker: 'wallflowerThought', text: 'Somebody wrote to Wallflower. Nobody has ever written to Wallflower.', auto: 3600 },
        { id: 'rq_l2', speaker: 'wallflowerThought', text: 'It was under my door. Nobody knows where I live.', auto: 3600 },
      ],
    },
  },

  // 3.3 — The relay station on the Sere road, at dusk.
  relay: {
    place: 'Aureate Relay 9 · the Sere road · dusk',
    open: [
      { id: 'rq_r1', speaker: 'wallflowerThought', text: 'First one here. I stood by the door, so I\'d see who came.', auto: 3600 },
    ],
    arrivals: [
      [
        { id: 'rq_r2', speaker: 'dowser', text: 'Hello? …Lodestar?', auto: 2000 },
        { id: 'rq_r3', speaker: 'dowser', text: 'Place smells of dry wells.', auto: 2400 },
      ],
      [
        { id: 'rq_r4', speaker: 'paperweight', text: 'Are you Lodestar? You\'re not Lodestar.', auto: 2400 },
        { id: 'rq_r5', speaker: 'dowser', text: 'Got one of these?', auto: 1800 },
        { id: 'rq_r6', speaker: 'paperweight', text: 'Same handwriting. Same everything.', auto: 2400 },
      ],
      [
        { id: 'rq_r7', speaker: 'humdrum', text: 'Evening. Is this the— is this it?', auto: 2400 },
        { id: 'rq_r7b', speaker: 'humdrum', text: 'Mind the third step. It\'s gone.', auto: 2200 },
        { id: 'rq_r8', speaker: 'lukewarm', text: 'If it isn\'t, I\'m going home, I\'ve a shift at six.', auto: 2800 },
      ],
    ],
    introductions: [
      { id: 'rq_n1', speaker: 'dowser', text: 'Dowser. Plumbing co-op, Ward Eleven.' },
      { id: 'rq_n2', speaker: 'paperweight', text: 'Paperweight. Parties, mostly.' },
      { id: 'rq_n3', speaker: 'humdrum', text: 'Humdrum. I do glasses.' },
      { id: 'rq_n4', speaker: 'lukewarm', text: 'Lukewarm. Don\'t.' },
      { id: 'rq_n5', speaker: 'humdrum', text: 'So that\'s the four of us.' },
    ],
    // Wallflower is standing by the door. They have to move to be counted.
    countHint: 'Step forward',
    countHintTouch: 'Step forward',
    passing: [
      { id: 'rq_r9', speaker: 'wallflowerThought', text: 'He came in past me close enough to touch. He didn\'t.', auto: 3200 },
    ],
    counted: [
      { id: 'rq_n6', speaker: 'wallflower', text: 'Five.' },
      { id: 'rq_n7', speaker: 'paperweight', text: 'Oh my— how long have you been there?', pause: 200 },
      { id: 'rq_n8', speaker: 'wallflower', text: 'First.' },
      { id: 'rq_n9', speaker: 'lukewarm', text: '…Right. Five.' },
    ],
    notCounted: [
      { id: 'rq_n10', speaker: 'wallflowerThought', text: 'I left it too long. It\'s always too long, and then it\'s too late to say.', auto: 3800 },
    ],
    // What they do with their hands while they wait.
    small: [
      { id: 'rq_s1', speaker: 'lukewarm', text: 'Kettle\'s stone cold. Oh. No, that was me. Sorry.', auto: 3000 },
      { id: 'rq_s2', speaker: 'paperweight', text: 'There. He\'ll stay put a minute.', auto: 2400 },
      { id: 'rq_s3', speaker: 'humdrum', text: 'Door\'s stuck. Hang on.', auto: 1800 },
      { id: 'rq_s4', speaker: 'dowser', text: 'Why do I keep looking at the desert?', auto: 2600 },
    ],
    call: [
      { id: 'rq_p1', speaker: 'dowser', text: 'She\'s on the registry. I\'ll ring her.', auto: 2400 },
      { id: 'rq_p2', speaker: 'lodestarPhone', text: '…Hello? Who is this? How did you get this number?', pause: 1600 },
      { id: 'rq_p3', speaker: 'dowser', text: 'We got your letter. The relay station.' },
      { id: 'rq_p4', speaker: 'lodestarPhone', text: 'What letter? I haven\'t sent anyone a letter.' },
      { id: 'rq_p5', speaker: 'lodestarPhone', text: 'Where did you say you were?' },
    ],
  },

  // 3.4 — The ambush. Survival, not victory.
  ambush: {
    lights: [
      { id: 'rq_x1', speaker: 'wallflowerThought', text: 'The lights went out one at a time, from the far end. Not a fault. Somebody walking.', auto: 4400 },
    ],
    arrive: [
      { id: 'rq_x2', speaker: 'parallax', text: 'Five letters. Five of you. Nobody ever believes a letter any more.', voiceGain: 0.07 },
      { id: 'rq_x3', speaker: 'lukewarm', text: 'Oh no. No, no—', auto: 1400 },
      { id: 'rq_x4', speaker: 'parallax', text: 'Sit down. All of you. This won\'t take long, and then it will.', voiceGain: 0.07 },
    ],
    // The four try their powers, at a scale they have never tried them at.
    humdrum: [
      { id: 'rq_h1', speaker: 'humdrum', text: '—', auto: 600 },
      { id: 'rq_h2', speaker: 'parallax', text: 'You hum with your hands. Everybody thinks it\'s the throat.', voiceGain: 0.07 },
      { id: 'rq_h3', speaker: 'parallax', text: 'Not any more.', voiceGain: 0.07 },
    ],
    dowser: [
      { id: 'rq_d1', speaker: 'dowser', text: 'Back door— everyone, the back—', auto: 1600 },
      { id: 'rq_d2', speaker: 'parallax', text: 'You always run downhill. Water does.', voiceGain: 0.07 },
    ],
    goOn: [
      { id: 'rq_d3', speaker: 'parallax', text: 'Go on.', voiceGain: 0.07, auto: 1400 },
    ],
    outside: [
      { id: 'rq_d4', speaker: 'wallflowerThought', text: 'She was already out there.', auto: 2600 },
    ],
    paperweight: [
      { id: 'rq_w1', speaker: 'paperweight', text: 'Stay— stay THERE—', auto: 1600 },
      { id: 'rq_w2', speaker: 'parallax', text: 'A minute. You can hold anything for a minute. Then what?', voiceGain: 0.07 },
    ],
    pulled: [
      { id: 'rq_w3', speaker: 'paperweight', text: 'Who— who\'s got me?', auto: 2000 },
    ],
    dropped: [
      { id: 'rq_w4', speaker: 'paperweight', text: '—', auto: 900 },
    ],
    lukewarm: [
      { id: 'rq_u1', speaker: 'parallax', text: 'Room temperature. Show me how much room.', voiceGain: 0.07 },
      { id: 'rq_u2', speaker: 'lukewarm', text: 'Let go— let GO of me—', auto: 1600 },
    ],
    powerCut: [
      { id: 'rq_u3', speaker: 'wallflowerThought', text: 'The boiler died. She didn\'t let go.', auto: 2800 },
    ],
    // Wallflower moves only when the helmet is turned away.
    stillHint: 'Stand still',
    moveHint: 'Move while she looks away',
    seen: [
      { id: 'rq_e1', speaker: 'parallax', text: '…', voiceGain: 0.05, auto: 1400 },
      { id: 'rq_e2', speaker: 'wallflowerThought', text: 'She turned to the air where I\'d been. Then back, to whoever was nearest.', auto: 3800 },
    ],
    seenAgain: [
      { id: 'rq_e3', speaker: 'wallflowerThought', text: 'Again. The air, and then whoever was nearest.', auto: 2800 },
    ],
    tasks: {
      power: { label: 'Cut the power' },
      bar: { label: 'Kick the bar loose' },
      drag: { label: 'Pull her out of the doorway' },
    },
    // The one choice.
    choose: (stay, step) => `Stay still · or walk to her (${step} to step forward)`,
    chooseTouch: 'Stay still · or walk to her',
    stay: [
      { id: 'rq_y1', speaker: 'wallflowerThought', text: 'I didn\'t move. I didn\'t breathe.', auto: 2600 },
      { id: 'rq_y2', speaker: 'lukewarm', text: '—', auto: 1600 },
      { id: 'rq_y3', speaker: 'parallax', text: 'Four.', voiceGain: 0.07 },
    ],
    step: [
      { id: 'rq_z1', speaker: 'wallflower', text: 'Put her down.' },
      { id: 'rq_z2', speaker: 'parallax', text: '…', voiceGain: 0.05, pause: 1400 },
      { id: 'rq_z3', speaker: 'parallax', text: 'Five.', voiceGain: 0.07, pause: 900 },
    ],
    leave: [
      { id: 'rq_v1', speaker: 'parallax', text: 'Go home. Sleep if you can. I\'ll be in touch.', voiceGain: 0.07 },
      { id: 'rq_v2', speaker: 'wallflowerThought', text: 'She stepped over the broken stair without looking down.', auto: 3400 },
    ],
  },

  // 3.5 — The hospital. Mine.
  mine: {
    place: 'Vesper General · 03:10',
    lodestar: [
      { id: 'rq_m1', speaker: 'lodestar', text: 'I came as fast as— oh, God. Oh, your hand.', auto: 2600 },
      { id: 'rq_m2', speaker: 'lodestar', text: 'Get in the car. All of you. No, don\'t argue, get in.', auto: 3000 },
      { id: 'rq_m3', speaker: 'wallflowerThought', text: 'She held the door for five. She didn\'t count. She just waited until it felt right.', auto: 4200 },
    ],
    waiting: [
      { id: 'rq_g1', speaker: 'paperweight', text: 'Why us? We\'re nobody. We\'re a party trick and a plumber.', auto: 3200 },
      { id: 'rq_g2', speaker: 'dowser', text: 'Plumbing co-op.', auto: 1800 },
    ],
    lookHint: 'Look around',
    // The four, to each other.
    chat: [
      [
        { id: 'rq_t1', speaker: 'lukewarm', text: 'Where\'s she gone? Lodestar.', auto: 2000 },
        { id: 'rq_t2', speaker: 'humdrum', text: 'Parking.', auto: 1500 },
        { id: 'rq_t3', speaker: 'paperweight', text: 'Forty minutes, parking.', auto: 2000 },
      ],
      [
        { id: 'rq_t4', speaker: 'dowser', text: 'She wrote to all of us. By hand. Who does that?', auto: 2600 },
        { id: 'rq_t5', speaker: 'paperweight', text: 'Somebody who knew where we live.', auto: 2200 },
        { id: 'rq_t6', speaker: 'lukewarm', text: 'I\'m not hard to find. I\'m just not worth finding.', auto: 2800 },
      ],
      [
        { id: 'rq_t7', speaker: 'humdrum', text: 'Did she look at any of you? Properly, I mean.', auto: 2600 },
        { id: 'rq_t8', speaker: 'lukewarm', text: 'Not at me.', auto: 1600 },
        { id: 'rq_t9', speaker: 'dowser', text: 'Not at anybody. Past us. Like we were a window.', auto: 3000 },
      ],
    ],
    chatStepped: [
      { id: 'rq_t10', speaker: 'wallflowerThought', text: 'At me.', auto: 1800 },
    ],
    items: {
      dowser: { label: 'Dowser', lines: [
        { id: 'rq_wr1', speaker: 'wallflowerThought', text: 'He has his good hand flat on the floor tiles. Feeling for water, he says. There\'s a lot of it, under a hospital.' },
      ] },
      paperweight: { label: 'Paperweight', lines: [
        { id: 'rq_wr2', speaker: 'wallflowerThought', text: 'She keeps rubbing her arm where somebody had hold of her. She hasn\'t asked who. Neither have I.' },
      ], linesDropped: [
        { id: 'rq_wr3', speaker: 'wallflowerThought', text: 'Her leg\'s splinted to the knee. Nobody\'s come to look at it. Nobody\'s come to look at any of us.' },
      ] },
      humdrum: { label: 'Humdrum', lines: [
        { id: 'rq_wr4', speaker: 'wallflowerThought', text: 'He\'s humming. The note the office door made before it gave. I don\'t think he knows he\'s doing it.' },
      ] },
      lukewarm: { label: 'Lukewarm', lines: [
        { id: 'rq_wr5', speaker: 'wallflowerThought', text: 'Bruises round both wrists, where she was held up off the floor. I stood still and let her be counted.' },
        { id: 'rq_wr6', speaker: 'wallflowerThought', text: 'I\'d do it again. I think I\'d do it again.' },
      ], linesStepped: [
        { id: 'rq_wr7', speaker: 'wallflowerThought', text: 'She keeps glancing at the end chair. At me. Then away, the way you check a stove you know you turned off.' },
      ] },
      clock: { label: 'Clock', lines: [
        { id: 'rq_wr8', speaker: 'wallflowerThought', text: 'Ten past three. The second hand sticks on the seven and has to try again.' },
      ] },
      hatch: { label: 'Reception', lines: [
        { id: 'rq_wr9', speaker: 'wallflowerThought', text: 'The nurse at the hatch took four names and slid it shut. I gave mine twice.' },
      ] },
      machine: { label: 'Vending machine', lines: [
        { id: 'rq_wr10', speaker: 'wallflowerThought', text: 'It took my coin and gave me nothing. That seems fair.' },
      ] },
    },
    crawl: 'Parallax seen for the first time in seven years · on the anniversary of the Starfall',
    broadcast: [
      { id: 'rq_bc1', speaker: 'parallax', text: 'Vesper. You remember me.', voiceGain: 0.08 },
      { id: 'rq_bc2', speaker: 'parallax', text: 'These five are mine.', voiceGain: 0.08, pause: 800 },
    ],
    fifthBlank: 'REG —·————',
    fifthSeen: 'RELAY 9 · CAM 2 · 23:58',
    close: [
      { id: 'rq_f1', speaker: 'humdrum', text: 'Five? There\'s four of us.', auto: 2400 },
      { id: 'rq_f2', speaker: 'wallflowerThought', text: 'I was in the chair next to him.', auto: 3000 },
    ],
    closeSeen: [
      { id: 'rq_f3', speaker: 'lukewarm', text: 'That\'s you. On the telly. That\'s you.', auto: 2600 },
      { id: 'rq_f4', speaker: 'wallflowerThought', text: 'The first time anyone ever put my face on a screen.', auto: 3400 },
    ],
  },
};
