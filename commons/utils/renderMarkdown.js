export default function renderMarkdown(text) {
  const md = window.markdownit({
    linkify: true,
    breaks: true,
    highlight: function (str, lang) {
      if (lang && window.hljs.getLanguage(lang)) {
        try {
          return window.hljs.highlight(lang, str).value;
        } catch (__) { }
      }
      return '';
    }
  });
  // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
  var defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrSet('target', '_blank');
    return defaultRender(tokens, idx, options, env, self);
  };

  return md.render(text);
}