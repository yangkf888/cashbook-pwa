"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SpaceTabsProps {
  spaceId: string;
  isFamily: boolean;
}

const tabs = [
  { key: "transactions", label: "明细", suffix: "transactions" },
  { key: "stats", label: "统计", suffix: "stats" }
];

export default function SpaceTabs({ spaceId, isFamily }: SpaceTabsProps) {
  const pathname = usePathname();
  const basePath = `/app/spaces/${spaceId}`;
  const items = isFamily
    ? [...tabs, { key: "members", label: "成员", suffix: "members" }]
    : tabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
        {items.map((item) => {
          const href = `${basePath}/${item.suffix}`;
          const isActive = pathname === href;
          return (
            <Link
              key={item.key}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="text-sm">{item.label}</span>
              <span
                className={`h-1 w-6 rounded-full ${
                  isActive ? "bg-slate-900" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
