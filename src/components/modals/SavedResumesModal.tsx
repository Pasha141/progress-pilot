/**
 * @file src/components/modals/SavedResumesModal.tsx
 * Cloud & Local Saved Resumes Manager for Resume Builder by Junaid.
 * Allows users to save multiple resume versions, switch drafts, duplicate, rename,
 * and sync across cloud and browser storage.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, TemplateId } from '../../types/resume';
import { CURATED_TEMPLATES } from '../../data/templatesData';
import { EMPTY_RESUME } from '../../data/sampleResume';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  X,
  Check,
  FolderOpen,
  Calendar,
  Sparkles,
  Cloud,
  HardDrive,
  LogOut,
  User,
  ArrowRight,
  Save,
  CheckCircle2,
} from 'lucide-react';

export interface SavedResumeItem {
  id: string;
  title: string;
  templateId: string;
  accentColor: string;
  content: ResumeData;
  updatedAt: string;
}

interface SavedResumesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: ResumeData;
  currentTemplateId: TemplateId;
  currentAccent: string;
  lastSavedTime: string;
  user: { email: string; name: string } | null;
  onLoadResume: (resume: ResumeData, templateId?: TemplateId, accent?: string) => void;
  onLogout: () => void;
  onNavigateToLogin: () => void;
  onNavigateToRegister?: () => void;
}

const LOCAL_RESUMES_KEY = 'saved_resumes_list_v2';

const getResponseErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const payload = body as { error?: unknown; message?: unknown; detail?: unknown };
      const error = payload.error ?? payload.message ?? payload.detail;
      if (typeof error === 'string' && error.trim()) return error;
    }
  } catch {
    // Use the status-based message for empty or non-JSON responses.
  }

  return `${fallback} (HTTP ${response.status}).`;
};

const getStoredAuthToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

export const SavedResumesModal: React.FC<SavedResumesModalProps> = ({
  isOpen,
  onClose,
  currentResume,
  currentTemplateId,
  currentAccent,
  lastSavedTime,
  user,
  onLoadResume,
  onLogout,
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const [resumes, setResumes] = useState<SavedResumeItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isStatusError, setIsStatusError] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetBlank, setConfirmResetBlank] = useState<boolean>(false);
  const isSavingRef = useRef(false);
  const isDeletingRef = useRef(false);
  const serverBackedIdsRef = useRef(new Set<string>());
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  const normalizeServerResume = (raw: any): SavedResumeItem => ({
    id: String(raw.id),
    title: raw.title || 'Untitled Resume',
    templateId: raw.templateId || raw.template_id || raw.content?._meta?.templateId || 'tmpl-1',
    accentColor: raw.accentColor || raw.accent_color || raw.content?._meta?.accentColor || '#C98B5E',
    content: raw.content || EMPTY_RESUME,
    updatedAt: raw.updatedAt || raw.updated_at || raw.createdAt || raw.created_at || new Date().toISOString(),
  });

  // Load resumes from both server (/api/resumes) and localStorage
  const fetchResumes = async () => {
    let localList: SavedResumeItem[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_RESUMES_KEY);
      if (stored) {
        localList = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }

    const token = getStoredAuthToken();
    if (token) {
      try {
        const res = await fetch(`${apiBase}/api/resumes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const serverItems: SavedResumeItem[] = Array.isArray(data)
            ? data.map(normalizeServerResume)
            : Array.isArray(data?.resumes)
              ? data.resumes.map(normalizeServerResume)
              : [];
          serverBackedIdsRef.current = new Set(serverItems.map((item) => item.id));
          const combined = [...serverItems];
          localList.forEach((local) => {
            if (!combined.some((c) => String(c.id) === String(local.id))) {
              combined.push(local);
            }
          });
          setResumes(combined);
          return;
        }
      } catch (err) {
        console.warn('Server resumes fetch fallback:', err);
      }
    }

    serverBackedIdsRef.current = new Set();
    setResumes(localList);
  };

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
      setNewTitle(
        currentResume.personalInfo.fullName
          ? `${currentResume.personalInfo.fullName} - ${currentResume.personalInfo.jobTitle || 'Resume'}`
          : 'My Resume Version'
      );
    }
  }, [isOpen]);

  const showStatus = (msg: string, isError = false) => {
    setStatusMessage(msg);
    setIsStatusError(isError);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleSaveCurrentAs = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    const titleToSave = newTitle.trim() || 'Untitled Resume Version';
    setIsSaving(true);

    const newItem: SavedResumeItem = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: titleToSave,
      templateId: currentTemplateId,
      accentColor: currentAccent,
      content: currentResume,
      updatedAt: new Date().toISOString(),
    };

    // Save to server (compatible with both Express and FastAPI ResumeCreate schemas)
    const token = getStoredAuthToken();
    let cloudSaveError = '';
    if (token) {
      try {
        const createRes = await fetch(`${apiBase}/api/resumes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: titleToSave,
            templateId: currentTemplateId,
            template_id: currentTemplateId,
            accentColor: currentAccent,
            accent_color: currentAccent,
            content: currentResume,
          }),
        });
        if (!createRes.ok) {
          throw new Error(
            await getResponseErrorMessage(createRes, 'Unable to save resume to the server')
          );
        }

        const created: unknown = await createRes.json();
        const serverRecord =
          created && typeof created === 'object' && 'resume' in created
            ? created.resume
            : created;
        if (
          !serverRecord ||
          typeof serverRecord !== 'object' ||
          !('id' in serverRecord) ||
          serverRecord.id === undefined
        ) {
          throw new Error('The server did not confirm the saved resume ID.');
        }
        newItem.id = String(serverRecord.id);
        serverBackedIdsRef.current.add(newItem.id);
      } catch (error) {
        cloudSaveError =
          error instanceof Error ? error.message : 'Unable to save resume to the server.';
      }
    }

    const syncedLocal = [newItem, ...resumes.filter((r) => String(r.id) !== String(newItem.id))];
    let localSaveFailed = false;
    try {
      localStorage.setItem(LOCAL_RESUMES_KEY, JSON.stringify(syncedLocal));
    } catch {
      localSaveFailed = true;
    }
    setResumes(syncedLocal);
    setIsSaving(false);
    isSavingRef.current = false;
    if (cloudSaveError) {
      showStatus(
        localSaveFailed
          ? `Cloud save failed and browser storage is unavailable. ${cloudSaveError}`
          : `Cloud save failed; saved only in this browser. ${cloudSaveError}`,
        true
      );
    } else if (token) {
      showStatus(`Saved "${titleToSave}" to your account ✓`);
    } else if (localSaveFailed) {
      showStatus('Browser storage is unavailable; the resume was not saved.', true);
    } else {
      showStatus(`Saved "${titleToSave}" locally in this browser.`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeletingRef.current) return;
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);

    const isServerBacked =
      serverBackedIdsRef.current.has(String(id)) || String(id).startsWith('resume-');
    const token = getStoredAuthToken();
    if (isServerBacked && !token) {
      showStatus('Sign in again before deleting this account-saved resume.', true);
      return;
    }

    if (isServerBacked && token) {
      isDeletingRef.current = true;
      setDeletingId(id);
      try {
        const response = await fetch(`${apiBase}/api/resumes/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(response, 'Unable to delete resume from the server')
          );
        }
      } catch (error) {
        showStatus(
          error instanceof Error ? error.message : 'Unable to delete resume from the server.',
          true
        );
        isDeletingRef.current = false;
        setDeletingId(null);
        return;
      }
    }

    const filtered = resumes.filter((resume) => String(resume.id) !== String(id));
    setResumes(filtered);
    try {
      localStorage.setItem(LOCAL_RESUMES_KEY, JSON.stringify(filtered));
    } catch {
      if (!isServerBacked) {
        showStatus('Resume removed from this view, but browser storage could not be updated.', true);
        isDeletingRef.current = false;
        setDeletingId(null);
        return;
      }
    }

    if (isServerBacked) serverBackedIdsRef.current.delete(String(id));
    showStatus(
      isServerBacked ? 'Resume deleted from your account.' : 'Local-only resume draft deleted.'
    );
    isDeletingRef.current = false;
    setDeletingId(null);
  };

  const handleDuplicate = (item: SavedResumeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned: SavedResumeItem = {
      ...item,
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${item.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };

    const updated = [cloned, ...resumes];
    setResumes(updated);
    try {
      localStorage.setItem(LOCAL_RESUMES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    showStatus(`Duplicated "${item.title}"`);
  };

  const handleLoad = (item: SavedResumeItem) => {
    onLoadResume(item.content, item.templateId as TemplateId, item.accentColor);
    onClose();
  };

  const handleCreateNewBlank = () => {
    if (!confirmResetBlank) {
      setConfirmResetBlank(true);
      return;
    }
    setConfirmResetBlank(false);
    onLoadResume(EMPTY_RESUME);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#291C0E]/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#FBF5EC] dark:bg-[#241B16] border border-[#E1D4C2] dark:border-[#3D2C23] rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden shadow-2xl text-[#291C0E] dark:text-[#F5EBE0]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E1D4C2] dark:border-[#3D2C23] bg-[#F4E6D2]/60 dark:bg-[#1E1612]/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E1D4C2] dark:bg-[#352720] border border-[#BEB5A9] dark:border-[#4A372D] flex items-center justify-center text-[#C98B5E] dark:text-[#DF9F70]">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-[#291C0E] dark:text-[#F5EBE0] font-serif">My Resumes & Cloud Storage</h3>
                {user ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Cloud className="w-3 h-3" /> Cloud Synced
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E1D4C2] dark:bg-[#352720] text-[#291C0E] dark:text-[#E8B892] border border-[#BEB5A9] dark:border-[#4A372D] flex items-center gap-1">
                    <HardDrive className="w-3 h-3" /> Local Storage
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6E473B] dark:text-[#D2BFA9]">
                {user ? `Logged in as ${user.name} (${user.email})` : 'Private offline storage in this browser.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#E1D4C2] dark:hover:bg-[#352720] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            role={isStatusError ? 'alert' : 'status'}
            className={`p-2.5 border-b text-xs font-semibold flex items-center justify-center gap-2 ${
              isStatusError
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${
                isStatusError
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Save Current Resume Draft Box */}
          <div className="p-4 rounded-2xl bg-[#F4E6D2]/40 border border-[#E1D4C2] space-y-3">
            <span className="text-xs font-bold text-[#291C0E] uppercase tracking-wider block">
              Save Current Resume Version
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Google SWE Application, Data Analyst Version..."
                className="flex-1 bg-[#FBF5EC] border border-[#E1D4C2] rounded-xl px-3 py-2 text-xs text-[#291C0E] placeholder:text-[#A78D78] outline-none focus:border-[#C98B5E]"
              />
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveCurrentAs}
                className="px-4 py-2 bg-[#C98B5E] hover:bg-[#B5774A] text-[#291C0E] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 font-sans shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>
            </div>
          </div>

          {/* List of Saved Resumes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#291C0E] uppercase tracking-wider">
                Saved Resumes ({resumes.length})
              </span>
              <button
                type="button"
                onClick={handleCreateNewBlank}
                className="text-xs font-semibold text-[#C98B5E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{confirmResetBlank ? 'Click again to confirm blank draft' : '+ New Blank Resume'}</span>
              </button>
            </div>

            {resumes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#E1D4C2] rounded-2xl bg-[#F4E6D2]/20 space-y-2">
                <FileText className="w-8 h-8 text-[#6E473B] mx-auto opacity-65" />
                <p className="text-sm font-semibold text-[#291C0E]">No saved resume versions yet</p>
                <p className="text-xs text-[#6E473B] max-w-sm mx-auto">
                  Type a name above and click "Save Draft" to bookmark different versions for software engineer, data analyst, or manager roles.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.map((item) => {
                  const tmplMeta =
                    CURATED_TEMPLATES.find((t) => t.id === item.templateId) || CURATED_TEMPLATES[0];
                  const candidateName = item.content.personalInfo.fullName || 'Untitled';
                  const candidateTitle = item.content.personalInfo.jobTitle || 'Candidate';
                  const formattedDate = new Date(item.updatedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleLoad(item)}
                      className="p-3.5 rounded-2xl bg-[#FBF5EC] hover:bg-[#F4E6D2] border border-[#E1D4C2] hover:border-[#BEB5A9] transition flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: item.accentColor || '#C98B5E' }}
                        >
                          <FileText className="w-4 h-4 text-[#291C0E]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#291C0E] truncate group-hover:text-[#6E473B] transition">
                              {item.title}
                            </h4>
                            <span className="text-[10px] px-2 py-0.2 rounded-md bg-[#E1D4C2] text-[#6E473B] border border-[#BEB5A9] shrink-0">
                              {tmplMeta.name.split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-[#6E473B] truncate mt-0.5">
                            {candidateName} • {candidateTitle}
                          </p>
                          <span className="text-[10px] text-[#6E473B]/85 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(item, e)}
                          className="p-2 rounded-xl text-[#6E473B] hover:text-[#291C0E] hover:bg-[#E1D4C2] transition"
                          title="Duplicate this resume"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId !== null}
                          onClick={(e) => handleDelete(item.id, e)}
                          className={`p-2 rounded-xl transition ${
                            confirmDeleteId === item.id
                              ? 'bg-rose-600 text-white text-[10px] font-bold px-2.5'
                              : 'text-[#6E473B] hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title="Delete this draft"
                        >
                          {deletingId === item.id
                            ? 'Deleting...'
                            : confirmDeleteId === item.id
                              ? 'Confirm?'
                              : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoad(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#C98B5E] text-[#291C0E] hover:bg-[#B5774A] font-bold text-xs transition flex items-center gap-1 shadow-xs"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F4E6D2]/60 dark:bg-[#1E1612]/60 border-t border-[#E1D4C2] dark:border-[#3D2C23] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[#291C0E] dark:text-[#F5EBE0] font-semibold">
                  <User className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                  <span>{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#6E473B] dark:text-[#D2BFA9]">Cloud sync across devices:</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToLogin();
                  }}
                  className="text-[#291C0E] dark:text-[#DF9F70] hover:text-[#C98B5E] font-bold underline underline-offset-4 cursor-pointer"
                >
                  Sign In
                </button>
                {onNavigateToRegister && (
                  <>
                    <span className="text-[#A78D78]">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToRegister();
                      }}
                      className="text-[#291C0E] dark:text-[#DF9F70] hover:text-[#C98B5E] font-bold underline underline-offset-4 cursor-pointer"
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] text-[#291C0E] font-bold text-xs rounded-xl transition cursor-pointer font-sans shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
