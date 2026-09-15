import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { DisplayView } from './display/DisplayView.tsx'
import { AppNav } from './layout/AppNav.tsx'
import { BriefPage } from './workshop/BriefPage.tsx'
import { EstimatePage } from './workshop/EstimatePage.tsx'
import { JuryPage } from './workshop/JuryPage.tsx'
import { MaterialsPage } from './workshop/MaterialsPage.tsx'

function App() {
  return (
    <BrowserRouter>
      <AppNav />
      <Routes>
        <Route path="/" element={<DisplayView />} />
        <Route path="/brief" element={<BriefPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/estimate" element={<EstimatePage mode="estimate" />} />
        <Route path="/actual" element={<EstimatePage mode="actual" />} />
        <Route path="/jury" element={<JuryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
