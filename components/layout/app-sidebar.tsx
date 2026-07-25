"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings, PanelLeftClose, PanelLeftOpen, Heart, BookMarked, NotebookPen, Mail } from "lucide-react";
import { APP_NAV } from "@/lib/constants";
import { LucideIcon } from "@/components/lucide-icon";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("mob.sidebar.collapsed") === "1");
    } catch {}
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("mob.sidebar.collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-card/40 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center border-b", collapsed ? "justify-center px-0" : "px-4")}>
        <Logo href="/dashboard" showText={!collapsed} />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {APP_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <LucideIcon name={item.icon} className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t p-3">
        <Link
          href="/messages"
          title={collapsed ? "Messages" : undefined}
          className={cn(
            "flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            isActive(pathname, "/messages")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <Mail className="size-4 shrink-0" />
          {!collapsed && "Messages"}
        </Link>
        <Link
          href="/notes"
          title={collapsed ? "My Notes" : undefined}
          className={cn(
            "flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            isActive(pathname, "/notes")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <NotebookPen className="size-4 shrink-0" />
          {!collapsed && "My Notes"}
        </Link>
        <Link
          href="/resources"
          title={collapsed ? "Resources" : undefined}
          className={cn(
            "flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            isActive(pathname, "/resources")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <BookMarked className="size-4 shrink-0" />
          {!collapsed && "Resources"}
        </Link>
        <Link
          href="/support"
          title={collapsed ? "Support us" : undefined}
          className={cn(
            "flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            isActive(pathname, "/support")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <Heart className="size-4 shrink-0" />
          {!collapsed && "Support us"}
        </Link>
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            isActive(pathname, "/settings")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && "Settings"}
        </Link>
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-9 w-full items-center gap-3 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
            collapsed ? "justify-center px-0" : "px-3",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" />
          ) : (
            <PanelLeftClose className="size-4 shrink-0" />
          )}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
