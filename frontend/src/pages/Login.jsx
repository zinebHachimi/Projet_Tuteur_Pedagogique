import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { request } from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, mot_de_passe: password }),
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
          <p className="auth-side-label">APPRENDRE À SON RYTHME</p>
          <h1>Les idées claires,<br />ça change tout.</h1>
          <p>Un tuteur qui explique, vous entraîne et s'appuie sur vos propres cours.</p>
          <div className="auth-side-features">
            <div className="auth-side-feature"><span>01</span> Comprendre les notions</div>
            <div className="auth-side-feature"><span>02</span> Pratiquer avec méthode</div>
            <div className="auth-side-feature"><span>03</span> Progresser à votre rythme</div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="auth-side-label" style={{ color: 'var(--purple)' }}>VOTRE ESPACE D'ÉTUDE</p>
          <h2>Content de vous revoir.</h2>
          <p className="auth-desc">Connectez-vous pour reprendre là où vous en étiez.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Adresse e-mail</label>
              <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" />
            </div>

            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <div className="password-wrapper">
                <input className="input" style={{ width: '100%' }} required type={showPw ? 'text' : 'password'} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caractères minimum" autoComplete="current-password" />
                <button type="button" className="password-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Masquer' : 'Afficher'}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Un instant…' : 'Se connecter'} <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/inscription"><button type="button">Créer un compte</button></Link>
          </p>
          <p className="auth-privacy">Vos conversations et vos supports restent privés.</p>
        </div>
      </section>
    </main>
  )
}

