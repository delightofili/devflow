"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }
  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Login into your account
        </h1>
        <p className="text-[#888] text-sm">
          Start collaborating with your team today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-[#888] text-xs uppercase tracking-wider"
          >
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="example@gmail.com"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-[#888] text-xs uppercase tracking-wider"
          >
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Min. 8 characters"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2a2a2a]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0f0f0f] px-3 text-[#555]">
            or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleGoogle}
        variant="outline"
        className="w-full bg-transparent border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white h-10"
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-[#555] text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
