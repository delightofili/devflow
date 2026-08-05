import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const workspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50),
  description: z.string().max(200).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .optional(),
  priority: z
    .enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional(),
  label: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "DEVELOPER", "VIEWER"]).default("DEVELOPER"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
