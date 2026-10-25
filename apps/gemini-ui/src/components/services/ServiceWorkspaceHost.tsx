/**
 * KNOuX SmartOrganizer — Service Workspace Host
 * Unified container component that retrieves the ServiceVisualDescriptor for a given serviceId
 * from src/services/service-registry.ts and dynamically renders the appropriate UI family.
 */

import React from 'react';
import { getServiceDescriptor } from '../../services/service-registry';
import { ServiceWorkspaceHost as CommonServiceWorkspaceHost } from '../common/ServiceWorkspaceHost';

export interface ServiceWorkspaceHostProps {
  serviceId: string;
  onClose: () => void;
  locale?: 'en' | 'ar';
}

export const ServiceWorkspaceHost: React.FC<ServiceWorkspaceHostProps> = (props) => {
  // Validate that the descriptor can be retrieved from service-registry
  const descriptor = getServiceDescriptor(props.serviceId);
  if (!descriptor) {
    return null;
  }

  return <CommonServiceWorkspaceHost {...props} />;
};

export default ServiceWorkspaceHost;
