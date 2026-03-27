import { CAGE_CODE, MAP_H, MAP_W, PLAYER_SPEED, ROAR_COOLDOWN, ROAR_FREEZE, ROAR_RADIUS, TIGER_MIN_DIST, TIGER_SPEED } from './constants.js';

const TILE = 20;
const worldPx = MAP_W * TILE;
const game = document.querySelector('#game');

const world = document.createElement('div');
world.className = 'world';
world.style.width = `${worldPx}px`;
world.style.height = `${worldPx}px`;
game.appendChild(world);

const hud = document.createElement('div');
hud.className = 'hud';
hud.innerHTML = `
  <div id="meat" class="chip">🥩 × 0 / 3</div>
  <div id="alarm" class="chip">⚠ ALARM</div>
  <div id="help" class="chip">WASD/Arrows move · E interact · R roar</div>
  <div id="roar"><div id="roarFill"></div></div>
`;
game.appendChild(hud);

const flash = document.createElement('div');
flash.id = 'flash';
game.appendChild(flash);

const keypadOverlay = document.createElement('div');
keypadOverlay.className = 'overlay';
keypadOverlay.innerHTML = `
  <div class="card">
    <h3>CAGE KEYPAD</h3>
    <div id="keypadSeq" style="margin:6px 0;height:20px"></div>
    <button class="btn" data-k="R">🔴</button>
    <button class="btn" data-k="B">🔵</button>
    <button class="btn" data-k="Y">🟡</button>
    <button class="btn" data-k="G">🟢</button>
  </div>
`;
game.appendChild(keypadOverlay);

const deskOverlay = document.createElement('div');
deskOverlay.className = 'overlay';
deskOverlay.innerHTML = `<div class="card"><h3>Desk Note</h3><p>R — B — Y — G</p><small>Press E / Space / click</small></div>`;
game.appendChild(deskOverlay);

const dialogOverlay = document.createElement('div');
dialogOverlay.className = 'overlay';
dialogOverlay.innerHTML = `<div class="card"><p id="dialogText">...</p><small>Click / Space</small></div>`;
game.appendChild(dialogOverlay);

const endOverlay = document.createElement('div');
endOverlay.className = 'overlay';
endOverlay.innerHTML = `<div class="card"><h2 id="endTitle"></h2><p id="endSub"></p><p id="endScore"></p><button class="btn" id="playAgain">Play Again</button></div>`;
game.appendChild(endOverlay);

const keys = new Set();
const walls = new Set();
const puddles = new Set();
const baskets = [];
const guards = [];
const cameras = [];
const state = {
  phase: 'PLAY',
  cageUnlocked: false,
  alarm: false,
  roarCooldown: 0,
  meats: 0,
  flash: 0,
  keypad: [],
  dialogLines: [],
  dialogIdx: 0,
};

const toKey = (x, z) => `${x},${z}`;
const fromTile = (n) => n * TILE + TILE / 2;

function addTile(x, z, cls) {
  const t = document.createElement('div');
  t.className = `tile ${cls}`;
  t.style.left = `${x * TILE}px`;
  t.style.top = `${z * TILE}px`;
  world.appendChild(t);
  return t;
}

function buildMap() {
  for (let z = 0; z < MAP_H; z += 1) {
    for (let x = 0; x < MAP_W; x += 1) addTile(x, z, 'floor');
  }
  for (let x = 0; x < MAP_W; x += 1) { walls.add(toKey(x, 0)); walls.add(toKey(x, MAP_H - 1)); }
  for (let z = 0; z < MAP_H; z += 1) { walls.add(toKey(0, z)); walls.add(toKey(MAP_W - 1, z)); }
  for (let x = 5; x <= 25; x += 1) walls.add(toKey(x, 12));
  for (let x = 6; x <= 27; x += 1) walls.add(toKey(x, 22));
  for (let z = 4; z <= 19; z += 1) walls.add(toKey(10, z));
  for (let z = 14; z <= 27; z += 1) walls.add(toKey(20, z));

  for (const k of walls) {
    const [x, z] = k.split(',').map(Number);
    addTile(x, z, 'wall');
  }

  [[3, 8], [4, 8], [5, 8], [13, 18], [14, 18], [15, 18], [24, 5], [24, 6], [25, 6], [26, 25], [27, 25]].forEach(([x, z]) => {
    puddles.add(toKey(x, z));
    addTile(x, z, 'puddle');
  });

  state.cageTile = { x: 4, z: 15, el: addTile(4, 15, 'cage') };
  state.deskTile = { x: 18, z: 6, el: addTile(18, 6, 'desk') };
  state.truckTiles = [{ x: 28, z: 27 }, { x: 29, z: 27 }];
  state.truckTiles.forEach((t) => addTile(t.x, t.z, 'truck'));

  [[7, 10], [15, 20], [23, 9]].forEach(([x, z]) => {
    const el = addTile(x, z, 'basket');
    baskets.push({ x, z, el, collected: false });
  });
}

