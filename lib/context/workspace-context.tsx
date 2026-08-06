"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useParams } from "next/navigation";

interface WorkspaceMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  ownerId: string;
  members: WorkspaceMember[];
  projects: Project[];
  _count: { projects: number; members: number };
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  loading: boolean;
  refetch: () => void;
  currentMember: WorkspaceMember | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await res.json();
      if (res.ok) setWorkspace(data);
    } catch {
      console.error("Failed to fetch workspace");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const loadWorkspace = async () => {
      await fetchWorkspace();
    };

    loadWorkspace();
  }, [fetchWorkspace]);

  const currentMember =
    workspace?.members.find((m) => m.user.id === userId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        loading,
        refetch: fetchWorkspace,
        currentMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context)
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
