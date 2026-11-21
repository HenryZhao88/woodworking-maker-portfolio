"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isEditMode, setEditMode } from "@/lib/editMode";

/**
 * Local-only click-to-edit for the site's text (rendered only under `next dev`).
 * Turn it on, click any heading, paragraph, caption or label, type, and Save: the new wording is written
 * straight into content/projects.ts (or the component the text lives in). Gold highlights round-trip as *asterisks*.
 */
const SELECTOR = "main h1, main h2, main h3, main p, main .eyebrow, main a";
const STYLE = `
[data-edit]{outline:1px dashed rgba(200,174,116,.45);outline-offset:4px;cursor:text;border-radius:2px}
[data-edit]:hover{outline-color:rgba(200,174,116,.9)}
[data-edit]:focus{outline:2px solid #c8ae74;background:rgba(200,174,116,.08)}
[data-edit][data-dirty]{outline-color:#e8c46a;outline-style:solid}
`;

/** The source form of an element's text: gold highlights become *asterisks*. */
function toSource(el: HTMLElement): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent;
    else if (n instanceof HTMLElement) out += n.matches("em.mark") ? `*${n.textContent}*` : n.tagName === "BR" ? " " : n.textContent;
  });
  return out.replace(/\s+/g, " ").trim();
}

/** Only elements that hold their own text (plus highlights), so each edit maps to one string in the source. */
function isLeafText(el: HTMLElement): boolean {
  if (el.closest("[aria-hidden=true], .sr-only, [data-photo]")) return false;
  if (![...el.children].every((c) => c.matches("em.mark, br"))) return false;
  return toSource(el).length > 0;
}

export function DevEditor() {
  const [on, setOn] = useState(false);
  const [dirty, setDirty] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();

  // Read the flag after hydration so server and client markup match.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is client-only; reading it in render would mismatch hydration
  useEffect(() => setOn(isEditMode()), []);

  const recount = useCallback(() => {
    let n = 0;
    document.querySelectorAll<HTMLElement>("[data-edit]").forEach((el) => {
      const changed = toSource(el) !== el.dataset.editOrig;
      el.toggleAttribute("data-dirty", changed);
      if (changed) n++;
    });
    setDirty(n);
  }, []);

  useEffect(() => {
    if (!on) return;
    const style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    const arm = () =>
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (el.hasAttribute("data-edit") || !isLeafText(el)) return;
        el.dataset.editOrig = toSource(el);
        el.setAttribute("data-edit", "");
        el.contentEditable = "true";
        el.spellcheck = true;
      });
    const t = window.setTimeout(arm, 300); // after the page's own effects have rendered its text
    const mo = new MutationObserver(() => arm());
    mo.observe(document.body, { childList: true, subtree: true });

    // Typing, not navigating: clicks on editable text never follow links or open the lightbox.
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-edit]");
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target as HTMLElement).closest("[data-edit]")) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    };
    const onPaste = (e: ClipboardEvent) => {
      if (!(e.target as HTMLElement).closest("[data-edit]")) return;
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData?.getData("text/plain").replace(/\s+/g, " ") ?? "");
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("paste", onPaste, true);
    window.addEventListener("input", recount, true);
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
      style.remove();
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("paste", onPaste, true);
      window.removeEventListener("input", recount, true);
    };
  }, [on, pathname, recount]);

  const save = async () => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-edit][data-dirty]")];
    const edits = els.map((el) => ({ old: el.dataset.editOrig!, new: toSource(el) }));
    setSaving(true);
    try {
      const res = await fetch("/api/dev-edit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ edits }) });
      const { results } = (await res.json()) as { results: { ok: boolean; error?: string }[] };
      results.forEach((r, i) => {
        if (r.ok) els[i].dataset.editOrig = edits[i].new;
      });
      const okN = results.filter((r) => r.ok).length;
      const errors = results.filter((r) => !r.ok).map((r) => r.error);
      setMsg(errors.length ? `Saved ${okN}. Not saved: ${errors.join(" ")}` : `Saved ${okN} change${okN === 1 ? "" : "s"}`);
    } catch {
      setMsg("Couldn't save. Is `npm run dev` still running?");
    } finally {
      setSaving(false);
      recount();
    }
  };

  if (process.env.NODE_ENV !== "development") return null;

  const btn: React.CSSProperties = {
    font: "500 14px var(--font-body), system-ui, sans-serif",
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid #c8ae74",
    cursor: "pointer",
  };
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 200, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "min(92vw, 560px)" }}>
      {msg && (
        <span role="status" style={{ font: "14px var(--font-body), sans-serif", color: "#ede6da", background: "rgba(14,11,8,.92)", padding: "8px 12px", borderRadius: 8 }}>
          {msg}
        </span>
      )}
      {on ? (
        <>
          <button type="button" style={{ ...btn, background: dirty ? "#c8ae74" : "transparent", color: dirty ? "#0e0b08" : "#c8ae74" }} disabled={!dirty || saving} onClick={save}>
            {saving ? "Saving…" : dirty ? `Save ${dirty} change${dirty === 1 ? "" : "s"}` : "Save"}
          </button>
          <button
            type="button"
            style={{ ...btn, background: "rgba(14,11,8,.85)", color: "#ede6da" }}
            onClick={() => {
              if (dirty && !window.confirm("Leave without saving your changes?")) return;
              setEditMode(false);
              location.reload();
            }}
          >
            Done
          </button>
        </>
      ) : (
        <button
          type="button"
          style={{ ...btn, background: "rgba(14,11,8,.85)", color: "#c8ae74" }}
          onClick={() => {
            setEditMode(true);
            location.reload();
          }}
        >
          Edit text
        </button>
      )}
    </div>
  );
}
