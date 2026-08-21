export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    members: number;
    projects: number;
  };
}

export interface ProjectSummary {
  id: string;
  name: string;
  color: string;
  status: string;
  description: string | null;
}
