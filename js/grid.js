/* ---------- grid ---------- */
function render() {
  const q = $('q').value.toLowerCase();
  view = items.filter(it => it.avg && (typ === 'all' || it.type === typ) && (!favOnly || st(it).fav) && (!q || it.name.toLowerCase().includes(q)));
  if (hueOn) {
    view.sort((a, b) => hk(a.avg) - hk(b.avg));
  }
  $('grid').innerHTML = '';
  view.forEach((it, i) => {
    const c = document.createElement('div');
    c.className = 'card';
    const m = (it.type === 'image' || it.turl) ? `<img loading="lazy" decoding="async" src="${it.turl || it.url}">` : `<video muted loop playsinline preload="metadata" src="${it.url}#t=0.5"></video>`;
    c.innerHTML = m + (it.type === 'video' ? `<span class="badge">▶ ${fmt(it.dur)}</span>` : '') + (st(it).fav ? '<span class="fav">♥</span>' : '') + `<div class="pal" style="--c:rgb(${it.avg})"></div>`;
    let ov;
    const hv = c.querySelector('video'), im = c.querySelector('img');
    if (it.type === 'video') {
      c.onmouseenter = () => {
        if (hv) {
          return hv.play();
        }
        ov = document.createElement('video');
        ov.muted = ov.loop = ov.playsInline = true;
        ov.src = it.url;
        ov.style.cssText = 'position:absolute;inset:0;height:100%;object-fit:cover;pointer-events:none';
        c.appendChild(ov);
        ov.play().catch(() => {});
      };
      c.onmouseleave = () => {
        hv ? hv.pause() : ov && ov.remove();
      };
    } else if (/\.gif$/i.test(it.name)) {
      c.onmouseenter = () => {
        im.src = it.url;
      };
      c.onmouseleave = () => {
        im.src = it.turl || it.url;
      };
    }
    c._k = it.key;
    c.onclick = () => pickMode ? toggleSel(it.key) : openLb(i);
    $('grid').appendChild(c);
  });
  updSel();
}
$('type').onclick = e => {
  if (!e.target.dataset.t) {
    return;
  }
  typ = e.target.dataset.t;
  [...$('type').children].forEach(b => b.classList.toggle('on', b === e.target));
  render();
};
$('favb').onclick = () => {
  favOnly = !favOnly;
  $('favb').classList.toggle('on', favOnly);
  render();
};
$('q').oninput = render;
$('shuf').onclick = () => {
  hueOn = false;
  $('hue').classList.remove('on');
  items.sort(() => Math.random() - .5);
  render();
};
$('hue').onclick = () => {
  hueOn = !hueOn;
  $('hue').classList.toggle('on', hueOn);
  render();
};
try {
  const dv = localStorage.getItem('mood.den');
  if (dv) {
    $('den').value = dv;
    $('grid').style.columnWidth = dv + 'px';
  }
} catch (e) {}
$('den').oninput = e => {
  $('grid').style.columnWidth = e.target.value + 'px';
  try {
    localStorage.setItem('mood.den', e.target.value);
  } catch (_) {}
};
