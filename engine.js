/* ================================ 全局状态 ================================ */
let state = 'title';
let stateTimer = 0, ticks = 0, bgScroll = 0;
let levelIndex = 0, grid = [], levelW = 0, camX = 0, flag = null;
let player = null;
let enemies = [], coinItems = [], powerups = [], parts = [], bumps = [];
let score = 0, lives = 3, coinCount = 0, timerFrames = 0;
let invuln = 0, flagReached = false, introTimer = 0;

function tileAt(tx, ty){
  if (tx < 0 || tx >= levelW) return '#';
  if (ty < 0) return '.';
  if (ty >= ROWS) return '.';
  return grid[ty][tx];
}

/* ================================ 音效 ================================ */
let ac = null;
function initAudio(){
  if (!ac){
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ ac = null; }
  }
}
function tone(freq, dur, type, vol, slide){
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator(), gn = ac.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  gn.gain.setValueAtTime(vol == null ? 0.1 : vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.03);
}
function sfx(name){
  if (!ac) return;
  switch(name){
    case 'jump': tone(560, 0.11, 'square', 0.07, 820); break;
    case 'coin': tone(980, 0.06, 'square', 0.08, 1320); setTimeout(() => tone(1320, 0.07, 'square', 0.06), 60); break;
    case 'stomp': tone(300, 0.09, 'square', 0.09, 120); break;
    case 'bump': tone(180, 0.06, 'square', 0.06, 120); break;
    case 'break': tone(420, 0.12, 'sawtooth', 0.09, 110); break;
    case 'power': tone(520, 0.08, 'square', 0.08, 700); setTimeout(() => tone(900, 0.12, 'square', 0.08, 1200), 80); break;
    case 'shrink': tone(700, 0.16, 'sawtooth', 0.09, 240); break;
    case 'die': tone(500, 0.1, 'square', 0.09, 380); setTimeout(() => tone(300, 0.25, 'square', 0.08, 110), 110); break;
    case 'clear':
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.09), i * 110));
      break;
    case 'win':
      [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'square', 0.09), i * 130));
      break;
    case 'over': tone(300, 0.35, 'sawtooth', 0.08, 90); break;
  }
}

/* ================================ 输入 ================================ */
const keys = {};
let jumpQueued = false;

const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', Space: 'jump',
  KeyW: 'jump', KeyA: 'left', KeyD: 'right',
  ShiftLeft: 'run', ShiftRight: 'run'
};

function pressStart(){
  if (state === 'title' || state === 'gameover' || state === 'win'){
    jumpQueued = false;
    resetGame();
  }
}

window.addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  if (k){
    e.preventDefault();
    if (k === 'jump' && !keys.jump) jumpQueued = true;
    keys[k] = true;
    if (state === 'pause') state = 'play';
  }
  if (e.code === 'KeyP' && (state === 'play' || state === 'pause')){
    state = state === 'play' ? 'pause' : 'play';
  }
  if (e.code === 'KeyR') resetGame();
  if (e.code === 'Enter' || e.code === 'Space') pressStart();
  initAudio();
}, { passive: false });

window.addEventListener('keyup', e => {
  const k = KEYMAP[e.code];
  if (k) keys[k] = false;
});

