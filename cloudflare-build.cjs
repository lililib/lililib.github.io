'use strict';

// 随 Hexo 产物发布。在 Cloudflare Pages 上运行，不重新生成文章。
const fs = require('node:fs');
const path = require('node:path');

const original = 'https://lililib.github.io';
const mirror = 'https://blog.getlearnbit.com';
const input = path.resolve(process.argv[2] || __dirname);
const output = path.resolve(process.argv[3] || path.join(input, 'cloudflare-public'));
const textExtensions = new Set(['.html', '.xml', '.json', '.js', '.css', '.txt', '.svg']);
const excluded = new Set(['.git', '.github', '.DS_Store', '.nojekyll', 'CNAME', 'cloudflare-build.cjs']);
const originPattern = /(?:https?:)?\/\/lililib\.github\.io(?=[/?#\s"'<>]|$)/g;

if (output === input || input.startsWith(output + path.sep)) {
  throw new Error('输出目录不能覆盖输入目录。');
}
for (const file of ['index.html', 'rss2.xml', '404.html']) {
  if (!fs.existsSync(path.join(input, file))) throw new Error(`输入目录缺少博客产物 ${file}`);
}

fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
let files = 0;
let pages = 0;

function copy(directory, relative = '') {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const from = path.join(directory, entry.name);
    if (from === output || excluded.has(entry.name)) continue;
    const name = path.join(relative, entry.name);
    const to = path.join(output, name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, {recursive: true});
      copy(from, name);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      // 搜索引擎仍以原站为主，sitemap 和 robots 与 canonical 保持一致。
      const seoFile = relative === '' && /^(robots\.txt|sitemap\.(xml|txt))$/.test(entry.name);
      if (!seoFile && textExtensions.has(ext)) {
        let content = fs.readFileSync(from, 'utf8').replace(originPattern, mirror);
        if (ext === '.html') {
          const urlPath = name.split(path.sep).join('/').replace(/(^|\/)index\.html$/, '$1');
          const canonical = new URL(urlPath, original + '/').href.replace(/&/g, '&amp;');
          // 覆盖已有 canonical，避免新旧域名互相竞争收录；不做浏览器跳转。
          content = content.replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>\s*/gi, '');
          if (name !== '404.html') {
            content = content.replace(/<\/head>/i, `<link rel="canonical" href="${canonical}">\n</head>`);
          }
          pages++;
        }
        fs.writeFileSync(to, content);
      } else {
        fs.copyFileSync(from, to);
      }
      files++;
    }
  }
}

copy(input);
const rss = fs.readFileSync(path.join(output, 'rss2.xml'), 'utf8');
if (!rss.includes(mirror + '/rss2.xml') || rss.includes(original + '/')) {
  throw new Error('RSS 域名转换校验失败，停止发布。');
}
console.log(`Cloudflare 静态副本已准备：${files} 个文件，${pages} 个 HTML 页面。`);
console.log(`博客：${mirror}/  RSS：${mirror}/rss2.xml`);
