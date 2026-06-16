import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Breadcrumb {
  label: string
  href?: string
  active?: boolean
}

interface TopbarProps {
  breadcrumbs: Breadcrumb[]
  rightContent?: ReactNode
}

export function Topbar({ breadcrumbs = [], rightContent }: TopbarProps) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="sep" aria-hidden="true">›</span>}
              {crumb.active ? (
                <span className="crumb-active">{crumb.label}</span>
              ) : (
                <Link to={crumb.href || '#'}>{crumb.label}</Link>
              )}
            </span>
          ))}
        </nav>
      </div>
      <div className="topbar-right">
        {rightContent}
      </div>
    </header>
  )
}
