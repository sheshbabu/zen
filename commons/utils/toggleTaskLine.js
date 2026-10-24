const TASK_LINE_PATTERN = /^((?:\s*>)*\s*(?:[-*+]|\d+[.)])\s+\[)( |x|X)(\] )/;

export function toggleTaskLine(line) {
  const match = line.match(TASK_LINE_PATTERN);
  if (match === null) {
    return null;
  }
  const marker = match[2] === " " ? "x" : " ";
  return match[1] + marker + match[3] + line.substring(match[0].length);
}

export function toggleTaskAtLine(content, lineIndex) {
  const lines = content.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) {
    return null;
  }
  const toggledLine = toggleTaskLine(lines[lineIndex]);
  if (toggledLine === null) {
    return null;
  }
  lines[lineIndex] = toggledLine;
  return lines.join("\n");
}
