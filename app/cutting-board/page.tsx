import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Cutting Board" };

export default function CuttingBoard() {
  return (
    <main className={styles.main}>
      <span className="eyebrow">Project 02</span>
      <h1 className={styles.title} data-flip-id="page-title">Cutting Board</h1>
      <p className={styles.soon}>Coming soon.</p>
    </main>
  );
}
