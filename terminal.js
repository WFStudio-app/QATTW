// terminal.js — Pane builders for each window format

const Terminal = (() => {

  // ── TEXT ──────────────────────────────────────────
  function buildText(pane, win, tid) {
    pane.style.flexDirection = 'column';
    const ta = document.createElement('textarea');
    ta.className = 'text-area';
    ta.placeholder = 'Начните печатать...';
    ta.maxLength = 50000;
    const footer = document.createElement('div');
    footer.className = 'text-footer';
    footer.textContent = '0 / 50000';
    ta.addEventListener('input', () => {
      const n = ta.value.length;
      footer.textContent = n.toLocaleString('ru') + ' / 50 000';
    });
    pane.appendChild(ta);
    pane.appendChild(footer);
  }

  // ── TERMINAL ─────────────────────────────────────
  const FAKE_FS = {
    '/': ['home', 'etc', 'usr', 'bin'],
    '/home': ['user'],
    '/home/user': ['docs', 'readme.txt', 'qattw.cfg'],
    '/etc': ['hosts', 'passwd'],
    '/usr': ['bin', 'lib'],
  };
  const COMMANDS = {
    help: () => `Available commands:\n  ls         — list directory\n  cd <dir>   — change directory\n  pwd        — print working dir\n  echo <txt> — print text\n  clear      — clear terminal\n  date       — current date/time\n  neofetch   — system info\n  history    — command history`,
    pwd: (args, state) => state.cwd,
    date: () => new Date().toLocaleString('ru'),
    echo: (args) => args.join(' '),
    ls: (args, state) => {
      const dir = FAKE_FS[state.cwd] || [];
      return dir.length ? dir.join('   ') : '(empty)';
    },
    cd: (args, state) => {
      const target = args[0];
      if (!target || target === '~') { state.cwd = '/home/user'; return ''; }
      if (target === '..') {
        const parts = state.cwd.split('/').filter(Boolean);
        parts.pop();
        state.cwd = '/' + parts.join('/') || '/';
        return '';
      }
      const newPath = state.cwd === '/' ? '/' + target : state.cwd + '/' + target;
      if (FAKE_FS[newPath] !== undefined) { state.cwd = newPath; return ''; }
      return { error: `cd: no such directory: ${target}` };
    },
    neofetch: (args, state) => {
      return [
        '   ██████╗  █████╗ ████████╗████████╗██╗    ██╗',
        '  ██╔═══██╗██╔══██╗╚══██╔══╝╚══██╔══╝██║    ██║',
        '  ██║   ██║███████║   ██║      ██║   ██║ █╗ ██║',
        '  ██║▄▄ ██║██╔══██║   ██║      ██║   ██║███╗██║',
        '  ╚██████╔╝██║  ██║   ██║      ██║   ╚███╔███╔╝',
        '   ╚══▀▀═╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝    ╚══╝╚══╝ ',
        '',
        '  OS: QATTW v1.0.02 beta',
        '  Kernel: web-engine 1.0',
        '  Shell: qsh 1.0',
        '  Resolution: ' + window.innerWidth + 'x' + window.innerHeight,
        '  Theme: Dark / Purple',
        '  Font: JetBrains Mono',
      ].join('\n');
    },
    clear: () => '__CLEAR__',
    history: (args, state) => state.history.slice(-20).map((c,i)=>`  ${i+1}  ${c}`).join('\n'),
  };

  function buildTerminal(pane, win, tid) {
    pane.style.flexDirection = 'column';
    const state = { cwd: '/home/user', history: [] };

    const output = document.createElement('div');
    output.className = 'terminal-pane';
    output.innerHTML = `<div style="color:var(--accent2);margin-bottom:8px;font-weight:500;">QATTW Terminal v1.0.02 — beta<br><span style="color:var(--text3);font-size:11px;">type 'help' for commands</span></div>`;

    const inputLine = document.createElement('div');
    inputLine.className = 'term-input-line';
    const promptSpan = document.createElement('span');
    promptSpan.textContent = '$ ';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'term-input';
    input.spellcheck = false;
    input.autocomplete = 'off';
    inputLine.appendChild(promptSpan);
    inputLine.appendChild(input);

    pane.appendChild(output);
    pane.appendChild(inputLine);
    input.focus();

    let histIdx = -1;
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const raw = input.value.trim();
        if (!raw) return;
        state.history.push(raw);
        histIdx = -1;
        _printLine(output, raw, null);
        const parts = raw.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        if (COMMANDS[cmd]) {
          const res = COMMANDS[cmd](args, state);
          if (res === '__CLEAR__') { output.innerHTML = ''; }
          else if (res && res.error) _printLine(output, null, res.error);
          else if (res) _printLine(output, null, res);
        } else {
          _printLine(output, null, `${cmd}: command not found. Type 'help'.`, true);
        }
        input.value = '';
        output.scrollTop = output.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        if (state.history.length === 0) return;
        histIdx = Math.min(histIdx + 1, state.history.length - 1);
        input.value = state.history[state.history.length - 1 - histIdx];
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        histIdx = Math.max(histIdx - 1, -1);
        input.value = histIdx === -1 ? '' : state.history[state.history.length - 1 - histIdx];
        e.preventDefault();
      }
    });
  }

  function _printLine(container, cmd, out, isErr = false) {
    if (cmd !== null) {
      const l = document.createElement('div');
      l.className = 'term-line';
      l.innerHTML = `<span class="term-prompt">$</span><span style="color:var(--text)">${escHtml(cmd)}</span>`;
      container.appendChild(l);
    }
    if (out !== null && out !== '') {
      const o = document.createElement('div');
      o.className = 'term-output' + (isErr ? ' error' : '');
      o.style.paddingLeft = '18px';
      o.style.whiteSpace = 'pre-wrap';
      o.textContent = out;
      container.appendChild(o);
    }
  }

  // ── CODE ─────────────────────────────────────────
  const LANG_TEMPLATES = {
    HLMT: `<!-- HLMT: Hyper Layout Markup Text -->\n<window title="Hello">\n  <text>Привет, QATTW!</text>\n</window>`,
    CSS: `/* CSS */\nbody {\n  background: #090912;\n  color: #e8e6f0;\n}`,
    JavaScript: `// JavaScript\nconsole.log("Hello from QATTW!");\n\nconst greet = name => \`Привет, \${name}!\`;\nconsole.log(greet("World"));`,
    Java: `// Java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from QATTW!");\n  }\n}`,
    C: `// C\n#include <stdio.h>\nint main() {\n  printf("Hello from QATTW!\\n");\n  return 0;\n}`,
    'C++': `// C++\n#include <iostream>\nint main() {\n  std::cout << "Hello from QATTW!" << std::endl;\n  return 0;\n}`,
    Rust: `// Rust\nfn main() {\n    println!("Hello from QATTW!");\n}`,
    'C#': `// C#\nusing System;\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello from QATTW!");\n  }\n}`,
  };

  function buildCode(pane, win, tid) {
    pane.style.flexDirection = 'column';

    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';

    const sel = document.createElement('select');
    sel.className = 'code-lang-select';
    Object.keys(LANG_TEMPLATES).forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang; opt.textContent = lang;
      sel.appendChild(opt);
    });

    const runBtn = document.createElement('button');
    runBtn.className = 'code-run-btn';
    runBtn.innerHTML = Icons.run + ' Запустить';

    const linkBtn = document.createElement('button');
    linkBtn.className = 'code-link-btn';
    linkBtn.innerHTML = Icons.link + ' Связать';
    linkBtn.title = 'Связать с другим окном кода';

    toolbar.appendChild(sel);
    toolbar.appendChild(runBtn);
    toolbar.appendChild(linkBtn);

    const editor = document.createElement('textarea');
    editor.className = 'code-editor';
    editor.value = LANG_TEMPLATES['HLMT'];
    editor.spellcheck = false;

    const outputDiv = document.createElement('div');
    outputDiv.className = 'code-output';
    outputDiv.textContent = '> Готов к запуску...';

    sel.addEventListener('change', () => {
      editor.value = LANG_TEMPLATES[sel.value] || '';
    });

    runBtn.addEventListener('click', () => {
      const lang = sel.value;
      const code = editor.value.trim();
      outputDiv.className = 'code-output success';
      if (lang === 'JavaScript') {
        try {
          const logs = [];
          const fakeConsole = { log: (...a) => logs.push(a.join(' ')), error: (...a) => logs.push('[err] ' + a.join(' ')) };
          const fn = new Function('console', code);
          fn(fakeConsole);
          outputDiv.textContent = '> ' + (logs.length ? logs.join('\n> ') : '(no output)');
        } catch(e) {
          outputDiv.className = 'code-output error';
          outputDiv.textContent = '> Error: ' + e.message;
        }
      } else {
        outputDiv.textContent = `> [${lang}] Компиляция... ОК\n> Программа выполнена успешно.`;
        // Chain: run linked windows too
        const tab = win.tabs.find(t => t.id === tid);
        if (tab && tab.linked && tab.linkedTo) {
          const linkedWin = WM.getById(tab.linkedTo);
          if (linkedWin) {
            setTimeout(() => {
              const lPane = linkedWin.el.querySelector(`.win-pane[data-tid="${linkedWin.activeTab}"]`);
              const lOut = lPane && lPane.querySelector('.code-output');
              if (lOut) { lOut.className = 'code-output success'; lOut.textContent = `> [Цепочка] ${linkedWin.title} запущен.`; }
            }, 400);
          }
        }
      }
    });

    linkBtn.addEventListener('click', () => {
      WM.startLinkMode(win.id, tid);
    });

    pane.appendChild(toolbar);
    pane.appendChild(editor);
    pane.appendChild(outputDiv);

    // Tab key in editor
    editor.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart, end = editor.selectionEnd;
        editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = s + 2;
      }
    });
  }

  // ── APPS ─────────────────────────────────────────
  function buildApps(pane, win, tid) {
    pane.style.flexDirection = 'column';
    const wrap = document.createElement('div');
    wrap.className = 'apps-pane';
    wrap.innerHTML = `
      ${Icons.apps}
      <span style="font-size:14px;font-weight:600;color:var(--text2);">Приложения</span>
      <p>Раздел недоступен в этой версии</p>
      <span style="font-size:10px;color:var(--text3);font-family:var(--font-mono);margin-top:4px;">// TODO: v1.1.0</span>
    `;
    pane.appendChild(wrap);
  }

  // ── SITES ─────────────────────────────────────────
  function buildSites(pane, win, tid) {
    pane.style.flexDirection = 'column';
    const bar = document.createElement('div');
    bar.className = 'sites-bar';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sites-input';
    input.placeholder = 'Введите URL или поисковый запрос...';
    input.value = 'https://www.google.com';
    const goBtn = document.createElement('button');
    goBtn.className = 'sites-go-btn';
    goBtn.textContent = 'Открыть';
    bar.appendChild(input);
    bar.appendChild(goBtn);

    const frame = document.createElement('iframe');
    frame.className = 'sites-frame';
    frame.src = 'about:blank';
    frame.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';

    const navigate = () => {
      let url = input.value.trim();
      if (!url) return;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('.')) {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      try { frame.src = url; } catch(e) {}
    };

    goBtn.addEventListener('click', navigate);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(); });

    pane.appendChild(bar);
    pane.appendChild(frame);
  }

  // ── FILES ─────────────────────────────────────────
  function buildFiles(pane, win, tid) {
    pane.style.flexDirection = 'column';
    const fileList = [];

    const bar = document.createElement('div');
    bar.className = 'files-bar';
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn-secondary';
    uploadBtn.style.cssText = 'height:26px;font-size:11px;padding:0 12px;display:flex;align-items:center;gap:6px;';
    uploadBtn.innerHTML = Icons.upload.replace('20','12').replace('20','12') + ' Открыть файл';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.multiple = true;
    bar.appendChild(uploadBtn);
    bar.appendChild(fileInput);
    uploadBtn.addEventListener('click', () => fileInput.click());

    const dropZone = document.createElement('div');
    dropZone.className = 'files-drop-zone';
    dropZone.style.flex = '1';
    dropZone.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1.3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      <span>Перетащите файлы или нажмите «Открыть файл»</span>
      <small>Любые форматы</small>
    `;

    const listEl = document.createElement('div');
    listEl.className = 'file-list';
    listEl.style.display = 'none';

    const render = () => {
      if (fileList.length === 0) { dropZone.style.display = 'flex'; listEl.style.display = 'none'; return; }
      dropZone.style.display = 'none';
      listEl.style.display = 'block';
      listEl.innerHTML = '';
      fileList.forEach((f, i) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        const ext = f.name.split('.').pop().toUpperCase();
        item.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="file-item-name">${escHtml(f.name)}</span>
          <span class="file-item-size">${(f.size/1024).toFixed(1)} KB</span>
          <button style="background:transparent;border:none;color:var(--text3);cursor:pointer;padding:0;display:flex;align-items:center;" title="Удалить">${Icons.trash}</button>
        `;
        item.querySelector('button').addEventListener('click', e => {
          e.stopPropagation();
          fileList.splice(i, 1);
          render();
        });
        item.addEventListener('click', () => {
          if (f.type.startsWith('text') || f.name.endsWith('.txt') || f.name.endsWith('.md') || f.name.endsWith('.js') || f.name.endsWith('.html') || f.name.endsWith('.css')) {
            const reader = new FileReader();
            reader.onload = ev => {
              WM.create({ title: f.name, format: 'text' });
              setTimeout(() => {
                const allWins = WM.getAll();
                const newWin = allWins[allWins.length - 1];
                const paneEl = newWin.el.querySelector('.win-pane.active');
                if (paneEl) { const ta = paneEl.querySelector('textarea'); if (ta) ta.value = ev.target.result; }
              }, 100);
            };
            reader.readAsText(f);
          }
        });
        listEl.appendChild(item);
      });
    };

    const addFiles = (files) => {
      Array.from(files).forEach(f => fileList.push(f));
      render();
    };

    fileInput.addEventListener('change', () => addFiles(fileInput.files));

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      addFiles(e.dataTransfer.files);
    });

    pane.appendChild(bar);
    pane.appendChild(dropZone);
    pane.appendChild(listEl);
  }

  return { buildText, buildTerminal, buildCode, buildApps, buildSites, buildFiles };
})();
