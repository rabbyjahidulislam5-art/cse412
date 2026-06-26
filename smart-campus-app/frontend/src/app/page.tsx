'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">SC</div>
          <span className="text-white font-semibold">Smart Campus</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 text-white/80 hover:text-white text-sm font-medium">Login</Link>
          <Link href="/auth/signup" className="px-4 py-2 bg-white text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-50">Sign Up</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your Complete Campus<br />Experience in One App
        </h1>
        <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-10">
          Digital wallet, fine management, course advising, library services, and campus payments — all integrated for East West University students.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup" className="btn btn-lg bg-white text-blue-800 hover:bg-blue-50 rounded-xl">Get Started</Link>
          <Link href="/auth/login" className="btn btn-lg border-2 border-white/30 text-white hover:bg-white/10 rounded-xl">Login</Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '💳', title: 'Digital Wallet', desc: 'Top up via bKash, Nagad, or card. Pay anywhere on campus.' },
            { icon: '📚', title: 'Library & Fines', desc: 'Track books, pay fines, manage your academic obligations.' },
            { icon: '🎓', title: 'Course Advising', desc: 'Automatic clearance. Know instantly when you can register.' },
            { icon: '📱', title: 'QR Payments', desc: 'Scan & pay at campus shops in under 5 seconds.' },
          ].map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all">
              <span className="text-3xl block mb-3">{f.icon}</span>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-blue-200 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center">
        <p className="text-blue-300 text-sm">East West University — CSE 412 Software Engineering — Group 7</p>
        <p className="text-blue-400 text-xs mt-2">Smart Campus App v1.0</p>
      </footer>
    </div>
  );
}
