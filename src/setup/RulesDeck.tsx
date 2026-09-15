import type { MouseEvent } from 'react'
import type { RulesSlide } from '../config/rulesSlides.ts'

type Props = {
  slide: RulesSlide
  index: number
  total: number
  onClick: (event: MouseEvent<HTMLElement>) => void
  onPrev: () => void
  onNext: () => void
}

export function RulesDeck({
  slide,
  index,
  total,
  onClick,
  onPrev,
  onNext,
}: Props) {
  const last = index === total - 1

  return (
    <section className="deck" onClick={onClick} role="presentation">
      <button
        type="button"
        className="deck-hit deck-hit-left"
        aria-label="Vorherige Folie"
        onClick={(event) => {
          event.stopPropagation()
          onPrev()
        }}
      />
      <button
        type="button"
        className="deck-hit deck-hit-right"
        aria-label={last ? 'Timer starten' : 'Nächste Folie'}
        onClick={(event) => {
          event.stopPropagation()
          onNext()
        }}
      />

      <p className="deck-progress">
        {index + 1} / {total}
      </p>
      <p className="eyebrow">{slide.kicker}</p>
      <h1>{slide.title}</h1>
      {slide.body ? <p className="deck-body">{slide.body}</p> : null}
      {slide.bullets ? (
        <ul>
          {slide.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <p className="deck-hint">
        <span>‹ zurück</span>
        <span>{last ? 'rechts: Timer starten' : 'vor ›'}</span>
      </p>
    </section>
  )
}
