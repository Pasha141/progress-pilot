/**
 * @file src/pages/MyResumesPage.tsx
 * Protected "My Resumes" dashboard page listing strictly the signed-in user's server-saved resumes.
 * All operations (List, Open, Rename, Duplicate, Delete) go strictly through authenticated /api/resumes endpoints.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthUser, ResumeData, TemplateId } from '../types/resume';
import { CURATED_TEMPLATES } from '../data/templatesData';
import { EMPTY_RESUME } from '../data/sampleResume';
import { authFetch } from '../utils/authSession';
import { Footer } from '../components/Footer';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  Calendar,
  Cloud,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  FolderOpen,
} from 'lucide-react';

export interface ServerResumeRecord {
  id: string;
  title: string;
  templateId: string;
  accentColor: string;
  content: ResumeData;
  updatedAt: string;
}

interface MyResumesPageProps {
  user: AuthUser;
  activeResumeId: string | null;
  onOpenResume: (record: ServerResumeRecord) => void;
  onCreateNewResume: () => void;
  onOpenAiConverter?: () => void;
  onResumeDeleted?: (deletedId: string) => void;
  onResumeRenamed?: (id: string, newTitle: string) => void;
}

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

function normalizeResume(raw: any): ServerResumeRecord {
  return {
    id: String(raw.id),
    title: raw.title || 'Untitled Resume',
    templateId: raw.templateId || raw.template_id || 'tmpl-1',
    accentColor: raw.accentColor || raw.accent_color || '#C98B5E',
    content: raw.content || EMPTY_RESUME,
    updatedAt: raw.updatedAt || raw.updated_at || raw.createdAt || new Date().toISOString(),
  };
}

export const MyResumesPage: React.FC<MyResumesPageProps> = ({
  user,
  activeResumeId,
  onOpenResume,
  onCreateNewResume,
  onOpenAiConverter,
  onResumeDeleted,
  onResumeRenamed,
}) => {
  const [resumes, setResumes] = useState<ServerResumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Rename inline state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [isSavingRename, setIsSavingRename] = useState<boolean>(false);

  // Duplicate & Delete busy/confirm states
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServerResumeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(''), 3200);
  };

  const loadResumes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authFetch(`${API_BASE}/api/resumes`);
      if (res.status === 401) {
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not load your saved resumes.');
      }
      const list = Array.isArray(data)
        ? data.map(normalizeResume)
        : Array.isArray(data?.resumes)
          ? data.resumes.map(normalizeResume)
          : [];
      setResumes(list);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to fetch your resumes right now. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handleStartRename = (item: ServerResumeRecord) => {
    setRenamingId(item.id);
    setRenameValue(item.title);
  };

  const handleSaveRename = async (item: ServerResumeRecord) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setIsSavingRename(true);
    setErrorMessage('');
    try {
      const res = await authFetch(`${API_BASE}/api/resumes/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.status === 401) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rename resume.');
      }
      const updated = normalizeResume(data.resume || { ...item, title: trimmed, updatedAt: new Date().toISOString() });
      setResumes((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      if (onResumeRenamed) {
        onResumeRenamed(item.id, updated.title);
      }
      setRenamingId(null);
      showToast(`Renamed to "${updated.title}"`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not rename resume.');
    } finally {
      setIsSavingRename(false);
    }
  };

  const handleDuplicate = async (item: ServerResumeRecord) => {
    setDuplicatingId(item.id);
    setErrorMessage('');
    try {
      const copyTitle = `${item.title} (Copy)`;
      const res = await authFetch(`${API_BASE}/api/resumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: copyTitle,
          templateId: item.templateId,
          accentColor: item.accentColor,
          content: item.content,
        }),
      });
      if (res.status === 401) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to duplicate resume.');
      }
      const created = normalizeResume(data.resume || data);
      setResumes((prev) => [created, ...prev]);
      showToast(`Created duplicate "${created.title}"`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not duplicate resume.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setErrorMessage('');
    try {
      const res = await authFetch(`${API_BASE}/api/resumes/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      if (res.status === 401) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete resume.');
      }
      const deletedId = deleteTarget.id;
      const deletedTitle = deleteTarget.title;
      setResumes((prev) => prev.filter((r) => r.id !== deletedId));
      setDeleteTarget(null);
      if (onResumeDeleted) {
        onResumeDeleted(deletedId);
      }
      showToast(`Deleted "${deletedTitle}"`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not delete resume.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FBF5EC] dark:bg-[#1E1612] text-[#291C0E] dark:text-[#F5EBE0] transition-colors">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Top Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E1D4C2] dark:border-[#3D2C23]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-[#F4E6D2] dark:bg-[#352720] border border-[#E1D4C2] dark:border-[#4A372D] flex items-center justify-center text-[#C98B5E] dark:text-[#DF9F70]">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#291C0E] dark:text-[#F5EBE0]">
                My Resumes
              </h1>
              {/* High-contrast dark-green Cloud Synced badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700">
                <Cloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Cloud Synced</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9]">
              Private account workspace for <strong>{user.name}</strong> ({user.email})
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenAiConverter && (
              <button
                type="button"
                onClick={onOpenAiConverter}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#F4E6D2] dark:bg-[#352720] hover:bg-[#E1D4C2] dark:hover:bg-[#46342A] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                <span>Import / Revive Resume</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCreateNewResume}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] shadow-md shadow-[#C98B5E]/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Resume</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Error Alert with Retry */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between gap-3 flex-wrap"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadResumes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#241B16] border border-rose-300 dark:border-rose-500/40 font-bold text-rose-800 dark:text-rose-200 hover:bg-rose-100 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-5 rounded-2xl border border-[#E1D4C2] dark:border-[#3D2C23] bg-[#F4E6D2]/40 dark:bg-[#241B16] animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#E1D4C2] dark:bg-[#352720]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 rounded bg-[#E1D4C2] dark:bg-[#352720]" />
                    <div className="h-3 w-1/3 rounded bg-[#E1D4C2]/80 dark:bg-[#352720]/70" />
                  </div>
                </div>
                <div className="h-8 w-full rounded-xl bg-[#E1D4C2]/60 dark:bg-[#352720]/50" />
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center rounded-3xl border-2 border-dashed border-[#E1D4C2] dark:border-[#3D2C23] bg-[#F4E6D2]/30 dark:bg-[#241B16]/60 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F4E6D2] dark:bg-[#352720] border border-[#E1D4C2] dark:border-[#4A372D] flex items-center justify-center text-[#C98B5E] dark:text-[#DF9F70]">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#291C0E] dark:text-[#F5EBE0]">
                No resumes yet. Create your first resume
              </h2>
              <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9] leading-relaxed">
                Start with a clean, blank A4 resume canvas tailored to your career goals. Every resume you save stays strictly private to your account.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={onCreateNewResume}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Resume</span>
              </button>
            </div>
          </div>
        ) : (
          /* Resume Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((item) => {
              const tmplMeta =
                CURATED_TEMPLATES.find((t) => t.id === (item.templateId as TemplateId)) ||
                CURATED_TEMPLATES[0];
              const isCurrent = activeResumeId === item.id;
              const isRenaming = renamingId === item.id;
              const isDuplicating = duplicatingId === item.id;
              const candidateHeadline =
                item.content?.personalInfo?.jobTitle ||
                item.content?.personalInfo?.fullName ||
                'Draft Resume';
              const formattedUpdated = new Date(item.updatedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border bg-[#FFFFFF] dark:bg-[#241B16] transition shadow-xs flex flex-col justify-between gap-4 ${
                    isCurrent
                      ? 'border-[#C98B5E] ring-1 ring-[#C98B5E]/40'
                      : 'border-[#E1D4C2] dark:border-[#3D2C23] hover:border-[#C98B5E]/70'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-black/10"
                      style={{ backgroundColor: item.accentColor || '#C98B5E' }}
                    >
                      <FileText className="w-5 h-5 text-white drop-shadow-xs" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(item);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            autoFocus
                            className="flex-1 min-w-0 px-2.5 py-1.5 text-sm font-semibold rounded-lg bg-[#FBF5EC] dark:bg-[#1E1612] border border-[#C98B5E] text-[#291C0E] dark:text-[#F5EBE0] outline-none"
                          />
                          <button
                            type="button"
                            disabled={isSavingRename}
                            onClick={() => handleSaveRename(item)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                            title="Save title"
                          >
                            {isSavingRename ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingId(null)}
                            className="p-1.5 rounded-lg bg-[#F4E6D2] dark:bg-[#352720] text-[#6E473B] dark:text-[#D2BFA9] cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif font-bold text-base text-[#291C0E] dark:text-[#F5EBE0] truncate">
                            {item.title}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F4E6D2] dark:bg-[#352720] text-[#6E473B] dark:text-[#DF9F70] border border-[#C98B5E]/40">
                              Currently Editing
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-[#6E473B] dark:text-[#D2BFA9] truncate mt-1">
                        Template: <strong>{tmplMeta.name}</strong> • {candidateHeadline}
                      </p>
                      <p className="text-[11px] text-[#8C7360] dark:text-[#A78D78] flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Last updated {formattedUpdated}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Action Bar */}
                  <div className="pt-3 border-t border-[#E1D4C2]/70 dark:border-[#3D2C23] flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartRename(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Rename</span>
                      </button>

                      <button
                        type="button"
                        disabled={isDuplicating}
                        onClick={() => handleDuplicate(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] transition cursor-pointer disabled:opacity-50"
                      >
                        {isDuplicating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>Duplicate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenResume(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] shadow-xs transition cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#291C0E]/70 backdrop-blur-xs">
          <div className="bg-[#FBF5EC] dark:bg-[#241B16] border border-[#E1D4C2] dark:border-[#3D2C23] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#291C0E] dark:text-[#F5EBE0]">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-serif font-bold">Delete Resume?</h3>
              <button
                type="button"
                onClick={() => !isDeleting && setDeleteTarget(null)}
                className="p-1 rounded-lg text-[#6E473B] hover:text-[#291C0E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#291C0E] dark:text-[#F5EBE0]">&ldquo;{deleteTarget.title}&rdquo;</strong>{' '}
              from your account? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F4E6D2] dark:bg-[#352720] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
