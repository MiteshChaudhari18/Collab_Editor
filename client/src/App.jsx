import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoomList from './components/RoomList';
import Editor from './components/Editor';
import JoinRoom from './components/JoinRoom';

function AppContent() {
  // Create a default guest user - no authentication required
  const defaultUser = {
    id: 'guest',
    name: 'Guest User',
    email: 'guest@example.com'
  };

  const handleLogout = () => {
    // No-op since there's no login
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<RoomList user={defaultUser} onLogout={handleLogout} />}
      />
      <Route
        path="/room/:id"
        element={<Editor user={defaultUser} onLogout={handleLogout} />}
      />
      <Route
        path="/join/:token"
        element={<JoinRoom user={defaultUser} onLogin={() => {}} />}
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

