import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import UserHome from './pages/user/UserHome';
import Movies from './pages/user/Movies';
import MovieDetails from './pages/user/MovieDetails';
import Auth from './pages/common/Auth';
import Signup from './pages/common/Signup';
import Login from './pages/common/Login';
import ForgotPassword from './pages/common/ForgotPassword';
import OtpVerification from './pages/common/OtpVerification';
import NewPassword from './pages/common/NewPassword';
import AboutUs from './pages/user/AboutUs';
import AdminDashboard from './pages/admin/Dashboard';
import NewMovie from './pages/admin/NewMovie';
import TicketManagement from './pages/admin/TicketManagement';
import AdminProfile from './pages/admin/AdminProfile';
import MovieManagement from './pages/admin/MovieManagement';
import UserProfile from './pages/user/UserProfile';
import PublishShows from './pages/admin/PublishShow';
import Screen1 from './pages/common/Screen1';
import Screen2 from './pages/common/Screen2';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<UserHome />} />
            <Route path="/user-home" element={<UserHome />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:movieId" element={<MovieDetails />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp-verification" element={<OtpVerification />} />
            <Route path="/new-password" element={<NewPassword />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/booking/:movieId/layout-1" element={<Screen1 />} />
            <Route path="/select-seat-2" element={<Screen2 />} />
            
            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-dashboard/new-movie" element={<NewMovie />} />
            <Route path="/admin-dashboard/movie-management" element={<MovieManagement />} />
            <Route path="/admin-dashboard/ticket-management" element={<TicketManagement />} />
            <Route path="/admin-dashboard/profile" element={<AdminProfile />} />
            <Route path="/admin-dashboard/movie-management/:movieId" element={<PublishShows />} />
          </Routes>
          <ToastContainer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
