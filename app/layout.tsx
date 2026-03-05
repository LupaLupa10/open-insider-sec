import type { Metadata } from "next";
import Link from "next/link";

import { getSessionUser } from "@/lib/data/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Insider Trading Explorer",
  description: "Browse SEC Form 4 insider trading disclosures with search, filters, and saved views."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell site-header-inner">
            <Link href="/" className="brand">
              Insider Trading Explorer
            </Link>
            <nav className="nav-links">
              <Link className="nav-link" href="/explorer">
                Explore
              </Link>
              <Link className="nav-link" href="/dashboard">
                Dashboard
              </Link>
            </nav>
            <div className="header-actions">
              {user ? (
                <>
                  <span className="muted">{user.email}</span>
                  <form action="/auth/logout" method="post">
                    <button className="button-secondary" type="submit">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="button-ghost" href="/auth/login">
                    Log in
                  </Link>
                  <Link className="button" href="/auth/sign-up">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
