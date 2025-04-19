export default function navigateTo(path, shouldPreserveSearchParams) {
  if (shouldPreserveSearchParams) {
    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.search;
    path += searchParams;
  }

  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("navigate"));
}