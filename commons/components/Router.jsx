import { h, useEffect, useState } from '../../dependencies/preact.esm.js';

export default function Router({ children }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    function handleLocationChange() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("navigate", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    
    return () => {
      window.removeEventListener("navigate", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const { path, component } = child.props;

    if (path.includes(":")) {
      const pathSegments = path.split("/");
      const pathPattern = pathSegments.map(segment => {
        if (segment.startsWith(":")) {
          const paramName = segment.slice(1);
          return `(?<${paramName}>[^/]+)`;
        }
        return segment;
      }).join("\\/");
      const pattern = new RegExp(`^${pathPattern}$`);
      const match = pattern.exec(currentPath);

      if (match) {
        const params = match.groups;
        return h(component, { ...params });
      }
    }

    if (currentPath === path) {
      return h(component, {});
    }
  }

  return null;
}
