import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-6">
          <span className="text-[#333] text-2xl font-bold">404</span>
        </div>
        <h1 className="text-white text-xl font-semibold mb-2">
          Page not found
        </h1>
        <p className="text-[#555] text-sm mb-6 max-w-xs mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access.
        </p>
        <Link
          href="/dashboard"
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          Go to dashboard →
        </Link>
      </div>
    </div>
  );
}
