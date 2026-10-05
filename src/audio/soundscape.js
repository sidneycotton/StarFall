import { RoomTone, Sirens, ConvergenceAlarm, PartyLoop, VisionDrone, HelmetBreath, CallTone } from './Ambience.js';
import { RunCue, ChamberPad } from './Music.js';
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

  stopAll(fade = 0.5) {
    ['room', 'sirens', 'alarm', 'party', 'vision', 'breath', 'callTone'].forEach((k) => this[k].stop(fade));
    this.run.stop(fade);
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
    audio.setHelmet(false, 0.05);
    audio.restoreWorld(0.3);
  },
};
