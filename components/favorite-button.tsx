"use client";

import { useState } from "react";

export function FavoriteButton({
  targetType,
  targetId,
  active = false,
  label,
}: {
  targetType: "course" | "lesson" | "session";
  targetId: string;
  active?: boolean;
  label: string;
}) {
  const [on, setOn] = useState(active);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      className={on ? "text-[#FF6B4A]" : "text-muted"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const next = !on;
        setOn(next);
        void fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId }),
        }).then((response) => {
          if (!response.ok) setOn(!next);
        });
      }}
    >
      {on ? "♥" : "♡"} {label}
    </button>
  );
}
