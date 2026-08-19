"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;

  const tabs = [
    {
      label: "Workspace",
      href: `/dashboard/${workspaceId}/settings`,
    },
    {
      label: "Profile",
      href: `/dashboard/${workspaceId}/settings/profile`,
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-[#555] text-sm mt-1">
          Manage your workspace and account settings
        </p>
      </div>

      {/* tabs */}
      <div className="flex gap-1 border-b border-[#1a1a1a] mb-8">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-[#555] hover:text-[#888]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
