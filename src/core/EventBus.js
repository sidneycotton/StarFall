// Tiny pub/sub shared by game scenes, the DOM UI layer and the audio engine.
// Phaser has its own emitters, but the UI and audio live outside Phaser, so a
// framework-free bus keeps those modules independent of the renderer.

class Bus {
  constructor() {
    this.handlers = new Map();
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.off(type, fn);
  }

  once(type, fn) {
    const off = this.on(type, (payload) => {
      off();
      fn(payload);
    });
    return off;
  }

  off(type, fn) {
    this.handlers.get(type)?.delete(fn);
  }

  emit(type, payload) {
    this.handlers.get(type)?.forEach((fn) => fn(payload));
  }
}

export const bus = new Bus();
