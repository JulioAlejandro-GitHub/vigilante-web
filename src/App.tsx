import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { CaseSuggestionsPage } from "./pages/CaseSuggestionsPage";
import { CasesPage } from "./pages/CasesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ManualReviewsPage } from "./pages/ManualReviewsPage";
import { TimelinePage } from "./pages/TimelinePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:caseId" element={<CaseDetailPage />} />
        <Route path="/manual-reviews" element={<ManualReviewsPage />} />
        <Route path="/case-suggestions" element={<CaseSuggestionsPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
      </Route>
    </Routes>
  );
}
