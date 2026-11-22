import { useState, useMemo, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { normaliserQcm } from '../utils/normaliserQcm'
import { RotateCcw, PlusCircle, CheckCircle2, XCircle, Trophy } from 'lucide-react'

/**
 * Parse QCM text into structured questions.
 * Supports new format: "QCM : subject" / "Question n : text" / A. B. C. D. / Réponse : X / Explication : ...
 * Also supports old format with **Question n** or numbered questions, and options like a) b) or - A.
 * Returns null if parsing fails (< 1 question found).
 */
function parseQcm(raw) {
  const texte = normaliserQcm(raw)

  // Extract optional title: "QCM : ..." or "**QCM : ...**" at the top
  let titre = ''
  const titreMatch = texte.match(/^(?:\*{0,2})QCM\s*[:：]\s*(.+?)(?:\*{0,2})\s*$/m)
  if (titreMatch) titre = titreMatch[1].trim()

  // Split into question blocks
  const questionPattern = /(?:^|\n)\s*(?:\*{0,2})(?:Question\s*)?(\d+)\s*[.:)]\s*(?:\*{0,2})\s*/gi
  const splits = []
  let match
  while ((match = questionPattern.exec(texte)) !== null) {
    splits.push({ index: match.index, end: match.index + match[0].length, num: parseInt(match[1]) })
  }

  if (splits.length === 0) return null

  const questions = []

  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].end
    const end = i + 1 < splits.length ? splits[i + 1].index : texte.length
    const block = texte.substring(start, end).trim()

    // Extract options: A. / A) / - A. patterns
    const optionPattern = /^[ \t]*[-–]?\s*([A-Da-d])\s*[.):\-]\s*(.+)$/gm
    const options = []
    let optMatch
    const optionPositions = []
    while ((optMatch = optionPattern.exec(block)) !== null) {
      options.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2].trim() })
      optionPositions.push({ start: optMatch.index, end: optMatch.index + optMatch[0].length })
    }

    if (options.length < 2) continue // Need at least 2 options

    // Question text is everything before the first option
    const questionText = block.substring(0, optionPositions[0]?.start || 0).replace(/\*{1,2}/g, '').trim()
    if (!questionText) continue

    // Extract answer: "Réponse : X" or "Réponse correcte : X" or "**Réponse : X**"
    let correcte = ''
    const repMatch = block.match(/(?:\*{0,2})R[ée]ponse\s*(?:correcte\s*)?[:：]\s*(?:\*{0,2})\s*([A-Da-d])/i)
    if (repMatch) correcte = repMatch[1].toUpperCase()

    // Extract explanation: "Explication : ..."
    let explication = ''
    const expMatch = block.match(/(?:\*{0,2})Explication\s*[:：]\s*(?:\*{0,2})\s*([\s\S]*?)$/i)
    if (expMatch) {
      explication = expMatch[1]
        .replace(/\*{1,2}/g, '')
        .replace(/\n(?:Question\s*\d)/i, '') // Don't leak into next question
        // Retire la phrase de relance que le LLM ajoute parfois à la fin
        .replace(/\s*(Souhaitez|Voulez|Désirez)-vous[\s\S]*$/i, '')
        .trim()
    }

    questions.push({
      num: splits[i].num,
      texte: questionText,
      options,
      correcte,
      explication,
    })
  }

  return questions.length > 0 ? { titre, questions } : null
}

/**
 * Checks if assistant message text looks like a QCM.
 */
export function isQcm(texte) {
  if (!texte) return false
  const normalized = normaliserQcm(texte)
  const hasQuestion = /(?:Question\s*\d|QCM\s*[:：])/i.test(normalized)
  const hasOptions = (normalized.match(/^[ \t]*[-–]?\s*[A-Da-d]\s*[.):\-]\s*.+$/gm) || []).length >= 2
  return hasQuestion && hasOptions
}

