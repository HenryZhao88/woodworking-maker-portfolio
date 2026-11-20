import { Fragment } from "react";
import { RevealText } from "@/components/RevealText";
import styles from "./Hero.module.css";

export function Hero({ title, index }: { title: string; index: string }) {
  return (
    <section className={styles.hero} aria-label="Project title">
      <span className="eyebrow">Project {index}</span>
      <h1 className={styles.title} data-flip-id="page-title">
        {/* One word per line, always: the full title sits within a few pixels of the column width, so letting it wrap on its own flips between one and two lines. */}
        {title.split(" ").map((word, i) => (
          <Fragment key={word + i}>
            {i > 0 && " "}
            <RevealText
              as="span"
              split="chars"
              trigger="mount"
              delay={i * 0.14}
              className={styles.word}
            >
              {word}
            </RevealText>
          </Fragment>
        ))}
      </h1>
      <div className={styles.foot}>
        <span className={styles.rule} aria-hidden />
        <span className="eyebrow">Scroll to begin</span>
      </div>
    </section>
  );
}
