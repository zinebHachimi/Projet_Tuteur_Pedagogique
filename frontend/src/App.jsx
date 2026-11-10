import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join(', ') : detail || `Erreur ${response.status}`)
  }
  return data
}

function Icon({ name }) {
  const paths = {
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-4-.9L4 20l1.4-3.4A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 2.9 8 7Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20"/></>,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z"/><path d="M13 3v7h7M8 14h8M8 17h6"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5"/><path d="M4 16v4h16v-4"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  }
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(mode === 'login'
          ? { email, mot_de_passe: password }
          : { nom: name, email, mot_de_passe: password }),
      })
      localStorage.setItem('clair_token', result.access_token)
      onAuthenticated(result.access_token, result.user)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <main className="auth-page">
    <section className="auth-story">
      <div className="brand brand-light"><span className="brand-mark"><Icon name="sparkle" /></span><span>clair<span className="brand-dot">.</span></span></div>
      <div className="story-copy">
        <p className="eyebrow">APPRENDRE À SON RYTHME</p>
        <h1>Les idées claires,<br />ça change tout.</h1>
        <p>Un tuteur qui explique, vous entraîne et s’appuie sur vos propres cours.</p>
        <div className="story-points"><span><b>01</b> Comprendre les notions</span><span><b>02</b> Pratiquer avec méthode</span><span><b>03</b> Progresser à votre rythme</span></div>
      </div>
      <div className="story-foot">Un espace d’apprentissage pensé pour vous.</div>
    </section>
    <section className="auth-panel">
      <div className="auth-form-wrap">
        <p className="eyebrow">VOTRE ESPACE D’ÉTUDE</p>
        <h2>{mode === 'login' ? 'Content de vous revoir.' : 'Bienvenue parmi nous.'}</h2>
        <p className="muted">{mode === 'login' ? 'Connectez-vous pour reprendre là où vous en étiez.' : 'Créez votre espace et commencez à apprendre.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label>Nom complet<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" autoComplete="name" /></label>}
          <label>Adresse e-mail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" /></label>
          <label>Mot de passe<input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caractères minimum" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {error && <p className="error-message">{error}</p>}
          <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}<span>→</span></button>
        </form>
        <p className="auth-switch">{mode === 'login' ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Créer un compte' : 'Se connecter'}</button></p>
        <p className="auth-privacy">Vos conversations et vos supports restent privés.</p>
      </div>
    </section>
  </main>
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('clair_token'))
  const [user, setUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(Boolean(token))
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const scrollRef = useRef(null)
  const fileRef = useRef(null)
  const textareaRef = useRef(null)

  const loadDocuments = useCallback(async (id = activeId, auth = token) => {
    if (!auth) return
    const query = id ? `?conversation_id=${id}` : ''
    setDocuments(await request(`/documents${query}`, { token: auth }))
  }, [activeId, token])

  useEffect(() => {
    if (!token) { setAuthChecking(false); return }
    let alive = true
    Promise.all([request('/auth/me', { token }), request('/conversations', { token }), request('/documents', { token })])
      .then(([profile, rows, docs]) => {
        if (!alive) return
        setUser(profile)
        setConversations(rows)
        setDocuments(docs)
        if (rows.length) setActiveId(rows[0].id)
      })
      .catch(() => { if (alive) { localStorage.removeItem('clair_token'); setToken(null); setUser(null) } })
      .finally(() => { if (alive) setAuthChecking(false) })
    return () => { alive = false }
  }, [token])

  useEffect(() => {
    if (!token || !activeId) { setMessages([]); setDocuments([]); return }
    let alive = true
    setError('')
    Promise.all([
      request(`/conversations/${activeId}`, { token }),
      request(`/documents?conversation_id=${activeId}`, { token }),
    ]).then(([conversation, docs]) => {
      if (!alive) return
      setMessages(conversation.messages.map((message) => ({ ...message, sources: [] })))
      setDocuments(docs)
    }).catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [activeId, token])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  function authenticated(auth, profile) {
    setToken(auth)
    setUser(profile)
    setAuthChecking(true)
  }

  async function createConversation() {
    setError('')
    try {
      const conversation = await request('/conversations', { token, method: 'POST' })
      setConversations((rows) => [conversation, ...rows])
      setActiveId(conversation.id)
      setMessages([])
      setMobileMenu(false)
    } catch (err) { setError(err.message) }
  }

  async function deleteConversation(id, event) {
    event.stopPropagation()
    if (!window.confirm('Supprimer cette discussion et ses supports associés ?')) return
    setError('')
    try {
      await request(`/conversations/${id}`, { token, method: 'DELETE' })
      const remaining = conversations.filter((item) => item.id !== id)
      setConversations(remaining)
      if (activeId === id) {
        setActiveId(remaining[0]?.id ?? null)
        setMessages([])
        if (!remaining.length) setDocuments([])
      }
    } catch (err) { setError(err.message) }
  }

  async function selectConversation(id) {
    setActiveId(id)
    setMobileMenu(false)
    setError('')
  }

  async function sendMessage(event) {
    event?.preventDefault()
    const contenu = draft.trim()
    if (!contenu || busy) return
    setError('')
    setDraft('')
    setBusy(true)
    let conversationId = activeId
    try {
      if (!conversationId) {
        const conversation = await request('/conversations', { token, method: 'POST' })
        conversationId = conversation.id
        setActiveId(conversationId)
        setConversations((rows) => [conversation, ...rows])
      }
      const result = await request(`/conversations/${conversationId}/messages`, {
        token, method: 'POST', body: JSON.stringify({ contenu }),
      })
      setMessages((rows) => [...rows, { ...result.user_message, sources: [] }, { ...result.assistant_message, sources: result.sources || [] }])
      setConversations((rows) => rows.map((row) => row.id === conversationId ? result.conversation : row))
    } catch (err) {
      setDraft(contenu)
      setError(err.message)
    } finally { setBusy(false) }
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    setNotice('')
    const form = new FormData()
    form.append('fichier', file)
    const query = activeId ? `?conversation_id=${activeId}` : ''
    try {
      await request(`/documents${query}`, { token, method: 'POST', body: form })
      await loadDocuments(activeId, token)
      setNotice(`« ${file.name} » est indexé et prêt pour vos questions.`)
    } catch (err) { setError(err.message) }
    finally { setUploading(false) }
  }

  async function deleteDocument(id) {
    setError('')
    try {
      await request(`/documents/${id}`, { token, method: 'DELETE' })
      setDocuments((rows) => rows.filter((doc) => doc.id !== id))
      setNotice('Support supprimé.')
    } catch (err) { setError(err.message) }
  }

  function logout() {
    localStorage.removeItem('clair_token')
    setToken(null); setUser(null); setConversations([]); setMessages([]); setDocuments([]); setActiveId(null)
  }

  if (authChecking) return <div className="loading-screen"><span className="loader" /><p>Préparation de votre espace…</p></div>
  if (!token || !user) return <AuthScreen onAuthenticated={authenticated} />

  const activeConversation = conversations.find((item) => item.id === activeId)
  const firstName = user.nom?.trim().split(/\s+/)[0] || 'Étudiant'

  return <main className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top">
        <a className="brand" href="#top" aria-label="Clair, accueil"><span className="brand-mark"><Icon name="sparkle" /></span><span>clair<span className="brand-dot">.</span></span></a>
        <span className="sidebar-caption">TUTEUR PÉDAGOGIQUE</span>
      </div>
      <button className="button new-chat-button" onClick={createConversation}><Icon name="plus" /> Nouvelle discussion</button>
      <div className="side-section-heading"><span>RÉCENT</span><span>{conversations.length}</span></div>
      <nav className="conversation-list" aria-label="Discussions">
        {conversations.map((conversation) => <button key={conversation.id} onClick={() => selectConversation(conversation.id)} className={`conversation-link ${activeId === conversation.id ? 'active' : ''}`} title={conversation.titre}>
          <Icon name="chat" /><span>{conversation.titre || 'Nouvelle discussion'}</span><span role="button" tabIndex={0} className="delete-chat" aria-label="Supprimer la discussion" onClick={(event) => deleteConversation(conversation.id, event)} onKeyDown={(event) => event.key === 'Enter' && deleteConversation(conversation.id, event)}><Icon name="trash" /></span>
        </button>)}
        {!conversations.length && <p className="sidebar-empty">Vos nouvelles discussions apparaîtront ici.</p>}
      </nav>
      <div className="sidebar-bottom">
        <div className="side-section-heading support-heading"><span>MES SUPPORTS</span><span className="support-count">{documents.length}</span></div>
        <p className="support-hint">Ajoutez un cours pour obtenir des réponses fondées sur votre contenu.</p>
        <input ref={fileRef} className="visually-hidden" type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={uploadFile} />
        <button className="upload-button" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <span className="upload-icon"><Icon name="upload" /></span><span>{uploading ? 'Indexation en cours…' : 'Importer un support'}<small>PDF ou TXT · 20 Mo max.</small></span><Icon name="plus" />
        </button>
        <div className="document-list">
          {documents.map((doc) => <div className="document-row" key={doc.id}><Icon name="file" /><span title={doc.nom_fichier}>{doc.nom_fichier}</span><button onClick={() => deleteDocument(doc.id)} aria-label={`Supprimer ${doc.nom_fichier}`} title="Supprimer"><Icon name="close" /></button></div>)}
          {!!activeId && !documents.length && <p className="document-empty">Aucun support pour cette discussion.</p>}
        </div>
        <div className="profile-card"><div className="avatar">{firstName.charAt(0).toUpperCase()}</div><div className="profile-info"><strong>{user.nom}</strong><small>Étudiant</small></div><button className="logout-button" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter"><Icon name="logout" /></button></div>
      </div>
    </aside>
    {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Fermer le menu" />}
    <section className="workspace" id="top">
      <header className="topbar"><button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Ouvrir le menu">☰</button><div className="breadcrumb"><span>Mon espace</span><span className="breadcrumb-slash">/</span><strong>{activeConversation?.titre || 'Nouvelle discussion'}</strong></div><div className="topbar-right"><span className="online-dot" /> Votre tuteur est prêt <span className="topbar-avatar">{firstName.charAt(0).toUpperCase()}</span></div></header>
      <section className="chat-area">
        <div className="message-scroll" ref={scrollRef}>
          {messages.length === 0 ? <div className="welcome">
            <div className="welcome-orb"><Icon name="sparkle" /></div>
            <p className="eyebrow">VOTRE TUTEUR EST LÀ</p>
            <h1>Bonjour {firstName},<br /><span>qu’aimeriez-vous apprendre&nbsp;?</span></h1>
            <p className="welcome-copy">Posez une question, demandez une explication ou entraînez-vous sur une notion de votre cours.</p>
            <div className="suggestion-grid">
              <button onClick={() => setDraft('Explique-moi la descente de gradient avec une intuition et un exemple.')}><span className="suggestion-icon lavender"><Icon name="sparkle" /></span><span><strong>Comprendre une notion</strong><small>Une explication claire, à mon niveau</small></span><span className="suggestion-arrow">↗</span></button>
              <button onClick={() => setDraft('Génère-moi 5 exercices de difficulté intermédiaire sur les bases de données.')}><span className="suggestion-icon peach"><Icon name="book" /></span><span><strong>M’entraîner</strong><small>Des exercices pour progresser</small></span><span className="suggestion-arrow">↗</span></button>
              <button onClick={() => setDraft('Fais un résumé des idées clés de mon cours.')}><span className="suggestion-icon mint"><Icon name="file" /></span><span><strong>Réviser mon cours</strong><small>Un résumé de mon support importé</small></span><span className="suggestion-arrow">↗</span></button>
              <button onClick={() => setDraft('Propose-moi un QCM de 5 questions sur le machine learning.')}><span className="suggestion-icon blue"><Icon name="chat" /></span><span><strong>Tester mes acquis</strong><small>Un QCM pour faire le point</small></span><span className="suggestion-arrow">↗</span></button>
            </div>
          </div> : <div className="message-list">
            {messages.map((message, index) => <article className={`message-row ${message.role === 'user' ? 'message-user' : ''}`} key={`${message.id}-${index}`}>
              {message.role !== 'user' && <div className="assistant-avatar"><Icon name="sparkle" /></div>}
              <div className="message-content"><div className="message-meta">{message.role === 'user' ? 'Vous' : 'Clair'}<span>{message.created_at ? new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>
                <div className={`message-bubble ${message.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}><ReactMarkdown>{message.contenu}</ReactMarkdown></div>
                {message.sources?.length > 0 && <div className="sources"><div className="sources-title"><Icon name="book" /><span>Sources de votre cours</span></div>{message.sources.map((source, i) => <details className="source-card" key={`${source.document_id}-${i}`}><summary><span className="source-number">{i + 1}</span><span>{source.nom_fichier}{source.page ? ` · page ${source.page}` : ''}</span></summary><p>{source.extrait}</p></details>)}</div>}
              </div>
            </article>)}
            {busy && <article className="message-row"><div className="assistant-avatar"><Icon name="sparkle" /></div><div className="message-content"><div className="message-meta">Clair <span>réfléchit</span></div><div className="typing-bubble"><i /><i /><i /></div></div></article>}
          </div>}
        </div>
        <div className="composer-wrap">
          {notice && <div className="notice-message"><span>✓</span>{notice}<button onClick={() => setNotice('')} aria-label="Fermer"><Icon name="close" /></button></div>}
          {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError('')} aria-label="Fermer"><Icon name="close" /></button></div>}
          <form className="composer" onSubmit={sendMessage}>
            <textarea ref={textareaRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} placeholder="Posez votre question…" rows={1} aria-label="Votre question" />
            <div className="composer-bottom"><span><Icon name="sparkle" /> Clair peut faire des erreurs. Vérifiez les notions importantes.</span><button className="send-button" type="submit" disabled={!draft.trim() || busy} aria-label="Envoyer"><Icon name="send" /></button></div>
          </form>
          <p className="composer-foot">Entrée pour envoyer <span>·</span> Maj + Entrée pour aller à la ligne</p>
        </div>
      </section>
    </section>
  </main>
}
