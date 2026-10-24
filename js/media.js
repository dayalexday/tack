/* ---------- read files: average color + small thumbnail ---------- */
const loadImg = u => new Promise((res, rej) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = rej;
  i.src = u;
});
const thumb = (src, w, h) => new Promise(r => {
  const s = Math.min(1, 420 / w), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * s));
  c.height = Math.max(1, Math.round(h * s));
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  c.toBlob(r, 'image/jpeg', .82);
});
const avg = s => {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(s, 0, 0, 16, 16);
  const d = x.getImageData(0, 0, 16, 16).data, r = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) {
    r[0] += d[i];
    r[1] += d[i + 1];
    r[2] += d[i + 2];
  }
  return r.map(v => Math.round(v / 256));
};
function hk(a) {
  const [r, g, b] = a.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < .06) {
    return 400 + mx;
  }
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
}

async function analyze(it) {
  try {
    let src;
    if (it.type === 'image') {
      src = await loadImg(it.url);
      it.w = src.naturalWidth;
      it.h = src.naturalHeight;
    } else {
      const v = document.createElement('video');
      v.muted = true;
      v.preload = 'auto';
      v.src = it.url;
      await new Promise((r, j) => {
        v.onloadeddata = r;
        v.onerror = j;
      });
      it.w = v.videoWidth;
      it.h = v.videoHeight;
      it.dur = v.duration;
      await new Promise(r => {
        v.onseeked = r;
        v.currentTime = v.duration * .2 || 0;
      });
      src = v;
    }
    it.avg = avg(src);
    it.tb = await thumb(src, it.w, it.h);
    putThumb(it.key, it.tb);
  } catch (e) {
    it.avg = [40, 40, 40];
  }
}

async function process(files) {
  items.forEach(i => {
    URL.revokeObjectURL(i.url);
    i.turl && URL.revokeObjectURL(i.turl);
  });
  items = [];
  $('empty').style.display = 'none';
  let done = 0;
  items = await Promise.all(files.map(async (f) => {
    const file = f.file || await f.h.getFile();
    return { file, name: file.name, path: f.path, date: file.lastModified, key: f.path + '|' + file.size, type: IMG.test(file.name) ? 'image' : 'video', url: URL.createObjectURL(file) };
  }));
  if (!items.length) {
    $('empty').style.display = '';
    $('warn').textContent = 'No images or videos found.';
    return;
  }
  let idx = 0;
  const worker = async () => {
    while (idx < items.length) {
      const it = items[idx++], c = CA[it.key], tb = c && await getThumb(it.key);
      if (c && tb) {
        Object.assign(it, c);
        it.tb = tb;
      } else {
        await analyze(it);
        if (it.tb) {
          CA[it.key] = { avg: it.avg, w: it.w, h: it.h, dur: it.dur };
        }
      }
      if (it.tb) {
        it.turl = URL.createObjectURL(it.tb);
      }
      done++;
      $('prog').style.width = (done / items.length * 100) + '%';
      if (done % 12 === 0 || done === items.length) {
        render();
      }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  try {
    localStorage.setItem('mood.cache', JSON.stringify(CA));
  } catch (e) {}
  setTimeout(() => $('prog').style.width = '0', 600);
  render();
}
