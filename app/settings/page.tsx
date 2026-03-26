import { AppShell } from "../../components/AppShell";
import { ThemeToggle } from "../../components/ThemeToggle";
import { signOut } from "../../lib/auth";
import { requireSessionUser } from "../../lib/session";
import styles from "../../styles/pages/Settings.module.scss";

export default async function SettingsPage() {
  const user = await requireSessionUser();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell title="Settings">
      <section className={styles.panel}>
        <h2 className={styles.panel__title}>Account</h2>
        <p className={styles.panel__text}>
          Signed in as {user.email ?? "Unknown email"}.
        </p>
        <form action={logout} className={styles.actions}>
          <button type="submit" className={styles.button}>
            Sign out
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panel__title}>Appearance</h2>
        <p className={styles.panel__text}>
          Switch between light and dark. Your choice is remembered on this device.
        </p>
        <div className={styles.row}>
          <span className={styles.row__label}>Theme</span>
          <ThemeToggle />
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panel__title}>Install app</h2>
        <p className={styles.panel__text}>
          Voyaroo is a PWA — on your phone, use “Add to Home Screen” from the
          browser menu after opening the site.
        </p>
      </section>
    </AppShell>
  );
}
