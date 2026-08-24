"use client";
import { useState } from "react";
import { Sparkles, X, AlertTriangle, CheckCircle, Zap } from "lucide-react";

interface Bottleneck {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface Recommendation {
  title: string;
  description: string;
  priority: "immediate" | "soon" | "later";
}

interface Analysis {
  healthScore: number;
  healthLabel: string;
  summary: string;
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  strengths: string[];
}

interface ProjectAnalysisProps {
  projectId: string;
  workspaceId: string;
}

const SEVERITY_STYLES = {
  high: "border-red-500/20 bg-red-500/5",
  medium: "border-yellow-500/20 bg-yellow-500/5",
  low: "border-[#2a2a2a] bg-[#111]",
};

const SEVERITY_DOT = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-[#555]",
};

const PRIORITY_STYLES = {
  immediate: "text-red-400 bg-red-500/10 border-red-500/20",
  soon: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  later: "text-[#555] bg-[#1a1a1a] border-[#2a2a2a]",
};

const HEALTH_COLOR = (score: number) => {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
};

const HEALTH_BG = (score: number) => {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

export default function ProjectAnalysis({
  projectId,
  workspaceId,
}: ProjectAnalysisProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setOpen(true);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/ai-analysis`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* trigger button */}
      <button
        onClick={runAnalysis}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#555] hover:text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {loading ? "Analyzing..." : "AI analysis"}
      </button>

      {/* panel */}
      {open && (
        <div className="fixed right-0 top-12 bottom-0 w-96 bg-[#0f0f0f] border-l border-[#1a1a1a] z-40 flex flex-col shadow-2xl overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium text-sm">
                AI Project Analysis
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#555] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-10 h-10 border-2 border-[#2a2a2a] border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-white text-sm font-medium mb-1">
                  Analyzing your project...
                </p>
                <p className="text-[#555] text-xs">
                  Reviewing tasks, workload, and progress
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <button
                  onClick={runAnalysis}
                  className="text-red-400 hover:text-red-300 text-xs border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                {/* health score */}
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[#555] text-xs uppercase tracking-wider mb-1">
                        Project health
                      </p>
                      <p
                        className={`text-3xl font-bold ${HEALTH_COLOR(analysis.healthScore)}`}
                      >
                        {analysis.healthScore}
                        <span className="text-lg font-normal">/100</span>
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        analysis.healthScore >= 75
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : analysis.healthScore >= 50
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {analysis.healthLabel}
                    </div>
                  </div>

                  {/* health bar */}
                  <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all ${HEALTH_BG(analysis.healthScore)}`}
                      style={{ width: `${analysis.healthScore}%` }}
                    />
                  </div>

                  <p className="text-[#888] text-xs leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* strengths */}
                {analysis.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <h3 className="text-white text-sm font-medium">
                        Strengths
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {analysis.strengths.map((strength, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-[#888]"
                        >
                          <span className="text-green-500 mt-0.5 flex-shrink-0">
                            ✓
                          </span>
                          {strength}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* bottlenecks */}
                {analysis.bottlenecks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <h3 className="text-white text-sm font-medium">
                        Bottlenecks
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {analysis.bottlenecks.map((b, i) => (
                        <div
                          key={i}
                          className={`border rounded-xl p-4 ${SEVERITY_STYLES[b.severity]}`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[b.severity]}`}
                            />
                            <p className="text-white text-xs font-medium">
                              {b.title}
                            </p>
                          </div>
                          <p className="text-[#555] text-xs leading-relaxed">
                            {b.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <h3 className="text-white text-sm font-medium">
                        Recommendations
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {analysis.recommendations.map((r, i) => (
                        <div
                          key={i}
                          className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-white text-xs font-medium">
                              {r.title}
                            </p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border flex-shrink-0 ${PRIORITY_STYLES[r.priority]}`}
                            >
                              {r.priority}
                            </span>
                          </div>
                          <p className="text-[#555] text-xs leading-relaxed">
                            {r.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* re-analyze button */}
                <button
                  onClick={runAnalysis}
                  className="w-full py-2.5 border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#555] hover:text-white text-xs rounded-lg transition-colors"
                >
                  Run analysis again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
