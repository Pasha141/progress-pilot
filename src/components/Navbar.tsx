/**
 * @file src/components/Navbar.tsx
 * Top Navigation bar for Resume Builder by Junaid.
 * Warm Brown & Cream Palette: #291C0E, #6E473B, #E1D4C2, #F4E6D2, #C98B5E.
 * Auth states:
 * - Logged out: Sign In and Create Account buttons.
 * - Logged in: User's name + initial avatar with dropdown (My Resumes, Logout); hides Create Account & Sign In.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ActivePage, AuthUser } from '../types/resume';
import {
  FileText,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Sun,
  Moon,
  BookOpen,
  FolderOpen,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  user: AuthUser | null;
  onLogout: () => void;
  onOpenAiConverter?: () => void;
  onOpenMyResumes?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  user,
  onLogout,
  onOpenAiConverter,
  onOpenMyResumes,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [careerCenterModalOpen, setCareerCenterModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('app_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    try {
      localStorage.setItem('app_theme', isDarkMode ? 'dark' : 'light');
    } catch {}
  }, [isDarkMode]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserDropdownOpen(false);
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleGoMyResumes = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onOpenMyResumes) {
      onOpenMyResumes();
    } else {
      onNavigate('my-resumes');
    }
  };

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <header className="w-full bg-[#FBF5EC]/95 dark:bg-[#1E1612]/95 backdrop-blur-md border-b border-[#E1D4C2] dark:border-[#3D2C23] sticky top-0 z-40 shadow-xs no-print select-none transition-colors">
        <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-4 lg:px-5 h-16 flex items-center justify-between gap-2 min-w-0">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => onNavigate('landing')}
          >
            <div className="w-8 h-8 rounded-xl bg-[#C98B5E] dark:bg-[#DF9F70] text-[#291C0E] flex items-center justify-center font-black shadow-sm shadow-[#C98B5E]/30 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm xl:text-[15px] font-serif font-black tracking-tight text-[#291C0E] dark:text-[#F5EBE0] whitespace-nowrap">
                  Resume Builder <span className="text-[#C98B5E] dark:text-[#DF9F70] font-extrabold">by Junaid</span>
                </span>
                <span className="hidden 2xl:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E1D4C2] dark:bg-[#352720] text-[#291C0E] dark:text-[#F5EBE0] border border-[#BEB5A9] dark:border-[#4A372D]">
                  ATS 99%
                </span>
              </div>
              <p className="hidden 2xl:block text-[10px] text-[#6E473B] dark:text-[#CBB8A6] font-medium whitespace-nowrap">
                ATS-friendly templates & 1-page A4 guarantee
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop - strictly single line, zero overflow) */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-2 xl:gap-3 2xl:gap-4 text-[11px] xl:text-xs font-semibold text-[#6E473B] dark:text-[#D2BFA9] min-w-0">
            <button
              type="button"
              onClick={() => onNavigate('builder')}
              className={`hover:text-[#291C0E] dark:hover:text-[#F5EBE0] whitespace-nowrap shrink-0 transition cursor-pointer relative py-1 ${
                activePage === 'builder' ? 'text-[#291C0E] dark:text-[#F5EBE0] font-bold' : ''
              }`}
            >
              <span>Resume Builder</span>
              <span className="hidden 2xl:inline"> App</span>
              {activePage === 'builder' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C98B5E] dark:bg-[#DF9F70] rounded-full" />
              )}
            </button>

            {onOpenAiConverter && (
              <button
                type="button"
                onClick={onOpenAiConverter}
                title="Convert your old resume into an ATS-friendly resume"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] xl:text-xs font-bold whitespace-nowrap shrink-0 bg-[#F3E3D0] hover:bg-[#EAD5BC] text-[#B5653B] border border-[#C98B5E]/65 dark:bg-[#3A2A20] dark:hover:bg-[#4A362A] dark:text-[#E8B892] dark:border-[#C98B5E]/45 active:scale-95 transition cursor-pointer font-sans"
              >
                <Sparkles className="w-3 h-3 shrink-0 text-[#B5653B] dark:text-[#E8B892]" />
                <span>Resume Revive</span>
                <span className="px-1 py-0.2 rounded-full text-[8.5px] font-extrabold bg-[#C98B5E]/20 text-[#9E522B] dark:bg-[#C98B5E]/25 dark:text-[#F2C6A0]">
                  AI
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('templates')}
              className={`hover:text-[#291C0E] dark:hover:text-[#F5EBE0] whitespace-nowrap shrink-0 transition cursor-pointer relative py-1 ${
                activePage === 'templates' ? 'text-[#291C0E] dark:text-[#F5EBE0] font-bold' : ''
              }`}
            >
              <span className="hidden 2xl:inline">Resume </span>
              <span>Templates</span>
              {activePage === 'templates' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C98B5E] dark:bg-[#DF9F70] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('cover-letter')}
              className={`hover:text-[#291C0E] dark:hover:text-[#F5EBE0] whitespace-nowrap shrink-0 transition cursor-pointer flex items-center gap-1 relative py-1 ${
                activePage === 'cover-letter' ? 'text-[#291C0E] dark:text-[#F5EBE0] font-bold' : ''
              }`}
            >
              <span>
                Cover Letter<span className="hidden 2xl:inline"> Builder</span>
              </span>
              {activePage === 'cover-letter' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C98B5E] dark:bg-[#DF9F70] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('ats-checker')}
              className={`hover:text-[#291C0E] dark:hover:text-[#F5EBE0] whitespace-nowrap shrink-0 transition cursor-pointer flex items-center gap-1 relative py-1 ${
                activePage === 'ats-checker' ? 'text-[#291C0E] dark:text-[#F5EBE0] font-bold' : ''
              }`}
            >
              <span>
                ATS <span className="hidden 2xl:inline">Score </span>Checker
              </span>
              {activePage === 'ats-checker' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C98B5E] dark:bg-[#DF9F70] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setCareerCenterModalOpen(true)}
              className="hidden 2xl:inline-block hover:text-[#291C0E] dark:hover:text-[#F5EBE0] whitespace-nowrap shrink-0 transition cursor-pointer py-1"
            >
              Career Center
            </button>

            {user && (
              <button
                type="button"
                onClick={handleGoMyResumes}
                className={`hover:text-[#291C0E] dark:hover:text-[#F5EBE0] whitespace-nowrap shrink-0 transition cursor-pointer flex items-center gap-1 relative py-1 ${
                  activePage === 'my-resumes' ? 'text-[#291C0E] dark:text-[#F5EBE0] font-bold' : ''
                }`}
                title="View your private saved resumes"
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#C98B5E] dark:text-[#DF9F70]" />
                <span>My Resumes</span>
                {activePage === 'my-resumes' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C98B5E] dark:bg-[#DF9F70] rounded-full" />
                )}
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 xl:p-2 rounded-xl bg-[#F4E6D2] dark:bg-[#352720] hover:bg-[#E1D4C2] dark:hover:bg-[#46342A] text-[#6E473B] dark:text-[#E8B892] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] transition cursor-pointer shrink-0"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth Controls (Desktop & Tablet) */}
            {user ? (
              <div className="hidden sm:block relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl text-xs font-bold bg-[#F4E6D2] dark:bg-[#352720] hover:bg-[#E1D4C2] dark:hover:bg-[#46342A] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] transition cursor-pointer whitespace-nowrap"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#291C0E] dark:bg-[#C98B5E] text-[#FBF5EC] dark:text-[#291C0E] flex items-center justify-center text-[11px] font-black shrink-0">
                    {userInitial}
                  </span>
                  <span className="max-w-[110px] truncate">{user.name}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#6E473B] dark:text-[#D2BFA9] transition-transform ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#FBF5EC] dark:bg-[#241B16] border border-[#E1D4C2] dark:border-[#3D2C23] shadow-xl z-50 overflow-hidden py-1.5 text-xs text-[#291C0E] dark:text-[#F5EBE0]"
                  >
                    <div className="px-3.5 py-2.5 border-b border-[#E1D4C2] dark:border-[#3D2C23]">
                      <div className="font-bold truncate">{user.name}</div>
                      <div className="text-[11px] text-[#6E473B] dark:text-[#D2BFA9] truncate">
                        {user.email}
                      </div>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleGoMyResumes}
                      className="w-full px-3.5 py-2.5 text-left font-semibold hover:bg-[#F4E6D2] dark:hover:bg-[#352720] flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-[#C98B5E] dark:text-[#DF9F70]" />
                      <span>My Resumes</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-2.5 text-left font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    activePage === 'login'
                      ? 'bg-[#291C0E] dark:bg-[#F5EBE0] text-[#FBF5EC] dark:text-[#291C0E]'
                      : 'text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#352720]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
                    activePage === 'register'
                      ? 'bg-[#291C0E] dark:bg-[#F5EBE0] text-[#FBF5EC] dark:text-[#291C0E] border-[#291C0E] dark:border-[#F5EBE0]'
                      : 'bg-[#F4E6D2] dark:bg-[#352720] hover:bg-[#E1D4C2] dark:hover:bg-[#46342A] text-[#291C0E] dark:text-[#F5EBE0] border-[#E1D4C2] dark:border-[#4A372D]'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Copper CTA: "Build My Resume" */}
            <button
              type="button"
              onClick={() => onNavigate('builder')}
              className="hidden md:inline-flex items-center gap-1 px-3.5 py-1.5 xl:px-4 xl:py-1.5 text-[11px] xl:text-xs font-bold whitespace-nowrap shrink-0 text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] active:scale-95 rounded-full shadow-md shadow-[#C98B5E]/20 hover:shadow-lg hover:shadow-[#C98B5E]/30 transition cursor-pointer font-sans"
            >
              <span>Build My Resume</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden p-2 rounded-xl text-[#6E473B] dark:text-[#E8B892] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E1D4C2] dark:border-[#3D2C23] bg-[#FBF5EC] dark:bg-[#241B16] px-4 py-4 space-y-3">
            <button
              type="button"
              onClick={() => handleNavClick(() => onNavigate('builder'))}
              className="w-full text-left py-2 text-sm font-semibold text-[#291C0E] dark:text-[#F5EBE0] hover:text-[#C98B5E] flex items-center justify-between"
            >
              <span>Resume Builder App</span>
              <ArrowRight className="w-4 h-4 text-[#A78D78]" />
            </button>

            {onOpenAiConverter && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenAiConverter)}
                className="w-full text-left py-2 text-sm font-bold text-[#B5653B] dark:text-[#E8B892] hover:text-[#C98B5E] flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Resume Revive</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#F3E3D0] text-[#B5653B] dark:bg-[#3A2A20] dark:text-[#E8B892] border border-[#C98B5E]/50">
                    Old → ATS AI
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-[#C98B5E]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick(() => onNavigate('templates'))}
              className="w-full text-left py-2 text-sm font-semibold text-[#291C0E] dark:text-[#F5EBE0] hover:text-[#C98B5E] flex items-center justify-between"
            >
              <span>Resume Templates</span>
              <ArrowRight className="w-4 h-4 text-[#A78D78]" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick(() => onNavigate('cover-letter'))}
              className="w-full text-left py-2 text-sm font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] flex items-center justify-between"
            >
              <span>Cover Letter Builder</span>
              <ArrowRight className="w-4 h-4 text-[#A78D78]" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick(() => onNavigate('ats-checker'))}
              className="w-full text-left py-2 text-sm font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] flex items-center justify-between"
            >
              <span>ATS Score Checker</span>
              <ArrowRight className="w-4 h-4 text-[#A78D78]" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick(() => setCareerCenterModalOpen(true))}
              className="w-full text-left py-2 text-sm font-semibold text-[#291C0E] dark:text-[#F5EBE0] hover:text-[#C98B5E] flex items-center justify-between"
            >
              <span>Career Center & ATS Tips</span>
              <ArrowRight className="w-4 h-4 text-[#A78D78]" />
            </button>

            {user ? (
              <div className="pt-2 border-t border-[#E1D4C2] dark:border-[#3D2C23] space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-[#291C0E] dark:bg-[#C98B5E] text-[#FBF5EC] dark:text-[#291C0E] flex items-center justify-center text-xs font-black shrink-0">
                    {userInitial}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] truncate">
                      {user.name}
                    </span>
                    <span className="block text-[11px] text-[#6E473B] dark:text-[#D2BFA9] truncate">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoMyResumes}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-[#F4E6D2] dark:bg-[#352720] text-[#291C0E] dark:text-[#F5EBE0] border border-[#E1D4C2] dark:border-[#4A372D] flex items-center justify-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                    <span>My Resumes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick(onLogout)}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#E1D4C2] dark:border-[#3D2C23] grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleNavClick(() => onNavigate('login'))}
                  className="py-2.5 px-3 text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] bg-[#F4E6D2] dark:bg-[#352720] border border-[#E1D4C2] dark:border-[#4A372D] rounded-xl flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick(() => onNavigate('register'))}
                  className="py-2.5 px-3 text-xs font-bold text-[#FBF5EC] dark:text-[#291C0E] bg-[#291C0E] dark:bg-[#DF9F70] rounded-xl flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleNavClick(() => onNavigate('builder'))}
              className="w-full py-3 text-xs font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] rounded-full flex items-center justify-center gap-2 shadow-sm font-sans"
            >
              <span>Launch Resume Builder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Career Center Advice Modal */}
      {careerCenterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#291C0E]/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#FBF5EC] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E1D4C2] relative space-y-4 text-[#291C0E]">
            <div className="flex items-center justify-between border-b border-[#E1D4C2] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C98B5E]" />
                <h3 className="text-base font-bold text-[#291C0E] font-serif">Career Center & ATS Guidelines</h3>
              </div>
              <button
                type="button"
                onClick={() => setCareerCenterModalOpen(false)}
                className="text-[#6E473B] hover:text-[#291C0E] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#6E473B] space-y-3 leading-relaxed">
              <p>
                <strong>1. ATS Scanning Engine:</strong> Always use standard section headings (Summary, Experience, Education, Skills) so applicant tracking systems categorize your records with 100% accuracy.
              </p>
              <p>
                <strong>2. Quantifiable Impact:</strong> Highlight numbers, percentages, and dollar figures in experience bullet points (e.g., &ldquo;Reduced latency by 45%&rdquo;, &ldquo;Managed $12M revenue&rdquo;).
              </p>
              <p>
                <strong>3. 1-Page A4 Discipline:</strong> Recruiters spend an average of 6 seconds per resume. Keep your resume strictly to 1 page unless you have 10+ years of executive tenure.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCareerCenterModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] rounded-xl shadow-xs transition cursor-pointer font-sans"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
