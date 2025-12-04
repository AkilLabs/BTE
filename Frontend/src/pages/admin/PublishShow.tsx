import { useState, useEffect, useMemo } from "react";
import { Edit3, Trash2, X } from 'lucide-react';
import axios from "axios";
import { useParams } from "react-router-dom";
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';
import { useUser } from '../../hooks/useUser';

type ScheduleData = { [date: string]: { [time: string]: string[] } };

const cloneSchedule = (input: ScheduleData): ScheduleData => JSON.parse(JSON.stringify(input || {}));

const areScreensEqual = (a: string[] = [], b: string[] = []) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((screen, index) => screen === sortedB[index]);
};

const isPublishedEntry = (
  snapshot: ScheduleData,
  date: string,
  time: string,
  screens: string[]
) => {
  const publishedScreens = snapshot?.[date]?.[time];
  if (!publishedScreens) return false;
  return areScreensEqual(publishedScreens, screens);
};

const removeEntry = (input: ScheduleData, date: string, time: string): ScheduleData => {
  if (!input?.[date]?.[time]) return input;
  const next: ScheduleData = { ...input };
  const times = { ...next[date] };
  delete times[time];
  if (Object.keys(times).length === 0) {
    delete next[date];
  } else {
    next[date] = times;
  }
  return next;
};

const LOCAL_STORAGE_PREFIX = 'draft-schedule-';

const getDraftStorageKey = (movieId?: string) => (movieId ? `${LOCAL_STORAGE_PREFIX}${movieId}` : null);

const hasScheduleEntries = (data: ScheduleData = {}) =>
  Object.values(data).some((times) => Object.keys(times || {}).length > 0);

const mergeSchedules = (base: ScheduleData = {}, overlay: ScheduleData = {}): ScheduleData => {
  const merged: ScheduleData = cloneSchedule(base);
  Object.entries(overlay).forEach(([date, times]) => {
    Object.entries(times || {}).forEach(([time, screens]) => {
      merged[date] = {
        ...(merged[date] || {}),
        [time]: Array.isArray(screens) ? [...screens] : [],
      };
    });
  });
  return merged;
};

const extractDrafts = (current: ScheduleData = {}, published: ScheduleData = {}): ScheduleData => {
  const drafts: ScheduleData = {};
  Object.entries(current).forEach(([date, times]) => {
    Object.entries(times || {}).forEach(([time, screens]) => {
      if (!isPublishedEntry(published, date, time, screens)) {
        drafts[date] = drafts[date] || {};
        drafts[date][time] = [...screens];
      }
    });
  });
  return drafts;
};

const loadDraftSchedule = (movieId?: string): ScheduleData => {
  if (typeof window === 'undefined') return {};
  const key = getDraftStorageKey(movieId);
  if (!key) return {};
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      return parsed as ScheduleData;
    }
  } catch (err) {
    console.error('Failed to load draft schedule', err);
  }
  return {};
};

