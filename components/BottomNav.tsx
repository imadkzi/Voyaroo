"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Settings } from "lucide-react";
import styles from "../styles/components/BottomNav.module.scss";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { href: "/", label: "Trips", icon: Home },
  { href: "/trips/new", label: "New", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={`${styles.bottomNav}`}>
      <div className={styles.bottomNav__inner}>
        <div className={styles.bottomNav__card}>
          <ul className={styles.bottomNav__list}>
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      styles.bottomNav__link,
                      active ? styles["bottomNav__link--active"] : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={[
                        styles.bottomNav__iconWrap,
                        active ? styles["bottomNav__iconWrap--active"] : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <Icon className={styles.bottomNav__iconSvg} />
                    </span>
                    <span className={styles.bottomNav__label}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

