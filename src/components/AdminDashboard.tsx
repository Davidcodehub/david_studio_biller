import React, { useState } from 'react';
import {
  Music,
  Clock,
  CheckCircle2,
  Copy,
  Plus,
  Search,
  FileAudio,
  TrendingUp,
  CreditCard,
  Check,
  Send,
  Eye,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  Settings,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { ClientProject } from '../types.ts';

interface AdminDashboardProps {
  projects: ClientProject[];
  isLoading: boolean;
  onTogglePaymentStatus: (projectId: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onEditProject: (project: ClientProject) => void;
  onOpenNewTrackModal: () => void;
  onOpenSettingsModal: () => void;
  onSeedInitialProjects?: () => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  projects,
  isLoading,
  onTogglePaymentStatus,
  onDeleteProject,
  onEditProject,
  onOpenNewTrackModal,
  onOpenSettingsModal,
  onSeedInitialProjects,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'verification'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Quick stats calculation
  const totalProjects = projects.length;
  const pendingProjects = projects.filter((p) => !p.isPaid && p.balanceDue > 0);
  const paidProjects = projects.filter((p) => p.isPaid || p.balanceDue === 0);
  const verificationRequested = projects.filter((p) => p.paymentStatus === 'verification_pending');
  const totalPendingAmount = pendingProjects.reduce((sum, p) => sum + p.balanceDue, 0);
  const totalRevenue = projects.reduce((sum, p) => sum + p.totalAmount, 0);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.songTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.genre.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') {
      return !project.isPaid && project.balanceDue > 0;
    }
    if (statusFilter === 'paid') {
      return project.isPaid || project.balanceDue === 0;
    }
    if (statusFilter === 'verification') {
      return project.paymentStatus === 'verification_pending';
    }
    return true;
  });

  const handleCopyClientLink = (project: ClientProject) => {
    const fullShareUrl = `${window.location.origin}/track/${project.id}`;
    navigator.clipboard.writeText(fullShareUrl).then(() => {
      setCopiedId(project.id);
      onShowToast('Link Copied! Shareable client portal URL copied.', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleOpenClientPortal = (projectId: string) => {
    const trackUrl = `/track/${projectId}`;
    window.open(trackUrl, '_blank');
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await onDeleteProject(id);
      setDeleteConfirmId(null);
      onShowToast('Client track deleted from Firestore.', 'info');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to delete track.', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Admin Top Header & Quick Stats */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Studio Master Releases
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Live Cloud Firestore database console · Manage tracks, verify UPI receipts, and issue client vault links.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSettingsModal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#16161A] border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Studio Payment Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">UPI Settings</span>
            </button>

            {onSeedInitialProjects && projects.length === 0 && (
              <button
                type="button"
                onClick={onSeedInitialProjects}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#16161A] border border-[#FFB800]/40 text-[#FFB800] text-xs font-semibold hover:bg-[#202026] transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Seed Sample Projects</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNewTrackModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFB800] text-black font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,85,0,0.35)] hover:shadow-[0_0_25px_rgba(255,85,0,0.5)] transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Client Track</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#16161A] border border-white/[0.08] shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Total Projects</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1 block tabular-nums">{totalProjects}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Music className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#16161A] border border-[#FF5500]/40 shadow-lg glow-ember flex items-center justify-between">
            <div>
              <span className="text-xs text-[#FF5500] font-semibold uppercase tracking-wider block">Pending Payments</span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#FF5500] mt-1 block tabular-nums glow-text-ember">₹{totalPendingAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#16161A] border border-[#FFB800]/40 shadow-lg glow-gold flex items-center justify-between">
            <div>
              <span className="text-xs text-[#FFB800] font-semibold uppercase tracking-wider block">Verification Requests</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#FFB800] mt-1 block tabular-nums glow-text-gold">{verificationRequested.length}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/40 flex items-center justify-center text-[#FFB800]">
              <QrCode className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#16161A] border border-white/[0.08] shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Total Bookings</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-200 mt-1 block tabular-nums">₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#16161A] border border-white/[0.08]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, song title, or genre..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0D0D0F] border border-white/[0.08] text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF5500] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#0D0D0F] rounded-xl border border-white/[0.08] self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-[#16161A] text-white shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            All ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('verification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === 'verification' ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40' : 'text-zinc-400 hover:text-white'}`}
          >
            Pending Verification ({verificationRequested.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === 'pending' ? 'bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40' : 'text-zinc-400 hover:text-white'}`}
          >
            Awaiting UPI ({pendingProjects.length})
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl bg-[#16161A] border border-white/[0.08] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0D0D0F] text-zinc-400 uppercase font-mono text-[11px] border-b border-white/[0.08]">
              <tr>
                <th className="py-4 px-5 font-semibold">Client Project</th>
                <th className="py-4 px-5 font-semibold text-right">Total (₹)</th>
                <th className="py-4 px-5 font-semibold text-right">Balance Due (₹)</th>
                <th className="py-4 px-5 font-semibold text-center">Payment Status</th>
                <th className="py-4 px-5 font-semibold text-center">Share Link</th>
                <th className="py-4 px-5 font-semibold text-right">Reconciliation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
                      <span className="text-zinc-500 font-mono text-xs">Syncing Firestore Vault...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500 text-xs italic">
                    No client projects found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const isPaid = project.isPaid || project.balanceDue === 0;
                  const needsVerification = project.paymentStatus === 'verification_pending';

                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-white/[0.02] transition-colors group ${needsVerification ? 'bg-[#FFB800]/[0.03]' : ''}`}
                    >
                      <td className="py-5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${needsVerification ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800] glow-gold' : 'bg-zinc-800 border-white/[0.08] text-zinc-400'}`}>
                            {project.clientName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm">{project.clientName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <FileAudio className="w-3.5 h-3.5 text-[#FF5500]" />
                              <span className="text-[11px] text-zinc-400">{project.songTitle}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-5 text-right font-mono tabular-nums text-zinc-400">
                        ₹{project.totalAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-5 px-5 text-right whitespace-nowrap font-mono tabular-nums font-bold">
                        {isPaid ? (
                          <span className="text-emerald-400">₹0</span>
                        ) : (
                          <span className={`${needsVerification ? 'text-[#FFB800] glow-text-gold' : 'text-[#FF5500] glow-text-ember'}`}>
                            ₹{project.balanceDue.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="py-5 px-5 text-center">
                        {needsVerification ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#FFB800] text-black animate-pulse shadow-[0_0_15px_rgba(255,184,0,0.4)]">
                              <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
                              VERIFICATION REQUESTED
                            </span>
                            {project.utrNote && (
                              <span className="mt-1 text-[10px] font-mono text-[#FFB800] block max-w-[120px] truncate" title={project.utrNote}>
                                Note: {project.utrNote}
                              </span>
                            )}
                          </div>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            Master Released
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#FF5500]/10 text-[#FF8800] border border-[#FF5500]/30 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            Awaiting UPI
                          </span>
                        )}
                      </td>

                      <td className="py-5 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyClientLink(project)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D0D0F] hover:bg-zinc-800 border border-white/[0.08] text-[11px] font-semibold text-zinc-300 transition-all cursor-pointer"
                          >
                            {copiedId === project.id ? (
                              <span className="text-emerald-400">Copied!</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#FFB800]" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenClientPortal(project.id)}
                            className="p-2 rounded-lg bg-[#0D0D0F] hover:bg-zinc-800 border border-white/[0.08] text-zinc-400 cursor-pointer"
                            title="Open Client Portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onTogglePaymentStatus(project.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                              isPaid
                                ? 'bg-zinc-900 text-zinc-500 hover:text-[#FFB800] border border-white/[0.04]'
                                : needsVerification
                                ? 'bg-gradient-to-r from-[#FFB800] to-[#FF8800] text-black shadow-[0_0_20px_rgba(255,184,0,0.4)]'
                                : 'bg-gradient-to-r from-[#FF5500] to-[#FF8800] text-white shadow-[0_0_15px_rgba(255,85,0,0.3)]'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Revoke Master</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Confirm Payment Received</span>
                              </>
                            )}
                          </button>

                          <div className="w-px h-6 bg-white/[0.04] mx-1" />

                          <button
                            type="button"
                            onClick={() => onEditProject(project)}
                            className="p-2 rounded-lg bg-[#0D0D0F] hover:bg-zinc-800 text-zinc-400 transition-colors cursor-pointer"
                            title="Edit Track"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === project.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteConfirm(project.id)}
                              className="px-2.5 py-2 rounded-lg bg-red-600 text-white text-[10px] font-bold animate-in slide-in-from-right-2"
                            >
                              DELETE?
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(project.id)}
                              className="p-2 rounded-lg bg-[#0D0D0F] hover:bg-red-950/40 hover:text-red-400 text-zinc-600 transition-colors cursor-pointer"
                              title="Delete Track"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
