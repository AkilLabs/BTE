import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChevronLeft, Play } from 'lucide-react';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';

interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string;
  duration: string;
  release_date: string;
  language: string;
  rating: string;
  director: string;
  cast: string[];
  poster_url: string;
  image_url: string;
  banner_url: string;
  ticket_price: number;
  available_seats: number;
  show_times: string[];
  status: string;
  show_schedule?: any;
}

export default function MovieDetails() {
  const { movieId } = useParams<{ movieId: string }>();
  console.log("Movie ID:", movieId);
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // (schedule presence is checked inline where needed)

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:8000/api/get-movie/${movieId}/`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setMovie(data.movie);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch movie:', err);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  const handleContinue = () => {
    if (selectedScreen && selectedTime) {
      // Extract the screen number from selectedScreen
      const screenMatch = selectedScreen.match(/(\d+)/);
      const screenNum = screenMatch ? screenMatch[1] : null;
      
      if (screenNum === '1') {
        navigate(`/booking/${movieId}/layout-1`, {
          state: {
            screen: selectedScreen,
            time: selectedTime,
            movieTitle: movie?.title,
            price: movie?.ticket_price,
            date: selectedDate,
          },
        });
      } else {
        navigate(`/booking/${movieId}`, {
          state: {
            screen: selectedScreen,
            time: selectedTime,
            movieTitle: movie?.title,
            price: movie?.ticket_price,
            date: selectedDate,
          },
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-slate-400">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">{error || 'Movie not found'}</p>
      </div>
    );
  }

  const genreArray = movie.genre.split(',').map(g => g.trim()).join(', ');
  const languageArray = movie.language.split(',').map(l => l.trim()).join(', ');

  const formatScreenName = (screenId: string) => {
    if (!screenId) return screenId;
    // Normalize and extract digits (e.g., 'S1' or 's2' -> '01', '02')
    const match = screenId.match(/(\d+)/);
    if (match) {
      const num = match[1].padStart(2, '0');
      return `Screen ${num}`;
    }
    return screenId;
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-8">
      {/* Header */}
      <div className="relative">
        {/* Banner Image */}
        <div className="relative w-full h-64 sm:h-80 md:h-96">
          <img 
            src={movie.banner_url || movie.image_url} 
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
          
          {/* Back Button */}
          <button
            onClick={() => {
              try {
                // Prefer navigating back if there is a history entry
                if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
                  navigate(-1);
                } else {
                  // Fallback to movies listing when no meaningful history
                  navigate('/movies');
                }
              } catch (err) {
                navigate('/movies');
              }
            }}
            className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full transition duration-200"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>

          {/* Play Button (optional)
          <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black p-4 rounded-full transition duration-200">
            <Play size={32} fill="currentColor" />
          </button> */}
        </div>

        {/* Movie Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 md:px-8 pb-4 md:pb-6">
          <div 
                className="backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/10"
                style={{ backgroundColor: '#1c1c1c' }}
            >
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold mb-1">{movie.title}</h1>
            <p className="text-slate-400 text-xs md:text-sm mb-3">
              {movie.duration}m • {new Date(movie.release_date).toLocaleDateString('en-US', { month: 'numeric', year: 'numeric' })}
            </p>
            
            {/* Rating Section */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs md:text-sm text-slate-400">Review</span>
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-base md:text-lg">★</span>
                ))}
                <span className="text-slate-600 text-base md:text-lg">★</span>
              </div>
              <span className="text-xs md:text-sm text-slate-400">5 (1,222)</span>
            </div>

            {/* Watch Trailer Button */}
            {/* <button className="border border-white/30 hover:border-white/50 text-white px-4 py-2 rounded-md text-xs md:text-sm font-medium flex items-center gap-2 transition duration-200">
              <span>▶</span> Watch trailer
            </button> */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">

        {/* Movie Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 py-6 border-slate-700">
          <div>
            <p className="text-slate-400 text-xs md:text-sm mb-1">
              Movie genre: <span className="text-sm md:text-base font-medium text-white pl-1">{genreArray}</span>
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs md:text-sm mb-1">
              Censorship: <span className="text-sm md:text-base font-medium text-white pl-1">{movie.rating}</span>
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs md:text-sm mb-1">
              Language: <span className="text-sm md:text-base font-medium text-white pl-1">{languageArray}</span>
            </p>
          </div>
        </div>

        {/* Storyline */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-3">Storyline</h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            {movie.description}
          </p>
          <button className="text-yellow-400 text-sm font-semibold hover:text-yellow-500 mt-2">
            See more
          </button>
        </div>

        {/* Director */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Director</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-bold text-lg">{movie.director.charAt(0)}</span>
            </div>
            <span className="text-base md:text-lg font-semibold">{movie.director}</span>
          </div>
        </div>

        {/* Cast */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Cast</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {movie.cast && movie.cast.length > 0 ? (
              movie.cast.map((castName, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center mb-2 border border-slate-600">
                    <span className="text-white font-bold text-lg">{castName.charAt(0)}</span>
                  </div>
                  <p className="text-white text-xs md:text-sm font-semibold text-center mb-2 truncate w-full">{castName}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 col-span-full text-center">No cast information available</p>
            )}
          </div>
        </div>

        {/* Shows / Schedule */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Available Shows</h2>

          {/* If no schedule -> show booking soon message */}
          {!(movie as any).show_schedule || Object.keys((movie as any).show_schedule).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-400">Booking will be open soon</p>
            </div>
          ) : (
            <>
              {/* Date selector */}
              <div className="mb-4 flex gap-2 flex-wrap">
                {Object.keys((movie as any).show_schedule).map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      setSelectedScreen(null);
                    }}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition ${
                      selectedDate === date ? 'bg-yellow-400 text-black' : 'bg-white/8 text-white border border-white/15'
                    }`}
                  >
                    {new Date(date).toLocaleDateString()}
                  </button>
                ))}
              </div>

              {/* If a date is selected, show times first, then screens for the chosen time */}
              {selectedDate ? (
                <>
                  {/* Times for date */}
                  <div className="mb-6">
                    <h3 className="text-sm text-slate-400 mb-2">Times</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                      {Object.keys((movie as any).show_schedule[selectedDate] || {}).map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setSelectedTime(time);
                            setSelectedScreen(null);
                          }}
                          className={`py-2 px-3 md:py-3 md:px-4 rounded-lg text-xs md:text-sm font-medium border transition duration-200 ${
                            selectedTime === time
                              ? 'bg-yellow-400 text-black border-yellow-400'
                              : 'bg-black border-slate-600 text-white hover:border-slate-500'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Screens for selected time */}
                  {selectedTime ? (
                    <div className="mb-6">
                      <h3 className="text-sm text-slate-400 mb-2">Screens</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {((movie as any).show_schedule[selectedDate][selectedTime] || []).map((screenId: string) => (
                          <button
                            key={screenId}
                            onClick={() => setSelectedScreen(screenId)}
                            className={`p-3 rounded-lg border transition text-left ${
                              selectedScreen === screenId
                                ? 'border-yellow-400 bg-yellow-400/10'
                                : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                            }`}
                          >
                            <p className="font-semibold">{formatScreenName(screenId)}</p>
                            <p className="text-slate-400 text-xs">Seats: {movie.available_seats ?? '—'}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-slate-400">Select a time to view available screens</div>
                  )}
                </>
              ) : (
                <div className="py-4 text-slate-400">Select a date to view available times and screens</div>
              )}
            </>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedScreen || !selectedTime}
            className={`w-full md:w-64 py-3 md:py-4 rounded-full font-bold text-base md:text-lg transition duration-200 ${
              selectedScreen && selectedTime
                ? 'bg-yellow-400 text-black hover:bg-yellow-500 cursor-pointer'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            Continue
          </button>
        </div>
      </div>

      <UserNavbar />
      <BottomNavigation />
    </div>
  );
}
