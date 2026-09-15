import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Announcer } from './display/Announcer.tsx'
import { DisplayView } from './display/DisplayView.tsx'
import { useWorkshopSession } from './display/useWorkshopSession.ts'
import { AppNav } from './layout/AppNav.tsx'
import { SetupView } from './setup/SetupView.tsx'
import { BriefPage } from './workshop/BriefPage.tsx'
import { EstimatePage } from './workshop/EstimatePage.tsx'
import { JuryPage } from './workshop/JuryPage.tsx'
import { MaterialsPage } from './workshop/MaterialsPage.tsx'

function AppShell() {
  const { state } = useWorkshopSession()
  const setup = state.status === 'idle'

  return (
    <>
      <Announcer />
      {setup ? null : <AppNav />}
      <Routes>
        <Route path="/" element={setup ? <SetupView /> : <DisplayView />} />
        <Route path="/brief" element={<BriefPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/estimate" element={<EstimatePage mode="estimate" />} />
        <Route path="/actual" element={<EstimatePage mode="actual" />} />
        <Route path="/jury" element={<JuryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
