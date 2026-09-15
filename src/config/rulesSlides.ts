export type RulesSlide = {
  kicker: string
  title: string
  body?: string
  bullets?: string[]
}

export const rulesSlides: RulesSlide[] = [
  {
    kicker: 'Projekt Brückenbau',
    title: 'Willkommen in der Simulation',
    body: 'Ihr seid ein Unternehmen. Planen, kalkulieren, bauen — unter Zeit- und Kostendruck.',
  },
  {
    kicker: 'Auftrag',
    title: 'Zwei Tische. Ein Meter. Eine Brücke.',
    bullets: [
      'Abstand der Tische: 1 Meter',
      'Keine feste Verbindung mit Tisch, Boden oder Decke',
      'Auflage je Seite höchstens DIN A4',
    ],
  },
  {
    kicker: 'Technik',
    title: 'So muss die Brücke aussehen',
    bullets: [
      'Zwei Fahrspuren mit Markierung',
      'Radweg und erhöhter Gehweg links und rechts',
      'Gesamtbreite 30 cm, realistische Proportionen',
      'Lichte Höhe mindestens 20 cm über der Fahrbahn',
      'Maßstabsgerechtes Geländer',
    ],
  },
  {
    kicker: 'Zeiten',
    title: '30 · 45 · plus 90',
    bullets: [
      'Nach 30 Minuten: Vorkalkulation abgeben',
      'Nach 45 Minuten: Bauplan 1:10 abgeben',
      'Danach 90 Minuten Realisierung — gesamt 2:15 Stunden',
    ],
  },
  {
    kicker: 'Kosten',
    title: 'Jede Packung zählt',
    bullets: [
      'Material nur über die Bestellung',
      'Schere kaufen oder 30 Minuten mieten',
      'Nachkalkulation darf höchstens 40 % von der Vorkalkulation abweichen',
    ],
  },
  {
    kicker: 'Test',
    title: 'Ein Kilogramm. Überall.',
    body: 'Die Brücke muss an jeder Stelle der Fahrbahn 1 kg tragen. Einsturz oder Durchbiegen bis zum Versagen bedeutet Ausschluss.',
  },
  {
    kicker: 'Jury',
    title: 'Vier Noten, je 0 bis 10',
    bullets: [
      'Geringe tatsächliche Kosten',
      'Geringe Abweichung Vor- vs. Nachkalkulation',
      'Optische Gestaltung',
      'Stabilität',
    ],
  },
  {
    kicker: 'Start',
    title: 'Bereit?',
    body: 'Klick rechts oder Pfeil rechts startet den Timer. Links geht zurück.',
  },
]
