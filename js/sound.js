// ===== 사운드: 외부 파일 없이 WebAudio로 만든 간단한 효과음 + 설정 저장 =====
window.Sound = (() => {
  const KEY = "wasteland-settings";
  let ctx = null, on = true;
  try { on = JSON.parse(localStorage.getItem(KEY) || "{}").sound !== false; } catch (e) {}

  function tone(f0, dur, type = "sine", vol = .07, delay = 0, f1 = f0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
  }
  const SFX = {
    click:  () => tone(520, .05, "square", .03),
    open:   () => tone(170, .35, "triangle", .08, 0, 120),
    hurt:   () => { tone(150, .28, "sawtooth", .07, 0, 60); },
    mind:   () => { tone(330, .45, "sine", .06, 0, 190); tone(335, .45, "sine", .05, .02, 180); },
    heal:   () => { tone(440, .12, "sine", .06); tone(660, .18, "sine", .06, .1); },
    item:   () => { tone(620, .08, "triangle", .06); tone(880, .12, "triangle", .06, .07); },
    ending: () => { [196, 247, 330].forEach((f, i) => tone(f, 1.6, "sine", .05, i * .15)); }
  };
  return {
    get on() { return on; },
    set(v) {
      on = !!v;
      try { localStorage.setItem(KEY, JSON.stringify({ sound: on })); } catch (e) {}
    },
    play(name) {
      if (!on) return;
      try {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        SFX[name] && SFX[name]();
      } catch (e) {}
    }
  };
})();
