/* ---------- add pictures / folders ---------- */
const hasFS = !!window.showDirectoryPicker;
async function walk(dir, path, out, root) {
  for await (const [name, h] of dir.entries()) {
    if (name.startsWith('.')) {
      continue;
    }
    if (h.kind === 'directory') {
      await walk(h, path + name + '/', out, root);
    } else if (IMG.test(name) || VID.test(name)) {
      out.push({ h, path: path + name, root });
    }
  }
}
let dirs = [];
async function pickFolder() {
  if (!hasFS) {
    return $('fallback').click();
  }
  try {
    const d = await showDirectoryPicker({ mode: 'read' });
    let dup = false;
    for (const x of dirs) {
      if (await x.isSameEntry(d)) {
        dup = true;
      }
    }
    if (!dup) {
      dirs.push(d);
    }
    await loadAll();
  } catch (e) {}
}

async function loadAll() {
  $('warn').textContent = 'Reading…';
  const out = [];
  for (const d of dirs) {
    try {
      if (await d.queryPermission({ mode: 'read' }) === 'granted') {
        await walk(d, '', out, d.name);
      }
    } catch (e) {}
  }
  process(out);
}
$('fallback').onchange = $('filesin').onchange = e => process([...e.target.files].filter(f => IMG.test(f.name) || VID.test(f.name)).map(f => ({ file: f, path: f.webkitRelativePath || f.name })));
const idb = () => new Promise(r => {
  const q = indexedDB.open('mood', 2);
  q.onupgradeneeded = () => {
    const d = q.result;
    if (!d.objectStoreNames.contains('k')) {
      d.createObjectStore('k');
    }
    if (!d.objectStoreNames.contains('t')) {
      d.createObjectStore('t');
    }
  };
  q.onsuccess = () => r(q.result);
});
let DB = null;
const dbp = () => DB || (DB = idb());
const getThumb = async (k) => {
  try {
    const db = await dbp();
    return await new Promise(r => {
      const q = db.transaction('t').objectStore('t').get(k);
      q.onsuccess = () => r(q.result);
      q.onerror = () => r(null);
    });
  } catch (e) {
    return null;
  }
};
const putThumb = async (k, b) => {
  try {
    const db = await dbp();
    db.transaction('t', 'readwrite').objectStore('t').put(b, k);
  } catch (e) {}
};
$('pick').onclick = $('pick2').onclick = pickFolder;
$('pickf').onclick = $('pickf2').onclick = () => $('filesin').click();
