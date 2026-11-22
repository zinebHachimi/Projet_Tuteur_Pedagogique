import { useState } from 'react'
import { Mail, MapPin, MessageCircle, Send } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  function validate() {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Le nom est requis.'
    if (!form.email.trim()) e.email = 'L\'email est requis.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide.'
    if (!form.sujet.trim()) e.sujet = 'Le sujet est requis.'
    if (!form.message.trim()) e.message = 'Le message est requis.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length) return
    setSending(true)
    // Simulate submission (no backend route)
    setTimeout(() => { setSending(false); setSubmitted(true) }, 1200)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="page">
      <Navbar />

      <section className="about-hero">
        <h1>Contactez-nous</h1>
        <p>Une question, une suggestion ou un problème ? Nous sommes là pour vous aider.</p>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="contact-wrapper">
            {/* Info column */}
            <div className="contact-info">
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Restons en contact</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                  N'hésitez pas à nous écrire pour toute question concernant la plateforme.
                </p>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-icon"><Mail size={18} /></div>
                <div>
                  <h4>Email</h4>
                  <p>contact@clair-tuteur.fr</p>
                </div>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-icon"><MapPin size={18} /></div>
                <div>
                  <h4>Localisation</h4>
                  <p>Projet pédagogique universitaire</p>
                </div>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-icon"><MessageCircle size={18} /></div>
                <div>
                  <h4>Support</h4>
                  <p>Réponse sous 48 heures</p>
                </div>
              </div>
            </div>

            {/* Form column */}
            <div className="card">
              {submitted ? (
                <div className="contact-success">
                  <h3>✓ Message envoyé !</h3>
                  <p>Merci pour votre message. Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="input-group">
                    <label className="input-label">Nom complet</label>
                    <input className="input" placeholder="Votre nom" value={form.nom} onChange={(e) => update('nom', e.target.value)} />
                    {errors.nom && <span className="error-message">{errors.nom}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Adresse email</label>
                    <input className="input" type="email" placeholder="vous@exemple.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Sujet</label>
                    <input className="input" placeholder="De quoi souhaitez-vous parler ?" value={form.sujet} onChange={(e) => update('sujet', e.target.value)} />
                    {errors.sujet && <span className="error-message">{errors.sujet}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Message</label>
                    <textarea className="textarea" placeholder="Votre message..." value={form.message} onChange={(e) => update('message', e.target.value)} />
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>
                  <button className="btn btn-primary btn-block" disabled={sending}>
                    {sending ? 'Envoi en cours…' : 'Envoyer le message'} <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

