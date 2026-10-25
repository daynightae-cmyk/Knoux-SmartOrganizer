/**
 * KNOuX SmartOrganizer — Automation Service Workspaces Bridge
 */

import React from 'react';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface AutomationWorkspacesProps {
  serviceKey?: string;
  activeCardKey?: string | null;
  activeModal?: string | null;
  onClose: () => void;
  locale?: 'en' | 'ar';
  isArabic?: boolean;
  [key: string]: any;
}

export function AutomationWorkspacesModal(props: AutomationWorkspacesProps) {
  const serviceId = props.serviceKey || props.activeCardKey || 'auto-smart-scan';
  return (
    <ServiceWorkspaceHost
      serviceId={serviceId}
      onClose={props.onClose}
      locale={props.locale || (props.isArabic ? 'ar' : 'en')}
    />
  );
}

export const AutomationWorkspaces = AutomationWorkspacesModal;
