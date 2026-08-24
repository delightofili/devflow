"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalProjects: number;
    totalMembers: number;
    completionRate: number;
  };
  chartData: { date: string; created: number; completed: number }[];
  workloadData: { name: string; tasks: number }[];
  projectData: {
    name: string;
    color: string;
    total: number;
    done: number;
    progress: number;
  }[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/analytics`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#1a1a1a] rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-[#1a1a1a] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      label: "Total tasks",
      value: data.stats.totalTasks,
      sub: `${data.stats.completedTasks} completed`,
    },
    {
      label: "Completion rate",
      value: `${data.stats.completionRate}%`,
      sub: "across all projects",
    },
    {
      label: "Overdue tasks",
      value: data.stats.overdueTasks,
      sub: "need attention",
      alert: data.stats.overdueTasks > 0,
    },
    {
      label: "Team members",
      value: data.stats.totalMembers,
      sub: `${data.stats.totalProjects} projects`,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-[#555] text-sm mt-1">
          Last 30 days across all projects
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-[#111] border rounded-xl p-5 ${
              card.alert ? "border-red-500/20" : "border-[#1a1a1a]"
            }`}
          >
            <p className="text-[#555] text-xs mb-2">{card.label}</p>
            <p
              className={`text-2xl font-semibold mb-1 ${
                card.alert ? "text-red-400" : "text-white"
              }`}
            >
              {card.value}
            </p>
            <p className="text-[#444] text-xs">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* tasks over time chart */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 mb-6">
        <h2 className="text-white font-medium mb-1">Task activity</h2>
        <p className="text-[#555] text-xs mb-6">
          Tasks created vs completed over the last 14 days
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={{ stroke: "#2a2a2a" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                color: "#f5f5f5",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#555" }} />
            <Line
              type="monotone"
              dataKey="created"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Created"
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              name="Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* workload chart */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
          <h2 className="text-white font-medium mb-1">Team workload</h2>
          <p className="text-[#555] text-xs mb-6">Open tasks per member</p>
          {data.workloadData.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-8">
              No assigned tasks yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.workloadData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a1a1a"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#555", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#888", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    color: "#f5f5f5",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="tasks"
                  fill="#2563eb"
                  radius={[0, 4, 4, 0]}
                  name="Open tasks"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* project progress */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
          <h2 className="text-white font-medium mb-1">Project progress</h2>
          <p className="text-[#555] text-xs mb-6">Completion per project</p>
          {data.projectData.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-8">
              No projects yet
            </p>
          ) : (
            <div className="space-y-4">
              {data.projectData.map((project) => (
                <div key={project.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-[#888] text-xs truncate max-w-[140px]">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#444] text-xs">
                        {project.done}/{project.total}
                      </span>
                      <span className="text-white text-xs font-medium w-8 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
