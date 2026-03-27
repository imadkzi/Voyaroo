import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "../../lib/auth";
import { hitAuthRateLimit } from "../../lib/security/auth-rate-limit";
import { getSessionUser } from "../../lib/session";
import styles from "../../styles/pages/Auth.module.scss";

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest ?? "").startsWith(
      "NEXT_REDIRECT",
    )
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.id) redirect("/");

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const blocked = await hitAuthRateLimit({
      key: `login:${ip}:${email || "unknown"}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (blocked) {
      redirect("/login?error=throttled");
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      // Keep auth failures in-band so we can show friendly UI.
      if (!result || ("ok" in result && !result.ok)) {
        redirect("/login?error=invalid");
      }
      redirect("/");
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      redirect("/login?error=invalid");
    }
  }

  const sp = (await searchParams) ?? {};

  return (
    <div className={`${styles.auth} u-bg-mesh`}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <Image
            src="/brand/logo-mark.svg"
            alt="Voyaroo"
            className={styles.brand__logo}
            width={28}
            height={28}
            priority
          />
          <p className={styles.brand__name}>Voyaroo</p>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.text}>Access your trips and account.</p>
        <form action={login} className={styles.form}>
          <input
            className={styles.input}
            name="email"
            type="email"
            placeholder="Email"
            required
          />
          <input
            className={styles.input}
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <button className={styles.button} type="submit">
            Sign in
          </button>
        </form>
        {sp.error ? (
          <p className={styles.error}>
            {sp.error === "throttled"
              ? "Too many attempts. Please wait a few minutes and try again."
              : "Invalid email or password."}
          </p>
        ) : null}
        <p className={styles.linkRow}>
          New here? <Link href="/register">Create account</Link>
        </p>
      </section>
    </div>
  );
}

