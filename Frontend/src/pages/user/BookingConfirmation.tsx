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
  banner_url?: string;
  release_date: string;
  director?: string;
  ticket_price?: number;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [theaterLocation, setTheaterLocation] = useState<string>('Vincom Ocean Park CGV');
  const [userEmail, setUserEmail] = useState<string>('User Address');

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
    const storedEmail = localStorage.getItem('userEmail');
    
    if (storedShowDetails) {
      setShowDetails(JSON.parse(storedShowDetails));
      const showDetailsData = JSON.parse(storedShowDetails);
      if (showDetailsData.screen) {
        setTheaterLocation(showDetailsData.screen);
      }
    }
    
    if (storedSeats) {
      setSelectedSeats(JSON.parse(storedSeats));
    }

    if (storedEmail) {
      setUserEmail(storedEmail);
    }

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  const ticketPrice = showDetails?.price || movie?.ticket_price || 0;
  const totalPrice = contextTotalPrice > 0 ? contextTotalPrice : selectedSeats.length * ticketPrice;

  const handlePaymentSelect = (paymentMethod: string) => {
    setSelectedPayment(paymentMethod);
  };

  const getJwtFromCookie = () => {
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      ?.split('=')[1];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr = Array.from(files).slice(0, 5);
    setSelectedFiles(arr);
    // build previews
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    // any previous uploaded urls are not used; backend will upload during hold
  };

  const removePreview = (index: number) => {
    const f = selectedFiles.slice();
    const p = previews.slice();
    f.splice(index, 1);
    p.splice(index, 1);
    setSelectedFiles(f);
    setPreviews(p);
  };

  // Note: uploads will be performed by the backend when the hold API is called (multipart form)

  const handleContinue = async () => {
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }

    try {
      // We'll include any selected files in the same hold request (multipart/form-data)
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

      // Call the hold API. If files selected, send multipart/form-data with files under 'screens'.
      let response;
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('date', showDetails?.date || '');
        formData.append('screen_id', showDetails?.screen || '');
        // append seats as JSON string
        formData.append('seatIds', JSON.stringify(selectedSeats));
        if (userId) formData.append('user_id', userId);
        formData.append('flow', 'seat');
        selectedFiles.forEach((f) => formData.append('screens', f));

        response = await fetch(`http://localhost:8000/api/shows/${movieId}/${showDetails?.time}/hold/`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: userId ? { Authorization: `Bearer ${getJwtFromCookie() || ''}` } : undefined,
        });
      } else {
        // JSON payload
        const payload = {
          date: showDetails?.date,
          screen_id: showDetails?.screen,
          seatIds: selectedSeats,
          user_id: userId,
          flow: 'seat',
        };

        response = await fetch(
          `http://localhost:8000/api/shows/${movieId}/${showDetails?.time}/hold/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );
      }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Movie Card */}
        {movie && (
          <div className="rounded-2xl border border-white/15 bg-[#1c1c1c] p-6 mb-8 overflow-hidden flex flex-col sm:flex-row gap-6">
            {/* Poster */}
            <div className="w-40 h-56 flex-shrink-0">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover rounded-lg border border-white/20"
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4 text-white">{movie.title}</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4.5-1a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V5.75a.75.75 0 00-.75-.75h-.008z"/></svg>
                  <span className="text-sm text-slate-300">{movie.genre}</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.5 1.5H5.75A2.75 2.75 0 003 4.25v11A2.75 2.75 0 005.75 18h8.5A2.75 2.75 0 0017 15.25v-11A2.75 2.75 0 0014.25 1.5zm-1 2.5a.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5a.75.75 0 00-.75-.75z"/></svg>
                  <span className="text-sm text-slate-300">{theaterLocation}</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v3.26l-2.03-1.97a.75.75 0 00-1.06 1.06l4 3.86a.75.75 0 00.53.22.75.75 0 00.53-.22l4-3.86a.75.75 0 10-1.06-1.06L10.75 8.26V5z"/></svg>
                  <span className="text-sm text-slate-300">
                    {showDetails && `${showDetails.date} • ${showDetails.time}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 bg-[#1c1c1c] rounded-lg p-6">
          <div>
            <p className="text-slate-500 text-xs font-medium mb-2">Seat No(s)</p>
            <p className="text-base font-semibold text-white">{selectedSeats.join(', ') || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium mb-2">Billing address</p>
            <p className="text-base font-semibold text-white truncate">{userEmail}</p>
          </div>
          <div className="md:text-right">
            <p className="text-slate-500 text-xs font-medium mb-2">Total Price (includes GST)</p>
            <p className="text-base font-semibold text-white">RS {totalPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-6 text-white">Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Bank Transfer Option 1 */}
            <button
              onClick={() => handlePaymentSelect('bank1')}
              className={`p-5 rounded-lg border-2 transition-all ${
                selectedPayment === 'bank1'
                  ? 'border-yellow-400 bg-yellow-400/15'
                  : 'border-slate-700 bg-[#1c1c1c] hover:border-slate-600'
              }`}
            >
              <svg className="w-8 h-8 mb-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
              <p className="text-xs font-semibold text-white">A/C no : 7681549944842</p>
              <p className="text-xs text-slate-400 mt-1">IFSC : SBIN03725</p>
            </button>

            {/* UPI Option */}
            <button
              onClick={() => handlePaymentSelect('upi')}
              className={`p-5 rounded-lg border-2 transition-all ${
                selectedPayment === 'upi'
                  ? 'border-yellow-400 bg-yellow-400/15'
                  : 'border-slate-700 bg-[#1c1c1c] hover:border-slate-600'
              }`}
            >
              <svg className="w-8 h-8 mb-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>
              <p className="text-xs font-semibold text-white">UPI ID : harlee@paytm</p>
            </button>

            {/* Bank Transfer Option 2 */}
            <button
              onClick={() => handlePaymentSelect('bank2')}
              className={`p-5 rounded-lg border-2 transition-all ${
                selectedPayment === 'bank2'
                  ? 'border-yellow-400 bg-yellow-400/15'
                  : 'border-slate-700 bg-[#1c1c1c] hover:border-slate-600'
              }`}
            >
              <svg className="w-8 h-8 mb-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
              <p className="text-xs font-semibold text-white">A/C no : 7681549944842</p>
              <p className="text-xs text-slate-400 mt-1">IFSC : SBIN03725</p>
            </button>
          </div>

          {/* Upload Screenshot */}
          <div className="mb-6">
            <label className="block text-slate-300 text-xs font-medium mb-2">Upload payment screenshot (1-5 images)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-300 file:bg-slate-800 file:border file:border-slate-700 file:rounded-md file:py-2 file:px-3"
            />

            {previews.length > 0 && (
              <div className="mt-3 flex gap-3 overflow-x-auto">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded overflow-hidden border border-white/10">
                    <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePreview(idx)}
                      className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 text-sm text-slate-300">
              {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'No files selected'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 border border-white/30 hover:border-white/50 text-white py-3 rounded-full font-semibold transition-all text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
