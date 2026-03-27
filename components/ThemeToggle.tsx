"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import styles from "../styles/components/ThemeToggle.module.scss";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const ready = resolvedTheme === "light" || resolvedTheme === "dark";
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={styles.toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {ready ? (
        isDark ? (
          <Sun className={styles.toggle__icon} />
        ) : (
          <Moon className={styles.toggle__icon} />
        )
      ) : (
        <span className={styles.toggle__placeholder} />
      )}
    </button>
  );
}

