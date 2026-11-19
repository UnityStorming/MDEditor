(function (global) {
  'use strict';

  const alertTypes = {
    NOTE: { icon: 'ℹ️', title: '提示', color: '#2563eb', background: '#eff6ff', border: '#bfdbfe' },
    TIP: { icon: '💡', title: '技巧', color: '#047857', background: '#ecfdf5', border: '#a7f3d0' },
    IMPORTANT: { icon: '📌', title: '重要', color: '#6d28d9', background: '#f5f3ff', border: '#c4b5fd' },
    WARNING: { icon: '⚠️', title: '注意', color: '#b45309', background: '#fffbeb', border: '#fde68a' },
    CAUTION: { icon: '🚨', title: '警告', color: '#b91c1c', background: '#fef2f2', border: '#fecaca' },
    SPEAKER: { icon: '🎙️', title: '嘉宾与议题', color: '#c2410c', background: '#fff7ed', border: '#fdba74' }
  };

  const codeThemes = {
    'mac-dark': { tokens: { comment: '#a1a1aa', string: '#86efac', keyword: '#f87171', number: '#fb923c', method: '#60a5fa' } },
    github: { background: '#f6f8fa', header: '#eef1f4', text: '#24292f', border: '#d0d7de', number: '#57606a', tokens: { comment: '#6a737d', string: '#032f62', keyword: '#d73a49', number: '#005cc5', method: '#6f42c1' } },
    monokai: { background: '#272822', header: '#1e1f1c', text: '#f8f8f2', border: '#3e3d32', number: '#75715e', tokens: { comment: '#75715e', string: '#e6db74', keyword: '#f92672', number: '#ae81ff', method: '#66d9ef' } },
    'atom-one-dark': { background: '#282c34', header: '#21252b', text: '#abb2bf', border: '#3a3f4b', number: '#636d83', tokens: { comment: '#5c6370', string: '#98c379', keyword: '#c678dd', number: '#d19a66', method: '#61afef' } },
    'atom-one-light': { background: '#fafafa', header: '#f0f0f0', text: '#383a42', border: '#e5e5e6', number: '#9d9d9f', tokens: { comment: '#a0a1a7', string: '#50a14f', keyword: '#a626a4', number: '#986801', method: '#4078f2' } },
    wechat: { background: '#f7f7f7', header: '#ededed', text: '#333333', border: '#dddddd', number: '#999999', tokens: { comment: '#8e908c', string: '#183691', keyword: '#07c160', number: '#0086b3', method: '#795da3' } }
  };

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(value, image) {
    const url = String(value || '').trim();
    if (/^(https?:\/\/|mailto:)/i.test(url)) return escapeHtml(url);
    if (image && /^data:image\/(?:png|gif|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(url)) return url;
    if (!image && /^(#|\/(?!\/)|\.\/|\.\.\/)/.test(url)) return escapeHtml(url);
    return '';
  }

  function sanitizeInlineStyle(source) {
    const allowed = new Set(['display', 'text-align', 'color', 'background', 'background-color', 'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-decoration', 'text-decoration-line', 'text-decoration-color', 'text-transform', 'text-shadow', 'white-space', 'word-break', 'overflow-wrap', 'vertical-align', 'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-color', 'border-style', 'border-width', 'border-radius', 'box-sizing', 'overflow', 'overflow-x', 'overflow-y', 'float', 'clear']);
    const declarations = [];
    String(source || '').split(';').forEach(function (declaration) {
      const match = declaration.match(/^\s*([a-z-]+)\s*:\s*(.+?)\s*$/i);
      if (!match) return;
      const property = match[1].toLowerCase();
      const value = match[2];
      if (!allowed.has(property) || /expression|javascript|vbscript|url\s*\(|@import|behavior\s*:|-moz-binding|[<>\\]/i.test(value)) return;
      declarations.push(property + ':' + value + ';');
    });
    return declarations.join('');
  }

  function renderInline(source, context) {
    const fragments = [];
    let text = String(source || '');
    function stash(html) {
      const key = '\uE000' + fragments.length + '\uE001';
      fragments.push(html);
      return key;
    }

    text = text.replace(/\\([\\`*_{}\[\]()#+\-.!~>|])/g, function (_, character) {
      return stash(escapeHtml(character));
    });
    text = text.replace(/`([^`\n]+)`/g, function (_, code) {
      return stash(`<code style="${context.styles.codespan}">${escapeHtml(code.trim())}</code>`);
    });
    text = text.replace(/<a\s+id=(["'])([A-Za-z][A-Za-z0-9_.:-]*)\1\s*><\/a>/gi, function (_, quote, id) {
      return stash(`<a id="${id}"></a>`);
    });
    text = text.replace(/<(span|b|strong|i|em|u|s|del|mark|sub|sup|font)(?:\s+style=(["'])([\s\S]*?)\2)?>([\s\S]*?)<\/\1>/gi, function (_, tag, quote, style, content) {
      const safeStyle = sanitizeInlineStyle(style);
      return stash(`<${tag.toLowerCase()}${safeStyle ? ` style="${safeStyle}"` : ''}>${renderInline(content, context)}</${tag.toLowerCase()}>`);
    });
    text = text.replace(/<br\s*\/?\s*>/gi, function () {
      return stash('<br>');
    });
    text = text.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, function (_, words, reading) {
      return stash(`<ruby style="display:inline-ruby;text-align:center;">${renderInline(words, context)}<rt style="font-size:10px;line-height:1.2;color:${context.theme.accent};">${escapeHtml(reading)}</rt></ruby>`);
    });
    text = text.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g, function (_, alt, url) {
      const src = safeUrl(url, true);
      if (!src) return escapeHtml(alt);
      return stash(`<img src="${src}" alt="${escapeHtml(alt)}" style="${context.styles.img}">`);
    });
    text = text.replace(/\[([^\]]+)\]\(([^\n]*?)\)/g, function (_, label, target) {
      const content = renderInline(label, context);
      const link = target.match(/^((?:(?:https?:\/\/|mailto:)[^\s]+|#[^\s]+|\/(?!\/)[^\s]+|\.\.?\/[^\s]+))(?:\s+["'][^"']*["'])?$/);
      if (link) {
        const url = link[1];
        const href = safeUrl(url, false);
        if (!href) return content;
        if (context.options.linkToFootnote && /^https?:\/\//i.test(url)) {
          let index = context.footnotes.findIndex(function (item) { return item.url === url; });
          if (index === -1) {
            context.footnotes.push({ url: url, label: label.replace(/[*_`~]/g, '') });
            index = context.footnotes.length - 1;
          }
          return stash(`<span>${content}<sup style="${context.styles.footnoteSup}">[${index + 1}]</sup></span>`);
        }
        return stash(`<a href="${href}" style="${context.styles.link}">${content}</a>`);
      }
      const note = target.match(/^(.+?)\s+(["'])(.*?)\2$/);
      if (note && note[1].trim() && note[3].trim()) {
        let index = context.explanations.findIndex(function (item) { return item.title === note[3] && item.description === note[1]; });
        if (index === -1) {
          context.explanations.push({ title: note[3], description: note[1] });
          index = context.explanations.length - 1;
        }
        return stash(`<span>${content}<sup style="${context.styles.footnoteSup}">[${index + 1}]</sup></span>`);
      }
      return content;
    });
    text = text.replace(/<(https?:\/\/[^\s>]+)>/g, function (_, url) {
      const href = safeUrl(url, false);
      return stash(`<a href="${href}" style="${context.styles.link}">${escapeHtml(url)}</a>`);
    });

    text = escapeHtml(text);
    text = text.replace(/\*\*([^*\n]+)\*\*/g, `<strong style="${context.styles.strong}">$1</strong>`);
    text = text.replace(/__([^_\n]+)__/g, `<strong style="${context.styles.strong}">$1</strong>`);
    text = text.replace(/~~([^~\n]+)~~/g, `<del style="${context.styles.del}">$1</del>`);
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, `$1<em style="${context.styles.em}">$2</em>`);
    text = text.replace(/(^|[^_])_([^_\n]+)_/g, `$1<em style="${context.styles.em}">$2</em>`);
    text = text.replace(/\n/g, '<br>');
    for (let i = fragments.length - 1; i >= 0; i -= 1) {
      text = text.split('\uE000' + i + '\uE001').join(fragments[i]);
    }
    return text;
  }

  function highlightCode(code, language, colors) {
    if (/^diff$/i.test(language)) {
      return code.split('\n').map(function (line) {
        const color = line.startsWith('+') ? '#238636' : line.startsWith('-') ? '#da3633' : line.startsWith('@@') ? '#6f42c1' : colors.text;
        return `<span style="color:${color};">${escapeHtml(line)}</span>`;
      }).join('\n');
    }
    const scriptLanguages = /^(?:js|javascript|ts|typescript|jsx|tsx|java|c|cpp|cs|csharp|css|json|go|rust|php|dart|dockerfile|erlang|gradle|groovy|haskell|kotlin|lisp|lua|makefile|markdown|matlab|objectivec|perl|r|ruby|scala|shell|sql|swift|tex|verilog|vhdl|xml|yaml)$/i.test(language);
    const hashComments = /^(?:py|python|sh|bash|shell|yaml|yml|toml|ruby|rb|perl|r|makefile|dockerfile)$/i.test(language);
    const comments = hashComments ? '#[^\\n]*' : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/';
    const keywords = 'async|await|break|case|catch|class|const|continue|def|default|delete|do|else|elif|elsif|end|enum|export|extends|false|finally|fn|for|from|func|function|if|implements|import|in|include|instanceof|interface|let|match|module|namespace|new|null|of|package|private|protected|public|readonly|require|return|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|with|yield|select|insert|update|create|drop|alter|join|union|values|into|set|as|and|or|not';
    const expression = new RegExp('(' + comments + '|<!--[\\s\\S]*?-->)|("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`)|\\b(' + keywords + ')\\b|\\b(0x[\\da-f]+|\\d+(?:\\.\\d+)?)\\b|([A-Za-z_$][\\w$]*)(?=\\s*\\()', 'gim');
    const tokenColors = colors.tokens || codeThemes['mac-dark'].tokens;
    let result = '';
    let cursor = 0;
    let match;
    while ((match = expression.exec(code)) !== null) {
      result += escapeHtml(code.slice(cursor, match.index));
      const kind = match[1] ? 'comment' : match[2] ? 'string' : match[3] ? 'keyword' : match[4] ? 'number' : 'method';
      const color = scriptLanguages || hashComments || kind === 'comment' || kind === 'string' ? tokenColors[kind] : colors.text;
      result += `<span style="color:${color};">${escapeHtml(match[0])}</span>`;
      cursor = match.index + match[0].length;
    }
    return result + escapeHtml(code.slice(cursor));
  }

  function renderCode(code, language, context) {
    const styles = context.styles;
    const selected = codeThemes[context.options.codeTheme] || codeThemes['mac-dark'];
    const colors = { text: selected.text || (context.theme.plain ? '#1f2328' : '#e4e4e7'), tokens: selected.tokens };
    let wrapperStyle = styles.codeWrapper;
    let headerStyle = styles.codeHeader;
    let codeStyle = styles.codeBlock;
    if (selected.background) {
      wrapperStyle += `background-color:${selected.background};border-color:${selected.border};`;
      headerStyle += `background-color:${selected.header};border-bottom-color:${selected.border};color:${selected.text};`;
      codeStyle += `color:${selected.text};`;
    }
    if (context.options.codeScroll) codeStyle = codeStyle.replace('white-space:pre-wrap;', 'white-space:pre;').replace('word-break:break-word;', 'word-break:normal;').replace('overflow-wrap:break-word;', 'overflow-wrap:normal;');
    let highlighted = highlightCode(code, language, colors);
    if (context.options.codeLineNumbers) {
      highlighted = highlighted.split('\n').map(function (line, index) {
        return `<span style="display:block;"><span style="display:inline-block;min-width:28px;margin-right:12px;color:${selected.number || '#6e7681'};text-align:right;user-select:none;">${index + 1}</span>${line || ' '}</span>`;
      }).join('');
    }
    const header = context.options.macCodeBlock ? `<section style="${headerStyle}"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#ff5f57;"></span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#febc2e;"></span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#28c840;"></span></span><span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(language || 'TEXT')}</span></section>` : '';
    return `<section style="${wrapperStyle}">${header}<code style="${codeStyle}">${highlighted}</code></section>`;
  }

  function splitTableRow(line) {
    const cells = [];
    let current = '';
    let escaped = false;
    let value = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    for (const character of value) {
      if (escaped) {
        current += character === '|' ? '|' : '\\' + character;
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '|') {
        cells.push(current.trim());
        current = '';
      } else {
        current += character;
      }
    }
    if (escaped) current += '\\';
    cells.push(current.trim());
    return cells;
  }

  function tableAlignment(line) {
    return splitTableRow(line).map(function (cell) {
      if (!/^:?-+:?$/.test(cell.replace(/\s/g, ''))) return null;
      const value = cell.replace(/\s/g, '');
      return value.startsWith(':') && value.endsWith(':') ? 'center' : value.endsWith(':') ? 'right' : 'left';
    });
  }

  function renderTable(lines, context) {
    const headers = splitTableRow(lines[0]);
    const aligns = tableAlignment(lines[1]);
    const styles = context.styles;
    let html = `<section style="${styles.tableWrap}"><table style="${styles.table}"><thead><tr>`;
    headers.forEach(function (cell, index) {
      html += `<th style="${styles.th}text-align:${aligns[index] || 'left'};">${renderInline(cell, context)}</th>`;
    });
    html += '</tr></thead><tbody>';
    lines.slice(2).forEach(function (line, rowIndex) {
      const cells = splitTableRow(line);
      html += `<tr${rowIndex % 2 ? ` style="${styles.trEven}"` : ''}>`;
      headers.forEach(function (_, index) {
        html += `<td style="${styles.td}text-align:${aligns[index] || 'left'};">${renderInline(cells[index] || '', context)}</td>`;
      });
      html += '</tr>';
    });
    return html + '</tbody></table></section>';
  }

  function clearBottomMargin(block) {
    const cleared = block.replace(/^<[^>]+>/, function (tag) {
      return tag.replace(/margin:([^;>]+);/, function (_, margin) {
        const values = margin.trim().split(/\s+/);
        const top = values[0];
        const horizontal = values[1] || values[0];
        const left = values[3] || horizontal;
        return `margin:${top} ${horizontal} 0 ${left};`;
      });
    });
    if (/^<(?:ul|ol)\b/.test(cleared)) {
      const lastItem = cleared.lastIndexOf('<li ');
      return cleared.slice(0, lastItem) + clearBottomMargin(cleared.slice(lastItem));
    }
    return cleared;
  }

  function renderAlert(type, customTitle, body, context) {
    const config = alertTypes[type];
    const title = customTitle || config.title;
    const hasBody = Boolean(body.trim());
    const content = hasBody ? parseBlocks(body, context, true) : '';
    const titleMargin = hasBody ? '0 0 8px' : '0';
    return `<section style="margin:20px 0;padding:14px 16px;background-color:${config.background};border:1px solid ${config.border};border-left:4px solid ${config.color};border-radius:8px;box-sizing:border-box;"><p style="margin:${titleMargin};font-size:14px;font-weight:700;line-height:1.6;color:${config.color};">${config.icon} ${renderInline(title, context)}</p>${content}</section>`;
  }

  function parseSlideshow(line) {
    const source = line.trim();
    if (!source.startsWith('<![') || !source.endsWith(')>')) return null;
    const content = source.slice(1, -1);
    const pattern = /!\[([^\]]*)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g;
    const images = [];
    let cursor = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const separator = content.slice(cursor, match.index).trim();
      if (separator !== (images.length ? ',' : '')) return null;
      const url = safeUrl(match[2], true);
      if (!url) return null;
      images.push({ alt: match[1], url: url });
      cursor = pattern.lastIndex;
    }
    if (!images.length || content.slice(cursor).trim()) return null;
    return images;
  }

  function renderSlideshow(images, context) {
    let html = `<section role="group" aria-label="横屏滑动幻灯片，共 ${images.length} 张图片" style="margin:20px 0;width:100%;box-sizing:border-box;overflow-x:auto;white-space:nowrap;font-size:0;line-height:0;text-align:left;-webkit-overflow-scrolling:touch;">`;
    images.forEach(function (image) {
      html += `<section style="display:inline-block;width:100%;box-sizing:border-box;vertical-align:top;white-space:normal;"><img src="${image.url}" alt="${escapeHtml(image.alt)}" style="${context.styles.img}width:100%;height:auto;margin:0;"></section>`;
    });
    return html + '</section>';
  }

  function parseImageRow(line) {
    const source = line.trim();
    const pattern = /!\[([^\]]*)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g;
    const images = [];
    let cursor = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      if (source.slice(cursor, match.index).trim()) return null;
      const url = safeUrl(match[2], true);
      if (!url) return null;
      images.push({ alt: match[1], url: url });
      cursor = pattern.lastIndex;
    }
    if (images.length !== 3 || source.slice(cursor).trim()) return null;
    return images;
  }

  function renderImageRow(images, context) {
    let html = `<section role="group" aria-label="三图并排" style="${context.styles.imgWrap}width:100%;box-sizing:border-box;font-size:0;line-height:0;white-space:nowrap;">`;
    images.forEach(function (image) {
      html += `<section style="display:inline-block;width:33.333333%;box-sizing:border-box;padding:0 4px;vertical-align:top;"><img src="${image.url}" alt="${escapeHtml(image.alt)}" style="${context.styles.img}width:100%;height:auto;margin:0;"></section>`;
    });
    return html + '</section>';
  }

  function renderToc(context) {
    if (!context.toc.length) return '';
    const items = context.toc.map(function (item) {
      return `<li style="${context.styles.li}margin-left:${item.level === 3 ? '18px' : '0'};list-style:none;"><a href="#${item.id}" style="${context.styles.link}">${escapeHtml(item.title)}</a></li>`;
    }).join('');
    return `<section style="${context.styles.footnotesSection}margin-top:20px;padding:14px 16px;background-color:${context.theme.soft};border:1px solid ${context.theme.border};border-radius:8px;"><p style="${context.styles.footnotesTitle}">📑 目录</p><ul style="${context.styles.ul}margin-bottom:0;padding-left:0;list-style:none;">${items}</ul></section>`;
  }

  function isBlockStart(lines, index) {
    const line = lines[index];
    if (!line || !line.trim()) return true;
    if (parseSlideshow(line) || parseImageRow(line) || /^\[TOC\]$/i.test(line.trim())) return true;
    if (/^ {0,3}(`{3,}|~{3,})/.test(line) || /^ {0,3}#{1,4}\s+/.test(line) || /^ {0,3}>/.test(line) || /^ {0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line)) return true;
    if (/^\s*(?:[-+*]|\d+\.)\s+/.test(line)) return true;
    return index + 1 < lines.length && line.includes('|') && tableAlignment(lines[index + 1]).every(function (item) { return item !== null; });
  }

  function parseBlocks(markdown, context, compact) {
    const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let i = 0;
    let h2Index = 0;
    while (i < lines.length) {
      if (!lines[i].trim()) { i += 1; continue; }
      if (/^\[TOC\]$/i.test(lines[i].trim())) {
        html.push('<section data-wechat-toc></section>');
        i += 1;
        continue;
      }
      const slideshow = parseSlideshow(lines[i]);
      if (slideshow) {
        html.push(renderSlideshow(slideshow, context));
        i += 1;
        continue;
      }
      const imageRow = parseImageRow(lines[i]);
      if (imageRow) {
        html.push(renderImageRow(imageRow, context));
        i += 1;
        continue;
      }
      const fence = lines[i].match(/^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/);
      if (fence) {
        const marker = fence[1][0].repeat(3);
        const code = [];
        i += 1;
        while (i < lines.length && !new RegExp('^ {0,3}\\' + marker + '+\\s*$').test(lines[i])) {
          code.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        html.push(renderCode(code.join('\n'), fence[2], context));
        continue;
      }
      const heading = lines[i].match(/^ {0,3}(#{1,4})\s+(.+?)\s*#*\s*$/);
      if (heading) {
        const level = heading[1].length;
        const content = renderInline(heading[2], context);
        let anchor = '';
        if (level === 2 || level === 3) {
          const id = 'section-' + (++context.headingCount);
          context.toc.push({ level: level, id: id, title: heading[2].replace(/<[^>]+>/g, '').replace(/[*_`~]/g, '').trim() });
          anchor = ` id="${id}"`;
        }
        if (level === 2) {
          h2Index += 1;
          const center = context.theme.pill || context.options.h2Center;
          const number = context.options.h2Numbering ? `<span style="${context.styles.h2Num}">${String(h2Index).padStart(2, '0')}${context.theme.pill ? ' · ' : context.theme.plain ? '. ' : ''}</span>` : '';
          const inner = context.theme.pill ? `<span style="${context.styles.h2Inner}">${number}${content}</span>` : number + content;
          html.push(`<h2${anchor} style="${center ? context.styles.h2Center : context.styles.h2Left}">${inner}</h2>`);
        } else {
          html.push(`<h${level}${anchor} style="${context.styles['h' + level]}">${content}</h${level}>`);
        }
        i += 1;
        continue;
      }
      if (/^ {0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(lines[i])) {
        html.push(`<hr style="${context.styles.hr}">`);
        i += 1;
        continue;
      }
      if (/^ {0,3}>/.test(lines[i])) {
        const quote = [];
        while (i < lines.length && /^ {0,3}>/.test(lines[i])) {
          quote.push(lines[i].replace(/^ {0,3}> ?/, ''));
          i += 1;
        }
        const alert = quote[0] && quote[0].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|SPEAKER)\]\s*(.*)$/i);
        if (alert) {
          html.push(renderAlert(alert[1].toUpperCase(), alert[2], quote.slice(1).join('\n'), context));
        } else {
          html.push(`<blockquote style="${context.styles.blockquote}">${parseBlocks(quote.join('\n'), context, true)}</blockquote>`);
        }
        continue;
      }
      if (i + 1 < lines.length && lines[i].includes('|')) {
        const aligns = tableAlignment(lines[i + 1]);
        if (aligns.length && aligns.every(function (item) { return item !== null; })) {
          const table = [lines[i], lines[i + 1]];
          i += 2;
          while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
            table.push(lines[i]);
            i += 1;
          }
          html.push(renderTable(table, context));
          continue;
        }
      }
      const listItem = lines[i].match(/^\s*([-+*]|\d+\.)\s+(.*)$/);
      if (listItem) {
        const ordered = /\d/.test(listItem[1]);
        const items = [];
        while (i < lines.length) {
          const match = lines[i].match(/^\s*([-+*]|\d+\.)\s+(.*)$/);
          if (!match || /\d/.test(match[1]) !== ordered) break;
          let content = match[2];
          i += 1;
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*(?:[-+*]|\d+\.)\s+/.test(lines[i])) {
            content += ' ' + lines[i].trim();
            i += 1;
          }
          items.push(content);
        }
        const tag = ordered ? 'ol' : 'ul';
        const allTasks = !ordered && items.every(function (item) { return /^\[[ xX]\]\s+/.test(item); });
        const listStyle = context.styles[tag] + (allTasks ? 'list-style:none;padding-left:4px;' : '');
        let list = `<${tag} style="${listStyle}">`;
        items.forEach(function (item) {
          const task = item.match(/^\[([ xX])\]\s+(.*)$/);
          if (task) {
            const checked = task[1].toLowerCase() === 'x';
            list += `<li style="${context.styles.li}list-style:none;"><span style="color:${checked ? context.theme.accent : '#94a3b8'};margin-right:6px;">${checked ? '☑' : '☐'}</span>${renderInline(task[2], context)}</li>`;
          } else {
            list += `<li style="${context.styles.li}">${renderInline(item, context)}</li>`;
          }
        });
        html.push(list + `</${tag}>`);
        continue;
      }
      const image = lines[i].trim().match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)$/);
      if (image && safeUrl(image[2], true)) {
        html.push(`<figure style="${context.styles.imgWrap}"><img src="${safeUrl(image[2], true)}" alt="${escapeHtml(image[1])}" style="${context.styles.img}">${image[1] ? `<figcaption style="${context.styles.figcaption}">${renderInline(image[1], context)}</figcaption>` : ''}</figure>`);
        i += 1;
        continue;
      }
      const paragraph = [lines[i]];
      i += 1;
      while (i < lines.length && !isBlockStart(lines, i)) {
        paragraph.push(lines[i]);
        i += 1;
      }
      const paragraphStyle = compact ? context.styles.blockquoteP : context.styles.p;
      html.push(`<p style="${paragraphStyle}">${renderInline(paragraph.join('\n'), context)}</p>`);
    }
    if (compact && html.length) html[html.length - 1] = clearBottomMargin(html[html.length - 1]);
    return html.join('');
  }

  function convert(markdown, options) {
    const settings = Object.assign({ themeId: 'editorial-sspai', codeTheme: 'mac-dark', linkToFootnote: true, macCodeBlock: true, h2Numbering: true, h2Center: false, codeScroll: false, codeLineNumbers: false, layout: {} }, options || {});
    const theme = global.WeChatThemeResolver.resolve(settings.themeId, settings.layout);
    const context = { options: settings, theme: theme, styles: theme.styles, footnotes: [], explanations: [], toc: [], headingCount: 0 };
    const body = parseBlocks(String(markdown || '').replace(/^\uFEFF/, ''), context).split('<section data-wechat-toc></section>').join(renderToc(context));
    let references = '';
    if (settings.linkToFootnote && context.footnotes.length) {
      references = `<section style="${theme.styles.footnotesSection}"><h4 style="${theme.styles.footnotesTitle}">参考资料与相关链接</h4>`;
      context.footnotes.forEach(function (item, index) {
        references += `<p style="${theme.styles.footnoteItem}">[${index + 1}] ${escapeHtml(item.label)}：<a href="${safeUrl(item.url, false)}" style="${theme.styles.link}">${escapeHtml(item.url)}</a></p>`;
      });
      references += '</section>';
    }
    if (context.explanations.length) {
      references += `<section style="${theme.styles.footnotesSection}"><h4 style="${theme.styles.footnotesTitle}">脚注与注释</h4>`;
      context.explanations.forEach(function (item, index) {
        references += `<p style="${theme.styles.footnoteItem}">[${index + 1}] <strong>${escapeHtml(item.title)}</strong>：${escapeHtml(item.description)}</p>`;
      });
      references += '</section>';
    }
    return { html: `<section style="${theme.styles.article}">${body}${references}</section>`, footnotesCount: context.footnotes.length, explanationsCount: context.explanations.length };
  }

  const api = { convert: convert };
  global.WeChatConverter = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
