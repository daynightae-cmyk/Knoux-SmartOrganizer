/**
 * KNOuX SmartOrganizer — Cleanup Service Workspaces Bridge
 */

import React from 'react';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface CleanupWorkspacesProps {
  serviceKey?: string;
  activeServiceKey?: string | null;
  onClose: () => void;
  locale?: 'en' | 'ar';
  isArabic?: boolean;
  [key: string]: any;
}

export function CleanupWorkspacesModal(props: CleanupWorkspacesProps) {
  const serviceId = props.serviceKey || props.activeServiceKey || 'cleanup-temp-preview';
  return (
    <ServiceWorkspaceHost
      serviceId={serviceId}
      onClose={props.onClose}
      locale={props.locale || (props.isArabic ? 'ar' : 'en')}
    />
  );
}

export const CleanupWorkspaces = CleanupWorkspacesModal;
