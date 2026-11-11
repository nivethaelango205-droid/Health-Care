import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Our Solution', href: '#solution' },
    { name: 'Core Features', href: '#features' },
  ];

  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-navy-900 tracking-tight">RuralCare</span>
                <span className="text-xl font-bold text-teal-600">360</span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-brandMuted block -mt-1">
                Telemedicine Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Portal Sign-ins */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login?role=patient">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                Patient Login
              </Button>
            </Link>
            <Link to="/login?role=doctor">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                Doctor Login
              </Button>
            </Link>
            <Link to="/login?role=admin">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Admin
              </Button>
            </Link>
            <Link to="/login?role=patient">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-navy-900 p-2 rounded-lg"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link to="/login?role=patient" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full justify-center">
                Patient Portal Login
              </Button>
            </Link>
            <Link to="/login?role=doctor" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full justify-center">
                Doctor Portal Login
              </Button>
            </Link>
            <Link to="/login?role=admin" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-center">
                Admin Console
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

