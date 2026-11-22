import { Link } from 'react-router-dom'
import { Sparkle } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo" aria-label="Clair">
            <span className="logo-mark"><Sparkle size={18} /></span>
            <span className="logo-text">clair<span className="logo-dot">.</span></span>
          </Link>
          <p className="footer-desc">Votre tuteur pédagogique intelligent. Apprenez, pratiquez et progressez à votre rythme.</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Plateforme</h4>
            <Link to="/">Accueil</Link>
            <Link to="/a-propos">À propos</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Compte</h4>
            <Link to="/connexion">Se connecter</Link>
            <Link to="/inscription">Créer un compte</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Clair — Projet pédagogique. Tous droits réservés.</p>
      </div>
    </footer>
  )
}

