/**
 * KNOuX SmartOrganizer — Studio Command Center
 * Section 01: Smart Organization Studio
 */

import React, { useEffect } from 'react';
import { useStudio } from './context';
import { StudioStageId } from './types';

export function StudioCommandCenter() {
  const {
    activeStageId,
    setActiveStageId,
    selectAllFiles,
    deselectAllFiles,
    selectedFileIds,
    closeModal,
  } = useStudio();

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 1-9 switch stage if not focusing an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        const stageNum = parseInt(e.key, 10) as StudioStageId;
        setActiveStageId(stageNum);
      } else if (e.key === 'Escape') {
        closeModal();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (selectedFileIds.size > 0) {
          deselectAllFiles();
        } else {
          selectAllFiles();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStageId, selectedFileIds, setActiveStageId, closeModal, selectAllFiles, deselectAllFiles]);

  return null; // Keyboard and operational listener
}
