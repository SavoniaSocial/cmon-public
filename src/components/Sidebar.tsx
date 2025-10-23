"use client";
import { FilePlus, MessageSquare, Search, Award } from "lucide-react";
import { JSX } from "react";

interface SidebarProps {
  active: string;
  setActive: (val: string) => void;
  setAddPanelOpen: (val: boolean) => void;
  brandKitUnlocked: boolean;
}

export default function Sidebar({
  active,
  setActive,
  setAddPanelOpen,
  brandKitUnlocked,
}: SidebarProps) {
  return (
    <aside className="flex w-64 flex-col items-center border-r border-gray-200 bg-white py-6 shadow-sm">
      <div className="mb-8 text-2xl font-bold text-purple-700">CREATES 🪄</div>

      <nav className="flex flex-1 flex-col items-start gap-4 w-full px-6">
        <SidebarItem
          icon={<FilePlus />}
          label="Add Draft"
          onClick={() => setAddPanelOpen(true)}
        />
        <SidebarItem
          icon={<MessageSquare />}
          label="Threads"
          active={active === "threads"}
          onClick={() => setActive("threads")}
        />
        <SidebarItem
          icon={<Search />}
          label="Search"
          active={active === "search"}
          onClick={() => setActive("search")}
        />
        <SidebarItem
          icon={<Award />}
          label="Brand Kit 🏅"
          locked={!brandKitUnlocked}
          active={active === "brandkit"}
          onClick={() => brandKitUnlocked && setActive("brandkit")}
        />
      </nav>

      <div className="mt-auto text-xs text-gray-400">v1.0 Savonia Social</div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  locked,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  active?: boolean;
  locked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-purple-50 hover:text-purple-700 ${
        active ? "bg-purple-100 text-purple-700" : "text-gray-700"
      } ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
      title={locked ? "Unlock with Pro 🏅" : label}
      disabled={locked}
    >
      <span className="w-5">{icon}</span>
      {label}
    </button>
  );
}
