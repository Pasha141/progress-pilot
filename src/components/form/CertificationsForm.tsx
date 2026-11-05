/**
 * @file src/components/form/CertificationsForm.tsx
 * Certifications, Licenses, and Achievements form editor.
 */

import React from 'react';
import { CertificationItem } from '../../types/resume';
import { Plus, Trash2, Award, Link } from 'lucide-react';

interface CertificationsFormProps {
  certifications: CertificationItem[];
  onChange: (updated: CertificationItem[]) => void;
}

export const CertificationsForm: React.FC<CertificationsFormProps> = ({
  certifications,
  onChange,
}) => {
  const addCertification = () => {
    const newCert: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      issueDate: '',
      credentialUrl: '',
    };
    onChange([...certifications, newCert]);
  };

  const updateCert = (id: string, field: keyof CertificationItem, value: string) => {
    onChange(
      certifications.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeCert = (id: string) => {
    onChange(certifications.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Certifications & Credentials</h3>
          <p className="text-xs text-slate-500">
            Validated certifications boost technical credibility on ATS scans.
          </p>
        </div>
        <button
          type="button"
          onClick={addCertification}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Certification
        </button>
      </div>

      {certifications.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Award className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">No certifications listed</p>
          <button
            type="button"
            onClick={addCertification}
            className="mt-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
          >
            + Add First Certification
          </button>
        </div>
      )}

      {certifications.map((cert, index) => (
        <div key={cert.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3 relative group">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Certification #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCert(cert.id)}
              className="p-1 text-slate-400 hover:text-red-500 transition rounded"
              title="Delete Certification"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Certification Name *</label>
              <input
                type="text"
                placeholder="e.g. AWS Certified Solutions Architect, Meta Front-End"
                value={cert.name}
                onChange={(e) => updateCert(cert.id, 'name', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Issuing Organization *</label>
              <input
                type="text"
                placeholder="e.g. Amazon Web Services, Coursera, Google"
                value={cert.issuer}
                onChange={(e) => updateCert(cert.id, 'issuer', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Issue Date</label>
              <input
                type="text"
                placeholder="e.g. Mar 2024"
                value={cert.issueDate}
                onChange={(e) => updateCert(cert.id, 'issueDate', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Link className="w-3 h-3 text-slate-400" /> Verification URL
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://www.credly.com/badges/..."
                value={cert.credentialUrl || ''}
                onChange={(e) => updateCert(cert.id, 'credentialUrl', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
