import { ROAR_COOLDOWN } from '../constants.js';

export class HUD {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.inset = '0';
    this.el.style.pointerEvents = 'none';
    this.el.innerHTML = `
      <style>
        .hud-chip{background:rgba(10,15,18,.7);color:#fff;padding:10px 12px;border:2px solid #78909c;font-size:12px;letter-spacing:1px}
        .alarm{opacity:.35;transition:.2s}
        .alarm.active{opacity:1;color:#ff1744;animation:alarmPulse .5s infinite alternate}
        .roar-wrap{position:absolute;left:50%;transform:translateX(-50%);bottom:18px;text-align:center}
        .roar-bar{width:220px;height:16px;border:2px solid #eee;background:#2e2e2e}
        .roar-fill{height:100%;width:0;background:#ff8f00}
        .debug{font-size:10px;white-space:pre}
        @keyframes alarmPulse{from{filter:brightness(1)}to{filter:brightness(1.5)}}
      </style>
      <div id="hud-meat" class="hud-chip" style="position:absolute;left:14px;top:14px">🥩 × 0</div>
      <div id="hud-alarm" class="hud-chip alarm" style="position:absolute;right:14px;top:14px">⚠ ALARM</div>
      <div class="roar-wrap">
        <div style="margin-bottom:4px;color:#fff;font-size:11px">ROAR</div>
        <div class="roar-bar"><div id="hud-roar-fill" class="roar-fill"></div></div>
      </div>
      <div id="hud-debug" class="hud-chip debug" style="position:absolute;left:14px;bottom:14px;display:none"></div>
    `;
    container.appendChild(this.el);

    this.meat = this.el.querySelector('#hud-meat');
    this.alarm = this.el.querySelector('#hud-alarm');
    this.roarFill = this.el.querySelector('#hud-roar-fill');
    this.debug = this.el.querySelector('#hud-debug');
  }

  update(state) {
    this.meat.textContent = `🥩 × ${state.baskets.filter((b) => b.collected).length}`;
    this.alarm.classList.toggle('active', state.alarmActive);

    const ratio = 1 - Math.max(0, state.tiger.roarCooldown) / ROAR_COOLDOWN;
    this.roarFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    this.roarFill.style.background = ratio >= 1 ? '#ff8f00' : '#616161';

    this.debug.style.display = state.debug ? 'block' : 'none';
    this.debug.textContent = `phase: ${state.phase}\nplayer: ${state.player.position.x.toFixed(1)}, ${state.player.position.z.toFixed(1)}\nalarm: ${state.alarmActive}`;
  }
}
