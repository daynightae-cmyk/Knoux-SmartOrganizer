/**
 * KNOuX SmartOrganizer — System Service Workspaces Bridge
 */

import React from 'react';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface SystemWorkspacesProps {
  serviceKey?: string;
  activeServiceKey?: string | null;
  onClose: () => void;
  locale?: 'en' | 'ar';
  isArabic?: boolean;
  [key: string]: any;
}

export function SystemWorkspacesModal(props: SystemWorkspacesProps) {
  const serviceId = props.serviceKey || props.activeServiceKey || 'system-health-check';
  return (
    <ServiceWorkspaceHost
      serviceId={serviceId}
      onClose={props.onClose}
      locale={props.locale || (props.isArabic ? 'ar' : 'en')}
    />
  );
}

export const SystemWorkspaces = SystemWorkspacesModal;
