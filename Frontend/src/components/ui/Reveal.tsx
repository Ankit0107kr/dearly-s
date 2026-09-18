"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** Stagger in ms. */
  delay?: number;
  /** Travel distance before settling, in vh. */
  y?: number;
  /** Animate only the first time the element is seen. */
  once?: boolean;
  className?: string;
  as?: React.ElementType;
};

/**
 * Scroll-linked entrance: fade plus a short rise, on the shared easing curve.
 *
 * The animation re-arms every time the section comes back into view. Two
 * observers give it hysteresis: it plays once the element is properly on
 * screen, but only resets once the element has left the viewport completely,
 * so nothing fades out while it is still being read.
 *
 * Under prefers-reduced-motion the CSS pins [data-reveal] to its visible state,
 * so content is never hidden for those users regardless of what JS does here.
 */
export function Reveal({
  children,
  delay = 0,
  y = 4,
  once = false,
  className = "",
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    // Plays when the element is meaningfully on screen.
    const enter = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) enter.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    // Re-arms only after the element is fully out of view.
    const exit = once
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) setShown(false);
          },
          { threshold: 0 },
        );

    enter.observe(node);
    exit?.observe(node);
    return () => {
      enter.disconnect();
      exit?.disconnect();
    };
  }, [once]);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={`transition-[opacity,transform] duration-[900ms] ease-out-expo ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : `translateY(${y}vh)`,
      }}
    >
      {children}
    </Tag>
  );
}
