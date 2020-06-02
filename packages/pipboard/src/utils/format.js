export function formatPluginName(name) {
  if (!name) {
    return '';
  }
  const joinName = name.split(/(?=[A-Z])/).join(' ');
  return joinName.charAt(0).toUpperCase() + joinName.slice(1);
}