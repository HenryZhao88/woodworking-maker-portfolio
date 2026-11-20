export type Segment = { text: string; em: boolean };

/** Splits copy on *asterisks*: marked phrases render in the gold italic accent voice. */
export function parseEmphasis(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), em: false });
    out.push({ text: m[1], em: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), em: false });
  return out;
}
