"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAdminPath } from "@/lib/admin-path";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Inbox,
  Vote,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavShellProps {
  children: ReactNode;
  adminRole: "super_admin" | "site_manager";
  adminEmail?: string;
}

export function NavShell({ children, adminRole, adminEmail }: NavShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Define navigation items
  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: getAdminPath(""),
      exact: true,
    },
    {
      label: "Submissions",
      icon: <Inbox className="w-5 h-5" />,
      href: getAdminPath("submissions"),
      exact: false,
    },
    {
      label: "Voting",
      icon: <Vote className="w-5 h-5" />,
      href: getAdminPath("voting"),
      exact: false,
    },
    {
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: getAdminPath("settings"),
      exact: false,
    },
  ];

  // Only super_admin can see Admins tab
  if (adminRole === "super_admin") {
    navItems.push({
      label: "Admins",
      icon: <Users className="w-5 h-5" />,
      href: getAdminPath("admins"),
      exact: false,
    });
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = getAdminPath("login");
  };

  const isActive = (itemHref: string, exact: boolean) => {
    if (exact) {
      return pathname === itemHref;
    }
    return pathname.startsWith(itemHref) && pathname !== getAdminPath("login");
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-brand-bg text-brand-white">
      {/* 1. Desktop Sidebar (md:flex, hidden on mobile, static h-screen sticky) */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 border-r border-brand-brown-deep bg-brand-surface transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-brand-brown-deep">
          {!collapsed && (
            <span className="font-heading text-lg font-bold text-brand-gold tracking-widest uppercase">
              BMAA Admin
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-brand-brown-deep/20 text-brand-white/80 hover:text-brand-gold mx-auto"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User profile card */}
        {!collapsed && adminEmail && (
          <div className="p-4 mx-4 my-3 bg-brand-bg/50 rounded-md border border-brand-brown-deep/40 text-left">
            <span className="block font-sans text-[10px] text-brand-white/40 font-bold uppercase tracking-wider">Authenticated as</span>
            <span className="block font-sans text-xs text-brand-white/80 font-medium truncate mt-0.5">{adminEmail}</span>
            <span className="inline-block font-sans text-[9px] mt-1 px-2 py-0.5 rounded-full border border-brand-gold/30 bg-brand-gold/5 text-brand-gold font-bold uppercase tracking-wide">
              {adminRole}
            </span>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 text-left overflow-y-auto">
          {navItems.map((item, idx) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={idx}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors z-10 ${
                  active
                    ? "text-brand-bg font-bold"
                    : "text-brand-white/70 hover:text-brand-white hover:bg-brand-brown-deep/10"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-brand-gold rounded-md glow-gold z-[-1]"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <div className="shrink-0">{item.icon}</div>
                {!collapsed && <span className="font-sans">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout bottom */}
        <div className="p-3 border-t border-brand-brown-deep mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-brand-status-rejected hover:bg-brand-status-rejected/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="font-sans text-left">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main content container (scrollable viewport) */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto pb-16 md:pb-0">
        {/* Mobile header (hidden on desktop) */}
        <header className="md:hidden h-14 border-b border-brand-brown-deep bg-brand-surface flex items-center justify-between px-4 z-10">
          <span className="font-heading text-base font-bold text-brand-gold tracking-widest uppercase">
            BMAA Admin
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded hover:bg-brand-brown-deep/20 text-brand-status-rejected"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Viewport content with smooth route transition */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 p-4 sm:p-6 overflow-y-auto"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* 3. Mobile Navigation Bottom Bar (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-surface border-t border-brand-brown-deep flex items-center justify-around px-2 z-20 shadow-lg">
        {navItems.map((item, idx) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={idx}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-14 h-full relative"
            >
              <div className={`transition-colors duration-200 ${active ? "text-brand-gold" : "text-brand-white/50"}`}>
                {item.icon}
              </div>
              <span className={`font-sans text-[9px] tracking-wide font-semibold ${active ? "text-brand-gold" : "text-brand-white/50"}`}>
                {item.label}
              </span>
              {active && (
                <motion.span
                  layoutId="mobile-active-dot"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-gold shadow shadow-brand-gold"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
