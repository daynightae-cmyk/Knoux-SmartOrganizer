/**
 * KNOuX SmartOrganizer — Files Service Workspaces Bridge
 * Wraps ServiceWorkspaceHost for all 12 Files services.
 */

import React from 'react';
import { FileResultItem, FilesServiceKey } from '../../lib/file-inventory';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

interface FileWorkspacesProps {
  serviceKey: FilesServiceKey;
  onClose: () => void;
  files?: FileResultItem[];
  selectedFile?: FileResultItem;
  locale?: 'en' | 'ar';
}

export function FileWorkspacesModal({
  serviceKey,
  onClose,
  locale = 'en',
}: FileWorkspacesProps) {
  return (
    <ServiceWorkspaceHost
      serviceId={serviceKey}
      onClose={onClose}
      locale={locale}
    />
  );
}
