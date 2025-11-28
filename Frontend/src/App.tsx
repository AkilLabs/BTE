import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserHome from './pages/user/UserHome';
import Auth from './pages/common/Auth';
import Signup from './pages/common/Signup';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<UserHome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
