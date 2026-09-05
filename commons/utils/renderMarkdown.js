import mark from "../../assets/markdown-it-mark.mjs";
import tasks from "../../assets/markdown-it-task-lists.js";

const COPY_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy code-copy-icon"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

const CHECK_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check code-copied-icon"><path d="M20 6 9 17l-5-5"/></svg>';

export default function renderMarkdown(text, { hasCodeCopyButton = false } = {}) {
  const md = window.markdownit({
    linkify: true,
    breaks: true,
    highlight: function (str, lang) {
      if (lang && window.hljs.getLanguage(lang)) {
        try {
          return window.hljs.highlight(str, { language: lang }).value;
        } catch (__) { }
      }
      return '';
    }
  })
  .use(mark)
  .use(tasks);

  // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
  var defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const href = tokens[idx].attrGet('href') || '';
    const match = href.match(/^\/notes\/(\d+)$/);
    if (match) {
      tokens[idx].attrSet('data-note-id', match[1]);
    } else {
      tokens[idx].attrSet('target', '_blank');
    }
    return defaultRender(tokens, idx, options, env, self);
  };

  const isClipboardAvailable = typeof navigator.clipboard !== 'undefined';

  if (hasCodeCopyButton === true && isClipboardAvailable === true) {
    const defaultFenceRender = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };
    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
      const fenceHtml = defaultFenceRender(tokens, idx, options, env, self);
      const button = `<button type="button" class="code-copy-button">${COPY_ICON_SVG}${CHECK_ICON_SVG}</button>`;
      return `<div class="code-block">${button}${fenceHtml}</div>`;
    };
  }

  return md.render(text);
}