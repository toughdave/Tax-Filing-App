"use client";

import { useCallback, useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label="Toggle dark mode"
      style={{
        background: "none",
        border: "1px solid var(--line)",
        borderRadius: "999px",
        padding: "0.4rem 0.6rem",
        cursor: "pointer",
        fontSize: "1rem",
        lineHeight: 1,
        color: "var(--ink)",
        transition: "border-color 0.2s"
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
