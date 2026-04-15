export default function pluralize(count, singular, plural = null) {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}
