import { Link } from 'react-router-dom'
import { Sparkle } from 'lucide-react'

export default function Logo({ light = false, size = 'md' }) {
  const cls = `logo ${light ? 'logo-light' : ''} ${size === 'lg' ? 'logo-lg' : ''}`
  return (
    <Link to="/" className={cls} aria-label="Clair, accueil">
      <span className="logo-mark"><Sparkle size={size === 'lg' ? 22 : 18} /></span>
      <span className="logo-text">clair<span className="logo-dot">.</span></span>
    </Link>
  )
}

