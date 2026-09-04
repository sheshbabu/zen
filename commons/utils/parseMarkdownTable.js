const ALIGNMENTS = {
  "text-align:left": "left",
  "text-align:center": "center",
  "text-align:right": "right"
};

export default function parseMarkdownTable(markdown) {
  const tokens = window.markdownit().parse(markdown.trim(), {});

  if (tokens.length === 0 || tokens[0].type !== "table_open") {
    return null;
  }

  if (tokens[tokens.length - 1].type !== "table_close") {
    return null;
  }

  const rows = [];
  const alignments = [];
  let row = null;

  for (const token of tokens) {
    if (token.type === "tr_open") {
      row = [];
    } else if (token.type === "inline") {
      row.push(token.content);
    } else if (token.type === "tr_close") {
      rows.push(row);
    } else if (token.type === "th_open") {
      const style = token.attrGet("style");
      alignments.push(ALIGNMENTS[style] || "none");
    }
  }

  return { rows, alignments };
}
