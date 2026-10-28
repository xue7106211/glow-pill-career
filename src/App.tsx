import { useCallback, useEffect, useRef, useState } from 'react'
import { milestones, ui, SITE, type Lang } from './content'
import { createGlow, type GlowHandle } from './glow'

const TYPE_MS = 62, ERASE_MS = 26, HOLD_MS = 2300, GAP_MS = 260

const reducedQuery = () => window.matchMedia('(prefers-reduced-motion: reduce)')
const toCss = (c: number[]) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`

export default function App() {
  const [lang, setLang] = useState<Lang>('zh')
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [open, setOpen] = useState(false)
  const [reduced, setReduced] = useState(() => reducedQuery().matches)
  const [noGl, setNoGl] = useState(false)
  const [toast, setToast] = useState('')
  const [hiGlow, setHiGlow] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glow = useRef<GlowHandle | null>(null)
  const m = milestones[idx]
  const phrase = m.phrase[lang]

  useEffect(() => {
    const q = reducedQuery()
    const on = () => setReduced(q.matches)
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const g = createGlow(canvasRef.current!, milestones[0].color, reducedQuery().matches)
    if (!g) setNoGl(true)
    glow.current = g
    return () => g?.dispose()
  }, [])
  useEffect(() => glow.current?.setStatic(reduced), [reduced])
  useEffect(() => glow.current?.setPress(open ? 1 : 0), [open])

  const go = useCallback((next: number) => {
    const n = (next + milestones.length) % milestones.length
    setIdx(n)
    setTyped('')
    glow.current?.surge(milestones[n].color)
  }, [])

  // typing loop: type → hold → erase → next (paused while open)
  useEffect(() => {
    if (reduced) { setTyped(phrase); return }
    if (open) { setTyped(phrase); return }
    let timer = 0
    let i = typed.length
    let phase: 'type' | 'hold' | 'erase' = i >= phrase.length ? 'hold' : 'type'
    const step = () => {
      if (phase === 'type') {
        i++
        setTyped(phrase.slice(0, i))
        if (i >= phrase.length) { phase = 'hold'; timer = window.setTimeout(step, HOLD_MS) }
        else timer = window.setTimeout(step, TYPE_MS + Math.random() * 40)
      } else if (phase === 'hold') {
        phase = 'erase'; step()
      } else {
        i--
        setTyped(phrase.slice(0, Math.max(0, i)))
        if (i <= 0) timer = window.setTimeout(() => go(idx + 1), GAP_MS)
        else timer = window.setTimeout(step, ERASE_MS)
      }
    }
    timer = window.setTimeout(step, phase === 'hold' ? HOLD_MS : 120)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, open, reduced, phrase, go])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(idx + 1)
      else if (e.key === 'ArrowLeft') go(idx - 1)
      else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, go])

  const touch = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const onPointerDown = (e: React.PointerEvent) => { touch.current = { x: e.clientX, y: e.clientY }; swiped.current = false }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = touch.current; touch.current = null
    if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped.current = true; go(idx + (dx < 0 ? 1 : -1)) }
  }

  const sayHi = () => {
    setHiGlow(true); setToast(ui[lang].toast)
    window.setTimeout(() => setHiGlow(false), 900)
    window.setTimeout(() => setToast(''), 1800)
    window.setTimeout(() => window.open(SITE, '_blank', 'noopener'), 350)
  }

  const t = ui[lang]
  const accent = toCss(m.color)
  return (
    <main
      className={`app${reduced ? ' reduced' : ''}`}
      style={{ ['--accent' as string]: accent }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      lang={lang === 'zh' ? 'zh-CN' : 'en'}
    >
      <header className="top">
        <div className="who">
          <span className="name">{t.name}</span>
          <span className="role">{t.role}</span>
        </div>
        <button className="lang" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} aria-label="Switch language">
          {t.lang}
        </button>
      </header>

      <section className="center">
        <div className="when" aria-hidden>{m.when || '\u00a0'}</div>
        <div className={`stage${noGl ? ' no-gl' : ''}`}>
          <canvas ref={canvasRef} className="glow" aria-hidden />
          <button
            className={`pill${open ? ' open' : ''}`}
            onClick={() => { if (!swiped.current) setOpen((o) => !o) }}
            aria-expanded={open}
            aria-label={phrase}
          >
            <span className="text">
              {typed}
              {!reduced && !open && <i className="caret" />}
            </span>
          </button>
        </div>

        <div className={`detail${open ? ' show' : ''}`} aria-live="polite">
          <p>{m.narrative[lang]}</p>
          <ul>{m.keywords[lang].map((k) => <li key={k}>{k}</li>)}</ul>
        </div>

        <nav className="dots" aria-label="Milestones">
          {milestones.map((x, i) => (
            <button key={x.id} className={i === idx ? 'on' : ''} onClick={() => go(i)} aria-label={x.phrase[lang]} />
          ))}
        </nav>
      </section>

      <footer className="bottom">
        <p className="hint">{t.hint}</p>
        <button className={`hi${hiGlow ? ' lit' : ''}`} onClick={sayHi}>{t.hi} ↗</button>
      </footer>
      <div className={`toast${toast ? ' show' : ''}`} role="status">{toast}</div>
    </main>
  )
}
