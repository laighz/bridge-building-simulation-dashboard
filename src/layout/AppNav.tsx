import { NavLink } from 'react-router'
import { workshopConfig } from '../config/workshop.ts'
import { formatDuration } from '../domain/time.ts'
import { useWorkshopSession } from '../display/useWorkshopSession.ts'
import './AppNav.css'

const LINKS = [
  { to: '/', label: 'Timer', end: true },
  { to: '/brief', label: 'Auftrag', end: false },
  { to: '/materials', label: 'Material', end: false },
  { to: '/estimate', label: 'Vorkalkulation', end: false },
  { to: '/actual', label: 'Nachkalkulation', end: false },
  { to: '/jury', label: 'Jury', end: false },
]

export function AppNav() {
  const { view } = useWorkshopSession()
  const remaining = view.isOvertime
    ? `+${formatDuration(view.overtimeMs)}`
    : formatDuration(view.remainingMs)

  return (
    <nav className="app-nav" aria-label="Workshop">
      <NavLink to="/" end className="app-nav-title">
        {workshopConfig.title}
      </NavLink>
      <div className="app-nav-links">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? 'app-nav-link is-active' : 'app-nav-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <p className="app-nav-clock" aria-live="polite">
        <span className="app-nav-clock-label">
          {view.isOvertime ? 'Überzogen' : 'Rest'}
        </span>
        <span className="app-nav-clock-value">{remaining}</span>
      </p>
    </nav>
  )
}