export default function QcmBlock({ contenu }) {
  const qcm = useMemo(() => parseQcm(contenu), [contenu])
  const [answers, setAnswers] = useState({})
  const [validated, setValidated] = useState(false)
  const scoreRef = useRef(null)

  // Après validation, descend en douceur vers le score (placé sous les questions)
  useEffect(() => {
    if (validated && scoreRef.current) {
      scoreRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [validated])

  if (!qcm) {
    // Fallback: render as normal markdown
    return <ReactMarkdown>{contenu}</ReactMarkdown>
  }

  const { titre, questions } = qcm
  const total = questions.length
  const allAnswered = questions.every((_, i) => answers[i] !== undefined)

  function select(qIdx, letter) {
    if (validated) return
    setAnswers((prev) => ({ ...prev, [qIdx]: letter }))
  }

  function validate() {
    if (!allAnswered) return
    setValidated(true)
  }

  function reset() {
    setAnswers({})
    setValidated(false)
  }

  // Score calculation
  const correctCount = validated
    ? questions.filter((q, i) => q.correcte && answers[i] === q.correcte).length
    : 0
  const pct = validated ? Math.round((correctCount / total) * 100) : 0

  function getBarColor() {
    if (pct < 50) return 'var(--error)'
    if (pct <= 75) return 'var(--peach)'
    return 'var(--success)'
  }

  function getMessage() {
    if (pct === 100) return '🎉 Parfait ! Vous maîtrisez le sujet !'
    if (pct >= 75) return '👏 Très bien ! Continuez comme ça !'
    if (pct >= 50) return '👍 Pas mal ! Quelques révisions et ce sera parfait.'
    return '💪 Courage ! Révisez les notions et réessayez.'
  }

  return (
    <div className="qcm-container">
      {/* Title */}
      {titre && <div className="qcm-title"><Trophy size={18} /> {titre}</div>}

      {/* Questions */}
      {questions.map((q, qIdx) => {
        const userAnswer = answers[qIdx]
        const isCorrect = validated && userAnswer === q.correcte

        return (
          <div className={`qcm-card ${validated ? (isCorrect ? 'qcm-card-correct' : 'qcm-card-wrong') : ''}`} key={qIdx}>
            <div className="qcm-card-header">
              <span className="qcm-card-badge">Question {q.num || qIdx + 1} / {total}</span>
            </div>
            <p className="qcm-question">{q.texte}</p>

            <div className="qcm-options">
              {q.options.map((opt) => {
                const selected = userAnswer === opt.letter
                let optClass = 'qcm-option'

                if (validated) {
                  if (opt.letter === q.correcte) {
                    optClass += ' qcm-option-correct'
                  } else if (selected && opt.letter !== q.correcte) {
                    optClass += ' qcm-option-wrong'
                  } else {
                    optClass += ' qcm-option-disabled'
                  }
                } else {
                  if (selected) optClass += ' qcm-option-selected'
                }

                return (
                  <label className={optClass} key={opt.letter}>
                    <input
                      type="radio"
                      name={`qcm-q-${qIdx}`}
                      value={opt.letter}
                      checked={selected}
                      onChange={() => select(qIdx, opt.letter)}
                      disabled={validated}
                      className="qcm-radio"
                    />
                    <span className="qcm-option-letter">{opt.letter}</span>
                    <span className="qcm-option-text">{opt.text}</span>
                    {validated && opt.letter === q.correcte && <CheckCircle2 size={16} className="qcm-option-icon qcm-icon-correct" />}
                    {validated && selected && opt.letter !== q.correcte && <XCircle size={16} className="qcm-option-icon qcm-icon-wrong" />}
                  </label>
                )
              })}
            </div>

            {/* Feedback after validation */}
            {validated && (
              <div className="qcm-feedback">
                <div className="qcm-feedback-answer">
                  <span>Ta réponse : <strong>{userAnswer || '—'}</strong></span>
                  <span className="qcm-feedback-sep">·</span>
                  <span>Bonne réponse : <strong>{q.correcte || '—'}</strong></span>
                </div>
                {q.explication && (
                  <div className="qcm-explanation">
                    <strong>Explication :</strong> {q.explication}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Score (après validation) : placé en bas, sous la dernière question */}
      {validated && (
        <div className="qcm-score-card" ref={scoreRef}>
          <div className="qcm-score-top">
            <div className="qcm-score-big">
              <span className="qcm-score-num">{correctCount}</span>
              <span className="qcm-score-sep">/</span>
              <span className="qcm-score-den">{total}</span>
            </div>
            <div className="qcm-score-pct">{pct}%</div>
          </div>
          <div className="qcm-progress-bar">
            <div className="qcm-progress-fill" style={{ width: `${pct}%`, background: getBarColor() }} />
          </div>
          <p className="qcm-score-msg">{getMessage()}</p>
          <div className="qcm-score-detail">
            <span className="qcm-score-correct"><CheckCircle2 size={14} /> {correctCount} correcte{correctCount > 1 ? 's' : ''}</span>
            <span className="qcm-score-wrong"><XCircle size={14} /> {total - correctCount} incorrecte{total - correctCount > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="qcm-actions">
        {!validated ? (
          <button className="btn btn-primary" onClick={validate} disabled={!allAnswered}>
            <CheckCircle2 size={16} /> Valider mes réponses
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={reset}>
              <RotateCcw size={16} /> Recommencer le QCM
            </button>
            <button className="btn btn-primary" onClick={() => {
              // Dispatch a custom event that Chat.jsx listens to
              window.dispatchEvent(new CustomEvent('clair-new-qcm'))
            }}>
              <PlusCircle size={16} /> Nouveau QCM
            </button>
          </>
        )}
      </div>
    </div>
  )
}