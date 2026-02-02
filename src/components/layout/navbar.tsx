"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, LayoutDashboard, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-xl hover:opacity-80 transition-opacity"
        >
          <span className="text-primary">PotSaver</span>
        </Link>

        {/* Desktop navigation - only show when logged out (auth context prevents flash) */}
        {!isLoading && !user && (
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={pathname === "/dashboard" ? "bg-accent" : undefined}
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={
                  pathname?.startsWith("/dashboard/accounts")
                    ? "bg-accent"
                    : undefined
                }
              >
                <Link href="/dashboard/accounts">
                  <Wallet className="h-4 w-4 mr-1" />
                  Accounts
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={
                  pathname?.startsWith("/dashboard/automations")
                    ? "bg-accent"
                    : undefined
                }
              >
                <Link href="/dashboard/automations">
                  <Zap className="h-4 w-4 mr-1" />
                  Automations
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden sm:inline-flex"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto flex flex-col gap-2 py-4 px-4">
            {!isLoading &&
              !user &&
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="py-2 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/accounts"
                  className="py-2 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Accounts
                </Link>
                <Link
                  href="/dashboard/automations"
                  className="py-2 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Automations
                </Link>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild className="mt-2">
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
