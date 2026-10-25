/**
 * KNOuX SmartOrganizer — Startup Service Workspaces Bridge
 */

import React from 'react';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface StartupWorkspacesProps {
  serviceKey?: string;
  activeServiceKey?: string | null;
  onClose: () => void;
  locale?: 'en' | 'ar';
  isArabic?: boolean;
  [key: string]: any;
}

export function StartupWorkspacesModal(props: StartupWorkspacesProps) {
  const serviceId = props.serviceKey || props.activeServiceKey || 'startup-overview';
  return (
    <ServiceWorkspaceHost
      serviceId={serviceId}
      onClose={props.onClose}
      locale={props.locale || (props.isArabic ? 'ar' : 'en')}
    />
  );
}

export const StartupWorkspaces = StartupWorkspacesModal;
