import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className={styles.main}>
      <span className="eyebrow">Error 404</span>
      <h1 className={styles.title}>Nothing here.</h1>
      <p className={styles.copy}>This page was never cut. The spoon is real, though.</p>
      <Link href="/wooden-spoon" className={styles.link}>
        <span>See the spoon</span>
        <span className={styles.arrow} aria-hidden>
          →
        </span>
      </Link>
    </main>
  );
}
