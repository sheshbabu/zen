export default function navigateTo(path, shouldPreserveSearchParams) {
  if (shouldPreserveSearchParams) {
    const currentUrl = new URL(window.location.href);
    const newUrl = new URL(path, currentUrl.origin);

    for (const [key, value] of currentUrl.searchParams.entries()) {
      if (!newUrl.searchParams.has(key)) {
        newUrl.searchParams.set(key, value);
      }
    }
    path = newUrl.pathname + newUrl.search;
  }

  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("navigate"));
}