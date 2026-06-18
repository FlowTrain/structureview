import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StructureView } from './pages/StructureView';
import { Login } from './pages/Login';
import './styles/flowtrain.css';
import './styles/tokens.css'; // @trainyard/ui token bridge — must load after flowtrain.css

// HashRouter (not BrowserRouter) so routing works under the file:// protocol when the
// built app is loaded by Electron. The desktop app opens straight to StructureView.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<StructureView />} />
        <Route path="/structureview" element={<StructureView />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);
