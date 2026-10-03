import Image from 'next/image';
import type { DreamProjectMedia } from './dreamData';
import styles from './ProjectMedia.module.css';

type ProjectMediaProps = {
  projectSlug: string;
  media?: readonly DreamProjectMedia[];
};

export function ProjectMedia({ projectSlug, media }: ProjectMediaProps) {
  if (!media?.length) return null;

  const headingId = `${projectSlug}-media-title`;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h3 id={headingId}>Product media</h3>
      <div className={styles.grid}>
        {media.map((item) => (
          <figure
            key={`${item.type}-${item.src}`}
            className={styles.item}
            data-presentation={item.type === 'image' ? item.presentation : undefined}
          >
            {item.type === 'image' ? (
              <Image
                className={styles.visual}
                src={item.src}
                alt={item.decorative ? '' : item.alt}
                width={item.width}
                height={item.height}
                sizes="(max-width: 760px) calc(100vw - 2rem), (max-width: 1200px) 80vw, 64rem"
                loading="lazy"
              />
            ) : (
              <video
                className={styles.visual}
                src={item.src}
                title={item.title}
                width={item.width}
                height={item.height}
                poster={item.poster}
                controls
                playsInline
                preload="metadata"
              />
            )}
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