function makeEntity(cls, x, z, extra = {}) {
  const el = document.createElement('div');
  el.className = `entity ${cls}`;
  world.appendChild(el);
  return { x: fromTile(x), z: fromTile(z), el, vx: 0, vz: 0, ...extra };
}

buildMap();
const player = makeEntity('player', 2, 2);
const tiger = makeEntity('tiger', 4, 15, { following: false });

function makeGuard(x, z, path) {
  return makeEntity('guard', x, z, { path: path.map((p) => ({ x: fromTile(p[0]), z: fromTile(p[1]) })), idx: 0, frozen: 0, cooldown: 0, state: 'PATROL' });
}

guards.push(makeGuard(13, 5, [[13, 5], [17, 5], [17, 10], [13, 10]]));
guards.push(makeGuard(23, 18, [[23, 18], [27, 18], [27, 24], [23, 24]]));
guards.push(makeGuard(7, 24, [[7, 24], [13, 24], [13, 28], [7, 28]]));

function makeCamera(x, z, angle = 0) {
  const cam = makeEntity('camera', x, z, { angle, dir: 1, alert: 0 });
  const cone = document.createElement('div');
  cone.className = 'cone';
  cone.style.width = `${TILE * 4.8}px`;
  world.appendChild(cone);
  cam.cone = cone;
  return cam;
}
cameras.push(makeCamera(6, 14, 0));
cameras.push(makeCamera(16, 16, Math.PI));
cameras.push(makeCamera(26, 8, Math.PI / 2));

const projectiles = [];

function inWall(px, pz) {
  const tx = Math.floor(px / TILE);
  const tz = Math.floor(pz / TILE);
  if (tx < 0 || tz < 0 || tx >= MAP_W || tz >= MAP_H) return true;
  if (!state.cageUnlocked && tx === state.cageTile.x && tz === state.cageTile.z) return true;
  return walls.has(toKey(tx, tz));
}

function tileAt(px, pz) {
  return { x: Math.floor(px / TILE), z: Math.floor(pz / TILE) };
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
function moveToward(ent, target, speed, dt) {
  const dx = target.x - ent.x;
  const dz = target.z - ent.z;
  const d = Math.hypot(dx, dz);
  if (d < 1) return;
  ent.x += (dx / d) * speed * dt;
  ent.z += (dz / d) * speed * dt;
}

function setPos(ent) { ent.el.style.left = `${ent.x}px`; ent.el.style.top = `${ent.z}px`; }

function triggerDialog(lines, onDone) {
  state.phase = 'DIALOG';
  state.dialogLines = lines;
  state.dialogIdx = 0;
  state.dialogDone = onDone;
  dialogOverlay.style.display = 'flex';
  dialogOverlay.querySelector('#dialogText').textContent = lines[0];
}
function advanceDialog() {
  if (dialogOverlay.style.display !== 'flex') return;
  state.dialogIdx += 1;
  if (state.dialogIdx >= state.dialogLines.length) {
    dialogOverlay.style.display = 'none';
    state.phase = 'PLAY';
    state.dialogDone?.();
    return;
  }
  dialogOverlay.querySelector('#dialogText').textContent = state.dialogLines[state.dialogIdx];
}

function lose() {
  if (state.phase === 'WIN' || state.phase === 'CAUGHT') return;
  state.phase = 'CAUGHT';
  state.flash = 0.5;
  endOverlay.style.display = 'flex';
  endOverlay.querySelector('#endTitle').textContent = 'CAUGHT.';
  endOverlay.querySelector('#endSub').textContent = 'Shera waits. Try again.';
  endOverlay.querySelector('#endScore').textContent = '';
}
function win() {
  if (state.phase !== 'PLAY') return;
  state.phase = 'WIN';
  triggerDialog(['...', "Mumbai\'s humidity is no place for a King.", "Let\'s get you to the forests of Tadoba."], () => {
    endOverlay.style.display = 'flex';
    endOverlay.querySelector('#endTitle').textContent = 'LEVEL COMPLETE';
    endOverlay.querySelector('#endSub').textContent = 'Shera is free. Tadoba awaits.';
    endOverlay.querySelector('#endScore').textContent = `🥩 ${state.meats} / 3`;
  });
}

function resetGame() { location.reload(); }
endOverlay.querySelector('#playAgain').addEventListener('click', resetGame);

dialogOverlay.addEventListener('click', advanceDialog);

keypadOverlay.querySelectorAll('[data-k]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.keypad.push(btn.dataset.k);
    keypadOverlay.querySelector('#keypadSeq').textContent = state.keypad.join(' ');
    if (state.keypad.length === 4) {
      if (state.keypad.join('') === CAGE_CODE.join('')) {
        keypadOverlay.style.display = 'none';
        state.phase = 'PLAY';
        state.cageUnlocked = true;
        state.cageTile.el.style.display = 'none';
        tiger.following = true;
        triggerDialog(["Easy, boy. We're getting out of here."], null);
      } else {
        state.keypad = [];
        keypadOverlay.querySelector('#keypadSeq').textContent = 'Wrong! Try again.';
      }
    }
  });
});

