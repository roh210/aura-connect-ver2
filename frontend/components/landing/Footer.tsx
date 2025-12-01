"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 text-center sm:text-left">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-3">
              ✨ Aura Connect
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto sm:mx-0">
              Connecting students with peer support when they need it most.
              Anonymous, caring, and always available.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/auth/signup"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/student"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  For Students
                </Link>
              </li>
              <li>
                <Link
                  href="/senior"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  For Seniors
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-gray-400 text-sm">
            © {currentYear} Aura Connect. Made with 💜
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <a href="#" className="hover:text-purple-400 transition-colors">
              🔒 Secure
            </a>
            <a href="#" className="hover:text-purple-400 transition-colors">
              🎓 Student-Run
            </a>
            <a href="#" className="hover:text-purple-400 transition-colors">
              💜 Free
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
