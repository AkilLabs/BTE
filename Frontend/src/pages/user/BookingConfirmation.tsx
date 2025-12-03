import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';
import { useBooking } from '../../context/BookingContext';

interface Movie {
  _id: string;
  title: string;
  genre: string;
  poster_url: string;
  release_date: string;
}

interface ShowDetails {
  date: string;
  time: string;
  screen: string;
  availableSeats: number;
  movieTitle: string;
  movieId: string;
  price: number;
}

export default function BookingConfirmation() {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { totalPrice: contextTotalPrice } = useBooking();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showDetails, setShowDetails] = useState<ShowDetails | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theaterLocation, setTheaterLocation] = useState<string>('Vincom Ocean Park CGV');

  useEffect(() => {
    // Fetch movie details
    const fetchMovie = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/get-movie/${movieId}/`);
        if (!response.ok) throw new Error('Failed to fetch movie');
        const data = await response.json();
        setMovie(data.movie);
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setLoading(false);
      }
    };

    // Get show details and selected seats from local storage
    const storedShowDetails = localStorage.getItem('selectedShowDetails');
    const storedSeats = localStorage.getItem('selectedSeats');
    
    if (storedShowDetails) {
      setShowDetails(JSON.parse(storedShowDetails));
    }
    
    if (storedSeats) {
      setSelectedSeats(JSON.parse(storedSeats));
    }

    if (storedShowDetails) {
      const showDetailsData = JSON.parse(storedShowDetails);
      setShowDetails(showDetailsData);
      // Extract screen from showDetailsData
      if (showDetailsData.screen) {
        setTheaterLocation(showDetailsData.screen);
      }
    }

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  const ticketPrice = showDetails?.price || 0;
  const totalPrice = contextTotalPrice > 0 ? contextTotalPrice : selectedSeats.length * ticketPrice;

  const handlePaymentSelect = (paymentMethod: string) => {
    setSelectedPayment(paymentMethod);
  };

  const handleContinue = async () => {
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }

    try {
      // Extract user_id from JWT token in cookies
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jwt='))
        ?.split('=')[1];

      let userId = undefined;

      if (cookieValue) {
        try {
          const payload = JSON.parse(atob(cookieValue.split('.')[1]));
          userId = payload.id;
        } catch (error) {
          console.error('Error decoding JWT:', error);
        }
      }

      // Prepare the payload for the hold API
      const payload = {
        date: showDetails?.date,
        screen_id: showDetails?.screen,
        seatIds: selectedSeats,
        user_id: userId,
        flow: 'seat',
      };

      // Call the hold API
      const response = await fetch(
        `http://localhost:8000/api/shows/${movieId}/${showDetails?.time}/hold/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Seats held successfully:', data);

      // Process payment here
      console.log('Processing payment with:', selectedPayment);
      alert('Booking confirmed! Payment processed.');
    } catch (error) {
      console.error('Error holding seats:', error);
      alert('Failed to complete booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <UserNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 mt-20">
        {/* Movie Card */}
        {movie && (
          <div className="rounded-2xl border border-white/10 bg-[#1c1c1c] p-6 mb-8 flex flex-col sm:flex-row gap-6">
            <div className="w-32 h-48 flex-shrink-0">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
              
              <div className="space-y-2 text-sm text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <span>🎬</span>
                  <span>{movie.genre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{theaterLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🕐</span>
                  <span>
                    {showDetails && `${showDetails.date} • ${showDetails.time}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-slate-400 text-sm mb-1">Seat No(s)</p>
            <p className="text-lg font-semibold">{selectedSeats.join(', ')}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Billing address</p>
            <p className="text-lg font-semibold">{localStorage.getItem('userEmail') || 'User Address'}</p>
          </div>
        </div>

        <div className="mb-8 text-right">
          <p className="text-slate-400 text-sm mb-1">Total Price (includes GST)</p>
          <p className="text-3xl font-bold text-white">RS {totalPrice.toFixed(2)}</p>
        </div>

        {/* Payment Method Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6">Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Bank Transfer Option 1 */}
            <button
              onClick={() => handlePaymentSelect('bank1')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedPayment === 'bank1'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-slate-600 bg-[#272727] hover:border-slate-500'
              }`}
            >
              <div className="text-4xl mb-3">🏛️</div>
              <p className="text-xs font-semibold">A/C no: 7681549944842</p>
              <p className="text-xs text-slate-400">IFSC : SBIN03725</p>
            </button>

            {/* UPI Option */}
            <button
              onClick={() => handlePaymentSelect('upi')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedPayment === 'upi'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-slate-600 bg-[#272727] hover:border-slate-500'
              }`}
            >
              <div className="text-4xl mb-3">🔷</div>
              <p className="text-xs font-semibold">UPI ID : harlee@paytm</p>
            </button>

            {/* Bank Transfer Option 2 */}
            <button
              onClick={() => handlePaymentSelect('bank2')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedPayment === 'bank2'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-slate-600 bg-[#272727] hover:border-slate-500'
              }`}
            >
              <div className="text-4xl mb-3">🏛️</div>
              <p className="text-xs font-semibold">A/C no: 7681549944842</p>
              <p className="text-xs text-slate-400">IFSC : SBIN03725</p>
            </button>
          </div>

          {/* Upload Screenshot */}
          <button className="w-full bg-[#272727] hover:bg-[#333333] border border-slate-600 text-white rounded-xl p-4 text-sm font-medium transition-all mb-6">
            📤 Upload your payment screenshot
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 border border-white/30 hover:border-white/50 text-white py-3 rounded-full font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedPayment}
          >
            Continue
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
