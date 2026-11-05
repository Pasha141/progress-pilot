/**
 * Professional developer footer for ATS-Friendly Resume Builder.
 * Developer: Mohammed Junaid Pasha
 */

import React from 'react';
import {
  Linkedin,
  Github,
  GraduationCap,
  Sparkles,
  Heart,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FBF5EC] text-[#6E473B] border-t border-[#E1D4C2] no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-[#F4E6D2] rounded-3xl p-6 sm:p-8 border border-[#E1D4C2] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C98B5E]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative z-10">
            {/* Developer Photo */}
            <div className="relative flex-shrink-0">
              <div className="p-1.5 rounded-3xl bg-gradient-to-tr from-[#C98B5E] via-[#F4E6D2] to-[#291C0E] shadow-xl shadow-[#291C0E]/25 ring-4 ring-[#C98B5E]/40">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[20px] overflow-hidden border-2 border-[#291C0E] bg-[#291C0E]">
                  <img
                    src="/assets/aistudio/WhatsApp_Image_2026-10-21_at_9.47.52_PM_c6afd6a3.jpeg"
                    alt="Mohammed Junaid Pasha, project developer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: '50% 50%',
                      transform: 'scale(2.4)',
                      transformOrigin: '51% 50%',
                    }}
                  />
                </div>
              </div>

              <div
                className="absolute -bottom-2 -right-2 bg-[#C98B5E] text-[#291C0E] p-2 rounded-full shadow-lg border-2 border-[#F4E6D2]"
                title="Project Developer"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Developer Information */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C98B5E]/20 text-[#291C0E] border border-[#C98B5E]/40">
                  Designed &amp; Developed By
                </span>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  CSE Graduate · 2026
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#291C0E] tracking-tight font-serif">
                  Mohammed Junaid Pasha
                </h3>
                <p className="text-sm sm:text-base font-bold text-[#C98B5E] mt-1">
                  Computer Science Engineer | Aspiring Data Analyst
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-[#6E473B]">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#C98B5E]" />
                  Sir M. Visvesvaraya College of Engineering, Raichur
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  Karnataka, India
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#6E473B] max-w-3xl leading-relaxed">
                I built <strong className="text-[#291C0E]">ATS-Friendly Resume Builder</strong>
                {' '}to help job seekers create professional resumes, explore ATS-friendly
                templates, and improve their applications. This project reflects my
                interest in software development, data analysis, and practical AI tools.
              </p>

              {/* Professional Profile Links — no phone or email */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <a
                  href="https://linkedin.com/in/mohammed-junaid-pasha"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Mohammed Junaid Pasha on LinkedIn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#FBF5EC] hover:bg-[#E1D4C2] text-[#291C0E] border border-[#E1D4C2] transition"
                >
                  <Linkedin className="w-4 h-4 text-sky-700" />
                  LinkedIn
                </a>

                <a
                  href="https://github.com/mdjunaid7141"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Mohammed Junaid Pasha on GitHub"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#FBF5EC] hover:bg-[#E1D4C2] text-[#291C0E] border border-[#E1D4C2] transition"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-[#E1D4C2] py-6 px-4 sm:px-6 lg:px-8 bg-[#F4E6D2] text-xs text-[#6E473B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-[#291C0E]">
              © 2026 <strong>ATS-Friendly Resume Builder</strong>. All rights reserved.
            </p>
            <p className="text-[11px] text-[#6E473B] mt-1">
              Built by Mohammed Junaid Pasha · B.E. Computer Science &amp; Engineering
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] flex-wrap justify-center">
            <span>ATS-Friendly Templates</span>
            <span>•</span>
            <span>Resume Builder</span>
            <span>•</span>
            <span>PDF Export</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[#291C0E] font-medium">
              Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> in Karnataka
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
