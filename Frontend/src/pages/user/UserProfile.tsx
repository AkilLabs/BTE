import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  Film,
  Mail,
  Phone,
  Ticket as TicketIcon,
  User as UserIcon,
  Wallet,
  KeyRound,
  ShieldCheck,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../context/ToastContext';
import { resetPassword } from '../../services/authService';

type TicketStatus = 'confirmed' | 'upcoming' | 'cancelled';

interface TicketItem {
  id: string;
  movieTitle: string;
  screen: string;
  seats: string[];
  showDate: string;
  showTime: string;
  totalPrice: number;
  status: TicketStatus;
  bookingId: string;
  poster: string;
}

const sampleTickets: TicketItem[] = [
  {
    id: '1',
    movieTitle: 'The Timewalker',
    screen: 'Screen 02',
    seats: ['C5', 'C6'],
    showDate: '2025-12-18',
    showTime: '06:30 PM',
    totalPrice: 540,
    status: 'confirmed',
    bookingId: 'BT-924582',
    poster: 'https://media-cache.cinematerial.com/p/500x/rim7jkfa/jana-nayagan-indian-movie-poster.jpg?v=1739966840',
  },
  {
    id: '2',
    movieTitle: 'Midnight Reverie',
    screen: 'Premium Lounge',
    seats: ['A1', 'A2', 'A3'],
    showDate: '2025-12-22',
    showTime: '09:45 PM',
    totalPrice: 810,
    status: 'upcoming',
    bookingId: 'BT-918204',
    poster: 'https://media-cache.cinematerial.com/p/500x/otee0vmo/idly-kadai-indian-movie-poster.jpg?v=1736470603',
  },
  {
    id: '3',
    movieTitle: 'Silk Route',
    screen: 'Screen 05',
    seats: ['H10'],
    showDate: '2025-11-02',
    showTime: '01:15 PM',
    totalPrice: 220,
    status: 'cancelled',
    bookingId: 'BT-887441',
    poster: 'https://media-cache.cinematerial.com/p/500x/fsrcfxma/sk25-indian-movie-poster.jpg?v=1738154160',
  },
];

const statusStyles: Record<TicketStatus, string> = {
  confirmed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  upcoming: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
  cancelled: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};

const statusLabels: Record<TicketStatus, string> = {
  confirmed: 'Confirmed',
  upcoming: 'Upcoming',
  cancelled: 'Cancelled',
};

const passwordRequirements = [
  'At least 8 characters long',
  'Use numbers, uppercase, and lowercase letters',
  'Avoid reusing old passwords',
];

