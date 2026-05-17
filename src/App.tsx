import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/Layout";
import { ControlCenterPage } from "./features/control-center/ControlCenterPage";
import { CameraRecommendationsPage } from "./pages/CameraRecommendationsPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { CaseSuggestionDetailPage } from "./pages/CaseSuggestionDetailPage";
import { CaseSuggestionsPage } from "./pages/CaseSuggestionsPage";
import { CasesPage } from "./pages/CasesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ManualReviewDetailPage } from "./pages/ManualReviewDetailPage";
import { ManualReviewsPage } from "./pages/ManualReviewsPage";
import { MyWorkPage } from "./pages/MyWorkPage";
import { TimelineEventDetailPage } from "./pages/TimelineEventDetailPage";
import { TimelinePage } from "./pages/TimelinePage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/control-center" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/control-center" element={<ControlCenterPage />} />
          <Route path="/my-work" element={<MyWorkPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:caseId" element={<CaseDetailPage />} />
          <Route path="/manual-reviews" element={<ManualReviewsPage />} />
          <Route path="/manual-reviews/:reviewId" element={<ManualReviewDetailPage />} />
          <Route path="/camera-recommendations" element={<CameraRecommendationsPage />} />
          <Route path="/case-suggestions" element={<CaseSuggestionsPage />} />
          <Route path="/case-suggestions/:suggestionId" element={<CaseSuggestionDetailPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/timeline/:sourceEventId" element={<TimelineEventDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/control-center" replace />} />
    </Routes>
  );
}
