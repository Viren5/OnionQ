import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { InspectionsList } from './pages/InspectionsList';
import { NewInspection } from './pages/NewInspection';
import { InspectionDetail } from './pages/InspectionDetail';
import { VerificationQueue } from './pages/VerificationQueue';
import { ReportView } from './pages/ReportView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inspections" element={<InspectionsList />} />
          <Route path="/inspections/new" element={<NewInspection />} />
          <Route path="/inspections/:id" element={<InspectionDetail />} />
          <Route path="/verification" element={<VerificationQueue />} />
          <Route path="/reports/:inspectionId" element={<ReportView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
