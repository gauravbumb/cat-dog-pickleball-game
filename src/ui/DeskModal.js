export class DeskModal {
  constructor(container) {
    this.onClose = null;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;pointer-events:auto';
    this.el.innerHTML = `
      <div style="background:#3e2723;color:#ffe0b2;border:3px solid #d7ccc8;padding:18px;max-width:360px;font-size:14px;line-height:1.7">
        <div style="font-size:18px;margin-bottom:8px">Torn Desk Note</div>
        <div>R — B — Y — G</div>
        <div style="margin-top:12px;font-size:11px;opacity:.8">(press E, Space, or click to close)</div>
      </div>
    `;
    container.appendChild(this.el);
    this.el.addEventListener('click', () => this.close());
  }
  open() { this.el.style.display = 'flex'; }
  close() {
    if (this.el.style.display === 'none') return;
    this.el.style.display = 'none';
    this.onClose?.();
  }
  get isOpen() { return this.el.style.display !== 'none'; }
}
