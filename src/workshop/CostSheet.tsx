import type { ReactNode } from 'react'
import type { CatalogItem } from '../config/catalog.ts'
import { lineTotal } from '../domain/costing.ts'
import { formatEuro } from '../domain/money.ts'
import { formatDuration } from '../domain/time.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import {
  getTeamSubmit,
  workshopStore,
  type SheetId,
} from '../store/workshopStore.ts'
import { TeamBentoPicker } from '../teams/TeamBentoPicker.tsx'

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
  const { data } = useWorkshopData()
  const total = items.reduce(
    (sum, item) => sum + lineTotal(qty[item.id] ?? 0, item.unitPrice),
    0,
  )
  const submitted = submittedElapsedMs != null

  return (
    <section className="sheet">
      <header className="sheet-head">
        <div>
          <h1>{title}</h1>
        </div>
        <div className="sheet-meta">
          <p className={submitted ? 'sheet-stamp is-done' : 'sheet-stamp'}>
            {timeLabel}:{' '}
            {submittedElapsedMs == null
              ? 'noch nicht abgegeben'
              : formatDuration(submittedElapsedMs)}
          </p>
        </div>
      </header>

      {data.teams.length > 0 ? (
        <TeamBentoPicker
          teams={data.teams}
          activeTeamId={data.activeTeamId}
          onSelect={(id) => workshopStore.setActiveTeam(id)}
          statusFor={(teamId) =>
            getTeamSubmit(data, teamId, sheet) == null ? null : 'abgegeben'
          }
        />
      ) : (
        <div className="sheet-meta sheet-teamname">
          <label>
            Teamname
            <input
              value={groupName}
              placeholder="Teamname"
              autoComplete="organization"
              onChange={(event) =>
                workshopStore.setGroupName(event.target.value)
              }
            />
          </label>
        </div>
      )}

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
              const max = item.maxQty ?? Number.POSITIVE_INFINITY
              return (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{formatEuro(item.unitPrice)}</td>
                  <td>
                    <div className="qty-control">
                      <button
                        type="button"
                        className="qty-btn"
                        disabled={quantity <= 0}
                        aria-label={`Weniger ${item.label}`}
                        onClick={() =>
                          workshopStore.setQuantity(sheet, item.id, quantity - 1)
                        }
                      >
                        −
                      </button>
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
                      <button
                        type="button"
                        className="qty-btn"
                        disabled={quantity >= max}
                        aria-label={`Mehr ${item.label}`}
                        onClick={() =>
                          workshopStore.setQuantity(sheet, item.id, quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
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
