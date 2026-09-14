import { Link } from 'react-router'

type Props = {
  moduleName: string
}

export function ComingSoonPage({ moduleName }: Props) {
  return (
    <main className="coming-soon">
      <p className="eyebrow">Folgt später</p>
      <h1>{moduleName}</h1>
      <p>
        v1 zeigt nur die Workshop-Zeiten. Dieses Modul hängt später an derselben
        Session wie der Timer.
      </p>
      <p>
        <Link to="/">Zurück zum Timer</Link>
      </p>
    </main>
  )
}
