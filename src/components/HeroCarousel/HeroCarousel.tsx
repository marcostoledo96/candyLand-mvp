// HeroCarousel: native React/CSS carousel for the home hero.
// 3 local slides, autoplay, keyboard, reduced-motion safe, light-mode only.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { nextIndex, prevIndex, goToIndex } from './carouselNav.js';
import styles from './HeroCarousel.module.css';

export interface HeroSlide {
  src: string;
  alt: string;
  caption: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;

  // Detect prefers-reduced-motion once on mount.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => nextIndex(i, count));
  }, [count]);

  const prev = useCallback(() => {
    setIndex((i) => prevIndex(i, count));
  }, [count]);

  const goTo = useCallback((i: number) => {
    setIndex(goToIndex(i, count));
  }, [count]);

  // Autoplay via setInterval(4500); pause on reduced-motion.
  useEffect(() => {
    if (reducedMotion || count <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => nextIndex(i, count));
    }, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reducedMotion, count]);

  const pause = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resume = () => {
    if (reducedMotion || count <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => nextIndex(i, count));
    }, 4500);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        next();
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(count - 1);
        break;
      default:
        break;
    }
  };

  if (count === 0) return null;

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Carrusel de novedades"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className={styles.slide}
              aria-hidden={i === index ? 'false' : 'true'}
            >
              <img
                src={s.src}
                alt={s.alt}
                className={styles.slideImg}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <p className={styles.caption}>{s.caption}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.ctrlBtn}
          onClick={prev}
          aria-label="Diapositiva anterior"
        >
          ‹ Anterior
        </button>
        <button
          type="button"
          className={styles.ctrlBtn}
          onClick={next}
          aria-label="Diapositiva siguiente"
        >
          Siguiente ›
        </button>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Seleccionar diapositiva">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Diapositiva ${i + 1}`}
            className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <span className={styles.liveRegion} aria-live="polite">
        Diapositiva {index + 1} de {count}
      </span>
    </div>
  );
};

export default HeroCarousel;