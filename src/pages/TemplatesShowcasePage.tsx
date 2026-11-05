/**
 * @file src/pages/TemplatesShowcasePage.tsx
 * Showcase Page for Resume Builder by Junaid.
 * Seamlessly integrates the modern Landing Page and Template Gallery.
 */

import React from 'react';
import { TemplateId } from '../types/resume';
import { LandingPage } from './LandingPage';

interface TemplatesShowcasePageProps {
  onSelectTemplate: (templateId: TemplateId, accentColor?: string) => void;
  onNavigateToBuilder: () => void;
  onNavigateToLogin: () => void;
  currentTemplate: TemplateId;
}

export const TemplatesShowcasePage: React.FC<TemplatesShowcasePageProps> = ({
  onSelectTemplate,
  onNavigateToBuilder,
  onNavigateToLogin,
  currentTemplate,
}) => {
  return (
    <LandingPage
      onSelectTemplate={onSelectTemplate}
      onNavigateToBuilder={onNavigateToBuilder}
      onNavigateToLogin={onNavigateToLogin}
      currentTemplateId={currentTemplate}
    />
  );
};
