// Using JSX transform; no need to import React directly
import { useRef, useState } from 'react';
import BTlogo from '../../assets/BTlogo.png';

export default function OtpVerification() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if a digit is entered
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 4);
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 4) newOtp[index] = digit;
    });
    setOtp(newOtp);
    if (digits.length === 4) {
      inputRefs.current[3]?.focus();
    }
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
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight">OTP Verification</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">Enter the verification code we just sent on your email address.</p>

            <div className="space-y-4">
              {/* OTP Input Boxes */}
              <div className="flex gap-2 md:gap-3 justify-center md:justify-start">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={otp[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-10 h-10 md:w-12 md:h-12 bg-transparent border-2 border-slate-700 rounded-lg text-white text-lg md:text-xl font-bold text-center outline-none focus:border-yellow-400 transition"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <button className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base hover:bg-yellow-500 transition" type="button">
                Verify
              </button>

              <p className="text-xs text-slate-500 mt-6 text-center md:text-left leading-relaxed">
                Didn't received code?{' '}
                <button
                  type="button"
                  className="text-yellow-400 hover:underline font-semibold"
                >
                  Resend
                </button>
              </p>
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
