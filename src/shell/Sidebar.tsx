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
            <strong>{t('app.name')}</strong>
            <small>{t('app.tagline')}</small>
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
          <div key={group.id} className="nav-group">
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
