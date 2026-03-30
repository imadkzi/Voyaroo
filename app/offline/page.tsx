import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import styles from "../../styles/pages/Offline.module.scss";

export default function OfflinePage() {
  return (
    <AppShell title="Offline">
      <section className={styles.card} aria-label="Offline message">
        <h1 className={styles.title}>You’re offline</h1>
        <p className={styles.text}>
          You can still browse recently opened trips and checklists. Some actions
          may not work until you’re back online.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.button}>
            Go to trips
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

