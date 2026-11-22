import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkle, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Accueil', to: '/' },
  { label: 'À propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="logo" aria-label="Clair, accueil">
            <span className="logo-mark"><Sparkle size={18} /></span>
            <span className="logo-text">clair<span className="logo-dot">.</span></span>
          </Link>

          <div className="navbar-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={`nav-link ${isActive(link.to) ? 'nav-link-active' : ''}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            <Link to="/connexion" className="btn btn-ghost">Se connecter</Link>
            <Link to="/inscription" className="btn btn-primary btn-sm">Créer un compte</Link>
          </div>

          <button className="navbar-burger" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-nav ${open ? 'mobile-nav-open' : ''}`}>
        <div className="mobile-nav-links">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={`mobile-nav-link ${isActive(link.to) ? 'nav-link-active' : ''}`} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="mobile-nav-actions">
          <Link to="/connexion" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>Se connecter</Link>
          <Link to="/inscription" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>Créer un compte</Link>
        </div>
      </div>
      {open && <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} />}
    </>
  )
}
