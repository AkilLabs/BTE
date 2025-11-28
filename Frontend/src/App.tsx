import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserHome from './pages/user/UserHome';
import Auth from './pages/common/Auth';
import Signup from './pages/common/Signup';
import Login from './pages/common/Login';
import ForgotPassword from './pages/common/ForgotPassword';
import OtpVerification from './pages/common/OtpVerification';
import NewPassword from './pages/common/NewPassword';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<UserHome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/new-password" element={<NewPassword />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
