"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { projects } from "@/content/projects";
import styles from "./Nav.module.css";

const items = [
  { href: "/", label: "Home" },
  ...projects.map((p) => ({ href: `/${p.slug}`, label: p.navLabel })),
];

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      <div className={styles.scrim} aria-hidden />
      <header className={styles.bar}>
        <Link
          href="/"
          className={styles.logo}
          data-flip-id="site-title"
          aria-label="Maker Portfolio, home"
        >
          <span className={styles.logoMark} aria-hidden />
          <span>Maker Portfolio</span>
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <ul>
            {items.map((item, i) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={styles.link}
                    data-nav-href={item.href}
                  >
                    <span className={styles.index} aria-hidden>
                      {String(i).padStart(2, "0")}
                    </span>
                    <span
                      className={styles.label}
                      data-flip-id={`nav-${item.href}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
