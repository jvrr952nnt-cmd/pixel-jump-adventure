/* 全局常量与工具函数（所有脚本共享） */
const TS = 32, COLS = 24, ROWS = 15;
const W = COLS * TS, H = ROWS * TS;
const GRAV = 0.78;
const SOLID = new Set(['#', '=', 'b', '?', 'm', 'u', 'p']);
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);

/* 精灵宽高比（像素网格列数 / 行数） */
const HERO_COLS = 12, HERO_ROWS = 14;
const BUG_COLS = 12, BUG_ROWS = 9;
const FRUIT_COLS = 10, FRUIT_ROWS = 10;
