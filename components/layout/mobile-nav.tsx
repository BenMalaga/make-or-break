"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "@/components/lucide-icon";
import { APP_NAV, APP_SECONDARY_NAV } from "@/lib/constants";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {APP_NAV.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link
              href={item.href}
              data-active={pathname.startsWith(item.href)}
              className="data-[active=true]:text-primary"
            >
              <LucideIcon name={item.icon} className="size-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {APP_SECONDARY_NAV.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link
              href={item.href}
              data-active={pathname.startsWith(item.href)}
              className="data-[active=true]:text-primary"
            >
              <LucideIcon name={item.icon} className="size-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
