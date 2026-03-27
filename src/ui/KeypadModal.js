import { CAGE_CODE } from '../constants.js';

export class KeypadModal {
  constructor(container) {
    this.container = container;
    this.onResult = null;
    this.selected = [];

    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.65);display:none;align-items:center;justify-content:center;pointer-events:auto;';
    this.el.innerHTML = `
      <style>
        .kp-box{background:#1b252b;border:4px solid #90a4ae;padding:18px;min-width:300px;text-align:center;color:#fff}
        .kp-btn{width:56px;height:56px;border-radius:50%;font-size:24px;margin:7px;border:2px solid #fff;cursor:pointer}
        .kp-seq{height:20px;margin:10px 0}
        .kp-dot{display:inline-block;width:14px;height:14px;border-radius:50%;margin:0 3px;background:#455a64}
        .shake{animation:shake .3s}
        @keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-6px)}100%{transform:translateX(0)}}
      </style>
      <div class="kp-box">
        <div>SECURITY KEYPAD</div>
        <div class="kp-seq" id="kp-seq"></div>
        <div>
          <button class="kp-btn" data-v="R" style="background:#ff1744">🔴</button>
          <button class="kp-btn" data-v="Y" style="background:#ffd600">🟡</button>
          <button class="kp-btn" data-v="G" style="background:#69f0ae">🟢</button>
          <button class="kp-btn" data-v="B" style="background:#2979ff">🔵</button>
        </div>
      </div>
    `;
    container.appendChild(this.el);
    this.seqEl = this.el.querySelector('#kp-seq');
    this.box = this.el.querySelector('.kp-box');

    this.el.querySelectorAll('.kp-btn').forEach((b) => {
      b.addEventListener('click', () => this.select(b.dataset.v));
    });
  }

  select(v) {
    this.selected.push(v);
    this.renderSeq();
    if (this.selected.length >= 4) {
      const ok = this.selected.join('') === CAGE_CODE.join('');
      if (ok) {
        this.close();
        this.onResult?.(true);
      } else {
        this.box.classList.add('shake');
        this.box.addEventListener('animationend', () => this.box.classList.remove('shake'), { once: true });
        this.selected = [];
        this.renderSeq();
      }
    }
  }

  renderSeq() {
    this.seqEl.innerHTML = this.selected.map((c) => `<span class="kp-dot" style="background:${{ R: '#ff1744', Y: '#ffd600', G: '#69f0ae', B: '#2979ff' }[c]}"></span>`).join('');
  }

  open(onResult) {
    this.onResult = onResult;
    this.selected = [];
    this.renderSeq();
    this.el.style.display = 'flex';
  }

  close() {
    this.el.style.display = 'none';
  }
}
