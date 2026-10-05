import { RoomTone, Sirens, ConvergenceAlarm, PartyLoop, VisionDrone, HelmetBreath, CallTone, ArchiveHiss, BridgeAmbience, SkyWind, VigilCrowd, TramAmbience } from './Ambience.js';
import { RunCue, ChamberPad, DuelCue } from './Music.js';
import { audio } from './AudioEngine.js';

// Long-lived sound layers shared across scenes. The alarm, for instance, keeps
// ringing in Parallax's room while the call scene is on screen — until it doesn't.

export const sound = {
  room: new RoomTone(),
  sirens: new Sirens(),
  alarm: new ConvergenceAlarm(),
  party: new PartyLoop(),
  vision: new VisionDrone(),
  breath: new HelmetBreath(),
  callTone: new CallTone(),
  run: new RunCue(),
  chamber: new ChamberPad(),
  hiss: new ArchiveHiss(),
  bridge: new BridgeAmbience(),
  skyWind: new SkyWind(),
  vigil: new VigilCrowd(),
  tram: new TramAmbience(),
  duel: new DuelCue(),

  stopAll(fade = 0.5) {
    ['room', 'sirens', 'alarm', 'party', 'vision', 'breath', 'callTone', 'hiss', 'bridge', 'skyWind', 'vigil', 'tram'].forEach((k) => this[k].stop(fade));
    this.run.stop(fade);
    this.duel.stop(fade);
    this.chamber.stop(fade);
    // Fresh instances so a restart begins from silence with clean state.
    this.room = new RoomTone();
    this.sirens = new Sirens();
    this.alarm = new ConvergenceAlarm();
    this.party = new PartyLoop();
    this.vision = new VisionDrone();
    this.breath = new HelmetBreath();
    this.callTone = new CallTone();
    this.run = new RunCue();
    this.chamber = new ChamberPad();
    this.hiss = new ArchiveHiss();
    this.bridge = new BridgeAmbience();
    this.skyWind = new SkyWind();
    this.vigil = new VigilCrowd();
    this.tram = new TramAmbience();
    this.duel = new DuelCue();
    audio.setArchive(false, 0.05);
    audio.setHelmet(false, 0.05);
    audio.restoreWorld(0.3);
  },
};
