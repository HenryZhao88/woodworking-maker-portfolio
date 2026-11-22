import { pageMeta } from "@/lib/site";
import styles from "./page.module.css";

export const metadata = pageMeta({
  title: "Cutting Board",
  path: "/cutting-board",
  description: "My second woodworking project, a cutting board. The write-up and photos go up here once the board is finished.",
});

export default function CuttingBoard() {
  return (
    <main id="main" tabIndex={-1} className={styles.main}>
      <span className="eyebrow">Project 02</span>
      <h1 className={styles.title} data-flip-id="page-title">Cutting Board</h1>
      <p className={styles.soon}>Coming soon.</p>
    </main>
  );
}
