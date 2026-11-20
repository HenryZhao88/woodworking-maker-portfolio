import { RevealText } from "@/components/RevealText";
import styles from "./Hero.module.css";

export function Hero({ title, index }: { title: string; index: string }) {
  return (
    <section className={styles.hero} aria-label="Project title">
      <span className="eyebrow">Project {index}</span>
      <h1 className={styles.title} data-flip-id="page-title">
        <RevealText as="span" split="chars" trigger="mount" className={styles.word}>
          {title}
        </RevealText>
      </h1>
      <div className={styles.foot}>
        <span className={styles.rule} aria-hidden />
        <span className="eyebrow">Scroll to begin</span>
      </div>
    </section>
  );
}
