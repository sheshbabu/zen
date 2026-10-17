const SNIPPET_LENGTH = 100;
const SNIPPET_LEAD_LENGTH = 10;
const ELLIPSIS = '...';

// Callers render these segments as text rather than HTML, so markup in a note never runs.
export function splitHighlights(text) {
  if (!text) {
    return [];
  }

  const segments = [];
  const parts = text.split(/<mark>(.*?)<\/mark>/s);
  for (let index = 0; index < parts.length; index++) {
    if (parts[index] === '') {
      continue;
    }
    segments.push({ text: parts[index], isMatch: index % 2 === 1 });
  }
  return segments;
}

export function getHighlightedSnippet(segments) {
  const firstMatchIndex = segments.findIndex(segment => segment.isMatch);
  if (firstMatchIndex === -1) {
    return segments;
  }

  const snippet = [];
  const leadText = segments.slice(0, firstMatchIndex).map(segment => segment.text).join('');
  if (leadText.length > SNIPPET_LEAD_LENGTH) {
    snippet.push({ text: ELLIPSIS + leadText.slice(-SNIPPET_LEAD_LENGTH), isMatch: false });
  } else if (leadText !== '') {
    snippet.push({ text: leadText, isMatch: false });
  }

  let remainingLength = SNIPPET_LENGTH - Math.min(leadText.length, SNIPPET_LEAD_LENGTH);
  const rest = segments.slice(firstMatchIndex);
  for (let index = 0; index < rest.length; index++) {
    const segment = rest[index];
    if (remainingLength <= 0) {
      snippet.push({ text: ELLIPSIS, isMatch: false });
      break;
    }
    if (segment.isMatch === false && segment.text.length > remainingLength) {
      snippet.push({ text: segment.text.slice(0, remainingLength) + ELLIPSIS, isMatch: false });
      break;
    }
    snippet.push(segment);
    remainingLength -= segment.text.length;
  }
  return snippet;
}

export function getMatchedTerms(segments) {
  const terms = [];
  for (const segment of segments) {
    const term = segment.text.toLowerCase();
    if (segment.isMatch && !terms.includes(term)) {
      terms.push(term);
    }
  }
  return terms;
}
