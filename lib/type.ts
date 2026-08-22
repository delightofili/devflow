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

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface TypingUser {
  userId: string;
  userName: string;
}
