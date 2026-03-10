"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Megaphone,
  HandHelping,
  UserPlus,
  LayoutDashboard,
  Users,
  Gamepad2,
  Lightbulb,
  BookOpen,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { TeamLogo } from "@/components/ui/team-logo";

const publicTabs = [
  { href: "/", label: "Home", icon: null, exact: true },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/updates", label: "Updates", icon: Megaphone },
  { href: "/volunteer", label: "Volunteer", icon: HandHelping },
  { href: "/register", label: "Parent Registration", icon: UserPlus },
];

const coachTabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/gameday", label: "Game Day", icon: Gamepad2 },
  { href: "/coaching", label: "Coaching", icon: Lightbulb },
  { href: "/rules", label: "Rules & AI", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function UnifiedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCoach, coach, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show nav on auth pages
  if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/offline") {
    return <>{children}</>;
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleLogout() {
    await logout();
    setMobileMenuOpen(false);
    router.push("/");
  }

  const allTabs = isCoach ? [...publicTabs, ...coachTabs] : publicTabs;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav bar */}
      <header className="bg-secondary text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <TeamLogo size="sm" />
              <div className="hidden sm:block">
                <div className="font-bold text-sm leading-tight">Speedy Cheetahs</div>
                <div className="text-[10px] text-white/60 leading-tight">Farm-1 Baseball</div>
              </div>
            </Link>

            {/* Desktop nav tabs */}
            <nav className="hidden lg:flex items-center gap-1 h-full">
              {publicTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md transition-colors",
                    isActive(tab.href, tab.exact)
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {tab.label}
                </Link>
              ))}

              {isCoach && (
                <>
                  <div className="w-px h-6 bg-white/20 mx-1" />
                  {coachTabs.map((tab) => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={cn(
                        "px-3 py-2 text-sm rounded-md transition-colors",
                        isActive(tab.href)
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Right side: login/logout + mobile menu */}
            <div className="flex items-center gap-2">
              {/* Desktop login/logout */}
              <div className="hidden lg:flex items-center">
                {loading ? null : isCoach ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden xl:inline">{coach?.name}</span>
                    <span className="xl:hidden">Sign Out</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-md transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Coach Login
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 bg-secondary text-white z-40 lg:hidden border-t border-white/10 max-h-[calc(100vh-56px)] overflow-y-auto animate-slide-down">
            <nav className="py-2">
              <div className="px-4 py-1.5">
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Team</p>
              </div>
              {publicTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                    isActive(tab.href, tab.exact)
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
                  {!tab.icon && <span className="w-4" />}
                  {tab.label}
                </Link>
              ))}

              {isCoach && (
                <>
                  <div className="border-t border-white/10 my-2" />
                  <div className="px-4 py-1.5">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Coach</p>
                  </div>
                  {coachTabs.map((tab) => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                        isActive(tab.href)
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <tab.icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </Link>
                  ))}
                </>
              )}

              <div className="border-t border-white/10 my-2" />
              {loading ? null : isCoach ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out ({coach?.name})
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Coach Login
                </Link>
              )}
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
