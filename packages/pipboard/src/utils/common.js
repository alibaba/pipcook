export function addUrlParams(arg) {
  location.href = location.href.includes('?') ? `${location.href}&${arg}` : `${location.href}?${arg}`;
}
