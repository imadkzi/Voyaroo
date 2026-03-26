"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "../styles/components/FloatingQuickMenu.module.scss";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function FloatingQuickMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={styles.menu}>
      <div
        className={[
          styles.menu__list,
          open ? styles["menu__list--open"] : "",
        ].join(" ")}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={styles.menu__item}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={styles.menu__itemIcon} aria-hidden />
              <span className={styles.menu__itemLabel}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.menu__toggle}
        aria-expanded={open}
        aria-label={open ? "Close quick menu" : "Open quick menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X className={styles.menu__toggleIcon} aria-hidden />
        ) : (
          <Menu className={styles.menu__toggleIcon} aria-hidden />
        )}
      </button>
    </div>
  );
}