export default function PublishShowAndScreens() {
  const { movieId } = useParams();

  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);

  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [publishedSchedule, setPublishedSchedule] = useState<ScheduleData>({});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState<any | null>(null);
  const [editingTarget, setEditingTarget] = useState<{ date: string; time: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; date?: string; time?: string }>({ open: false });
  const { user, loading: userLoading } = useUser();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const parsedGenres = useMemo(() => {
    const raw = movie?.genre;
    if (Array.isArray(raw)) {
      return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [];
  }, [movie?.genre]);

  useEffect(() => {
    if (!message) return;
    const timeoutId = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!movieId || typeof window === 'undefined') return;
    const key = getDraftStorageKey(movieId);
    if (!key) return;
    const drafts = extractDrafts(schedule, publishedSchedule);
    try {
      if (!hasScheduleEntries(drafts)) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(drafts));
      }
    } catch (err) {
      console.error('Failed to persist draft schedule', err);
    }
  }, [schedule, publishedSchedule, movieId]);

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
          const res = await fetch(`https://backend.haaka.online/api/admin/movies/${movieId}/publish-schedule/update/`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ date: dateInput, time: timeInput, screens: selectedScreens }),
          });
          if (!res.ok) throw new Error('Failed to update showtime');
          const data = await res.json();
          setSchedule(cloneSchedule(data.schedule || {}));
          setPublishedSchedule(cloneSchedule(data.schedule || {}));
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
        `https://backend.haaka.online/api/admin/movies/${movieId}/publish-schedule/`,
        { schedule },
        { withCredentials: true, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );

      setMessage("Showtimes & screens published successfully!");
      console.log(response.data);
      setPublishedSchedule(cloneSchedule(schedule));
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
      const storedDrafts = loadDraftSchedule(movieId);
      try {
        const res = await fetch(`https://backend.haaka.online/api/get-movie/${movieId}/`);
        if (!res.ok) throw new Error('Failed to fetch movie');
        const data = await res.json();
        setMovie(data.movie || null);
        const remoteSchedule = cloneSchedule((data?.movie?.show_schedule as ScheduleData) || {});
        setPublishedSchedule(remoteSchedule);
        const mergedSchedule = mergeSchedules(remoteSchedule, storedDrafts);
        setSchedule(mergedSchedule);
      } catch (err) {
        console.error('Failed to load movie:', err);
        setPublishedSchedule({});
        if (hasScheduleEntries(storedDrafts)) {
          setSchedule(cloneSchedule(storedDrafts));
        } else {
          setSchedule({});
        }
      }
    };

    fetchMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const removeShowtime = (date: string, time: string) => {
    // open confirmation modal first
    setConfirmRemove({ open: true, date, time });
  };

  const removeLocalShowtime = (date: string, time: string) => {
    setSchedule((prev) => removeEntry(prev, date, time));
    if (editingTarget && editingTarget.date === date && editingTarget.time === time) {
      setEditingTarget(null);
      setDateInput('');
      setTimeInput('');
      setSelectedScreens([]);
    }
    setMessage('Draft showtime removed');
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
        const res = await fetch(`https://backend.haaka.online/api/admin/movies/${movieId}/publish-schedule/delete/`, {
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
        setSchedule(cloneSchedule(data.schedule || {}));
        setPublishedSchedule(cloneSchedule(data.schedule || {}));
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
    setSchedule((prev) => removeEntry(prev, date, time));
    setConfirmRemove({ open: false });
  };

  const editShowtime = (date: string, time: string) => {
    const screens = (schedule[date] && schedule[date][time]) || [];
    // remove existing entry and set inputs for editing
    // removeShowtime opens confirm; here we want immediate local remove for edit flow
    setSchedule((prev) => removeEntry(prev, date, time));
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

  const scheduleEntries = useMemo(() => {
    return Object.entries(schedule)
      .flatMap(([date, times]) =>
        Object.entries(times).map(([time, screens]) => ({ date, time, screens }))
      )
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [schedule]);

  const totalPages = Math.max(1, Math.ceil(scheduleEntries.length / ITEMS_PER_PAGE));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return scheduleEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [scheduleEntries, currentPage, ITEMS_PER_PAGE]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const hasShowtimes = scheduleEntries.length > 0;
  const hasDraftShowtimes = scheduleEntries.some(({ date, time, screens }) =>
    !isPublishedEntry(publishedSchedule, date, time, screens)
  );
  const canPublish = hasDraftShowtimes && !loading;

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:pt-24 pb-16 md:pb-6">
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
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Publish Showtimes & Screens</h1>
              <p className="text-slate-400 text-sm md:text-base">{movie?.title || 'Loading movie...'}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
              {/* Fixed Poster Section */}
              <div className="lg:w-5/12 lg:sticky lg:top-24 lg:self-start">
                <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden lg:max-h-[calc(100vh-160px)]">
                  <div
                    className="relative w-full mx-auto"
                    style={{ aspectRatio: '2 / 3', maxWidth: '280px' }}
                  >
                    {movie ? (
                      <>
                        <img
                          src={movie.poster_url || movie.banner_url || movie.image_url}
                          alt={movie.title || 'Movie poster'}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-slate-400 text-sm">
                        Loading poster...
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Now Scheduling</p>
                      <h2 className="text-xl font-bold text-white mt-1">{movie?.title || 'Loading movie...'}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                      {parsedGenres.map((g) => (
                        <span key={g} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/90">
                          {g}
                        </span>
                      ))}
                    </div>
                    {movie?.duration && (
                      <p className="text-xs text-slate-300">Duration: <span className="text-white font-semibold">{movie.duration} mins</span></p>
                    )}
                    {movie?.language && (
                      <p className="text-xs text-slate-300">Language: <span className="text-white font-semibold">{movie.language}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Section */}
              <div className="flex-1 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto">
                <div className="space-y-4 pr-1 lg:pr-3">
                  {/* Editing Notice */}
                  {editingTarget && (
                    <div className="bg-white/20 border border-white/15 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex flex-wrap gap-2.5">
                      {["S1", "S2", "S3", "S4"].map((screen) => (
                        <button
                          key={screen}
                          type="button"
                          onClick={() => toggleScreen(screen)}
                          className={`px-6 py-2 rounded-lg border transition text-sm font-semibold ${
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
                      className="bg-white/20 hover:bg-white/30 border border-white/15 text-white font-semibold rounded-lg px-6 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingTarget ? 'Update Showtime' : 'Add Showtime'}
                    </button>
                  </div>

                  {/* Schedule Preview */}
                  <div>
                    <h2 className="text-white text-lg font-semibold mb-3">Show Schedule</h2>

                    {!hasShowtimes ? (
                      <div className="py-8 text-center bg-white/20 border border-white/15 rounded-xl">
                        <p className="text-slate-400">No showtimes added yet. Add your first showtime above.</p>
                      </div>
                    ) : (
                      <div className="bg-white/20 border border-white/15 rounded-xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-white/10 text-sm">
                          <div className="col-span-3 text-sm font-semibold text-slate-300 uppercase tracking-wider">Date</div>
                          <div className="col-span-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">Time</div>
                          <div className="col-span-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Screens</div>
                          <div className="col-span-3 text-sm font-semibold text-slate-300 uppercase tracking-wider text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-white/10 text-sm">
                          {paginatedEntries.map(({ date, time, screens }) => (
                            <div key={`${date}-${time}`} className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-white/5 transition">
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
                                  className="p-2 bg-white/15 hover:bg-white/25 border border-white/15 rounded-lg transition"
                                  aria-label="Edit showtime"
                                >
                                  <Edit3 className="w-4 h-4 text-white" />
                                </button>
                                {isPublishedEntry(publishedSchedule, date, time, screens) ? (
                                  <button
                                    type="button"
                                    onClick={() => removeShowtime(date, time)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                    aria-label="Remove published showtime"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => removeLocalShowtime(date, time)}
                                    className="p-2 bg-white/15 hover:bg-white/25 border border-white/15 rounded-lg transition"
                                    aria-label="Remove draft showtime"
                                  >
                                    <X className="w-4 h-4 text-white" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {scheduleEntries.length >= ITEMS_PER_PAGE && (
                          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-xs text-slate-300">
                            <span>Page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-white/15 rounded-md disabled:opacity-40"
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-white/15 rounded-md disabled:opacity-40"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Publish Button */}
                  <div className="pt-1 space-y-1">
                    {hasDraftShowtimes ? (
                      <button
                        type="button"
                        onClick={publishData}
                        disabled={!canPublish}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg px-8 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Publishing...' : 'Publish All'}
                      </button>
                    ) : (
                      <p className="text-xs text-slate-400">
                        {hasShowtimes
                          ? 'All showtimes are already published. Add or edit a showtime to enable publishing.'
                          : 'Add at least one showtime to enable publishing.'}
                      </p>
                    )}
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
              </div>
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
