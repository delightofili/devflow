"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useWorkspace } from "@/lib/context/workspace-context";
import { getInitials } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
} from "lucide-react";

export default function Sidebar({
  userId,
  userName,
  userImage,
}: {
  userId: string;
  userName: string;
  userImage: string;
}) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;
  const { workspace, loading } = useWorkspace();

  const navLinks = [
    {
      href: `/dashboard/${workspaceId}`,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/${workspaceId}/projects`,
      label: "Projects",
      icon: FolderKanban,
    },
    {
      href: `/dashboard/${workspaceId}/members`,
      label: "Members",
      icon: Users,
    },
    {
      href: `/dashboard/${workspaceId}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-60 h-full bg-[#111] border-r border-[#1a1a1a] flex flex-col flex-shrink-0">
      {/* workspace switcher */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors group">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {workspace?.name?.charAt(0) || "W"}
            </span>
          </div>
          <span className="text-white text-sm font-medium truncate flex-1 text-left">
            {loading ? "Loading..." : workspace?.name || "Workspace"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#555] group-hover:text-[#888] transition-colors" />
        </button>
      </div>

      {/* main nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {link.label}
            </Link>
          );
        })}

        {/* projects section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[#555] text-xs uppercase tracking-wider font-medium">
              Projects
            </span>
            <Link
              href={`/dashboard/${workspaceId}/projects/new`}
              className="text-[#555] hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          {workspace?.projects.length === 0 ? (
            <p className="text-[#444] text-xs px-3 py-2">No projects yet</p>
          ) : (
            workspace?.projects.map((project) => {
              const isProjectActive = pathname.startsWith(
                `/dashboard/${workspaceId}/projects/${project.id}`,
              );

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/${workspaceId}/projects/${project.id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isProjectActive
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </nav>

      {/* user section */}
      <div className="p-3 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors group">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-medium text-[#888] flex-shrink-0">
              {getInitials(userName)}
            </div>
          )}
          <span className="text-[#888] text-sm truncate flex-1">
            {userName}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <LogOut className="w-3.5 h-3.5 text-[#555] hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}
