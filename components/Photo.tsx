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
};

/**
 * A photo in a frame that always matches the image's own aspect ratio (never crops the subject).
 * `data-gl-*` attributes let the WebGL layer find and mirror it later.
 */
export function Photo({ image, sizes, className, priority, style }: Props) {
  return (
    <figure
      className={`${styles.frame} ${className ?? ""}`}
      style={{ aspectRatio: `${image.width} / ${image.height}`, ...style }}
      data-photo
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
        className={styles.img}
        data-w={image.width}
        data-h={image.height}
        aria-hidden
        data-gl-src={image.src}
        draggable={false}
      />
    </figure>
  );
}
