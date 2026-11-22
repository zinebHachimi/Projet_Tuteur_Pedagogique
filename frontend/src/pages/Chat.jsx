import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  Sparkle, Plus, MessageCircle, Trash2, Upload, FileText,
  X, Send, LogOut, User, Menu, BookOpen, Copy, Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { request } from '../services/api'

export default function Chat() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

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
  const [avatarMenu, setAvatarMenu] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)

  const scrollRef = useRef(null)
  const fileRef = useRef(null)
  const textareaRef = useRef(null)

  const firstName = user?.nom?.trim().split(/\s+/)[0] || 'Étudiant'
  const initial = firstName.charAt(0).toUpperCase()

  // Load initial data
  useEffect(() => {
    if (!token) return
    let alive = true
    Promise.all([
      request('/conversations', { token }),
      request('/documents', { token }),
    ])
      .then(([convs, docs]) => {
        if (!alive) return
        setConversations(convs)
        setDocuments(docs)
        if (convs.length) setActiveId(convs[0].id)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [token])

  // Load messages when active changes
  useEffect(() => {
    if (!token || !activeId) { setMessages([]); return }
    let alive = true
    setError('')
    Promise.all([
      request(`/conversations/${activeId}`, { token }),
      request(`/documents?conversation_id=${activeId}`, { token }),
    ])
      .then(([conv, docs]) => {
        if (!alive) return
        setMessages(conv.messages.map((m) => ({ ...m, sources: [] })))
        setDocuments(docs)
      })
      .catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [activeId, token])

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const loadDocuments = useCallback(async (convId = activeId) => {
    if (!token) return
    const q = convId ? `?conversation_id=${convId}` : ''
    setDocuments(await request(`/documents${q}`, { token }))
  }, [activeId, token])

  async function createConversation() {
    setError('')
    try {
      const conv = await request('/conversations', { token, method: 'POST' })
      setConversations((rows) => [conv, ...rows])
      setActiveId(conv.id)
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
      const remaining = conversations.filter((c) => c.id !== id)
      setConversations(remaining)
      if (activeId === id) {
        setActiveId(remaining[0]?.id ?? null)
        setMessages([])
        if (!remaining.length) setDocuments([])
      }
    } catch (err) { setError(err.message) }
  }

  function selectConversation(id) {
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
        const conv = await request('/conversations', { token, method: 'POST' })
        conversationId = conv.id
        setActiveId(conversationId)
        setConversations((rows) => [conv, ...rows])
      }
      const result = await request(`/conversations/${conversationId}/messages`, {
        token, method: 'POST', body: JSON.stringify({ contenu }),
      })
      setMessages((rows) => [
        ...rows,
        { ...result.user_message, sources: [] },
        { ...result.assistant_message, sources: result.sources || [] },
      ])
      setConversations((rows) => rows.map((r) => r.id === conversationId ? result.conversation : r))
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
    const q = activeId ? `?conversation_id=${activeId}` : ''
    try {
      await request(`/documents${q}`, { token, method: 'POST', body: form })
      await loadDocuments(activeId)
      setNotice(`« ${file.name} » est indexé et prêt pour vos questions.`)
    } catch (err) { setError(err.message) }
    finally { setUploading(false) }
  }

  async function deleteDocument(id) {
    setError('')
    try {
      await request(`/documents/${id}`, { token, method: 'DELETE' })
      setDocuments((rows) => rows.filter((d) => d.id !== id))
      setNotice('Support supprimé.')
    } catch (err) { setError(err.message) }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleSuggestion(text) {
    setDraft(text)
    textareaRef.current?.focus()
  }

  async function copyCode(text, idx) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch {}
  }

  const activeConversation = conversations.find((c) => c.id === activeId)

  // Custom renderer for code blocks with copy button
  let codeBlockIdx = 0
  function CodeBlock({ children, className }) {
    const match = /language-(\w+)/.exec(className || '')
    const text = String(children).replace(/\n$/, '')
    const idx = codeBlockIdx++
    return (
      <pre className={className}>
        <button className="code-copy-btn" onClick={() => copyCode(text, idx)} title="Copier">
          {copiedIdx === idx ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
        </button>
        <code>{children}</code>
      </pre>
    )
  }

  return (
    <main className="chat-shell">
      {/* SIDEBAR */}
      <aside className={`chat-sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="chat-sidebar-top">
          <Link to="/" className="logo" aria-label="Clair, accueil">
            <span className="logo-mark"><Sparkle size={18} /></span>
            <span className="logo-text">clair<span className="logo-dot">.</span></span>
          </Link>
          <span className="chat-sidebar-caption">TUTEUR PÉDAGOGIQUE</span>
        </div>

        <button className="new-chat-btn" onClick={createConversation}>
          <Plus size={16} /> Nouvelle discussion
        </button>

        <div className="chat-section-label"><span>RÉCENT</span><span>{conversations.length}</span></div>
        <nav className="chat-list" aria-label="Discussions">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`chat-list-item ${activeId === conv.id ? 'active' : ''}`}
              title={conv.titre}
            >
              <MessageCircle size={14} />
              <span>{conv.titre || 'Nouvelle discussion'}</span>
              <span
                role="button" tabIndex={0} className="chat-delete"
                aria-label="Supprimer la discussion"
                onClick={(e) => deleteConversation(conv.id, e)}
                onKeyDown={(e) => e.key === 'Enter' && deleteConversation(conv.id, e)}
              >
                <Trash2 size={13} />
              </span>
            </button>
          ))}
          {!conversations.length && (
            <p className="chat-sidebar-empty">Vos nouvelles discussions apparaîtront ici.</p>
          )}
        </nav>

        <div className="chat-sidebar-bottom">
          <div className="chat-section-label">
            <span>MES SUPPORTS</span>
            <span className="support-count-badge">{documents.length}</span>
          </div>
          <p className="support-hint">Ajoutez un cours pour obtenir des réponses fondées sur votre contenu.</p>
          <input ref={fileRef} className="visually-hidden" type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={uploadFile} />
          <button className="upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <span className="upload-btn-icon"><Upload size={15} /></span>
            <span className="upload-btn-text">
              <strong>{uploading ? 'Indexation en cours…' : 'Importer un support'}</strong>
              <small>PDF ou TXT · 20 Mo max.</small>
            </span>
            <Plus size={14} style={{ color: 'var(--subtle)' }} />
          </button>

          <div className="doc-list">
            {documents.map((doc) => (
              <div className="doc-row" key={doc.id}>
                <FileText size={14} style={{ color: 'var(--purple)', flexShrink: 0 }} />
                <span title={doc.nom_fichier}>{doc.nom_fichier}</span>
                <button onClick={() => deleteDocument(doc.id)} aria-label={`Supprimer ${doc.nom_fichier}`} title="Supprimer">
                  <X size={13} />
                </button>
              </div>
            ))}
            {!!activeId && !documents.length && (
              <p className="chat-sidebar-empty">Aucun support pour cette discussion.</p>
            )}
          </div>

          <div className="sidebar-profile">
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-profile-info">
              <strong>{user?.nom}</strong>
              <small>Étudiant</small>
            </div>
            <Link to="/profil" className="sidebar-logout" title="Mon profil" aria-label="Mon profil">
              <User size={16} />
            </Link>
            <button className="sidebar-logout" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileMenu && <button className="chat-mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Fermer le menu" />}

      {/* MAIN */}
      <section className="chat-workspace">
        <header className="chat-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileMenu(true)} aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
          <div className="chat-breadcrumb">
            <span>Mon espace</span>
            <span className="chat-breadcrumb-slash">/</span>
            <strong>{activeConversation?.titre || 'Nouvelle discussion'}</strong>
          </div>
          <div className="chat-topbar-right">
            <span className="status-pill">
              <span className="status-dot" /> Votre tuteur est prêt
            </span>
            <div className="topbar-avatar-btn" onClick={() => setAvatarMenu((v) => !v)}>
              <div className="topbar-avatar">{initial}</div>
              {avatarMenu && (
                <div className="topbar-menu" onClick={(e) => e.stopPropagation()}>
                  <Link to="/profil" onClick={() => setAvatarMenu(false)}>
                    <User size={15} /> Mon profil
                  </Link>
                  <button onClick={() => { setAvatarMenu(false); handleLogout() }}>
                    <LogOut size={15} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="chat-content">
          <div className="chat-scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="welcome-orb"><Sparkle size={24} /></div>
                <p className="welcome-label">VOTRE TUTEUR EST LÀ</p>
                <h1>Bonjour {firstName},<br /><span>qu'aimeriez-vous apprendre&nbsp;?</span></h1>
                <p className="welcome-desc">Posez une question, demandez une explication ou entraînez-vous sur une notion de votre cours.</p>
                <div className="suggestion-grid">
                  <button className="suggestion-card" onClick={() => handleSuggestion('Explique-moi le principe du KNN avec une intuition et un exemple.')}>
                    <span className="suggestion-icon purple"><Sparkle size={16} /></span>
                    <span className="suggestion-text"><strong>Comprendre une notion</strong><small>Une explication claire, à mon niveau</small></span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Donne-moi un exercice d\'électricité avec corrigé détaillé.')}>
                    <span className="suggestion-icon peach"><BookOpen size={16} /></span>
                    <span className="suggestion-text"><strong>M'entraîner</strong><small>Des exercices pour progresser</small></span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Résume mon cours importé en points clés.')}>
                    <span className="suggestion-icon mint"><FileText size={16} /></span>
                    <span className="suggestion-text"><strong>Réviser mon cours</strong><small>Un résumé de mon support importé</small></span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Fais-moi un QCM sur les réseaux de neurones.')}>
                    <span className="suggestion-icon blue"><MessageCircle size={16} /></span>
                    <span className="suggestion-text"><strong>Tester mes acquis</strong><small>Un QCM pour faire le point</small></span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="message-list">
                {messages.map((msg, idx) => {
                  codeBlockIdx = 0
                  return (
                    <article className={`msg-row ${msg.role === 'user' ? 'msg-row-user' : ''}`} key={`${msg.id}-${idx}`}>
                      {msg.role !== 'user' && (
                        <div className="msg-avatar"><Sparkle size={16} /></div>
                      )}
                      <div className="msg-content">
                        <div className="msg-meta">
                          {msg.role === 'user' ? 'Vous' : 'Clair'}
                          <span>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                        <div className={`msg-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                          <ReactMarkdown
                            components={{
                              pre({ children }) { return children },
                              code({ inline, className, children }) {
                                if (inline) return <code className={className}>{children}</code>
                                return <CodeBlock className={className}>{children}</CodeBlock>
                              }
                            }}
                          >
                            {msg.contenu}
                          </ReactMarkdown>
                        </div>
                        {msg.sources?.length > 0 && (
                          <div className="msg-sources">
                            <div className="sources-title">
                              <BookOpen size={14} /><span>Sources de votre cours</span>
                            </div>
                            {msg.sources.map((src, i) => (
                              <details className="source-card" key={`${src.document_id}-${i}`}>
                                <summary>
                                  <span className="source-num">{i + 1}</span>
                                  <span>{src.nom_fichier}{src.page ? ` · page ${src.page}` : ''}</span>
                                </summary>
                                <p>{src.extrait}</p>
                              </details>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
                {busy && (
                  <article className="msg-row">
                    <div className="msg-avatar"><Sparkle size={16} /></div>
                    <div className="msg-content">
                      <div className="msg-meta">Clair <span>réfléchit</span></div>
                      <div className="typing-bubble"><i /><i /><i /></div>
                    </div>
                  </article>
                )}
              </div>
            )}
          </div>

          <div className="composer-wrap">
            {notice && (
              <div className="notice-banner">
                <span>✓</span>{notice}
                <button onClick={() => setNotice('')} aria-label="Fermer"><X size={14} /></button>
              </div>
            )}
            {error && (
              <div className="error-banner">
                <span>{error}</span>
                <button onClick={() => setError('')} aria-label="Fermer"><X size={14} /></button>
              </div>
            )}
            <form className="composer" onSubmit={sendMessage}>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Posez votre question…"
                rows={1}
                aria-label="Votre question"
              />
              <div className="composer-bottom">
                <span>
                  <Sparkle size={12} /> Clair peut faire des erreurs. Vérifiez les notions importantes.
                </span>
                <button className="send-btn" type="submit" disabled={!draft.trim() || busy} aria-label="Envoyer">
                  <Send size={15} />
                </button>
              </div>
            </form>
            <p className="composer-hint">Entrée pour envoyer <span>·</span> Maj + Entrée pour aller à la ligne</p>
          </div>
        </section>
      </section>
    </main>
  )
}

