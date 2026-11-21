/**
 * The local text editor's save step: find exactly where a piece of visible text lives in the source
 * and swap it for the new wording. Strings in content/projects.ts are matched as double-quoted literals;
 * text written straight into a component is matched as plain JSX text.
 */
export type SourceFile = { path: string; text: string };
export type EditResult = { ok: true; path: string; text: string } | { ok: false; error: string };

function count(haystack: string, needle: string): number {
  let n = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) n++;
  return n;
}

export function applyEdit(files: SourceFile[], oldText: string, newText: string): EditResult {
  const quoted = JSON.stringify(oldText);
  const literalHits = files.map((f) => ({ f, n: count(f.text, quoted) })).filter((h) => h.n > 0);
  const literalTotal = literalHits.reduce((a, h) => a + h.n, 0);
  if (literalTotal === 1) {
    const { f } = literalHits[0];
    return { ok: true, path: f.path, text: f.text.replace(quoted, () => JSON.stringify(newText)) };
  }
  if (literalTotal > 1) return { ok: false, error: `"${oldText}" is in ${literalTotal} places, so I can't tell which one to change.` };

  const jsx = files.filter((f) => f.path.endsWith(".tsx"));
  const rawHits = jsx.map((f) => ({ f, n: count(f.text, oldText) })).filter((h) => h.n > 0);
  const rawTotal = rawHits.reduce((a, h) => a + h.n, 0);
  if (rawTotal === 0) return { ok: false, error: `Couldn't find "${oldText}" in the source.` };
  if (rawTotal > 1) return { ok: false, error: `"${oldText}" is in ${rawTotal} places, so I can't tell which one to change.` };
  if (/[{}<>]/.test(newText)) return { ok: false, error: "This text lives in a component, so it can't contain { } < > characters." };
  const { f } = rawHits[0];
  return { ok: true, path: f.path, text: f.text.replace(oldText, () => newText) };
}
