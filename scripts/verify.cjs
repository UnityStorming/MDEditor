// Browser checks use Playwright only for development; the editor has no runtime dependencies.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const base = process.env.TEST_URL || 'http://127.0.0.1:5173/wechat/';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [], externalRequests = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!request.url().startsWith(new URL(base).origin) && /^https?:/.test(request.url())) externalRequests.push(request.url());
  });
  async function check(name, action) {
    await action();
    checks.push(name);
    console.log('PASS ' + name);
  }
  const editor = page.locator('#md-editor');
  const output = page.locator('#wx-output');
  try {
    await page.goto(base);
    await page.waitForFunction(() => document.querySelector('#wx-output h1'));
    await check('default article and 10 themes', async () => {
      assert.equal(await page.locator('#theme-select option').count(), 10);
      assert.match(await output.innerText(), /欢迎使用微信公众号/);
    });
    await check('all article themes and 6 code themes', async () => {
      const themes = await page.locator('#theme-select option').evaluateAll(nodes => nodes.map(node => node.value));
      const styles = new Set();
      for (const theme of themes) {
        await page.selectOption('#theme-select', theme);
        styles.add(await page.locator('#wx-output h1').getAttribute('style'));
      }
      assert.equal(styles.size, 10);
      const codes = await page.locator('#code-theme-select option').evaluateAll(nodes => nodes.map(node => node.value));
      assert.equal(codes.length, 6);
      for (const code of codes) {
        await page.selectOption('#code-theme-select', code);
        assert.ok(await output.locator('section > code').count());
      }
    });
    await check('all 4 templates', async () => {
      const templates = await page.locator('#sample-select option').evaluateAll(nodes => nodes.map(node => node.value).filter(Boolean));
      assert.equal(templates.length, 4);
      for (const template of templates) {
        await page.selectOption('#sample-select', template);
        assert.ok((await editor.inputValue()).length > 100);
        assert.ok(await output.locator('h1').count());
      }
    });
    const markdown = '# 本地验证\n\n## 标题\n\n**重点** [文档](https://example.com)\n\n> [!TIP]\n> 提示内容\n\n```js\nconst answer = 42;\n```\n\n|名称|值|\n|---|---|\n|答案|42|';
    await check('live Markdown rendering, alerts, code and tables', async () => {
      await editor.fill(markdown);
      await page.waitForFunction(() => document.querySelector('#wx-output strong')?.textContent === '重点');
      assert.ok(await output.locator('table').count());
      assert.ok(await output.locator('section > code').count());
      assert.match(await output.innerText(), /提示内容/);
    });
    await check('heading numbering and link references', async () => {
      await page.check('#toggle-h2-number');
      await page.check('#toggle-footnote');
      await page.waitForFunction(() => document.querySelector('#wx-output h2')?.textContent.includes('01'));
      assert.match(await output.innerText(), /参考资料/);
      await page.uncheck('#toggle-h2-number');
      await page.uncheck('#toggle-footnote');
      await page.waitForFunction(() => document.querySelector('#wx-output h2')?.textContent.trim() === '标题');
      assert.equal(await output.locator('a[href="https://example.com"]').count(), 1);
    });
    await check('dark simulation and wide/mobile preview', async () => {
      await page.click('#btn-toggle-darkmode');
      assert.equal(await page.locator('#btn-toggle-darkmode').getAttribute('aria-pressed'), 'true');
      await page.click('[data-view-btn="desktop"]');
      assert.match(await page.locator('#preview-device-wrapper').getAttribute('class'), /desktop-mode/);
      await page.click('[data-view-btn="mobile"]');
      await page.click('#btn-toggle-darkmode');
    });
    await check('layout drawer applies color and font size', async () => {
      await page.click('#btn-layout-settings');
      await page.click('[data-accent="#2563eb"]');
      await page.fill('#layout-font-size', '18');
      await page.waitForFunction(() => document.querySelector('#wx-output p')?.style.fontSize === '18px');
      assert.equal(await page.locator('#active-theme-dot').evaluate(node => node.style.backgroundColor), 'rgb(37, 99, 235)');
      await page.click('#btn-reset-layout');
      await page.click('#layout-dialog [data-close-dialog="layout-dialog"]');
    });
    await check('search and replace changes source and preview', async () => {
      await page.click('#btn-search');
      await page.fill('#search-input', '重点');
      await page.fill('#replace-input', '替换完成');
      await page.click('#btn-replace-all');
      await page.click('#search-dialog [data-close-dialog="search-dialog"]');
      await page.waitForFunction(() => document.querySelector('#wx-output strong')?.textContent === '替换完成');
    });
    await check('autosave restores source and options after reload', async () => {
      await page.waitForFunction(() => document.querySelector('#save-status').textContent === '本地自动保存');
      const previous = await editor.inputValue();
      await page.reload();
      assert.equal(await editor.inputValue(), previous);
      assert.equal(await page.isChecked('#toggle-footnote'), false);
    });
    await check('history saves and restores draft', async () => {
      await page.click('#file-menu-trigger');
      await page.click('#btn-history');
      await page.click('#btn-save-history');
      await page.click('#history-dialog [data-close-dialog="history-dialog"]');
      await editor.fill('# 临时修改');
      await page.click('#file-menu-trigger');
      await page.click('#btn-history');
      await page.locator('[data-restore-history]').first().click();
      assert.match(await editor.inputValue(), /替换完成/);
    });
    await check('Markdown export contains source text', async () => {
      await page.click('#file-menu-trigger');
      const downloadPromise = page.waitForEvent('download');
      await page.click('#btn-export-md');
      const download = await downloadPromise;
      assert.ok(download.suggestedFilename().endsWith('.md'));
      assert.equal(await fs.readFile(await download.path(), 'utf8'), await editor.inputValue());
    });
    await check('Markdown import reads local file', async () => {
      await page.locator('#md-file-input').setInputFiles({ name: 'import.md', mimeType: 'text/markdown', buffer: Buffer.from('# 导入成功\n\n本机文件内容') });
      await page.waitForFunction(() => document.querySelector('#wx-output h1')?.textContent === '导入成功');
    });
    await check('local image is embedded without upload', async () => {
      await page.click('#btn-insert-image');
      await page.locator('#image-file-input').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGAAAAABJRU5ErkJggg==', 'base64') });
      await page.waitForFunction(() => document.querySelector('#wx-output img')?.src.startsWith('data:image/'));
      assert.match(await editor.inputValue(), /local-image:/);
    });
    await check('copy writes real HTML and plain text to clipboard', async () => {
      await page.click('#btn-copy-wx');
      await page.waitForFunction(() => document.querySelector('#btn-copy-wx').classList.contains('copied'));
      const clipboard = await page.evaluate(async () => {
        const items = await navigator.clipboard.read();
        const item = items[0];
        return { types: item.types, html: await (await item.getType('text/html')).text(), text: await (await item.getType('text/plain')).text() };
      });
      assert.ok(clipboard.types.includes('text/html'));
      assert.match(clipboard.html, /style=/);
      assert.match(clipboard.text, /导入成功/);
    });
    await check('clear editor and recover last history', async () => {
      page.once('dialog', dialog => dialog.accept());
      await page.click('#btn-clear-editor');
      assert.equal(await editor.inputValue(), '');
      await page.click('#file-menu-trigger');
      await page.click('#btn-history');
      await page.locator('[data-restore-history]').first().click();
      assert.match(await editor.inputValue(), /导入成功/);
    });
    await check('editing works with browser network disabled', async () => {
      await context.setOffline(true);
      await editor.fill('# 断网可用\n\n**本机排版**');
      await page.waitForFunction(() => document.querySelector('#wx-output strong')?.textContent === '本机排版');
      await context.setOffline(false);
    });
    await check('390 px mobile layout stays within viewport', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.selectOption('#sample-select', 'basic-guide');
      await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth);
      await page.screenshot({ path: path.join(__dirname, '../evidence/local-mobile.png'), fullPage: true });
    });
    await check('no script errors or external runtime requests', async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(externalRequests, []);
    });
    await fs.writeFile(path.join(__dirname, '../evidence/browser-verification.json'), JSON.stringify({ passed: checks.length, checks, errors, externalRequests, viewport: { desktop: '1440x1000', mobile: '390x844' } }, null, 2) + '\n');
    console.log(`${checks.length} browser checks passed.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
