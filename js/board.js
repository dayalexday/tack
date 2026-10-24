/* ---------- compose: build a shareable board ---------- */
let pickMode = false, sel = [], CI = [], IM = [], RC = [], NZ = null, raf = 0, drag = null;
const FO = {};
const fo = it => FO[it.key] || (FO[it.key] = { x: .5, y: .5, z: 1 });
const C = { lay: 'grid', ar: '4:5', style: 'glow', tint: 'none', tfont: 'serif', tpos: 'bottom', glow: .6, space: .4, grain: true, soft: false, chips: true, atitle: false, acc: '#c9a45c', title: '', cap: '', seed: 1 };
const AR = { '4:5': [1080, 1350], '1:1': [1080, 1080], '9:16': [1080, 1920], '16:9': [1920, 1080] };
const hx = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const rnd = s => {
  s |= 0;
  s = s + 0x6D2B79F5 | 0;
  let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
CanvasRenderingContext2D.prototype.roundRect || (CanvasRenderingContext2D.prototype.roundRect = function (a, b, c, d) {
  this.rect(a, b, c, d);
});
function updSel() {
  document.querySelectorAll('.card').forEach(c => {
    const i = sel.indexOf(c._k);
    c.classList.toggle('sel', i > -1);
    let n = c.querySelector('.num');
    if (i > -1) {
      if (!n) {
        n = document.createElement('span');
        n.className = 'num';
        c.appendChild(n);
      }
      n.textContent = i + 1;
    } else if (n) {
      n.remove();
    }
  });
  $('tray').classList.toggle('on', pickMode);
  $('tgo').disabled = sel.length < 2;
  $('tn').textContent = sel.length < 2 ? 'Pick 2–6 to build a board' + (sel.length ? ' · ' + sel.length + ' so far' : '') : sel.length + ' picked';
}

function toggleSel(k) {
  const i = sel.indexOf(k);
  if (i > -1) {
    sel.splice(i, 1);
  } else if (sel.length < 6) {
    sel.push(k);
  }
  updSel();
}
$('cmpb').onclick = () => {
  pickMode = !pickMode;
  document.body.classList.toggle('pick', pickMode);
  $('cmpb').textContent = pickMode ? '✕ Cancel' : '▣ Make a board';
  if (!pickMode) {
    sel = [];
  }
  updSel();
};
$('tclr').onclick = () => {
  sel = [];
  updSel();
};
function cover(x, im, r, f) {
  const s = Math.max(r.w / im.width, r.h / im.height) * f.z, sw = r.w / s, sh = r.h / s;
  x.drawImage(im, (im.width - sw) * f.x, (im.height - sh) * f.y, sw, sh, r.x, r.y, r.w, r.h);
}

function rects(W, H, n, L, T, Rt, B, g) {
  const rows = C.lay === 'strip' ? [n] : C.lay === 'stack' ? Array(n).fill(1) : C.lay === 'hero' ? [1, n - 1] : ({ 2: [1, 1], 3: [1, 2], 4: [2, 2], 5: [2, 3], 6: [3, 3] })[n], wt = C.lay === 'hero' ? [1.7, 1] : rows.map(() => 1), tw = wt.reduce((a, b) => a + b), ah = H - T - B - g * (rows.length - 1), aw = W - L - Rt, out = [];
  let y = T;
  rows.forEach((k, r) => {
    const h = ah * wt[r] / tw, w = (aw - g * (k - 1)) / k;
    for (let j = 0; j < k; j++) {
      out.push({ x: L + j * (w + g), y, w, h, a: 0 });
    }
    y += h + g;
  });
  if (C.lay === 'scatter') {
    out.forEach((r, i) => {
      const w = r.w * 1.28, h = r.h * 1.28, j = g * 5;
      r.x += (r.w - w) / 2 + (rnd(C.seed * 97 + i) - .5) * j;
      r.y += (r.h - h) / 2 + (rnd(C.seed * 57 + i) - .5) * j;
      r.w = w;
      r.h = h;
      r.a = (rnd(C.seed * 31 + i) - .5) * .16;
    });
  }
  return out;
}

function paint() {
  const [W, H] = AR[C.ar], cv = $('cv'), x = cv.getContext('2d');
  cv.width = W;
  cv.height = H;
  const n = CI.length, sty = C.style, paper = sty === 'paper', gl = sty === 'glow' ? C.glow : 0, sp = C.space, m = W * (.03 + .05 * sp), g = W * (.004 + .025 * sp), acc = hx(C.acc), tf = C.title.trim().toUpperCase(), cp = C.cap.trim(), pos = C.tpos, cs = W * .017, sq = cs * .9, gp = cs * .4, pw = C.chips ? n * (sq + gp) : 0, F = { serif: ['500', '"Cormorant Garamond",Georgia,serif', .05], sans: ['800', '"Helvetica Neue",Arial,sans-serif', -.01], mono: ['500', 'Menlo,Consolas,monospace', .04] }[C.tfont], setF = f => {
    x.font = `${F[0]} ${f}px ${F[1]}`;
    x.letterSpacing = f * F[2] + 'px';
  };
  let fs = 0;
  if (tf) {
    fs = pos === 'over' ? W * .38 : pos === 'side' ? W * .06 : W * .07;
    const mw = pos === 'side' ? H * .8 : pos === 'over' ? W - 2 * m : W - 2 * m - pw;
    setF(fs);
    while (x.measureText(tf).width > mw && fs > 12) {
      fs -= 2;
      setF(fs);
    }
  }
  const tb = tf && (pos === 'bottom' || pos === 'top') ? fs * 1.1 : 0, bb = (pos === 'bottom' ? tb : 0) + (cp ? cs * 2.2 : 0), by = bb ? H - m : H - m * .35, R = rects(W, H, n, m + (pos === 'side' && tf ? fs * 1.3 : 0), m + (pos === 'top' && tb ? tb + .6 * m : 0), m, m + (bb ? bb + .6 * m : 0), g);
  RC = R;
  x.fillStyle = paper ? '#e8e4da' : '#0a0a0b';
  x.fillRect(0, 0, W, H);
  if (gl > 0) {
    x.globalCompositeOperation = 'screen'; // each piece bleeds its color into the background
    R.forEach((r, i) => {
      const b = C.tint === 'duo' ? acc : boost(CI[i].avg), cx = r.x + r.w / 2, cy = r.y + r.h / 2, gr = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .6);
      gr.addColorStop(0, `rgba(${b},${.5 * gl})`);
      gr.addColorStop(1, `rgba(${b},0)`);
      x.fillStyle = gr;
      x.fillRect(0, 0, W, H);
      if ('filter' in x && IM[i]) {
        x.save();
        x.filter = `blur(${W * .05}px)`;
        x.globalAlpha = .55 * gl;
        const e = W * .1;
        cover(x, IM[i], { x: r.x - e, y: r.y - e, w: r.w + 2 * e, h: r.h + 2 * e }, { x: .5, y: .5, z: 1 });
        x.restore();
      }
    });
    x.globalCompositeOperation = 'source-over';
  }
  if (!paper) {
    const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.7)');
    x.fillStyle = v;
    x.fillRect(0, 0, W, H);
  }
  R.forEach((r, i) => {
    const it = CI[i], im = IM[i], rr = C.soft ? W * .02 : 0, col = C.tint === 'duo' ? acc : boost(it.avg), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    x.save();
    x.translate(cx, cy);
    x.rotate(r.a);
    x.translate(-cx, -cy);
    x.save();
    if (paper) {
      x.shadowColor = '#000';
      x.shadowOffsetX = x.shadowOffsetY = W * .011;
    } else {
      x.shadowColor = gl ? `rgba(${col},${.9 * gl})` : 'rgba(0,0,0,.6)';
      x.shadowBlur = gl ? W * .1 * gl : W * .03;
    }
    x.fillStyle = '#000';
    x.beginPath();
    x.roundRect(r.x, r.y, r.w, r.h, rr);
    x.fill();
    x.restore();
    if (sty === 'film') {
      const e = W * .005;
      x.fillStyle = '#e8e2d0';
      x.fillRect(r.x - e, r.y - e, r.w + 2 * e, r.h + 2 * e);
    }
    if (im) {
      x.save();
      x.beginPath();
      x.roundRect(r.x, r.y, r.w, r.h, rr);
      x.clip();
      if (C.tint !== 'none' && 'filter' in x) {
        x.filter = C.tint === 'crush' ? 'contrast(1.5) saturate(1.3) brightness(.9)' : 'grayscale(1) contrast(1.2)';
      }
      cover(x, im, r, fo(it));
      x.filter = 'none';
      if (C.tint === 'duo') {
        x.globalCompositeOperation = 'multiply';
        x.fillStyle = C.acc;
        x.fillRect(r.x, r.y, r.w, r.h);
      }
      x.restore();
    }
    if (sty === 'noir' || paper) {
      x.strokeStyle = paper ? '#000' : 'rgba(236,231,222,.22)';
      x.lineWidth = paper ? W * .004 : 2;
      x.strokeRect(r.x, r.y, r.w, r.h);
    }
    if (sty === 'film') {
      x.save();
      x.font = `600 ${W * .016}px Menlo,Consolas,monospace`;
      x.letterSpacing = '0px';
      x.shadowColor = '#000';
      x.shadowBlur = 8;
      x.fillStyle = C.acc;
      x.fillText(String(i + 1).padStart(2, '0') + ' ▸', r.x + W * .012, r.y + W * .03);
      x.restore();
    }
    x.restore();
  });
  if (C.grain) {
    if (!NZ) {
      NZ = document.createElement('canvas');
      NZ.width = NZ.height = 160;
      const q = NZ.getContext('2d'), d = q.createImageData(160, 160);
      for (let i = 0; i < d.data.length; i += 4) {
        d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.random() * 255;
        d.data[i + 3] = 255;
      }
      q.putImageData(d, 0, 0);
    }
    x.globalAlpha = .08;
    x.globalCompositeOperation = 'overlay';
    x.fillStyle = x.createPattern(NZ, 'repeat');
    x.fillRect(0, 0, W, H);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
  }
  x.letterSpacing = '0px';
  if (cp) {
    x.font = `italic ${cs}px Georgia,serif`;
    x.fillStyle = paper ? '#444' : '#a8a49c';
    x.fillText(cp, m, by);
  }
  if (C.chips) {
    CI.forEach((it, i) => {
      x.fillStyle = `rgb(${it.avg})`;
      x.fillRect(W - m - pw + i * (sq + gp), by - sq, sq, sq);
    });
  }
  if (tf) {
    setF(fs);
    x.fillStyle = paper ? '#111' : C.atitle ? C.acc : '#ece7de';
    if (pos === 'bottom') {
      x.fillText(tf, m, by - (cp ? cs * 1.5 : 0));
    } else if (pos === 'top') {
      x.fillText(tf, m, m + fs * .8);
    } else if (pos === 'side') {
      x.save();
      x.translate(m + fs * .8, H / 2 + x.measureText(tf).width / 2);
      x.rotate(-Math.PI / 2);
      x.fillText(tf, 0, 0);
      x.restore();
    } else {
      x.globalCompositeOperation = 'difference';
      x.fillStyle = '#fff';
      x.textAlign = 'center';
      x.fillText(tf, W / 2, H / 2 + fs * .32);
      x.textAlign = 'left';
      x.globalCompositeOperation = 'source-over';
    }
    x.letterSpacing = '0px';
  }
}
const rp = () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(paint);
};
async function openCmp() {
  CI = sel.map(k => items.find(i => i.key === k)).filter(Boolean);
  if (CI.length < 2) {
    return;
  }
  $('cmp').classList.add('on');
  IM = await Promise.all(CI.map(async (it) => {
    for (const u of [it.type === 'image' ? it.url : it.turl, it.turl]) {
      if (u) {
        try {
          return await loadImg(u);
        } catch (e) {}
      }
    }
    return null;
  }));
  paint();
}
const closeCmp = () => $('cmp').classList.remove('on');
$('tgo').onclick = openCmp;
$('cx').onclick = closeCmp;
$('csh').onclick = () => {
  const z = CI.map((it, i) => [it, IM[i]]).sort(() => Math.random() - .5);
  CI = z.map(a => a[0]);
  IM = z.map(a => a[1]);
  C.seed = Math.random() * 1e3 | 0;
  paint();
};
$('cmp').addEventListener('input', e => {
  const t = e.target, k = { ct: ['title', t.value], cc: ['cap', t.value], cg: ['glow', t.value / 100], csp: ['space', t.value / 100], cn: ['grain', t.checked], cs: ['soft', t.checked], cp: ['chips', t.checked], cat: ['atitle', t.checked], cac: ['acc', t.value] }[t.id];
  if (!k) {
    return;
  }
  C[k[0]] = k[1];
  rp();
});
$('cmp').addEventListener('click', e => {
  const b = e.target.closest('.seg button');
  if (!b) {
    return;
  }
  const p = b.parentNode;
  C[p.dataset.k] = b.dataset.v;
  [...p.children].forEach(c => c.classList.toggle('on', c === b));
  paint();
});
const pt = e => {
  const cv = $('cv'), b = cv.getBoundingClientRect(), k = Math.min(b.width / cv.width, b.height / cv.height);
  return { x: (e.clientX - b.left - (b.width - cv.width * k) / 2) / k, y: (e.clientY - b.top - (b.height - cv.height * k) / 2) / k };
};
const hit = p => {
  for (let i = RC.length - 1; i >= 0; i--) {
    const r = RC[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
      return i;
    }
  }
  return -1;
};
$('cv').onpointerdown = e => {
  const p = pt(e), i = hit(p);
  if (i < 0) {
    return;
  }
  drag = { i, x: p.x, y: p.y };
  $('cv').setPointerCapture(e.pointerId);
  $('cv').style.cursor = 'grabbing';
};
$('cv').onpointermove = e => {
  if (!drag) {
    return;
  }
  const p = pt(e), i = drag.i, im = IM[i];
  if (!im) {
    return;
  }
  const f = fo(CI[i]), r = RC[i], s = Math.max(r.w / im.width, r.h / im.height) * f.z, ox = im.width - r.w / s, oy = im.height - r.h / s;
  if (ox > .5) {
    f.x = Math.min(1, Math.max(0, f.x - (p.x - drag.x) / s / ox));
  }
  if (oy > .5) {
    f.y = Math.min(1, Math.max(0, f.y - (p.y - drag.y) / s / oy));
  }
  drag.x = p.x;
  drag.y = p.y;
  rp();
};
$('cv').onpointerup = $('cv').onpointercancel = () => {
  drag = null;
  $('cv').style.cursor = '';
};
$('cv').onwheel = e => {
  const i = hit(pt(e));
  if (i < 0) {
    return;
  }
  e.preventDefault();
  const f = fo(CI[i]);
  f.z = Math.min(4, Math.max(1, f.z * (e.deltaY < 0 ? 1.08 : .93)));
  rp();
};
$('cdl').onclick = () => $('cv').toBlob(b => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = (C.title.trim().replace(/[^\w -]+/g, '') || 'board') + '.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}, 'image/png');
$('ccp').onclick = () => $('cv').toBlob(async (b) => {
  const t = $('ccp');
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
    t.textContent = 'Copied';
  } catch (e) {
    t.textContent = 'Blocked';
  }
  setTimeout(() => t.textContent = 'Copy', 1500);
});
