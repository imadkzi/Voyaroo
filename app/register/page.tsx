import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { query } from "../../lib/db/postgres";
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

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.id) redirect("/");

  async function register(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const blocked = await hitAuthRateLimit({
      key: `register:${ip}:${email || "unknown"}`,
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (blocked) {
      redirect("/register?error=throttled");
    }

    if (!email || !password || password.length < 8) {
      redirect("/register?error=invalid");
    }

    const existing = await query<{ id: string }>(
      `select id::text as id from users where email = $1 limit 1`,
      [email],
    );
    if (existing[0]) {
      redirect("/register?error=exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      `insert into users (email, name, password_hash)
       values ($1, $2, $3)`,
      [email, name || null, passwordHash],
    );

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || ("ok" in result && !result.ok)) {
        redirect("/login?error=invalid");
      }
      redirect("/");
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      redirect("/register?error=invalid");
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
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.text}>Your trips are private to your account.</p>
        <form action={register} className={styles.form}>
          <input
            className={styles.input}
            name="name"
            type="text"
            placeholder="Name (optional)"
          />
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
            placeholder="Password (min 8 chars)"
            minLength={8}
            required
          />
          <button className={styles.button} type="submit">
            Create account
          </button>
        </form>
        {sp.error ? (
          <p className={styles.error}>
            {sp.error === "exists"
              ? "An account with this email already exists."
              : sp.error === "throttled"
                ? "Too many attempts. Please wait a few minutes and try again."
              : "Please check your details and try again."}
          </p>
        ) : null}
        <p className={styles.linkRow}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}

