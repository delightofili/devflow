# DevFlow

A real-time project management platform built for software development teams.

## Features

- **Workspaces** — multi-tenant, invite-based team management
- **Kanban boards** — drag and drop with 5 status columns
- **Real-time collaboration** — task updates and chat powered by Socket.io
- **Team chat** — per-project channels with typing indicators
- **Notifications** — real-time via WebSockets, persistent in database
- **Milestones** — track major project goals and deadlines
- **Analytics** — task activity, team workload, project progress charts
- **AI assistant** — project health analysis powered by GPT-4o-mini
- **Global search** — command palette with keyboard navigation
- **RBAC** — Owner, Admin, Developer, Viewer roles

## Tech stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Frontend   | Next.js 15, TypeScript, Tailwind CSS |
| Auth       | NextAuth v5, Google OAuth            |
| Database   | PostgreSQL, Prisma ORM               |
| Real-time  | Socket.io                            |
| Charts     | Recharts                             |
| AI         | OpenAI GPT-4o-mini                   |
| Deployment | Render                               |

## Getting started

```bash
# clone
git clone https://github.com/yourusername/devflow.git
cd devflow

# install
npm install

# setup env
cp .env.example .env.local
# fill in your values

# database
npx prisma migrate dev

# run
npm run dev
```

## Environment variables

DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=

## Architecture

Browser → Render (Node.js server)
↓
splits traffic
↓ ↓
Next.js Socket.io
(pages + API) (real-time events)
↓
PostgreSQL (Render)

Built in public over 15 days. Follow the journey: [@DelightOfili](https://twitter.com/DelightOfili)
