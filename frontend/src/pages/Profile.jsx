import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, Clock, BookOpen, ArrowRight, LogOut, Home, Info, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { request } from '../services/api'
import Navbar from '../components/Navbar'

export default function Profile() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    request('/profile/stats', { token })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const firstName = user?.nom?.trim().split(/\s+/)[0] || 'Étudiant'
  const initial = firstName.charAt(0).toUpperCase()

  return (
    <div className="dashboard">
      {/* Simple top bar for profile */}
      <nav className="navbar navbar-scrolled">
        <div className="navbar-inner">
          <Link to="/" className="logo" aria-label="Clair, accueil">
            <span className="logo-mark" style={{ width: 32, height: 32 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></svg>
            </span>
            <span className="logo-text">clair<span className="logo-dot">.</span></span>
          </Link>
          <div className="navbar-actions">
            <Link to="/chat" className="btn btn-primary btn-sm">Ouvrir Clair Tuteur</Link>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-inner">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-avatar">{initial}</div>
          <div className="dashboard-user">
            <h1>{user?.nom || 'Étudiant'} <span className="badge badge-purple">Étudiant</span></h1>
            <p>{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <span className="loader" style={{ display: 'inline-block', marginBottom: 12 }} />
            <p>Chargement de vos statistiques…</p>
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--error)' }}>
            <p>{error}</p>
          </div>
        ) : stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label"><MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Discussions</div>
              <div className="stat-card-value">{stats.nb_discussions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label"><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Temps de réponse moyen</div>
              <div className="stat-card-value">
                {stats.temps_reponse_moyen_ms > 0
                  ? (stats.temps_reponse_moyen_ms / 1000).toFixed(1)
                  : '—'}
                <span className="stat-card-unit">{stats.temps_reponse_moyen_ms > 0 ? 's' : ''}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label"><BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Cours importés</div>
              <div className="stat-card-value">{stats.nb_cours}</div>
            </div>
          </div>
        ) : null}

        {/* CTA */}
        <div className="dashboard-cta">
          <h2>Continuez votre apprentissage</h2>
          <p>Posez une question, demandez un exercice ou importez un nouveau cours.</p>
          <Link to="/chat" className="btn btn-lg">
            Ouvrir Clair Tuteur <ArrowRight size={18} />
          </Link>
        </div>

        {/* Navigation */}
        <div className="dashboard-nav">
          <Link to="/" className="btn btn-ghost"><Home size={16} /> Accueil</Link>
          <Link to="/a-propos" className="btn btn-ghost"><Info size={16} /> À propos</Link>
          <Link to="/contact" className="btn btn-ghost"><Mail size={16} /> Contact</Link>
          <button className="btn btn-ghost" onClick={handleLogout}><LogOut size={16} /> Se déconnecter</button>
        </div>
      </div>
    </div>
  )
}

