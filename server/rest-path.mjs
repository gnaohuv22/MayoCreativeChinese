/** Accept one REST resource or RPC name. Query encoding is left to PostgREST. */
export function canonicalRestPath(value) {
  if (typeof value !== 'string' || /[\\\x00-\x20\x7f#]/.test(value)) return null;
  const split = value.indexOf('?');
  const raw = split < 0 ? value : value.slice(0, split);
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
    decodeURIComponent(value);
  } catch {
    return null;
  }
  // A remaining percent sign would permit a second decoding layer. Dots and encoded
  // separators are unnecessary in resource names and can change URL normalization.
  if (/[%.\\]/.test(decoded) || /%2f/i.test(raw)) return null;
  if (!/^\/rest\/v1\/(?:[a-zA-Z_][a-zA-Z_0-9]*|rpc\/[a-zA-Z_][a-zA-Z_0-9]*)$/.test(decoded))
    return null;
  const path = decoded + (split < 0 ? '' : value.slice(split));
  const url = new URL(path, 'https://rest.invalid');
  return url.pathname === decoded && url.pathname.startsWith('/rest/v1/') ? path : null;
}
