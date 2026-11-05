/**
 * @file src/components/form/ResumeForm.tsx
 * Step-by-step guided flow container (inspired by resumebuilder.com).
 * Dark Slate Theme: #06141B, #11212D, #253745, #5EEAD4.
 * Features a dedicated, aesthetically pleasing step navigation sidebar with visual icons for each step,
 * completion checkmarks, step indicators, inline validation, autosave feedback, and collapsible rail.
 */

import React, { useState } from 'react';
import { ResumeData } from '../../types/resume';
import { PersonalInfoForm } from './PersonalInfoForm';
import { SummaryForm } from './SummaryForm';
import { ExperienceForm } from './ExperienceForm';
import { EducationForm } from './EducationForm';
import { SkillsForm } from './SkillsForm';
import { ProjectsForm } from './ProjectsForm';
import { CertificationsForm } from './CertificationsForm';
import { validateEmailStrict } from '../../utils/emailValidation';
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  CheckCircle2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Mic,
} from 'lucide-react';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (updated: ResumeData) => void;
  onManualSave: () => void;
  saveStatus: 'saved' | 'unsaved' | 'saving' | 'error';
  lastSavedTime?: string;
  onOpenAiConverter?: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenAtsScore?: () => void;
  onFinish?: () => void;
}

type SectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications';

interface StepMeta {
  id: SectionKey;
  stepNumber: number;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  isOptional: boolean;
}

const STEPS: StepMeta[] = [
  {
    id: 'personal',
    stepNumber: 1,
    label: 'Personal Info',
    shortLabel: 'Personal',
    subtitle: 'Name & Contacts',
    icon: User,
    isOptional: false,
  },
  {
    id: 'summary',
    stepNumber: 2,
    label: 'Professional Summary',
    shortLabel: 'Summary',
    subtitle: 'Career Overview',
    icon: FileText,
    isOptional: true,
  },
  {
    id: 'experience',
    stepNumber: 3,
    label: 'Work Experience',
    shortLabel: 'Experience',
    subtitle: 'Employment History',
    icon: Briefcase,
    isOptional: true,
  },
  {
    id: 'education',
    stepNumber: 4,
    label: 'Education',
    shortLabel: 'Education',
    subtitle: 'Degrees & Honors',
    icon: GraduationCap,
    isOptional: true,
  },
  {
    id: 'projects',
    stepNumber: 5,
    label: 'Key Projects',
    shortLabel: 'Projects',
    subtitle: 'Portfolio & Code',
    icon: FolderGit2,
    isOptional: true,
  },
  {
    id: 'skills',
    stepNumber: 6,
    label: 'Skills & Proficiencies',
    shortLabel: 'Skills',
    subtitle: 'Proficiency Levels',
    icon: Code2,
    isOptional: true,
  },
  {
    id: 'certifications',
    stepNumber: 7,
    label: 'Certifications',
    shortLabel: 'Certs',
    subtitle: 'Licenses & Credentials',
    icon: Award,
    isOptional: true,
  },
];

