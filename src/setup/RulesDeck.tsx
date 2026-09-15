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
    <section className="deck" onClick={onClick} aria-label="Regeln">
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
        {slide.kicker}
        <span aria-hidden="true"> · </span>
        {index + 1} / {total}
      </p>
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
        <span>Zurück</span>
        <span>{last ? 'Timer starten' : 'Weiter'}</span>
      </p>
    </section>
  )
}
