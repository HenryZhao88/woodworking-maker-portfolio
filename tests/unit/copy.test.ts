import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { projects } from "@/content/projects";
import { parseEmphasis } from "@/lib/rich";

/** Every string a visitor can read or hear (text, alt text, captions) from the content file. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => k !== "src" && k !== "status" && k !== "role" && k !== "slug" && strings(x, out));
  return out;
}

describe("site copy", () => {
  const text = strings(projects);

  it("has no placeholder text left", () => {
    expect(text.filter((s) => /placeholder/i.test(s))).toEqual([]);
  });

  it("uses no em or en dashes in content", () => {
    expect(text.filter((s) => /[—–]/.test(s))).toEqual([]);
  });

  it("uses no em or en dashes in visible strings in pages and components", () => {
    const files = ["app", "components"].flatMap((d) =>
      fs.readdirSync(path.resolve(__dirname, "../..", d), { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".tsx")).map((f) => path.join(d, f))
    );
    const hits = files.flatMap((f) =>
      fs
        .readFileSync(path.resolve(__dirname, "../..", f), "utf8")
        .split("\n")
        .map((line, i) => ({ line: line.trim(), where: `${f}:${i + 1}` }))
        .filter(({ line }) => /[—–]/.test(line) && !/^(\/\/|\*|\/\*|\{\/\*)/.test(line))
        .map(({ where }) => where)
    );
    expect(hits).toEqual([]);
  });

  it("process stages carry a date", () => {
    for (const p of projects) for (const s of p.process?.stages ?? []) expect(s.when, s.label).toMatch(/\w/);
  });
});

describe("parseEmphasis", () => {
  it("splits *marked* phrases into emphasis segments", () => {
    expect(parseEmphasis("one *two three* four")).toEqual([
      { text: "one ", em: false },
      { text: "two three", em: true },
      { text: " four", em: false },
    ]);
  });
  it("leaves plain text alone", () => expect(parseEmphasis("plain")).toEqual([{ text: "plain", em: false }]));
  it("keeps an unclosed asterisk as text", () => expect(parseEmphasis("a * b")).toEqual([{ text: "a * b", em: false }]));
});
