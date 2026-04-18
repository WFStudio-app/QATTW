// wm.js — Window Manager
const WM = (() => {
  let windows = [];
  let zCounter = 10;
  let focused = null;
  let linkMode = false;
  let linkSource = null;

  function create({ title = 'Window', format = 'text', x, y, w = 480, h = 360 }) {
    const id = 'win-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    const el = document.createElement('div');
    el.className = 'window';
    el.id = id;

    const vw = window.innerWidth, vh = window.innerHeight - 42;
    const px = x !== undefined ? x : Math.max(20, Math.min(vw - w - 20, 60 + windows.length * 24));
    const py = y !== undefined ? y : Math.max(20, Math.min(vh - h - 20, 40 + windows.length * 24));

    el.style.left = px + 'px';
    el.style.top  = py + 'px';
    el.style.width  = w + 'px';
    el.style.height = h + 'px';

    const formatIcons = {
      text: Icons.text, terminal: Icons.terminal,
      code: Icons.code, apps: Icons.apps,
      sites: Icons.sites, files: Icons.files
    };

    el.innerHTML = `
      <div class="win-titlebar draggable" data-id="${id}">
        <div class="win-controls">
          <button class="win-btn btn-close" data-action="close">${Icons.close}</button>
          <button class="win-btn btn-min"   data-action="minimize">${Icons.minimize}</button>
          <button class="win-btn btn-max"   data-action="maximize">${Icons.maximize}</button>
        </div>
        <div class="win-icon">${formatIcons[format] || Icons.text}</div>
        <span class="win-title">${escHtml(title)}</span>
      </div>
      <div class="win-tabbar" data-id="${id}"></div>
      <div class="win-content"></div>
      <div class="win-resize">${Icons.resize}</div>
    `;

    document.getElementById('windows-container').appendChild(el);

    const win = { id, el, title, format, tabs: [], activeTab: null, minimized: false, maximized: false, _prevRect: null };
    windows.push(win);

    _setupDrag(el, el.querySelector('.win-titlebar.draggable'));
    _setupResize(el, el.querySelector('.win-resize'));
    _setupControls(el, win);

    addTab(win);
    focus(id);
    App.updateHotbar();
    return win;
  }

  function addTab(win) {
    const tid = 'tab-' + Date.now();
    const tab = { id: tid, label: win.format + '-' + (win.tabs.length + 1), linked: false };
    win.tabs.push(tab);
    _renderTabs(win);
    setActiveTab(win, tid);
    return tab;
  }

  function removeTab(win, tid) {
    if (win.tabs.length <= 1) { close(win.id); return; }
    win.tabs = win.tabs.filter(t => t.id !== tid);
    if (win.activeTab === tid) setActiveTab(win, win.tabs[win.tabs.length - 1].id);
    else _renderTabs(win);
  }

  function setActiveTab(win, tid) {
    win.activeTab = tid;
    _renderTabs(win);
    _renderPane(win, tid);
  }

  function _renderTabs(win) {
    const bar = win.el.querySelector('.win-tabbar');
    bar.innerHTML = '';
    win.tabs.forEach(tab => {
      const t = document.createElement('div');
      t.className = 'tab' + (tab.id === win.activeTab ? ' active' : '') + (tab.linked ? ' linked' : '');
      t.dataset.tid = tab.id;
      const cls = document.createElement('button');
      cls.className = 'tab-close';
      cls.innerHTML = Icons.tabClose;
      cls.addEventListener('click', e => { e.stopPropagation(); removeTab(win, tab.id); });
      const lbl = document.createElement('span');
      lbl.textContent = tab.label;
      t.appendChild(lbl);
      t.appendChild(cls);
      t.addEventListener('click', () => setActiveTab(win, tab.id));
      bar.appendChild(t);
    });
    const add = document.createElement('button');
    add.className = 'tab-add';
    add.innerHTML = Icons.tabAdd;
    add.title = 'Новая вкладка';
    add.addEventListener('click', () => addTab(win));
    bar.appendChild(add);
  }

  function _renderPane(win, tid) {
    const content = win.el.querySelector('.win-content');
    let pane = content.querySelector(`.win-pane[data-tid="${tid}"]`);
    if (!pane) {
      pane = document.createElement('div');
      pane.className = 'win-pane';
      pane.dataset.tid = tid;
      pane.dataset.format = win.format;
      _buildPane(pane, win.format, win, tid);
      content.appendChild(pane);
    }
    content.querySelectorAll('.win-pane').forEach(p => p.classList.remove('active'));
    pane.classList.add('active');
  }

  function _buildPane(pane, format, win, tid) {
    if (format === 'text')     Terminal.buildText(pane, win, tid);
    else if (format === 'terminal') Terminal.buildTerminal(pane, win, tid);
    else if (format === 'code')     Terminal.buildCode(pane, win, tid);
    else if (format === 'apps')     Terminal.buildApps(pane, win, tid);
    else if (format === 'sites')    Terminal.buildSites(pane, win, tid);
    else if (format === 'files')    Terminal.buildFiles(pane, win, tid);
  }

  function focus(id) {
    focused = id;
    windows.forEach(w => {
      w.el.classList.toggle('focused', w.id === id);
      if (w.id === id) { zCounter++; w.el.style.zIndex = zCounter; }
    });
    App.updateHotbar();
  }

  function close(id) {
    const win = windows.find(w => w.id === id);
    if (!win) return;
    win.el.remove();
    windows = windows.filter(w => w.id !== id);
    App.updateHotbar();
  }

  function minimize(id) {
    const win = windows.find(w => w.id === id);
    if (!win) return;
    win.minimized = !win.minimized;
    win.el.classList.toggle('minimized', win.minimized);
    App.updateHotbar();
  }

  function maximize(id) {
    const win = windows.find(w => w.id === id);
    if (!win) return;
    if (!win.maximized) {
      win._prevRect = { left: win.el.style.left, top: win.el.style.top, width: win.el.style.width, height: win.el.style.height };
      win.el.style.left = '0'; win.el.style.top = '0';
      win.el.style.width = '100vw';
      win.el.style.height = `calc(100vh - var(--hotbar-h))`;
      win.maximized = true;
    } else {
      const r = win._prevRect;
      win.el.style.left = r.left; win.el.style.top = r.top;
      win.el.style.width = r.width; win.el.style.height = r.height;
      win.maximized = false;
    }
  }

  function _setupControls(el, win) {
    el.addEventListener('mousedown', e => { focus(win.id); });
    el.querySelector('.btn-close').addEventListener('click', e => { e.stopPropagation(); close(win.id); });
    el.querySelector('.btn-min').addEventListener('click',   e => { e.stopPropagation(); minimize(win.id); });
    el.querySelector('.btn-max').addEventListener('click',   e => { e.stopPropagation(); maximize(win.id); });
  }

  function _setupDrag(el, handle) {
    let ox, oy, dragging = false;
    handle.addEventListener('mousedown', e => {
      if (e.target.closest('.win-controls')) return;
      dragging = true;
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let nx = e.clientX - ox, ny = e.clientY - oy;
      nx = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, nx));
      ny = Math.max(0, Math.min(window.innerHeight - 42 - el.offsetHeight, ny));
      el.style.left = nx + 'px'; el.style.top = ny + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; });
  }

  function _setupResize(el, handle) {
    let resizing = false, sx, sy, sw, sh;
    handle.addEventListener('mousedown', e => {
      e.stopPropagation(); resizing = true;
      sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (!resizing) return;
      const nw = Math.max(280, sw + e.clientX - sx);
      const nh = Math.max(180, sh + e.clientY - sy);
      el.style.width = nw + 'px'; el.style.height = nh + 'px';
    });
    document.addEventListener('mouseup', () => { resizing = false; document.body.style.userSelect = ''; });
  }

  function getAll() { return windows; }
  function getById(id) { return windows.find(w => w.id === id); }

  function startLinkMode(srcWinId, srcTid) {
    linkMode = true;
    linkSource = { winId: srcWinId, tid: srcTid };
    const srcEl = document.getElementById(srcWinId);
    srcEl && srcEl.classList.add('link-source');
    windows.forEach(w => {
      if (w.id !== srcWinId && w.format === 'code') {
        w.el.addEventListener('mouseenter', _linkHoverIn);
        w.el.addEventListener('mouseleave', _linkHoverOut);
        w.el.addEventListener('click', _linkClick, { once: true });
      }
    });
    App.toast('Кликните на другое окно кода для связи');
  }
  function _linkHoverIn(e) { e.currentTarget.classList.add('link-target-hover'); }
  function _linkHoverOut(e) { e.currentTarget.classList.remove('link-target-hover'); }
  function _linkClick(e) {
    const tgtWin = windows.find(w => w.el === e.currentTarget);
    if (!tgtWin || !linkSource) { _endLinkMode(); return; }
    const srcWin = getById(linkSource.winId);
    const srcTab = srcWin && srcWin.tabs.find(t => t.id === linkSource.tid);
    if (srcTab) { srcTab.linked = true; srcTab.linkedTo = tgtWin.id; _renderTabs(srcWin); }
    App.toast(`Связано: "${srcWin.title}" → "${tgtWin.title}"`);
    _endLinkMode();
  }
  function _endLinkMode() {
    linkMode = false;
    windows.forEach(w => {
      w.el.classList.remove('link-source', 'link-target-hover');
      w.el.removeEventListener('mouseenter', _linkHoverIn);
      w.el.removeEventListener('mouseleave', _linkHoverOut);
    });
    linkSource = null;
  }

  return { create, addTab, removeTab, setActiveTab, focus, close, minimize, maximize, getAll, getById, startLinkMode };
})();

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
