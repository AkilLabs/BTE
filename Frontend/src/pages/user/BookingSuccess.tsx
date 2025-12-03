import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';
import ConfirmIcon from '../../assets/confirm.png';

export default function BookingSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <UserNavbar />

      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-7xl bg-[#1a1a1a] border border-white/10 rounded-3xl p-24 sm:p-24 text-center shadow-[0_25px_60px_rgba(0,0,0,0.45)]">
          <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)] mb-6">
            <img src={ConfirmIcon} alt="Booking confirmed" className="w-24 h-24 sm:w-32 sm:h-32" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Thanks for booking !</h1>
          <p className="text-slate-300 text-sm sm:text-base mb-10">
            The team will contact you soon after verification of payment done.
          </p>

          <div className="flex flex-col sm:flex-row gap-14 justify-center">
            <button
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition text-sm sm:text-base"
            >
              My Bookings
            </button>
            <button
              onClick={() => navigate('/movies')}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition text-sm sm:text-base"
            >
              Explore Others -&gt;
            </button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
