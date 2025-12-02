// Using JSX transform; no need to import React directly
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <UserNavbar />

        <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-8 sm:pb-24 md:pb-8 md:pt-32">
          {/* Page Title */}
          <div className="mb-10 sm:mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">About BlackTicket Entertainments</h1>
            <div className="w-12 h-1 bg-yellow-400 rounded"></div>
            <p className="text-slate-400 text-sm sm:text-base mt-4">Premium Entertainments ticketing platform</p>
          </div>

          {/* Main Content */}
          <div className="space-y-12 sm:space-y-14 md:space-y-16">
            {/* Opening Paragraph */}
            <section>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                BlackTicket Entertainments was founded with a powerful vision: to revolutionize how people experience Entertainments. We believe that booking movie tickets should be simple, secure, and enjoyable. What started as an innovative idea by our passionate founders has grown into a trusted Entertainments platform serving thousands of movie enthusiasts across the region.
              </p>
            </section>

            {/* Our Mission & Vision */}
            <section className="space-y-8 sm:space-y-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-yellow-400">What We Do</h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  BlackTicket Entertainments provides a seamless, modern platform where Entertainments lovers can discover, explore, and book tickets for their favorite movies. From browsing the latest releases to selecting premium seats and completing secure payments, every step has been crafted with user convenience in mind. Our commitment is to make Entertainments accessible to everyone, anytime, anywhere.
                </p>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-yellow-400">Why We Started</h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  The Entertainments industry deserved better. Long queues, complicated booking processes, and limited information discouraged many from enjoying cinema. Our founders—Poorna Chandran, Karthi, and Parzival Bakmond—recognized this gap and envisioned a solution that respects both time and passion for movies. That vision continues to drive us forward.
                </p>
              </div>
            </section>

            {/* Values Section - Flowing Style */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Our Values</h2>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Trust & Security</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Your data is sacred to us. We employ industry-leading encryption and security protocols to ensure every transaction is safe and your information is protected.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Simplicity First</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    We believe technology should be intuitive. Our interface is designed to be simple, fast, and user-friendly, making booking tickets a pleasure rather than a chore.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Customer Comes First</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Every decision we make is guided by how it benefits our users. From instant confirmations to 24/7 support, we're here to serve you.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Continuous Improvement</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    We listen to your feedback and constantly innovate. BlackTicket evolves with your needs, bringing new features and improvements regularly.
                  </p>
                </div>
              </div>
            </section>

            {/* Numbers - Organic Layout */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">By The Numbers</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-400 min-w-fit">50K+</p>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed pt-1">Happy users trust us with their Entertainments needs every month</p>
                </div>
                <div className="flex items-start gap-3">
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-400 min-w-fit">500K+</p>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed pt-1">Tickets successfully booked, connecting millions with their favorite movies</p>
                </div>
                <div className="flex items-start gap-3">
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-400 min-w-fit">100+</p>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed pt-1">Theater partners across the region bringing you the best cinema experience</p>
                </div>
              </div>
            </section>

            {/* The Team */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-yellow-400">Our Founders</h2>
              <div className="space-y-2 sm:space-y-3">
                <p className="text-slate-300 text-sm sm:text-base font-semibold">Poorna Chandran</p>
                <p className="text-slate-300 text-sm sm:text-base font-semibold">Karthi</p>
                <p className="text-slate-300 text-sm sm:text-base font-semibold">Parzival Bakmond</p>
              </div>
            </section>

            {/* Support Section */}
            <section className="border-t border-white/10 pt-10 sm:pt-12">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-yellow-400">Get in Touch</h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                Have questions or feedback? We'd love to hear from you. Reach out to our team anytime.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">Email</p>
                  <a href="mailto:support@blackticket.com" className="text-yellow-400 hover:text-yellow-300 transition text-sm sm:text-base font-medium">
                    support@blackticket.com
                  </a>
                </div>
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">Phone</p>
                  <a href="tel:+1234567890" className="text-yellow-400 hover:text-yellow-300 transition text-sm sm:text-base font-medium">
                    +1 (234) 567-890
                  </a>
                </div>
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">Support</p>
                  <p className="text-white text-sm sm:text-base font-medium">24/7 Available</p>
                </div>
              </div>
            </section>

            {/* Closing */}
            <section className="pt-6 sm:pt-8">
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic">
                Thank you for being part of the BlackTicket Entertainments community. We're excited to serve you and be part of your Entertainments journey.
              </p>
            </section>
          </div>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
}
