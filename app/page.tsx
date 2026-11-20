import Link from "next/link";
import { RevealText } from "@/components/RevealText";
import { getProject } from "@/content/projects";
import styles from "./home.module.css";

export default function Home() {
  const spoon = getProject("wooden-spoon")!;
  return (
    <main className={styles.main}>
      <section className={styles.hero} aria-label="Intro">
        <div className={styles.meta}>
          <span className="eyebrow">Woodworking</span>
          <span className="eyebrow">Fall 2026</span>
        </div>

        <h1 className={styles.title} data-flip-id="site-title-hero">
          <RevealText as="span" split="chars" trigger="mount" className={styles.line1}>
            Maker
          </RevealText>{" "}
          <RevealText as="span" split="chars" trigger="mount" delay={0.12} className={styles.line2}>
            Portfolio
          </RevealText>
        </h1>

        <div className={styles.byline}>
          <span className={styles.rule} aria-hidden />
          <RevealText as="p" split="words" trigger="mount" delay={0.5} className={styles.name} data-testid="byline-name">
            Henry Zhao
          </RevealText>
        </div>

        <p className={styles.scrollCue} aria-hidden>
          <span>Scroll</span>
          <span className={styles.cueLine} />
        </p>
      </section>

      <section className={styles.teaser} aria-labelledby="teaser-heading">
        <span className="eyebrow">Project 01</span>
        <RevealText as="h2" split="words" className={styles.teaserTitle} data-flip-id="spoon-title">
          {spoon.title}
        </RevealText>
        <RevealText as="p" className={styles.teaserCopy}>
          A spoon carved by hand from a single board — every cut, curve and mistake along the way.
        </RevealText>
        <Link href={`/${spoon.slug}`} className={styles.teaserLink} id="teaser-heading">
          <span>Enter the project</span>
          <span className={styles.arrow} aria-hidden>
            →
          </span>
        </Link>
      </section>
    </main>
  );
}
