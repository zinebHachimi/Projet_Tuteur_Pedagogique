import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { request } from '../services/api'

function getStrength(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
const STRENGTH_COLORS = ['', 'active-weak', 'active-medium', 'active-strong', 'active-strong']

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const strength = getStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nom, email, mot_de_passe: password }),
      })
      login(result.access_token, result.user)
      navigate('/profil')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-side">
        <div className="auth-side-content">
          <Link to="/" className="logo logo-light" style={{ marginBottom: 40 }}>
            <span className="logo-mark"><Sparkle size={18} /></span>
            <span className="logo-text">clair<span className="logo-dot">.</span></span>
          </Link>
          <p className="auth-side-label">REJOIGNEZ-NOUS</p>
          <h1>Bienvenue<br />parmi nous.</h1>
          <p>Créez votre espace d'apprentissage personnalisé et commencez à progresser.</p>
          <div className="auth-side-features">
            <div className="auth-side-feature"><span>✓</span> Gratuit et sans engagement</div>
            <div className="auth-side-feature"><span>✓</span> Exercices et corrections</div>
            <div className="auth-side-feature"><span>✓</span> Vos cours restent privés</div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="auth-side-label" style={{ color: 'var(--purple)' }}>CRÉER UN COMPTE</p>
          <h2>Bienvenue parmi nous.</h2>
          <p className="auth-desc">Créez votre espace et commencez à apprendre.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Nom complet</label>
              <input className="input" required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" autoComplete="name" />
            </div>

            <div className="input-group">
              <label className="input-label">Adresse e-mail</label>
              <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" />
            </div>

            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <div className="password-wrapper">
                <input className="input" style={{ width: '100%' }} required type={showPw ? 'text' : 'password'} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caractères minimum" autoComplete="new-password" />
                <button type="button" className="password-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Masquer' : 'Afficher'}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && (
                <>
                  <div className="password-strength">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`password-strength-bar ${i <= strength ? STRENGTH_COLORS[strength] : ''}`} />
                    ))}
                  </div>
                  <span className={`password-strength-label`} style={{ color: strength <= 1 ? 'var(--error)' : strength <= 2 ? 'var(--peach)' : 'var(--success)' }}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Création en cours…' : 'Créer mon compte'} <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            Vous avez déjà un compte ? <Link to="/connexion"><button type="button">Se connecter</button></Link>
          </p>
          <p className="auth-privacy">Vos conversations et vos supports restent privés.</p>
        </div>
      </section>
    </main>
  )
}

