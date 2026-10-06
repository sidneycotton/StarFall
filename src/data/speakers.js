// Speaker identities for the dialogue system. `style` maps to a faction look;
// `voice` selects an audio texture; `sigil` is a tiny SVG mark beside the name.

const SIGILS = {
  umbral: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="12" cy="9" r="6.6" fill="#000"/></svg>',
  aureate: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="currentColor"/><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="0.8"/></svg>',
  meridian: '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" fill="none" stroke="currentColor" stroke-width="0.9"/><line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" stroke-width="0.7"/><line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="0.7"/></svg>',
};

export const SPEAKERS = {
  // Unhelmeted: no name. The persona hasn't been put on yet.
  self: { name: '', style: 'whisper', sigil: null, voice: null },
  parallax: { name: 'Parallax', style: 'umbral', sigil: SIGILS.umbral, voice: 'modulated' },
  candlemas: { name: 'Candlemas', style: 'aureate', sigil: SIGILS.aureate, voice: null },
  almanac: { name: 'Almanac', style: 'meridian', sigil: SIGILS.meridian, voice: null },
  her: { name: 'Her', style: 'other', sigil: null, voice: null },
  // Chapter Two. Star is only ever heard as recovered audio.
  star: { name: 'Star', style: 'aureate star', sigil: '<svg viewBox="0 0 20 20"><path d="M10 1 L11.6 8.4 L19 10 L11.6 11.6 L10 19 L8.4 11.6 L1 10 L8.4 8.4 Z" fill="currentColor"/></svg>', voice: null },
  record: { name: 'The Record', style: 'meridian record', sigil: SIGILS.meridian, voice: null },
  crowd: { name: '', style: 'whisper crowd', sigil: null, voice: null },
  // Tram 6. Mortal voices: no sigils.
  ines: { name: 'Ines', style: 'mortal', sigil: null, voice: null },
  inesThought: { name: '', style: 'whisper', sigil: null, voice: null },
  dispatch: { name: 'Hollin Yard', style: 'mortal radio', sigil: null, voice: null },
  teo: { name: 'Teo', style: 'mortal', sigil: null, voice: null },
  mara: { name: 'Mara', style: 'mortal', sigil: null, voice: null },
  nell: { name: 'Nell', style: 'mortal', sigil: null, voice: null },
  sami: { name: 'Sami', style: 'mortal', sigil: null, voice: null },
  aurelio: { name: 'Aurelio', style: 'mortal', sigil: null, voice: null },
  sleeper: { name: '', style: 'mortal', sigil: null, voice: null },
  // Chapter Three. The five, unregistered as far as anyone can tell.
  wallflower: { name: 'Wallflower', style: 'mortal', sigil: null, voice: null },
  wallflowerThought: { name: '', style: 'whisper', sigil: null, voice: null },
  dowser: { name: 'Dowser', style: 'mortal', sigil: null, voice: null },
  paperweight: { name: 'Paperweight', style: 'mortal', sigil: null, voice: null },
  humdrum: { name: 'Humdrum', style: 'mortal', sigil: null, voice: null },
  lukewarm: { name: 'Lukewarm', style: 'mortal', sigil: null, voice: null },
  lodestar: { name: 'Lodestar', style: 'aureate', sigil: SIGILS.aureate, voice: null },
  radio: { name: 'Radio', style: 'mortal radio', sigil: null, voice: null },
  lodestarPhone: { name: 'Lodestar', style: 'mortal radio', sigil: null, voice: null },
  crowdChild: { name: '', style: 'mortal', sigil: null, voice: null },
  // Chapter Four. Dowser's chapter.
  dowserThought: { name: '', style: 'whisper', sigil: null, voice: null },
  clerk: { name: 'Clerk', style: 'mortal', sigil: null, voice: null },
};
