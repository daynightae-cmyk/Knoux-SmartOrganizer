import { useCallback, useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { glyphIdentity, type AppRecord } from '../../lib/app-inventory';
import { getIcon, requestIcons, subscribeIcon } from '../../lib/icon-broker';

export type AppIconVariant = 'row' | 'tile' | 'dossier';

const variantClass: Record<AppIconVariant, string> = {
  row: 'appx-icon appx-icon--38 appx-glyph appx-glyph--38',
  tile: 'appx-icon appx-icon--38 appx-glyph appx-glyph--38',
  dossier: 'appx-icon appx-icon--52 appx-glyph appx-glyph--52'
};

interface Props {
  record: AppRecord;
  variant?: AppIconVariant;
}

/**
 * A program's identity mark.
 *
 * The real Windows icon appears as soon as the native provider resolves it;
 * until then — and forever, on a device without that channel — a deterministic
 * monogram derived from the publisher stands in. Nothing is fetched from the
 * internet and no logo is guessed.
 */
export default function AppIcon({ record, variant = 'row' }: Props) {
  const id = record.id;
  const subscribe = useCallback(
    (listener: () => void) => (id ? subscribeIcon(id, listener) : () => undefined),
    [id]
  );
  const snapshot = useCallback(() => (id ? getIcon(id) : undefined), [id]);
  const entry = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    if (id) requestIcons([id]);
  }, [id]);

  const { letters, hue } = glyphIdentity(record);
  const style = { '--glyph-hue': String(hue) } as CSSProperties;

  if (entry?.status === 'ready' && entry.dataUrl) {
    return (
      <span className={`${variantClass[variant]} appx-icon--img`} aria-hidden="true">
        <img className="appx-icon-img" src={entry.dataUrl} alt="" draggable={false} />
      </span>
    );
  }
  return (
    <span className={variantClass[variant]} aria-hidden="true" style={style}>
      {letters}
    </span>
  );
}
