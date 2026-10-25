/**
 * KNOuX SmartOrganizer — Repair Service Workspaces Bridge
 */

import React from 'react';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface RepairWorkspacesProps {
  serviceKey?: string;
  tool?: { key?: string; id?: string; [key: string]: any };
  onClose: () => void;
  locale?: 'en' | 'ar';
  isArabic?: boolean;
  [key: string]: any;
}

export function RepairWorkspacesModal(props: RepairWorkspacesProps) {
  const serviceId = props.serviceKey || props.tool?.key || props.tool?.id || 'repair-component-check';
  return (
    <ServiceWorkspaceHost
      serviceId={serviceId}
      onClose={props.onClose}
      locale={props.locale || (props.isArabic ? 'ar' : 'en')}
    />
  );
}

export const RepairWorkspaces = RepairWorkspacesModal;
