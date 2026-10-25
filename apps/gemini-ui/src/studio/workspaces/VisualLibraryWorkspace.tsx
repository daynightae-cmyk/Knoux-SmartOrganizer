/**
 * KNOuX SmartOrganizer — Visual Library Workspace (Stage 2)
 * The exact target composition matching REF-01_Smart_Organization_Studio.png
 */

import React from 'react';
import {
  AuthorizedSourcesPanel,
  CenterCategoriesAndGallery,
  OrganizationInspectorPanel,
} from '../panels';

export function VisualLibraryWorkspace() {
  return (
    <div className="flex-1 flex gap-3 px-6 py-2 min-h-0 overflow-hidden">
      {/* 04 — Left Column: Authorized Sources */}
      <AuthorizedSourcesPanel />

      {/* 05 & 06 — Center Column: File Categories & Gallery */}
      <CenterCategoriesAndGallery />

      {/* 07 — Right Column: Organization Inspector */}
      <OrganizationInspectorPanel />
    </div>
  );
}
