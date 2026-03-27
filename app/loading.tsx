import Image from "next/image";
import styles from "../styles/pages/SplashLoading.module.scss";

export default function Loading() {
  return (
    <div className={`${styles.splash} u-bg-mesh`} role="status" aria-live="polite">
      <div className={styles.splash__card}>
        <Image
          src="/brand/logo-mark.svg"
          alt="Voyaroo"
          width={56}
          height={56}
          priority
          className={styles.splash__logo}
        />
        <p className={styles.splash__name}>Voyaroo</p>
        <p className={styles.splash__text}>Loading your trip hub...</p>
        <span className={styles.splash__dot} aria-hidden />
      </div>
    </div>
  );
}
