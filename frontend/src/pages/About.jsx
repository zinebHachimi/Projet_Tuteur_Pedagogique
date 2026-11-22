import { Sparkle, BookOpen, Shield, TrendingUp, Eye } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const CAPABILITIES = [
  { icon: <Sparkle size={20} />, color: 'purple', title: 'Explications claires', desc: 'Des réponses adaptées à votre niveau, avec des exemples concrets et des analogies.' },
  { icon: <BookOpen size={20} />, color: 'peach', title: 'Exercices corrigés', desc: 'Des exercices générés à la demande avec des corrections commentées pas à pas.' },
  { icon: <Shield size={20} />, color: 'blue', title: 'Résumés et traductions', desc: 'Résumez vos cours et traduisez-les dans plusieurs langues en un clic.' },
  { icon: <TrendingUp size={20} />, color: 'mint', title: 'RAG sur vos cours', desc: 'Importez vos PDF et TXT — Clair répond en s\'appuyant sur votre propre contenu.' },
]

const VALUES = [
  { emoji: '💡', title: 'Clarté', desc: 'Des explications simples et structurées pour que chaque notion devienne accessible.' },
  { emoji: '📈', title: 'Progression', desc: 'Un apprentissage adaptatif qui vous accompagne étape par étape.' },
  { emoji: '🔒', title: 'Confidentialité', desc: 'Vos conversations et vos supports de cours restent privés et sécurisés.' },
]

const TECHS = ['React', 'Vite', 'FastAPI', 'Python', 'LangGraph', 'RAG', 'LLM (Groq)', 'Transformers', 'ChromaDB', 'SQLite']

export default function About() {
  return (
    <div className="page">
      <Navbar />

      <section className="about-hero">
        <h1>À propos de Clair</h1>
        <p>
          Notre mission : rendre l'apprentissage accessible, personnalisé et efficace grâce à l'intelligence artificielle.
        </p>
      </section>

      {/* WHAT WE DO */}
      <section className="section" style={{ background: 'white' }}>
        <div className="section-inner">
          <div className="text-center">
            <span className="section-label"><Eye size={14} /> Ce que fait Clair</span>
            <h2 className="section-title">Un tuteur complet à votre service</h2>
            <p className="section-subtitle mx-auto">
              Clair est un assistant pédagogique intelligent qui combine plusieurs outils pour vous aider à comprendre, pratiquer et réviser.
            </p>
          </div>
          <div className="about-grid">
            {CAPABILITIES.map((c, i) => (
              <div className="feature-card about-card" key={i}>
                <div className={`feature-icon ${c.color}`}>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section">
        <div className="section-inner text-center">
          <span className="section-label"><Sparkle size={14} /> Nos valeurs</span>
          <h2 className="section-title">Ce en quoi nous croyons</h2>
          <div className="values-grid">
            {VALUES.map((v, i) => (
              <div className="card value-card" key={i}>
                <div className="value-icon">{v.emoji}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGIES */}
      <section className="section" style={{ background: 'white' }}>
        <div className="section-inner text-center">
          <span className="section-label">🛠️ Technologies</span>
          <h2 className="section-title">Construit avec les meilleures technologies</h2>
          <p className="section-subtitle mx-auto">
            Un stack moderne et performant pour une expérience fluide et fiable.
          </p>
          <div className="tech-badges">
            {TECHS.map((t) => <span className="tech-badge" key={t}>{t}</span>)}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

