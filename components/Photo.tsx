import Image from "next/image";
import type { CSSProperties } from "react";
import type { ProjectImage } from "@/content/types";
import styles from "./Photo.module.css";

type Props = {
  image: ProjectImage;
  sizes: string;
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
  /** Mirror this photo as a WebGL plane (default true). */
  gl?: boolean;
};

/**
 * A photo in a frame that always matches the image's own aspect ratio (never crops the subject).
 * `data-gl-*` attributes let the WebGL layer find and mirror it later.
 */
export function Photo({ image, sizes, className, priority, style, gl = true }: Props) {
  return (
    <figure
      className={`${styles.frame} ${className ?? ""}`}
      style={{ aspectRatio: `${image.width} / ${image.height}`, ...style }}
      data-photo
      data-gl={gl ? "" : undefined}
      data-src={image.src}
      data-alt={image.alt}
      data-w={image.width}
      data-h={image.height}
      role="button"
      tabIndex={0}
      aria-label={`View full size: ${image.alt}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "eager"} /* the boot loader waits for every photo, so none load mid-scroll */
        className={styles.img}
        data-w={image.width}
        data-h={image.height}
        aria-hidden
        data-gl-src={image.src}
        draggable={false}
      />
      {/* projected corner markers for the WebGL layer: 0 bl, 1 br, 2 tr, 3 tl */}
      <i className={styles.c} data-c="0" style={{ left: 0, bottom: 0 }} aria-hidden />
      <i className={styles.c} data-c="1" style={{ right: 0, bottom: 0 }} aria-hidden />
      <i className={styles.c} data-c="2" style={{ right: 0, top: 0 }} aria-hidden />
      <i className={styles.c} data-c="3" style={{ left: 0, top: 0 }} aria-hidden />
    </figure>
  );
}
