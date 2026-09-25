import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { InspectionsList } from "./pages/InspectionsList";
import { NewInspection } from "./pages/NewInspection";
import { InspectionDetail } from "./pages/InspectionDetail";
import { Verification } from "./pages/Verification";
import { ReportView } from "./pages/ReportView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />

          {/* Inspections */}
          <Route path="/inspections" element={<InspectionsList />} />

          <Route path="/inspections/new" element={<NewInspection />} />

          <Route path="/inspections/:id" element={<InspectionDetail />} />

          {/* Human / AI Verification */}
          <Route path="/verification" element={<Verification />} />

          {/* Reports */}
          <Route path="/reports/:inspectionId" element={<ReportView />} />

          {/* Unknown route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
