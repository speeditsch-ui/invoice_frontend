import { Routes, Route, Navigate } from "react-router-dom";
import InvoicesPage from "./pages/InvoicesPage";
import ViewerPage from "./pages/ViewerPage";
import SuppliersPage from "./pages/SuppliersPage";

function App() {
  return (
    <Routes>
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/suppliers" element={<SuppliersPage />} />
      <Route path="/viewer" element={<ViewerPage />} />
      <Route path="/viewer/:id" element={<ViewerPage />} />
      {/* Keep old routes working */}
      <Route path="/invoices/:id" element={<ViewerPage />} />
      <Route path="*" element={<Navigate to="/invoices" replace />} />
    </Routes>
  );
}

export default App;
