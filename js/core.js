/* shared state + helpers */
const IMG = /\.(jpe?g|png|gif|webp|avif|bmp|heic)$/i, VID = /\.(mp4|mov|webm|m4v|mkv)$/i;
let items = [], view = [], typ = 'all', favOnly = false, hueOn = false, cur = -1;
const $ = id => document.getElementById(id);
const CA = JSON.parse(localStorage.getItem('mood.cache') || '{}'), S = JSON.parse(localStorage.getItem('mood.state') || '{}');
const save = () => localStorage.setItem('mood.state', JSON.stringify(S));
const st = it => S[it.key] || (S[it.key] = { fav: false });
const boost = a => {
  const k = Math.min(2.4, 170 / Math.max(...a, 1));
  return a.map(v => Math.min(255, v * k | 0));
};
const fmt = s => s ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '';
