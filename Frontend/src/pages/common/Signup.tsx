// Using JSX transform; no need to import React directly
import { useState } from 'react';
import { Link } from 'react-router-dom';
import BTlogo from '../../assets/BTlogo.png';
import { User, Mail, Eye, EyeOff, Lock, Phone, X, Check } from 'lucide-react';

export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password strength validation
  const hasMinLength = password.length >= 7;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordStrong = hasMinLength && hasNumber && hasSymbol;

  const getStrengthColor = () => {
    if (!password) return 'bg-slate-700';
    if (hasMinLength && hasNumber && hasSymbol && hasUpperCase && hasLowerCase) return 'bg-green-500';
    if (hasMinLength && hasNumber) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStrengthText = () => {
    if (!password) return '';
    if (hasMinLength && hasNumber && hasSymbol && hasUpperCase && hasLowerCase) return 'Strong';
    if (hasMinLength && hasNumber) return 'Medium';
    return 'Weak';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Top: logo on mobile */}
          <div className="md:hidden flex items-center justify-center mb-6">
            <img src={BTlogo} alt="BlackTicket" className="w-40" />
          </div>

          {/* Left: form */}
          <div className="w-full text-left order-2 md:order-1">
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight">Create an account & Book your tickets!</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">Join us to unlock exclusive movie deals and manage your bookings effortlessly.</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="Harlee"
                  defaultValue=""
                  name="name"
                  aria-label="name"
                />
              </div>

              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="harlee@gmail.com"
                  defaultValue=""
                  name="email"
                  type="email"
                  aria-label="email"
                />
              </div>

              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="********"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  aria-label="password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="text-slate-400 flex-shrink-0"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator - Only show when password field is focused */}
              {password && focusedField === 'password' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${getStrengthColor()}`} style={{ width: password.length > 0 ? '100%' : '0%' }} />
                    </div>
                    <span className={`text-xs font-semibold ${getStrengthColor() === 'bg-green-500' ? 'text-green-500' : getStrengthColor() === 'bg-yellow-500' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {getStrengthText()}
                    </span>
                  </div>

                  {/* Validation Checklist */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      {hasMinLength ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-slate-500">✕</span>
                      )}
                      <span className={hasMinLength ? 'text-slate-300' : 'text-slate-500'}>7+ characters</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasNumber ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-slate-500">✕</span>
                      )}
                      <span className={hasNumber ? 'text-slate-300' : 'text-slate-500'}>Number</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasSymbol ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-slate-500">✕</span>
                      )}
                      <span className={hasSymbol ? 'text-slate-300' : 'text-slate-500'}>Symbol</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasUpperCase ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-slate-500">✕</span>
                      )}
                      <span className={hasUpperCase ? 'text-slate-300' : 'text-slate-500'}>Uppercase</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password Field */}
              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-label="confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((s) => !s)}
                  className="text-slate-400 flex-shrink-0"
                  aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {passwordsMatch ? (
                    <>
                      <span className="text-green-500">✓</span>
                      <span className="text-green-500">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500">✕</span>
                      <span className="text-red-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex gap-2 w-full items-center">
                  <select
                    className="bg-transparent text-white border-none outline-none flex-shrink-0 text-sm cursor-pointer hover:text-yellow-400 transition appearance-none"
                    aria-label="country-code"
                    defaultValue="+91"
                  >
                    <option value="+91" className="bg-slate-900 text-white">+91</option>
                    <option value="+1" className="bg-slate-900 text-white">+1</option>
                    <option value="+44" className="bg-slate-900 text-white">+44</option>
                  </select>
                  <input
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                    placeholder="9876453210"
                    defaultValue=""
                    name="phone"
                    aria-label="phone"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 mt-4 pt-2">
                <input id="terms" type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-3 h-3 text-yellow-400 bg-black border border-slate-600 mt-0.5 flex-shrink-0" />
                <label htmlFor="terms" className="text-xs text-slate-300 cursor-pointer">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-yellow-400 hover:underline"
                  >
                    Terms of Service and Privacy Policy
                  </button>
                </label>
              </div>

              <button className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base hover:bg-yellow-500 transition" type="button">
                Agree and Register
              </button>

              <div className="flex items-center gap-4 my-4 text-slate-500">
                <span className="flex-1 border-t border-slate-700" />
                <span className="text-xs font-medium">Or Login with</span>
                <span className="flex-1 border-t border-slate-700" />
              </div>

              <button className="w-full bg-slate-800 text-white font-medium rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-slate-700 transition text-xs">
                <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">G</div>
                <span>Google</span>
              </button>

              <p className="text-xs text-slate-500 mt-6 text-center md:text-left leading-relaxed">
                Do have an account?{' '}
                <Link
                  to="/login"
                  className="text-yellow-400 hover:underline font-semibold"
                >
                  Login
                </Link>
                !
              </p>
            </div>
          </div>

          {/* Right: big logo on desktop */}
          <div className="hidden md:flex items-center justify-center order-2">
            <img src={BTlogo} alt="BlackTicket" className="w-56 drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <style>{`
            .terms-scroll::-webkit-scrollbar {
              display: none;
            }
            .terms-scroll {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="terms-scroll bg-black bg-opacity-90 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-black">
              <h2 className="text-white text-lg font-bold">Terms of Service & Privacy Policy</h2>
              <button
                type="button"
                onClick={() => {
                  setShowTermsModal(false);
                  setTermsAccepted(true);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 text-slate-300 text-xs space-y-3">
              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">1. TICKET BOOKING & CANCELLATION</h3>
                <p>All tickets are non-refundable once purchased. Cancellations are allowed only up to 30 minutes before the showtime. Refunds will be processed within 5-7 business days. Tickets cannot be transferred to another screening.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">2. AGE RESTRICTIONS</h3>
                <p>Movies with 'U/A' certification require parental guidance for viewers below 12 years. 'A' rated films are strictly for viewers 18 years and above. Valid ID proof is mandatory for restricted category films. We reserve the right to deny entry without valid age verification.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">3. CONDUCT & BEHAVIOR</h3>
                <p>Any form of disruptive behavior, harassment, or violence inside the theater will result in immediate eviction without refund. Recording or photography inside the theater is strictly prohibited and may attract legal action. Mobile phones should be switched to silent mode during the screening.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">4. SEAT ALLOCATION</h3>
                <p>Seats are assigned based on availability at the time of booking. We do not guarantee specific seat locations. In case of technical issues or show cancellation, full refund or alternative screening will be offered.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">5. PRICING & DISCOUNTS</h3>
                <p>Prices are subject to change without prior notice. Special discounts or offers cannot be combined. Student, senior citizen, or other discounts require valid identification at the time of entry.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">6. PRIVACY POLICY</h3>
                <p>Your personal data is collected for booking and communication purposes only. We do not share your information with third parties without consent. You can request data deletion anytime. We use industry-standard encryption to protect your payment information.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">7. LIABILITY</h3>
                <p>BlackTicket Entertainment is not responsible for personal injuries, loss of valuables, or any incidents inside the theater. We maintain CCTV surveillance for security purposes. Visitors are advised to keep their belongings secure.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">8. PAYMENT & SECURITY</h3>
                <p>We accept all major payment methods. Transactions are secured through encrypted gateways. In case of payment disputes, customers can contact our support within 48 hours. Unauthorized transactions will be investigated and resolved.</p>
              </section>

              <section>
                <h3 className="text-yellow-400 font-semibold mb-2">9. AMENDMENTS</h3>
                <p>BlackTicket Entertainment reserves the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of our services implies acceptance of updated terms.</p>
              </section>

              <p className="text-center text-slate-500 pt-4 border-t border-slate-700">By closing this modal, you accept the terms and conditions.</p>
            </div>

            <div className="p-4 border-t border-slate-700 bg-black sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setShowTermsModal(false);
                  setTermsAccepted(true);
                }}
                className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2 text-sm hover:bg-yellow-500 transition"
              >
                I Accept & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
