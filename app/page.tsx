import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* my nav */}
      <nav className="border-b border-[#1a1a1a] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="text-white font-semibold">DevFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[#888] text-sm hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-8 py-24 text-center">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight tracking-tight mb-6">
            The project tool built{" "}
            <span className="text-blue-400">for developers</span>
          </h1>

          <p className="text-[#888] text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Manage tasks, track progress, chat with your team, and ship faster.
            All in one real-time platform designed for how developers actually
            work.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Sign in →
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-16 text-sm text-[#555]">
            {[
              "Real-time updates",
              "Kanban boards",
              "Team chat",
              "AI insights",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
