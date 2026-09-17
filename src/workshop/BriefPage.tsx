import { useCallback, useEffect, useRef, useState } from 'react'
import { briefSlides } from '../config/briefSlides.ts'
import './brief.css'

const TOTAL = briefSlides.length

export function BriefPage() {
  const trackRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  const scrollToSlide = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.min(Math.max(index, 0), TOTAL - 1)
    activeRef.current = clamped
    const slide = track.querySelectorAll<HTMLElement>('.brief-slide')[clamped]
    // Kein behavior-Argument: CSS `scroll-behavior: smooth` greift, bei
    // prefers-reduced-motion erzwingt die globale Regel `auto`.
    if (slide) track.scrollTo({ top: slide.offsetTop })
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const slides = Array.from(track.querySelectorAll('.brief-slide'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = slides.indexOf(entry.target)
          if (index >= 0) {
            activeRef.current = index
            setActive(index)
          }
        }
      },
      { root: track, threshold: 0.5 },
    )
    for (const slide of slides) observer.observe(slide)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return
        }
      }
      let delta = 0
      if (event.key === 'ArrowDown' || event.key === 'PageDown') delta = 1
      else if (event.key === 'ArrowUp' || event.key === 'PageUp') delta = -1
      if (delta === 0) return
      event.preventDefault()
      scrollToSlide(activeRef.current + delta)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [scrollToSlide])

  return (
    <main className="brief-deck">
      <div className="brief-track" ref={trackRef}>
        {briefSlides.map((slide, index) => {
          const isTitle = index === 0
          const titleId = `brief-slide-title-${slide.id}`
          return (
            <section
              key={slide.id}
              className={isTitle ? 'brief-slide brief-slide--title' : 'brief-slide'}
              aria-labelledby={titleId}
            >
              <div className="brief-slide-inner">
                <p className="brief-kicker">{slide.kicker}</p>
                {isTitle ? (
                  <h1 className="brief-title" id={titleId}>
                    {slide.title}
                  </h1>
                ) : (
                  <h2 className="brief-title" id={titleId}>
                    {slide.title}
                  </h2>
                )}
                {slide.body ? <p className="brief-body">{slide.body}</p> : null}
                {slide.bullets ? (
                  <ul className="brief-bullets">
                    {slide.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {isTitle ? (
                <p className="brief-scroll-hint">
                  Scrollen
                  <span className="brief-scroll-hint-arrow" aria-hidden="true">
                    ↓
                  </span>
                </p>
              ) : null}
            </section>
          )
        })}
      </div>

      <nav className="brief-dots" aria-label="Slides">
        {briefSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className="brief-dot"
            aria-label={`Slide ${index + 1}: ${slide.title}`}
            aria-current={index === active ? 'true' : undefined}
            onClick={() => scrollToSlide(index)}
          />
        ))}
        <p className="brief-count" aria-hidden="true">
          {active + 1} / {TOTAL}
        </p>
      </nav>
    </main>
  )
}
