import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { DisplayView } from './display/DisplayView.tsx'
import { ComingSoonPage } from './pages/ComingSoonPage.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DisplayView />} />
        <Route
          path="/materials"
          element={<ComingSoonPage moduleName="Materialbestellung" />}
        />
        <Route
          path="/costing"
          element={<ComingSoonPage moduleName="Vorkalkulation" />}
        />
        <Route
          path="/teams"
          element={<ComingSoonPage moduleName="Gruppen" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
