import { Fragment } from "react";
import { parseEmphasis } from "@/lib/rich";

/** Copy with *marked* phrases set in the gold italic accent. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((s, i) =>
        s.em ? (
          <em key={i} className="mark">
            {s.text}
          </em>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        )
      )}
    </>
  );
}
