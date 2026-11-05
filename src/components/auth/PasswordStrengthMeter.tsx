import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasMixedCase: boolean;
  passedRequiredCount: number;
  isValid: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  barColor: string;
  textColor: string;
  errorMessage?: string;
}

export function evaluatePasswordCriteria(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9\s]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const passedRequiredCount =
    (hasMinLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecialChar ? 1 : 0);
  const isValid = hasMinLength && hasNumber && hasSpecialChar && password.length <= 128;

  let errorMessage: string | undefined;
  if (!password) {
    errorMessage = 'Please enter a password.';
  } else if (password.length > 128) {
    errorMessage = 'Password cannot exceed 128 characters.';
  } else if (!isValid) {
    const missing: string[] = [];
    if (!hasMinLength) missing.push('at least 8 characters');
    if (!hasNumber) missing.push('a number');
    if (!hasSpecialChar) missing.push('a special character');
    errorMessage = `Password must include ${missing.join(', ')}.`;
  }

  if (!password) {
    return {
      hasMinLength,
      hasNumber,
      hasSpecialChar,
      hasMixedCase,
      passedRequiredCount: 0,
      isValid: false,
      score: 0,
      label: 'Enter password',
      barColor: 'bg-[#E1D4C2] dark:bg-[#3D2C23]',
      textColor: 'text-[#6E473B] dark:text-[#D2BFA9]',
      errorMessage,
    };
  }

  if (passedRequiredCount <= 1) {
    return {
      hasMinLength,
      hasNumber,
      hasSpecialChar,
      hasMixedCase,
      passedRequiredCount,
      isValid,
      score: 1,
      label: 'Weak',
      barColor: 'bg-rose-600 dark:bg-rose-500',
      textColor: 'text-rose-700 dark:text-rose-400',
      errorMessage,
    };
  }

  if (passedRequiredCount === 2) {
    return {
      hasMinLength,
      hasNumber,
      hasSpecialChar,
      hasMixedCase,
      passedRequiredCount,
      isValid,
      score: 2,
      label: 'Fair',
      barColor: 'bg-amber-500 dark:bg-amber-400',
      textColor: 'text-amber-800 dark:text-amber-300',
      errorMessage,
    };
  }

  if (hasMixedCase || password.length >= 12) {
    return {
      hasMinLength,
      hasNumber,
      hasSpecialChar,
      hasMixedCase,
      passedRequiredCount,
      isValid,
      score: 4,
      label: 'Strong',
      barColor: 'bg-emerald-600 dark:bg-emerald-500',
      textColor: 'text-emerald-800 dark:text-emerald-400',
    };
  }

  return {
    hasMinLength,
    hasNumber,
    hasSpecialChar,
    hasMixedCase,
    passedRequiredCount,
    isValid,
    score: 3,
    label: 'Good',
    barColor: 'bg-[#C98B5E] dark:bg-[#DF9F70]',
    textColor: 'text-[#6E473B] dark:text-[#DF9F70]',
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  id?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  id,
}) => {
  const evaluation = evaluatePasswordCriteria(password);
  const hasTyped = password.length > 0;

  const requirements = [
    {
      key: 'length',
      label: '8+ characters',
      met: evaluation.hasMinLength,
    },
    {
      key: 'number',
      label: 'Number (0–9)',
      met: evaluation.hasNumber,
    },
    {
      key: 'special',
      label: 'Symbol (!@#$)',
      met: evaluation.hasSpecialChar,
    },
  ];

  return (
    <div id={id} className="mt-2.5 space-y-2" aria-live="polite">
      {/* Strength Header + Tabular Summary */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#6E473B] dark:text-[#D2BFA9] font-medium">
          Password strength
        </span>
        <span className={`font-semibold tabular-nums ${evaluation.textColor}`}>
          {hasTyped
            ? `${evaluation.label} · ${evaluation.passedRequiredCount}/3 rules met`
            : '0/3 rules met'}
        </span>
      </div>

      {/* 4-Segment Progress Bar */}
      <div
        role="progressbar"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={evaluation.score}
        aria-valuetext={evaluation.label}
        className="grid grid-cols-4 gap-1.5"
      >
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={`h-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
              evaluation.score >= segment
                ? evaluation.barColor
                : 'bg-[#E1D4C2] dark:bg-[#3D2C23]'
            }`}
          />
        ))}
      </div>

      {/* Real-Time Criteria Checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-x-2.5 gap-y-1 pt-0.5">
        {requirements.map((req) => (
          <li
            key={req.key}
            className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 motion-reduce:transition-none ${
              req.met
                ? 'text-emerald-800 dark:text-emerald-300 font-semibold'
                : hasTyped
                  ? 'text-[#6E473B] dark:text-[#D2BFA9]'
                  : 'text-[#6E473B]/85 dark:text-[#D2BFA9]/85'
            }`}
          >
            {req.met ? (
              <CheckCircle2
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="w-3.5 h-3.5 text-[#A78D78] dark:text-[#8C7360] shrink-0"
                aria-hidden="true"
              />
            )}
            <span className="truncate">{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