export const ResumeForm: React.FC<ResumeFormProps> = ({
  data,
  onChange,
  onManualSave,
  saveStatus,
  lastSavedTime,
  onOpenAiConverter,
  onOpenVoiceAssistant,
  onOpenAtsScore,
  onFinish,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
  }>({});

  const currentStep = STEPS[activeStepIndex];

  // Validation rules for required Step 1 fields
  const validateStep1 = (): boolean => {
    const errors: { fullName?: string; email?: string; phone?: string } = {};
    const { fullName, email, phone } = data.personalInfo;

    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required for ATS parsing.';
    }

    const emailCheck = validateEmailStrict(email);
    if (!emailCheck.valid) {
      errors.email = emailCheck.error || 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (activeStepIndex === 0) {
      const isValid = validateStep1();
      if (!isValid) return;
    }

    onManualSave();

    if (activeStepIndex < STEPS.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      // Final step: Save & Finish!
      if (onFinish) {
        onFinish();
      } else if (onOpenAtsScore) {
        onOpenAtsScore();
      }
    }
  };

  const handleBack = () => {
    if (activeStepIndex > 0) {
      onManualSave();
      setActiveStepIndex((prev) => prev - 1);
    }
  };

  const handleDirectStepSelect = (index: number) => {
    if (activeStepIndex === 0 && index > 0) {
      if (!validateStep1()) return;
    }
    onManualSave();
    setActiveStepIndex(index);
  };

  // Completion helper per step
  const isStepCompleted = (stepId: SectionKey): boolean => {
    switch (stepId) {
      case 'personal':
        return Boolean(
          data.personalInfo.fullName.trim() &&
          data.personalInfo.email.trim() &&
          data.personalInfo.phone.trim()
        );
      case 'summary':
        return Boolean(data.summary.trim());
      case 'experience':
        return data.experiences.length > 0;
      case 'education':
        return data.education.length > 0;
      case 'projects':
        return data.projects.length > 0;
      case 'skills':
        return data.skills.some((s) => s.skills.length > 0);
      case 'certifications':
        return data.certifications.length > 0;
      default:
        return false;
    }
  };

  const completedCount = STEPS.filter((s) => isStepCompleted(s.id)).length;
  const completenessPercent = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="bg-[#FBF5EC] rounded-3xl border border-[#E1D4C2] shadow-xs flex flex-col h-full overflow-hidden text-[#291C0E]">
      {/* Top Header: Step Overview & Status Bar */}
      <div className="px-3.5 py-2.5 bg-[#F4E6D2]/60 border-b border-[#E1D4C2] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 text-[#291C0E]">
        {/* Step Indicator & Progress */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[#291C0E] font-serif">
            <span className="text-[#C98B5E]">Step {currentStep.stepNumber} of {STEPS.length}:</span>
            <span>{currentStep.label}</span>
            {currentStep.isOptional ? (
              <span className="text-[10px] font-normal text-[#6E473B] bg-[#E1D4C2] px-1.5 py-0.5 rounded-md border border-[#BEB5A9]">
                Optional
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-md">
                Required
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6E473B]">
            <div className="w-16 bg-[#E1D4C2] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#C98B5E] h-full rounded-full transition-all duration-300"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
            <span className="font-semibold text-[#291C0E]">{completenessPercent}%</span>
          </div>
        </div>

        {/* Save Status & AI Action */}
        <div className="flex items-center gap-2">
          {onOpenVoiceAssistant && (
            <button
              type="button"
              onClick={onOpenVoiceAssistant}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FBF5EC] hover:bg-[#E1D4C2] text-[#291C0E] border border-[#E1D4C2] text-xs font-bold rounded-xl cursor-pointer transition shadow-2xs"
            >
              <Mic className="w-3 h-3 text-[#C98B5E]" />
              <span>Voice Resume</span>
            </button>
          )}

          {/* Saved Status Indicator */}
          <div className="flex items-center gap-1 text-[11px] font-medium">
            {saveStatus === 'saving' && (
              <span className="text-[#8B552B] bg-[#F4E6D2] px-2.5 py-0.5 rounded-full border border-[#C98B5E]/50 animate-pulse flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-900 flex items-center gap-1 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Saved to your account {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-amber-900 flex items-center gap-1 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Not saved</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-900 flex items-center gap-1 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 font-semibold">
                <span>Save failed — retry</span>
              </span>
            )}
          </div>

          {onOpenAiConverter && (
            <button
              type="button"
              onClick={onOpenAiConverter}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-[#FBF5EC] hover:bg-[#E1D4C2] text-[#291C0E] border border-[#E1D4C2] text-xs font-bold rounded-xl cursor-pointer transition shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-[#C98B5E]" />
              <span>AI Convert</span>
            </button>
          )}

          {onOpenAtsScore && (
            <button
              type="button"
              onClick={onOpenAtsScore}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs"
              title="Audit real-time ATS Score & Keywords"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>ATS Check</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Top Step Scrollbar */}
      <div className="sm:hidden border-b border-[#E1D4C2] bg-[#F4E6D2] p-1.5 overflow-x-auto scrollbar-none flex gap-1 items-center shrink-0">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx === activeStepIndex;
          const isDone = isStepCompleted(step.id);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleDirectStepSelect(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-[#291C0E] text-[#F4E6D2] font-bold shadow-xs'
                  : isDone
                  ? 'bg-[#E1D4C2] text-[#291C0E] border border-[#BEB5A9]'
                  : 'bg-[#FBF5EC] text-[#6E473B] hover:text-[#291C0E]'
              }`}
            >
              <StepIcon className="w-3.5 h-3.5" />
              <span>{step.shortLabel}</span>
              {isDone && <Check className="w-3 h-3 text-[#C98B5E] stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {/* Main Split Body: Sidebar Navigation + Form Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Step Navigation Sidebar */}
        <aside
          className={`hidden sm:flex flex-col bg-[#FBF5EC] border-r border-[#E1D4C2] transition-all duration-200 select-none shrink-0 ${
            isSidebarCollapsed ? 'w-14' : 'w-48 lg:w-56'
          }`}
        >
          {/* Sidebar Collapse Toggle Header */}
          <div className="p-2.5 border-b border-[#E1D4C2] flex items-center justify-between text-xs text-[#6E473B]">
            {!isSidebarCollapsed && (
              <span className="font-bold text-[11px] tracking-wider uppercase text-[#6E473B] pl-2">
                Resume Steps
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-[#F4E6D2] hover:text-[#291C0E] rounded-lg transition ml-auto cursor-pointer"
              title={isSidebarCollapsed ? 'Expand step rail' : 'Collapse step rail'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Steps List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === activeStepIndex;
              const isDone = isStepCompleted(step.id);

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleDirectStepSelect(idx)}
                  className={`w-full text-left rounded-xl transition-all flex items-center gap-2.5 p-2 cursor-pointer group relative ${
                    isActive
                      ? 'bg-[#291C0E] text-[#F4E6D2] font-black shadow-xs'
                      : isDone
                      ? 'text-[#291C0E] hover:bg-[#F4E6D2]'
                      : 'text-[#6E473B] hover:text-[#291C0E] hover:bg-[#F4E6D2]'
                  }`}
                  title={`${step.stepNumber}. ${step.label} (${step.subtitle})`}
                >
                  {/* Step Icon Badge */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs transition-colors ${
                      isActive
                        ? 'bg-[#291C0E] text-[#C98B5E] font-bold border border-[#C98B5E]/40'
                        : isDone
                        ? 'bg-[#E1D4C2] text-[#291C0E] border border-[#BEB5A9]'
                        : 'bg-[#F4E6D2] text-[#6E473B] group-hover:text-[#291C0E]'
                    }`}
                  >
                    <StepIcon className="w-3.5 h-3.5" />
                  </div>

                  {/* Text Details (hidden when rail is collapsed) */}
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate leading-snug">
                          {step.label}
                        </span>
                        {isDone && (
                          <div className="w-4 h-4 rounded-full bg-[#C98B5E]/20 flex items-center justify-center shrink-0 ml-1">
                            <Check className="w-2.5 h-2.5 text-[#C98B5E] stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-[10px] truncate leading-tight ${
                          isActive ? 'text-[#F4E6D2]/80' : 'text-[#6E473B]'
                        }`}
                      >
                        {step.subtitle}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Completeness Summary */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-[#E1D4C2] bg-[#F4E6D2]/60 text-[11px] space-y-1">
              <div className="flex justify-between text-[#6E473B]">
                <span>Progress:</span>
                <span className="font-bold text-[#291C0E]">{completedCount} / 7 done</span>
              </div>
              <div className="w-full bg-[#E1D4C2] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#C98B5E] h-full rounded-full transition-all duration-300"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* Right Form Viewport with Scroll and Footer Controls */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FBF5EC]">
          {/* Scrollable Form Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#FBF5EC]">
            {currentStep.id === 'personal' && (
              <PersonalInfoForm
                data={data.personalInfo}
                onChange={(updated) => onChange({ ...data, personalInfo: updated })}
                errors={validationErrors}
              />
            )}

            {currentStep.id === 'summary' && (
              <SummaryForm
                summary={data.summary}
                summaryTitle={data.summaryTitle}
                onSummaryChange={(updatedSummary: string) =>
                  onChange({ ...data, summary: updatedSummary })
                }
                onTitleChange={(updatedTitle: string) =>
                  onChange({ ...data, summaryTitle: updatedTitle })
                }
                roleContext={data.personalInfo.jobTitle}
              />
            )}

            {currentStep.id === 'experience' && (
              <ExperienceForm
                experiences={data.experiences}
                onChange={(updated) => onChange({ ...data, experiences: updated })}
              />
            )}

            {currentStep.id === 'education' && (
              <EducationForm
                education={data.education}
                onChange={(updated) => onChange({ ...data, education: updated })}
              />
            )}

            {currentStep.id === 'projects' && (
              <ProjectsForm
                projects={data.projects}
                onChange={(updated) => onChange({ ...data, projects: updated })}
              />
            )}

            {currentStep.id === 'skills' && (
              <SkillsForm
                skills={data.skills}
                onChange={(updated) => onChange({ ...data, skills: updated })}
                displayStyle={data.skillsDisplayStyle || 'tags'}
                onDisplayStyleChange={(style) => onChange({ ...data, skillsDisplayStyle: style })}
              />
            )}

            {currentStep.id === 'certifications' && (
              <CertificationsForm
                certifications={data.certifications}
                onChange={(updated) => onChange({ ...data, certifications: updated })}
              />
            )}
          </div>

          {/* Step Navigation Footer Controls (Back, Standalone Save, Save & Continue) */}
          <div className="p-3 sm:px-5 sm:py-3.5 bg-[#F4E6D2]/60 border-t border-[#E1D4C2] flex items-center justify-between gap-2 shrink-0">
            <div>
              {activeStepIndex > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#291C0E] bg-[#FBF5EC] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-[#6E473B]" />
                  <span>Back</span>
                </button>
              ) : (
                <span className="text-xs text-[#6E473B] font-medium pl-1">
                  * Required: Name, Email, Phone
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Standalone Save button in each step */}
              <button
                type="button"
                onClick={onManualSave}
                disabled={saveStatus === 'saving'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#291C0E] bg-[#FBF5EC] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-60"
                title="Save changes to your account"
              >
                <Save className="w-3.5 h-3.5 text-[#C98B5E]" />
                <span>{saveStatus === 'saving' ? 'Saving...' : 'Save'}</span>
              </button>

              {/* Primary Save & Continue button */}
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] active:scale-95 rounded-xl shadow-md transition cursor-pointer font-sans"
              >
                <span>{activeStepIndex === STEPS.length - 1 ? 'Save & Finish' : 'Save & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
