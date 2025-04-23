export default function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (days > 30) {
      return date.toISOString().split('T')[0].replace(/-/g, '/');
    } else if (days > 7) {
      return `${Math.floor(days / 7)} weeks ago`;
    } else if (days > 1) {
      return `${days} days ago`;
    } else if (days === 1) {
      return 'yesterday';
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  }