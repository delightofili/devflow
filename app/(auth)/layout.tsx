export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex">
      {/* left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#111] border-r border-[#1a1a1a] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-white font-semibold text-lg">DevFlow</span>
        </div>

        <div>
          <blockquote className="text-[#888] text-lg leading-relaxed mb-6">
            &quot;The platform that finally made our remote team feel like we
            were in the same room. Real-time updates changed everything.&quot;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm font-medium">
              SO
            </div>
            <div>
              <p className="text-white text-sm font-medium">Sarah Okafor</p>
              <p className="text-[#888] text-xs">Lead Developer, TechCorp</p>
            </div>
          </div>
        </div>

        <p className="text-[#444] text-xs">
          © 2025 DevFlow. Built by Delightsome Ofili.
        </p>
      </div>

      {/* right side — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
