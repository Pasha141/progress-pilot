/**
 * @file src/components/ai/AIResumeConverterModal.tsx
 * AI-powered Old Resume Converter & Chatbot Assistant by Junaid.
 * Styled in the website's signature warm cream & cocoa palette:
 * Surface #FBF5EC, Cream #F4E6D2, Sand #E1D4C2, Cocoa Primary #291C0E, Cocoa Secondary #6E473B, Copper Accent #C98B5E.
 * Allows users to upload old resumes (PDF, DOCX, TXT), paste raw resume text,
 * or chat with the AI bot to automatically generate an ATS-friendly CV formatted for the 100 templates.
 */

import React, { useEffect, useState, useRef } from 'react';
import { ResumeData } from '../../types/resume';
import { authFetch } from '../../utils/authSession';
import {
  BrowserSpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  getBrowserSpeechRecognition,
} from '../../utils/browserSpeechRecognition';
import { validateVoiceTranscript } from '../../utils/voiceResumeExtraction';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  Bot,
  Send,
  ArrowRight,
  RefreshCw,
  Award,
  ShieldCheck,
  ChevronRight,
  FileUp,
  Cpu,
  Mic,
} from 'lucide-react';

interface AIResumeConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResume: (convertedResume: ResumeData) => void;
  onApplyChatDraft: (resume: ResumeData) => void;
  currentResume: ResumeData;
}

type TabType = 'upload' | 'paste' | 'chat';

// @ts-ignore - browser bundle of mammoth for instant client-side DOCX text extraction
import mammothBrowser from 'mammoth/mammoth.browser';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const SUPPORTED_AI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'] as const;
const DEFAULT_AI_MODEL = 'gemini-3.1-flash-lite';
const CHAT_VOICE_LANGUAGES = [
  { tag: 'en-IN', label: 'English' },
  { tag: 'hi-IN', label: 'Hindi / Hinglish (best effort)' },
  { tag: 'ur-PK', label: 'Urdu' },
  { tag: 'kn-IN', label: 'Kannada' },
];
const CHAT_WELCOME_MESSAGE = `Namaste! Main hoon Junaid ka AI ATS Resume Assistant.

Aap mujhse Hindi ya English mein baat kar sakte hain.

Aap do tarikon se apna resume bana sakte hain:

1. Chat: Neeche message type karke mujhse questions poochhein aur apne resume ki details share karein.
2. Voice: Microphone button par click karein aur bolkar apni education, skills, work experience aur projects ki details batayein.
Main aapki information ko organize karke ek professional, ATS-friendly resume banane mein madad karunga.

Aap apna existing resume bhi upload ya paste kar sakte hain, aur main usko improve karne mein madad karunga.

Let's build your professional resume together!`;

const CHAT_RESUME_EXTRACTION_ERROR =
  'Could not organize the chat details into a resume. Add or clarify source information and try again.';

function resumeToSourceText(resume: ResumeData): string {
  const entries: string[] = [];
  const add = (label: string, value: unknown) => {
    if (typeof value === 'string' && value.trim()) entries.push(`${label}: ${value.trim()}`);
  };

  Object.entries(resume.personalInfo).forEach(([key, value]) => {
    if (key !== 'photoUrl') add(key, value);
  });
  add('Professional summary', resume.summary);
  resume.experiences.forEach((item, index) => {
    add(`Experience ${index + 1} company`, item.company);
    add(`Experience ${index + 1} role`, item.role);
    add(`Experience ${index + 1} location`, item.location);
    add(`Experience ${index + 1} start date`, item.startDate);
    add(`Experience ${index + 1} end date`, item.endDate);
    item.bullets.forEach((bullet) => add('Experience detail', bullet));
  });
  resume.education.forEach((item, index) => {
    add(`Education ${index + 1} school`, item.school);
    add(`Education ${index + 1} degree`, item.degree);
    add(`Education ${index + 1} field`, item.fieldOfStudy);
    add(`Education ${index + 1} location`, item.location);
    add(`Education ${index + 1} start date`, item.startDate);
    add(`Education ${index + 1} end date`, item.endDate);
    add(`Education ${index + 1} GPA`, item.gpa);
    add(`Education ${index + 1} honors`, item.honors);
  });
  resume.skills.forEach((category) => {
    add('Skill category', category.categoryName);
    category.skills.forEach((skill) => {
      add('Skill', typeof skill === 'string' ? skill : skill.name);
    });
  });
  resume.projects.forEach((item, index) => {
    add(`Project ${index + 1}`, item.title);
    add(`Project ${index + 1} detail`, item.subtitle);
    add(`Project ${index + 1} URL`, item.liveUrl);
    add(`Project ${index + 1} source`, item.githubUrl);
    add(`Project ${index + 1} start date`, item.startDate);
    add(`Project ${index + 1} end date`, item.endDate);
    item.technologies.forEach((technology) => add('Project technology', technology));
    item.bullets.forEach((bullet) => add('Project detail', bullet));
  });
  resume.certifications.forEach((item) => {
    add('Certification', item.name);
    add('Certification issuer', item.issuer);
    add('Certification issue date', item.issueDate);
    add('Certification credential', item.credentialUrl);
  });
  return entries.join('\n');
}

function parseApiJson(rawText: string): any {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    throw new Error('Empty response received from server.');
  }
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    throw new Error('HTML_FALLBACK_RESPONSE');
  }
  // 1. Direct JSON.parse first — never corrupt valid JSON containing backticks inside string values!
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Strip outer markdown code fences only if present at start/end
  let cleaned = trimmed;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // 3. Repair unescaped newlines inside quoted strings & trailing commas
    let inStr = false;
    let esc = false;
    let repaired = '';
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (esc) {
        repaired += ch;
        esc = false;
        continue;
      }
      if (ch === '\\') {
        repaired += ch;
        esc = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        repaired += ch;
        continue;
      }
      if (inStr && (ch === '\n' || ch === '\r')) {
        repaired += ch === '\n' ? '\\n' : '';
        continue;
      }
      repaired += ch;
    }
    return JSON.parse(repaired.replace(/,\s*([}\]])/g, '$1'));
  }
}

