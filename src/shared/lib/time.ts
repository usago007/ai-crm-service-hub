export function formatUiTimestamp(date = new Date()) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}
