import {
  COST_DEVIATION_LIMIT_PERCENT,
  TEN_MINUTES_MS,
  type CatalogItem,
} from '../config/catalog.ts'

export function lineTotal(quantity: number, unitPrice: number): number {
  return Math.max(0, quantity) * unitPrice
}

export function sheetTotal(
  items: CatalogItem[],
  qty: Record<string, number>,
): number {
  return items.reduce(
    (sum, item) => sum + lineTotal(qty[item.id] ?? 0, item.unitPrice),
    0,
  )
}

export function costDeviationPercent(
  planned: number,
  actual: number,
): number | null {
  if (planned === 0) return actual === 0 ? 0 : null
  return ((actual - planned) / Math.abs(planned)) * 100
}

export function isExcludedByCost(planned: number, actual: number): boolean {
  const deviation = costDeviationPercent(planned, actual)
  return deviation != null && Math.abs(deviation) > COST_DEVIATION_LIMIT_PERCENT
}

export function timeAdjustmentQty(
  elapsedMs: number,
  plannedMs: number,
): { extraBlocks: number; savedBlocks: number } {
  if (elapsedMs > plannedMs) {
    const overtime = elapsedMs - plannedMs
    return {
      extraBlocks: Math.ceil(overtime / TEN_MINUTES_MS),
      savedBlocks: 0,
    }
  }
  return {
    extraBlocks: 0,
    savedBlocks: Math.floor((plannedMs - elapsedMs) / TEN_MINUTES_MS),
  }
}
