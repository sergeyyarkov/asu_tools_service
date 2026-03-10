/**
 * @param {string} pathname
 */
export function matchRoutePathname(pathname) {
  return pathname.match(/(^\/[^/].*$|^\/$)/g);
}

/**
 * @param {string} pathname
 */
export function formatRoutePathname(pathname) {
  if (pathname[0] !== "/") pathname = "/" + pathname;
  return pathname.replaceAll(/\/{2,}/g, "/");
}
