export default function stripMarkdown(text) {
  if (!text) {
    return '';
  }

  const lines = text.split('\n').map(line => {
    let result = line;

    result = result.replace(/^\s{0,3}#{1,6}\s+/, '');
    result = result.replace(/^\s{0,3}>\s?/, '');
    result = result.replace(/^(\s*)[-*+]\s+/, '$1• ');
    result = result.replace(/^\s{0,3}(?:-\s*){3,}$|^\s{0,3}(?:\*\s*){3,}$|^\s{0,3}(?:_\s*){3,}$/, '');

    return result;
  });

  let result = lines.join('\n');

  result = result.replace(/```[^\n]*\n?/g, '');
  result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  result = result.replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '$1');
  // Underscore emphasis is only valid at word boundaries, so snake_case_names
  // and URLs keep their underscores.
  result = result.replace(/\b__(?=\S)(.+?)(?<=\S)__\b/g, '$1');
  result = result.replace(/\*(?=\S)(.+?)(?<=\S)\*/g, '$1');
  result = result.replace(/(^|[^\w])_(?=\S)(.+?)(?<=\S)_(?![\w])/g, '$1$2');
  result = result.replace(/~~(.+?)~~/g, '$1');
  result = result.replace(/`([^`]+)`/g, '$1');

  return result;
}
