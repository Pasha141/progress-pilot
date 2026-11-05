import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Mic, Square, X } from 'lucide-react';
import type { ResumeData } from '../../types/resume';
import { authFetch } from '../../utils/authSession';
import { MAX_VOICE_TRANSCRIPT_LENGTH, validateVoiceTranscript } from '../../utils/voiceResumeExtraction';
import {
  BrowserSpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  getBrowserSpeechRecognition,
} from '../../utils/browserSpeechRecognition';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const VOICE_LANGUAGES = [
  { tag: 'en-IN', label: 'English (India)' },
  { tag: 'en-US', label: 'English (United States)' },
  { tag: 'hi-IN', label: 'Hindi (India)' },
  { tag: 'ur-PK', label: 'Urdu (Pakistan)' },
  { tag: 'kn-IN', label: 'Kannada (India)' },
];

interface VoiceResumeAssistantProps {
  onClose: () => void;
  onApplyResume: (resume: ResumeData) => void;
  currentResumeHasContent: boolean;
  savedResumeIsOpen: boolean;
}

export function VoiceResumeAssistant({
  onClose,
  onApplyResume,
  currentResumeHasContent,
  savedResumeIsOpen,
}: VoiceResumeAssistantProps) {
  const [language, setLanguage] = useState(VOICE_LANGUAGES[0].tag);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedResume, setExtractedResume] = useState<ResumeData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const listeningRef = useRef(false);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // Browser recognition may already have stopped.
      }
      recognitionRef.current = null;
    };
  }, []);

  const startListening = () => {
    const Recognition = getBrowserSpeechRecognition();
    if (!Recognition) {
      setError('Speech recognition is not available in this browser. You can type or paste your transcript instead.');
      return;
    }

    setError('');
    setInterimTranscript('');
    transcriptRef.current = transcript;
    try {
      const recognition = new Recognition();
      recognition.lang = language;
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
          transcriptRef.current = `${transcriptRef.current}${transcriptRef.current ? ' ' : ''}${finalText}`
            .trim()
            .slice(0, MAX_VOICE_TRANSCRIPT_LENGTH);
          setTranscript(transcriptRef.current);
        }
        setInterimTranscript(interimText);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const messages: Record<string, string> = {
          'not-allowed': 'Microphone permission was denied. Allow microphone access or enter the transcript manually.',
          'service-not-allowed': 'This browser speech service is unavailable. Enter the transcript manually or try another supported browser.',
          'no-speech': 'No speech was detected. Try again or enter the transcript manually.',
          network: 'The browser speech service could not be reached. Check your connection or enter the transcript manually.',
        };
        setError(messages[event.error] || 'Speech recognition stopped unexpectedly. You can try again or enter the transcript manually.');
      };
      recognition.onend = () => {
        listeningRef.current = false;
        setListening(false);
        setInterimTranscript('');
      };
      recognitionRef.current = recognition;
      listeningRef.current = true;
      setListening(true);
      recognition.start();
    } catch {
      listeningRef.current = false;
      setListening(false);
      setError('Could not start speech recognition. Check microphone permissions or enter the transcript manually.');
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      listeningRef.current = false;
      setListening(false);
    }
  };

  const handleTranscriptChange = (value: string) => {
    const boundedValue = value.slice(0, MAX_VOICE_TRANSCRIPT_LENGTH);
    transcriptRef.current = boundedValue;
    setTranscript(boundedValue);
    setExtractedResume(null);
    setConfirmed(false);
    setError('');
  };

  const extractResume = async () => {
    const reviewedTranscript = validateVoiceTranscript(transcript);
    if (!reviewedTranscript) {
      setError(`Enter or dictate between 20 and ${MAX_VOICE_TRANSCRIPT_LENGTH.toLocaleString()} characters before extracting.`);
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const response = await authFetch(`${API_BASE}/api/ai/extract-voice-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: reviewedTranscript }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success || !body.data) {
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'Could not extract a resume right now. Review the transcript and try again.'
        );
      }
      setExtractedResume(body.data as ResumeData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not extract a resume right now. Review the transcript and try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const applyResume = () => {
    if (!extractedResume || !confirmed) return;
    onApplyResume(extractedResume);
  };

  const recognitionAvailable = Boolean(getBrowserSpeechRecognition());
  const resumeSectionCount = extractedResume
    ? extractedResume.experiences.length +
      extractedResume.education.length +
      extractedResume.projects.length +
      extractedResume.certifications.length +
      extractedResume.skills.reduce((count, category) => count + category.skills.length, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-resume-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E1D4C2] bg-[#FBF5EC] p-5 text-[#291C0E] shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="voice-resume-title" className="text-xl font-bold">Voice-to-Resume</h2>
            <p className="mt-1 text-sm text-[#6E473B]">Speak or type your work history, then review the extracted details before creating a draft.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close voice assistant" className="rounded-lg p-2 hover:bg-[#F4E6D2]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-[#D8C8B3] bg-white/70 p-3 text-xs leading-relaxed text-[#5C4334]">
          Speech recognition is provided by your browser or operating system; it may send audio to that provider, and availability and accuracy vary. This app does not upload or store audio. When you select Extract, the reviewed transcript is sent over your authenticated Express connection to the configured Gemini provider for extraction. The voice feature does not save transcripts or resumes automatically.
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label htmlFor="voice-language" className="text-sm font-semibold">Recognition language</label>
          <select
            id="voice-language"
            value={language}
            disabled={listening}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-lg border border-[#D8C8B3] bg-white px-3 py-2 text-sm"
          >
            {VOICE_LANGUAGES.map((option) => (
              <option key={option.tag} value={option.tag}>{option.label}</option>
            ))}
          </select>
          {!recognitionAvailable && <span className="text-xs text-[#6E473B]">Voice input is unavailable; manual transcript entry is ready.</span>}
        </div>

        <div className="mb-2 flex items-center gap-2">
          {listening ? (
            <button type="button" onClick={stopListening} className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white">
              <Square className="h-4 w-4" /> Stop listening
            </button>
          ) : (
            <button type="button" onClick={startListening} className="inline-flex items-center gap-2 rounded-lg bg-[#291C0E] px-3 py-2 text-sm font-semibold text-white">
              <Mic className="h-4 w-4" /> Start speaking
            </button>
          )}
          {listening && <span className="text-sm font-medium text-rose-800">Listening…</span>}
        </div>
        <label htmlFor="voice-transcript" className="mb-1 block text-sm font-semibold">Transcript (editable)</label>
        <textarea
          id="voice-transcript"
          value={transcript}
          maxLength={MAX_VOICE_TRANSCRIPT_LENGTH}
          onChange={(event) => handleTranscriptChange(event.target.value)}
          placeholder="Describe your name, contact details, roles, dates, education, skills, projects and certifications. Missing details will be left blank."
          rows={7}
          className="w-full resize-y rounded-xl border border-[#D8C8B3] bg-white p-3 text-sm leading-relaxed outline-none focus:border-[#C98B5E]"
        />
        <div className="mt-1 flex justify-between text-xs text-[#6E473B]">
          <span>{interimTranscript ? `Recognizing: ${interimTranscript}` : 'Review and correct speech-to-text before extraction.'}</span>
          <span>{transcript.length.toLocaleString()} / {MAX_VOICE_TRANSCRIPT_LENGTH.toLocaleString()}</span>
        </div>

        {error && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        {!extractedResume ? (
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#D8C8B3] px-4 py-2 text-sm font-semibold">Cancel</button>
            <button
              type="button"
              onClick={() => void extractResume()}
              disabled={processing || listening || !validateVoiceTranscript(transcript)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C98B5E] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {processing ? 'Extracting…' : 'Extract & review'}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#D8C8B3] bg-white/70 p-4">
            <h3 className="font-bold">Review in the resume editor</h3>
            <p className="mt-1 text-sm text-[#5C4334]">
              Extracted {resumeSectionCount} items across work, education, skills, projects and certifications.
              {extractedResume.personalInfo.fullName ? ` Candidate: ${extractedResume.personalInfo.fullName}.` : ''}
              {' '}All fields remain editable in the resume builder. Nothing is saved until you choose Save.
            </p>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-1"
              />
              <span>
                Create a separate, unsaved resume draft. {savedResumeIsOpen ? 'The currently saved resume will remain unchanged.' : ''}
                {currentResumeHasContent ? ' Any unsaved content currently in the editor will be replaced.' : ''}
                {' '}I will review and edit the fields before saving.
              </span>
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setExtractedResume(null); setConfirmed(false); }} className="rounded-lg border border-[#D8C8B3] px-4 py-2 text-sm font-semibold">
                Edit transcript
              </button>
              <button
                type="button"
                onClick={applyResume}
                disabled={!confirmed}
                className="rounded-lg bg-[#C98B5E] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create unsaved draft
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
