import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film, MapPin, Clock } from 'lucide-react';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';
import { useBooking } from '../../context/BookingContext';
import BankIcon from '../../assets/Bank.png';
import UpiIcon from '../../assets/UPI.png';

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

const DEFAULT_TICKET_PRICE = 200;

const paymentOptions = [
  {
    id: 'bank1',
    title: 'Bank Transfer 1',
    icon: BankIcon,
    lines: ['A/C no : BOG-GE64BG0000000593960340', 'Name: Vignesh'],
  },
  {
    id: 'upi',
    title: 'UPI Payment',
    icon: UpiIcon,
    lines: ['UPI ID : 6384754292'],
  },
  {
    id: 'bank2',
    title: 'Bank Transfer 2',
    icon: BankIcon,
    lines: ['A/C no : TBC-GE13TB7438645068100064', 'Name: Vignesh'],
  },
];

export default function BookingConfirmation() {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const {
    totalPrice: contextTotalPrice,
    selectedSeats,
    showDetails,
    setSelectedSeats,
    setTotalPrice,
  } = useBooking();
  const [movie, setMovie] = useState<Movie | null>(null);
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
        const response = await fetch(`https://backend.haaka.online/api/get-movie/${movieId}/`);
        if (!response.ok) throw new Error('Failed to fetch movie');
        const data = await response.json();
        setMovie(data.movie);
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  useEffect(() => {
    if (showDetails?.screen) {
      setTheaterLocation(showDetails.screen);
    }
  }, [showDetails?.screen]);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  const ticketPrice = showDetails?.price || movie?.ticket_price || DEFAULT_TICKET_PRICE;
  const totalPrice = contextTotalPrice > 0 ? contextTotalPrice : selectedSeats.length * ticketPrice;

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch (error) {
      console.error('Clipboard API error:', error);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const extractValue = (line?: string) => {
    if (!line) return '';
    const parts = line.split(':');
    if (parts.length <= 1) return line.trim();
    return parts.slice(1).join(':').trim();
  };

  const handlePaymentSelect = (paymentMethod: string) => {
    setSelectedPayment(paymentMethod);
    const selection = paymentOptions.find((option) => option.id === paymentMethod);
    const copyText = extractValue(selection?.lines?.[0]);
    copyToClipboard(copyText);
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

    if (!showDetails) {
      alert('Missing show details. Please reselect your show.');
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

        response = await fetch(`https://backend.haaka.online/api/shows/${movieId}/${showDetails?.time}/hold/`, {
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
          `https://backend.haaka.online/api/shows/${movieId}/${showDetails?.time}/hold/`,
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
      setSelectedSeats([]);
      setTotalPrice(0);
      navigate('/booking/success');
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

  if (!showDetails || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-300 text-sm">Seat selection data has expired. Please reselect your show and seats.</p>
        <button
          type="button"
          onClick={() => navigate(`/movies/${movieId}`)}
          className="px-6 py-2 rounded-full border border-white/20 text-white hover:border-white/40 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <UserNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 pt-24">
        {/* Movie Card */}
       <div className="mb-4">
          <h1 className="text-white text-2xl font-bold">Booking Confirmation :</h1>
        </div>
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
                  <Film className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">{movie.genre}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">{theaterLocation}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
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
            {paymentOptions.map(({ id, title, icon, lines }) => (
              <button
                key={id}
                onClick={() => handlePaymentSelect(id)}
                className={`p-5 rounded-2xl border-2 transition-all bg-[#1c1c1c] min-h-[190px] flex flex-col items-center text-center gap-2 shadow-[0_0_0_rgba(250,204,21,0)] ${
                  selectedPayment === id
                    ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_35px_rgba(250,204,21,0.55)]'
                    : 'border-slate-700 hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(250,204,21,0.35)]'
                }`}
              >
                <img src={icon} alt={title} className="w-12 h-12 object-contain" />
                <p className="text-sm font-semibold text-white">{title}</p>
                {lines.map((line) => (
                  <p key={line} className="text-xs text-slate-300">
                    {line}
                  </p>
                ))}
              </button>
            ))}
          </div>

          {/* Upload Screenshot */}
          <div className="mb-6">
            <div className="w-full border-2 border-dashed border-yellow-400 rounded-2xl p-6 text-center">
              <label
                htmlFor="payment-upload"
                className="flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
              >
                <span className="text-sm font-semibold text-yellow-300">Upload payment screenshot</span>
                <span className="text-xs text-slate-400">Click or drop up to 5 images (jpg, png)</span>
                <input
                  id="payment-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

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
                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'No files selected yet'}
              </div>
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