document.querySelectorAll('#touch button').forEach(btn => {
  const k = btn.dataset.k;
  const on = ev => {
    ev.preventDefault();
    if (k === 'jump' && !keys.jump) jumpQueued = true;
    keys[k] = true;
    if (state === 'pause') state = 'play';
    pressStart(); initAudio();
  };
  const off = ev => { ev.preventDefault(); keys[k] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('pointerleave', off);
});

/* ================================ 实体 ================================ */
function makePlayer(tx, ty){
  const h = 28, w = Math.round(HERO_COLS * (h / HERO_ROWS));
  return { x: tx * TS + (TS - w) / 2, y: (ty + 1) * TS - h, w, h, vx: 0, vy: 0,
           onGround: false, face: 1, big: false, anim: 0, coyote: 0, alive: true };
}
function makeBug(tx, ty){
  const h = 26, w = Math.round(BUG_COLS * (h / BUG_ROWS));
  return { x: tx * TS + (TS - w) / 2, y: (ty + 1) * TS - h, w, h, vx: -1.25, vy: 0,
           onWall: false, dead: false, deadTimer: 0, anim: 0, gone: false };
}

/* ================================ 物理 ================================ */
function moveX(o){
  o.x += o.vx;
  o.onWall = false;
  if (o.x < 0){ o.x = 0; o.onWall = true; o.vx = 0; return; }
  if (o.x + o.w > levelW * TS){ o.x = levelW * TS - o.w; o.onWall = true; o.vx = 0; return; }
  const t0 = Math.floor(o.y / TS), t1 = Math.floor((o.y + o.h - 1) / TS);
  if (o.vx > 0){
    const tx = Math.floor((o.x + o.w - 1) / TS);
    for (let ty = t0; ty <= t1; ty++){
      if (SOLID.has(tileAt(tx, ty))){ o.x = tx * TS - o.w; o.vx = 0; o.onWall = true; break; }
    }
  } else if (o.vx < 0){
    const tx = Math.floor(o.x / TS);
    for (let ty = t0; ty <= t1; ty++){
      if (SOLID.has(tileAt(tx, ty))){ o.x = (tx + 1) * TS; o.vx = 0; o.onWall = true; break; }
    }
  }
}

function moveY(o){
  o.vy = Math.min(o.vy + GRAV, 14);
  o.y += o.vy;
  o.onGround = false;
  o.headHit = null;
  const t0 = Math.floor(o.x / TS), t1 = Math.floor((o.x + o.w - 1) / TS);
  if (o.vy > 0){
    const ty = Math.floor((o.y + o.h - 1) / TS);
    for (let tx = t0; tx <= t1; tx++){
      if (SOLID.has(tileAt(tx, ty))){ o.y = ty * TS - o.h; o.vy = 0; o.onGround = true; break; }
    }
  } else if (o.vy < 0){
    const ty = Math.floor(o.y / TS);
    for (let tx = t0; tx <= t1; tx++){
      if (SOLID.has(tileAt(tx, ty))){ o.y = (ty + 1) * TS; o.vy = 0; o.headHit = { tx: tx, ty: ty }; break; }
    }
  }
}

function overlapRect(a, b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ================================ 关卡装载 ================================ */
function loadLevel(i){
  grid = LEVELS[i].map(row => row.slice());
  levelW = grid[0].length;
  camX = 0;
  flag = null; player = null;
  enemies = []; coinItems = []; powerups = []; parts = []; bumps = [];
  flagReached = false; invuln = 0; introTimer = 110;
  timerFrames = 240 * 60;
  for (let y = 0; y < ROWS; y++){
    for (let x = 0; x < levelW; x++){
      const ch = grid[y][x];
      if (ch === 's'){ player = makePlayer(x, y); grid[y][x] = '.'; }
      else if (ch === 'e'){ enemies.push(makeBug(x, y)); grid[y][x] = '.'; }
      else if (ch === 'o'){ coinItems.push({ x: x * TS + 8, y: y * TS + 8, w: 16, h: 16, t: Math.random() * 6, dead: false }); grid[y][x] = '.'; }
      else if (ch === 'F'){ flag = { x: x * TS + 14, baseY: (y + 1) * TS }; grid[y][x] = '.'; }
    }
  }
  if (!player) player = makePlayer(3, 12);
  state = 'play';
  stateTimer = 0;
}

function resetGame(){
  score = 0; lives = 3; coinCount = 0; levelIndex = 0;
  loadLevel(0);
  initAudio();
}

/* ================================ 玩家更新 ================================ */
function jump(){
  if (!player) return;
  player.vy = -(keys.run ? 14.6 : 13.0);
  player.onGround = false;
  player.coyote = 0;
  sfx('jump');
}

function grow(P){
  if (P.big) return;
  P.big = true;
  const oldH = P.h;
  P.h = 36;
  P.w = Math.round(HERO_COLS * (P.h / HERO_ROWS));
  P.y -= (P.h - oldH);
}

function shrink(P){
  P.big = false;
  const oldH = P.h;
  P.h = 28;
  P.w = Math.round(HERO_COLS * (P.h / HERO_ROWS));
  P.y += (oldH - P.h);
  invuln = 100;
  sfx('shrink');
}

function killPlayer(){
  if (state !== 'play' && state !== 'clear') return;
  sfx('die');
  player.alive = false;
  player.vy = -11;
  state = 'dead';
  stateTimer = 100;
  lives--;
}

function hurt(P){
  if (invuln > 0) return;
  if (P.big) shrink(P);
  else killPlayer();
}

function bumpBlock(tx, ty){
  const ch = tileAt(tx, ty);
  if (ch === '?' || ch === 'm'){
    grid[ty][tx] = 'u';
    bumps.push({ x: tx, y: ty, t: 12 });
    if (ch === '?'){
      coinCount++; score += 100; sfx('coin');
      parts.push({ x: tx * TS + 16, y: ty * TS - 6, vx: 0, vy: -2.4, life: 34, txt: '+100', color: '#ffe680', size: 14 });
    } else {
      powerups.push({ x: tx * TS + 4, y: ty * TS - 26, w: 24, h: 24, vx: 1.5, vy: -2, onGround: false, dead: false, gone: false });
      sfx('power');
    }
  } else if (ch === 'b'){
    if (player.big){
      grid[ty][tx] = '.';
      score += 50;
      sfx('break');
      for (let i = 0; i < 6; i++){
        parts.push({ x: tx * TS + 16, y: ty * TS + 16, vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 5 - 1, life: 40, color: '#e08a45', size: 6, box: true });
      }
    } else {
      bumps.push({ x: tx, y: ty, t: 12 });
      sfx('bump');
    }
  }
}

function updatePlayer(){
  const P = player;
  const left = !!keys.left, right = !!keys.right;
  const maxSpeed = keys.run ? 5.6 : 4.2;

  P.anim += Math.abs(P.vx) * 0.5;
  if (left && !right){ P.vx = Math.max(P.vx - 0.48, -maxSpeed); P.face = -1; }
  else if (right && !left){ P.vx = Math.min(P.vx + 0.48, maxSpeed); P.face = 1; }
  else { P.vx *= 0.86; if (Math.abs(P.vx) < 0.14) P.vx = 0; }

  if (P.onGround) P.coyote = 6; else if (P.coyote > 0) P.coyote--;

  if (jumpQueued){
    jumpQueued = false;
    if (P.onGround || P.coyote > 0) jump();
  }

  moveX(P);
  moveY(P);
  if (P.headHit) bumpBlock(P.headHit.tx, P.headHit.ty);

  /* 金币 */
  for (const c of coinItems){
    if (c.dead) continue;
    if (overlapRect(P, c)){
      c.dead = true; coinCount++; score += 100; sfx('coin');
      parts.push({ x: c.x + 8, y: c.y, vx: 0, vy: -1.8, life: 30, txt: '+100', color: '#ffe680', size: 14 });
    }
  }

  /* 能量果实 */
  for (const pu of powerups){
    if (pu.dead || pu.gone) continue;
    updatePowerup(pu);
    if (overlapRect(P, pu)){
      pu.dead = true; grow(P); score += 200; sfx('power');
      parts.push({ x: pu.x + 12, y: pu.y, vx: 0, vy: -2, life: 36, txt: '变大!', color: '#b9ff7a', size: 15 });
    }
  }

  /* 敌人 */
  for (const e of enemies){
    if (e.gone) continue;
    if (e.dead){ e.deadTimer--; if (e.deadTimer <= 0) e.gone = true; continue; }
    updateBug(e);
    if (overlapRect(P, e)){
      const stomp = P.vy > 1.2 && (P.y + P.h - e.y) < 20;
      if (stomp){
        e.dead = true; e.deadTimer = 22;
        P.vy = keys.run ? -11 : -9.6;
        score += 200; sfx('stomp');
        parts.push({ x: e.x + e.w / 2, y: e.y, vx: 0, vy: -1.6, life: 32, txt: '+200', color: '#ffffff', size: 14 });
      } else {
        hurt(P);
      }
    }
  }

  /* 尖刺 */
  if (invuln <= 0 && touchingSpike(P)) hurt(P);

  /* 终点 */
  if (flag && !flagReached && P.x + P.w > flag.x + 4){
    flagReached = true;
    score += 1000 + Math.floor(timerFrames / 60) * 10;
    state = 'clear';
    stateTimer = 130;
    sfx('clear');
  }

  if (P.y > H + 40) killPlayer();

  camX = clamp(P.x + P.w / 2 - W / 2, 0, levelW * TS - W);

  timerFrames--;
  if (timerFrames <= 0){ timerFrames = 0; killPlayer(); }
}

function touchingSpike(o){
  const t0 = Math.floor(o.x / TS), t1 = Math.floor((o.x + o.w - 1) / TS);
  const b = Math.floor((o.y + o.h - 2) / TS);
  for (let tx = t0; tx <= t1; tx++){
    if (tileAt(tx, b) === '^') return true;
  }
  return false;
}

function updateBug(e){
  const dir = e.vx < 0 ? -1 : 1;
  e.anim += 1;
  moveX(e);
  if (e.onWall) e.vx = -dir * 1.25;
  moveY(e);
  if (e.y > H + 40) e.gone = true;
}

function updatePowerup(pu){
  const dir = pu.vx < 0 ? -1 : 1;
  moveX(pu);
  if (pu.onWall) pu.vx = -dir * 1.5;
  pu.headHit = null;
  moveY(pu);
  if (pu.y > H + 40) pu.dead = true;
}

/* ================================ 主更新 ================================ */
function tick(){
  ticks++;
  bgScroll += state === 'play' ? Math.abs(player ? player.vx : 0) * 0.4 : 0.5;

  for (const b of bumps) b.t--;
  bumps = bumps.filter(b => b.t > 0);
  for (const p of parts){ p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.life--; }
  parts = parts.filter(p => p.life > 0);
  for (const c of coinItems) c.t += 0.16;

  if (state === 'title'){
    if (jumpQueued){ jumpQueued = false; resetGame(); }
    return;
  }
  if (state === 'play'){
    if (introTimer > 0) introTimer--;
    updatePlayer();
    return;
  }
  if (state === 'dead'){
    stateTimer--;
    if (player){ player.vy += GRAV; player.y += player.vy; }
    if (stateTimer <= 0){
      if (lives <= 0){
        state = 'gameover';
        stateTimer = 60;
        sfx('over');
      } else {
        loadLevel(levelIndex);
      }
    }
    return;
  }
  if (state === 'clear'){
    stateTimer--;
    if (player && player.onGround) player.vx = 0;
    if (stateTimer <= 0){
      levelIndex++;
      if (levelIndex >= LEVELS.length){
        state = 'win';
        stateTimer = 120;
        sfx('win');
      } else {
        loadLevel(levelIndex);
      }
    }
    return;
  }
  if (state === 'gameover' || state === 'win'){
    if (stateTimer > 0) stateTimer--;
    if (jumpQueued){ jumpQueued = false; resetGame(); }
    return;
  }
}

/* 切后台自动暂停 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'play') state = 'pause';
});
