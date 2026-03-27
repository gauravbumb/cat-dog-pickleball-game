export class EndScreen {
  constructor(container) {
    this.onReplay = null;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.8);display:none;align-items:center;justify-content:center;pointer-events:auto';
    this.el.innerHTML = `
      <div style="background:#111b22;border:4px solid #90a4ae;padding:24px;min-width:420px;text-align:center;color:#fff">
        <div id="end-title" style="font-size:30px;margin-bottom:12px"></div>
        <div id="end-sub" style="margin-bottom:14px"></div>
        <div id="end-baskets" style="margin-bottom:20px"></div>
        <button id="end-replay" style="padding:10px 14px;background:#ff8f00;border:none;color:#111;font-weight:bold;cursor:pointer">Play Again</button>
      </div>
    `;
    container.appendChild(this.el);
    this.title = this.el.querySelector('#end-title');
    this.sub = this.el.querySelector('#end-sub');
    this.baskets = this.el.querySelector('#end-baskets');
    this.el.querySelector('#end-replay').addEventListener('click', () => this.onReplay?.());
  }

  openWin(collected, total) {
    this.title.textContent = 'LEVEL COMPLETE';
    this.title.style.color = '#ffb74d';
    this.sub.textContent = 'Shera is free. Tadoba awaits.';
    this.baskets.textContent = `🥩 ${collected} / ${total}`;
    this.el.style.display = 'flex';
  }

  openCaught() {
    this.title.textContent = 'CAUGHT.';
    this.title.style.color = '#ff1744';
    this.sub.textContent = 'Shera waits. Try again.';
    this.baskets.textContent = '';
    this.el.style.display = 'flex';
  }

  close() { this.el.style.display = 'none'; }
}
