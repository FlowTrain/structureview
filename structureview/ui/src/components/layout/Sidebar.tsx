import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: string
  active?: boolean
  badge?: { text: string; variant: string }
  href?: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

interface SidebarProps {
  activeNav?: string
  sections: NavSection[]
  brandTag?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  onSelect?: (id: string) => void
}

export function Sidebar({
  sections,
  brandTag = 'Enterprise · v2.4',
  collapsed = false,
  onToggleCollapse,
  activeNav,
  onSelect
}: SidebarProps) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sb-brand">
        <Link to="/roundhouse" style={{display:'flex',alignItems:'center',gap:'var(--s3)',textDecoration:'none'}}>
          <FlowTrainLogo />
          <div className="sb-brand-text">
            <div className="sb-brand-name">FlowTrain</div>
            <div className="sb-brand-tag">{brandTag}</div>
          </div>
        </Link>
        {onToggleCollapse && (
          <button 
            className="sb-collapse-btn" 
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      <nav className="sb-nav">
        {sections.map((section, idx) => (
          <div className="sb-section" key={idx}>
            <div className="sb-section-lbl">{section.label}</div>
            {section.items.map((item) => (
              <NavItemComponent key={item.id} item={item} onSelect={onSelect} active={activeNav === item.id} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="user-row">
          <div className="avatar avatar-lg">JG</div>
          <div className="user-info">
            <div className="user-name">James Gifford</div>
            <div className="user-role">Lead Dispatcher</div>
          </div>
          <div className="dot dot-ok" style={{flexShrink:0}} data-tip="Online"></div>
        </div>
      </div>
    </aside>
  )
}

function NavItemComponent({ item, onSelect, active }: { item: NavItem; onSelect?: (id: string) => void; active?: boolean }) {
  const Icon = getIcon(item.icon)
  const isActive = active ?? item.active

  if (item.href && item.href !== '#') {
    return (
      <Link to={item.href} className={`nav-item ${isActive ? 'active' : ''}`} title={item.label}>
        <Icon />
        <span className="nav-label">{item.label}</span>
        {item.badge && (
          <span className={`badge b-${item.badge.variant}`} style={{marginLeft:'auto'}}>
            {item.badge.text}
          </span>
        )}
      </Link>
    )
  }

  return (
    <a
      href="#"
      className={`nav-item ${isActive ? 'active' : ''}`}
      title={item.label}
      onClick={(e) => {
        e.preventDefault()
        onSelect?.(item.id)
      }}
    >
      <Icon />
      <span className="nav-label">{item.label}</span>
      {item.badge && (
        <span className={`badge b-${item.badge.variant}`} style={{marginLeft:'auto'}}>
          {item.badge.text}
        </span>
      )}
    </a>
  )
}

function FlowTrainLogo() {
  return (
    <svg viewBox="0 0 36 28" fill="none" aria-hidden="true" style={{width:36,height:28,color:'var(--ft-blue)',flexShrink:0}}>
      <rect x="8" y="18" width="2" height="6" rx="0.75" fill="currentColor" opacity="0.4"/>
      <rect x="16" y="18" width="2" height="6" rx="0.75" fill="currentColor" opacity="0.4"/>
      <rect x="24" y="18" width="2" height="6" rx="0.75" fill="currentColor" opacity="0.4"/>
      <rect x="2" y="18" width="32" height="2.5" rx="1.25" fill="currentColor"/>
      <rect x="2" y="23" width="32" height="2.5" rx="1.25" fill="currentColor"/>
      <rect x="4" y="8" width="18" height="10" rx="1.5" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="20" y="4" width="12" height="14" rx="1.5" fill="currentColor"/>
      <rect x="22" y="6.5" width="6" height="5" rx="0.75" fill="#0a0a0f"/>
      <rect x="10" y="5" width="3" height="4" rx="1" fill="currentColor" opacity="0.6"/>
      <rect x="2" y="11" width="3" height="4" rx="0.75" fill="currentColor" opacity="0.5"/>
    </svg>
  )
}

function getIcon(name: string) {
  const icons: Record<string, () => JSX.Element> = {
    turntable: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/>
      </svg>
    ),
    hauls: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    dispatch: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    cube: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    api: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
    clock: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    user: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>
    ),
    settings: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
    back: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m15 18-6-6 6-6"/>
      </svg>
    ),
    grid: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    doc: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    signal: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    chart: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    search: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    export: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
      </svg>
    ),
    book: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    chat: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    shield: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    alert: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    flag: () => (
      <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
      </svg>
    ),
  }
  return icons[name] || icons.grid
}
