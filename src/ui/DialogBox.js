export class DialogBox {
  constructor(container) {
    this.lines = [];
    this.index = 0;
    this.onDone = null;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;left:50%;bottom:38px;transform:translateX(-50%);background:rgba(15,20,24,.92);border:3px solid #ffcc80;color:#fff;min-width:560px;max-width:80vw;padding:16px;display:none;pointer-events:auto';
    this.text = document.createElement('div');
    this.el.appendChild(this.text);
    container.appendChild(this.el);
    this.el.addEventListener('click', () => this.next());
    document.addEventListener('keydown', (e) => { if (this.el.style.display !== 'none' && e.code === 'Space') this.next(); });
  }
  open(lines, onDone) {
    this.lines = lines;
    this.index = 0;
    this.onDone = onDone;
    this.text.textContent = this.lines[0] || '';
    this.el.style.display = 'block';
  }
  next() {
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.close();
      this.onDone?.();
      return;
    }
    this.text.textContent = this.lines[this.index];
  }
  close() { this.el.style.display = 'none'; }
  get isOpen() { return this.el.style.display !== 'none'; }
}
