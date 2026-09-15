import './workshop.css'

export function BriefPage() {
  return (
    <main className="workshop-page">
      <header className="brief-head">
        <div>
          <p className="eyebrow">Projekt Brückenbau</p>
          <h1>Auftrag</h1>
        </div>
      </header>

      <div className="brief-grid">
        <article className="brief-card">
          <h2>Aufgabe</h2>
          <p>
            Bauen Sie eine Brücke, die zwei Tische mit einem Abstand von 1 Meter
            verbindet. Die Brücke darf weder mit den Tischen noch mit Boden oder
            Decke fest verbunden sein. Die Auflagefläche auf jedem Tisch darf
            höchstens die Größe eines DIN-A4-Blattes haben.
          </p>
        </article>

        <article className="brief-card">
          <h2>Technische Anforderungen</h2>
          <ul>
            <li>Spannweite: 1 Meter</li>
            <li>Zwei Fahrspuren mit Fahrbahnmarkierungen</li>
            <li>Je ein Radweg links und rechts der Fahrbahn</li>
            <li>Je ein erhöhter Gehweg links und rechts der Fahrbahn</li>
            <li>Proportionen der Straßen- und Wegbreiten realitätsnah</li>
            <li>Gesamtbreite aller Fahrbahnen und Wege: 30 cm</li>
            <li>
              Lichte Durchfahrtshöhe: mindestens 20 cm über die gesamte
              Fahrbahnbreite
            </li>
            <li>Maßstabsgerechtes Brückengeländer entlang der Brücke</li>
          </ul>
        </article>

        <article className="brief-card">
          <h2>Planung</h2>
          <ul>
            <li>Maßstabsgerechter Bauplan 1:10</li>
            <li>Abgabe spätestens nach 45 Minuten</li>
            <li>Wesentliche Konstruktionselemente müssen erkennbar sein</li>
          </ul>
        </article>

        <article className="brief-card">
          <h2>Kostenplanung</h2>
          <ul>
            <li>Vorkalkulation spätestens nach 30 Minuten</li>
            <li>Nachkalkulation am Ende des Projekts</li>
            <li>Vergleich der geplanten und tatsächlichen Kosten</li>
          </ul>
        </article>

        <article className="brief-card">
          <h2>Belastungstest</h2>
          <p>
            Die Brücke muss an jeder Stelle der Fahrbahn ein Prüfgewicht von 1 kg
            tragen können.
          </p>
        </article>

        <article className="brief-card">
          <h2>Spielziel</h2>
          <p>
            Die Teams planen, kalkulieren und bauen als Unternehmen. Technische
            Anforderungen, Zeitvorgaben und Kostenziele müssen eingehalten
            werden.
          </p>
        </article>

        <article className="brief-card">
          <h2>Ablauf</h2>
          <ul>
            <li>Projektauftrag analysieren</li>
            <li>Vorkalkulation erstellen</li>
            <li>Bauplan entwickeln</li>
            <li>Materialien bestellen</li>
            <li>Brücke bauen</li>
            <li>Belastungstest durchführen</li>
            <li>Nachkalkulation erstellen</li>
            <li>Bewertung durch eine Jury</li>
          </ul>
        </article>

        <article className="brief-card">
          <h2>Ausschluss</h2>
          <ul>
            <li>
              Die Brücke trägt 1 kg nicht an jeder Stelle oder stürzt ein
            </li>
            <li>
              Die Nachkalkulation weicht um mehr als 40 % von der
              Vorkalkulation ab
            </li>
          </ul>
        </article>

        <article className="brief-card">
          <h2>Jury (0–10 Punkte je Kriterium)</h2>
          <ul>
            <li>Möglichst geringe tatsächliche Kosten</li>
            <li>Möglichst geringe Abweichung Vor- vs. Nachkalkulation</li>
            <li>Optische Gestaltung</li>
            <li>Stabilität der Konstruktion</li>
          </ul>
        </article>
      </div>
    </main>
  )
}
