/* ================================ 画布 ================================ */
const cv = document.getElementById('game');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ================================ 角色精灵 ================================ */
const SPR = {
  hero: {
    cols: HERO_COLS, rows: HERO_ROWS,
    data: [
      '....cccc....',
      '...cccccc...',
      '..gggggggg..',
      '..gwkwkwkg..',
      '..gggggggg..',
      '...bbbbbb...',
      '..bbbbbbbb..',
      '.bbbbbbbbbb.',
      '.bbbbbbbbbb.',
      '..bbbbbbbb..',
      '..bbllllbb..',
      '..ll....ll..',
      '..ll....ll..',
      '..ss....ss..'
    ],
    colors: { c: '#2ec4b6', g: '#12303b', w: '#eaf7ff', k: '#12303b', b: '#ff9a3c', l: '#22406e', s: '#14213d' }
  },
  bug: {
    cols: BUG_COLS, rows: BUG_ROWS,
    data: [
      '..pppppppp..',
      '.pppppppppp.',
      'ppwkwppwkwpp',
      'ppwkwppwkwpp',
      '.pppppppppp.',
      '..pppppppp..',
      '...pp..pp...',
      '..ff....ff..',
      '.fff....fff.'
    ],
    colors: { p: '#a25cf0', w: '#ffffff', k: '#20143f', f: '#3f2566' }
  },
  fruit: {
    cols: FRUIT_COLS, rows: FRUIT_ROWS,
    data: [
      '....ll....',
      '...lll....',
      '..yggyy...',
      '.yyggyyyy.',
      'yyggggyyyy',
      'yyyyyyyyyy',
      'yyyyyyyyyy',
      '.yyyyyyyy.',
      '..yyyyyy..',
      '...yyyy...'
    ],
    colors: { l: '#4caf50', g: '#fff0a3', y: '#ffc93c' }
  }
};

