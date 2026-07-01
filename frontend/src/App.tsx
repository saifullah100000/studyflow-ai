import { Route, Routes } from "react-router";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import GenerateNotesPage from "./pages/GenerateNotesPage";
import LoginPage from "./pages/LoginPage";
import NotesPage from "./pages/NotesPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import NoteDetailsPage from "./pages/NoteDetailsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route index element={<DashboardPage />} />

    <Route
      path="generate"
      element={<GenerateNotesPage />}
    />

    <Route path="notes" element={<NotesPage />} />

    <Route
      path="notes/:id"
      element={<NoteDetailsPage />}
    />
  </Route>
</Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="*" element={<NotFoundPage />} />
      
    </Routes>
  );
}