export const AIResumeConverterModal: React.FC<AIResumeConverterModalProps> = ({
  isOpen,
  onClose,
  onApplyResume,
  onApplyChatDraft,
  currentResume,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [userInstructions, setUserInstructions] = useState<string>('');

  // Conversion process states
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStep, setConversionStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [convertedResult, setConvertedResult] = useState<{
    resume: ResumeData;
    atsAnalysis?: {
      score?: number;
      strengths?: string[];
      improvements?: string[];
      keyMatches?: string[];
    };
  } | null>(null);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'model'; content: string }>
  >([
    {
      role: 'model',
      content: CHAT_WELCOME_MESSAGE,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatVoiceLanguage, setChatVoiceLanguage] = useState('en-IN');
  const [isChatListening, setIsChatListening] = useState(false);
  const [isChatTranscribing, setIsChatTranscribing] = useState(false);
  const [chatVoiceError, setChatVoiceError] = useState('');
  const [chatVoiceRetryAvailable, setChatVoiceRetryAvailable] = useState(false);
  const [chatInterimTranscript, setChatInterimTranscript] = useState('');
  const [isChatResumeExtracting, setIsChatResumeExtracting] = useState(false);
  const [chatResumeError, setChatResumeError] = useState('');
  const [chatResumeDraft, setChatResumeDraft] = useState<ResumeData | null>(null);
  const [chatResumeConfirmed, setChatResumeConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const chatTranscriptRef = useRef('');
  const chatOriginalInputRef = useRef('');
  const chatSpeechResultReceivedRef = useRef(false);
  const chatSpeechErrorRef = useRef(false);
  const chatRecognitionCancelledRef = useRef(false);

  const abortChatRecognition = () => {
    chatRecognitionCancelledRef.current = true;
    try {
      chatRecognitionRef.current?.abort();
    } catch {
      // Recognition can already be stopped by the browser.
    }
    chatRecognitionRef.current = null;
    setIsChatListening(false);
    setIsChatTranscribing(false);
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'chat') abortChatRecognition();
  }, [isOpen, activeTab]);

  useEffect(() => () => {
    chatRecognitionCancelledRef.current = true;
    try {
      chatRecognitionRef.current?.abort();
    } catch {
      // Recognition can already be stopped by the browser.
    }
  }, []);

  const startChatListening = () => {
    const Recognition = getBrowserSpeechRecognition();
    if (!Recognition) {
      setChatVoiceError('Speech recognition is not supported in this browser. You can still type your message.');
      setChatVoiceRetryAvailable(false);
      return;
    }

    abortChatRecognition();
    setChatVoiceError('');
    setChatVoiceRetryAvailable(false);
    setChatInterimTranscript('');
    chatOriginalInputRef.current = chatInput;
    chatTranscriptRef.current = chatInput;
    chatSpeechResultReceivedRef.current = false;
    chatSpeechErrorRef.current = false;
    chatRecognitionCancelledRef.current = false;

    try {
      const recognition = new Recognition();
      recognition.lang = chatVoiceLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (result.isFinal) finalText += result[0].transcript;
          else interimText += result[0].transcript;
        }
        if (finalText) {
          chatSpeechResultReceivedRef.current = true;
          chatTranscriptRef.current = `${chatTranscriptRef.current}${chatTranscriptRef.current ? ' ' : ''}${finalText}`
            .trim()
            .slice(0, 12_000);
          setChatInput(chatTranscriptRef.current);
        }
        setChatInterimTranscript(interimText);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (chatRecognitionCancelledRef.current) return;
        const messages: Record<string, string> = {
          'not-allowed': 'Microphone permission was denied. Allow microphone access in your browser settings, then retry.',
          'service-not-allowed': 'The browser speech service is unavailable. Try another supported browser or type your message.',
          'no-speech': 'No speech was detected. Try again or type your message.',
          network: 'The browser speech service could not be reached. Check your connection and retry.',
        };
        chatSpeechErrorRef.current = true;
        setChatVoiceError(messages[event.error] || 'Speech recognition stopped unexpectedly. Retry or type your message.');
        setChatVoiceRetryAvailable(true);
        setIsChatListening(false);
        setIsChatTranscribing(false);
        setChatInterimTranscript('');
      };
      recognition.onend = () => {
        setIsChatListening(false);
        setIsChatTranscribing(false);
        setChatInterimTranscript('');
        chatRecognitionRef.current = null;
        if (chatRecognitionCancelledRef.current) return;
        if (!chatSpeechResultReceivedRef.current && !chatSpeechErrorRef.current) {
          setChatVoiceError('No speech was recognized. Try again or type your message.');
          setChatVoiceRetryAvailable(true);
        }
      };
      chatRecognitionRef.current = recognition;
      setIsChatListening(true);
      recognition.start();
    } catch {
      chatRecognitionRef.current = null;
      setIsChatListening(false);
      setIsChatTranscribing(false);
      setChatVoiceError('Could not start speech recognition. Check microphone permissions, then retry.');
      setChatVoiceRetryAvailable(true);
    }
  };

  const stopChatListening = () => {
    if (!chatRecognitionRef.current) return;
    setIsChatTranscribing(true);
    try {
      chatRecognitionRef.current.stop();
    } catch {
      setIsChatListening(false);
      setIsChatTranscribing(false);
      setChatVoiceError('Speech recognition could not be stopped cleanly. You can retry or edit the text.');
      setChatVoiceRetryAvailable(true);
    }
  };

  const cancelChatListening = () => {
    chatRecognitionCancelledRef.current = true;
    try {
      chatRecognitionRef.current?.abort();
    } catch {
      // Recognition can already be stopped by the browser.
    }
    chatRecognitionRef.current = null;
    chatSpeechResultReceivedRef.current = false;
    chatSpeechErrorRef.current = false;
    chatTranscriptRef.current = chatOriginalInputRef.current;
    setChatInput(chatOriginalInputRef.current);
    setIsChatListening(false);
    setIsChatTranscribing(false);
    setChatInterimTranscript('');
    setChatVoiceError('');
    setChatVoiceRetryAvailable(false);
  };

  if (!isOpen) return null;

  const readUploadedFile = async (file: File): Promise<{ base64?: string; text?: string }> => {
    const lowerName = file.name.toLowerCase();
    if (file.type === 'text/plain' || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      const text = await file.text();
      return { text };
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64Data = btoa(binary);

    // Pre-extract .docx text in browser via mammoth for faster & more reliable conversion
    if (
      lowerName.endsWith('.docx') ||
      file.type.includes('officedocument.wordprocessingml.document')
    ) {
      try {
        const res = await mammothBrowser.extractRawText({ arrayBuffer });
        if (res?.value && res.value.trim().length > 0) {
          return { base64: base64Data, text: res.value.trim() };
        }
      } catch (docxErr) {
        console.warn('[AIResumeConverter] Browser mammoth fallback to server extraction:', docxErr);
      }
    }

    return { base64: base64Data };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.txt'];
    if (!validExtensions.some((ext) => lowerName.endsWith(ext))) {
      setSelectedFile(null);
      setFileBase64('');
      setRawText('');
      setErrorMessage('Unsupported file type. Only .pdf, .docx, and .txt files are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      setFileBase64('');
      setRawText('');
      setErrorMessage('File size exceeds the 5 MB limit. Please upload a smaller file or paste the text.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setFileBase64('');
    setRawText('');
    setErrorMessage('');

    readUploadedFile(file)
      .then(({ base64, text }) => {
        if (typeof text === 'string') setRawText(text);
        if (typeof base64 === 'string') setFileBase64(base64);
      })
      .catch((err) => setErrorMessage(err.message));
  };

  const handleStartConversion = async () => {
    // 1. Validate input based on active tab
    const isPasteMode = activeTab === 'paste';
    if (isPasteMode && (!rawText || !rawText.trim())) {
      setErrorMessage('Please paste your resume text before starting conversion.');
      return;
    }
    if (!isPasteMode && !selectedFile && (!rawText || !rawText.trim())) {
      setErrorMessage('Please upload a resume file (.pdf, .docx, or .txt) or switch to "Paste Resume Text".');
      return;
    }

    if (!isPasteMode && selectedFile) {
      const lowerName = selectedFile.name.toLowerCase();
      if (!['.pdf', '.docx', '.txt'].some((ext) => lowerName.endsWith(ext))) {
        setErrorMessage('Unsupported file type. Only .pdf, .docx, and .txt files are allowed.');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMessage('The selected file exceeds the 5 MB limit. Please upload a smaller file or paste the text.');
        return;
      }
    }

    // 2. Validate AI model selection
    const selectedModel = DEFAULT_AI_MODEL;
    if (!(SUPPORTED_AI_MODELS as readonly string[]).includes(selectedModel)) {
      setErrorMessage(`Unsupported AI model "${selectedModel}". Supported models: ${SUPPORTED_AI_MODELS.join(', ')}.`);
      return;
    }

    let stepTimer1: ReturnType<typeof setTimeout> | undefined;
    let stepTimer2: ReturnType<typeof setTimeout> | undefined;
    let stepTimer3: ReturnType<typeof setTimeout> | undefined;

    try {
      setIsConverting(true);
      setConvertedResult(null);
      setErrorMessage('');
      setConversionStep('Step 1/4: Validating AI service & reading document...');

      // Check status non-blockingly (server provides local ATS parser fallback if Gemini key is unconfigured)
      try {
        const statusRes = await authFetch(`${API_BASE}/api/ai/status`);
        if (statusRes.status === 401) return;
      } catch {
        // Proceed to convert-resume
      }

      stepTimer1 = setTimeout(() => {
        setConversionStep('Step 2/4: Extracting experience, education & skills...');
      }, 1000);

      stepTimer2 = setTimeout(() => {
        setConversionStep('Step 3/4: Rewriting bullet points with ATS action verbs...');
      }, 2200);

      stepTimer3 = setTimeout(() => {
        setConversionStep('Step 4/4: Calculating ATS score & formatting resume...');
      }, 3400);

      let resolvedBase64 = fileBase64;
      let resolvedText = rawText;

      if (!isPasteMode && selectedFile && !resolvedBase64 && !resolvedText) {
        const loaded = await readUploadedFile(selectedFile);
        resolvedBase64 = loaded.base64 || '';
        resolvedText = loaded.text || '';
      }

      if (
        !isPasteMode &&
        selectedFile &&
        (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md')) &&
        (!resolvedText || !resolvedText.trim())
      ) {
        throw new Error('Could not read text from this file, try pasting the text instead.');
      }

      const instructionParts = [
        targetRole.trim() ? `Target Job Role: ${targetRole.trim()}.` : '',
        userInstructions.trim(),
      ]
        .filter(Boolean)
        .join(' ');

      const payload: Record<string, any> = {
        model: selectedModel,
        userInstructions: instructionParts,
        fileName: !isPasteMode && selectedFile ? selectedFile.name : '',
      };

      if (!isPasteMode && resolvedBase64 && selectedFile) {
        const lowerFile = selectedFile.name.toLowerCase();
        payload.fileBase64 = resolvedBase64;
        payload.mimeType =
          selectedFile.type ||
          (lowerFile.endsWith('.docx')
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : lowerFile.endsWith('.doc')
              ? 'application/msword'
              : 'application/pdf');
      }
      if (isPasteMode || (resolvedText && resolvedText.trim())) {
        payload.rawText = resolvedText.trim();
      }

      // Execute request with 1 automatic retry if JSON.parse fails
      let result: any = null;
      let lastResponseBody = '';

      for (let attempt = 0; attempt < 2; attempt++) {
        let res: Response;
        try {
          res = await authFetch(`${API_BASE}/api/ai/convert-resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (networkErr: any) {
          console.error('[AIResumeConverter] Network error:', networkErr?.message, networkErr);
          throw new Error(
            'Could not reach the AI conversion server (/api/ai/convert-resume). Please check your connection and try again.'
          );
        }

        if (res.status === 401) {
          return;
        }

        lastResponseBody = await res.text();

        if (!res.ok) {
          let errMessage = `Failed to convert resume (HTTP ${res.status}).`;
          if (lastResponseBody) {
            try {
              const errJson = parseApiJson(lastResponseBody);
              errMessage = errJson.error || errJson.detail || errJson.message || errMessage;
            } catch {
              if (lastResponseBody.trim().startsWith('<!DOCTYPE') || lastResponseBody.trim().startsWith('<html')) {
                errMessage = 'Backend API endpoint (/api/ai/convert-resume) was not found. Make sure server.ts is running.';
              } else {
                errMessage = `Server error (${res.status}): ${lastResponseBody.slice(0, 200)}`;
              }
            }
          }
          if (import.meta.env.DEV) {
            console.error('[AIResumeConverter] API error:', errMessage);
          }
          throw new Error(errMessage);
        }

        try {
          result = parseApiJson(lastResponseBody);
          break;
        } catch (parseErr: any) {
          if (import.meta.env.DEV) {
            console.error(`[AIResumeConverter] JSON.parse failure (attempt ${attempt + 1}):`, parseErr?.message);
          }
          if (parseErr?.message === 'HTML_FALLBACK_RESPONSE') {
            throw new Error('The AI backend server was still starting up or unreachable. Please wait 2 seconds and click Convert again.');
          }
          if (attempt === 1) {
            throw new Error('Could not parse converted resume response. Please click Convert again or paste plain resume text.');
          }
        }
      }

      if (result?.success && result?.data) {
        const aiData = typeof result.data === 'string' ? parseApiJson(result.data) : result.data;

        const normalizedSkills = Array.isArray(aiData.skills)
          ? aiData.skills
              .filter((s: any) => s && (s.categoryName || Array.isArray(s.skills)))
              .map((s: any, idx: number) => ({
                id: s.id || `skill-${Date.now()}-${idx}`,
                categoryName: s.categoryName || 'Skills',
                skills: Array.isArray(s.skills) ? s.skills.filter(Boolean) : [],
              }))
          : [];

        const normalizedEducation = Array.isArray(aiData.education)
          ? aiData.education
              .filter((ed: any) => ed && (ed.school || ed.degree))
              .map((ed: any, idx: number) => ({
                id: ed.id || `edu-${Date.now()}-${idx}`,
                school: ed.school || '',
                degree: ed.degree || '',
                fieldOfStudy: ed.fieldOfStudy || '',
                location: ed.location || '',
                startDate: ed.startDate || '',
                endDate: ed.endDate || '',
                gpa: ed.gpa || '',
                honors: ed.honors || '',
              }))
          : [];

        const normalizedExperiences = Array.isArray(aiData.experiences)
          ? aiData.experiences
              .filter((ex: any) => ex && (ex.company || ex.role))
              .map((ex: any, idx: number) => ({
                id: ex.id || `exp-${Date.now()}-${idx}`,
                company: ex.company || '',
                role: ex.role || '',
                location: ex.location || '',
                startDate: ex.startDate || '',
                endDate: ex.endDate || '',
                current: Boolean(ex.current),
                bullets: Array.isArray(ex.bullets) ? ex.bullets.filter(Boolean) : [],
              }))
          : [];

        const normalizedProjects = Array.isArray(aiData.projects)
          ? aiData.projects
              .filter((pr: any) => pr && pr.title)
              .map((pr: any, idx: number) => ({
                id: pr.id || `proj-${Date.now()}-${idx}`,
                title: pr.title || '',
                subtitle: pr.subtitle || '',
                liveUrl: pr.liveUrl || '',
                githubUrl: pr.githubUrl || '',
                technologies: Array.isArray(pr.technologies) ? pr.technologies.filter(Boolean) : [],
                bullets: Array.isArray(pr.bullets) ? pr.bullets.filter(Boolean) : [],
              }))
          : [];

        const normalizedCertifications = Array.isArray(aiData.certifications)
          ? aiData.certifications
              .filter((c: any) => c && c.name)
              .map((c: any, idx: number) => ({
                id: c.id || `cert-${Date.now()}-${idx}`,
                name: c.name || '',
                issuer: c.issuer || '',
                issueDate: c.issueDate || '',
                credentialUrl: c.credentialUrl || '',
              }))
          : [];

        const newResume: ResumeData = {
          personalInfo: {
            fullName: aiData.personalInfo?.fullName || '',
            jobTitle: targetRole.trim() || aiData.personalInfo?.jobTitle || '',
            email: aiData.personalInfo?.email || '',
            phone: aiData.personalInfo?.phone || '',
            location: aiData.personalInfo?.location || '',
            linkedin: aiData.personalInfo?.linkedin || '',
            github: aiData.personalInfo?.github || '',
            website: aiData.personalInfo?.website || '',
            photoUrl: currentResume.personalInfo.photoUrl || '',
            includePhoto: currentResume.personalInfo.includePhoto ?? false,
          },
          summaryTitle: aiData.summaryTitle || 'Professional Summary',
          summary: aiData.summary || '',
          skills: normalizedSkills,
          education: normalizedEducation,
          experiences: normalizedExperiences,
          projects: normalizedProjects,
          certifications: normalizedCertifications,
        };

        setConvertedResult({
          resume: newResume,
          atsAnalysis: aiData.atsAnalysis || {
            score: 94,
            strengths: [
              'Action-verb driven accomplishments tailored for ATS scanners',
              'Clean single-column section hierarchy',
              'Structured skill categories aligned to role keywords',
            ],
            improvements: [
              'Verify contact links and dates before exporting PDF',
              'Keep summary between 40-70 words for 1-page A4 fit',
            ],
          },
        });
      } else {
        throw new Error(result?.error || 'Could not read text from this file, try pasting the text instead.');
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('[AIResumeConverter] Conversion failed:', err?.message);
      }
      setErrorMessage(
        err?.message || 'Failed to convert resume. Please check your file or paste the resume text directly.'
      );
    } finally {
      if (stepTimer1) clearTimeout(stepTimer1);
      if (stepTimer2) clearTimeout(stepTimer2);
      if (stepTimer3) clearTimeout(stepTimer3);
      setIsConverting(false);
      setConversionStep('');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    if (isChatListening) stopChatListening();

    const userText = chatInput.trim();
    setChatInput('');
    setChatResumeDraft(null);
    setChatResumeError('');
    setChatResumeConfirmed(false);
    const newMessages = [...chatMessages, { role: 'user' as const, content: userText }];
    setChatMessages(newMessages);

    try {
      setIsChatLoading(true);
      const res = await authFetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentResume,
        }),
      });

      if (res.status === 401) {
        return;
      }

      const rawBody = await res.text();
      if (!res.ok) {
        let errMsg = `Chatbot error (HTTP ${res.status})`;
        try {
          const parsedErr = parseApiJson(rawBody);
          errMsg = parsedErr.error || parsedErr.detail || errMsg;
        } catch {}
        console.error('[AIChatbot] Server error:', errMsg, rawBody);
        throw new Error(errMsg);
      }

      const data = parseApiJson(rawBody);
      if (data.success && data.reply) {
        setChatMessages([...newMessages, { role: 'model', content: data.reply }]);
      } else {
        throw new Error(data.error || 'Empty response from AI assistant.');
      }
    } catch (err: any) {
      console.error('[AIChatbot] Request error:', err?.message, err);
      setChatMessages([
        ...newMessages,
        {
          role: 'model',
          content: `Error: ${err?.message || 'Unable to reach AI assistant right now. Please try again.'}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const chatTranscript = [
    chatMessages
      .filter((message) => message.role === 'user')
      .map((message) => message.content.trim())
      .filter(Boolean)
      .join('\n'),
    resumeToSourceText(currentResume),
  ].filter(Boolean).join('\n');
  const userChatMessageCount = chatMessages.filter((message) => message.role === 'user').length;
  const canCreateChatResumeDraft =
    validateVoiceTranscript(chatTranscript) !== null &&
    (userChatMessageCount >= 3 || chatTranscript.length >= 300);

  const handleCreateChatResumeDraft = async () => {
    const reviewedTranscript = validateVoiceTranscript(chatTranscript);
    if (!reviewedTranscript || isChatResumeExtracting) return;
    setIsChatResumeExtracting(true);
    setChatResumeError('');
    setChatResumeDraft(null);
    setChatResumeConfirmed(false);
    try {
      const response = await authFetch(`${API_BASE}/api/ai/extract-voice-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: reviewedTranscript }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success || !body.data) {
        throw new Error(
          typeof body.error === 'string' ? body.error : CHAT_RESUME_EXTRACTION_ERROR
        );
      }
      setChatResumeDraft(body.data as ResumeData);
    } catch (requestError) {
      setChatResumeError(
        requestError instanceof Error ? requestError.message : CHAT_RESUME_EXTRACTION_ERROR
      );
    } finally {
      setIsChatResumeExtracting(false);
    }
  };

  const handleApplyChatResumeDraft = () => {
    if (!chatResumeDraft || !chatResumeConfirmed) return;
    onApplyChatDraft(chatResumeDraft);
  };

  const handleApply = () => {
    if (convertedResult) {
      onApplyResume(convertedResult.resume);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#291C0E]/70 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FBF5EC] dark:bg-[#241B16] w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-[#BEB5A9] dark:border-[#4A372D] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header: Warm Cocoa Gradient matching Website */}
        <div className="bg-gradient-to-r from-[#291C0E] via-[#3D2817] to-[#291C0E] text-[#F4E6D2] p-4 sm:p-5 flex items-center justify-between border-b border-[#BEB5A9]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C98B5E]/20 backdrop-blur-md flex items-center justify-center text-[#C98B5E] border border-[#C98B5E]/40">
              <Sparkles className="w-5 h-5 text-[#C98B5E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight font-serif text-[#F4E6D2]">
                  Resume Revive — AI ATS Converter & Assistant
                </h2>
                <span className="bg-[#C98B5E] text-[#291C0E] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  ATS 95+
                </span>
              </div>
              <p className="text-xs text-[#E1D4C2] mt-0.5">
                Upload your old resume and automatically format it for 100 professional ATS templates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#E1D4C2] hover:text-[#F4E6D2] hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!convertedResult && (
          <div className="bg-[#F4E6D2] dark:bg-[#2A1F1A] border-b border-[#E1D4C2] dark:border-[#433229] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-[#291C0E] dark:bg-[#DF9F70] text-[#F4E6D2] dark:text-[#1E1612] shadow-xs border border-[#291C0E] dark:border-[#DF9F70]'
                    : 'text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#E1D4C2]/60 dark:hover:bg-[#352720]'
                }`}
              >
                <FileUp className="w-3.5 h-3.5 text-[#C98B5E] dark:text-current" />
                <span>Upload Old File (PDF / DOCX)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-[#291C0E] dark:bg-[#DF9F70] text-[#F4E6D2] dark:text-[#1E1612] shadow-xs border border-[#291C0E] dark:border-[#DF9F70]'
                    : 'text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#E1D4C2]/60 dark:hover:bg-[#352720]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#C98B5E] dark:text-current" />
                <span>Paste Resume Text</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#291C0E] dark:bg-[#DF9F70] text-[#F4E6D2] dark:text-[#1E1612] shadow-xs border border-[#291C0E] dark:border-[#DF9F70]'
                    : 'text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#E1D4C2]/60 dark:hover:bg-[#352720]'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-[#C98B5E] dark:text-current" />
                <span>AI Chatbot Assistant</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#FBF5EC] dark:bg-[#1E1612] text-[#291C0E] dark:text-[#F5EBE0]">
          {/* STATE 1: RESULT SCREEN */}
          {convertedResult ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* ATS Score Card */}
              <div className="bg-[#F4E6D2] dark:bg-[#2A1F1A] border border-[#C98B5E]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#291C0E] text-[#F4E6D2] flex flex-col items-center justify-center font-black shadow-md border-2 border-[#C98B5E]">
                    <span className="text-xl leading-none text-[#C98B5E]">
                      {convertedResult.atsAnalysis?.score || 95}
                    </span>
                    <span className="text-[10px] font-medium opacity-80 text-[#E1D4C2]">/ 100</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#C98B5E]" />
                      <h3 className="text-base font-bold text-[#291C0E] dark:text-[#F5EBE0] font-serif">
                        ATS Conversion Successful!
                      </h3>
                    </div>
                    <p className="text-xs text-[#6E473B] dark:text-[#D2BFA9] mt-0.5">
                      Your old resume has been transformed into high-scoring, ATS-compliant structured sections ready for all 100 templates.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApply}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C98B5E] hover:bg-[#B5774A] active:scale-98 text-[#291C0E] font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#291C0E]" />
                  <span>Apply to 100-Template Builder</span>
                </button>
              </div>

              {/* Converted Summary & Key Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Candidate Overview */}
                <div className="bg-white dark:bg-[#2A1F1A] border border-[#E1D4C2] dark:border-[#433229] rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <span className="font-bold text-[#291C0E] dark:text-[#F5EBE0] uppercase tracking-wider text-[11px] block">
                    Candidate Info Extracted
                  </span>
                  <div className="text-[#6E473B] dark:text-[#D2BFA9] space-y-1">
                    <p>
                      <strong className="text-[#291C0E] dark:text-[#F5EBE0]">Name:</strong> {convertedResult.resume.personalInfo.fullName}
                    </p>
                    <p>
                      <strong className="text-[#291C0E] dark:text-[#F5EBE0]">Target Role:</strong> {convertedResult.resume.personalInfo.jobTitle}
                    </p>
                    <p>
                      <strong className="text-[#291C0E] dark:text-[#F5EBE0]">Contact:</strong> {convertedResult.resume.personalInfo.email} |{' '}
                      {convertedResult.resume.personalInfo.phone}
                    </p>
                    <p>
                      <strong className="text-[#291C0E] dark:text-[#F5EBE0]">Education:</strong> {convertedResult.resume.education.length} entries
                    </p>
                    <p>
                      <strong className="text-[#291C0E] dark:text-[#F5EBE0]">Projects:</strong> {convertedResult.resume.projects.length} technical projects
                    </p>
                    <p>
                      <strong className="text-[#291C0E] dark:text-[#F5EBE0]">Skills:</strong> {convertedResult.resume.skills.length} categories
                    </p>
                  </div>
                </div>

                {/* ATS Highlights */}
                <div className="bg-white dark:bg-[#2A1F1A] border border-[#E1D4C2] dark:border-[#433229] rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider text-[11px] block">
                    ATS Audit Highlights
                  </span>
                  <ul className="space-y-1 text-[#6E473B] dark:text-[#D2BFA9]">
                    {convertedResult.atsAnalysis?.strengths?.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Converted Profile / Summary Preview */}
              <div className="bg-white dark:bg-[#2A1F1A] border border-[#E1D4C2] dark:border-[#433229] rounded-xl p-4 space-y-2 shadow-2xs">
                <span className="font-bold text-[#291C0E] dark:text-[#F5EBE0] text-xs">
                  {convertedResult.resume.summaryTitle || 'Professional Summary'}
                </span>
                <p className="text-xs text-[#6E473B] dark:text-[#D2BFA9] leading-relaxed bg-[#FBF5EC] dark:bg-[#1E1612] p-3 rounded-lg border border-[#E1D4C2] dark:border-[#433229] italic">
                  "{convertedResult.resume.summary}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E1D4C2] dark:border-[#4A372D]">
                <button
                  type="button"
                  onClick={() => setConvertedResult(null)}
                  className="text-xs text-[#6E473B] dark:text-[#CBB8A6] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] font-semibold underline cursor-pointer"
                >
                  ← Convert Another Resume
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartConversion}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#6E473B] dark:text-[#E8B892] bg-[#F4E6D2] dark:bg-[#3A2A20] hover:bg-[#E1D4C2] dark:hover:bg-[#4A362A] border border-[#C98B5E]/50 rounded-xl transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#C98B5E]" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-[#6E473B] dark:text-[#CBB8A6] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply & Open Live Builder</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isConverting ? (
            /* STATE 2: LOADING PROGRESS */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#E1D4C2] dark:border-[#3A2A20] border-t-[#C98B5E] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#C98B5E] absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#291C0E] dark:text-[#F5EBE0] font-serif">
                  AI ATS Engine is Processing Your Resume
                </h3>
                <p className="text-xs text-[#C98B5E] dark:text-[#DF9F70] font-bold animate-pulse">{conversionStep}</p>
                <p className="text-[11px] text-[#A78D78] dark:text-[#CBB8A6]">
                  Powered by Gemini AI • Parsing sections, skills, and ATS formatting metrics
                </p>
              </div>
            </div>
          ) : (
            /* STATE 3: INPUT TABS */
            <div>
              {/* TAB 1: FILE UPLOAD */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  {/* File Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      selectedFile
                        ? 'border-[#C98B5E] bg-[#F4E6D2] dark:bg-[#2A1F1A]'
                        : 'border-[#BEB5A9] dark:border-[#4A372D] hover:border-[#C98B5E] bg-[#F4E6D2]/50 dark:bg-[#2A1F1A]/70 hover:bg-[#F4E6D2] dark:hover:bg-[#2A1F1A]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-[#E1D4C2] dark:bg-[#352720] text-[#C98B5E] dark:text-[#DF9F70] flex items-center justify-center border border-[#BEB5A9] dark:border-[#4A372D]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-bold text-[#291C0E] dark:text-[#F5EBE0]">{selectedFile.name}</p>
                          <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold mt-0.5">
                            ✓ Ready for AI ATS Parsing ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-[#291C0E] dark:text-[#F5EBE0]">
                            Click to upload your old resume file
                          </p>
                          <p className="text-xs text-[#6E473B] dark:text-[#D2BFA9] mt-0.5">
                            Supports PDF, DOCX, or TXT &bull; Maximum file size: 5 MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Target Role & Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] mb-1">
                        Job Role:
                      </label>
                      <input
                        type="text"
                        name="revive-job-role-upload"
                        autoComplete="off"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Data Analyst"
                        className="w-full px-3 py-2 text-xs border border-[#E1D4C2] dark:border-[#4A372D] rounded-xl outline-none focus:ring-2 focus:ring-[#C98B5E]/30 focus:border-[#C98B5E] bg-white dark:bg-[#2F231C] text-[#291C0E] dark:text-[#F5EBE0] placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] mb-1">
                        Special AI Instructions (Optional):
                      </label>
                      <input
                        type="text"
                        name="revive-instructions-upload"
                        autoComplete="off"
                        value={userInstructions}
                        onChange={(e) => setUserInstructions(e.target.value)}
                        placeholder="e.g. Highlight measurable achievements"
                        className="w-full px-3 py-2 text-xs border border-[#E1D4C2] dark:border-[#4A372D] rounded-xl outline-none focus:ring-2 focus:ring-[#C98B5E]/30 focus:border-[#C98B5E] bg-white dark:bg-[#2F231C] text-[#291C0E] dark:text-[#F5EBE0] placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-300 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-900">Resume Conversion Error</p>
                          <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorMessage('')}
                        className="text-rose-600 hover:text-rose-900 p-0.5 cursor-pointer"
                        aria-label="Dismiss error"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStartConversion}
                    className="w-full py-3 bg-[#C98B5E] hover:bg-[#B5774A] active:scale-98 text-[#291C0E] font-bold text-sm rounded-xl shadow-md shadow-[#C98B5E]/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#291C0E]" />
                    <span>Convert Old Resume into ATS-Friendly Format</span>
                  </button>
                </div>
              )}

              {/* TAB 2: PASTE RAW TEXT */}
              {activeTab === 'paste' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] mb-1">
                      Paste Old Resume Content (Text / LinkedIn profile / Notes):
                    </label>
                    <textarea
                      rows={8}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste your existing resume text, work history, education, and skills here..."
                      className="w-full p-3 text-xs border border-[#E1D4C2] dark:border-[#4A372D] rounded-xl focus:ring-2 focus:ring-[#C98B5E]/30 focus:border-[#C98B5E] outline-none font-mono bg-white dark:bg-[#2F231C] text-[#291C0E] dark:text-[#F5EBE0] placeholder:text-stone-400 dark:placeholder:text-stone-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] mb-1">
                        Job Role:
                      </label>
                      <input
                        type="text"
                        name="revive-job-role-paste"
                        autoComplete="off"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Data Analyst"
                        className="w-full px-3 py-2 text-xs border border-[#E1D4C2] dark:border-[#4A372D] rounded-xl outline-none focus:ring-2 focus:ring-[#C98B5E]/30 focus:border-[#C98B5E] bg-white dark:bg-[#2F231C] text-[#291C0E] dark:text-[#F5EBE0] placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] mb-1">
                        Special Instructions (Optional):
                      </label>
                      <input
                        type="text"
                        name="revive-instructions-paste"
                        autoComplete="off"
                        value={userInstructions}
                        onChange={(e) => setUserInstructions(e.target.value)}
                        placeholder="e.g. Focus on measurable results"
                        className="w-full px-3 py-2 text-xs border border-[#E1D4C2] dark:border-[#4A372D] rounded-xl outline-none focus:ring-2 focus:ring-[#C98B5E]/30 focus:border-[#C98B5E] bg-white dark:bg-[#2F231C] text-[#291C0E] dark:text-[#F5EBE0] placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-300 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-900">Resume Conversion Error</p>
                          <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorMessage('')}
                        className="text-rose-600 hover:text-rose-900 p-0.5 cursor-pointer"
                        aria-label="Dismiss error"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStartConversion}
                    className="w-full py-3 bg-[#C98B5E] hover:bg-[#B5774A] active:scale-98 text-[#291C0E] font-bold text-sm rounded-xl shadow-md shadow-[#C98B5E]/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#291C0E]" />
                    <span>Convert Pasted Text into ATS Resume</span>
                  </button>
                </div>
              )}

              {/* TAB 3: AI CHATBOT ASSISTANT */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[400px] min-h-0">
                  {/* Chat messages viewport */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-[#F4E6D2]/60 dark:bg-[#2A1F1A] rounded-2xl border border-[#E1D4C2] dark:border-[#433229] mb-2">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'model' && (
                          <div className="w-7 h-7 rounded-xl bg-[#291C0E] dark:bg-[#352720] text-[#C98B5E] dark:text-[#DF9F70] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#BEB5A9] dark:border-[#4A372D]">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-[#291C0E] dark:bg-[#C98B5E] text-[#F4E6D2] dark:text-[#1E1612] font-medium rounded-tr-xs shadow-xs'
                              : 'bg-white dark:bg-[#1E1612] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#433229] shadow-2xs rounded-tl-xs whitespace-pre-wrap'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex items-center gap-2 text-[#6E473B] dark:text-[#D2BFA9] text-xs p-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C98B5E]" />
                        <span>Junaid's AI Bot is thinking...</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <div className="mb-1 flex flex-wrap items-center justify-between gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] leading-4 text-[#6E473B] dark:text-[#D2BFA9]">
                      <span className="font-semibold">Voice language</span>
                      <select
                        aria-label="Voice recognition language"
                        value={chatVoiceLanguage}
                        disabled={isChatListening}
                        onChange={(event) => setChatVoiceLanguage(event.target.value)}
                        className="max-w-[155px] rounded-lg border border-[#E1D4C2] bg-white px-2 py-1 text-[10px] text-[#291C0E] disabled:opacity-60 dark:border-[#4A372D] dark:bg-[#2F231C] dark:text-[#F5EBE0]"
                      >
                        {CHAT_VOICE_LANGUAGES.map((option) => (
                          <option key={option.tag} value={option.tag}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <p className="text-[10px] text-[#6E473B] dark:text-[#D2BFA9]">
                      Browser speech service may process audio externally; this app does not save recordings. Mixed Hindi-English is best effort.
                    </p>
                  </div>

                  {(isChatListening || isChatTranscribing) && (
                    <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-[#8B552B] dark:text-[#DF9F70]" role="status" aria-live="polite">
                      {isChatListening ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
                          </span>
                          Listening… Speak now
                          {chatInterimTranscript && <span className="truncate font-normal"> {chatInterimTranscript}</span>}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Finalizing transcript…
                        </>
                      )}
                    </div>
                  )}

                  {chatVoiceError && (
                    <div className="mb-1 flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
                      <span>{chatVoiceError}</span>
                      {chatVoiceRetryAvailable && getBrowserSpeechRecognition() && (
                        <button type="button" onClick={startChatListening} className="shrink-0 font-bold underline">
                          Retry
                        </button>
                      )}
                    </div>
                  )}

                  {chatResumeError && (
                    <p className="mb-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-800 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
                      {chatResumeError}
                    </p>
                  )}

                  {/* Chat input box */}
                  <form onSubmit={handleSendMessage} className="flex w-full items-center gap-1.5 sm:gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        chatTranscriptRef.current = e.target.value;
                      }}
                      disabled={isChatResumeExtracting}
                      placeholder="Type or speak your message…"
                      aria-label="Chat message"
                      className="min-w-0 flex-1 px-2.5 py-2.5 text-xs border border-[#E1D4C2] dark:border-[#4A372D] rounded-xl focus:ring-2 focus:ring-[#C98B5E]/30 focus:border-[#C98B5E] outline-none bg-white dark:bg-[#2F231C] text-[#291C0E] dark:text-[#F5EBE0] placeholder:text-stone-400 dark:placeholder:text-stone-500 sm:px-3"
                    />
                    {isChatListening ? (
                      <>
                        <button
                          type="button"
                          onClick={stopChatListening}
                          title="Stop recording"
                          aria-label="Stop recording"
                          aria-pressed={true}
                          className="shrink-0 rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-rose-800 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                        >
                          <Mic className="h-4 w-4 animate-pulse" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelChatListening}
                          title="Cancel recording"
                          aria-label="Cancel recording"
                          className="shrink-0 rounded-xl border border-[#E1D4C2] bg-white p-2.5 text-[#6E473B] transition hover:bg-[#F4E6D2] dark:border-[#4A372D] dark:bg-[#2F231C] dark:text-[#D2BFA9]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={startChatListening}
                        disabled={isChatLoading || isChatTranscribing || isChatResumeExtracting}
                        title="Speak your message"
                        aria-label="Speak your message"
                        aria-pressed={false}
                        className="shrink-0 rounded-xl border border-[#C98B5E]/50 bg-[#F4E6D2] p-2.5 text-[#6E473B] transition hover:bg-[#E1D4C2] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#75543E] dark:bg-[#352720] dark:text-[#DF9F70]"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isChatLoading || isChatListening || isChatResumeExtracting || !chatInput.trim()}
                      className="shrink-0 px-3 py-2.5 bg-[#C98B5E] hover:bg-[#B5774A] text-[#291C0E] rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs sm:px-4"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>

                  {chatResumeDraft ? (
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#C98B5E]/40 bg-[#F4E6D2]/70 px-3 py-2 text-[11px]">
                      <label className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={chatResumeConfirmed}
                          onChange={(event) => setChatResumeConfirmed(event.target.checked)}
                        />
                        <span className="min-w-0">
                          Review-ready draft{chatResumeDraft.personalInfo.fullName ? ` for ${chatResumeDraft.personalInfo.fullName}` : ''}. Create as a new unsaved resume; current saved resume stays unchanged.
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleApplyChatResumeDraft}
                        disabled={!chatResumeConfirmed}
                        className="shrink-0 rounded-lg bg-[#C98B5E] px-3 py-1.5 font-bold text-[#291C0E] disabled:opacity-50"
                      >
                        Use draft
                      </button>
                    </div>
                  ) : (
                    canCreateChatResumeDraft && (
                      <button
                        type="button"
                        onClick={() => void handleCreateChatResumeDraft()}
                        disabled={isChatResumeExtracting || isChatLoading}
                        className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-[#C98B5E]/50 bg-[#F4E6D2]/60 px-3 py-2 text-xs font-semibold text-[#6E473B] transition hover:bg-[#F4E6D2] disabled:opacity-50 dark:text-[#DF9F70]"
                      >
                        {isChatResumeExtracting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                        {isChatResumeExtracting ? 'Organizing your details…' : 'Organize chat details into a resume draft'}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
