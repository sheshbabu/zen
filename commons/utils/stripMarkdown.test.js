import { test } from "node:test";
import assert from "node:assert/strict";
import stripMarkdown from "./stripMarkdown.js";

test("stripMarkdown", () => {
  const cases = [
    [undefined, ""],
    ["", ""],
    ["# Heading", "Heading"],
    ["###### Deep heading", "Deep heading"],
    ["#hashtag", "#hashtag"],
    ["> quoted", "quoted"],
    ["- item\n  * nested", "• item\n  • nested"],
    ["---", ""],
    ["**bold** and *italic*", "bold and italic"],
    ["__bold__ and _italic_", "bold and italic"],
    ["snake_case_name stays", "snake_case_name stays"],
    ["https://example.com/a_b_c", "https://example.com/a_b_c"],
    ["2 * 3 * 4", "2 * 3 * 4"],
    ["~~gone~~", "gone"],
    ["`code`", "code"],
    ["[link](https://example.com)", "link"],
    ["![alt](image.png)", "alt"],
    ["```js\nconst a = 1;\n```", "const a = 1;\n"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(stripMarkdown(input), expected, `input: ${JSON.stringify(input)}`);
  }
});
