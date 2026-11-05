/**
 * @file src/App.tsx
 * Master Application container for Resume Builder by Junaid.
 * Production SaaS Auth, Private Per-Account Cloud Storage & Clean Empty Workspace Architecture:
 * - Public pages: Landing ('landing'), Templates ('templates'), Login ('login'), Register ('register'), Forgot Password ('forgot-password').
 * - Protected pages/tools: Builder ('builder'), My Resumes ('my-resumes'), ATS Checker ('ats-checker'), Cover Letter ('cover-letter'), Resume Revive modal.
 * - Every account starts completely clean (EMPTY_RESUME); sample data loads only on explicit confirmed click.
 * - Single-record cloud save lifecycle: first save POSTs /api/resumes and stores id; subsequent saves PUT /api/resumes/:id (no duplicates).
 * - Unsaved changes warning on both browser unload and in-app navigation away from Builder.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ResumeData, TemplateId, ActivePage, AuthUser } from './types/resume';
import { EMPTY_RESUME, FICTIONAL_SAMPLE_RESUME } from './data/sampleResume';
import { CURATED_TEMPLATES } from './data/templatesData';
import {
  purgeLegacyUnscopedDrafts,
  getAuthToken,
  getUserDraftKeys,
  clearSessionAndDrafts,
  authFetch,
  SESSION_EXPIRED_EVENT,
} from './utils/authSession';
import { Navbar } from './components/Navbar';
import { ResumeForm } from './components/form/ResumeForm';
import { ResumePreview } from './components/preview/ResumePreview';
import { LandingPage } from './pages/LandingPage';
import { CoverLetterPage } from './pages/CoverLetterPage';
import { AtsCheckerPage } from './pages/AtsCheckerPage';
import { MyResumesPage, ServerResumeRecord } from './pages/MyResumesPage';
import { TemplatePreviewModal } from './components/gallery/TemplatePreviewModal';
import { AuthPage } from './pages/AuthPage';
import { Footer } from './components/Footer';
import { AIResumeConverterModal } from './components/ai/AIResumeConverterModal';
import { VoiceResumeAssistant } from './components/voice/VoiceResumeAssistant';
import { ATSScoreModal } from './components/ai/ATSScoreModal';
import {
  Eye,
  Edit3,
  CheckCircle2,
  LayoutGrid,
  Loader2,
  FilePlus2,
  FileText,
  Save,
  User as UserIcon,
  FolderOpen,
  AlertTriangle,
  X,
} from 'lucide-react';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const PROTECTED_PAGES = new Set<ActivePage>([
  'builder',
  'my-resumes',
  'ats-checker',
  'cover-letter',
]);

function pageFromPathname(pathname: string): ActivePage {
  const path = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (path === 'ats-checker') return 'ats-checker';
  if (path === 'cover-letter') return 'cover-letter';
  if (path === 'builder') return 'builder';
  if (path === 'my-resumes') return 'my-resumes';
  if (path === 'templates') return 'templates';
  if (path === 'login') return 'login';
  if (path === 'register') return 'register';
  if (path === 'forgot-password') return 'forgot-password';
  return 'landing';
}

function syncUrlWithPage(page: ActivePage, replace = false) {
  try {
    if (typeof window !== 'undefined') {
      const targetPath = page === 'landing' ? '/' : `/${page}`;
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState(null, '', targetPath);
        } else {
          window.history.pushState(null, '', targetPath);
        }
      }
    }
  } catch {
    // Ignore history API restrictions in sandboxed frames
  }
}

function isResumeBlank(data: ResumeData): boolean {
  const p = data.personalInfo;
  const hasPersonal = Boolean(
    p.fullName?.trim() ||
      p.jobTitle?.trim() ||
      p.email?.trim() ||
      p.phone?.trim() ||
      p.location?.trim() ||
      p.linkedin?.trim() ||
      p.github?.trim() ||
      p.website?.trim()
  );
  const hasSummary = Boolean(data.summary?.trim());
  const hasExp = data.experiences?.length > 0;
  const hasEdu = data.education?.length > 0;
  const hasProj = data.projects?.length > 0;
  const hasSkills = data.skills?.some((cat) => cat.skills && cat.skills.length > 0);
  const hasCerts = data.certifications?.length > 0;
  return !(hasPersonal || hasSummary || hasExp || hasEdu || hasProj || hasSkills || hasCerts);
}

const PAGE_LABELS: Record<ActivePage, string> = {
  landing: 'Homepage',
  templates: 'Templates',
  builder: 'Resume Builder',
  'my-resumes': 'My Resumes',
  'cover-letter': 'Cover Letter Builder',
  'ats-checker': 'ATS Score Checker',
  login: 'Sign In',
  register: 'Create Account',
  'forgot-password': 'Forgot Password',
};

interface PendingRedirect {
  page: ActivePage;
  openRevive?: boolean;
  templateId?: TemplateId;
  accent?: string;
}

export default function App() {
  // Purge any old global unscoped keys immediately on load
  useState(() => {
    purgeLegacyUnscopedDrafts();
  });

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => Boolean(getAuthToken()));
  const [authNotice, setAuthNotice] = useState<string>('');
  const [pendingRedirect, setPendingRedirect] = useState<PendingRedirect | null>(null);

  const [activePage, setActivePage] = useState<ActivePage>(() => {
    try {
      if (typeof window !== 'undefined') {
        return pageFromPathname(window.location.pathname);
      }
    } catch {}
    return 'landing';
  });

  // Clean empty state by default — never pre-filled with sample or owner data
  const [resumeData, setResumeData] = useState<ResumeData>(EMPTY_RESUME);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('tmpl-1');
  const [selectedAccent, setSelectedAccent] = useState<string>('#C98B5E');
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [activeResumeTitle, setActiveResumeTitle] = useState<string>('');

  const activeResumeIdRef = useRef<string | null>(null);
  const saveChainRef = useRef<Promise<boolean>>(Promise.resolve(true));

  useEffect(() => {
    activeResumeIdRef.current = activeResumeId;
  }, [activeResumeId]);

  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [showNotification, setShowNotification] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [isAtsScoreModalOpen, setIsAtsScoreModalOpen] = useState<boolean>(false);
  const [isChangeTemplateModalOpen, setIsChangeTemplateModalOpen] = useState<boolean>(false);

  // Confirmation dialogs (never window.confirm / window.alert)
  const [confirmDialog, setConfirmDialog] = useState<
    | null
    | { type: 'load-sample' }
    | { type: 'new-resume' }
    | { type: 'leave-unsaved'; nextAction: () => void }
  >(null);

  const localDraftTimerRef = useRef<number | null>(null);

  const hydrateUserWorkspace = useCallback((loggedUser: AuthUser) => {
    const keys = getUserDraftKeys(loggedUser.id);
    let loadedResume: ResumeData = EMPTY_RESUME;
    let loadedTemplate: TemplateId = 'tmpl-1';
    let loadedAccent = '#C98B5E';
    let loadedId: string | null = null;
    let loadedTitle = '';

    try {
      const rawDraft = localStorage.getItem(keys.resume);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && typeof parsed === 'object' && parsed.personalInfo) {
          loadedResume = parsed;
        }
      }
      const savedTmpl = localStorage.getItem(keys.template) as TemplateId | null;
      if (savedTmpl && CURATED_TEMPLATES.some((t) => t.id === savedTmpl)) {
        loadedTemplate = savedTmpl;
      }
      const savedAcc = localStorage.getItem(keys.accent);
      if (savedAcc) {
        loadedAccent = savedAcc;
      }
      const savedId = localStorage.getItem(keys.activeResumeId);
      if (savedId) {
        loadedId = savedId;
      }
      const savedTitle = localStorage.getItem(keys.activeResumeTitle);
      if (savedTitle) {
        loadedTitle = savedTitle;
      }
    } catch {
      // Fallback to clean empty state
    }

    setResumeData(loadedResume);
    setSelectedTemplate(loadedTemplate);
    setSelectedAccent(loadedAccent);
    setActiveResumeId(loadedId);
    activeResumeIdRef.current = loadedId;
    setActiveResumeTitle(loadedTitle);
    setSaveStatus('saved');
    setLastSavedTime('');
  }, []);

  // Restore authenticated session on initial mount if token is present in sessionStorage or 7-day Remember Me
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsAuthChecking(false);
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          clearSessionAndDrafts();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.user?.email || data?.email) {
          const restoredUser: AuthUser = {
            id: String(data.user?.id || data.id || data.user?.email || data.email),
            email: data.user?.email || data.email,
            name:
              data.user?.name ||
              data.user?.full_name ||
              data.full_name ||
              (data.user?.email || data.email).split('@')[0],
          };
          setUser(restoredUser);
          hydrateUserWorkspace(restoredUser);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setIsAuthChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hydrateUserWorkspace]);

  // Listen for 401 expired session events across all API calls
  useEffect(() => {
    const onSessionExpired = (ev: Event) => {
      const customEv = ev as CustomEvent<{ message?: string }>;
      const msg = customEv.detail?.message || 'Your session expired. Please sign in again.';
      setUser(null);
      setResumeData(EMPTY_RESUME);
      setActiveResumeId(null);
      activeResumeIdRef.current = null;
      setActiveResumeTitle('');
      setSaveStatus('saved');
      setLastSavedTime('');
      setIsAiModalOpen(false);
      setIsAtsScoreModalOpen(false);
      setIsChangeTemplateModalOpen(false);
      setAuthNotice(msg);
      setActivePage((currentPage) => {
        if (PROTECTED_PAGES.has(currentPage)) {
          setPendingRedirect({ page: currentPage });
        }
        return 'login';
      });
      syncUrlWithPage('login', true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  // Enforce protected routes whenever auth check finishes or URL changes while logged out
  useEffect(() => {
    if (isAuthChecking) return;
    if (!user && PROTECTED_PAGES.has(activePage)) {
      setPendingRedirect((prev) => prev || { page: activePage });
      setAuthNotice(`Please sign in to access ${PAGE_LABELS[activePage]}.`);
      setActivePage('login');
      syncUrlWithPage('login', true);
    }
  }, [isAuthChecking, user, activePage]);

  // Browser back/forward navigation support
  useEffect(() => {
    const onPopState = () => {
      const next = pageFromPathname(window.location.pathname);
      if (!user && PROTECTED_PAGES.has(next)) {
        setPendingRedirect({ page: next });
        setAuthNotice(`Please sign in to access ${PAGE_LABELS[next]}.`);
        setActivePage('login');
        syncUrlWithPage('login', true);
        return;
      }
      setActivePage(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [user]);

  // Warn before closing/reloading browser tab if Builder has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (user && activePage === 'builder' && saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, activePage, saveStatus]);

  // Persist template & accent per-user
  useEffect(() => {
    if (!user) return;
    const keys = getUserDraftKeys(user.id);
    try {
      localStorage.setItem(keys.template, selectedTemplate);
      localStorage.setItem(keys.accent, selectedAccent);
    } catch {}
  }, [user, selectedTemplate, selectedAccent]);

  // Persist activeResumeId & title per-user
  useEffect(() => {
    if (!user) return;
    const keys = getUserDraftKeys(user.id);
    try {
      if (activeResumeId) {
        localStorage.setItem(keys.activeResumeId, activeResumeId);
      } else {
        localStorage.removeItem(keys.activeResumeId);
      }
      if (activeResumeTitle) {
        localStorage.setItem(keys.activeResumeTitle, activeResumeTitle);
      } else {
        localStorage.removeItem(keys.activeResumeTitle);
      }
    } catch {}
  }, [user, activeResumeId, activeResumeTitle]);

  // Handle edits to resumeData inside Builder: mark unsaved + debounce per-user local backup
  const handleResumeChange = useCallback(
    (updated: ResumeData) => {
      setResumeData(updated);
      setSaveStatus('unsaved');
      setErrorBanner('');

      if (user) {
        if (localDraftTimerRef.current) {
          window.clearTimeout(localDraftTimerRef.current);
        }
        const userId = user.id;
        localDraftTimerRef.current = window.setTimeout(() => {
          try {
            localStorage.setItem(getUserDraftKeys(userId).resume, JSON.stringify(updated));
          } catch {}
        }, 600);
      }
    },
    [user]
  );

  // Serialized cloud save: POSTs once when activeResumeId is null, PUTs thereafter (never duplicates)
  const performCloudSave = useCallback(
    (overrideData?: ResumeData, silentToast = false): Promise<boolean> => {
      if (!user) return Promise.resolve(false);

      const snapshotData = overrideData || resumeData;
      const snapshotTemplate = selectedTemplate;
      const snapshotAccent = selectedAccent;
      const computedTitle =
        activeResumeTitle.trim() ||
        snapshotData.personalInfo.fullName.trim() ||
        'Untitled Resume';
      const userKeys = getUserDraftKeys(user.id);

      const nextTask = saveChainRef.current.then(async () => {
        setSaveStatus('saving');
        setErrorBanner('');

        try {
          localStorage.setItem(userKeys.resume, JSON.stringify(snapshotData));
          localStorage.setItem(userKeys.template, snapshotTemplate);
          localStorage.setItem(userKeys.accent, snapshotAccent);
        } catch {}

        try {
          const existingId = activeResumeIdRef.current;
          let savedRecord: any = null;

          if (existingId) {
            const putRes = await authFetch(
              `${API_BASE}/api/resumes/${encodeURIComponent(existingId)}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: computedTitle,
                  templateId: snapshotTemplate,
                  accentColor: snapshotAccent,
                  content: snapshotData,
                }),
              }
            );

            if (putRes.status === 401) return false;

            if (putRes.status === 404) {
              // Resume was deleted externally; create fresh record cleanly
              activeResumeIdRef.current = null;
            } else if (!putRes.ok) {
              const errData = await putRes.json().catch(() => ({}));
              throw new Error(errData.error || 'Could not update your resume.');
            } else {
              const data = await putRes.json().catch(() => ({}));
              savedRecord = data.resume || data;
            }
          }

          if (!activeResumeIdRef.current) {
            const postRes = await authFetch(`${API_BASE}/api/resumes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: computedTitle,
                templateId: snapshotTemplate,
                accentColor: snapshotAccent,
                content: snapshotData,
              }),
            });

            if (postRes.status === 401) return false;
            if (!postRes.ok) {
              const errData = await postRes.json().catch(() => ({}));
              throw new Error(errData.error || 'Could not save your resume.');
            }
            const data = await postRes.json().catch(() => ({}));
            savedRecord = data.resume || data;
          }

          if (savedRecord?.id) {
            const newId = String(savedRecord.id);
            activeResumeIdRef.current = newId;
            setActiveResumeId(newId);
            if (!activeResumeTitle.trim() && savedRecord.title) {
              setActiveResumeTitle(savedRecord.title);
            }
          }

          const timeStr = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastSavedTime(timeStr);
          setSaveStatus('saved');

          if (!silentToast) {
            setShowNotification(`Saved to your account (${timeStr})`);
            window.setTimeout(() => setShowNotification(''), 3000);
          }
          return true;
        } catch (err: unknown) {
          setSaveStatus('error');
          const msg =
            err instanceof Error
              ? err.message
              : 'Unable to save to your account. Please check your connection and try again.';
          setErrorBanner(msg);
          return false;
        }
      });

      saveChainRef.current = nextTask.catch(() => false);
      return nextTask;
    },
    [user, resumeData, selectedTemplate, selectedAccent, activeResumeTitle]
  );

  const handleManualSave = useCallback(() => {
    void performCloudSave(undefined, false);
  }, [performCloudSave]);

  const executeNavigation = useCallback(
    (page: ActivePage) => {
      if (!user && PROTECTED_PAGES.has(page)) {
        setPendingRedirect({ page });
        setAuthNotice(`Please sign in to access ${PAGE_LABELS[page]}.`);
        setActivePage('login');
        syncUrlWithPage('login');
        return;
      }
      if (page !== 'login' && page !== 'register' && page !== 'forgot-password') {
        setAuthNotice('');
      }
      setActivePage(page);
      syncUrlWithPage(page);
    },
    [user]
  );

  // Navigation handler with unsaved-changes guard when leaving Builder
  const handleNavigate = useCallback(
    (page: ActivePage) => {
      if (page === activePage) return;
      if (user && activePage === 'builder' && saveStatus === 'unsaved') {
        setConfirmDialog({
          type: 'leave-unsaved',
          nextAction: () => executeNavigation(page),
        });
        return;
      }
      executeNavigation(page);
    },
    [activePage, user, saveStatus, executeNavigation]
  );

  // Protected Resume Revive modal opener
  const handleOpenResumeRevive = useCallback(() => {
    if (!user) {
      setPendingRedirect({ page: 'builder', openRevive: true });
      setAuthNotice('Please sign in to use AI Resume Revive.');
      setActivePage('login');
      syncUrlWithPage('login');
      return;
    }
    setIsAiModalOpen(true);
  }, [user]);

  const handleSelectTemplate = (tmplId: TemplateId, accent?: string) => {
    if (!user) {
      setPendingRedirect({
        page: 'builder',
        templateId: tmplId,
        accent,
      });
      setAuthNotice('Please sign in to build your resume with this template.');
      setActivePage('login');
      syncUrlWithPage('login');
      return;
    }

    setSelectedTemplate(tmplId);
    if (accent) setSelectedAccent(accent);
    if (activeResumeIdRef.current) {
      setSaveStatus('unsaved');
    }
    executeNavigation('builder');
    setShowNotification('Template applied to your resume!');
    window.setTimeout(() => setShowNotification(''), 3000);
  };

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setAuthNotice('');
    hydrateUserWorkspace(loggedInUser);

    const destination = pendingRedirect;
    setPendingRedirect(null);

    if (destination?.templateId) {
      setSelectedTemplate(destination.templateId);
      if (destination.accent) setSelectedAccent(destination.accent);
    }

    const targetPage =
      destination?.page && !['login', 'register', 'forgot-password'].includes(destination.page)
        ? destination.page
        : 'builder';

    setActivePage(targetPage);
    syncUrlWithPage(targetPage, true);

    if (destination?.openRevive) {
      window.setTimeout(() => setIsAiModalOpen(true), 120);
    }

    setShowNotification(`Welcome, ${loggedInUser.name}!`);
    window.setTimeout(() => setShowNotification(''), 3500);
  };

  const handleLogout = () => {
    clearSessionAndDrafts(user?.id);
    setUser(null);
    setResumeData(EMPTY_RESUME);
    setSelectedTemplate('tmpl-1');
    setSelectedAccent('#C98B5E');
    setActiveResumeId(null);
    activeResumeIdRef.current = null;
    setActiveResumeTitle('');
    setSaveStatus('saved');
    setLastSavedTime('');
    setErrorBanner('');
    setConfirmDialog(null);
    setIsAiModalOpen(false);
    setIsAtsScoreModalOpen(false);
    setIsChangeTemplateModalOpen(false);
    setActivePage('landing');
    syncUrlWithPage('landing', true);
    setShowNotification('You have been signed out.');
    window.setTimeout(() => setShowNotification(''), 3000);
  };

  const handleOpenSavedResume = (record: ServerResumeRecord) => {
    setResumeData(record.content || EMPTY_RESUME);
    const validTmpl = CURATED_TEMPLATES.some((t) => t.id === record.templateId)
      ? (record.templateId as TemplateId)
      : 'tmpl-1';
    setSelectedTemplate(validTmpl);
    setSelectedAccent(record.accentColor || '#C98B5E');
    setActiveResumeId(record.id);
    activeResumeIdRef.current = record.id;
    setActiveResumeTitle(record.title || '');
    setSaveStatus('saved');

    const updatedTime = new Date(record.updatedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setLastSavedTime(updatedTime);

    if (user) {
      const keys = getUserDraftKeys(user.id);
      try {
        localStorage.setItem(keys.resume, JSON.stringify(record.content || EMPTY_RESUME));
        localStorage.setItem(keys.template, validTmpl);
        localStorage.setItem(keys.accent, record.accentColor || '#C98B5E');
        localStorage.setItem(keys.activeResumeId, record.id);
        localStorage.setItem(keys.activeResumeTitle, record.title || '');
      } catch {}
    }

    executeNavigation('builder');
    setShowNotification(`Opened "${record.title}"`);
    window.setTimeout(() => setShowNotification(''), 3000);
  };

  const resetToFreshBlankResume = () => {
    setResumeData(EMPTY_RESUME);
    setActiveResumeId(null);
    activeResumeIdRef.current = null;
    setActiveResumeTitle('');
    setSaveStatus('saved');
    setLastSavedTime('');
    setErrorBanner('');
    if (user) {
      const keys = getUserDraftKeys(user.id);
      try {
        localStorage.setItem(keys.resume, JSON.stringify(EMPTY_RESUME));
        localStorage.removeItem(keys.activeResumeId);
        localStorage.removeItem(keys.activeResumeTitle);
      } catch {}
    }
    executeNavigation('builder');
    setShowNotification('Started a new blank resume.');
    window.setTimeout(() => setShowNotification(''), 3000);
  };

  const handleRequestNewResume = () => {
    if (saveStatus === 'unsaved' || !isResumeBlank(resumeData)) {
      setConfirmDialog({ type: 'new-resume' });
      return;
    }
    resetToFreshBlankResume();
  };

  const handleRequestLoadSample = () => {
    setConfirmDialog({ type: 'load-sample' });
  };

  const handleConfirmLoadSample = () => {
    setConfirmDialog(null);
    setResumeData(FICTIONAL_SAMPLE_RESUME);
    if (!activeResumeTitle.trim()) {
      setActiveResumeTitle('Sample Software Engineer Resume');
    }
    setSaveStatus('unsaved');
    if (user) {
      try {
        localStorage.setItem(
          getUserDraftKeys(user.id).resume,
          JSON.stringify(FICTIONAL_SAMPLE_RESUME)
        );
      } catch {}
    }
    setShowNotification('Sample resume loaded. Click Save if you want to keep a copy.');
    window.setTimeout(() => setShowNotification(''), 3500);
  };

  const handleFormFinish = () => {
    void performCloudSave(undefined, true).then(() => {
      setMobileTab('preview');
      setShowNotification('Resume saved to your account! Opening ATS Score breakdown...');
      window.setTimeout(() => {
        setIsAtsScoreModalOpen(true);
        setShowNotification('');
      }, 450);
    });
  };

  const handleApplyVoiceResume = (newResume: ResumeData, source: 'Voice' | 'Chat' = 'Voice') => {
    if (localDraftTimerRef.current) {
      window.clearTimeout(localDraftTimerRef.current);
      localDraftTimerRef.current = null;
    }

    const title = newResume.personalInfo.fullName.trim()
      ? `${newResume.personalInfo.fullName.trim()} Resume`
      : 'Voice Resume Draft';
    activeResumeIdRef.current = null;
    setActiveResumeId(null);
    setActiveResumeTitle(title);
    setResumeData(newResume);
    setSaveStatus('unsaved');
    setLastSavedTime('');
    setErrorBanner('');
    setIsVoiceAssistantOpen(false);
    setIsAiModalOpen(false);

    if (user) {
      const keys = getUserDraftKeys(user.id);
      try {
        localStorage.setItem(keys.resume, JSON.stringify(newResume));
        localStorage.removeItem(keys.activeResumeId);
        localStorage.setItem(keys.activeResumeTitle, title);
      } catch {}
    }

    executeNavigation('builder');
    setShowNotification(`${source} details loaded into a new unsaved draft. Review and save when ready.`);
    window.setTimeout(() => setShowNotification(''), 4000);
  };

  const currentTemplateMeta =
    CURATED_TEMPLATES.find((t) => t.id === selectedTemplate) || CURATED_TEMPLATES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF5EC] dark:bg-[#1E1612] text-[#291C0E] dark:text-[#F5EBE0] font-sans transition-colors">
      {/* Top Sticky Navbar */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
        onOpenAiConverter={handleOpenResumeRevive}
        onOpenMyResumes={() => handleNavigate('my-resumes')}
      />

      {/* Floating Notification Toast */}
      {showNotification && (
        <div className="bg-[#291C0E] text-[#FBF5EC] px-4 py-2 text-xs no-print flex items-center justify-between border-b border-[#4A372D] sticky top-16 z-30 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#DF9F70]" />
              <span>{showNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowNotification('')}
              className="text-[#D2BFA9] hover:text-[#FBF5EC] text-xs underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Save / API Error Banner */}
      {errorBanner && (
        <div className="bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 px-4 py-2 text-xs no-print border-b border-rose-300 dark:border-rose-700 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorBanner('')}
              className="text-rose-700 dark:text-rose-300 hover:underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Session Verification Loading State */}
      {isAuthChecking ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C98B5E]" />
          <p className="text-xs font-semibold text-[#6E473B] dark:text-[#D2BFA9]">
            Verifying your account session...
          </p>
        </div>
      ) : (
        <>
          {/* Public: Landing Page & 100-Template Gallery */}
          {(activePage === 'landing' || activePage === 'templates') && (
            <LandingPage
              onSelectTemplate={handleSelectTemplate}
              onNavigateToBuilder={() => handleNavigate('builder')}
              onNavigateToLogin={() => handleNavigate('login')}
              onNavigateToAtsChecker={() => handleNavigate('ats-checker')}
              currentTemplateId={selectedTemplate}
              activePage={activePage}
            />
          )}

          {/* Public: Login / Register / Forgot Password */}
          {(activePage === 'login' ||
            activePage === 'register' ||
            activePage === 'forgot-password') && (
            <AuthPage
              onLoginSuccess={handleLoginSuccess}
              onBackToBuilder={() => handleNavigate('builder')}
              onNavigate={handleNavigate}
              initialMode={
                activePage === 'register'
                  ? 'register'
                  : activePage === 'forgot-password'
                    ? 'forgot'
                    : 'login'
              }
              noticeMessage={authNotice}
            />
          )}

          {/* Protected: My Resumes Dashboard */}
          {user && activePage === 'my-resumes' && (
            <MyResumesPage
              user={user}
              activeResumeId={activeResumeId}
              onOpenResume={handleOpenSavedResume}
              onCreateNewResume={handleRequestNewResume}
              onOpenAiConverter={handleOpenResumeRevive}
              onResumeDeleted={(deletedId) => {
                if (activeResumeIdRef.current === deletedId) {
                  setActiveResumeId(null);
                  activeResumeIdRef.current = null;
                }
              }}
              onResumeRenamed={(renamedId, newTitle) => {
                if (activeResumeIdRef.current === renamedId) {
                  setActiveResumeTitle(newTitle);
                }
              }}
            />
          )}

          {/* Protected: Dedicated Cover Letter Builder */}
          {user && activePage === 'cover-letter' && (
            <CoverLetterPage
              onBackToResume={() => handleNavigate('builder')}
              resumeData={resumeData}
              userId={user.id}
            />
          )}

          {/* Protected: Dedicated ATS Score Checker */}
          {user && activePage === 'ats-checker' && (
            <AtsCheckerPage onNavigateToBuilder={() => handleNavigate('builder')} />
          )}

          {/* Protected: Live Resume Builder & Live Unclipped Preview */}
          {user && activePage === 'builder' && (
            <div className="flex flex-col flex-1 bg-[#FBF5EC] dark:bg-[#1E1612] text-[#291C0E] dark:text-[#F5EBE0]">
              {/* Builder Workspace Header Bar */}
              <div className="bg-[#FBF5EC]/95 dark:bg-[#241B16]/95 backdrop-blur-md text-[#291C0E] dark:text-[#F5EBE0] px-4 py-2.5 text-xs no-print shadow-xs border-b border-[#E1D4C2] dark:border-[#3D2C23] sticky top-16 z-20">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
                  {/* Left: Logged-in user greeting, Resume Title & Template Switcher */}
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4E6D2] dark:bg-[#352720] border border-[#E1D4C2] dark:border-[#4A372D] font-bold text-[#291C0E] dark:text-[#F5EBE0]">
                      <UserIcon className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                      <span className="truncate max-w-[140px]">{user.name}</span>
                    </span>

                    <input
                      type="text"
                      value={activeResumeTitle}
                      onChange={(e) => {
                        setActiveResumeTitle(e.target.value);
                        setSaveStatus('unsaved');
                      }}
                      placeholder="Untitled Resume (click to name)"
                      aria-label="Resume title"
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E1612] border border-[#E1D4C2] dark:border-[#4A372D] focus:border-[#C98B5E] outline-none text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] w-44 sm:w-52"
                    />

                    <button
                      type="button"
                      onClick={() => setIsChangeTemplateModalOpen(true)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#F4E6D2] dark:bg-[#352720] hover:bg-[#E1D4C2] dark:hover:bg-[#46342A] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      title={`Active Template: ${currentTemplateMeta?.name}`}
                    >
                      <LayoutGrid className="w-3 h-3 text-[#C98B5E] dark:text-[#DF9F70]" />
                      <span className="truncate max-w-[120px]">{currentTemplateMeta?.name}</span>
                      <span className="text-[#C98B5E] dark:text-[#DF9F70]">• Change</span>
                    </button>
                  </div>

                  {/* Right: Start New Resume, Load Sample Resume, My Resumes & Cloud Save */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRequestNewResume}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#FBF5EC] dark:bg-[#1E1612] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] transition cursor-pointer"
                    >
                      <FilePlus2 className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                      <span>Start a new resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestLoadSample}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#FBF5EC] dark:bg-[#1E1612] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] text-[#6E473B] dark:text-[#D2BFA9] border border-[#E1D4C2] dark:border-[#4A372D] transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                      <span>Load sample resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('my-resumes')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#FBF5EC] dark:bg-[#1E1612] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] text-[#6E473B] dark:text-[#D2BFA9] border border-[#E1D4C2] dark:border-[#4A372D] transition cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                      <span>My Resumes</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={saveStatus === 'saving'}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] transition cursor-pointer shadow-2xs disabled:opacity-60"
                    >
                      {saveStatus === 'saving' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      <span>{saveStatus === 'saving' ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Tab Toggle */}
              <div className="lg:hidden p-3 bg-[#F4E6D2] dark:bg-[#2A1F1A] border-b border-[#E1D4C2] dark:border-[#3D2C23] flex gap-2 no-print">
                <button
                  type="button"
                  onClick={() => setMobileTab('editor')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    mobileTab === 'editor'
                      ? 'bg-[#C98B5E] dark:bg-[#DF9F70] text-[#291C0E] shadow-xs font-bold'
                      : 'bg-[#FBF5EC] dark:bg-[#1E1612] text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Resume Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    mobileTab === 'preview'
                      ? 'bg-[#C98B5E] dark:bg-[#DF9F70] text-[#291C0E] shadow-xs font-bold'
                      : 'bg-[#FBF5EC] dark:bg-[#1E1612] text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview & PDF</span>
                </button>
              </div>

              {/* Main Split-Screen Workspace */}
              <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
                  {/* Left Side: Form Editor with Step-by-Step Flow */}
                  <div
                    className={`lg:col-span-5 h-[calc(100vh-8.5rem)] min-h-[520px] flex flex-col no-print ${
                      mobileTab === 'editor' ? 'block' : 'hidden lg:flex'
                    }`}
                  >
                    <ResumeForm
                      data={resumeData}
                      onChange={handleResumeChange}
                      onManualSave={handleManualSave}
                      saveStatus={saveStatus}
                      lastSavedTime={lastSavedTime}
                      onOpenAiConverter={handleOpenResumeRevive}
                      onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
                      onOpenAtsScore={() => setIsAtsScoreModalOpen(true)}
                      onFinish={handleFormFinish}
                    />
                  </div>

                  {/* Right Side: Live Resume Preview */}
                  <div
                    className={`lg:col-span-7 h-[calc(100vh-8.5rem)] min-h-[520px] flex flex-col print:block print:h-auto ${
                      mobileTab === 'preview' ? 'block' : 'hidden lg:flex'
                    }`}
                  >
                    <ResumePreview
                      data={resumeData}
                      templateId={selectedTemplate}
                      accentColorOverride={selectedAccent}
                      onChangeTemplateClick={() => setIsChangeTemplateModalOpen(true)}
                      onOpenAiConverter={handleOpenResumeRevive}
                      onOpenAtsScore={() => setIsAtsScoreModalOpen(true)}
                    />
                  </div>
                </div>
              </main>

              <Footer />
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialogs (Load Sample, Start New Resume, Unsaved Changes Guard) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#291C0E]/70 backdrop-blur-xs no-print">
          <div className="bg-[#FBF5EC] dark:bg-[#241B16] border border-[#E1D4C2] dark:border-[#3D2C23] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#291C0E] dark:text-[#F5EBE0]">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-serif font-bold">
                {confirmDialog.type === 'load-sample' && 'Load Sample Resume?'}
                {confirmDialog.type === 'new-resume' && 'Start a New Blank Resume?'}
                {confirmDialog.type === 'leave-unsaved' && 'Unsaved Changes'}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="p-1 rounded-lg text-[#6E473B] hover:text-[#291C0E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9] leading-relaxed">
              {confirmDialog.type === 'load-sample' &&
                'This will replace the fields currently in the editor with fictional sample resume data so you can preview how templates look.'}
              {confirmDialog.type === 'new-resume' &&
                (saveStatus === 'unsaved'
                  ? 'You have unsaved changes in your current resume. Starting a new resume will clear the editor and begin a fresh blank record.'
                  : 'This will clear the editor and start a brand-new blank resume. Your previously saved resumes remain safe in My Resumes.')}
              {confirmDialog.type === 'leave-unsaved' &&
                'You have unsaved changes in the Resume Builder. Would you like to save to your account before leaving?'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F4E6D2] dark:bg-[#352720] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] cursor-pointer"
              >
                Cancel
              </button>

              {confirmDialog.type === 'load-sample' && (
                <button
                  type="button"
                  onClick={handleConfirmLoadSample}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] cursor-pointer"
                >
                  Load Sample
                </button>
              )}

              {confirmDialog.type === 'new-resume' && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog(null);
                    resetToFreshBlankResume();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] cursor-pointer"
                >
                  Start Blank Resume
                </button>
              )}

              {confirmDialog.type === 'leave-unsaved' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const next = confirmDialog.nextAction;
                      setConfirmDialog(null);
                      setSaveStatus('saved');
                      next();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-600/40 cursor-pointer"
                  >
                    Leave Without Saving
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = confirmDialog.nextAction;
                      setConfirmDialog(null);
                      void performCloudSave(undefined, true).then((ok) => {
                        if (ok) next();
                      });
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] cursor-pointer"
                  >
                    Save & Leave
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Template Modal inside Builder */}
      <TemplatePreviewModal
        isOpen={isChangeTemplateModalOpen}
        initialTemplateId={selectedTemplate}
        onClose={() => setIsChangeTemplateModalOpen(false)}
        onUseTemplate={(tId, accent) => {
          setIsChangeTemplateModalOpen(false);
          handleSelectTemplate(tId, accent);
        }}
      />

      {/* Real-Time Live ATS Score & Target Job Description Matcher */}
      {user && (
        <ATSScoreModal
          isOpen={isAtsScoreModalOpen}
          onClose={() => setIsAtsScoreModalOpen(false)}
          resumeData={resumeData}
          onOpenAiSummary={() => {
            setIsAtsScoreModalOpen(false);
            setActivePage('builder');
          }}
        />
      )}

      {/* AI Resume Converter & Assistant Modal (Protected) */}
      {user && (
        <AIResumeConverterModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApplyChatDraft={handleApplyVoiceResume}
          onApplyResume={(newResume) => {
            setResumeData(newResume);
            if (!activeResumeTitle.trim() && newResume.personalInfo.fullName?.trim()) {
              setActiveResumeTitle(`${newResume.personalInfo.fullName.trim()} Resume`);
            }
            setIsAiModalOpen(false);
            executeNavigation('builder');
            void performCloudSave(newResume, false);
          }}
          currentResume={resumeData}
        />
      )}

      {user && isVoiceAssistantOpen && (
        <VoiceResumeAssistant
          onClose={() => setIsVoiceAssistantOpen(false)}
          onApplyResume={handleApplyVoiceResume}
          currentResumeHasContent={!isResumeBlank(resumeData)}
          savedResumeIsOpen={Boolean(activeResumeId)}
        />
      )}
    </div>
  );
}
