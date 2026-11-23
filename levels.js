/* ================================ 关卡构造 ================================ */
/* 关卡用二维字符网格描述：
   # 地面/土块   = 石台   b 砖块   ? 问号块   m 问号块(出能量果)   u 已用块
   p 管道   ^ 尖刺   o 金币   e 敌人出生点   s 玩家出生点   F 终点旗帜      */

function blank(w){
  const g = [];
  for (let y = 0; y < ROWS; y++) g.push(new Array(w).fill('.'));
  return g;
}
function put(g, x, y, ch){ if (y >= 0 && y < ROWS && x >= 0 && x < g[0].length) g[y][x] = ch; }
function fillRect(g, x0, y0, w, h, ch){ for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(g, x, y, ch); }
function fillRow(g, y, x0, w, ch){ fillRect(g, x0, y, w, 1, ch); }
function ground(g, x0, w){ fillRow(g, 13, x0, w, '#'); fillRow(g, 14, x0, w, '#'); }
function pit(g, x, n){ for (let i = 0; i < n; i++){ put(g, x + i, 13, '.'); put(g, x + i, 14, '.'); } }
function coins(g, y, x0, n){ for (let i = 0; i < n; i++) put(g, x0 + i, y, 'o'); }
function seq(g, y, x0, s){ for (let i = 0; i < s.length; i++) put(g, x0 + i, y, s[i]); }
function addEnemies(g, arr){ arr.forEach(a => put(g, a[0], a[1], 'e')); }
function stairs(g, x0, n){ for (let i = 0; i < n; i++) fillRect(g, x0 + i, 12 - i, 1, i + 1, '='); }

function lvl1(){
  const w = 124, g = blank(w);
  ground(g, 0, w);
  pit(g, 26, 3); pit(g, 52, 3); pit(g, 78, 3); pit(g, 96, 2);
  put(g, 3, 12, 's');
  coins(g, 10, 8, 4);
  seq(g, 9, 14, 'bb?bb');
  addEnemies(g, [[12,12],[19,12]]);

  fillRow(g, 10, 32, 5, '='); coins(g, 9, 32, 5);
  seq(g, 9, 43, 'b?bb');
  addEnemies(g, [[36,12],[46,12]]);

  coins(g, 10, 57, 5);
  seq(g, 9, 65, 'm?');
  addEnemies(g, [[60,12],[70,12],[74,12]]);

  fillRow(g, 10, 82, 5, '='); coins(g, 9, 82, 5);
  seq(g, 9, 89, 'b?b');
  addEnemies(g, [[85,12],[92,12]]);

  coins(g, 10, 99, 4);
  seq(g, 9, 104, '?b?');
  addEnemies(g, [[100,12],[108,12]]);
  stairs(g, 111, 4);
  put(g, 118, 12, 'F');
  return g;
}

function lvl2(){
  const w = 150, g = blank(w);
  ground(g, 0, w);
  pit(g, 20, 3); pit(g, 38, 3); pit(g, 56, 3); pit(g, 74, 3);
  pit(g, 92, 3); pit(g, 112, 3); pit(g, 130, 3);
  put(g, 3, 12, 's');
  coins(g, 10, 8, 5);
  seq(g, 9, 13, 'b?b');
  addEnemies(g, [[10,12],[16,12]]);

  fillRow(g, 10, 25, 4, '='); coins(g, 9, 25, 4);
  put(g, 31, 12, '^');
  addEnemies(g, [[28,12],[34,12]]);

  seq(g, 9, 42, 'b?bb');
  put(g, 49, 12, '^');
  addEnemies(g, [[45,12],[52,12]]);

  fillRow(g, 10, 59, 4, '='); coins(g, 9, 59, 4);
  fillRow(g, 10, 68, 3, '=');
  addEnemies(g, [[62,12],[70,12],[74,12]]);

  seq(g, 9, 78, 'm??');
  addEnemies(g, [[82,12],[88,12]]);

  fillRow(g, 10, 96, 4, '='); coins(g, 9, 96, 4);
  seq(g, 9, 104, 'b?b');
  addEnemies(g, [[100,12],[107,12]]);

  coins(g, 10, 116, 4);
  seq(g, 9, 120, 'b?b');
  addEnemies(g, [[118,12],[124,12],[128,12]]);

  coins(g, 10, 136, 5);
  seq(g, 9, 140, '?b?');
  addEnemies(g, [[136,12],[143,12]]);
  put(g, 146, 12, 'F');
  return g;
}

function lvl3(){
  const w = 170, g = blank(w);
  ground(g, 0, w);
  pit(g, 14, 3); pit(g, 30, 3); pit(g, 46, 3); pit(g, 60, 3);
  pit(g, 76, 3); pit(g, 92, 3); pit(g, 108, 3); pit(g, 124, 3); pit(g, 142, 3);
  put(g, 3, 12, 's');
  coins(g, 10, 6, 3);
  addEnemies(g, [[9,12]]);

  fillRow(g, 10, 18, 4, '='); coins(g, 9, 18, 4);
  addEnemies(g, [[22,12],[27,12]]);

  coins(g, 10, 33, 4);
  seq(g, 9, 36, 'b?b');
  addEnemies(g, [[38,12],[43,12]]);

  fillRow(g, 10, 49, 4, '='); coins(g, 9, 49, 4);
  seq(g, 9, 55, 'm?');
  addEnemies(g, [[53,12],[57,12]]);

  coins(g, 10, 63, 5);
  seq(g, 9, 68, 'b?bb');
  addEnemies(g, [[66,12],[72,12],[74,12]]);

  fillRow(g, 10, 79, 4, '='); coins(g, 9, 79, 4);
  addEnemies(g, [[83,12],[89,12]]);

  seq(g, 9, 95, 'b?b');
  coins(g, 10, 100, 4);
  addEnemies(g, [[99,12],[105,12]]);

  fillRow(g, 10, 111, 4, '='); coins(g, 9, 111, 4);
  seq(g, 9, 117, 'm??');
  addEnemies(g, [[115,12],[121,12]]);

  coins(g, 10, 127, 5);
  seq(g, 9, 132, 'b?b');
  addEnemies(g, [[130,12],[136,12],[140,12]]);

  coins(g, 10, 147, 5);
  seq(g, 9, 151, 'b?b?');
  addEnemies(g, [[146,12],[156,12],[164,12]]);
  stairs(g, 160, 3);
  put(g, 166, 12, 'F');
  return g;
}

const LEVELS = [lvl1(), lvl2(), lvl3()];
