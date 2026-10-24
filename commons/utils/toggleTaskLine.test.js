import { test } from "node:test";
import assert from "node:assert/strict";
import { toggleTaskLine, toggleTaskAtLine } from "./toggleTaskLine.js";

test("toggleTaskLine", () => {
  const cases = [
    ["- [ ] buy milk", "- [x] buy milk"],
    ["- [x] buy milk", "- [ ] buy milk"],
    ["- [X] buy milk", "- [ ] buy milk"],
    ["* [ ] star bullet", "* [x] star bullet"],
    ["+ [ ] plus bullet", "+ [x] plus bullet"],
    ["1. [ ] numbered", "1. [x] numbered"],
    ["2) [ ] numbered paren", "2) [x] numbered paren"],
    ["    - [ ] nested", "    - [x] nested"],
    ["> - [ ] quoted", "> - [x] quoted"],
    ["- [ ] keeps [ ] later brackets", "- [x] keeps [ ] later brackets"],
    ["- plain item", null],
    ["[ ] no bullet", null],
    ["- [] missing space", null],
    ["text - [ ] not at start", null],
  ];

  for (const [line, expected] of cases) {
    assert.equal(toggleTaskLine(line), expected, `input: ${JSON.stringify(line)}`);
  }
});

test("toggleTaskAtLine", () => {
  const content = "# Todo\n- [ ] first\n- [x] second\nnot a task";

  assert.equal(toggleTaskAtLine(content, 1), "# Todo\n- [x] first\n- [x] second\nnot a task");
  assert.equal(toggleTaskAtLine(content, 2), "# Todo\n- [ ] first\n- [ ] second\nnot a task");
  assert.equal(toggleTaskAtLine(content, 0), null, "heading is not a task");
  assert.equal(toggleTaskAtLine(content, 3), null, "plain line is not a task");
  assert.equal(toggleTaskAtLine(content, -1), null, "negative index");
  assert.equal(toggleTaskAtLine(content, 4), null, "index past the end");
});
