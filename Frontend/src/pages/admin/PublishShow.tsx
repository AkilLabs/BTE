import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';
import { useUser } from '../../hooks/useUser';

export default function PublishShowAndScreens() {
  const { movieId } = useParams();

  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);

  const [schedule, setSchedule] = useState<{
    [date: string]: { [time: string]: string[] };
  }>({});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState<any | null>(null);
  const [editingTarget, setEditingTarget] = useState<{ date: string; time: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; date?: string; time?: string }>({ open: false });
  const { user, loading: userLoading } = useUser();

  const getAuthToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|; )jwt=([^;]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
    try {
      const t = localStorage.getItem('jwt');
      if (t) return t;
    } catch (e) {}
    return null;
  };

  const toggleScreen = (screen: string) => {
    setSelectedScreens((prev) =>
      prev.includes(screen) ? prev.filter((x) => x !== screen) : [...prev, screen]
    );
  };

  const addShowtime = () => {
    if (!dateInput || !timeInput || selectedScreens.length === 0) {
      setMessage("Please select date, time, and at least one screen.");
      return;
    }

    // If editing an existing showtime, call the backend update endpoint to persist single entry
    if (editingTarget && movieId) {
      (async () => {
        try {
          setLoading(true);
          const token = getAuthToken();
          const res = await fetch(`http://127.0.0.1:8000/api/admin/movies/${movieId}/publish-schedule/update/`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ date: dateInput, time: timeInput, screens: selectedScreens }),
          });
          if (!res.ok) throw new Error('Failed to update showtime');
          const data = await res.json();
          setSchedule(data.schedule || {});
          setMessage('Showtime updated');
        } catch (err) {
          console.error(err);
          setMessage('Failed to update showtime');
        } finally {
          setLoading(false);
          setEditingTarget(null);
          setTimeInput('');
          setSelectedScreens([]);
        }
      })();
      return;
    }

    // Normal local add (will be sent when Publish All used)
    setSchedule((prev) => ({
      ...prev,
      [dateInput]: {
        ...(prev[dateInput] || {}),
        [timeInput]: selectedScreens,
      },
    }));

    setTimeInput("");
    setSelectedScreens([]);
    setMessage("");
    setEditingTarget(null);
  };

  const publishData = async () => {
    if (Object.keys(schedule).length === 0) {
      setMessage("Please add show schedule first.");
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.post(
        `http://localhost:8000/api/admin/movies/${movieId}/publish-schedule/`,
        { schedule },
        { withCredentials: true, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );

      setMessage("Showtimes & screens published successfully!");
      console.log(response.data);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.error || "Failed to publish schedule.");
    } finally {
      setLoading(false);
    }
  };

  // format date for display
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch (e) {
      return d;
    }
  };

  // Fetch movie details (and load existing schedule if present)
  useEffect(() => {
    const fetchMovie = async () => {
      if (!movieId) return;
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/get-movie/${movieId}/`);
        if (!res.ok) throw new Error('Failed to fetch movie');
        const data = await res.json();
        setMovie(data.movie || null);
        // populate schedule from existing show_schedule if present
        if (data?.movie?.show_schedule) {
          setSchedule(data.movie.show_schedule);
        }
      } catch (err) {
        console.error('Failed to load movie:', err);
      }
    };

    fetchMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const removeShowtime = (date: string, time: string) => {
    // open confirmation modal first
    setConfirmRemove({ open: true, date, time });
  };

  const doRemoveConfirmed = async () => {
    const { date, time } = confirmRemove as any;
    if (!date || !time) {
      setConfirmRemove({ open: false });
      return;
    }

    // If movieId exists and user is admin, call backend delete endpoint
    if (movieId) {
      try {
        setLoading(true);
        const token = getAuthToken();
        const res = await fetch(`http://127.0.0.1:8000/api/admin/movies/${movieId}/publish-schedule/delete/`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ date, time }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to delete showtime');
        }
        const data = await res.json();
        setSchedule(data.schedule || {});
        setMessage('Showtime deleted');
      } catch (err) {
        console.error(err);
        setMessage('Failed to delete showtime');
      } finally {
        setLoading(false);
        setConfirmRemove({ open: false });
      }
      return;
    }

    // Fallback: update local state
    setSchedule((prev) => {
      const copy = { ...prev };
      if (!copy[date]) return prev;
      const times = { ...copy[date] };
      delete times[time];
      if (Object.keys(times).length === 0) {
        delete copy[date];
      } else {
        copy[date] = times;
      }
      return copy;
    });
    setConfirmRemove({ open: false });
  };

  const editShowtime = (date: string, time: string) => {
    const screens = (schedule[date] && schedule[date][time]) || [];
    // remove existing entry and set inputs for editing
    // removeShowtime opens confirm; here we want immediate local remove for edit flow
    setSchedule((prev) => {
      const copy = { ...prev };
      if (!copy[date]) return prev;
      const times = { ...copy[date] };
      delete times[time];
      if (Object.keys(times).length === 0) {
        delete copy[date];
      } else {
        copy[date] = times;
      }
      return copy;
    });
    setDateInput(date);
    setTimeInput(time);
    setSelectedScreens([...screens]);
    setEditingTarget({ date, time });
  };

  const formatTime12 = (time24: string) => {
    if (!time24) return time24;
    const [hStr, m] = time24.split(":");
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  // disable past dates: YYYY-MM-DD
  const todayYMD = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 md:pt-24 pb-24 md:pb-8">
        {/* Admin access enforcement */}
        {userLoading ? (
          <div className="py-24 text-center text-slate-400">Loading profile...</div>
        ) : user?.role !== 'admin' ? (
          <div className="py-24 text-center">
            <div className="bg-white/20 border border-white/15 rounded-xl p-8">
              <h2 className="text-lg font-semibold">Admin access required</h2>
              <p className="text-sm text-slate-400 mt-2">You need an admin account to manage show schedules.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Publish Showtimes & Screens</h1>
              <p className="text-slate-400">{movie?.title || 'Loading movie...'}</p>
            </div>

            <div className="space-y-6">
              {/* Movie Banner Display */}
              {movie?.banner_url && (
                <div>
                  <label className="block text-white text-sm font-semibold mb-3">Movie Banner:</label>
                  <div
                    className="relative w-full"
                    style={{ aspectRatio: '16 / 9' }}
                  >
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <img
                        src={movie.banner_url || movie.image_url}
                        alt={movie.title || 'Movie banner'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border border-white/20 pointer-events-none rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              {/* Editing Notice */}
              {editingTarget && (
                <div className="bg-white/20 border border-white/15 rounded-lg p-4 flex items-center justify-between">
                  <div className="text-sm">
                    Editing show from <span className="font-semibold text-yellow-400">{formatDate(editingTarget.date)}</span> at <span className="font-semibold text-yellow-400">{formatTime12(editingTarget.time)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTarget(null);
                      setDateInput('');
                      setTimeInput('');
                      setSelectedScreens([]);
                    }}
                    className="px-8 py-2.5 bg-white/20 hover:bg-white/30 border border-white/15 rounded-lg transition text-sm font-semibold"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}

              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white text-sm font-semibold mb-3">Select Date:</label>
                  <input
                    type="date"
                    value={dateInput}
                    min={todayYMD}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-semibold mb-3">Select Showtime:</label>
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                  />
                </div>
              </div>

              {/* Screen Selection */}
              <div>
                <label className="block text-white text-sm font-semibold mb-3">Select Screens:</label>
                <div className="flex flex-wrap gap-3">
                  {["S1", "S2", "S3", "S4"].map((screen) => (
                    <button
                      key={screen}
                      type="button"
                      onClick={() => toggleScreen(screen)}
                      className={`px-8 py-2.5 rounded-lg border transition text-sm font-semibold ${
                        selectedScreens.includes(screen)
                          ? 'bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500'
                          : 'bg-white/20 border-white/15 text-white hover:bg-white/30'
                      }`}
                    >
                      {screen}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Button */}
              <div>
                <button
                  onClick={addShowtime}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 border border-white/15 text-white font-semibold rounded-lg px-8 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTarget ? 'Update Showtime' : 'Add Showtime'}
                </button>
              </div>

              {/* Schedule Preview */}
              <div>
                <h2 className="text-white text-xl font-semibold mb-4">Show Schedule</h2>

                {Object.keys(schedule).length === 0 ? (
                  <div className="py-12 text-center bg-white/20 border border-white/15 rounded-xl">
                    <p className="text-slate-400">No showtimes added yet. Add your first showtime above.</p>
                  </div>
                ) : (
                  <div className="bg-white/20 border border-white/15 rounded-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/10">
                      <div className="col-span-3 text-sm font-semibold text-slate-300 uppercase tracking-wider">Date</div>
                      <div className="col-span-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">Time</div>
                      <div className="col-span-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Screens</div>
                      <div className="col-span-3 text-sm font-semibold text-slate-300 uppercase tracking-wider text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-white/10">
                      {Object.entries(schedule).map(([date, times]) => (
                        Object.entries(times).map(([time, screens]) => (
                          <div key={`${date}-${time}`} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition">
                            <div className="col-span-3 flex items-center">
                              <span className="text-white font-medium">{formatDate(date)}</span>
                            </div>
                            <div className="col-span-2 flex items-center">
                              <span className="text-yellow-400 font-semibold">{formatTime12(time)}</span>
                            </div>
                            <div className="col-span-4 flex items-center">
                              <div className="flex flex-wrap gap-2">
                                {screens.map((screen) => (
                                  <span 
                                    key={screen}
                                    className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-md"
                                  >
                                    {screen}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="col-span-3 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => editShowtime(date, time)}
                                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 border border-white/15 rounded-lg transition text-xs font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeShowtime(date, time)}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-xs font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Publish Button */}
              <div className="pt-2">
                <button
                  onClick={publishData}
                  disabled={loading || Object.keys(schedule).length === 0}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg px-10 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Publishing...' : 'Publish All'}
                </button>
              </div>

              {/* Message Display */}
              {message && (
                <div className="text-center">
                  <div className="inline-block bg-white/20 border border-white/15 rounded-lg px-6 py-3">
                    <p className="text-sm font-medium text-white">{message}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Confirm Remove Modal */}
      {confirmRemove.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-gradient-to-b from-slate-900 to-black border border-white/20 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Confirm Removal</h3>
              <p className="text-sm text-slate-400 mt-1">This action cannot be undone</p>
            </div>
            <div className="p-6">
              <p className="text-white">
                Are you sure you want to remove the showtime for{' '}
                <span className="font-semibold text-yellow-400">{confirmRemove.date ? formatDate(confirmRemove.date) : ''}</span> at{' '}
                <span className="font-semibold text-yellow-400">{confirmRemove.time ? formatTime12(confirmRemove.time) : ''}</span>?
              </p>
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmRemove({ open: false })} 
                className="px-8 py-2.5 bg-white/20 hover:bg-white/30 border border-white/15 rounded-lg transition font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={doRemoveConfirmed} 
                className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNavigation />
    </div>
  );
}
