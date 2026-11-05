/**
 * @file src/components/form/ProjectsForm.tsx
 * Projects editor with tech stack chips, quantified achievement bullets,
 * grey placeholders, and "Use example" suggestion helpers.
 */

import React, { useState } from 'react';
import { ProjectItem } from '../../types/resume';
import { Plus, Trash2, FolderGit2, X, Link, Github, Lightbulb, PlusCircle } from 'lucide-react';
import { EXAMPLE_SNIPPETS } from '../../data/sampleResume';

interface ProjectsFormProps {
  projects: ProjectItem[];
  onChange: (updated: ProjectItem[]) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ projects, onChange }) => {
  const [techInput, setTechInput] = useState<{ [projectId: string]: string }>({});
  const [showExamples, setShowExamples] = useState(false);

  const addProject = () => {
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: '',
      subtitle: '',
      liveUrl: '',
      githubUrl: '',
      startDate: '',
      endDate: '',
      technologies: [],
      bullets: [''],
    };
    onChange([...projects, newProj]);
  };

  const updateProject = (id: string, field: keyof ProjectItem, value: any) => {
    onChange(
      projects.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj))
    );
  };

  const removeProject = (id: string) => {
    onChange(projects.filter((proj) => proj.id !== id));
  };

  const addTechTag = (projId: string) => {
    const text = techInput[projId]?.trim();
    if (!text) return;

    onChange(
      projects.map((proj) => {
        if (proj.id !== projId) return proj;
        if (proj.technologies.includes(text)) return proj;
        return { ...proj, technologies: [...proj.technologies, text] };
      })
    );
    setTechInput({ ...techInput, [projId]: '' });
  };

  const removeTechTag = (projId: string, tag: string) => {
    onChange(
      projects.map((proj) => {
        if (proj.id !== projId) return proj;
        return { ...proj, technologies: proj.technologies.filter((t) => t !== tag) };
      })
    );
  };

  const addBullet = (projId: string) => {
    onChange(
      projects.map((proj) =>
        proj.id === projId ? { ...proj, bullets: [...proj.bullets, ''] } : proj
      )
    );
  };

  const updateBullet = (projId: string, index: number, value: string) => {
    onChange(
      projects.map((proj) => {
        if (proj.id !== projId) return proj;
        const newBullets = [...proj.bullets];
        newBullets[index] = value;
        return { ...proj, bullets: newBullets };
      })
    );
  };

  const removeBullet = (projId: string, index: number) => {
    onChange(
      projects.map((proj) => {
        if (proj.id !== projId) return proj;
        const newBullets = proj.bullets.filter((_, i) => i !== index);
        return { ...proj, bullets: newBullets.length ? newBullets : [''] };
      })
    );
  };

  const handleInsertBulletExample = (bulletText: string) => {
    if (projects.length === 0) {
      const newProj: ProjectItem = {
        id: `proj-${Date.now()}`,
        title: '',
        subtitle: '',
        liveUrl: '',
        githubUrl: '',
        startDate: '',
        endDate: '',
        technologies: [],
        bullets: [bulletText],
      };
      onChange([newProj]);
    } else {
      const targetProj = projects[projects.length - 1];
      const hasEmptyBullet = targetProj.bullets.length === 1 && targetProj.bullets[0].trim() === '';
      const updatedBullets = hasEmptyBullet ? [bulletText] : [...targetProj.bullets, bulletText];
      onChange(
        projects.map((proj) =>
          proj.id === targetProj.id ? { ...proj, bullets: updatedBullets } : proj
        )
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Portfolio & Academic Projects</h3>
          <p className="text-xs text-slate-500">
            Showcase key projects, tech stacks, and quantified impact (optional).
          </p>
        </div>
        <button
          type="button"
          onClick={addProject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Project
        </button>
      </div>

      {/* Example Helper Pill Banner */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
            <span>Example project bullet points:</span>
          </span>
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 underline cursor-pointer"
          >
            {showExamples ? 'Hide examples' : 'Show examples'}
          </button>
        </div>

        {showExamples && (
          <div className="space-y-2 pt-1">
            {EXAMPLE_SNIPPETS.projects.map((example, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-700 flex items-start justify-between gap-3 shadow-2xs hover:border-blue-400 transition"
              >
                <p className="flex-1 leading-relaxed">
                  <span className="font-semibold text-blue-600">• </span>
                  {example}
                </p>
                <button
                  type="button"
                  onClick={() => handleInsertBulletExample(example)}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3 text-blue-600" />
                  <span>Insert bullet</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {projects.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <FolderGit2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-600">No projects added yet</p>
          <p className="text-xs text-slate-400 mb-3">Add Capstone, personal, or open-source projects.</p>
          <button
            type="button"
            onClick={addProject}
            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
          >
            + Add First Project
          </button>
        </div>
      )}

      {projects.map((proj, index) => (
        <div key={proj.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3 relative group">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Project #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeProject(proj.id)}
              className="p-1 text-slate-400 hover:text-red-500 transition rounded cursor-pointer"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Project Title</label>
              <input
                type="text"
                placeholder="e.g. Real-Time Analytics Dashboard"
                value={proj.title}
                onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle / Short Summary</label>
              <input
                type="text"
                placeholder="e.g. Full-Stack Web App with Live Feeds"
                value={proj.subtitle || ''}
                onChange={(e) => updateProject(proj.id, 'subtitle', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Github className="w-3 h-3 text-slate-400" /> GitHub Repository URL
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. github.com/username/project"
                value={proj.githubUrl || ''}
                onChange={(e) => updateProject(proj.id, 'githubUrl', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Link className="w-3 h-3 text-slate-400" /> Live Demo URL
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://myproject.dev"
                value={proj.liveUrl || ''}
                onChange={(e) => updateProject(proj.id, 'liveUrl', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
              />
            </div>
          </div>

          {/* Tech stack tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Technologies Used</label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-lg border border-slate-200">
              {proj.technologies.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTechTag(proj.id, t)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex-1 min-w-[140px]">
                <input
                  type="text"
                  placeholder="+ Add tech (press Enter)"
                  value={techInput[proj.id] || ''}
                  onChange={(e) => setTechInput({ ...techInput, [proj.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTechTag(proj.id);
                    }
                  }}
                  className="w-full bg-transparent text-xs outline-none py-1 px-1 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Bullets */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Project Highlights</span>
              <button
                type="button"
                onClick={() => addBullet(proj.id)}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
              >
                + Add Bullet
              </button>
            </div>

            {proj.bullets.map((bullet, bIndex) => (
              <div key={bIndex} className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-bold">•</span>
                <input
                  type="text"
                  placeholder="e.g. Engineered dynamic metric visualization charts processing live streaming data at 60 FPS"
                  value={bullet}
                  onChange={(e) => updateBullet(proj.id, bIndex, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
                />
                {proj.bullets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBullet(proj.id, bIndex)}
                    className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                    title="Remove bullet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
