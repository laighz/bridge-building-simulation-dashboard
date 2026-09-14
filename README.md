# Brückenbau-Simulation — Timer-Dashboard

Fullscreen-Anzeige für die Projekt-Simulation. Große Restzeit, Meilensteine und Phasen auf einem Beamer oder TV.

## Ablauf (v1)

Die Uhr startet bei **0:00**. Es gibt zwei Planungs-Abgaben, danach erst die Bauzeit:

| Zeitpunkt ab Start | Ereignis |
| --- | --- |
| **30 Min** | Vorkalkulation abgeben |
| **45 Min** (gesamt) | Projektskizze abgeben |
| **+ 90 Min** nach den 45 Min | Fertigstellung — Gesamtzeit **2:15 Stunden** |

Phasenleiste: Vorbereitung → Auftrag → Planung → Realisierung → Abschluss.

Fertige Phasen werden automatisch grün, die aktuelle Phase cyan. Pause und Lauf sind visuell getrennt (amber vs. Live-Punkt).

## Start

```bash
npm install
npm run dev
```

Browser: `http://localhost:5173/?controls=1`

Platzhalter-Routen: `/materials`, `/costing`, `/teams`.

## Tasten

| Taste | Aktion |
| --- | --- |
| Leertaste | Start / Pause |
| `R` zweimal | Reset |
| `F` | Fullscreen |
| `C` | Facilitator-Steuerung ein/aus |
| Esc | Steuerung schließen / Reset abbrechen |

Zeiten in [`src/config/workshop.ts`](src/config/workshop.ts).
