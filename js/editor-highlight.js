(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function token(value, type) {
    return `<span class="md-token-${type}">${escapeHtml(value)}</span>`;
  }

  function highlightInline(source) {
    const pattern = /(`[^`\n]+`|!\[[^\]\n]*\]\([^)\n]*\)|\[[^\]\n]+\]\([^)\n]*\)|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|_[^_\n]+_|<\/?[A-Za-z][^>\n]*>|\{[^{}|\n]+\|[^{}|\n]+\})/g;
    let result = '';
    let cursor = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      result += escapeHtml(source.slice(cursor, match.index));
      const value = match[0];
      let type = 'text';
      if (value.startsWith('`')) type = 'code';
      else if (value.startsWith('![')) type = 'image';
      else if (value.startsWith('[')) type = 'link';
      else if (value.startsWith('**') || value.startsWith('__')) type = 'strong';
      else if (value.startsWith('~~')) type = 'strike';
      else if (value.startsWith('*') || value.startsWith('_')) type = 'emphasis';
      else if (value.startsWith('<')) type = 'html';
      else if (value.startsWith('{')) type = 'ruby';
      result += token(value, type);
      cursor = pattern.lastIndex;
    }
    return result + escapeHtml(source.slice(cursor));
  }

  function highlightLine(line, state) {
    const fence = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (state.fence) {
      if (fence && fence[1][0] === state.fence) {
        state.fence = '';
        return token(line, 'fence');
      }
      return token(line, 'code-line');
    }
    if (fence) {
      state.fence = fence[1][0];
      return token(line, 'fence');
    }
    if (!line) return '';
    const heading = line.match(/^(\s{0,3}#{1,4})(\s+)(.*)$/);
    if (heading) return token(heading[1], 'marker') + escapeHtml(heading[2]) + `<span class="md-token-heading">${highlightInline(heading[3])}</span>`;
    const quote = line.match(/^(\s{0,3}>\s?)(.*)$/);
    if (quote) return token(quote[1], 'marker') + `<span class="md-token-quote">${highlightInline(quote[2])}</span>`;
    if (/^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line)) return token(line, 'marker');
    const list = line.match(/^(\s*(?:[-+*]|\d+\.)\s+)(.*)$/);
    if (list) return token(list[1], 'list') + highlightInline(list[2]);
    if (/^\s*\[TOC\]\s*$/i.test(line)) return token(line, 'keyword');
    if (/^\s*\|/.test(line)) return line.split('|').map(highlightInline).join(token('|', 'table'));
    return highlightInline(line);
  }

  function highlightMarkdown(markdown) {
    const state = { fence: '' };
    return String(markdown || '').replace(/\r\n?/g, '\n').split('\n').map(function (line) {
      return highlightLine(line, state);
    }).join('\n') + '\n';
  }

  function mount(textarea) {
    const shell = document.createElement('div');
    const highlight = document.createElement('pre');
    const dataImagePattern = /(!\[[^\]\n]*\]\()data:image\/(?:png|gif|jpe?g|webp);base64,[a-z0-9+/=]+((?:\s+["'][^"']*["'])?\))/gi;
    const localImagePattern = /(!\[[^\]\n]*\]\()local-image:(\d+)((?:\s+["'][^"']*["'])?\))/g;
    let imageUrls = new Map();
    let imageTokens = new Map();
    let nextImageId = 1;
    shell.className = 'editor-shell';
    highlight.className = 'editor-highlight';
    highlight.setAttribute('aria-hidden', 'true');
    textarea.parentNode.insertBefore(shell, textarea);
    shell.appendChild(highlight);
    shell.appendChild(textarea);

    function imageToken(url, source) {
      let token = imageTokens.get(url);
      if (!token) {
        do { token = 'local-image:' + nextImageId++; } while (source.includes(token) || imageUrls.has(token));
        imageTokens.set(url, token);
        imageUrls.set(token, url);
      }
      return token;
    }

    function collapseImages(value) {
      const replacements = [];
      const displayValue = String(value).replace(dataImagePattern, function (match, prefix, suffix, offset) {
        const url = match.slice(prefix.length, match.length - suffix.length);
        const token = imageToken(url, String(value));
        const start = offset + prefix.length;
        replacements.push({ start: start, end: start + url.length, value: token });
        return prefix + token + suffix;
      });
      return { value: displayValue, replacements: replacements };
    }

    function expandImages(value) {
      return String(value).replace(localImagePattern, function (match, prefix, id, suffix) {
        const url = imageUrls.get('local-image:' + id);
        return url ? prefix + url + suffix : match;
      });
    }

    function displayOffset(offset, replacements) {
      let removed = 0;
      for (let i = 0; i < replacements.length; i += 1) {
        const replacement = replacements[i];
        if (offset <= replacement.start) break;
        if (offset < replacement.end) return replacement.start - removed + replacement.value.length;
        removed += replacement.end - replacement.start - replacement.value.length;
      }
      return offset - removed;
    }

    function update() {
      highlight.innerHTML = highlightMarkdown(textarea.value);
      syncScroll();
    }
    function syncScroll() {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
    textarea.addEventListener('input', function () {
      const result = collapseImages(textarea.value);
      if (!result.replacements.length) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const direction = textarea.selectionDirection;
      const scrollTop = textarea.scrollTop;
      const scrollLeft = textarea.scrollLeft;
      textarea.value = result.value;
      textarea.setSelectionRange(displayOffset(start, result.replacements), displayOffset(end, result.replacements), direction);
      textarea.scrollTop = scrollTop;
      textarea.scrollLeft = scrollLeft;
      update();
    });
    textarea.addEventListener('copy', function (event) {
      const selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
      const expanded = expandImages(selected);
      if (expanded === selected || !event.clipboardData) return;
      event.preventDefault();
      event.clipboardData.setData('text/plain', expanded);
    });
    textarea.addEventListener('scroll', syncScroll);
    update();
    return {
      update: update,
      getValue: function () { return expandImages(textarea.value); },
      setValue: function (value) {
        imageUrls = new Map();
        imageTokens = new Map();
        nextImageId = 1;
        textarea.value = collapseImages(value).value;
        update();
      },
      shortenImageUrl: function (url) {
        return /^data:image\/(?:png|gif|jpe?g|webp);base64,/i.test(url) ? imageToken(url, textarea.value) : url;
      }
    };
  }

  global.WeChatEditorHighlighter = { mount: mount, highlight: highlightMarkdown };
})(window);
