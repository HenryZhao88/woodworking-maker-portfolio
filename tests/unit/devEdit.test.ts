import { describe, it, expect } from "vitest";
import { applyEdit, type SourceFile } from "@/lib/devEdit";

const content: SourceFile = {
  path: "content/projects.ts",
  text: `export const p = {\n  heading: "It started as a block of wood.",\n  body: ["She said \\"hi\\" to me.", "Twice", "Twice"],\n};\n`,
};
const page: SourceFile = { path: "components/x.tsx", text: `<h2 className="h">\n  From every side.\n</h2>\n<span>{label}</span>\n` };

describe("applyEdit", () => {
  it("replaces a unique string literal in the content file", () => {
    const r = applyEdit([content, page], "It started as a block of wood.", "It began as a block.");
    expect(r).toEqual({ ok: true, path: "content/projects.ts", text: content.text.replace('"It started as a block of wood."', '"It began as a block."') });
  });

  it("keeps quotes inside the text escaped", () => {
    const r = applyEdit([content], 'She said "hi" to me.', 'He said "yo".');
    expect(r.ok && r.text).toContain('"He said \\"yo\\"."');
  });

  it("replaces plain JSX text in a component", () => {
    const r = applyEdit([content, page], "From every side.", "All the way around.");
    expect(r.ok && r.path).toBe("components/x.tsx");
    expect(r.ok && r.text).toContain("All the way around.");
  });

  it("refuses text that appears more than once", () => {
    expect(applyEdit([content], "Twice", "Once")).toEqual({ ok: false, error: expect.stringMatching(/2 places/) });
  });

  it("refuses text it cannot find", () => {
    expect(applyEdit([content, page], "Not on the site", "x")).toEqual({ ok: false, error: expect.stringMatching(/couldn't find/i) });
  });

  it("refuses JSX edits containing code characters", () => {
    expect(applyEdit([page], "From every side.", "Bad {x}")).toEqual({ ok: false, error: expect.stringMatching(/\{ \} < >/) });
  });
});
