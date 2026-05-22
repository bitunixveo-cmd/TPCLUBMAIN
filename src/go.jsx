import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GoPage from './pages/go.jsx';
import { initTracking } from './utils/tracking.js';

initTracking();

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/go" element={<GoPage />} />
      <Route path="*" element={<GoPage />} />
    </Routes>
  </BrowserRouter>
);
