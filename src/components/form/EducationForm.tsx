/**
 * @file src/components/form/EducationForm.tsx
 * Education editor for degree, institution, GPA, and graduation dates.
 */

import React from 'react';
import { EducationItem } from '../../types/resume';
import { Plus, Trash2, GraduationCap, Award } from 'lucide-react';

interface EducationFormProps {
  education: EducationItem[];
  onChange: (updated: EducationItem[]) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({ education, onChange }) => {
  const addEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      school: '',
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      honors: '',
    };
    onChange([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof EducationItem, value: string) => {
    onChange(
      education.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeEducation = (id: string) => {
    onChange(education.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Education & Academics</h3>
          <p className="text-xs text-slate-500">List degrees in reverse chronological order.</p>
        </div>
        <button
          type="button"
          onClick={addEducation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Degree
        </button>
      </div>

      {education.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <GraduationCap className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">No education entries yet</p>
          <p className="text-xs text-slate-400 mb-3">Add your college, university, or academic degree.</p>
          <button
            type="button"
            onClick={addEducation}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
          >
            + Add First Degree
          </button>
        </div>
      )}

      {education.map((edu, index) => (
        <div key={edu.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3 relative group">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Degree #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeEducation(edu.id)}
              className="p-1 text-slate-400 hover:text-red-500 transition rounded"
              title="Delete Degree"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Institution / University *</label>
              <input
                type="text"
                placeholder="e.g. National Institute of Technology, California State University"
                value={edu.school}
                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Degree Title *</label>
              <input
                type="text"
                placeholder="e.g. Bachelor of Technology (B.Tech), B.S."
                value={edu.degree}
                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Major / Field of Study *</label>
              <input
                type="text"
                placeholder="e.g. Computer Science and Engineering"
                value={edu.fieldOfStudy}
                onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. New Delhi, India"
                value={edu.location}
                onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2020"
                  value={edu.startDate}
                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End / Grad Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  value={edu.endDate}
                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">GPA / Percentage</label>
              <input
                type="text"
                placeholder="e.g. 8.8 / 10.0 or 3.8 / 4.0"
                value={edu.gpa}
                onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" /> Honors / Minors (Optional)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. Magna Cum Laude, Minor in Data Science"
                value={edu.honors || ''}
                onChange={(e) => updateEducation(edu.id, 'honors', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
