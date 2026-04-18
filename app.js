// app.js — Main application glue

const App = (() => {
  let toastTimer = null;

  function init() {
    _bindSettingsBtn();
    _bindContextMenu();
    _bindReboot();
    _startClock();
    // Open a welcome window
    setTimeout(() => {
      const win = WM.create({ title: 'Добро пожаловать', format: 'text', x: 80, y: 50, w: 500, h: 340 });
      setTimeout(() => {
        const pane = win.el.querySelector('.win-pane.active');
        if (pane) {
          const ta = pane.querySelector('textarea');
          if (ta) ta.value = [
            'Добро пожаловать в QATTW v1.0.02 — beta',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '',
            'QATTW — это программа в стиле операционной системы.',
            '',
            '  › Нажмите ⚙ (внизу справа) для меню настроек',
            '  › Правая кнопка мыши — контекстное меню',
            '  › Перетаскивайте окна за заголовок',
            '  › Изменяйте размер за правый нижний угол',
            '  › Создайте окна с терминалом, кодом, файлами и сайтами',
            '',
            'Нашли баг? Напишите: wfstudio.wofes@gmail.com',
          ].join('\n');
        }
      }, 100);
    }, 200);
  }

  function _bindSettingsBtn() {
    const btn = document.getElementById('settings-btn');
    const popup = document.getElementById('settings-popup');

    btn.addEventListener('click', e => {
      e.stopPropagation();
      popup.classList.toggle('hidden');
      btn.classList.toggle('active');
    });

    document.addEventListener('click', e => {
      if (!popup.contains(e.target) && e.target !== btn) {
        popup.classList.add('hidden');
        btn.classList.remove('active');
      }
    });

    popup.querySelectorAll('.settings-item').forEach(item => {
      item.addEventListener('click', () => {
        popup.classList.add('hidden');
        btn.classList.remove('active');
        const action = item.dataset.action;
        if (action === 'create')    Settings.openCreate();
        if (action === 'customize') Settings.openCustomize();
        if (action === 'wallpaper') Settings.openWallpaper();
        if (action === 'system')    Settings.openSystem();
        if (action === 'reboot')    openRebootDialog();
      });
    });
  }

  function _bindContextMenu() {
    const menu = document.getElementById('context-menu');
    document.getElementById('desktop').addEventListener('contextmenu', e => {
      if (e.target.closest('.window') || e.target.closest('.hotbar') || e.target.closest('.settings-popup')) return;
      e.preventDefault();
      menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
      menu.style.top  = Math.min(e.clientY, window.innerHeight - 180) + 'px';
      menu.classList.remove('hidden');
    });
    document.addEventListener('click', () => menu.classList.add('hidden'));
    document.addEventListener('contextmenu', () => setTimeout(() => {}, 0));

    menu.querySelectorAll('.ctx-item').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.add('hidden');
        const action = item.dataset.action;
        if (action === 'new-text')     WM.create({ title: 'Текст', format: 'text' });
        if (action === 'new-terminal') WM.create({ title: 'Терминал', format: 'terminal' });
        if (action === 'new-code')     WM.create({ title: 'Код', format: 'code' });
        if (action === 'open-settings') Settings.openSystem();
      });
    });
  }

  function _bindReboot() {
    document.getElementById('reboot-yes').addEventListener('click', doReboot);
    document.getElementById('reboot-no').addEventListener('click', () => {
      document.getElementById('reboot-dialog').classList.add('hidden');
    });
  }

  function openRebootDialog() {
    document.getElementById('reboot-dialog').classList.remove('hidden');
  }

  function doReboot() {
    document.getElementById('reboot-dialog').classList.add('hidden');
    toast('System restart...');
    const desktop = document.getElementById('desktop');
    setTimeout(() => {
      // Fade out
      desktop.style.transition = 'opacity 0.5s';
      desktop.style.opacity = '0';
      setTimeout(() => {
        desktop.style.display = 'none';
        // Show "Searching for signal..."
        const msgEl = document.createElement('div');
        msgEl.style.cssText = `position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:9999;font-family:'JetBrains Mono',monospace;font-size:16px;color:#7c6fff;letter-spacing:0.1em;`;
        msgEl.textContent = 'Searching for signal...';
        document.body.appendChild(msgEl);
        setTimeout(() => {
          msgEl.style.transition = 'opacity 0.5s';
          msgEl.style.opacity = '0';
          setTimeout(() => {
            msgEl.remove();
            // Restart
            document.getElementById('boot-screen').style.display = '';
            document.getElementById('boot-screen').classList.remove('fade-out');
            document.getElementById('boot-screen').style.opacity = '1';
            document.getElementById('boot-bar').style.width = '0';
            // Clear windows
            document.getElementById('windows-container').innerHTML = '';
            desktop.innerHTML = `
              <canvas id="wallpaper-canvas"></canvas>
              <div id="windows-container"></div>
              ${document.getElementById('context-menu').outerHTML}
              <div class="hotbar" id="hotbar">
                <div class="hotbar-left" id="hotbar-clock">00:00:00</div>
                <div class="hotbar-center" id="hotbar-windows-list"></div>
                <div class="hotbar-right">
                  <button class="hotbar-btn" id="settings-btn" title="Настройки">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </button>
                </div>
              </div>
              <div id="settings-popup" class="settings-popup hidden">
                <div class="settings-menu">
                  <div class="settings-header"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> QATTW</div>
                  <div class="settings-item" data-action="create"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Создать</div>
                  <div class="settings-item" data-action="customize"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg> Настроить</div>
                  <div class="settings-item" data-action="wallpaper"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Обои (фон)</div>
                  <div class="settings-item" data-action="system"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Система</div>
                  <div class="settings-item settings-item--danger" data-action="reboot"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Перезагрузка</div>
                </div>
              </div>
              <div id="reboot-dialog" class="dialog-overlay hidden">
                <div class="dialog-box">
                  <div class="dialog-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></div>
                  <div class="dialog-title">Перезагрузка</div>
                  <div class="dialog-text">Вы уверены, что хотите перезагрузить систему?</div>
                  <div class="dialog-buttons">
                    <button class="dialog-btn dialog-btn--yes" id="reboot-yes">Yes</button>
                    <button class="dialog-btn dialog-btn--no" id="reboot-no">No</button>
                  </div>
                </div>
              </div>
              <div id="toast" class="toast hidden"></div>
            `;
            desktop.style.display = '';
            desktop.style.opacity = '0';
            startBoot();
          }, 500);
        }, 4000);
      }, 3000);
    }, 3000);
  }

  function updateHotbar() {
    const list = document.getElementById('hotbar-windows-list');
    if (!list) return;
    list.innerHTML = '';
    WM.getAll().forEach(win => {
      const chip = document.createElement('div');
      chip.className = 'hotbar-win-chip' + (win.el.classList.contains('focused') ? ' active' : '');
      chip.innerHTML = `${Icons.winIcon}<span>${escHtml(win.title)}</span>`;
      chip.addEventListener('click', () => {
        if (win.minimized) {
          win.minimized = false;
          win.el.classList.remove('minimized');
        }
        WM.focus(win.id);
      });
      list.appendChild(chip);
    });
  }

  function toast(msg, duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  function _startClock() {
    const tick = () => {
      const el = document.getElementById('hotbar-clock');
      if (el) el.textContent = new Date().toLocaleTimeString('ru');
    };
    tick();
    setInterval(tick, 1000);
  }

  return { init, updateHotbar, toast };
})();
