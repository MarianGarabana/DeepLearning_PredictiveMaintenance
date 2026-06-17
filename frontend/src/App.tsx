import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { FleetPage } from '@/pages/FleetPage';
import { EnginePage } from '@/pages/EnginePage';
import { SimulatePage } from '@/pages/SimulatePage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<FleetPage />} />
          <Route path="/engine/:id" element={<EnginePage />} />
          <Route path="/simulate" element={<SimulatePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
