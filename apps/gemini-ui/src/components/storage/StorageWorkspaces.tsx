/**
 * KNOuX SmartOrganizer — Storage Service Workspaces Bridge
 */

import React from 'react';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface StorageWorkspacesProps {
  serviceKey?: string;
  activeServiceKey?: string | null;
  onClose: () => void;
  locale?: 'en' | 'ar';
  isArabic?: boolean;
  [key: string]: any;
}

export function StorageWorkspacesModal(props: StorageWorkspacesProps) {
  const serviceId = props.serviceKey || props.activeServiceKey || 'storage-disks';
  return (
    <ServiceWorkspaceHost
      serviceId={serviceId}
      onClose={props.onClose}
      locale={props.locale || (props.isArabic ? 'ar' : 'en')}
    />
  );
}

export const StorageWorkspaces = StorageWorkspacesModal;
