/**
 * @file src/components/form/PersonalInfoForm.tsx
 * Form editor for personal contact details, social links, and optional photo upload.
 * Features grey placeholder guidance and inline validation feedback.
 */

import React, { useRef, useState } from 'react';
import { PersonalInfo } from '../../types/resume';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  Camera,
  Trash2,
  Upload,
  Info,
  AlertCircle,
} from 'lucide-react';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (updated: PersonalInfo) => void;
  errors?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string>('');

  const handleChange = (field: keyof PersonalInfo, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo size must be under 2 MB.');
      return;
    }

    setPhotoError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange({ ...data, photoUrl: result, includePhoto: true });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoError('');
    onChange({ ...data, photoUrl: '', includePhoto: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">Personal Contact Details</h3>
        <p className="text-xs text-slate-500">Provide clear contact info for ATS parsers and hiring managers.</p>
      </div>

      {/* Profile Photo Upload Section */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" /> Profile Photo (Optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-photo-toggle"
              checked={data.includePhoto ?? false}
              onChange={(e) => handleChange('includePhoto', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="include-photo-toggle" className="text-xs text-slate-600 cursor-pointer select-none font-medium">
              Show on Resume
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300 flex-shrink-0 flex items-center justify-center">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" /> Upload Image
              </button>

              {data.photoUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {photoError && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{photoError}</span>
              </p>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>Recommended for European or Creative templates. Toggle off for standard tech ATS scans.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. Priya Sharma"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400 ${
              errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
            }`}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Professional Headline
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. Software Engineer | Data Analyst"
            value={data.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            type="email"
            placeholder="e.g. priya.sharma@email.com"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400 ${
              errors.email ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400 ${
              errors.phone ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.phone}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location (City, State, Country)
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. Bengaluru, Karnataka, India"
            value={data.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Profile
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. linkedin.com/in/priyasharma"
            value={data.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-slate-800" /> GitHub Profile
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. github.com/priyasharma"
            value={data.github}
            onChange={(e) => handleChange('github', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" /> Portfolio Website / Blog
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. priyasharma.dev"
            value={data.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white placeholder-slate-400"
          />
        </div>
      </div>
    </div>
  );
};
