/* ---------- lightbox ---------- */
function openLb(i, quiet) {
  cur = (i + view.length) % view.length;
  const it = view[cur];
  if (!quiet) {
    $('stage').className = '';
    $('stage').innerHTML = it.type === 'image' ? `<img src="${it.url}">` : `<video src="${it.url}" controls autoplay loop></video>`;
  }
  $('lb').style.setProperty('--amb', 'rgb(' + boost(it.avg) + ')');
  $('lbt').textContent = it.name.replace(/\.[^.]+$/, '');
  $('lbp').innerHTML = `<i style="background:rgb(${it.avg})"></i>`;
  $('lbm').textContent = `${new Date(it.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} · ${it.w}×${it.h}${it.dur ? ' · ' + fmt(it.dur) : ''}`;
  $('lbfav').textContent = st(it).fav ? '♥ Favorited' : '♥ Favorite';
  $('lb').classList.add('on');
}

function closeLb() {
  $('lb').classList.remove('on');
  $('stage').innerHTML = '';
  render();
}

function fav() {
  const it = view[cur];
  st(it).fav = !st(it).fav;
  save();
  openLb(cur, 1);
}
$('lbx').onclick = closeLb;
$('lbfav').onclick = fav;
document.onkeydown = e => {
  if (e.key === 'Escape' && $('cmp').classList.contains('on')) {
    return closeCmp();
  }
  if (!$('lb').classList.contains('on')) {
    return;
  }
  if (e.key === 'Escape') {
    closeLb();
  }
  if (e.key === 'ArrowRight') {
    openLb(cur + 1);
  }
  if (e.key === 'ArrowLeft') {
    openLb(cur - 1);
  }
  if (e.key === 'f') {
    fav();
  }
};
