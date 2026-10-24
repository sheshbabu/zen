import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import parseMarkdownTable from "./parseMarkdownTable.js";
import buildMarkdownTable from "./buildMarkdownTable.js";

before(() => {
  const require = createRequire(import.meta.url);
  globalThis.window = { markdownit: require("../../assets/markdown-it.min.js") };
});

test("buildMarkdownTable", () => {
  const cases = [
    {
      name: "header only",
      rows: [["a", "b"]],
      alignments: ["none", "none"],
      expected: "| a | b |\n| --- | --- |",
    },
    {
      name: "alignments",
      rows: [["l", "c", "r", "n"], ["1", "2", "3", "4"]],
      alignments: ["left", "center", "right", "none"],
      expected: "| l | c | r | n |\n| :--- | :---: | ---: | --- |\n| 1 | 2 | 3 | 4 |",
    },
    {
      name: "escaped pipes",
      rows: [["a|b"], ["c|d"]],
      alignments: ["none"],
      expected: "| a\\|b |\n| --- |\n| c\\|d |",
    },
    {
      name: "missing alignment falls back to none",
      rows: [["a", "b"]],
      alignments: ["left"],
      expected: "| a | b |\n| :--- | --- |",
    },
  ];

  for (const { name, rows, alignments, expected } of cases) {
    assert.equal(buildMarkdownTable(rows, alignments), expected, name);
  }
});

test("parseMarkdownTable", () => {
  assert.equal(parseMarkdownTable("not a table"), null, "plain text");
  assert.equal(parseMarkdownTable("| a |\n| --- |\n\nafter"), null, "trailing paragraph");

  const parsed = parseMarkdownTable("| a | b |\n| :--- | ---: |\n| 1 |  |");
  assert.deepEqual(parsed.alignments, ["left", "right"]);
  assert.deepEqual(parsed.rows, [["a", "b"], ["1", ""]], "short rows are padded with empty cells");
});

test("table round trip is stable", () => {
  const cases = [
    { rows: [["a", "b"], ["1", "2"]], alignments: ["none", "none"] },
    { rows: [["l", "c", "r"], ["x", "y", "z"]], alignments: ["left", "center", "right"] },
    { rows: [["pipe"], ["a\\|b"]], alignments: ["none"] },
    { rows: [["a", "b"], ["", "2"], ["1", ""]], alignments: ["none", "right"] },
  ];

  for (const { rows, alignments } of cases) {
    const markdown = buildMarkdownTable(rows, alignments);
    const parsed = parseMarkdownTable(markdown);
    assert.equal(buildMarkdownTable(parsed.rows, parsed.alignments), markdown, markdown);
  }
});
