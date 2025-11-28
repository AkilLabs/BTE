// Using JSX transform; no need to import React directly
import { useState } from 'react';
import BTlogo from '../../assets/BTlogo.png';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';

export default function NewPassword() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight">Create new password</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">Your new password must be unique from those previously used.</p>

            <div className="space-y-4">
              {/* New Password Field */}
              <div>
                <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                  <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <input
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                    placeholder="New Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    name="password"
                    aria-label="new password"
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-4 space-y-2">
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
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className={hasMinLength ? 'text-slate-300' : 'text-slate-500'}>7+ characters</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasNumber ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className={hasNumber ? 'text-slate-300' : 'text-slate-500'}>Number</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasSymbol ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className={hasSymbol ? 'text-slate-300' : 'text-slate-500'}>Symbol</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasUpperCase ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className={hasUpperCase ? 'text-slate-300' : 'text-slate-500'}>Uppercase</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasLowerCase ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className={hasLowerCase ? 'text-slate-300' : 'text-slate-500'}>Lowercase</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="Confirm Password"
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  name="confirmPassword"
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
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}

              <button
                className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                disabled={!isPasswordStrong || !passwordsMatch}
              >
                Reset Password
              </button>
            </div>
          </div>

          {/* Right: big logo on desktop */}
          <div className="hidden md:flex items-center justify-center order-2">
            <img src={BTlogo} alt="BlackTicket" className="w-56 drop-shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