function interact() {
  if (deskOverlay.style.display === 'flex') { deskOverlay.style.display = 'none'; state.phase = 'PLAY'; return; }
  if (state.phase !== 'PLAY') return;
  const cagePos = { x: fromTile(state.cageTile.x), z: fromTile(state.cageTile.z) };
  const deskPos = { x: fromTile(state.deskTile.x), z: fromTile(state.deskTile.z) };
  if (!state.cageUnlocked && dist(player, cagePos) < TILE) {
    keypadOverlay.style.display = 'flex';
    state.phase = 'DIALOG';
    state.keypad = [];
    keypadOverlay.querySelector('#keypadSeq').textContent = '';
  } else if (dist(player, deskPos) < TILE) {
    deskOverlay.style.display = 'flex';
    state.phase = 'DIALOG';
  }
}

document.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyE') interact();
  if (e.code === 'Space') { advanceDialog(); if (deskOverlay.style.display === 'flex') { deskOverlay.style.display = 'none'; state.phase = 'PLAY'; } }
  if (e.code === 'KeyR' && tiger.following && state.roarCooldown <= 0 && state.phase === 'PLAY') {
    state.roarCooldown = ROAR_COOLDOWN;
    guards.forEach((g) => { if (dist(g, tiger) < ROAR_RADIUS * TILE) g.frozen = ROAR_FREEZE; });
  }
});
document.addEventListener('keyup', (e) => keys.delete(e.code));

game.addEventListener('click', () => { if (deskOverlay.style.display === 'flex') { deskOverlay.style.display = 'none'; state.phase = 'PLAY'; } });

