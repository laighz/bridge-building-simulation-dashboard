# Brückenbau-Simulation

Beamer-Timer und Workshop-Formulare für die Projekt-Simulation: Auftrag, Materialbestellung, Vor-/Nachkalkulation und Jury.

## Ablauf

Die Uhr startet bei **0:00**. Zwei Planungs-Abgaben, danach die Bauzeit:

| Zeitpunkt ab Start | Ereignis |
| --- | --- |
| **30 Min** | Vorkalkulation abgeben |
| **45 Min** (gesamt) | Projektskizze / Bauplan 1:10 abgeben |
| **+ 90 Min** nach den 45 Min | Fertigstellung — Gesamtzeit **2:15 Stunden** |

Phasenleiste: Vorbereitung → Auftrag → Planung → Realisierung → Abschluss.

Fertige Phasen werden grün, die aktuelle Phase cyan. Pause und Lauf sind visuell getrennt.

Ausschluss, wenn die Brücke 1 kg nicht trägt oder die Nachkalkulation um mehr als **40 %** von der Vorkalkulation abweicht. Jury: je 0–10 Punkte für geringe Kosten, geringe Abweichung, Optik, Stabilität.

## Start

```bash
npm install
npm run dev
```

Browser: `http://localhost:5173/`

| Route | Inhalt |
| --- | --- |
| `/` | Timer |
| `/brief` | Auftrag und Regeln |
| `/materials` | Materialbestellung |
| `/estimate` | Vorkalkulation |
| `/actual` | Nachkalkulation |
| `/jury` | Belastungstest, Kostenvergleich, Punkte |

Mengen und Jury-Werte bleiben in `localStorage` (`bridge-workshop`, `bridge-session`).

## Tasten (Timer)

| Taste | Aktion |
| --- | --- |
| Leertaste | Start / Pause |
| `R` zweimal | Reset |
| `F` | Fullscreen |
| `C` | Facilitator-Steuerung ausblenden/einblenden |
| Esc | Steuerung schließen / Reset abbrechen |

Zeiten in [`src/config/workshop.ts`](src/config/workshop.ts), Preise in [`src/config/catalog.ts`](src/config/catalog.ts).
