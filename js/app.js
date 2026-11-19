(function () {
  'use strict';

  const editor = document.getElementById('md-editor');
  const editorHighlighter = window.WeChatEditorHighlighter.mount(editor);
  const output = document.getElementById('wx-output');
  const themeSelect = document.getElementById('theme-select');
  const sampleSelect = document.getElementById('sample-select');
  const codeThemeSelect = document.getElementById('code-theme-select');
  const preview = document.getElementById('preview-scroll-container');
  const device = document.getElementById('preview-device-wrapper');
  const storageKey = 'wechat-md-studio-v1';
  const historyKey = 'wechat-md-studio-history-v1';
  const optionIds = {
    'toggle-h2-number': 'h2Numbering',
    'toggle-h2-center': 'h2Center',
    'toggle-footnote': 'linkToFootnote',
    'toggle-mac-code': 'macCodeBlock',
    'toggle-code-lines': 'codeLineNumbers',
    'toggle-code-scroll': 'codeScroll'
  };
  const layoutControlIds = {
    accentColor: 'layout-accent-color',
    fontFamily: 'layout-font-family',
    headingFont: 'layout-heading-font',
    blockquoteFont: 'layout-blockquote-font',
    fontSize: 'layout-font-size',
    lineHeight: 'layout-line-height',
    paragraphSpacing: 'layout-paragraph-spacing',
    contentPadding: 'layout-content-padding',
    letterSpacing: 'layout-letter-spacing',
    firstLineIndent: 'layout-first-line-indent',
    tableFontSize: 'layout-table-font-size',
    codeFontSize: 'layout-code-font-size',
    codeLineHeight: 'layout-code-line-height'
  };
  const defaults = {
    themeId: 'editorial-sspai',
    codeTheme: 'mac-dark',
    h2Numbering: true,
    h2Center: false,
    linkToFootnote: true,
    macCodeBlock: true,
    codeLineNumbers: false,
    codeScroll: false,
    syncScroll: true,
    layout: {}
  };
  let state = Object.assign({}, defaults);
  let renderFrame = 0;
  let saveTimer = 0;
  let toastTimer = 0;
  let scrollSource = null;
  let scrollTimer = 0;
  let processingImages = false;
  let imageSelection = { start: 0, end: 0, value: '' };

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved === 'object') {
        state = Object.assign({}, defaults, saved.options || {});
        if (!window.WeChatThemes[state.themeId]) state.themeId = defaults.themeId;
        if (!['mac-dark', 'github', 'monokai', 'atom-one-dark', 'atom-one-light', 'wechat'].includes(state.codeTheme)) state.codeTheme = defaults.codeTheme;
        state.layout = window.WeChatThemeResolver.normalizeLayout(state.layout);
        return typeof saved.markdown === 'string' ? saved.markdown : null;
      }
    } catch (_) {}
    return null;
  }

  function saveState() {
    clearTimeout(saveTimer);
    document.getElementById('save-status').textContent = '正在保存...';
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ markdown: editorHighlighter.getValue(), options: state }));
        document.getElementById('save-status').textContent = '本地自动保存';
      } catch (_) {
        document.getElementById('save-status').textContent = '本地保存不可用';
      }
    }, 250);
  }

  function render() {
    renderFrame = 0;
    editorHighlighter.update();
    const markdown = editorHighlighter.getValue();
    const result = window.WeChatConverter.convert(markdown, state);
    output.innerHTML = result.html;
    const readingLength = markdown.replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, '').replace(/\s/g, '').length;
    document.getElementById('stat-chars').textContent = readingLength.toLocaleString('zh-CN') + ' 字';
    document.getElementById('stat-read-time').textContent = '预计阅读 ' + Math.max(1, Math.ceil(readingLength / 400)) + ' 分钟';
    document.getElementById('stat-footnotes').textContent = '外链引用 ' + result.footnotesCount + ' 处' + (result.explanationsCount ? ' · 脚注 ' + result.explanationsCount + ' 处' : '');
  }

  function scheduleRender() {
    if (!renderFrame) renderFrame = requestAnimationFrame(render);
  }

  function updateTheme() {
    const theme = window.WeChatThemeResolver.resolve(state.themeId, state.layout);
    themeSelect.value = state.themeId;
    document.getElementById('active-theme-dot').style.backgroundColor = theme.accentColor;
    const center = document.getElementById('toggle-h2-center');
    center.disabled = Boolean(theme.pill || theme.leftOnly);
    document.getElementById('label-h2-center').classList.toggle('is-disabled', center.disabled);
    center.title = theme.pill ? '当前主题固定使用居中胶囊标题' : theme.leftOnly ? 'GitHub 原生主题固定使用左对齐标题' : '切换二级标题对齐方式';
  }

  function updateLayoutForm() {
    const values = Object.assign({}, window.WeChatThemeResolver.defaults(state.themeId), state.layout);
    Object.keys(layoutControlIds).forEach(function (key) {
      const input = document.getElementById(layoutControlIds[key]);
      if (input.type === 'checkbox') input.checked = Boolean(values[key]);
      else input.value = String(values[key]);
    });
    document.getElementById('layout-accent-value').textContent = values.accentColor;
    document.querySelectorAll('[data-accent]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.accent === values.accentColor));
    });
  }

  function setLayoutValue(key, value) {
    const candidate = {};
    candidate[key] = value;
    const normalized = window.WeChatThemeResolver.normalizeLayout(candidate)[key];
    const next = Object.assign({}, state.layout);
    if (typeof normalized === 'undefined' || normalized === window.WeChatThemeResolver.defaults(state.themeId)[key]) delete next[key];
    else next[key] = normalized;
    state.layout = window.WeChatThemeResolver.normalizeLayout(next);
    updateTheme();
    scheduleRender();
    saveState();
  }

  function showToast(message, type) {
    const toast = document.getElementById('app-toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast show ' + (type || 'success');
    toastTimer = setTimeout(function () { toast.className = 'toast'; }, 2800);
  }

  function closeFileMenu() {
    document.getElementById('file-menu-panel').hidden = true;
    document.getElementById('file-menu-trigger').setAttribute('aria-expanded', 'false');
  }

  function exportMarkdown() {
    closeFileMenu();
    if (!editor.value.trim()) {
      showToast('当前没有可导出的内容', 'warn');
      return;
    }
    const blob = new Blob([editorHighlighter.getValue()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wechat-' + new Date().toISOString().slice(0, 10) + '.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('Markdown 文件已导出');
  }

  async function importMarkdown(file) {
    closeFileMenu();
    if (!file) return;
    if (!/\.(?:md|markdown|txt)$/i.test(file.name)) {
      showToast('请选择 .md、.markdown 或 .txt 文件', 'warn');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('文件不能超过 5MB', 'warn');
      return;
    }
    try {
      const content = await file.text();
      saveHistory(false);
      editorHighlighter.setValue(content.replace(/^\uFEFF/, ''));
      render();
      saveState();
      editor.scrollTop = 0;
      preview.scrollTop = 0;
      showToast('已导入 ' + file.name);
    } catch (_) {
      showToast('文件读取失败，请重试', 'warn');
    }
  }

  function readHistory() {
    try {
      const items = JSON.parse(localStorage.getItem(historyKey) || '[]');
      return Array.isArray(items) ? items.filter(function (item) { return item && typeof item.markdown === 'string'; }) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory(notify) {
    const markdown = editorHighlighter.getValue();
    if (!markdown.trim()) {
      if (notify) showToast('空白草稿无需保存快照', 'info');
      return false;
    }
    const items = readHistory();
    if (items[0] && items[0].markdown === markdown && items[0].themeId === state.themeId) {
      if (notify) showToast('当前内容与最近快照一致', 'info');
      return false;
    }
    items.unshift({ id: String(Date.now()), createdAt: new Date().toISOString(), markdown: markdown, themeId: state.themeId });
    try {
      localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 20)));
      if (notify) showToast('历史快照已保存');
      return true;
    } catch (_) {
      if (notify) showToast('历史保存失败，浏览器存储空间可能不足', 'warn');
      return false;
    }
  }

  function renderHistory() {
    const list = document.getElementById('history-list');
    const items = readHistory();
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="empty-history">暂无历史版本，点击下方按钮保存第一份快照。</div>';
      return;
    }
    items.forEach(function (item) {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = '<div class="history-content"><div class="history-meta"></div><div class="history-preview"></div></div><div class="history-actions"><button type="button" data-restore-history>恢复</button><button type="button" class="delete-history" data-delete-history>删除</button></div>';
      const date = new Date(item.createdAt);
      row.querySelector('.history-meta').textContent = (Number.isNaN(date.getTime()) ? '本地快照' : date.toLocaleString('zh-CN', { hour12: false })) + ' · ' + item.markdown.replace(/\s/g, '').length + ' 字';
      row.querySelector('.history-preview').textContent = item.markdown.replace(/\s+/g, ' ').slice(0, 100) || '空白草稿';
      row.querySelector('[data-restore-history]').dataset.restoreHistory = item.id;
      row.querySelector('[data-delete-history]').dataset.deleteHistory = item.id;
      list.appendChild(row);
    });
  }

  function openHistory() {
    closeFileMenu();
    renderHistory();
    document.getElementById('history-dialog').showModal();
  }

  function searchMatches() {
    const query = document.getElementById('search-input').value;
    if (!query) return [];
    const ignoreCase = document.getElementById('search-ignore-case').checked;
    const source = ignoreCase ? editor.value.toLowerCase() : editor.value;
    const needle = ignoreCase ? query.toLowerCase() : query;
    const matches = [];
    let from = 0;
    let index;
    while ((index = source.indexOf(needle, from)) !== -1) {
      matches.push({ start: index, end: index + query.length });
      from = index + query.length;
    }
    return matches;
  }

  function findNext() {
    const query = document.getElementById('search-input').value;
    const status = document.getElementById('search-status');
    if (!query) {
      status.textContent = '请先输入查找内容。';
      return false;
    }
    const matches = searchMatches();
    if (!matches.length) {
      status.textContent = '未找到“' + query + '”。';
      return false;
    }
    const index = matches.findIndex(function (match) { return match.start >= editor.selectionEnd; });
    const selectedIndex = index === -1 ? 0 : index;
    const match = matches[selectedIndex];
    editor.setSelectionRange(match.start, match.end);
    status.textContent = '第 ' + (selectedIndex + 1) + ' / ' + matches.length + ' 处匹配' + (index === -1 ? '（已回到开头）' : '');
    return true;
  }

  function replaceOne() {
    const query = document.getElementById('search-input').value;
    if (!query) {
      document.getElementById('search-status').textContent = '请先输入查找内容。';
      return;
    }
    const ignoreCase = document.getElementById('search-ignore-case').checked;
    const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    const equal = ignoreCase ? selected.toLowerCase() === query.toLowerCase() : selected === query;
    if (!equal && !findNext()) return;
    const replacement = document.getElementById('replace-input').value;
    const start = editor.selectionStart;
    editor.setRangeText(replacement, start, editor.selectionEnd, 'end');
    editor.setSelectionRange(start, start + replacement.length);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('search-status').textContent = '已替换 1 处，可继续查找或替换。';
  }

  function replaceAll() {
    const query = document.getElementById('search-input').value;
    if (!query) {
      document.getElementById('search-status').textContent = '请先输入查找内容。';
      return;
    }
    const matches = searchMatches();
    if (!matches.length) {
      document.getElementById('search-status').textContent = '未找到“' + query + '”。';
      return;
    }
    saveHistory(false);
    const replacement = document.getElementById('replace-input').value;
    const parts = [];
    let cursor = 0;
    matches.forEach(function (match) {
      parts.push(editor.value.slice(cursor, match.start), replacement);
      cursor = match.end;
    });
    parts.push(editor.value.slice(cursor));
    editor.value = parts.join('');
    editor.setSelectionRange(0, 0);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('search-status').textContent = '已替换全部 ' + matches.length + ' 处匹配。';
  }

  function openSearch() {
    const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    if (selected && selected.length <= 200 && !selected.includes('\n')) document.getElementById('search-input').value = selected;
    const dialog = document.getElementById('search-dialog');
    if (!dialog.open) dialog.showModal();
    setTimeout(function () { document.getElementById('search-input').focus(); document.getElementById('search-input').select(); }, 0);
  }

  function insertText(before, after, placeholder) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.slice(start, end) || placeholder || '';
    editor.setRangeText(before + selected + (after || ''), start, end, 'end');
    editor.focus();
    const contentStart = start + before.length;
    editor.setSelectionRange(contentStart, contentStart + selected.length);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertBlock(text) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const left = editor.value.slice(0, start);
    const prefix = left && !left.endsWith('\n\n') ? (left.endsWith('\n') ? '\n' : '\n\n') : '';
    const value = prefix + text + '\n\n';
    editor.setRangeText(value, start, end, 'end');
    editor.focus();
    editor.setSelectionRange(start + value.length, start + value.length);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function imageStatus(message, error) {
    const status = document.getElementById('image-local-status');
    status.textContent = message;
    status.classList.toggle('error', Boolean(error));
  }

  function openImageDialog() {
    imageSelection = { start: editor.selectionStart, end: editor.selectionEnd, value: editor.value };
    document.getElementById('image-url').value = '';
    imageStatus('仅在本机处理，也可拖入编辑区或粘贴截图。', false);
    document.getElementById('image-dialog').showModal();
  }

  function insertImageUrls(urls, selection, alt) {
    let start = selection.start;
    let end = selection.end;
    if (selection.value !== editor.value) {
      start = editor.selectionStart;
      end = editor.selectionEnd;
    }
    const description = String(alt || '图片').replace(/[\[\]\r\n]/g, '').trim() || '图片';
    const markdown = urls.map(function (url) { return `![${description}](${editorHighlighter.shortenImageUrl(url)})`; }).join('');
    const left = editor.value.slice(0, start);
    const prefix = left && !left.endsWith('\n\n') ? (left.endsWith('\n') ? '\n' : '\n\n') : '';
    const value = prefix + markdown + '\n\n';
    saveHistory(false);
    editor.setRangeText(value, start, end, 'end');
    editor.focus();
    editor.setSelectionRange(start + value.length, start + value.length);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function readImage(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        if (typeof reader.result === 'string' && /^data:image\/(?:png|gif|jpe?g|webp);base64,/i.test(reader.result)) resolve(reader.result);
        else reject(new Error('无法读取图片数据'));
      };
      reader.onerror = function () { reject(new Error('图片读取失败，请重试')); };
      reader.onabort = function () { reject(new Error('图片读取已取消')); };
      reader.readAsDataURL(file);
    });
  }

  async function insertLocalImages(files, selection, alt) {
    const images = Array.from(files || []).filter(function (file) { return /^image\//i.test(file.type); });
    if (!images.length) {
      showToast('请选择图片文件', 'warn');
      return;
    }
    const invalid = images.find(function (file) {
      return !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024;
    });
    if (invalid) {
      showToast('仅支持 JPG、PNG、GIF、WebP，每张不超过 5MB', 'warn');
      imageStatus('图片格式或大小不符合要求。', true);
      return;
    }
    if (processingImages) {
      showToast('图片正在读取，请稍候', 'info');
      return;
    }
    processingImages = true;
    document.getElementById('btn-insert-image').disabled = true;
    document.getElementById('btn-select-image').disabled = true;
    imageStatus('正在读取 ' + images.length + ' 张图片...', false);
    try {
      const dataUrls = await Promise.all(images.map(readImage));
      insertImageUrls(dataUrls, selection, alt);
      imageStatus('图片已插入并保存在当前浏览器。', false);
      showToast('图片已插入，本地预览已更新');
      const dialog = document.getElementById('image-dialog');
      if (dialog.open) dialog.close();
    } catch (error) {
      const message = error.message || '图片读取失败，请重试';
      imageStatus(message, true);
      showToast(message, 'warn');
    } finally {
      processingImages = false;
      document.getElementById('btn-insert-image').disabled = false;
      document.getElementById('btn-select-image').disabled = false;
      document.getElementById('image-file-input').value = '';
    }
  }

  function insertSnippet(name) {
    const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    if (name === 'h2') insertBlock('## ' + (selected || '二级标题'));
    else if (name === 'h3') insertBlock('### ' + (selected || '三级标题'));
    else if (name === 'bold') insertText('**', '**', '重点内容');
    else if (name === 'inline-code') insertText('`', '`', 'code');
    else if (name === 'link') insertText('[', '](https://example.com)', selected || '链接名称');
    else if (name === 'quote') insertBlock((selected || '引用内容').split('\n').map(function (line) { return '> ' + line; }).join('\n'));
    else if (name.startsWith('alert-')) {
      const type = name.slice(6).toUpperCase();
      const title = type === 'SPEAKER' ? ' 嘉宾议题标题' : '';
      const body = selected || (type === 'SPEAKER' ? '- 嘉宾：姓名\n- 头衔：职位\n- 时间：14:00 - 14:45\n\n议题内容简介。' : '在这里输入提示内容。');
      insertBlock('> [!' + type + ']' + title + '\n' + body.split('\n').map(function (line) { return '> ' + line; }).join('\n'));
    }
    else if (name === 'codeblock') insertBlock('```javascript\n' + (selected || 'console.log(\'Hello, WeChat!\');') + '\n```');
    else if (name === 'table') insertBlock('| 项目 | 说明 |\n| :--- | :--- |\n| 第一项 | 在这里填写内容 |\n| 第二项 | 在这里填写内容 |');
    else if (name === 'hr') insertBlock('---');
    closeQuoteMenu();
  }

  function closeQuoteMenu() {
    document.getElementById('quote-menu-panel').hidden = true;
    document.getElementById('quote-menu-trigger').setAttribute('aria-expanded', 'false');
  }

  async function copyArticle() {
    if (!editor.value.trim()) {
      showToast('请先输入需要复制的 Markdown 内容', 'warn');
      editor.focus();
      return;
    }
    render();
    const html = output.innerHTML;
    const plain = output.innerText;
    try {
      if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
      } else {
        const container = document.createElement('div');
        container.contentEditable = 'true';
        container.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        container.innerHTML = html;
        document.body.appendChild(container);
        const range = document.createRange();
        range.selectNodeContents(container);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const copied = document.execCommand('copy');
        selection.removeAllRanges();
        container.remove();
        if (!copied) throw new Error('copy rejected');
      }
      const button = document.getElementById('btn-copy-wx');
      button.textContent = '✓ 已复制，可粘贴到公众号';
      button.classList.add('copied');
      showToast('富文本已复制，请前往公众号后台粘贴');
      setTimeout(function () {
        button.textContent = '📋 一键复制到公众号';
        button.classList.remove('copied');
      }, 2400);
    } catch (_) {
      showToast('浏览器未允许复制，请使用 HTTPS 访问或授权剪贴板权限', 'warn');
    }
  }

  const savedMarkdown = readState();
  editorHighlighter.setValue(savedMarkdown === null ? window.WeChatSamples['basic-guide'].content : savedMarkdown);
  Object.keys(optionIds).forEach(function (id) {
    const input = document.getElementById(id);
    input.checked = Boolean(state[optionIds[id]]);
    input.addEventListener('change', function () {
      state[optionIds[id]] = input.checked;
      scheduleRender();
      saveState();
    });
  });
  document.getElementById('toggle-sync-scroll').checked = state.syncScroll;
  codeThemeSelect.value = state.codeTheme;
  updateLayoutForm();
  updateTheme();
  render();

  editor.addEventListener('input', function () {
    scheduleRender();
    saveState();
  });
  editor.addEventListener('keydown', function (event) {
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (event.key === 'Tab') {
      event.preventDefault();
      insertText('  ', '', '');
    } else if (modifier && event.key === 'Enter') {
      event.preventDefault();
      copyArticle();
    } else if (modifier && key === 'b') {
      event.preventDefault();
      insertText('**', '**', '重点内容');
    } else if (modifier && key === 'i') {
      event.preventDefault();
      insertText('*', '*', '斜体内容');
    } else if (modifier && key === 'k') {
      event.preventDefault();
      insertText('[', '](https://example.com)', '链接名称');
    }
  });
  codeThemeSelect.addEventListener('change', function () {
    state.codeTheme = codeThemeSelect.value;
    render();
    saveState();
  });
  themeSelect.addEventListener('change', function () {
    state.themeId = themeSelect.value;
    updateTheme();
    render();
    saveState();
  });
  sampleSelect.addEventListener('change', function () {
    const sample = window.WeChatSamples[sampleSelect.value];
    if (!sample) return;
    saveHistory(false);
    editorHighlighter.setValue(sample.content);
    state.themeId = sample.theme;
    updateTheme();
    render();
    saveState();
    editor.scrollTop = 0;
    preview.scrollTop = 0;
    showToast('示例模板已载入', 'info');
  });
  document.getElementById('btn-layout-settings').addEventListener('click', function () {
    const dialog = document.getElementById('layout-dialog');
    closeQuoteMenu();
    closeFileMenu();
    updateLayoutForm();
    document.body.classList.add('layout-drawer-open');
    if (!dialog.open) dialog.show();
    equalizeToolbarHeight();
    setTimeout(equalizeToolbarHeight, 240);
  });
  document.getElementById('layout-dialog').addEventListener('close', function () {
    document.body.classList.remove('layout-drawer-open');
    equalizeToolbarHeight();
    setTimeout(equalizeToolbarHeight, 240);
  });
  Object.keys(layoutControlIds).forEach(function (key) {
    const input = document.getElementById(layoutControlIds[key]);
    const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(eventName, function () {
      if (input.type === 'number' && input.value === '') return;
      const value = input.type === 'checkbox' ? input.checked : input.value;
      setLayoutValue(key, value);
      if (key === 'accentColor') updateLayoutForm();
    });
  });
  document.querySelectorAll('[data-accent]').forEach(function (button) {
    button.addEventListener('click', function () {
      setLayoutValue('accentColor', button.dataset.accent);
      updateLayoutForm();
    });
  });
  document.getElementById('btn-reset-layout').addEventListener('click', function () {
    state.layout = {};
    updateLayoutForm();
    updateTheme();
    render();
    saveState();
    showToast('已恢复当前主题的默认排版', 'info');
  });
  function currentImageSelection() {
    return { start: editor.selectionStart, end: editor.selectionEnd, value: editor.value };
  }

  function bindImageDrop(element, className, onFiles) {
    ['dragenter', 'dragover'].forEach(function (name) {
      element.addEventListener(name, function (event) {
        const items = Array.from(event.dataTransfer && event.dataTransfer.items || []);
        if (!items.some(function (item) { return item.kind === 'file' && /^image\//i.test(item.type); })) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        element.classList.add(className);
      });
    });
    element.addEventListener('dragleave', function (event) {
      if (!event.relatedTarget || !element.contains(event.relatedTarget)) element.classList.remove(className);
    });
    element.addEventListener('drop', function (event) {
      const files = Array.from(event.dataTransfer && event.dataTransfer.files || []).filter(function (file) { return /^image\//i.test(file.type); });
      if (!files.length) return;
      event.preventDefault();
      element.classList.remove(className);
      onFiles(files);
    });
  }

  const imageDialog = document.getElementById('image-dialog');
  const imageInput = document.getElementById('image-file-input');
  const imageDropZone = document.getElementById('image-drop-zone');
  document.getElementById('btn-insert-image').addEventListener('click', openImageDialog);
  document.getElementById('btn-select-image').addEventListener('click', function () { imageInput.click(); });
  imageDropZone.addEventListener('click', function (event) {
    if (!event.target.closest('button')) imageInput.click();
  });
  imageDropZone.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      imageInput.click();
    }
  });
  imageInput.addEventListener('change', function () {
    insertLocalImages(this.files, imageSelection, document.getElementById('image-alt').value);
  });
  document.getElementById('btn-insert-remote-image').addEventListener('click', function () {
    const url = document.getElementById('image-url').value.trim();
    if (!/^https?:\/\//i.test(url)) {
      imageStatus('在线图片地址需要以 http:// 或 https:// 开头。', true);
      return;
    }
    insertImageUrls([url], imageSelection, document.getElementById('image-alt').value);
    imageDialog.close();
    showToast('在线图片已插入');
  });
  document.getElementById('image-url').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('btn-insert-remote-image').click();
    }
  });
  editor.addEventListener('paste', function (event) {
    const files = Array.from(event.clipboardData && event.clipboardData.files || []).filter(function (file) { return /^image\//i.test(file.type); });
    if (!files.length) return;
    event.preventDefault();
    insertLocalImages(files, currentImageSelection(), '图片');
  });
  imageDialog.addEventListener('paste', function (event) {
    const files = Array.from(event.clipboardData && event.clipboardData.files || []).filter(function (file) { return /^image\//i.test(file.type); });
    if (!files.length) return;
    event.preventDefault();
    insertLocalImages(files, imageSelection, document.getElementById('image-alt').value);
  });
  bindImageDrop(document.querySelector('.editor-shell'), 'image-drag-active', function (files) {
    editor.focus();
    insertLocalImages(files, currentImageSelection(), '图片');
  });
  bindImageDrop(imageDropZone, 'drag-active', function (files) {
    insertLocalImages(files, imageSelection, document.getElementById('image-alt').value);
  });
  document.querySelectorAll('[data-snippet]').forEach(function (button) {
    button.addEventListener('click', function () { insertSnippet(button.dataset.snippet); });
  });
  document.getElementById('quote-menu-trigger').addEventListener('click', function () {
    closeFileMenu();
    const panel = document.getElementById('quote-menu-panel');
    panel.hidden = !panel.hidden;
    this.setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.getElementById('file-menu-trigger').addEventListener('click', function () {
    closeQuoteMenu();
    const panel = document.getElementById('file-menu-panel');
    panel.hidden = !panel.hidden;
    this.setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.getElementById('btn-import-md').addEventListener('click', function () {
    document.getElementById('md-file-input').click();
  });
  document.getElementById('md-file-input').addEventListener('change', async function () {
    try { await importMarkdown(this.files[0]); } finally { this.value = ''; closeFileMenu(); }
  });
  document.getElementById('btn-export-md').addEventListener('click', exportMarkdown);
  document.getElementById('btn-history').addEventListener('click', openHistory);
  document.getElementById('btn-save-history').addEventListener('click', function () {
    if (saveHistory(true)) renderHistory();
  });
  document.getElementById('history-list').addEventListener('click', function (event) {
    const restore = event.target.closest('[data-restore-history]');
    const remove = event.target.closest('[data-delete-history]');
    if (restore) {
      const item = readHistory().find(function (entry) { return entry.id === restore.dataset.restoreHistory; });
      if (!item) return;
      saveHistory(false);
      editorHighlighter.setValue(item.markdown);
      if (window.WeChatThemes[item.themeId]) state.themeId = item.themeId;
      updateTheme();
      render();
      saveState();
      document.getElementById('history-dialog').close();
      showToast('历史版本已恢复，原草稿已另存为快照');
    } else if (remove) {
      const items = readHistory().filter(function (entry) { return entry.id !== remove.dataset.deleteHistory; });
      try {
        localStorage.setItem(historyKey, JSON.stringify(items));
        renderHistory();
      } catch (_) {
        showToast('删除失败，请重试', 'warn');
      }
    }
  });
  document.querySelectorAll('[data-close-dialog]').forEach(function (button) {
    button.addEventListener('click', function () { document.getElementById(button.dataset.closeDialog).close(); });
  });
  document.getElementById('btn-search').addEventListener('click', openSearch);
  document.getElementById('btn-find-next').addEventListener('click', findNext);
  document.getElementById('btn-replace-one').addEventListener('click', replaceOne);
  document.getElementById('btn-replace-all').addEventListener('click', replaceAll);
  document.getElementById('search-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { event.preventDefault(); findNext(); }
  });
  document.getElementById('replace-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { event.preventDefault(); replaceOne(); }
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.quote-menu-wrap')) closeQuoteMenu();
    if (!event.target.closest('.file-menu-wrap')) closeFileMenu();
  });
  document.addEventListener('keydown', function (event) {
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (event.key === 'Escape') {
      closeQuoteMenu();
      closeFileMenu();
      const layoutDialog = document.getElementById('layout-dialog');
      if (layoutDialog.open && !document.querySelector('dialog:modal')) layoutDialog.close();
    }
    if (modifier && key === 'f') { event.preventDefault(); openSearch(); }
    if (modifier && key === 's') { event.preventDefault(); exportMarkdown(); }
  });
  document.getElementById('btn-clear-editor').addEventListener('click', function () {
    if (editor.value && !window.confirm('确定清空当前内容吗？此操作会同步清空本地草稿。')) return;
    saveHistory(false);
    editorHighlighter.setValue('');
    render();
    saveState();
    editor.focus();
  });
  document.getElementById('btn-copy-wx').addEventListener('click', copyArticle);
  document.getElementById('btn-toggle-darkmode').addEventListener('click', function () {
    const active = device.classList.toggle('wx-dark-mode');
    this.classList.toggle('active', active);
    this.setAttribute('aria-pressed', String(active));
    document.getElementById('dm-toggle-icon').textContent = active ? '☀️' : '🌙';
  });
  document.querySelectorAll('[data-view-btn]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-view-btn]').forEach(function (item) { item.classList.toggle('active', item === button); });
      device.classList.toggle('desktop-mode', button.dataset.viewBtn === 'desktop');
      device.classList.toggle('mobile-mode', button.dataset.viewBtn === 'mobile');
    });
  });
  document.getElementById('toggle-sync-scroll').addEventListener('change', function () {
    state.syncScroll = this.checked;
    saveState();
  });

  function equalizeToolbarHeight() {
    const toolbars = document.querySelectorAll('.pane-toolbar');
    toolbars.forEach(function (toolbar) { toolbar.style.minHeight = '0px'; });
    const height = Math.max.apply(null, Array.from(toolbars, function (toolbar) { return toolbar.offsetHeight; }));
    toolbars.forEach(function (toolbar) { toolbar.style.minHeight = height + 'px'; });
  }
  window.addEventListener('resize', equalizeToolbarHeight);
  equalizeToolbarHeight();

  function syncScroll(source, target) {
    if (!state.syncScroll || (scrollSource && scrollSource !== source)) return;
    scrollSource = source;
    clearTimeout(scrollTimer);
    const sourceRange = source.scrollHeight - source.clientHeight;
    const targetRange = target.scrollHeight - target.clientHeight;
    target.scrollTop = sourceRange > 0 ? (source.scrollTop / sourceRange) * Math.max(0, targetRange) : 0;
    scrollTimer = setTimeout(function () { scrollSource = null; }, 150);
  }
  editor.addEventListener('scroll', function () { syncScroll(editor, preview); });
  preview.addEventListener('scroll', function () { syncScroll(preview, editor); });
  setInterval(function () { saveHistory(false); }, 120000);
  window.addEventListener('beforeunload', function () {
    saveHistory(false);
    try { localStorage.setItem(storageKey, JSON.stringify({ markdown: editorHighlighter.getValue(), options: state })); } catch (_) {}
  });
})();
