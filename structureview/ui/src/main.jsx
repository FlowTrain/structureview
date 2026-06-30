import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StructureView } from './pages/StructureView';
import { Login } from './pages/Login';

// Lazy-loaded: the Spec Author pulls in TipTap/ProseMirror (~heavy). Code-splitting it keeps
// that weight out of the main StructureView bundle until the /author route is opened.
const SpecAuthor = lazy(() =>
  import('./pages/SpecAuthor').then((m) => ({ default: m.SpecAuthor }))
);
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
        <Route
          path="/author"
          element={
            <Suspense
              fallback={
                <div style={{ padding: 32, color: 'var(--txm)', fontFamily: 'var(--ff-display)' }}>
                  Loading editor…
                </div>
              }
            >
              <SpecAuthor />
            </Suspense>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);
