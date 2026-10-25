/**
 * KNOuX SmartOrganizer — Service Registry
 * Defines ServiceVisualDescriptor type and exports an array of all 132 service IDs with their metadata.
 */

import {
  SERVICE_VISUAL_DESCRIPTORS,
  ServiceVisualDescriptor,
  RendererFamily,
  ServiceWorld,
} from '../lib/service-ui-renderers';

export type { ServiceVisualDescriptor, RendererFamily, ServiceWorld };

/**
 * Array of all 132 canonical service descriptors
 */
export const SERVICE_REGISTRY: ServiceVisualDescriptor[] = Object.values(SERVICE_VISUAL_DESCRIPTORS);

/**
 * Map of all 132 canonical service descriptors by serviceId
 */
export const SERVICE_REGISTRY_MAP: Record<string, ServiceVisualDescriptor> = SERVICE_VISUAL_DESCRIPTORS;

/**
 * Retrieves the ServiceVisualDescriptor for a given serviceId
 */
export function getServiceDescriptor(serviceId: string): ServiceVisualDescriptor {
  const desc = SERVICE_REGISTRY_MAP[serviceId];
  if (desc) return desc;

  return {
    serviceId,
    world: 'system',
    worldLabelEn: 'System',
    worldLabelAr: 'النظام',
    labelEn: serviceId,
    labelAr: serviceId,
    family: 'Ledger+Dossier',
    signatureVisual: 'Service workspace preview',
    configurationControls: ['Search', 'Filter', 'Select'],
    previewPanels: ['Details', 'Metadata', 'Status'],
    previewMode: 'design-fixture',
    riskClass: 'read-only',
    nativeExecutionEnabled: false,
  };
}