function formatDate(value: string | null, fallback = 'Not available') {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useUser();
  const { showToast } = useToast();

  const [tickets] = useState<TicketItem[]>(sampleTickets);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone_number || '');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== 'cancelled'),
    [tickets]
  );

  const totalSpend = useMemo(
    () => tickets.reduce((acc, ticket) => acc + ticket.totalPrice, 0),
    [tickets]
  );

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.email) {
      showToast('Please sign in again to continue.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setSubmittingPassword(true);
      const result = await resetPassword(user.email, newPassword, confirmPassword);
      if (!result.success) {
        showToast(result.error || 'Unable to reset password right now.', 'error');
        return;
      }
      showToast('Password updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password reset failed:', error);
      showToast('Something went wrong. Please try again later.', 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <UserNavbar />
          <main className="px-3 sm:px-4 md:px-6 py-24 flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 border-4 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Preparing your profile...</p>
            </div>
          </main>
          <BottomNavigation />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <UserNavbar />
          <main className="px-3 sm:px-4 md:px-6 py-24 flex items-center justify-center">
            <div className="max-w-md w-full text-center border border-white/10 bg-white/5 rounded-3xl px-8 py-12 shadow-lg">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400">
                <UserIcon className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Sign in required</h2>
              <p className="text-slate-400 text-sm mb-6">
                Log back into your account to view personal details, tickets, and manage your security settings.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-full bg-yellow-400 text-black font-semibold py-3 hover:bg-yellow-500 transition"
              >
                Go to Login
              </button>
            </div>
          </main>
          <BottomNavigation />
        </div>
      </div>
    );
  }

  const memberSince = formatDate(user.created_at);
  const lastLogin = formatDate(user.last_login, 'Not recorded yet');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <UserNavbar />

        <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-8 sm:pb-24 md:pb-12 md:pt-32">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-black px-6 py-8 md:px-10 md:py-12 shadow-xl">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-yellow-400 via-yellow-300 to-yellow-500 text-3xl font-bold text-black shadow-2xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <p className="uppercase tracking-wider text-xs text-white/60">Welcome back</p>
                  {isEditing ? (
                    <div className="mt-2 space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-yellow-400/50 bg-black/40 px-4 py-2 text-3xl font-bold text-white placeholder-slate-500 outline-none focus:border-yellow-400"
                        placeholder="Enter your name"
                      />
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-lg border border-yellow-400/50 bg-black/40 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-yellow-400"
                        placeholder="Enter phone number (optional)"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            // Validate inputs
                            if (!editName.trim()) {
                              showToast('Name is required.', 'error');
                              return;
                            }

                            setIsSubmittingProfile(true);
                            try {
                              const response = await fetch(`${VITE_API_URL}/api/update_user_profile/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                  name: editName.trim(),
                                  phone_number: editPhone.trim(),
                                }),
                              });

                              const data = await response.json();

                              if (response.ok) {
                                showToast(data.message || 'Profile updated successfully!', 'success');
                                // Update user state with new data
                                if (data.profile) {
                                  Object.assign(user, data.profile);
                                }
                                setIsEditing(false);
                              } else {
                                showToast(data.error || 'Failed to update profile.', 'error');
                              }
                            } catch (error) {
                              console.error('Profile update error:', error);
                              showToast('An error occurred while updating profile.', 'error');
                            } finally {
                              setIsSubmittingProfile(false);
                            }
                          }}
                          disabled={isSubmittingProfile}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-3 py-2 text-sm font-medium hover:bg-emerald-500/30 transition disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          {isSubmittingProfile ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(user?.name || '');
                            setEditPhone(user?.phone_number || '');
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 px-3 py-2 text-sm font-medium hover:bg-rose-500/30 transition"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl sm:text-4xl font-bold mt-2">{user.name}</h1>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </span>
                        {user.phone_number ? (
                          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <Phone className="h-4 w-4" />
                            {user.phone_number}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setEditName(user?.name || '');
                          setEditPhone(user?.phone_number || '');
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-yellow-400/60 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/20 transition"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6 md:max-w-sm">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase text-white/50">Active Tickets</p>
                  <p className="text-3xl font-semibold mt-2">{activeTickets.length}</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-300">
                    <TicketIcon className="h-4 w-4" />
                    Ready for your next show
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase text-white/50">Lifetime Spend</p>
                  <p className="text-3xl font-semibold mt-2">{formatCurrency(totalSpend)}</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-yellow-300">
                    <Wallet className="h-4 w-4" />
                    Including taxes & fees
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-7 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">My Tickets</h2>
                  <p className="text-slate-400 text-sm mt-1">Monitor upcoming shows and revisit past bookings.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/movies')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-yellow-400/60 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/20 transition"
                >
                  <Film className="h-4 w-4" />
                  Book New Tickets
                </button>
              </div>

              {tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex flex-col md:flex-row gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/30"
                    >
                      <div className="h-28 w-full md:w-36 overflow-hidden rounded-xl border border-white/10">
                        <img src={ticket.poster} alt={ticket.movieTitle} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{ticket.movieTitle}</h3>
                            <p className="text-xs text-slate-400">Booking ID: {ticket.bookingId}</p>
                          </div>
                          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[ticket.status]}`}>
                            <ShieldCheck className="h-4 w-4" />
                            {statusLabels[ticket.status]}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-white/60" />
                            <span>{formatDate(ticket.showDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-white/60" />
                            <span>{ticket.showTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TicketIcon className="h-4 w-4 text-white/60" />
                            <span>{ticket.screen}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Seats: {ticket.seats.join(', ')}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Total: {formatCurrency(ticket.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-10 text-center">
                  <p className="text-sm text-slate-400">No tickets yet. Explore movies and book your first show!</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Account Activity</h2>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-white/70">
                      <CalendarDays className="h-4 w-4" />
                      Joined platform
                    </span>
                    <span>{memberSince}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-white/70">
                      <CalendarClock className="h-4 w-4" />
                      Last activity
                    </span>
                    <span>{lastLogin}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <KeyRound className="h-5 w-5 text-yellow-300" />
                  <h2 className="text-xl font-semibold">Reset Password</h2>
                </div>
                <p className="text-xs text-slate-400 mb-5">
                  Update your password regularly to keep your account secure. We recommend a unique passphrase that is easy for you to remember.
                </p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-2">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-yellow-400/60 focus:bg-black/40"
                      placeholder="Enter a strong password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-yellow-400/60 focus:bg-black/40"
                      placeholder="Re-enter the new password"
                    />
                  </div>

                  <ul className="space-y-1 text-xs text-slate-500">
                    {passwordRequirements.map((tip) => (
                      <li key={tip} className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-white/40" />
                        {tip}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="w-full rounded-full bg-yellow-400 py-3 text-sm font-semibold text-black transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
}
