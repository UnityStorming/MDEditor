(function (global) {
  'use strict';

  const definitions = {
    'editorial-sspai': { name: '数字生活·少数派风', category: 'editorial', accent: '#d93829', strong: '#b91c1c', text: '#27272a', heading: '#18181b', soft: '#f7f7f7', border: '#e5e5e5', code: '#18181b' },
    'editorial-latepost': { name: '商业深度·晚点风', category: 'editorial', accent: '#b45309', strong: '#92400e', text: '#262626', heading: '#171717', soft: '#fffbeb', border: '#d4d4d4', code: '#171717', serif: true },
    'essay-songyan': { name: '人文随笔·松烟墨', category: 'editorial', accent: '#2f5d50', strong: '#1b4332', text: '#262626', heading: '#1b4332', soft: '#f4f8f5', border: '#b7e4c7', code: '#1c1917', dashed: true },
    'dev-linear': { name: '极简科技·Linear 风', category: 'developer', accent: '#4f46e5', strong: '#3730a3', text: '#27272a', heading: '#09090b', soft: '#f5f5f7', border: '#e5e5e5', code: '#09090b' },
    'dev-tech-blue': { name: '开发者·极客蓝', category: 'developer', accent: '#2563eb', strong: '#1d4ed8', text: '#334155', heading: '#0f172a', soft: '#f0f7ff', border: '#dbeafe', code: '#0f172a', filled: true },
    'dev-wechat-green': { name: '开发者·开源绿', category: 'developer', accent: '#07c160', strong: '#047857', text: '#374151', heading: '#065f46', soft: '#ecfdf5', border: '#bbf7d0', code: '#18181b', filled: true },
    'meetup-vibrant': { name: 'Meetup·活力橙', category: 'meetup', accent: '#ea580c', strong: '#9a3412', text: '#292524', heading: '#9a3412', soft: '#fff7ed', border: '#fdba74', code: '#1c1917', pill: true, highlight: '#ffedd5' },
    'meetup-aurora': { name: 'Meetup·极光紫', category: 'meetup', accent: '#6d28d9', strong: '#5b21b6', text: '#1e1b4b', heading: '#4c1d95', soft: '#f5f3ff', border: '#c4b5fd', code: '#0f172a', pill: true, highlight: '#ede9fe' },
    'daily-festive-red': { name: '节日·喜庆红', category: 'daily', accent: '#dc2626', strong: '#991b1b', text: '#292524', heading: '#991b1b', soft: '#fef2f2', border: '#fca5a5', code: '#1c1917', pill: true, highlight: '#fee2e2', festive: true },
    'plain-github': { name: '极简·GitHub 原生', category: 'plain', accent: '#0969da', strong: '#1f2328', text: '#1f2328', heading: '#1f2328', soft: '#f6f8fa', border: '#d0d7de', code: '#f6f8fa', plain: true, leftOnly: true }
  };

  function buildStyles(t) {
    const line = t.dashed ? 'dashed' : 'solid';
    const codeText = t.plain ? '#1f2328' : '#e4e4e7';
    const codeHeader = t.plain ? '#57606a' : '#d4d4d8';
    const h2Base = `margin:30px 0 16px;font-size:18px;font-weight:700;line-height:1.5;color:${t.heading};letter-spacing:.4px;word-break:break-word;overflow-wrap:break-word;`;
    const h2Left = t.pill ? `${h2Base}text-align:center;` : t.filled ? `${h2Base}padding:8px 12px;text-align:left;background-color:${t.soft};border-left:4px solid ${t.accent};border-radius:0 6px 6px 0;` : `${h2Base}padding:0 0 9px;text-align:left;border-bottom:1px ${line} ${t.border};`;
    const h2Center = t.pill ? `${h2Base}text-align:center;` : `${h2Base}padding:9px 12px;text-align:center;background-color:${t.filled ? t.soft : 'transparent'};border-bottom:2px ${line} ${t.accent};border-radius:6px;`;
    const h2Num = t.pill ? `font-weight:800;color:${t.festive ? '#fef08a' : '#ffffff'};letter-spacing:.5px;` : t.plain ? `font-weight:600;color:#57606a;` : `display:inline-block;margin-right:9px;padding:2px 8px;font-size:12px;font-weight:700;line-height:1.45;color:#ffffff;background-color:${t.accent};border-radius:${t.category === 'editorial' ? '999px' : '4px'};vertical-align:1px;letter-spacing:.4px;`;
    const tableBorder = t.category === 'editorial' ? `border-top:2px solid ${t.heading};border-bottom:1px solid ${t.border};` : `border:1px solid ${t.border};`;
    return {
      article: `max-width:100%;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue','Microsoft YaHei',Arial,sans-serif;color:${t.text};background-color:#ffffff;font-size:15px;line-height:1.8;text-align:left;word-break:break-word;overflow-wrap:break-word;`,
      h1: t.pill ? `margin:20px 0 22px;padding:14px 18px;font-size:20px;font-weight:700;line-height:1.5;color:#ffffff;text-align:center;background-color:${t.accent};border-radius:10px;${t.festive ? `border-bottom:3px solid #f59e0b;` : ''}letter-spacing:.5px;` : `margin:26px 0 20px;padding:0 0 12px;font-size:21px;font-weight:700;line-height:1.5;color:${t.heading};border-bottom:${t.category === 'editorial' ? '2px' : '1px'} ${line} ${t.accent};text-align:${t.name.includes('松烟墨') ? 'center' : 'left'};letter-spacing:.4px;`,
      h2Left,
      h2Center,
      h2Inner: t.pill ? `display:inline-block;padding:6px 22px;font-size:16.5px;font-weight:700;line-height:1.5;color:#ffffff;background-color:${t.accent};border:${t.festive ? '1px solid #fbbf24' : '0'};border-radius:999px;letter-spacing:1px;text-align:center;` : '',
      h2Num,
      h3: `margin:22px 0 10px;padding-left:10px;font-size:16px;font-weight:700;line-height:1.5;color:${t.heading};border-left:3px solid ${t.accent};text-align:left;letter-spacing:.3px;`,
      h4: `margin:18px 0 8px;font-size:15px;font-weight:700;line-height:1.55;color:${t.heading};text-align:left;letter-spacing:.3px;`,
      p: `margin:0 0 16px;font-size:15px;line-height:${t.serif ? '1.9' : '1.85'};color:${t.text};text-align:${t.plain ? 'left' : 'justify'};letter-spacing:.4px;word-break:break-word;overflow-wrap:break-word;`,
      blockquote: `margin:20px 0;padding:14px 17px;background-color:${t.soft};border:1px solid ${t.border};border-left:4px solid ${t.accent};border-radius:${t.plain ? '0' : '8px'};color:${t.text};font-size:14px;line-height:1.8;text-align:left;`,
      blockquoteP: `margin:0 0 8px;font-size:14px;line-height:1.8;color:${t.text};text-align:left;letter-spacing:.3px;`,
      strong: `font-weight:700;color:${t.strong};${t.highlight ? `background-color:${t.highlight};padding:1px 4px;border-radius:3px;` : ''}`,
      em: `font-style:italic;color:${t.text};`,
      del: 'text-decoration:line-through;color:#71717a;',
      codespan: `font-size:13.5px;line-height:1.6;color:${t.strong};background-color:${t.soft};border:1px solid ${t.border};padding:2px 6px;margin:0 2px;border-radius:5px;word-break:break-word;`,
      link: `color:${t.accent};text-decoration:none;border-bottom:1px solid ${t.border};font-weight:500;word-break:break-word;`,
      footnoteSup: `font-size:12px;line-height:1.4;color:${t.accent};font-weight:700;margin-left:2px;`,
      ul: `margin:0 0 16px;padding-left:22px;color:${t.text};text-align:left;`,
      ol: `margin:0 0 16px;padding-left:22px;color:${t.text};text-align:left;`,
      li: `margin:6px 0;font-size:15px;line-height:1.8;color:${t.text};text-align:left;letter-spacing:.3px;`,
      hr: `margin:28px 0;border:none;border-top:1px ${line} ${t.border};`,
      tableWrap: 'margin:20px 0;width:100%;overflow-x:auto;text-align:left;',
      table: `width:100%;table-layout:fixed;border-collapse:collapse;font-size:13.5px;line-height:1.65;text-align:left;${tableBorder}`,
      th: `padding:10px 12px;background-color:${t.pill ? t.accent : t.soft};color:${t.pill ? '#ffffff' : t.heading};font-weight:700;text-align:left;border:1px solid ${t.border};word-break:break-word;`,
      td: `padding:9px 12px;border:1px solid ${t.border};color:${t.text};text-align:left;vertical-align:top;word-break:break-word;`,
      trEven: `background-color:${t.soft};`,
      imgWrap: 'margin:22px 0;text-align:center;',
      img: `max-width:100%;border-radius:8px;border:1px solid ${t.border};display:block;margin:0 auto;`,
      figcaption: 'margin-top:8px;font-size:13px;line-height:1.5;color:#71717a;text-align:center;',
      codeWrapper: `margin:18px 0;width:100%;box-sizing:border-box;background-color:${t.code};border-radius:9px;overflow-x:auto;border:1px solid ${t.plain ? t.border : t.code};text-align:left;`,
      codeHeader: `display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background-color:${t.plain ? '#eff1f3' : 'rgba(255,255,255,.06)'};border-bottom:1px solid ${t.plain ? t.border : '#3f3f46'};font-size:12px;line-height:1.5;color:${codeHeader};text-align:left;`,
      codeBlock: `display:block;margin:0;padding:14px 16px;overflow-x:auto;font-size:13px;line-height:1.65;color:${codeText};text-align:left;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;`,
      footnotesSection: `margin-top:32px;padding-top:16px;border-top:1px solid ${t.border};text-align:left;`,
      footnotesTitle: `margin:0 0 10px;font-size:14px;font-weight:700;line-height:1.5;color:${t.heading};text-align:left;`,
      footnoteItem: 'margin:4px 0;font-size:12.5px;line-height:1.65;color:#71717a;text-align:left;word-break:break-word;'
    };
  }

  const themes = {};
  Object.keys(definitions).forEach(function (id) {
    const definition = definitions[id];
    themes[id] = Object.assign({ id: id, accentColor: definition.accent, styles: buildStyles(definition) }, definition);
  });

  const fontFamilies = {
    system: "-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue','Microsoft YaHei',Arial,sans-serif",
    serif: "Georgia,'Times New Roman','Songti SC',SimSun,serif",
    monospace: "SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace"
  };
  const numberRanges = {
    fontSize: [13, 22],
    lineHeight: [1.4, 2.4],
    paragraphSpacing: [0, 40],
    contentPadding: [0, 40],
    letterSpacing: [0, 3],
    tableFontSize: [11, 20],
    codeFontSize: [10, 20],
    codeLineHeight: [1.3, 2.4]
  };

  function normalizeLayout(layout) {
    const source = layout && typeof layout === 'object' ? layout : {};
    const normalized = {};
    if (typeof source.accentColor === 'string' && /^#[\da-f]{6}$/i.test(source.accentColor)) normalized.accentColor = source.accentColor.toLowerCase();
    ['fontFamily', 'headingFont', 'blockquoteFont'].forEach(function (key) {
      if (fontFamilies[source[key]]) normalized[key] = source[key];
    });
    Object.keys(numberRanges).forEach(function (key) {
      if (source[key] === '' || source[key] === null || typeof source[key] === 'undefined') return;
      const value = Number(source[key]);
      if (!Number.isFinite(value)) return;
      normalized[key] = Math.min(numberRanges[key][1], Math.max(numberRanges[key][0], value));
    });
    if (typeof source.firstLineIndent === 'boolean') normalized.firstLineIndent = source.firstLineIndent;
    return normalized;
  }

  function layoutDefaults(id) {
    const theme = themes[id] || themes['editorial-sspai'];
    return {
      accentColor: theme.accent,
      fontFamily: 'theme',
      headingFont: 'theme',
      blockquoteFont: 'theme',
      fontSize: 15,
      lineHeight: theme.serif ? 1.9 : 1.85,
      paragraphSpacing: 16,
      contentPadding: 0,
      letterSpacing: 0.4,
      firstLineIndent: false,
      tableFontSize: 13.5,
      codeFontSize: 13,
      codeLineHeight: 1.65
    };
  }

  function setStyle(style, property, value) {
    const expression = new RegExp('(^|;)' + property + ':[^;]*;');
    const declaration = property + ':' + value + ';';
    return expression.test(style) ? style.replace(expression, '$1' + declaration) : style + declaration;
  }

  function resolve(id, layout) {
    const base = themes[id] || themes['editorial-sspai'];
    const settings = normalizeLayout(layout);
    const definition = Object.assign({}, base);
    if (settings.accentColor) definition.accent = settings.accentColor;
    const resolved = Object.assign({}, base, { accentColor: definition.accent, styles: buildStyles(definition) });
    const styles = resolved.styles;
    if (settings.fontFamily) styles.article = setStyle(styles.article, 'font-family', fontFamilies[settings.fontFamily]);
    if (settings.headingFont) {
      ['h1', 'h2Left', 'h2Center', 'h2Inner', 'h3', 'h4', 'footnotesTitle'].forEach(function (key) {
        styles[key] = setStyle(styles[key], 'font-family', fontFamilies[settings.headingFont]);
      });
    }
    if (settings.blockquoteFont) {
      styles.blockquote = setStyle(styles.blockquote, 'font-family', fontFamilies[settings.blockquoteFont]);
      styles.blockquoteP = setStyle(styles.blockquoteP, 'font-family', fontFamilies[settings.blockquoteFont]);
    }
    if (typeof settings.fontSize === 'number') {
      ['article', 'p', 'li'].forEach(function (key) { styles[key] = setStyle(styles[key], 'font-size', settings.fontSize + 'px'); });
    }
    if (typeof settings.lineHeight === 'number') {
      ['article', 'p', 'li'].forEach(function (key) { styles[key] = setStyle(styles[key], 'line-height', settings.lineHeight); });
    }
    if (typeof settings.paragraphSpacing === 'number') styles.p = setStyle(styles.p, 'margin', '0 0 ' + settings.paragraphSpacing + 'px');
    if (typeof settings.contentPadding === 'number') styles.article = setStyle(styles.article, 'padding', '0 ' + settings.contentPadding + 'px');
    if (typeof settings.letterSpacing === 'number') {
      styles.p = setStyle(styles.p, 'letter-spacing', settings.letterSpacing + 'px');
      styles.li = setStyle(styles.li, 'letter-spacing', settings.letterSpacing + 'px');
    }
    if (settings.firstLineIndent) styles.p = setStyle(styles.p, 'text-indent', '2em');
    if (typeof settings.tableFontSize === 'number') styles.table = setStyle(styles.table, 'font-size', settings.tableFontSize + 'px');
    if (typeof settings.codeFontSize === 'number') {
      styles.codeBlock = setStyle(styles.codeBlock, 'font-size', settings.codeFontSize + 'px');
      styles.codespan = setStyle(styles.codespan, 'font-size', settings.codeFontSize + 'px');
    }
    if (typeof settings.codeLineHeight === 'number') styles.codeBlock = setStyle(styles.codeBlock, 'line-height', settings.codeLineHeight);
    return resolved;
  }

  global.WeChatThemes = themes;
  global.WeChatThemeResolver = { resolve: resolve, normalizeLayout: normalizeLayout, defaults: layoutDefaults };
})(typeof window !== 'undefined' ? window : globalThis);
