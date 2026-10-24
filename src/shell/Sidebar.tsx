import { useState } from 'react';
import { ChevronsLeft, ChevronsRight, ShieldCheck } from 'lucide-react';
import { pageGroups, type GroupId, type PageId } from '../lib/pages';
import { useStore } from '../state/store';

export default function Sidebar() {
  const { page, setPage, t, appInfo, sidebarCollapsed, setSidebarCollapsed } = useStore();
  const [openGroups, setOpenGroups] = useState<Record<GroupId, boolean>>({
    home: true, organize: true, optimize: true, care: true, automation: true, system: true
  });
  const [hoverExpand, setHoverExpand] = useState(false);
  const collapsed = sidebarCollapsed && !hoverExpand;

  const toggleGroup = (id: GroupId) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  // The rail is 240px wide and the product's full name does not fit in it beside
  // its mark: "KNOuX SmartOrganizer" came out as "KNOuX Sma…" in every
  // screenshot, at every window size, on both languages. An ellipsis on the
  // brand is the one truncation a product cannot afford, so the lockup breaks
  // across two lines instead — the brand word carries the weight, the product
  // word sits under it in the rail's muted tone. The tagline leaves the chrome
  // with it: the rail already ends in a "Local" shield, which is the same
  // promise in fewer words, and every world writes its own line under its own
  // title where there is room to read it.
  const [brandWord, ...brandRest] = t('app.name').split(' ');
  const productWord = brandRest.join(' ');

  const go = (id: PageId) => {
    setPage(id);
    setHoverExpand(false);
  };

  return (
    <aside
      className={collapsed ? 'sidebar collapsed' : 'sidebar'}
      aria-label={t('app.name')}
      onMouseEnter={() => { if (sidebarCollapsed) setHoverExpand(true); }}
      onMouseLeave={() => setHoverExpand(false)}
    >
      <div className="brand">
        <span className="brand-symbol" aria-hidden="true">K</span>
        {!collapsed && (
          <div className="brand-text">
            <strong>{brandWord}</strong>
            {productWord && <span className="brand-product">{productWord}</span>}
          </div>
        )}
        <button
          className="icon-button collapse-button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={t('shell.toggleSidebar')}
          title={t('shell.toggleSidebar')}
        >
          {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
      <nav aria-label={t('app.name')} className="sidebar-nav">
        {pageGroups.map(group => (
          <div key={group.id} className="nav-group" data-group={group.id}>
            {!collapsed && (
              <button className="nav-group-head" onClick={() => toggleGroup(group.id)} aria-expanded={openGroups[group.id]}>
                <span>{t(group.nameKey)}</span>
                <span aria-hidden="true" className={openGroups[group.id] ? 'caret open' : 'caret'}>▾</span>
              </button>
            )}
            {(openGroups[group.id] || collapsed) && (
              <div className="nav-group-items">
                {group.pages.map(item => (
                  <button
                    key={item.id}
                    className={page === item.id ? 'nav-item active' : 'nav-item'}
                    data-page={item.id}
                    onClick={() => go(item.id)}
                    aria-current={page === item.id ? 'page' : undefined}
                    title={collapsed ? t(item.nameKey) : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true"><item.icon size={18} /></span>
                    {!collapsed && <span className="nav-label">{t(item.nameKey)}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="local-badge"><ShieldCheck size={14} /> {!collapsed && t('common.local')}</span>
        {!collapsed && <span className="muted version">v{appInfo?.version || '—'}</span>}
      </div>
    </aside>
  );
}
