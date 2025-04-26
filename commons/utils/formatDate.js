export default function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    const currentYear = now.getFullYear();
    const dateYear = date.getFullYear();
    if (currentYear === dateYear) {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } else if (days > 7) {
    return `${Math.floor(days / 7)}w`;
  } else if (days > 1) {
    return `${days}d`;
  } else if (days === 1) {
    return '1d';
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return 'now';
  }
}