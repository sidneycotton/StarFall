# STARFALL

Chapter One: *What Survives* · Chapter Two: *The Starfall Record* · Chapter Three: *The Request* (in progress)

A playable cinematic narrative game (two chapters so far, ≈25 minutes in all).
Celestial neo-noir, illustrated science fantasy. Built with Phaser 3, Web Audio
and a DOM/CSS UI layer. There are **no image or audio files**: every texture
is painted procedurally to canvas at boot, and every sound is synthesised.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
# or a production build
npm run build && npm run preview
```

**Live build:** https://sidneycotton.github.io/StarFall/ — GitHub Pages serves this
branch's root, so `index.html` + `assets/` at the root are the committed build.
The dev entry is `app/index.html`. After changing the game, run `npm run publish`
(build + copy to root) and commit the result to update the live page.

Headphones recommended. Sound starts after the first click/tap (browser audio policy).

### Controls

| | Desktop | Gamepad | Touch |
|---|---|---|---|
| Move | A / D, ← / → | Left stick / D-pad | Chevrons (appear after first touch) |
| Interact / advance / strike | E, Space, Enter | A | Tap the prompt, or *Use* |
| Dodge | Shift, Q | B | *Dodge* (appears in combat) |
| Dialogue history | H | | ☰ top-right |
| Settings / pause | Esc | Start | ⚙ top-right |

Clicking/tapping anywhere also advances dialogue; holding speeds up the typewriter.

Settings: captions (sound subtitles, on by default), text speed, reduce motion,
sound on/mute, master and music volume, assist (relaxed timing or automatic
quick-time events and combat), restart.

### Jumping to a section (for review)

`?stage=wake|explore|call|aftermath|chamber|title` (Chapter One) or
`?stage=vigil|tram|span|sky|vigilEnd|title2` (Chapter Two) or
`?stage=crowd|bedsit|relay|ambush|mine|title3` (Chapter Three, in progress) starts at that section
(add `&auto` to skip the start prompt, `&autoplay` to auto-advance dialogue).

## The sequence

1. **Wake** — black; a siren far away; a vibration; a tiny red pulse. Violet seeps in.
   A hand, a glass. Parallax sits up.
2. **Explore** — the penthouse, hungover. Eight optional interactions.
   The alarm grows clearer toward the sanctum. Red fights violet.
3. **The helmet** — the suit in darkness, the helmet, the seal. The persona returns.
4. **The call** — the Triune: three Seers, one vision, fragments of it.
5. **Aftermath** — silence. The first fear. The chair goes over.
6. **The run** — shutters, sirens, gold streaks over the city, *STAR PROTOCOL*.
7. **The chamber** — five D-class heroes. *“…you?”* *“Of course.”*
8. **STARFALL.**

### Chapter Two — The Starfall Record

Seven years later. The city gathers in Vesper Plaza for the anniversary, where the
Civic Network reads out what 1,412 witnesses saw that night. One of them drove the last tram.

1. **The vigil** — walk through the crowd beneath her statue.
2. **Tram 6** — Ines's last run across the Lantern Bridge: tickets, passengers, the stop at Midspan.
3. **The span** — two lights overhead, and the bridge giving way beneath them.
4. **The West Tower** — 23:44, seen from below. One choice: keep looking, or cover Teo's eyes.
5. **The names.**

## Architecture

```
src/
  (app/index.html)        dev entry; root index.html + assets/ are the published build
  main.js                 game config, global pause/restart
  config.js               design space (1600×900), palettes, stage list
  core/                   EventBus, Settings, NarrativeState (save-ready story state), storage
  audio/                  AudioEngine (buses, reverb, helmet filter), sfx recipes,
                          Ambience layers (alarm shares its clock with the lighting, bridge, sky, vigil),
                          Music cues, VoiceModulator (Parallax's helmet voice), soundscape registry
  art/                    procedural painters per domain (kit, bedroom, lounge, sanctum,
                          parallax, seers, vision, chamber, city, lights, star, bridge,
                          sky, vigil) + paint toolkit
  fx/                     CinematicPipeline (film pass: red duotone, grain, chromatic
                          separation, vignette, flash/fade) and ScreenFX controller
  entities/               Parallax (procedural cut-out rig with pose blending and cloth),
                          PlayerController (tired / precise / run temperaments)
  systems/                Input (keyboard/gamepad/touch + action routing), Interactions,
                          CameraDirector (lead, focus, shots, pairs), Cutscene helpers,
                          QTE (press / hold / mash), Duel (readable melee: tells, dodges, openings)
  ui/                     DOM overlay: Dialogue (typewriter subtitles), TouchControls,
                          Panels (settings, history), prompts, captions, HUD, title,
                          RecordOverlay (timecode, sources, witness notes, choices)
  scenes/                 Boot, Penthouse (+ layout / world / lighting), SeerCall (+ Feed),
                          Chamber, Title, Vigil, Tram, Span (the bridge), Sky (the West Tower);
                          Record, Overhead (retired, unregistered)
  data/                   script, speakers, heroes, record
```

Design notes:

- **Design space.** Everything is authored at 1600×900 and letterboxed with
  `Scale.FIT`; the DOM UI tracks the canvas rectangle and sizes type from its height.
- **Parallax layers.** Walls sit on a slower plane than furniture; window openings are
  real holes onto city layers. `layout.px()` places any object on any plane so it
  lines up with its world position.
- **Two lights.** The convergence alarm's audio clock drives the red pulse; each pulse
  suppresses the violet party lights and pushes the frame through the shader's red duotone.
- **Narrative state** records stage, checkpoint, inspected objects, dialogue progress and
  flags (e.g. `starFigurineExamined`), persisted to localStorage.