let prev = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  if (state.phase === 'PLAY') {
    const dirX = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const dirZ = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
    const mag = Math.hypot(dirX, dirZ) || 1;
    let speedMul = puddles.has(toKey(tileAt(player.x, player.z).x, tileAt(player.x, player.z).z)) ? 0.4 : 1;
    const nx = player.x + (dirX / mag) * PLAYER_SPEED * TILE * speedMul * dt;
    const nz = player.z + (dirZ / mag) * PLAYER_SPEED * TILE * speedMul * dt;
    if (!inWall(nx, player.z)) player.x = nx;
    if (!inWall(player.x, nz)) player.z = nz;
  }

  if (tiger.following && state.phase === 'PLAY' && dist(tiger, player) > TIGER_MIN_DIST * TILE) moveToward(tiger, player, TIGER_SPEED * TILE, dt);

  // guards
  for (const g of guards) {
    if (g.frozen > 0) {
      g.frozen -= dt;
      g.el.style.background = '#4fc3f7';
    } else {
      g.el.style.background = '#1565c0';
      const d = dist(g, player);
      if (d < TILE * 6 && state.phase === 'PLAY') {
        moveToward(g, player, 2.8 * TILE, dt);
        g.state = 'ALERT';
        g.cooldown -= dt;
        if (g.cooldown <= 0 && d < TILE * 5) {
          g.cooldown = 1.5;
          const p = makeEntity('entity', 0, 0);
          p.el.style.width = '6px'; p.el.style.height = '6px'; p.el.style.background = '#cfd8dc';
          const vx = (player.x - g.x); const vz = (player.z - g.z); const m = Math.hypot(vx, vz) || 1;
          projectiles.push({ x: g.x, z: g.z, vx: (vx / m) * 220, vz: (vz / m) * 220, el: p.el, life: 2 });
        }
      } else {
        g.state = 'PATROL';
        const t = g.path[g.idx];
        if (Math.hypot(g.x - t.x, g.z - t.z) < 4) g.idx = (g.idx + 1) % g.path.length;
        moveToward(g, g.path[g.idx], 2.2 * TILE, dt);
      }
    }
  }

  // cameras
  state.alarm = false;
  for (const c of cameras) {
    c.angle += c.dir * dt * 1.2;
    if (c.angle > 1 || c.angle < -1) c.dir *= -1;
    c.cone.style.left = `${c.x}px`;
    c.cone.style.top = `${c.z - 3}px`;
    c.cone.style.transform = `rotate(${c.angle}rad)`;

    const dx = player.x - c.x; const dz = player.z - c.z; const d = Math.hypot(dx, dz);
    const a = Math.atan2(dz, dx);
    const diff = Math.abs(Math.atan2(Math.sin(a - c.angle), Math.cos(a - c.angle)));
    if (d < TILE * 4.5 && diff < 0.6 && state.phase === 'PLAY') {
      c.alert += dt;
      c.el.style.background = c.alert > 1.5 ? '#fff' : '#ffd600';
      c.cone.style.background = c.alert > 1.5 ? 'rgba(255,23,68,.35)' : 'rgba(255,214,0,.25)';
      if (c.alert > 1.5) state.alarm = true;
    } else {
      c.alert = Math.max(0, c.alert - dt);
      c.el.style.background = '#ff1744';
      c.cone.style.background = 'rgba(255,23,68,.22)';
    }
  }

  // projectiles
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const p = projectiles[i];
    p.life -= dt;
    p.x += p.vx * dt; p.z += p.vz * dt;
    p.el.style.left = `${p.x}px`; p.el.style.top = `${p.z}px`;
    if (p.life <= 0 || inWall(p.x, p.z)) { p.el.remove(); projectiles.splice(i, 1); continue; }
    if (Math.hypot(player.x - p.x, player.z - p.z) < 10) { lose(); }
  }

  // catches when alarm + guard nearby
  if (state.alarm && guards.some((g) => g.frozen <= 0 && dist(g, player) < TILE * 7)) lose();

  // collect baskets
  for (const b of baskets) {
    if (!b.collected && Math.hypot(fromTile(b.x) - player.x, fromTile(b.z) - player.z) < 10) {
      b.collected = true;
      b.el.style.display = 'none';
      state.meats += 1;
    }
  }

  // win
  if (state.phase === 'PLAY' && tiger.following) {
    const pTile = tileAt(player.x, player.z);
    const tTile = tileAt(tiger.x, tiger.z);
    const onTruckP = state.truckTiles.some((t) => t.x === pTile.x && t.z === pTile.z);
    const onTruckT = state.truckTiles.some((t) => t.x === tTile.x && t.z === tTile.z);
    if (onTruckP && onTruckT) win();
  }

  if (state.roarCooldown > 0) state.roarCooldown -= dt;
  if (state.flash > 0) { state.flash -= dt; flash.style.opacity = `${state.flash / 0.5}`; } else flash.style.opacity = '0';

  // hud
  hud.querySelector('#meat').textContent = `🥩 × ${state.meats} / 3`;
  hud.querySelector('#alarm').style.color = state.alarm ? '#ff1744' : '#9e9e9e';
  const ratio = Math.max(0, Math.min(1, 1 - state.roarCooldown / ROAR_COOLDOWN));
  hud.querySelector('#roarFill').style.width = `${ratio * 100}%`;

  setPos(player); setPos(tiger);
  guards.forEach(setPos); cameras.forEach(setPos);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
