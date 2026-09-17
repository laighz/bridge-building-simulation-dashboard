import { workshopConfig } from './workshop.ts'

export type BriefSlide = {
  id: string
  kicker: string
  title: string
  body?: string
  bullets?: string[]
}

export const briefSlides: BriefSlide[] = [
  {
    id: 'titel',
    kicker: 'Auftrag',
    title: workshopConfig.title,
    body: 'Zwei Tische, ein Meter Abstand, eine Brücke — geplant, kalkuliert und gebaut unter Zeit- und Kostendruck.',
  },
  {
    id: 'aufgabe',
    kicker: '01',
    title: 'Aufgabe',
    body: 'Bauen Sie eine Brücke, die zwei Tische mit einem Abstand von 1 Meter verbindet. Die Brücke darf weder mit den Tischen noch mit Boden oder Decke fest verbunden sein. Die Auflagefläche auf jedem Tisch darf höchstens die Größe eines DIN-A4-Blattes haben.',
  },
  {
    id: 'technische-anforderungen',
    kicker: '02',
    title: 'Technische Anforderungen',
    bullets: [
      'Spannweite: 1 Meter',
      'Zwei Fahrspuren mit Fahrbahnmarkierungen',
      'Je ein Radweg links und rechts der Fahrbahn',
      'Je ein erhöhter Gehweg links und rechts der Fahrbahn',
      'Proportionen der Straßen- und Wegbreiten realitätsnah',
      'Gesamtbreite aller Fahrbahnen und Wege: 30 cm',
      'Lichte Durchfahrtshöhe: mindestens 20 cm über die gesamte Fahrbahnbreite',
      'Maßstabsgerechtes Brückengeländer entlang der Brücke',
    ],
  },
  {
    id: 'planung',
    kicker: '03',
    title: 'Planung',
    bullets: [
      'Maßstabsgerechter Bauplan 1:10',
      'Abgabe spätestens nach 45 Minuten',
      'Wesentliche Konstruktionselemente müssen erkennbar sein',
    ],
  },
  {
    id: 'kostenplanung',
    kicker: '04',
    title: 'Kostenplanung',
    bullets: [
      'Vorkalkulation spätestens nach 30 Minuten',
      'Nachkalkulation am Ende des Projekts',
      'Vergleich der geplanten und tatsächlichen Kosten',
      'Die Nachkalkulation weicht um mehr als 40 % von der Vorkalkulation ab',
    ],
  },
  {
    id: 'belastungstest',
    kicker: '05',
    title: 'Belastungstest',
    body: 'Die Brücke muss an jeder Stelle der Fahrbahn ein Prüfgewicht von 1 kg tragen können.',
    bullets: ['Die Brücke trägt 1 kg nicht an jeder Stelle oder stürzt ein'],
  },
  {
    id: 'spielziel',
    kicker: '06',
    title: 'Spielziel',
    body: 'Die Teams planen, kalkulieren und bauen als Unternehmen. Technische Anforderungen, Zeitvorgaben und Kostenziele müssen eingehalten werden.',
  },
  {
    id: 'ablauf',
    kicker: '07',
    title: 'Ablauf',
    bullets: [
      'Projektauftrag analysieren',
      'Vorkalkulation erstellen',
      'Bauplan entwickeln',
      'Materialien bestellen',
      'Brücke bauen',
      'Belastungstest durchführen',
      'Nachkalkulation erstellen',
      'Bewertung durch eine Jury',
    ],
  },
  {
    id: 'jury',
    kicker: '08',
    title: 'Jury (0–10 Punkte je Kriterium)',
    bullets: [
      'Möglichst geringe tatsächliche Kosten',
      'Möglichst geringe Abweichung Vor- vs. Nachkalkulation',
      'Optische Gestaltung',
      'Stabilität der Konstruktion',
    ],
  },
]
