import React, { useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Mail,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

export interface OtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  otpDigits: string[];
  onOtpDigitsChange: (nextDigits: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  onClose: () => void;
  isLoading: boolean;
  isResending: boolean;
  resendCooldown: number;
  errorMessage?: string;
  successMessage?: string;
  devNotice?: string;
  fieldError?: string;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  email,
  otpDigits,
  onOtpDigitsChange,
  onSubmit,
  onResend,
  onChangeEmail,
  onClose,
  isLoading,
  isResending,
  resendCooldown,
  errorMessage,
  successMessage,
  devNotice,
  fieldError,
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => {
      const firstEmptyIdx = otpDigits.findIndex((d) => !d);
      const targetIdx = firstEmptyIdx === -1 ? 5 : firstEmptyIdx;
      inputRefs.current[targetIdx]?.focus();
    }, 60);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && !isResending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, isResending, onClose]);

  if (!isOpen) return null;

  const focusBox = (index: number) => {
    if (index >= 0 && index < 6) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      const updated = [...otpDigits];
      updated[index] = '';
      onOtpDigitsChange(updated);
      return;
    }

    // Handle multi-digit autofill / mobile keyboard suggestions
    if (digitsOnly.length > 1) {
      const updated = [...otpDigits];
      let cursor = index;
      for (const ch of digitsOnly) {
        if (cursor > 5) break;
        updated[cursor] = ch;
        cursor += 1;
      }
      onOtpDigitsChange(updated);
      focusBox(Math.min(cursor, 5));
      return;
    }

    const updated = [...otpDigits];
    updated[index] = digitsOnly;
    onOtpDigitsChange(updated);
    if (index < 5) {
      focusBox(index + 1);
    }
  };

  const handleBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        e.preventDefault();
        const updated = [...otpDigits];
        updated[index] = '';
        onOtpDigitsChange(updated);
      } else if (index > 0) {
        e.preventDefault();
        const updated = [...otpDigits];
        updated[index - 1] = '';
        onOtpDigitsChange(updated);
        focusBox(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedDigits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedDigits) return;
    const nextDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedDigits.length; i += 1) {
      nextDigits[i] = pastedDigits[i];
    }
    onOtpDigitsChange(nextDigits);
    focusBox(Math.min(pastedDigits.length, 5));
  };

  const combinedOtp = otpDigits.join('');
  const isComplete = /^\d{6}$/.test(combinedOtp);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#291C0E]/70 dark:bg-black/75 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-email-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[#E1D4C2] dark:border-[#3D2C23] bg-[#FBF5EC] dark:bg-[#241B16] text-[#291C0E] dark:text-[#F5EBE0] shadow-2xl shadow-[#291C0E]/30 dark:shadow-black/60 p-6 sm:p-8">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading || isResending}
          aria-label="Close verification dialog"
          className="absolute top-4 right-4 p-2 rounded-xl text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#2E221B] transition cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#F4E6D2] dark:bg-[#2E221B] border border-[#C98B5E]/40 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-[#C98B5E] dark:text-[#DF9F70]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#C98B5E] dark:text-[#DF9F70]">
              ATS Resume Builder by Junaid
            </p>
            <h2
              id="verify-email-modal-title"
              className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#291C0E] dark:text-[#F5EBE0]"
            >
              Verify your email
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9] leading-relaxed mb-5">
          Enter the 6-digit verification code sent to{' '}
          <span className="font-bold text-[#291C0E] dark:text-[#F5EBE0] break-all">
            {email}
          </span>{' '}
          to activate your account.
        </p>

        {/* Dev mode SMTP notice */}
        {devNotice && (
          <div
            role="status"
            className="mb-4 p-3 bg-[#F4E6D2] dark:bg-[#2E221B] border border-[#C98B5E]/60 rounded-xl text-xs text-[#291C0E] dark:text-[#F5EBE0] flex items-start gap-2"
          >
            <Info className="w-4 h-4 text-[#C98B5E] dark:text-[#DF9F70] shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{devNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="otp-box-0"
              className="block text-xs font-semibold text-[#291C0E] dark:text-[#F5EBE0] mb-2"
            >
              6-Digit Verification Code
            </label>

            {/* 6-Box OTP Code Input */}
            <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <input
                  key={idx}
                  id={`otp-box-${idx}`}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  aria-label={`Verification code digit ${idx + 1} of 6`}
                  value={otpDigits[idx] || ''}
                  disabled={isLoading}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleBoxKeyDown(idx, e)}
                  className={`w-full h-12 sm:h-13 text-center text-lg sm:text-xl font-mono font-bold rounded-xl bg-[#FBF5EC] dark:bg-[#1E1612] border text-[#291C0E] dark:text-[#F5EBE0] outline-none transition focus-visible:ring-2 focus-visible:ring-[#C98B5E]/50 ${
                    fieldError
                      ? 'border-rose-500 dark:border-rose-500'
                      : otpDigits[idx]
                        ? 'border-[#C98B5E] dark:border-[#DF9F70]'
                        : 'border-[#E1D4C2] dark:border-[#3D2C23] focus:border-[#C98B5E]'
                  }`}
                />
              ))}
            </div>

            {fieldError && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {fieldError}
              </p>
            )}

            <p className="mt-2 text-[11px] text-[#6E473B] dark:text-[#D2BFA9]">
              Valid for 10 minutes &bull; Up to 5 attempts allowed
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || isResending || !isComplete}
            className="w-full min-h-[46px] py-3 px-5 rounded-xl text-sm font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] active:scale-[0.99] shadow-md shadow-[#C98B5E]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Email &amp; Activate Account</span>
              </>
            )}
          </button>

          {/* Resend with Countdown + Change Email Link */}
          <div className="pt-4 border-t border-[#E1D4C2] dark:border-[#3D2C23] flex items-center justify-between gap-2 flex-wrap text-xs">
            <button
              type="button"
              disabled={isLoading || isResending || resendCooldown > 0}
              onClick={onResend}
              className="inline-flex items-center gap-1.5 font-semibold text-[#6E473B] dark:text-[#DF9F70] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </span>
            </button>

            <button
              type="button"
              disabled={isLoading || isResending}
              onClick={onChangeEmail}
              className="font-bold text-[#291C0E] dark:text-[#DF9F70] hover:text-[#C98B5E] underline underline-offset-4 cursor-pointer disabled:opacity-50"
            >
              Change email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
