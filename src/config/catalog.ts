export type CatalogItem = {
  id: string
  label: string
  unitPrice: number
  maxQty?: number
}

export const materialItems: CatalogItem[] = [
  { id: 'carton-1', label: '1 Karton', unitPrice: 570_000 },
  { id: 'carton-5', label: '5 Kartons', unitPrice: 2_500_000 },
  { id: 'glue-1', label: '1 Tube Alleskleber', unitPrice: 350_000 },
  { id: 'glue-3', label: '3 Tuben Alleskleber', unitPrice: 900_000 },
  { id: 'tape-1', label: '1 Rolle Klebeband', unitPrice: 400_000 },
  { id: 'tape-3', label: '3 Rollen Klebeband', unitPrice: 1_100_000 },
  { id: 'cord-1', label: '1 m Schnur', unitPrice: 10_000 },
  { id: 'cord-5', label: '5 m Schnur', unitPrice: 40_000 },
  { id: 'scissors-buy', label: '1 Schere (Vorrat begrenzt)', unitPrice: 480_000, maxQty: 1 },
  { id: 'scissors-rent', label: '1 Schere je 30 Minuten Mietpreis', unitPrice: 150_000 },
  { id: 'ruler', label: '1 Lineal', unitPrice: 10_000 },
]

export const estimateExtraItems: CatalogItem[] = [
  { id: 'overhead', label: 'Fixe Projektgemeinkosten', unitPrice: 12_500_000 },
  { id: 'overtime-10', label: 'Begonnene zusätzliche 10 Min.', unitPrice: 1_500_000 },
  { id: 'saved-10', label: 'Ganze eingesparte 10 Min', unitPrice: -1_000_000 },
]

export const estimateItems: CatalogItem[] = [
  ...materialItems,
  ...estimateExtraItems,
]

export const TEN_MINUTES_MS = 10 * 60_000
export const COST_DEVIATION_LIMIT_PERCENT = 40
export const LOAD_TEST_KG = 1
