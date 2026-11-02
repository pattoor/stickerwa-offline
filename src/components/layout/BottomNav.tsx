import { NavLink } from "react-router-dom";
import { Sticker, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/stickers", label: "Stickers", icon: Sticker },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/settings", label: "Config", icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-brand-600 dark:text-brand-500"
                  : "text-slate-500 dark:text-slate-400",
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}