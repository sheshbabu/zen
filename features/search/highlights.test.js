import { test } from "node:test";
import assert from "node:assert/strict";
import { splitHighlights, getHighlightedSnippet, getMatchedTerms } from "./highlights.js";

const text = value => ({ text: value, isMatch: false });
const match = value => ({ text: value, isMatch: true });

test("splitHighlights", () => {
  const cases = [
    [undefined, []],
    ["", []],
    ["plain title", [text("plain title")]],
    ["a <mark>match</mark> here", [text("a "), match("match"), text(" here")]],
    ["<mark>one</mark> and <mark>two</mark>", [match("one"), text(" and "), match("two")]],
    ["<mark>x</mark> <img src=x onerror=alert(1)>", [match("x"), text(" <img src=x onerror=alert(1)>")]],
    ["<mark>multi\nline</mark>", [match("multi\nline")]],
  ];

  for (const [input, expected] of cases) {
    assert.deepEqual(splitHighlights(input), expected, `input: ${JSON.stringify(input)}`);
  }
});

test("getHighlightedSnippet", () => {
  const long = "x".repeat(200);
  const cases = [
    [[], []],
    [[text("no matches")], [text("no matches")]],
    [[text("short "), match("hit"), text(" end")], [text("short "), match("hit"), text(" end")]],
    [[text("0123456789abcdef"), match("hit")], [text("...6789abcdef"), match("hit")]],
    [[match("hit"), text(long)], [match("hit"), text("x".repeat(97) + "...")]],
    [[match("hit"), text("x".repeat(90)), match("match past the limit"), text("after")], [match("hit"), text("x".repeat(90)), match("match past the limit"), text("...")]],
    [[match("hit"), text("x".repeat(97)), match("next"), text("after")], [match("hit"), text("x".repeat(97)), text("...")]],
    [[match("a"), text(" <b>tag</b> stays text")], [match("a"), text(" <b>tag</b> stays text")]],
  ];

  for (const [input, expected] of cases) {
    assert.deepEqual(getHighlightedSnippet(input), expected, `input: ${JSON.stringify(input)}`);
  }
});

test("getMatchedTerms", () => {
  const cases = [
    [[], []],
    [[text("none")], []],
    [[match("Zen"), text(" and "), match("zen"), text(" "), match("notes")], ["zen", "notes"]],
  ];

  for (const [input, expected] of cases) {
    assert.deepEqual(getMatchedTerms(input), expected, `input: ${JSON.stringify(input)}`);
  }
});
