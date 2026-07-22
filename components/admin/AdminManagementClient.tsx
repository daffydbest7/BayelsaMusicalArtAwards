"use client";

import { useState } from "react";
import {
  UserPlus,
  ShieldCheck,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatDateLong } from "@/lib/utils";

export interface AdminAccount {
  user_id: string;
  email: string;
  role: "super_admin" | "site_manager";
  created_at: string;
  created_by: string | null;
}

interface AdminManagementClientProps {
  initialAdmins: AdminAccount[];
}

export function AdminManagementClient({ initialAdmins }: AdminManagementClientProps) {
  // Data state
  const [admins, setAdmins] = useState<AdminAccount[]>(initialAdmins);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<"site_manager" | "super_admin">("site_manager");
  const [showPassword, setShowPassword] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: "revoke" | "role_change";
    userId: string;
    email: string;
    newRole?: "super_admin" | "site_manager";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/admins");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to load admin accounts.");
      setAdmins(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !invitePassword.trim()) return;

    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          password: invitePassword,
          role: inviteRole,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create admin account.");

      showSuccess(`Admin account created for ${inviteEmail.trim()}.`);
      setInviteEmail("");
      setInvitePassword("");
      setInviteRole("site_manager");
      setShowInviteForm(false);
      await fetchAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invite failed.";
      setError(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async () => {
    if (!confirmAction || confirmAction.type !== "role_change" || !confirmAction.newRole) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: confirmAction.userId,
          role: confirmAction.newRole,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to change role.");

      showSuccess(`Role updated to ${confirmAction.newRole} for ${confirmAction.email}.`);
      setConfirmAction(null);
      await fetchAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Role change failed.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirmAction || confirmAction.type !== "revoke") return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/admins?user_id=${encodeURIComponent(confirmAction.userId)}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to revoke access.");

      showSuccess(`Admin access revoked for ${confirmAction.email}.`);
      setConfirmAction(null);
      await fetchAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Revoke failed.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto px-4 pb-16">
      {/* Title + Invite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-gold uppercase tracking-wide">
            Administrators
          </h1>
          <p className="font-sans text-xs text-brand-white/60 mt-1">
            Provision, manage roles, and revoke admin access. Super Admin only.
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          {showInviteForm ? "Cancel" : "New Admin"}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-brand-status-rejected/10 border border-brand-status-rejected/30 rounded-md p-4 flex items-center gap-3 text-brand-status-rejected">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-sans text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-brand-status-approved/10 border border-brand-status-approved/30 rounded-md p-4 flex items-center gap-3 text-brand-status-approved animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="font-sans text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Invite Form */}
      <AnimatePresence>
        {showInviteForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleInvite}
              className="bg-brand-surface rounded-md border border-brand-brown-deep shadow-lg shadow-black/40 p-5 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-brand-brown-deep/40 pb-3">
                <UserPlus className="w-5 h-5 text-brand-gold" />
                <h3 className="font-heading text-sm font-bold text-brand-white uppercase tracking-wider">
                  Create Admin Account
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block font-sans text-xs font-bold text-brand-white/60 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2.5 rounded focus:outline-none focus:border-brand-gold text-sm font-sans placeholder:text-brand-white/20"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-sans text-xs font-bold text-brand-white/60 uppercase tracking-wider mb-2">
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2.5 pr-10 rounded focus:outline-none focus:border-brand-gold text-sm font-sans placeholder:text-brand-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-brand-white/40 hover:text-brand-white/70 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block font-sans text-xs font-bold text-brand-white/60 uppercase tracking-wider mb-2">
                  Role
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteRole("site_manager")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded border text-xs font-heading font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                      inviteRole === "site_manager"
                        ? "bg-brand-gold/10 border-brand-gold text-brand-gold"
                        : "bg-brand-bg border-brand-brown-deep text-brand-white/60 hover:text-brand-white hover:bg-brand-surface/50"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Site Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("super_admin")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded border text-xs font-heading font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                      inviteRole === "super_admin"
                        ? "bg-brand-gold/10 border-brand-gold text-brand-gold"
                        : "bg-brand-bg border-brand-brown-deep text-brand-white/60 hover:text-brand-white hover:bg-brand-surface/50"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Super Admin
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors disabled:opacity-40"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {inviting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Accounts Table */}
      {admins.length === 0 ? (
        <div className="bg-brand-surface rounded-md border border-brand-brown-deep p-12 text-center shadow-black/40">
          <p className="font-sans text-sm text-brand-white/60">No admin accounts found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-md border border-brand-brown-deep/60 bg-brand-surface/40 shadow-lg shadow-black/60">
            <table className="w-full border-collapse text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-brown-deep bg-brand-surface text-brand-white/60 uppercase tracking-wider text-[11px] font-bold">
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Added</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown-deep/20">
                {admins.map((admin) => (
                  <tr key={admin.user_id} className="hover:bg-brand-surface/20 transition-colors">
                    <td className="p-4 text-brand-white font-medium">{admin.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          admin.role === "super_admin"
                            ? "bg-brand-gold/10 text-brand-gold border-brand-gold/25"
                            : "bg-brand-white/5 text-brand-white/70 border-brand-white/15"
                        }`}
                      >
                        {admin.role === "super_admin" ? "Super Admin" : "Site Manager"}
                      </span>
                    </td>
                    <td className="p-4 text-brand-white/60 text-xs">
                      {formatDateLong(admin.created_at)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Toggle Role */}
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: "role_change",
                              userId: admin.user_id,
                              email: admin.email,
                              newRole:
                                admin.role === "super_admin"
                                  ? "site_manager"
                                  : "super_admin",
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface hover:bg-brand-brown-deep/30 border border-brand-brown-deep text-brand-white rounded text-xs font-semibold cursor-pointer transition-colors"
                          title={`Change to ${admin.role === "super_admin" ? "Site Manager" : "Super Admin"}`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Role
                        </button>

                        {/* Revoke */}
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: "revoke",
                              userId: admin.user_id,
                              email: admin.email,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-brand-status-rejected/40 text-brand-status-rejected hover:bg-brand-status-rejected/10 rounded text-xs font-semibold cursor-pointer transition-colors"
                          title="Revoke admin access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {admins.map((admin) => (
              <div
                key={admin.user_id}
                className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow shadow-black/40 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="block font-sans text-sm text-brand-white font-medium truncate">
                      {admin.email}
                    </span>
                    <span className="block text-[10px] text-brand-white/40 mt-0.5">
                      Added {formatDate(admin.created_at)}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      admin.role === "super_admin"
                        ? "bg-brand-gold/10 text-brand-gold border-brand-gold/25"
                        : "bg-brand-white/5 text-brand-white/70 border-brand-white/15"
                    }`}
                  >
                    {admin.role === "super_admin" ? "Super Admin" : "Site Manager"}
                  </span>
                </div>
                <div className="flex gap-2 border-t border-brand-brown-deep/20 pt-3">
                  <button
                    onClick={() =>
                      setConfirmAction({
                        type: "role_change",
                        userId: admin.user_id,
                        email: admin.email,
                        newRole:
                          admin.role === "super_admin" ? "site_manager" : "super_admin",
                      })
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-bg border border-brand-brown-deep text-brand-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Change Role
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAction({
                        type: "revoke",
                        userId: admin.user_id,
                        email: admin.email,
                      })
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-brand-status-rejected/40 text-brand-status-rejected hover:bg-brand-status-rejected/10 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-brand-brown-deep w-full max-w-md rounded-md shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-brand-brown-deep/50 bg-brand-bg">
                <h2 className="font-heading text-base font-bold text-brand-white uppercase">
                  {confirmAction.type === "revoke" ? "Confirm Revocation" : "Confirm Role Change"}
                </h2>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="p-1 rounded-full hover:bg-brand-brown-deep/20 text-brand-white/60 hover:text-brand-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {confirmAction.type === "revoke" ? (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded bg-brand-status-rejected/5 border border-brand-status-rejected/20">
                      <AlertTriangle className="w-5 h-5 text-brand-status-rejected shrink-0 mt-0.5" />
                      <div>
                        <p className="font-sans text-sm text-brand-white font-medium">
                          Remove admin access for:
                        </p>
                        <p className="font-mono text-xs text-brand-gold mt-1">
                          {confirmAction.email}
                        </p>
                      </div>
                    </div>
                    <p className="font-sans text-xs text-brand-white/60">
                      This will remove the admin role. The authentication account will remain but will
                      no longer have access to the admin portal.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-sm text-brand-white">
                      Change role for{" "}
                      <span className="font-mono text-brand-gold">{confirmAction.email}</span> to:
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded bg-brand-bg border border-brand-brown-deep">
                      {confirmAction.newRole === "super_admin" ? (
                        <ShieldCheck className="w-5 h-5 text-brand-gold" />
                      ) : (
                        <Shield className="w-5 h-5 text-brand-white/70" />
                      )}
                      <span className="font-heading text-sm font-bold text-brand-white uppercase tracking-wider">
                        {confirmAction.newRole === "super_admin" ? "Super Admin" : "Site Manager"}
                      </span>
                    </div>
                    {confirmAction.newRole === "super_admin" && (
                      <p className="font-sans text-xs text-brand-status-pending">
                        ⚠ Super Admin has full access including raw voter data and admin management.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-brand-brown-deep/50 bg-brand-bg flex justify-end gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.type === "revoke" ? handleRevoke : handleRoleChange}
                  disabled={actionLoading}
                  className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors disabled:opacity-40 ${
                    confirmAction.type === "revoke"
                      ? "bg-brand-status-rejected hover:bg-brand-status-rejected/90 text-brand-white"
                      : "bg-brand-gold hover:bg-brand-gold/90 text-brand-bg"
                  }`}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmAction.type === "revoke" ? "Revoke Access" : "Change Role"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