function drawSprite(spr, cx, top, cell, flip){
  ctx.save();
  ctx.translate(cx, top);
  if (flip) ctx.scale(-1, 1);
  ctx.translate(-spr.cols * cell / 2, 0);
  for (let r = 0; r < spr.rows; r++){
    const row = spr.data[r];
    for (let c = 0; c < spr.cols; c++){
      const ch = row[c];
      if (ch === '.') continue;
      const col = spr.colors[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(c * cell), Math.round(r * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }
  ctx.restore();
}

/* ================================ 绘制：背景 ================================ */
function drawCloud(x, y, s){
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y + 6 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x - 24 * s, y + 8 * s, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 8 * s, y - 14 * s, 18 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16 * s, 46 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHill(x, base, r){
  ctx.fillStyle = '#6fcf7f';
  ctx.beginPath();
  ctx.moveTo(x - r, base);
  ctx.quadraticCurveTo(x, base - r * 1.15, x + r, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, base - 8);
  ctx.quadraticCurveTo(x - r * 0.25, base - r * 0.75, x + r * 0.1, base - 8);
  ctx.closePath();
  ctx.fill();
}

function drawBG(){
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#5cc0f5');
  sky.addColorStop(0.55, '#a8e3ff');
  sky.addColorStop(1, '#e6f6ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 8; i++){
    const span = W + 460;
    const cx = ((i * 230 - bgScroll * 0.4) % span + span) % span - 230;
    drawCloud(cx, 40 + (i % 3) * 58, 1 + (i % 2) * 0.28);
  }
  for (let i = 0; i < 7; i++){
    const span = W + 520;
    const hx = ((i * 280 - bgScroll * 0.7) % span + span) % span - 260;
    drawHill(hx, 13 * TS, 150 + (i % 2) * 40);
  }
}

/* ================================ 绘制：地图块 ================================ */
function bumpOffset(tx, ty){
  for (const b of bumps) if (b.x === tx && b.y === ty) return -Math.sin((b.t / 12) * Math.PI) * 8;
  return 0;
}

function drawTile(ch, px, py, tx, ty){
  const S = TS;
  switch(ch){
    case '#': {
      const topOpen = !SOLID.has(tileAt(tx, ty - 1));
      ctx.fillStyle = '#8a5a33';
      ctx.fillRect(px, py, S, S);
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      ctx.fillRect(px, py + S - 6, S, 6);
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      for (let i = 0; i < 3; i++) ctx.fillRect(px + 5 + (i * 9) % S, py + 10 + ((i * 7 + ty * 5) % 14), 7, 4);
      if (topOpen){
        ctx.fillStyle = '#5cc95c';
        ctx.fillRect(px, py, S, 9);
        ctx.fillStyle = '#43a847';
        ctx.fillRect(px, py + 9, S, 3);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.fillRect(px + 2, py + 2, S - 4, 3);
      }
      ctx.strokeStyle = 'rgba(0,0,0,.14)';
      ctx.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
      break;
    }
    case '=': {
      ctx.fillStyle = '#a9b6c6';
      ctx.fillRect(px, py, S, S);
      ctx.fillStyle = '#7d8a9c';
      ctx.fillRect(px, py + S - 7, S, 7);
      ctx.fillStyle = '#cdd8e5';
      ctx.fillRect(px + 2, py + 2, S - 4, 5);
      ctx.strokeStyle = '#5f6b7c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 5, py + 5); ctx.lineTo(px + S - 5, py + S - 5);
      ctx.moveTo(px + S - 6, py + 5); ctx.lineTo(px + 6, py + S - 6);
      ctx.stroke();
      break;
    }
    case 'b': {
      ctx.fillStyle = '#cf7233';
      ctx.fillRect(px, py, S, S);
      ctx.fillStyle = '#e58c4e';
      ctx.fillRect(px + 2, py + 2, S - 4, S / 2 - 3);
      ctx.fillStyle = '#a9541f';
      ctx.fillRect(px, py + S / 2 - 2, S, 3);
      ctx.fillRect(px + S / 2 - 1, py, 3, S);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(px + 2, py + S / 2 + 2, S / 2 - 4, 3);
      ctx.strokeStyle = 'rgba(80,40,10,.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
      break;
    }
    case '?':
    case 'm': {
      const pulse = 0.5 + 0.5 * Math.sin(ticks * 0.12 + tx);
      ctx.fillStyle = ch === 'm' ? '#ffb547' : '#f5c229';
      ctx.fillRect(px, py, S, S);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + pulse * 0.2) + ')';
      ctx.fillRect(px + 3, py + 3, S - 6, S - 6);
      ctx.strokeStyle = '#9a6300';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, S - 2, S - 2);
      ctx.fillStyle = '#7a4a00';
      ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch === 'm' ? '★' : '?', px + S / 2, py + S / 2 + 1);
      break;
    }
    case 'u': {
      ctx.fillStyle = '#9c7046';
      ctx.fillRect(px, py, S, S);
      ctx.fillStyle = '#7d5531';
      ctx.fillRect(px + 3, py + 3, S - 6, S - 6);
      ctx.fillStyle = '#c69a68';
      ctx.fillRect(px + 6, py + 6, 4, 4);
      ctx.fillRect(px + S - 10, py + 6, 4, 4);
      ctx.fillRect(px + 6, py + S - 10, 4, 4);
      ctx.fillRect(px + S - 10, py + S - 10, 4, 4);
      break;
    }
    case 'p': {
      const topOpen = tileAt(tx, ty - 1) !== 'p';
      ctx.fillStyle = '#33b34f';
      ctx.fillRect(px + 2, py, S - 4, S);
      ctx.fillStyle = '#57d774';
      ctx.fillRect(px + 5, py, 6, S);
      ctx.fillStyle = '#1f8a38';
      ctx.fillRect(px + S - 9, py, 5, S);
      if (topOpen){
        ctx.fillStyle = '#33b34f';
        ctx.fillRect(px - 1, py, S + 2, 10);
        ctx.fillStyle = '#57d774';
        ctx.fillRect(px + 2, py + 2, S - 6, 4);
        ctx.fillStyle = '#1f8a38';
        ctx.fillRect(px - 1, py + 8, S + 2, 3);
      }
      break;
    }
    case '^': {
      ctx.fillStyle = '#7b8798';
      ctx.fillRect(px, py + S - 8, S, 8);
      ctx.fillStyle = '#dde5ee';
      for (let i = 0; i < 3; i++){
        ctx.beginPath();
        ctx.moveTo(px + i * 10 + 2, py + S - 8);
        ctx.lineTo(px + i * 10 + 7, py + 2);
        ctx.lineTo(px + i * 10 + 12, py + S - 8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(90,100,115,.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 2, py + S - 8); ctx.lineTo(px + 7, py + 2); ctx.lineTo(px + 12, py + S - 8);
      ctx.stroke();
      break;
    }
  }
}

function drawTiles(){
  const x0 = Math.floor(camX / TS) - 1;
  const x1 = Math.ceil((camX + W) / TS);
  for (let y = 0; y < ROWS; y++){
    for (let tx = Math.max(0, x0); tx <= Math.min(levelW - 1, x1); tx++){
      const ch = grid[y][tx];
      if (ch === '.') continue;
      drawTile(ch, tx * TS - camX, y * TS + bumpOffset(tx, y), tx, y);
    }
  }
}

/* ================================ 绘制：实体 ================================ */
function drawCoin(c){
  const px = c.x - camX;
  const w = Math.abs(Math.cos(c.t)) * 8 + 3;
  const cy = c.y + 8 + Math.sin(c.t * 0.7) * 2;
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.ellipse(px + 8, cy, w, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe98a';
  ctx.beginPath();
  ctx.ellipse(px + 8, cy, Math.max(1, w - 3), 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (w > 5){
    ctx.fillStyle = '#c99400';
    ctx.fillRect(px + 7, cy - 4, 2, 8);
  }
}

function drawPowerups(){
  for (const pu of powerups){
    if (pu.dead || pu.gone) continue;
    drawSprite(SPR.fruit, pu.x - camX + pu.w / 2, pu.y, pu.h / FRUIT_ROWS, false);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.2 * Math.sin(ticks * 0.2)) + ')';
    ctx.beginPath();
    ctx.arc(pu.x - camX + pu.w / 2, pu.y + pu.h / 2, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies(){
  for (const e of enemies){
    if (e.gone) continue;
    const px = e.x - camX;
    if (px < -60 || px > W + 60) continue;
    if (e.dead){
      ctx.save();
      ctx.globalAlpha = clamp(e.deadTimer / 22, 0, 1);
      ctx.translate(px + e.w / 2, e.y + e.h);
      ctx.scale(1, 0.35);
      ctx.fillStyle = '#a25cf0';
      ctx.beginPath();
      ctx.ellipse(0, -8, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    const bob = Math.abs(Math.sin(e.anim * 0.16)) * 1.5;
    drawSprite(SPR.bug, px + e.w / 2, e.y + bob, e.h / BUG_ROWS, e.vx > 0);
  }
}

function drawPlayerEnt(){
  if (!player) return;
  const P = player;
  if (!P.alive){
    drawSprite(SPR.hero, P.x - camX + P.w / 2, P.y, P.h / HERO_ROWS, P.face < 0);
    return;
  }
  if (invuln > 0 && Math.floor(invuln / 4) % 2 === 0) return;

  const cx = P.x - camX + P.w / 2;
  if (P.onGround){
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.ellipse(cx, P.y + P.h - 1, P.w * 0.55, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const bob = P.onGround && Math.abs(P.vx) > 0.4 ? Math.abs(Math.sin(P.anim * 0.28)) * 1.6 : 0;
  drawSprite(SPR.hero, cx, P.y + bob, P.h / HERO_ROWS, P.face < 0);
  if (P.big){
    ctx.fillStyle = 'rgba(255,220,90,.25)';
    ctx.beginPath();
    ctx.arc(cx, P.y + P.h / 2, P.w * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParts(){
  for (const p of parts){
    if (p.box){
      ctx.fillStyle = p.color;
      ctx.globalAlpha = clamp(p.life / 40, 0, 1);
      ctx.fillRect(p.x - camX, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = clamp(p.life / 30, 0, 1);
      ctx.font = 'bold ' + p.size + 'px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,30,50,.7)';
      ctx.strokeText(p.txt, p.x - camX, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.txt, p.x - camX, p.y);
      ctx.globalAlpha = 1;
    }
  }
}

function drawFlag(){
  if (!flag) return;
  const px = flag.x - camX;
  if (px < -80 || px > W + 80) return;
  const base = flag.baseY;
  ctx.fillStyle = '#b8c3cf';
  ctx.fillRect(px, base - 7 * TS, 5, 7 * TS);
  ctx.fillStyle = '#8f9caa';
  ctx.fillRect(px + 3, base - 7 * TS, 2, 7 * TS);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(px + 2.5, base - 7 * TS - 5, 7, 0, Math.PI * 2);
  ctx.fill();
  const wave = Math.sin(ticks * 0.14) * 5;
  const fy = base - 6 * TS + 10;
  ctx.fillStyle = flagReached ? '#4ade80' : '#ff5d5d';
  ctx.beginPath();
  ctx.moveTo(px + 5, fy);
  ctx.lineTo(px + 5 + 52 + wave, fy + 16);
  ctx.lineTo(px + 5, fy + 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('终', px + 24, fy + 17);
  ctx.fillStyle = '#7a8794';
  ctx.fillRect(px - 10, base - 8, 26, 8);
}

/* ================================ UI ================================ */
function panel(x, y, w, h, a){
  ctx.fillStyle = 'rgba(10,18,34,' + (a == null ? 0.88 : a) + ')';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 16); else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function txt(s, x, y, size, color, align, weight){
  ctx.font = (weight || 'bold') + ' ' + size + 'px "Segoe UI", system-ui, "PingFang SC", sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 7);
  ctx.strokeStyle = 'rgba(12,20,36,.8)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color || '#ffffff';
  ctx.fillText(s, x, y);
}

function fmt(n, len){
  let s = String(Math.max(0, Math.floor(n)));
  while (s.length < len) s = '0' + s;
  return s;
}

function drawHUD(){
  ctx.fillStyle = 'rgba(8,14,28,.42)';
  ctx.fillRect(0, 0, W, 38);
  const P = player;
  txt('分数', 14, 12, 11, 'rgba(255,255,255,.65)');
  txt(fmt(score, 6), 14, 27, 16, '#ffffff');
  txt('金币', 130, 12, 11, 'rgba(255,255,255,.65)');
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.ellipse(136, 27, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
  txt('×' + coinCount, 148, 27, 16, '#ffe680');
  txt('关卡', 250, 12, 11, 'rgba(255,255,255,.65)');
  txt((levelIndex + 1) + ' / ' + LEVELS.length, 250, 27, 16, '#9ee7ff');
  txt('时间', 360, 12, 11, 'rgba(255,255,255,.65)');
  txt(fmt(Math.ceil(timerFrames / 60), 3), 360, 27, 16, timerFrames < 60 * 30 ? '#ff8f8f' : '#ffffff');
  txt('生命', 470, 12, 11, 'rgba(255,255,255,.65)');
  for (let i = 0; i < Math.min(lives, 5); i++){
    ctx.fillStyle = '#ff7a7a';
    const hx = 474 + i * 20, hy = 24;
    ctx.beginPath();
    ctx.arc(hx, hy, 6, Math.PI, 0);
    ctx.arc(hx + 6, hy, 6, Math.PI, 0);
    ctx.lineTo(hx + 6, hy + 8);
    ctx.lineTo(hx, hy + 14);
    ctx.lineTo(hx - 6, hy + 8);
    ctx.closePath();
    ctx.fill();
  }
  txt('P 暂停 · R 重开', W - 14, 12, 10, 'rgba(255,255,255,.45)', 'right');
  if (P && P.big) txt('强化中', W - 14, 27, 11, '#b9ff7a', 'right');
}

function drawIntro(){
  if (introTimer <= 0) return;
  const a = clamp(introTimer / 40, 0, 1) * clamp((110 - introTimer) / 20, 0, 1);
  ctx.globalAlpha = clamp(a, 0, 1);
  txt('关卡 ' + (levelIndex + 1) + ' / ' + LEVELS.length, W / 2, H / 2 - 40, 34, '#ffffff', 'center');
  txt(['草原漫步', '岩壁回廊', '尖刺迷城'][levelIndex] || '', W / 2, H / 2 + 4, 16, '#d8eeff', 'center', '600');
  ctx.globalAlpha = 1;
}

function drawTitle(){
  drawBG();
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 13 * TS, W, 2 * TS);
  ctx.fillStyle = '#5cc95c';
  ctx.fillRect(0, 13 * TS, W, 9);

  const t = Math.sin(ticks * 0.05) * 3;
  ctx.save();
  ctx.translate(W / 2, 130 + t);
  txt('超级跳跃', 0, 0, 62, '#ffffff', 'center');
  txt('像素冒险', 0, 56, 26, '#9ee7ff', 'center', '600');
  ctx.restore();

  const cell = 44 / HERO_ROWS;
  const bob = Math.abs(Math.sin(ticks * 0.06)) * 2;
  const c2 = 38 / BUG_ROWS;
  const cf = 32 / FRUIT_ROWS;

  panel(W / 2 - 230, 230, 460, 168, 0.82);
  txt('操作说明', W / 2, 252, 16, '#ffe680', 'center');
  const lines = [
    '方向键 / A D 移动    空格 / W 跳跃    Shift 加速',
    '顶砖块与问号块，踩刺虫得分，吃能量果变大',
    '收集金币、抵达终点旗帜即可过关'
  ];
  lines.forEach((s, i) => txt(s, W / 2, 285 + i * 30, 13, '#dfefff', 'center', '500'));

  drawSprite(SPR.hero, 92, 13 * TS - 44 - bob, cell, false);
  drawSprite(SPR.bug, W - 104, 13 * TS - 38, c2, true);
  drawSprite(SPR.fruit, W - 52, 13 * TS - 100 + Math.sin(ticks * 0.08) * 6, cf, false);

  const blink = 0.55 + 0.45 * Math.sin(ticks * 0.09);
  ctx.globalAlpha = blink;
  txt('按 空格 / 回车 开始', W / 2, 436, 19, '#ffffff', 'center');
  ctx.globalAlpha = 1;
}

function drawOverlay(){
  panel(W / 2 - 200, H / 2 - 100, 400, 190, 0.9);
  const cy = H / 2 - 100;
  if (state === 'pause'){
    txt('已暂停', W / 2, cy + 60, 36, '#ffffff', 'center');
    txt('按 P 继续游戏', W / 2, cy + 120, 15, '#cfe4ff', 'center', '500');
  } else if (state === 'clear'){
    txt('关卡完成！', W / 2, cy + 55, 32, '#9effa5', 'center');
    txt('得分 ' + fmt(score, 6) + '    金币 ' + coinCount, W / 2, cy + 110, 15, '#ffffff', 'center', '500');
    txt('准备进入下一关…', W / 2, cy + 145, 13, 'rgba(255,255,255,.6)', 'center', '500');
  } else if (state === 'gameover'){
    txt('游戏结束', W / 2, cy + 55, 36, '#ff8f8f', 'center');
    txt('最终得分 ' + fmt(score, 6), W / 2, cy + 110, 17, '#ffffff', 'center', '500');
    txt('按 空格 / 回车 重新开始', W / 2, cy + 150, 14, '#cfe4ff', 'center', '500');
  } else if (state === 'win'){
    txt('全部通关！', W / 2, cy + 50, 38, '#ffe680', 'center');
    txt('总分 ' + fmt(score, 6) + '    金币 ' + coinCount, W / 2, cy + 105, 17, '#ffffff', 'center', '500');
    txt('按 空格 / 回车 再玩一次', W / 2, cy + 148, 14, '#cfe4ff', 'center', '500');
  }
}

/* ================================ 渲染 ================================ */
function render(){
  ctx.clearRect(0, 0, W, H);
  if (state === 'title'){ drawTitle(); return; }

  drawBG();
  drawTiles();
  for (const c of coinItems) if (!c.dead) drawCoin(c);
  drawPowerups();
  drawFlag();
  drawEnemies();
  drawParts();
  drawPlayerEnt();
  drawHUD();
  drawIntro();

  if (state === 'pause' || state === 'gameover' || state === 'win' || state === 'clear') drawOverlay();

  if (state === 'dead'){
    ctx.fillStyle = 'rgba(10,16,30,.35)';
    ctx.fillRect(0, 0, W, H);
  }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

/* ================================ 主循环 ================================ */
let last = 0, acc = 0;
function loop(ts){
  requestAnimationFrame(loop);
  if (!last) last = ts;
  let dt = ts - last;
  last = ts;
  if (dt > 60) dt = 60;
  acc += dt;
  while (acc >= 1000 / 60){ acc -= 1000 / 60; tick(); }
  render();
}

/* 标题页背景需要的关卡数据 */
grid = LEVELS[0].map(r => r.slice());
levelW = grid[0].length;

/* 点击画布也可开始 */
cv.addEventListener('pointerdown', () => { initAudio(); pressStart(); });

requestAnimationFrame(loop);
