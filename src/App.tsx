import { Routes, Route, NavLink } from 'react-router-dom';
import GaragePage from './pages/GaragePage';
import WinnersPage from './pages/WinnersPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* --- Simple nav bar --- */}
      <nav className="mb-6 flex gap-4 text-lg font-medium">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'text-blue-600 underline' : 'text-gray-700'
          }
        >
          Garage
        </NavLink>
        <NavLink
          to="/winners"
          className={({ isActive }) =>
            isActive ? 'text-blue-600 underline' : 'text-gray-700'
          }
        >
          Winners
        </NavLink>
      </nav>

      {/* --- Page routes --- */}
      <Routes>
        <Route path="/" element={<GaragePage />} />
        <Route path="/winners" element={<WinnersPage />} />
      </Routes>
    </div>
  );
}

export default App;

