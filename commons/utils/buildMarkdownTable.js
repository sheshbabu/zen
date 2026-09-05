const SEPARATORS = {
  left: ":---",
  center: ":---:",
  right: "---:",
  none: "---"
};

export default function buildMarkdownTable(rows, alignments) {
  const lines = [];

  rows.forEach((row, index) => {
    const cells = row.map(cell => cell.replaceAll("|", "\\|"));
    lines.push(`| ${cells.join(" | ")} |`);

    if (index === 0) {
      const separators = row.map((cell, column) => SEPARATORS[alignments[column]] || SEPARATORS.none);
      lines.push(`| ${separators.join(" | ")} |`);
    }
  });

  return lines.join("\n");
}
