/**
 * KNOuX SmartOrganizer — Services Service Workspaces Bridge
 */

import React from 'react';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface ServicesWorkspacesProps {
  serviceKey?: string;
  activeCardKey?: string | null;
  service?: { key?: string; id?: string; [key: string]: any };
  onClose: () => void;
  locale?: 'en' | 'ar';
  isArabic?: boolean;
  [key: string]: any;
}

export function ServicesWorkspacesModal(props: ServicesWorkspacesProps) {
  const serviceId = props.serviceKey || props.activeCardKey || props.service?.key || props.service?.id || 'services-inventory';
  return (
    <ServiceWorkspaceHost
      serviceId={serviceId}
      onClose={props.onClose}
      locale={props.locale || (props.isArabic ? 'ar' : 'en')}
    />
  );
}

export const ServicesWorkspaces = ServicesWorkspacesModal;
