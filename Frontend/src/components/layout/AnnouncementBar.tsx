"use client";

import { useEffect, useState } from "react";
import { announcements } from "@/data/site";
import { Motif } from "@/components/ui/Motif";
import { X } from "lucide-react";

const INTERVAL_MS = 4500;

/** One line at a time, cross-faded. Quieter than a scrolling marquee. */
export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % announcements.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="gradient-ink relative z-50 text-cream">
      <div className="shell flex items-center justify-between gap-4 py-3">
        <div className="relative h-[1.6em] flex-1 overflow-hidden">
          {announcements.map((a, i) => (
            <p
              key={a.id}
              aria-hidden={i !== index}
              className="absolute inset-0 flex items-center justify-center gap-3 text-2xs tracking-[0.22em] uppercase transition-all duration-700 ease-out-expo"
              style={{
                opacity: i === index ? 1 : 0,
                transform: `translateY(${(i - index) * 100}%)`,
              }}
            >
              <Motif name={a.motif} className="size-4 text-accent-300" />
              {a.text}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcements"
          className="shrink-0 text-sm text-cream/50 transition-colors duration-300 hover:text-cream"
        ><X className="size-4" strokeWidth={1.6} aria-hidden /></button>
      </div>
    </div>
  );
}
