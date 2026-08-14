"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface InvitationDetails {
  workspace: { id: string; name: string };
  email: string;
  role: string;
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  const fetchInvitation = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/invite/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvitation(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid or expired invitation";
      setError(message || "Invalid or expired invitation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      if (isSubscribed) {
        await fetchInvitation();
      }
    };
    load();
    return () => {
      isSubscribed = false;
    };
  }, [fetchInvitation]);

  async function handleAccept() {
    if (!session) {
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError("");

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/${data.workspaceId}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error accepting invite, try again!";
      setError(message || "Error accepting invite, try again!");
      setAccepting(false);
    }
  }

  // loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#555] text-sm">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // invalid or expired token
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">×</span>
          </div>
          <h1 className="text-white font-semibold text-lg mb-2">
            Invalid invitation
          </h1>
          <p className="text-[#555] text-sm mb-6">
            {error}. This link may have expired or already been used.
          </p>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            Go to DevFlow →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="text-white font-semibold">DevFlow</span>
        </div>

        {/* card */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">
                {invitation?.workspace.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-white font-semibold text-lg mb-1">
              You&apos;re invited
            </h1>
            <p className="text-[#555] text-sm">
              Join{" "}
              <span className="text-white font-medium">
                {invitation?.workspace.name}
              </span>{" "}
              on DevFlow
            </p>
          </div>

          {/* details */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#555] text-xs uppercase tracking-wider">
                Workspace
              </span>
              <span className="text-white text-sm font-medium">
                {invitation?.workspace.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#555] text-xs uppercase tracking-wider">
                Role
              </span>
              <span className="text-sm">
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    invitation?.role === "ADMIN"
                      ? "bg-blue-500/10 text-blue-400"
                      : invitation?.role === "DEVELOPER"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-[#2a2a2a] text-[#555]"
                  }`}
                >
                  {invitation?.role.toLowerCase()}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#555] text-xs uppercase tracking-wider">
                Invited email
              </span>
              <span className="text-[#888] text-xs">{invitation?.email}</span>
            </div>
          </div>

          {/* not logged in warning */}
          {!session && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 mb-4">
              <p className="text-yellow-400 text-xs">
                You need to sign in to accept this invitation. Make sure to use{" "}
                <span className="font-medium">{invitation?.email}</span>.
              </p>
            </div>
          )}

          {/* logged in as wrong email warning */}
          {session && session.user?.email !== invitation?.email && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
              <p className="text-red-400 text-xs">
                You&apos;re signed in as{" "}
                <span className="font-medium">{session.user?.email}</span>. This
                invitation is for{" "}
                <span className="font-medium">{invitation?.email}</span>.
              </p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <button
            onClick={handleAccept}
            disabled={
              accepting ||
              (!!session && session.user?.email !== invitation?.email)
            }
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {accepting
              ? "Joining..."
              : !session
                ? "Sign in to accept"
                : "Accept invitation"}
          </button>
        </div>

        <p className="text-center text-[#444] text-xs mt-6">
          Invitation expires{" "}
          {invitation?.expiresAt
            ? new Date(invitation.expiresAt).toLocaleDateString()
            : "soon"}
        </p>
      </div>
    </div>
  );
}
