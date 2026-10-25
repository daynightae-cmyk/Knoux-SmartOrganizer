/**
 * KNOuX SmartOrganizer — Applications Service Workspaces Bridge
 * Wraps ServiceWorkspaceHost for all 12 Applications services.
 */

import React from 'react';
import { DomainServiceKey, InstalledAppItem } from '../../lib/app-inventory';
import { ServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

interface ServiceWorkspaceProps {
  serviceKey: DomainServiceKey;
  onClose: () => void;
  apps?: InstalledAppItem[];
  onSelectApp?: (app: InstalledAppItem) => void;
  locale?: 'en' | 'ar';
}

export function ServiceWorkspacesModal({
  serviceKey,
  onClose,
  locale = 'en',
}: ServiceWorkspaceProps) {
  return (
    <ServiceWorkspaceHost
      serviceId={serviceKey}
      onClose={onClose}
      locale={locale}
    />
  );
}
