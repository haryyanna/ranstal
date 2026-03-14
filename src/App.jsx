import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import CheckIn from './pages/CheckIn';
import Progress from './pages/Progress';
import AdminDatabase from './pages/AdminDatabase';
import BottomNav from './components/BottomNav';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Main Content Area */}
        <div className="content-area" style={{ paddingBottom: '70px' }}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/admin" element={<AdminDatabase />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>

        {/* Fixed Bottom Navigation (conditionally hidden on admin page usually, but we can just let it show or use a wrapper) */}
        <Routes>
          <Route path="/admin" element={null} />
          <Route path="*" element={<BottomNav />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
