import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import UserHome from './pages/user/UserHome';
import Movies from './pages/user/Movies';
import Auth from './pages/common/Auth';
import Signup from './pages/common/Signup';
import Login from './pages/common/Login';
import ForgotPassword from './pages/common/ForgotPassword';
import OtpVerification from './pages/common/OtpVerification';
import NewPassword from './pages/common/NewPassword';
import AboutUs from './pages/user/AboutUs';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<UserHome />} />
            <Route path="/user-home" element={<UserHome />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp-verification" element={<OtpVerification />} />
            <Route path="/new-password" element={<NewPassword />} />
            <Route path="/about-us" element={<AboutUs />} />
          </Routes>
          <ToastContainer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
