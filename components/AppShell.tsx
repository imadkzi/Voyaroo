import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { FloatingQuickMenu } from "./FloatingQuickMenu";
import styles from "../styles/components/AppShell.module.scss";

export function AppShell({
  title,
  children,
  actionHref,
  actionLabel = "New",
  brandKicker = "Voyaroo",
  backHref,
  backLabel = "Back",
}: {
  title: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  /** Small label above the title (e.g. “Trip”, “Countdown”). */
  brandKicker?: string;
  /** When set, shows a back control (e.g. to trip list). */
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className={`${styles.appShell} u-bg-mesh`}>
      <header className={`${styles.header} u-safe-pt`}>
        <div className={styles.header__inner}>
          <div className={styles.headerCard}>
            {backHref ? (
              <Link
                href={backHref}
                className={styles.headerBack}
                aria-label={backLabel}
                title={backLabel}
              >
                <ChevronLeft className={styles.headerBack__icon} aria-hidden />
              </Link>
            ) : null}
            <div className={styles.brand}>
              <Link href="/" className={styles.brand__logoLink} aria-label={brandKicker}>
                <Image
                  src="/brand/logo-inline.svg"
                  alt={brandKicker}
                  className={styles.brand__logo}
                  width={160}
                  height={32}
                  priority
                />
              </Link>
            </div>
            <div className={styles.headerActions}>
              {actionHref ? (
                <Link
                  href={actionHref}
                  className={styles.cta}
                >
                  {actionLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main} aria-label={title}>
        {children}
      </main>

      <FloatingQuickMenu />
    </div>
  );
}

