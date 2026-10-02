export default function navigateTo(path, shouldPreserveSearchParams, shouldReplace) {
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

  if (shouldReplace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }
  window.dispatchEvent(new PopStateEvent("navigate"));
}