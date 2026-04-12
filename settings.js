// settings.js — Modal windows for settings menu

const Settings = (() => {
  const root = () => document.getElementById('modal-root');

  function openModal(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box">${html}</div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    root().appendChild(overlay);
    overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
    return overlay;
  }

  // ── CREATE ────────────────────────────────────────
  function openCreate() {
    const FORMATS = [
      { id: 'text',     label: 'Текст',      icon: Icons.text,     disabled: false },
      { id: 'terminal', label: 'Терминал',   icon: Icons.terminal, disabled: false },
      { id: 'code',     label: 'Код',        icon: Icons.code,     disabled: false },
      { id: 'apps',     label: 'Приложения', icon: Icons.apps,     disabled: true  },
      { id: 'sites',    label: 'Сайты',      icon: Icons.sites,    disabled: false },
      { id: 'files',    label: 'Файлы',      icon: Icons.files,    disabled: false },
    ];

    const overlay = openModal(`
      <div class="modal-header">
        <h2>${Icons.text} Создать окно</h2>
        <button class="modal-close">${Icons.close}</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Иконка окна</label>
          <div id="avatar-upload-area" class="file-upload-area">
            <div id="avatar-preview" style="display:none;width:40px;height:40px;border-radius:8px;overflow:hidden;"><img id="avatar-img" style="width:100%;height:100%;object-fit:cover;"/></div>
            ${Icons.upload}
            <span>Выбрать файл-аватарку</span>
            <small>PNG, JPG, SVG</small>
            <input type="file" id="avatar-file" accept="image/*" style="display:none;">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Название окна <span style="color:var(--text3);font-weight:400;">(макс. 32 символа)</span></label>
          <input type="text" class="form-input" id="win-name" placeholder="Моё окно" maxlength="32" />
        </div>
        <div class="form-group">
          <label class="form-label">Формат вкладки</label>
          <div class="format-grid">
            ${FORMATS.map(f => `
              <div class="format-card ${f.disabled ? 'disabled' : ''}" data-fmt="${f.id}" ${f.disabled ? 'title="Недоступно в этой версии"' : ''}>
                <div class="fc-icon">${f.icon}</div>
                <span>${f.label}</span>
                ${f.disabled ? '<small style="font-size:9px;color:var(--text3);">скоро</small>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary modal-close">Отмена</button>
        <button class="btn-primary" id="create-confirm-btn">Создать</button>
      </div>
    `);

    let selectedFmt = 'text';
    let avatarDataUrl = null;

    overlay.querySelector('[data-fmt="text"]').classList.add('selected');
    overlay.querySelectorAll('.format-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        overlay.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedFmt = card.dataset.fmt;
      });
    });

    const avatarArea = overlay.querySelector('#avatar-upload-area');
    const avatarFile = overlay.querySelector('#avatar-file');
    avatarArea.addEventListener('click', () => avatarFile.click());
    avatarFile.addEventListener('change', () => {
      const f = avatarFile.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = e => {
        avatarDataUrl = e.target.result;
        overlay.querySelector('#avatar-img').src = avatarDataUrl;
        overlay.querySelector('#avatar-preview').style.display = 'block';
      };
      reader.readAsDataURL(f);
    });

    overlay.querySelector('#create-confirm-btn').addEventListener('click', () => {
      const name = overlay.querySelector('#win-name').value.trim() || selectedFmt;
      const win = WM.create({ title: name, format: selectedFmt });
      if (avatarDataUrl) {
        const iconEl = win.el.querySelector('.win-icon');
        iconEl.innerHTML = `<img src="${avatarDataUrl}" />`;
      }
      overlay.remove();
      App.updateHotbar();
    });
  }

  // ── CUSTOMIZE ─────────────────────────────────────
  function openCustomize() {
    const vars = [
      { label: 'Цвет акцента',       v: '--accent',       def: '#7c6fff' },
      { label: 'Цвет текста',        v: '--text',         def: '#e8e6f0' },
      { label: 'Фон вкладки',        v: '--win-bg',       def: '#0f0f1c' },
      { label: 'Цвет hot-bar',       v: '--hotbar-bg',    def: '#09090f' },
      { label: 'Фон окна',           v: '--surface',      def: '#0f0f1c' },
      { label: 'Кнопки управления',  v: '--btn-accent',   def: '#7c6fff' },
    ];

    const rows = vars.map(item => `
      <div class="form-group color-row" style="flex-direction:row;align-items:center;gap:10px;">
        <div class="color-preview" id="prev-${item.v.slice(2)}"
          style="background:${item.def};" data-var="${item.v}"></div>
        <div style="flex:1;">
          <div class="form-label" style="margin-bottom:3px;">${item.label}</div>
          <input type="text" class="form-input color-input" id="inp-${item.v.slice(2)}"
            value="${item.def}" placeholder="#ffffff" data-var="${item.v}"
            style="height:28px;font-size:11px;" />
        </div>
        <input type="color" class="color-picker-input" id="pick-${item.v.slice(2)}" value="${item.def}" data-var="${item.v}">
      </div>
    `).join('');

    const overlay = openModal(`
      <div class="modal-header">
        <h2>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          Настроить внешний вид
        </h2>
        <button class="modal-close">${Icons.close}</button>
      </div>
      <div class="modal-body">${rows}</div>
      <div class="modal-footer">
        <button class="btn-secondary" id="reset-theme-btn">Сбросить</button>
        <button class="btn-secondary modal-close">Отмена</button>
        <button class="btn-primary" id="apply-theme-btn">Применить</button>
      </div>
    `);

    const applyVar = (v, val) => {
      if (/^#[0-9a-fA-F]{3,8}$/.test(val)) document.documentElement.style.setProperty(v, val);
    };

    overlay.querySelectorAll('.color-input').forEach(inp => {
      const v = inp.dataset.var;
      const key = v.slice(2);
      const prev = overlay.querySelector(`#prev-${key}`);
      const pick = overlay.querySelector(`#pick-${key}`);
      inp.addEventListener('input', () => { prev.style.background = inp.value; applyVar(v, inp.value); });
      prev.addEventListener('click', () => pick.click());
      pick.addEventListener('input', () => { inp.value = pick.value; prev.style.background = pick.value; applyVar(v, pick.value); });
    });

    overlay.querySelector('#apply-theme-btn').addEventListener('click', () => {
      overlay.querySelectorAll('.color-input').forEach(inp => applyVar(inp.dataset.var, inp.value));
      overlay.remove();
      App.toast('Тема применена');
    });

    overlay.querySelector('#reset-theme-btn').addEventListener('click', () => {
      document.documentElement.removeAttribute('style');
      overlay.remove();
      App.toast('Тема сброшена');
    });
  }

  // ── WALLPAPER ─────────────────────────────────────
  function openWallpaper() {
    const overlay = openModal(`
      <div class="modal-header">
        <h2>${Icons.image} Обои и фон</h2>
        <button class="modal-close">${Icons.close}</button>
      </div>
      <div class="modal-body">
        <div class="wallpaper-grid">
          <div class="wallpaper-option" id="wp-desk-img">
            ${Icons.image} Фото на рабочий стол
          </div>
          <div class="wallpaper-option" id="wp-desk-vid">
            ${Icons.video} Видео на рабочий стол
          </div>
          <div class="wallpaper-option" id="wp-tab-img">
            ${Icons.image} Фото в вкладку
          </div>
          <div class="wallpaper-option" id="wp-tab-vid">
            ${Icons.video} Видео в вкладку
          </div>
        </div>
        <div class="wallpaper-option" id="wp-remove" style="margin-top:8px;color:var(--danger);border-color:rgba(224,85,85,0.3);">
          ${Icons.trash} Удалить обои (фон станет чёрным)
        </div>
      </div>
    `);

    const pick = (accept, cb) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = accept;
      inp.onchange = () => { if (inp.files[0]) cb(inp.files[0]); };
      inp.click();
    };

    const setDesktopBg = (url, isVideo) => {
      document.querySelectorAll('#wallpaper-video,#wallpaper-image').forEach(el => el.remove());
      const el = document.createElement(isVideo ? 'video' : 'img');
      el.id = isVideo ? 'wallpaper-video' : 'wallpaper-image';
      el.src = url;
      if (isVideo) { el.autoplay = true; el.loop = true; el.muted = true; }
      document.getElementById('desktop').prepend(el);
      document.getElementById('wallpaper-canvas').style.opacity = '0';
    };

    overlay.querySelector('#wp-desk-img').addEventListener('click', () => {
      pick('image/*', f => { setDesktopBg(URL.createObjectURL(f), false); overlay.remove(); App.toast('Обои установлены'); });
    });
    overlay.querySelector('#wp-desk-vid').addEventListener('click', () => {
      pick('video/*', f => { setDesktopBg(URL.createObjectURL(f), true); overlay.remove(); App.toast('Видео-обои установлены'); });
    });
    overlay.querySelector('#wp-tab-img').addEventListener('click', () => {
      pick('image/*', f => {
        const url = URL.createObjectURL(f);
        document.querySelectorAll('.win-content').forEach(c => c.style.background = `url(${url}) center/cover`);
        overlay.remove(); App.toast('Фон вкладок установлен');
      });
    });
    overlay.querySelector('#wp-tab-vid').addEventListener('click', () => {
      App.toast('Видео-фон вкладки: загрузите видео');
      pick('video/*', f => {
        overlay.remove(); App.toast('Видео фон вкладки установлен (эффект при создании окон)');
      });
    });
    overlay.querySelector('#wp-remove').addEventListener('click', () => {
      document.querySelectorAll('#wallpaper-video,#wallpaper-image').forEach(el => el.remove());
      document.querySelectorAll('.win-content').forEach(c => c.style.background = '');
      document.getElementById('wallpaper-canvas').style.opacity = '1';
      overlay.remove(); App.toast('Обои удалены');
    });
  }

  // ── SYSTEM ────────────────────────────────────────
  function openSystem() {
    openModal(`
      <div class="modal-header">
        <h2>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Система
        </h2>
        <button class="modal-close">${Icons.close}</button>
      </div>
      <div class="modal-body">
        <div class="system-info-box">
          <div class="sys-row"><span class="sys-key">Система</span><span class="sys-val">QATTW</span></div>
          <div class="sys-row"><span class="sys-key">Версия</span><span class="sys-val">1.0.02 — beta-test</span></div>
          <div class="sys-row"><span class="sys-key">Ядро</span><span class="sys-val">web-engine 1.0</span></div>
          <div class="sys-row"><span class="sys-key">Дисплей</span><span class="sys-val">${window.innerWidth}×${window.innerHeight}</span></div>
          <div class="sys-row"><span class="sys-key">Браузер</span><span class="sys-val">${navigator.userAgent.split(' ').pop()}</span></div>
          <div class="sys-row"><span class="sys-key">Платформа</span><span class="sys-val">${navigator.platform || 'Web'}</span></div>
          <div class="sys-email">
            Эта версия находится в тестировании.<br>
            Нашли баг? Напишите нам:<br>
            <a href="mailto:wfstudio.wofes@gmail.com">wfstudio.wofes@gmail.com</a>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary modal-close">Закрыть</button>
      </div>
    `);
  }

  return { openCreate, openCustomize, openWallpaper, openSystem };
})();
