import type { ReactNode } from 'react'
import type { CatalogItem } from '../config/catalog.ts'
import { lineTotal } from '../domain/costing.ts'
import { formatEuro } from '../domain/money.ts'
import { formatDuration } from '../domain/time.ts'
import type { SheetId } from '../store/workshopStore.ts'
import { workshopStore } from '../store/workshopStore.ts'

type Props = {
  title: string
  sheet: SheetId
  items: CatalogItem[]
  qty: Record<string, number>
  groupName: string
  submittedElapsedMs: number | null
  timeLabel: string
  elapsedMs: number
  children?: ReactNode
}

export function CostSheet({
  title,
  sheet,
  items,
  qty,
  groupName,
  submittedElapsedMs,
  timeLabel,
  elapsedMs,
  children,
}: Props) {
  const total = items.reduce(
    (sum, item) => sum + lineTotal(qty[item.id] ?? 0, item.unitPrice),
    0,
  )

  return (
    <section className="sheet">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">Projekt Brückenbau</p>
          <h1>{title}</h1>
        </div>
        <div className="sheet-meta">
          <label>
            Gruppe
            <input
              value={groupName}
              onChange={(event) => workshopStore.setGroupName(event.target.value)}
            />
          </label>
          <p>
            {timeLabel}:{' '}
            {submittedElapsedMs == null
              ? 'noch nicht abgegeben'
              : formatDuration(submittedElapsedMs)}
          </p>
        </div>
      </header>

      <div className="sheet-table-wrap">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Artikelmenge und Artikelbezeichnung</th>
              <th>Preis je Artikel</th>
              <th>Anzahl</th>
              <th>Gesamtpreis</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const quantity = qty[item.id] ?? 0
              return (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{formatEuro(item.unitPrice)}</td>
                  <td>
                    <input
                      className="sheet-qty"
                      type="number"
                      min={0}
                      max={item.maxQty}
                      step={1}
                      inputMode="numeric"
                      aria-label={`Anzahl ${item.label}`}
                      value={quantity === 0 ? '' : quantity}
                      onChange={(event) =>
                        workshopStore.setQuantity(
                          sheet,
                          item.id,
                          Number(event.target.value),
                        )
                      }
                    />
                  </td>
                  <td>{formatEuro(lineTotal(quantity, item.unitPrice))}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3}>Summe</th>
              <th>{formatEuro(total)}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="sheet-actions">
        {children}
        <button
          type="button"
          className="primary"
          onClick={() => workshopStore.submit(sheet, elapsedMs)}
        >
          Abgeben
        </button>
      </div>
    </section>
  )
}
