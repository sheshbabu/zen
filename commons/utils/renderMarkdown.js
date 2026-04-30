import mark from "../../assets/markdown-it-mark.mjs";
import tasks from "../../assets/markdown-it-task-lists.js";

export default function renderMarkdown(text) {
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

  // Override fence rule to add copy button
  const defaultFence = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const code = token.content;
    const lang = token.info ? token.info.trim() : '';
    // Generate a unique id for the code block
    const id = 'code-block-' + Math.random().toString(36).substr(2, 9);
    // Use default rendering for the <pre><code> part
    const original = defaultFence(tokens, idx, options, env, self);
    // Wrap with a div and add a button
    return `
<div class="code-block-wrapper">
  <button class="copy-code-button" data-code-id="${id}" onclick="window.copyCode(this)">Copy</button>
  ${original}
</div>
`;
  };

  return md.render(text);
}