import { Link } from 'react-router-dom'
import { Sparkle, BookOpen, PenTool, FileText, Languages, Brain, MessageCircle, Upload, ArrowRight, ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const FEATURES = [
  { icon: <Sparkle size={20} />, color: 'purple', title: 'Expliquer un concept', desc: 'Recevez des explications claires et adaptées à votre niveau sur n\'importe quelle notion.' },
  { icon: <PenTool size={20} />, color: 'peach', title: 'Exercices corrigés', desc: 'Générez des exercices avec des corrections commentées pas à pas pour progresser.' },
  { icon: <Brain size={20} />, color: 'blue', title: 'Quiz et QCM', desc: 'Testez vos acquis avec des questionnaires à choix multiples personnalisés.' },
  { icon: <FileText size={20} />, color: 'mint', title: 'Résumer un cours', desc: 'Obtenez des résumés structurés de vos cours pour réviser efficacement.' },
  { icon: <Languages size={20} />, color: 'purple', title: 'Traduire', desc: 'Traduisez vos contenus pédagogiques dans plusieurs langues.' },
  { icon: <Upload size={20} />, color: 'peach', title: 'Vos propres cours', desc: 'Importez vos PDF ou TXT et obtenez des réponses fondées sur votre contenu grâce au RAG.' },
]

const STEPS = [
  { num: '1', title: 'Créez votre compte', desc: 'Inscrivez-vous gratuitement en quelques secondes.' },
  { num: '2', title: 'Posez vos questions', desc: 'Demandez une explication ou importez vos cours (PDF/TXT).' },
  { num: '3', title: 'Progressez', desc: 'Avancez à votre rythme avec un tuteur toujours disponible.' },
]

export default function Home() {
  return (
    <div className="page">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <Sparkle size={14} /> Tuteur pédagogique intelligent
          </div>
          <h1 className="hero-title">
            Les idées claires,<br /><span>ça change tout.</span>
          </h1>
          <p className="hero-subtitle">
            Un tuteur intelligent qui explique, vous entraîne avec des exercices corrigés, et s'appuie sur vos propres cours pour des réponses personnalisées.
          </p>
          <div className="hero-actions">
            <Link to="/inscription" className="btn btn-primary btn-lg">
              Commencer gratuitement <ArrowRight size={18} />
            </Link>
            <Link to="/connexion" className="btn btn-ghost btn-lg">
              Se connecter
            </Link>
          </div>

          <div className="hero-preview">
            <div className="hero-preview-label">APERÇU DU CHAT</div>
            <div className="hero-preview-msg">
              <div className="hero-preview-avatar"><Sparkle size={14} /></div>
              <div className="hero-preview-bubble">
                <strong>Bonjour !</strong> Je suis Clair, votre tuteur. Posez-moi une question, demandez un exercice ou importez votre cours — je m'adapte à vous.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM INTRO */}
      <section className="section" style={{ background: 'white' }}>
        <div className="section-inner text-center">
          <span className="section-label"><BookOpen size={14} /> Plateforme</span>
          <h2 className="section-title">Une plateforme d'éducation intelligente</h2>
          <p className="section-subtitle mx-auto">
            Clair combine l'intelligence artificielle et vos propres supports de cours pour créer une expérience d'apprentissage sur mesure, accessible et efficace.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="section-inner">
          <div className="text-center">
            <span className="section-label"><Sparkle size={14} /> Fonctionnalités</span>
            <h2 className="section-title">Tout ce dont vous avez besoin</h2>
            <p className="section-subtitle mx-auto">
              Des outils pensés pour chaque étape de votre apprentissage.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: 'white' }}>
        <div className="section-inner text-center">
          <span className="section-label"><ChevronRight size={14} /> Comment ça marche</span>
          <h2 className="section-title">Commencez en 3 étapes</h2>
          <p className="section-subtitle mx-auto">Simple, rapide et gratuit.</p>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div className="step-card card" key={i}>
                <div className="step-number">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="section-inner">
          <div className="cta-banner">
            <h2>Prêt à apprendre autrement ?</h2>
            <p>Rejoignez Clair et commencez à progresser dès aujourd'hui.</p>
            <Link to="/inscription" className="btn btn-primary btn-lg">
              Créer mon compte gratuitement <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

