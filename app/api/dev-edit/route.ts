import fs from "node:fs";
import path from "node:path";
import { applyEdit, type SourceFile } from "@/lib/devEdit";

/**
 * Local-only save endpoint for the click-to-edit text tool. It exists only under `next dev`; the deployed
 * site answers 404. It can only swap one exact piece of visible text for another (JSON-escaped in string
 * literals, and no code characters in JSX text), never write arbitrary code.
 */
function sourceFiles(root: string): SourceFile[] {
  const tsx = ["app", "components"].flatMap((dir) =>
    (fs.readdirSync(path.join(root, dir), { recursive: true, encoding: "utf8" }) as string[])
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => path.join(dir, f))
  );
  return ["content/projects.ts", ...tsx].map((p) => ({ path: p, text: fs.readFileSync(path.join(root, p), "utf8") }));
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  // Only the site itself may save (blocks other web pages from posting to localhost).
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) return new Response("Forbidden", { status: 403 });

  const { edits } = (await request.json()) as { edits: { old: string; new: string }[] };
  const root = process.cwd();
  const files = sourceFiles(root);
  const changed = new Set<string>();
  const results = edits.map((e) => {
    const r = applyEdit(files, e.old, e.new);
    if (!r.ok) return { old: e.old, ok: false, error: r.error };
    files.find((f) => f.path === r.path)!.text = r.text;
    changed.add(r.path);
    return { old: e.old, ok: true };
  });
  for (const p of changed) fs.writeFileSync(path.join(root, p), files.find((f) => f.path === p)!.text);
  return Response.json({ results });
}
