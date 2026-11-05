import React, { useState, useEffect, useRef } from 'react';
import { ActivePage, AuthUser } from '../types/resume';
import { saveAuthToken } from '../utils/authSession';
import { validateEmailStrict, normalizeEmail } from '../utils/emailValidation';
import {
  PasswordStrengthMeter,
  evaluatePasswordCriteria,
} from '../components/auth/PasswordStrengthMeter';
import { OtpVerificationModal } from '../components/auth/OtpVerificationModal';
import { Footer } from '../components/Footer';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  Cloud,
  Sparkles,
  FileCheck2,
  AlertCircle,
  Loader2,
  Home,
  KeyRound,
  Info,
  RefreshCw,
} from 'lucide-react';

type ExternalAuthMode = 'login' | 'register' | 'forgot';

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToBuilder: () => void;
  onNavigate?: (page: ActivePage) => void;
  initialMode?: ExternalAuthMode;
  noticeMessage?: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  resetCode?: string;
  otp?: string;
}

const EMPTY_OTP_DIGITS = ['', '', '', '', '', ''];

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onNavigate,
  initialMode = 'login',
  noticeMessage = '',
}) => {
  const [mode, setMode] = useState<ExternalAuthMode>(initialMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  // Default unchecked: uses sessionStorage so new browser sessions require sign-in unless ticked
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [emailSuggestion, setEmailSuggestion] = useState<string>('');
  const [devNotice, setDevNotice] = useState<string>('');

  // Email OTP Verification Modal & Unverified Login Block States
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState<boolean>(false);
  const [isOtpResending, setIsOtpResending] = useState<boolean>(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string>('');
  const [modalSuccessMessage, setModalSuccessMessage] = useState<string>('');
  const [modalDevNotice, setModalDevNotice] = useState<string>('');
  const [unverifiedLoginEmail, setUnverifiedLoginEmail] = useState<string>('');

  // Forgot / Reset Password States
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [resetCode, setResetCode] = useState<string>('');

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  useEffect(() => {
    setMode(initialMode);
    if (initialMode !== 'forgot') {
      setForgotStep('request');
      setResetCode('');
    }
    setIsVerifyModalOpen(false);
    setOtpDigits(EMPTY_OTP_DIGITS);
    setUnverifiedLoginEmail('');
    setEmailSuggestion('');
    setDevNotice('');
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
  }, [initialMode]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const switchMode = (targetMode: ExternalAuthMode) => {
    if (isLoading || isOtpSubmitting) return;
    setMode(targetMode);
    setIsVerifyModalOpen(false);
    setUnverifiedLoginEmail('');
    setErrorMessage('');
    setSuccessMessage('');
    setDevNotice('');
    setEmailSuggestion('');
    setFieldErrors({});
    if (targetMode === 'forgot') {
      setForgotStep('request');
      setResetCode('');
      setPassword('');
      setConfirmPassword('');
      if (onNavigate) onNavigate('forgot-password');
    } else if (targetMode === 'login' || targetMode === 'register') {
      if (onNavigate) onNavigate(targetMode);
    }
  };

  const applySuggestedEmail = (suggested: string) => {
    setEmail(suggested);
    setEmailSuggestion('');
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
  };

  const validateLoginOrRegister = (): boolean => {
    const nextErrors: FieldErrors = {};
    const trimmedName = name.trim();
    const emailValidation = validateEmailStrict(email);

    if (mode === 'register') {
      if (!trimmedName) {
        nextErrors.name = 'Please enter your full name.';
      } else if (trimmedName.length < 2) {
        nextErrors.name = 'Name must be at least 2 characters.';
      }
    }

    if (!emailValidation.valid) {
      nextErrors.email = emailValidation.error || 'Please enter a valid email address.';
      setEmailSuggestion(emailValidation.suggestion || '');
    } else {
      setEmailSuggestion('');
    }

    if (mode === 'register') {
      const pwCheck = evaluatePasswordCriteria(password);
      if (!pwCheck.isValid) {
        nextErrors.password =
          pwCheck.errorMessage ||
          'Password must include at least 8 characters, a number, and a special character.';
      }
    } else if (!password) {
      nextErrors.password = 'Please enter your password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    } else if (password.length > 128) {
      nextErrors.password = 'Password cannot exceed 128 characters.';
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your password.';
      } else if (confirmPassword !== password) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErrorMessage('');
    setModalSuccessMessage('');

    const targetEmail = normalizeEmail(otpEmail || email);
    const cleanedOtp = otpDigits.join('').trim();
    if (!/^\d{6}$/.test(cleanedOtp)) {
      setFieldErrors((prev) => ({ ...prev, otp: 'Please enter all 6 digits of your verification code.' }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, otp: undefined }));
    setIsOtpSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, otp: cleanedOtp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      // Account is now verified — close modal, switch to Sign In with email ready
      setIsVerifyModalOpen(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setModalDevNotice('');
      setModalErrorMessage('');
      setModalSuccessMessage('');
      setUnverifiedLoginEmail('');
      setErrorMessage('');
      setEmail(targetEmail);
      setConfirmPassword('');
      setMode('login');
      if (onNavigate) onNavigate('login');
      setSuccessMessage('Email verified! Your account is active — sign in below.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to verify code. Please try again.';
      setModalErrorMessage(msg);
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  const handleResendOtp = async (overrideEmail?: string, openModalOnSuccess = true) => {
    if (isOtpResending || isOtpSubmitting) return;
    if (resendCooldown > 0 && isVerifyModalOpen) return;

    const candidateEmail = overrideEmail || otpEmail || unverifiedLoginEmail || email;
    const emailCheck = validateEmailStrict(candidateEmail);
    if (!emailCheck.valid) {
      const errMsg = emailCheck.error || 'Please enter a valid email address.';
      if (isVerifyModalOpen) {
        setModalErrorMessage(errMsg);
      } else {
        setErrorMessage(errMsg);
      }
      return;
    }

    // If still in cooldown from login screen, open the modal directly so user can enter their code
    if (resendCooldown > 0 && !isVerifyModalOpen) {
      setOtpEmail(emailCheck.normalized);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setModalErrorMessage('');
      setModalSuccessMessage('');
      setIsVerifyModalOpen(true);
      return;
    }

    setModalErrorMessage('');
    setModalSuccessMessage('');
    setIsOtpResending(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailCheck.normalized }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (typeof data.cooldownSeconds === 'number') {
          setResendCooldown(data.cooldownSeconds);
        }
        throw new Error(data.error || 'Unable to resend verification code.');
      }

      setOtpEmail(emailCheck.normalized);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setFieldErrors((prev) => ({ ...prev, otp: undefined }));
      setResendCooldown(typeof data.cooldownSeconds === 'number' ? data.cooldownSeconds : 60);
      const nextDevNotice = data.devNotice ? String(data.devNotice) : '';
      setModalDevNotice(nextDevNotice);
      setModalSuccessMessage(
        nextDevNotice
          ? ''
          : data.message || 'A fresh 6-digit verification code has been sent to your email.'
      );
      if (openModalOnSuccess) {
        setErrorMessage('');
        setUnverifiedLoginEmail('');
        setIsVerifyModalOpen(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to resend verification code.';
      if (isVerifyModalOpen) {
        setModalErrorMessage(msg);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsOtpResending(false);
    }
  };

  const handleChangeEmailFromModal = () => {
    setIsVerifyModalOpen(false);
    setOtpDigits(EMPTY_OTP_DIGITS);
    setModalErrorMessage('');
    setModalSuccessMessage('');
    setModalDevNotice('');
    setUnverifiedLoginEmail('');
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    if (mode !== 'register') {
      setMode('register');
      if (onNavigate) onNavigate('register');
    }
    window.setTimeout(() => {
      emailInputRef.current?.focus();
      emailInputRef.current?.select();
    }, 60);
  };

  const openExistingOtpModal = () => {
    const target = normalizeEmail(unverifiedLoginEmail || email);
    if (!target) return;
    setOtpEmail(target);
    setOtpDigits(EMPTY_OTP_DIGITS);
    setModalErrorMessage('');
    setModalSuccessMessage('');
    setFieldErrors((prev) => ({ ...prev, otp: undefined }));
    setIsVerifyModalOpen(true);
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setDevNotice('');

    const emailCheck = validateEmailStrict(email);
    if (!emailCheck.valid) {
      setFieldErrors({ email: emailCheck.error || 'Please enter a valid email address.' });
      setEmailSuggestion(emailCheck.suggestion || '');
      return;
    }
    setEmailSuggestion('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailCheck.normalized }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.suggestion) setEmailSuggestion(String(data.suggestion));
        throw new Error(data.error || data.detail || 'No account found with that email address.');
      }

      setEmail(emailCheck.normalized);
      const nextDevNotice = data.devNotice ? String(data.devNotice) : '';
      setDevNotice(nextDevNotice);
      setForgotStep('reset');
      setSuccessMessage(
        nextDevNotice
          ? ''
          : data.message || 'A 6-digit recovery code has been sent to your email (valid for 15 minutes).'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to request password recovery.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const nextErrors: FieldErrors = {};
    const emailCheck = validateEmailStrict(email);
    if (!emailCheck.valid) {
      nextErrors.email = emailCheck.error || 'Please enter a valid email address.';
    }
    if (!/^\d{6}$/.test(resetCode.trim())) {
      nextErrors.resetCode = 'Enter the 6-digit recovery code.';
    }
    const pwCheck = evaluatePasswordCriteria(password);
    if (!pwCheck.isValid) {
      nextErrors.password =
        pwCheck.errorMessage ||
        'Please enter a password with 8+ characters, a number, and a special character.';
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailCheck.normalized,
          resetCode: resetCode.trim(),
          newPassword: password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Failed to reset password.');
      }

      setPassword('');
      setConfirmPassword('');
      setResetCode('');
      setDevNotice('');
      setForgotStep('request');
      setMode('login');
      if (onNavigate) onNavigate('login');
      setSuccessMessage('Password updated successfully! Sign in with your new password.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setDevNotice('');
    setUnverifiedLoginEmail('');

    if (!validateLoginOrRegister()) {
      return;
    }

    const isLogin = mode === 'login';
    setIsLoading(true);
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name.trim();

    try {
      const endpoint = `${apiBase}${isLogin ? '/api/auth/login' : '/api/auth/register'}`;
      const payload: Record<string, string> = {
        email: normalizedEmail,
        password,
      };
      if (!isLogin) {
        payload.full_name = trimmedName;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        if (data.suggestion) {
          setEmailSuggestion(String(data.suggestion));
          setFieldErrors((prev) => ({
            ...prev,
            email: data.error || `Did you mean ${data.suggestion}?`,
          }));
          setIsLoading(false);
          return;
        }

        // Login blocked for unverified account: stay on Login with "Please verify your email" + Resend button
        if (isLogin && data.requiresVerification) {
          const pendingEmail = String(data.email || normalizedEmail);
          setUnverifiedLoginEmail(pendingEmail);
          if (typeof data.cooldownSeconds === 'number') {
            setResendCooldown(data.cooldownSeconds);
          }
          setErrorMessage(data.error || 'Please verify your email');
          setIsLoading(false);
          return;
        }

        // Registration cooldown hit when an unverified account just requested an OTP seconds ago
        if (!isLogin && data.requiresVerification) {
          const pendingEmail = String(data.email || normalizedEmail);
          setOtpEmail(pendingEmail);
          setOtpDigits(EMPTY_OTP_DIGITS);
          if (typeof data.cooldownSeconds === 'number') {
            setResendCooldown(data.cooldownSeconds);
          }
          setModalErrorMessage(data.error || '');
          setModalSuccessMessage('');
          setIsVerifyModalOpen(true);
          setIsLoading(false);
          return;
        }

        const detail =
          typeof data.detail === 'string'
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
              : data.error;

        if (!isLogin && detail && detail.toLowerCase().includes('email') && res.status === 400) {
          setFieldErrors((prev) => ({ ...prev, email: detail }));
        } else if (isLogin && detail === 'Please enter a real email address.') {
          setFieldErrors((prev) => ({ ...prev, email: detail }));
        }

        throw new Error(
          detail || (isLogin ? 'Wrong email or password' : 'Email already registered')
        );
      }

      // Registration succeeded -> trigger 6-box OTP Verification Modal
      if (data.requiresVerification) {
        const registeredEmail = String(data.email || normalizedEmail);
        setEmail(registeredEmail);
        setOtpEmail(registeredEmail);
        setOtpDigits(EMPTY_OTP_DIGITS);
        setResendCooldown(typeof data.cooldownSeconds === 'number' ? data.cooldownSeconds : 60);
        const nextDevNotice = data.devNotice ? String(data.devNotice) : '';
        setModalDevNotice(nextDevNotice);
        setModalErrorMessage('');
        setModalSuccessMessage(
          nextDevNotice
            ? ''
            : data.message || 'We sent a 6-digit verification code to your email address.'
        );
        setIsVerifyModalOpen(true);
        setIsLoading(false);
        return;
      }

      let resolvedToken: string = data.token || data.access_token || '';
      let resolvedId: string = data.user?.id ? String(data.user.id) : data.id ? String(data.id) : '';
      let resolvedEmail: string = data.user?.email || data.email || normalizedEmail;
      let resolvedName: string =
        data.user?.name || data.user?.full_name || data.full_name || trimmedName;

      if (resolvedToken) {
        // Default: sessionStorage (rememberMe = false). If ticked on login: localStorage with 7-day expiry.
        saveAuthToken(resolvedToken, isLogin ? rememberMe : false);

        if (!resolvedName || !resolvedId) {
          try {
            const meRes = await fetch(`${apiBase}/api/auth/me`, {
              headers: { Authorization: `Bearer ${resolvedToken}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              resolvedId = meData.user?.id ? String(meData.user.id) : String(meData.id || resolvedId);
              resolvedName = meData.user?.name || meData.full_name || resolvedName;
              resolvedEmail = meData.user?.email || meData.email || resolvedEmail;
            }
          } catch {
            // Non-blocking profile lookup
          }
        }
      }

      const finalUser: AuthUser = {
        id: resolvedId || resolvedEmail.toLowerCase(),
        email: resolvedEmail,
        name: resolvedName || resolvedEmail.split('@')[0] || 'Candidate',
      };

      setSuccessMessage('Signed in successfully! Opening your workspace...');

      redirectTimerRef.current = window.setTimeout(() => {
        onLoginSuccess(finalUser);
      }, 280);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof TypeError) {
        setErrorMessage(
          'Unable to reach the authentication server. Please check your connection and try again.'
        );
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(message);
    }
  };

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  const passwordsMatch =
    (isRegister || (isForgot && forgotStep === 'reset')) &&
    confirmPassword.length > 0 &&
    password.length > 0 &&
    confirmPassword === password;
  const passwordsMismatch =
    (isRegister || (isForgot && forgotStep === 'reset')) &&
    confirmPassword.length > 0 &&
    confirmPassword !== password;

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FBF5EC] dark:bg-[#1E1612] text-[#291C0E] dark:text-[#F5EBE0] transition-colors">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
        {/* Contextual Top Navigation Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#2A1F1A] border border-transparent hover:border-[#E1D4C2] dark:hover:border-[#3D2C23] transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                <span>Homepage</span>
              </button>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('templates')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#2A1F1A] border border-transparent hover:border-[#E1D4C2] dark:hover:border-[#3D2C23] transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                <span>Browse Templates</span>
              </button>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F4E6D2] dark:bg-[#2A1F1A] border border-[#E1D4C2] dark:border-[#3D2C23] text-[11px] font-semibold text-[#6E473B] dark:text-[#D2BFA9]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
            <span>Private Account Workspace</span>
          </div>
        </div>

        {/* Main Split Auth Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-[#E1D4C2] dark:border-[#3D2C23] bg-[#FBF5EC] dark:bg-[#241B16] shadow-xl shadow-[#291C0E]/10 dark:shadow-black/40">
          {/* Left Editorial Brand & Career Showcase Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#291C0E] via-[#482E22] to-[#6E473B] dark:from-[#160F0C] dark:via-[#261A14] dark:to-[#3A271E] text-[#FBF5EC] p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#C98B5E]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#DF9F70]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C98B5E] text-[#291C0E] flex items-center justify-center shadow-md shadow-black/20 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm sm:text-base font-serif font-bold tracking-tight text-[#FBF5EC]">
                    ATS Resume Builder <span className="text-[#DF9F70]">by Junaid</span>
                  </span>
                  <span className="block text-[11px] text-[#E1D4C2]/80 font-medium">
                    Recruiter-tested A4 architecture
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold leading-tight text-[#FBF5EC]">
                  {isForgot
                    ? 'Recover access to your resume workspace in seconds.'
                    : isLogin
                      ? 'Pick up right where your career story left off.'
                      : 'Craft a resume engineered to pass every ATS filter.'}
                </h1>
                <p className="text-xs sm:text-sm text-[#E1D4C2]/90 leading-relaxed">
                  Every account gets a private, clean workspace. Save tailored resume versions for every role, benchmark keyword alignment, and export crisp one-page PDFs.
                </p>
              </div>

              <div className="hidden sm:block rounded-2xl bg-[#1E140C]/55 border border-[#DF9F70]/25 p-4 space-y-3 backdrop-blur-xs">
                <div className="flex items-center justify-between border-b border-[#DF9F70]/15 pb-2.5">
                  <div>
                    <div className="text-xs font-serif font-bold text-[#FBF5EC]">
                      Private Cloud Resume Vault
                    </div>
                    <div className="text-[10px] text-[#D2BFA9]">
                      Single-Column Executive • 1-Page A4
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                    96 / 100 ATS
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#FBF5EC]/5 border border-[#FBF5EC]/10 px-2.5 py-2">
                    <span className="block text-[#D2BFA9]">Privacy</span>
                    <span className="font-bold text-[#FBF5EC]">100% Isolated</span>
                  </div>
                  <div className="rounded-lg bg-[#FBF5EC]/5 border border-[#FBF5EC]/10 px-2.5 py-2">
                    <span className="block text-[#D2BFA9]">Formatting</span>
                    <span className="font-bold text-[#FBF5EC]">Parser Ready</span>
                  </div>
                  <div className="rounded-lg bg-[#FBF5EC]/5 border border-[#FBF5EC]/10 px-2.5 py-2">
                    <span className="block text-[#D2BFA9]">Cloud Drafts</span>
                    <span className="font-bold text-[#DF9F70]">Account Synced</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-[#FBF5EC]/15 space-y-2.5 text-xs text-[#F4E6D2]">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-[#DF9F70] shrink-0" />
                <span>Private per-account resumes — never shared across users</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-[#DF9F70] shrink-0" />
                <span>100 professional templates with instant PDF &amp; DOCX export</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#DF9F70] shrink-0" />
                <span>AI Resume Revive &amp; real-time ATS score diagnostics</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center bg-[#FBF5EC] dark:bg-[#241B16]">
            <div className="w-full max-w-md mx-auto">
              {/* Mobile/Form Brand Label & Heading */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#C98B5E] dark:text-[#DF9F70] mb-1.5">
                  ATS Resume Builder by Junaid
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#291C0E] dark:text-[#F5EBE0]">
                  {isForgot
                    ? forgotStep === 'request'
                      ? 'Forgot Password?'
                      : 'Set New Password'
                    : isLogin
                      ? 'Welcome Back'
                      : 'Create Your Free Account'}
                </h2>
                <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9] mt-1.5">
                  {isForgot
                    ? forgotStep === 'request'
                      ? 'Enter your account email to receive a 6-digit password recovery code.'
                      : 'Enter the 6-digit recovery code and choose a new password (min. 8 characters).'
                    : isLogin
                      ? 'Sign in to continue building your career.'
                      : 'Start building ATS-friendly resumes with a verified email address.'}
                </p>
              </div>

              {/* Mode Switcher Tabs (Sign In / Create Account) */}
              {!isForgot && (
                <div
                  role="tablist"
                  aria-label="Authentication mode"
                  className="grid grid-cols-2 p-1 bg-[#F4E6D2] dark:bg-[#1E1612] rounded-xl mb-6 border border-[#E1D4C2] dark:border-[#3D2C23]"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isLogin}
                    onClick={() => switchMode('login')}
                    className={`min-h-[40px] py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98B5E] ${
                      isLogin
                        ? 'bg-[#291C0E] dark:bg-[#C98B5E] text-[#FBF5EC] dark:text-[#291C0E] font-bold shadow-xs'
                        : 'text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isRegister}
                    onClick={() => switchMode('register')}
                    className={`min-h-[40px] py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98B5E] ${
                      isRegister
                        ? 'bg-[#291C0E] dark:bg-[#C98B5E] text-[#FBF5EC] dark:text-[#291C0E] font-bold shadow-xs'
                        : 'text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Redirect / Session Notice Banner */}
              {noticeMessage && !errorMessage && !successMessage && (
                <div
                  role="status"
                  className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40 rounded-xl text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5"
                >
                  <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{noticeMessage}</span>
                </div>
              )}

              {/* API Error Alert (+ Unverified Account Resend Action on Login) */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 rounded-xl text-xs text-rose-800 dark:text-rose-200 space-y-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-semibold">{errorMessage}</span>
                  </div>

                  {isLogin && unverifiedLoginEmail && (
                    <div className="pl-6 flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={isOtpResending || resendCooldown > 0}
                        onClick={() => handleResendOtp(unverifiedLoginEmail, true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#291C0E] dark:bg-[#DF9F70] text-[#FBF5EC] dark:text-[#291C0E] text-xs font-bold hover:opacity-90 transition cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        {isOtpResending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {resendCooldown > 0
                            ? `Resend code in ${resendCooldown}s`
                            : 'Resend verification code'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={openExistingOtpModal}
                        className="text-xs font-bold text-rose-900 dark:text-rose-200 underline underline-offset-4 hover:opacity-80 cursor-pointer"
                      >
                        Enter 6-digit code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Success Feedback Banner */}
              {successMessage && (
                <div
                  role="status"
                  className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {/* Dev SMTP Notice Banner (Forgot Password view) */}
              {devNotice && (
                <div
                  role="status"
                  className="mb-5 p-3.5 bg-[#F4E6D2] dark:bg-[#2E221B] border border-[#C98B5E]/60 rounded-xl text-xs text-[#291C0E] dark:text-[#F5EBE0] flex items-start gap-2.5"
                >
                  <Info className="w-4 h-4 text-[#C98B5E] dark:text-[#DF9F70] shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold">{devNotice}</span>
                </div>
              )}

              {isForgot ? (
                forgotStep === 'request' ? (
                  <form onSubmit={handleRequestResetCode} noValidate className="space-y-4">
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0] mb-1.5"
                      >
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="forgot-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailSuggestion('');
                            if (fieldErrors.email) setFieldErrors({});
                          }}
                          className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition focus-visible:ring-2 focus-visible:ring-[#C98B5E]/40 ${
                            fieldErrors.email
                              ? 'border-rose-500'
                              : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E]'
                          }`}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.email}
                        </p>
                      )}
                      {emailSuggestion && (
                        <button
                          type="button"
                          onClick={() => applySuggestedEmail(emailSuggestion)}
                          className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4E6D2] dark:bg-[#2E221B] border border-[#C98B5E] text-xs font-bold text-[#291C0E] dark:text-[#DF9F70] hover:bg-[#E1D4C2] transition cursor-pointer"
                        >
                          <span>Use {emailSuggestion} instead</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[46px] py-3 px-5 rounded-xl text-sm font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] active:scale-[0.99] shadow-md shadow-[#C98B5E]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending recovery code...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send Recovery Code</span>
                        </>
                      )}
                    </button>

                    <div className="pt-4 border-t border-[#E1D4C2] dark:border-[#3D2C23] text-center">
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="text-xs font-bold text-[#6E473B] dark:text-[#DF9F70] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Sign In</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-4">
                    {/* 6-Digit Recovery Code */}
                    <div>
                      <label
                        htmlFor="reset-code"
                        className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0] mb-1.5"
                      >
                        6-Digit Recovery Code
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reset-code"
                          name="one-time-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="123456"
                          value={resetCode}
                          onChange={(e) => {
                            setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                            if (fieldErrors.resetCode) {
                              setFieldErrors((prev) => ({ ...prev, resetCode: undefined }));
                            }
                          }}
                          className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition ${
                            fieldErrors.resetCode
                              ? 'border-rose-500'
                              : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E]'
                          }`}
                        />
                      </div>
                      {fieldErrors.resetCode && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.resetCode}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="reset-new-password"
                          className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0]"
                        >
                          New Password
                        </label>
                        <span className="text-[11px] text-[#6E473B] dark:text-[#A78D78]">
                          8+ chars, number &amp; symbol
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reset-new-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Create new password (8+ chars, number & symbol)"
                          value={password}
                          aria-invalid={Boolean(fieldErrors.password)}
                          aria-describedby="reset-password-strength"
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) {
                              setFieldErrors((prev) => ({ ...prev, password: undefined }));
                            }
                          }}
                          className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition ${
                            fieldErrors.password
                              ? 'border-rose-500'
                              : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.password}
                        </p>
                      )}

                      <PasswordStrengthMeter
                        password={password}
                        id="reset-password-strength"
                      />
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="reset-confirm-password"
                          className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0]"
                        >
                          Confirm New Password
                        </label>
                        {passwordsMatch && (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Passwords match
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reset-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Re-enter your new password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) {
                              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                            }
                          }}
                          className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition ${
                            fieldErrors.confirmPassword || passwordsMismatch
                              ? 'border-rose-500'
                              : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {(fieldErrors.confirmPassword || passwordsMismatch) && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.confirmPassword || 'Passwords do not match.'}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[46px] py-3 px-5 rounded-xl text-sm font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] active:scale-[0.99] shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating password...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-4 border-t border-[#E1D4C2] dark:border-[#3D2C23] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep('request');
                          setErrorMessage('');
                        }}
                        className="font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:underline cursor-pointer"
                      >
                        Request another code
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="font-bold text-[#291C0E] dark:text-[#DF9F70] hover:underline cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )
              ) : (
                /* SIGN IN / CREATE ACCOUNT FORM */
                <>
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Full Name (Register Only) */}
                    {isRegister && (
                      <div>
                        <label
                          htmlFor="auth-full-name"
                          className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0] mb-1.5"
                        >
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="auth-full-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            placeholder="Alex Morgan"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              if (fieldErrors.name) {
                                setFieldErrors((prev) => ({ ...prev, name: undefined }));
                              }
                            }}
                            aria-invalid={Boolean(fieldErrors.name)}
                            aria-describedby={fieldErrors.name ? 'auth-name-error' : undefined}
                            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition focus-visible:ring-2 focus-visible:ring-[#C98B5E]/40 ${
                              fieldErrors.name
                                ? 'border-rose-500 dark:border-rose-500 focus:border-rose-500'
                                : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E] dark:focus:border-[#DF9F70]'
                            }`}
                          />
                        </div>
                        {fieldErrors.name && (
                          <p id="auth-name-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Email Address */}
                    <div>
                      <label
                        htmlFor="auth-email"
                        className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0] mb-1.5"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          ref={emailInputRef}
                          id="auth-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailSuggestion('');
                            setUnverifiedLoginEmail('');
                            if (fieldErrors.email) {
                              setFieldErrors((prev) => ({ ...prev, email: undefined }));
                            }
                          }}
                          onBlur={() => {
                            if (email.trim()) {
                              const check = validateEmailStrict(email);
                              if (!check.valid) {
                                setFieldErrors((prev) => ({ ...prev, email: check.error }));
                                setEmailSuggestion(check.suggestion || '');
                              }
                            }
                          }}
                          aria-invalid={Boolean(fieldErrors.email)}
                          aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
                          className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition focus-visible:ring-2 focus-visible:ring-[#C98B5E]/40 ${
                            fieldErrors.email
                              ? 'border-rose-500 dark:border-rose-500 focus:border-rose-500'
                              : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E] dark:focus:border-[#DF9F70]'
                          }`}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p id="auth-email-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.email}
                        </p>
                      )}
                      {emailSuggestion && (
                        <button
                          type="button"
                          onClick={() => applySuggestedEmail(emailSuggestion)}
                          className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4E6D2] dark:bg-[#2E221B] border border-[#C98B5E] text-xs font-bold text-[#291C0E] dark:text-[#DF9F70] hover:bg-[#E1D4C2] transition cursor-pointer"
                        >
                          <span>Use {emailSuggestion} instead</span>
                        </button>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="auth-password"
                          className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0]"
                        >
                          Password
                        </label>
                        <span className="text-[11px] text-[#6E473B] dark:text-[#A78D78]">
                          {isRegister ? '8+ chars, number & symbol' : 'Minimum 8 characters'}
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="auth-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={isLogin ? 'current-password' : 'new-password'}
                          placeholder={
                            isLogin
                              ? 'Enter your password'
                              : 'Create password (8+ chars, number & symbol)'
                          }
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) {
                              setFieldErrors((prev) => ({ ...prev, password: undefined }));
                            }
                          }}
                          aria-invalid={Boolean(fieldErrors.password)}
                          aria-describedby={
                            fieldErrors.password
                              ? 'auth-password-error'
                              : isRegister
                                ? 'register-password-strength'
                                : undefined
                          }
                          className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition focus-visible:ring-2 focus-visible:ring-[#C98B5E]/40 ${
                            fieldErrors.password
                              ? 'border-rose-500 dark:border-rose-500 focus:border-rose-500'
                              : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E] dark:focus:border-[#DF9F70]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#2A1F1A] transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98B5E]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p id="auth-password-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.password}
                        </p>
                      )}

                      {isRegister && (
                        <PasswordStrengthMeter
                          password={password}
                          id="register-password-strength"
                        />
                      )}
                    </div>

                    {/* Confirm Password (Register Only) */}
                    {isRegister && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="auth-confirm-password"
                            className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0]"
                          >
                            Confirm Password
                          </label>
                          {passwordsMatch && (
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Passwords match
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#A78D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="auth-confirm-password"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (fieldErrors.confirmPassword) {
                                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                              }
                            }}
                            aria-invalid={Boolean(fieldErrors.confirmPassword || passwordsMismatch)}
                            aria-describedby={
                              fieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined
                            }
                            className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-[#FBF5EC] dark:bg-[#1E1612] border rounded-xl text-[#291C0E] dark:text-[#F5EBE0] placeholder-[#A78D78] outline-none transition focus-visible:ring-2 focus-visible:ring-[#C98B5E]/40 ${
                              fieldErrors.confirmPassword || passwordsMismatch
                                ? 'border-rose-500 dark:border-rose-500 focus:border-rose-500'
                                : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E] dark:focus:border-[#DF9F70]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            aria-label={
                              showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#2A1F1A] transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98B5E]"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {(fieldErrors.confirmPassword || passwordsMismatch) && (
                          <p
                            id="auth-confirm-password-error"
                            className="mt-1.5 text-xs text-rose-600 dark:text-rose-400"
                          >
                            {fieldErrors.confirmPassword || 'Passwords do not match.'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Remember Me Checkbox + Forgot Password Link (Login Mode) */}
                    {isLogin && (
                      <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                        <label
                          htmlFor="auth-remember-me"
                          className="inline-flex items-center gap-2 text-xs font-medium text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] cursor-pointer select-none py-1"
                        >
                          <input
                            id="auth-remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-[#BEB5A9] dark:border-[#4A372D] accent-[#C98B5E] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C98B5E]"
                          />
                          <span>Remember me (7 days)</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs font-bold text-[#B5653B] dark:text-[#DF9F70] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] underline underline-offset-4 transition cursor-pointer py-1"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {/* Primary Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading || Boolean(emailSuggestion)}
                      className="w-full min-h-[46px] mt-2 py-3 px-5 rounded-xl text-sm font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] active:scale-[0.99] shadow-md shadow-[#C98B5E]/20 transition flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-65 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#291C0E] dark:focus-visible:ring-[#F5EBE0]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Cross-Navigation Prompt */}
                  <div className="mt-6 pt-5 border-t border-[#E1D4C2] dark:border-[#3D2C23] text-center">
                    {isLogin ? (
                      <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9]">
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          className="font-bold text-[#291C0E] dark:text-[#DF9F70] hover:text-[#C98B5E] dark:hover:text-[#F5EBE0] underline underline-offset-4 transition cursor-pointer"
                        >
                          Create one
                        </button>
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9]">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="font-bold text-[#291C0E] dark:text-[#DF9F70] hover:text-[#C98B5E] dark:hover:text-[#F5EBE0] underline underline-offset-4 transition cursor-pointer"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 6-Box OTP Email Verification Modal */}
      <OtpVerificationModal
        isOpen={isVerifyModalOpen}
        email={otpEmail || normalizeEmail(email)}
        otpDigits={otpDigits}
        onOtpDigitsChange={(next) => {
          setOtpDigits(next);
          if (fieldErrors.otp) {
            setFieldErrors((prev) => ({ ...prev, otp: undefined }));
          }
          if (modalErrorMessage) {
            setModalErrorMessage('');
          }
        }}
        onSubmit={handleVerifyOtpSubmit}
        onResend={() => handleResendOtp(otpEmail || normalizeEmail(email), true)}
        onChangeEmail={handleChangeEmailFromModal}
        onClose={() => {
          if (!isOtpSubmitting && !isOtpResending) {
            setIsVerifyModalOpen(false);
          }
        }}
        isLoading={isOtpSubmitting}
        isResending={isOtpResending}
        resendCooldown={resendCooldown}
        errorMessage={modalErrorMessage}
        successMessage={modalSuccessMessage}
        devNotice={modalDevNotice}
        fieldError={fieldErrors.otp}
      />

      <Footer />
    </div>
  );
};
