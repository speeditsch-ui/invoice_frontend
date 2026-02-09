import { Routes, Route, Navigate } from "react-router-dom";
import DocumentsPage from "./pages/DocumentsPage";
import ViewerPage from "./pages/ViewerPage";

function App() {
  return (
    <Routes>
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/documents/:id" element={<ViewerPage />} />
      <Route path="*" element={<Navigate to="/documents" replace />} />
    </Routes>
  );
}

export default App;
