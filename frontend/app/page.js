'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, ArrowRight, Clock, Users, Sparkles, MapPin, Zap } from 'lucide-react';

const TRIPS = [
  {
    id: 0, city: 'Bangkok', country: 'Thailand',
    tagline: 'Ancient temples, fragrant markets & electric nightlife',
    desc: 'Golden spires pierce the skyline as tuk-tuks weave through fragrant alleys. From the Grand Palace at dawn to Khao San Road at midnight.',
    days: 7, budget: 'Moderate', travelers: 'Friends',
    highlights: ['Grand Palace', 'Chatuchak Market', 'Khao San Road'],
    heroPhoto: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 1, city: 'Bali', country: 'Indonesia',
    tagline: 'Volcanic peaks, sacred temples & turquoise surf',
    desc: 'Rice terraces cascade down volcanic slopes while the Indian Ocean thunders against black-sand beaches. Deep spiritual calm meets world-class surf.',
    days: 8, budget: 'Budget', travelers: 'Couple',
    highlights: ['Tegallalang Terraces', 'Tanah Lot Temple', 'Canggu Surf'],
    heroPhoto: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 2, city: 'Tokyo', country: 'Japan',
    tagline: 'Neon-lit modernity wrapped in 800 years of tradition',
    desc: 'Ancient shrines stand beside glowing arcades. Tokyo is 34 million stories happening at once — every one worth your time.',
    days: 6, budget: 'Luxury', travelers: 'Solo',
    highlights: ['Shibuya Crossing', 'Tsukiji Market', 'Shinjuku at Night'],
    heroPhoto: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 3, city: 'Paris', country: 'France',
    tagline: 'Art, romance and the world\'s finest cuisine',
    desc: 'The Eiffel Tower sparkles at midnight, croissants perfume every corner boulangerie, and world-class museums jostle for your attention.',
    days: 5, budget: 'Luxury', travelers: 'Couple',
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Le Marais Food Tour'],
    heroPhoto: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 4, city: 'Santorini', country: 'Greece',
    tagline: 'White-washed cliffs, cerulean domes & Aegean sunsets',
    desc: 'Blue-domed churches cling to volcanic clifftops above the Aegean. Sip local wine in Oia as the sun dissolves into the caldera.',
    days: 5, budget: 'Luxury', travelers: 'Couple',
    highlights: ['Oia Sunset', 'Red Beach', 'Fira Wine Tasting'],
    heroPhoto: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 5, city: 'Dubai', country: 'UAE',
    tagline: 'Desert gold, sky-high thrills & luxury redefined',
    desc: "The world's tallest building stands in a city built from sand five decades ago. Arabian heritage meets audacious futurism.",
    days: 5, budget: 'Luxury', travelers: 'Friends',
    highlights: ['Burj Khalifa', 'Desert Safari', 'Gold Souk'],
    heroPhoto: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 6, city: 'New York', country: 'USA',
    tagline: 'The city that never sleeps — and never disappoints',
    desc: '8 million people, 26,000 restaurants, a skyline that stops your breath. From the Met to midnight jazz in the Village.',
    days: 6, budget: 'Luxury', travelers: 'Solo',
    highlights: ['Central Park', 'MoMA', 'Brooklyn Bridge'],
    heroPhoto: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1920&q=85',
  },
];

const STATS = [
  { value: '< 60s', label: 'Full itinerary generated' },
  { value: '5+', label: 'AI agents working in parallel' },
  { value: '100%', label: 'Editable after generation' },
];

const STEPS = [
  {
    n: '01',
    title: 'Tell us your trip',
    desc: 'Pick a destination, set your budget and length, tell us who\'s going. Under a minute.',
  },
  {
    n: '02',
    title: 'AI builds your plan',
    desc: '5 specialist agents research activities, hotels, restaurants, weather and budget — all in parallel.',
  },
  {
    n: '03',
    title: 'Edit & explore',
    desc: 'Regenerate any single day, swap activities, add personal notes — then just pack and go.',
  },
];

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5 text-violet-400" />,
    label: 'Built around your interests',
    desc: 'Nightlife at night, food at meal times, adventure when you want it. Never generic filler — every hour is intentional.',
  },
  {
    icon: <MapPin className="w-5 h-5 text-violet-400" />,
    label: 'Every detail covered',
    desc: 'Hotels, restaurants, live weather, emergency numbers, budget breakdown and a Google Maps route per day.',
  },
  {
    icon: <Zap className="w-5 h-5 text-violet-400" />,
    label: 'Edit anything instantly',
    desc: "Not happy with Day 3? Give a hint and AI rewrites just that day. Or regenerate the whole trip in seconds.",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    TRIPS.slice(0, 3).forEach(t => {
      const img = new window.Image();
      img.src = t.heroPhoto;
    });
  }, []);

  const goTo = useCallback((idx) => {
    if (animating || idx === current) return;
    clearTimeout(timerRef.current);
    setAnimating(true);
    setTextVisible(false);
    setTimeout(() => { setPrev(current); setCurrent(idx); }, 200);
    setTimeout(() => { setPrev(null); setTextVisible(true); setAnimating(false); }, 900);
  }, [animating, current]);

  useEffect(() => {
    timerRef.current = setTimeout(() => goTo((current + 1) % TRIPS.length), 6000);
    return () => clearTimeout(timerRef.current);
  }, [current, goTo]);

  const trip = TRIPS[current];

  return (
    <div className="flex flex-col">

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden bg-[#0f172a]">

        {/* Image layers */}
        <img
          src={trip.heroPhoto}
          alt={trip.city}
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          draggable={false}
        />
        {prev !== null && (
          <img
            src={TRIPS[prev].heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            style={{ animation: 'fadeOutHero 0.7s ease-in-out forwards' }}
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-44 bg-linear-to-b from-black/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-black/90 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <div className="flex-1 flex items-center">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full pt-28 pb-12">

              <div
                className="max-w-2xl transition-all duration-300 ease-out"
                style={{
                  opacity: textVisible ? 1 : 0,
                  transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
                }}
              >
                {/* AI badge */}
                <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 mb-7 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-violet-300 text-xs font-semibold tracking-wide">AI-Powered Trip Planning</span>
                </div>

                {/* Country eyebrow */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-px bg-white/50" />
                  <span className="text-white/55 text-[11px] font-bold uppercase tracking-[0.35em]">
                    {trip.country}
                  </span>
                </div>

                {/* City name */}
                <h1
                  className="font-black text-white leading-[0.88] mb-5"
                  style={{
                    fontSize: 'clamp(3.5rem, 8vw, 7.5rem)',
                    letterSpacing: '-0.03em',
                    textShadow: '0 4px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {trip.city.toUpperCase()}
                </h1>

                {/* Tagline */}
                <p className="text-white/75 text-base sm:text-xl font-medium mb-3 max-w-lg leading-snug">
                  {trip.tagline}
                </p>

                {/* Description */}
                <p className="text-white/35 text-sm leading-relaxed mb-6 max-w-md hidden sm:block">
                  {trip.desc}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {trip.highlights.map(h => (
                    <span
                      key={h}
                      className="text-xs text-white/65 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-9 text-white/40 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />{trip.days} days
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span>{trip.budget}</span>
                  <span className="w-px h-3 bg-white/20" />
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />{trip.travelers}
                  </span>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={user ? '/create-trip' : '/register'}
                    className="inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold text-sm px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-violet-500/25 group"
                  >
                    {user ? 'Plan This Trip' : 'Start Planning Free'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  {!user && (
                    <span className="text-white/30 text-xs">No credit card required</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom nav */}
          <div className="pb-8 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

              <div className="select-none flex items-baseline gap-1.5">
                <span className="text-white text-2xl font-black tabular-nums">
                  {String(current + 1).padStart(2, '0')}
                </span>
                <span className="text-white/20 text-sm tabular-nums">
                  / {String(TRIPS.length).padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {[-1, 1].map(dir => (
                  <button
                    key={dir}
                    onClick={() => goTo((current + dir + TRIPS.length) % TRIPS.length)}
                    disabled={animating}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all disabled:opacity-30 focus:outline-none"
                  >
                    {dir === -1
                      ? <ChevronLeft className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {TRIPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    disabled={animating}
                    className={`rounded-full transition-all duration-300 focus:outline-none ${
                      i === current ? 'w-6 h-1.5 bg-violet-400' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#0f172a] border-y border-white/8 py-14 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {STATS.map((s, i) => (
            <div key={s.value} className={`text-center py-2 ${i < 2 ? 'border-r border-white/8' : ''}`}>
              <div className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">{s.value}</div>
              <div className="text-xs text-slate-400 leading-snug max-w-30 mx-auto">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[#0f172a] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-400/60 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              A full trip plan in under a minute
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(100%-1rem)] w-[calc(100%-1rem)] h-px bg-linear-to-r from-violet-500/20 to-transparent" />
                )}
                <div className="bg-[#1e293b] border border-white/8 rounded-2xl p-6 hover:border-violet-500/20 transition-colors h-full">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5">
                    <span className="font-black text-violet-400 text-xl">{step.n}</span>
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-[#0a1020] border-t border-white/8 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-400/60 mb-3">What&apos;s included</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div
                key={f.label}
                className="bg-[#1e293b] border border-white/8 rounded-2xl p-7 hover:border-violet-500/20 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5 group-hover:bg-violet-500/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-bold text-sm mb-2.5">{f.label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative overflow-hidden bg-[#0a1020] border-t border-white/8 py-28 px-6 text-center">
        {/* violet glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-175 h-87.5 bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-400/70 mb-5">Ready to go?</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-[1.1]">
            Pick a destination.<br />
            <span className="text-violet-400">AI handles the rest.</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-10 leading-relaxed">
            No spreadsheets. No hours of research.<br className="hidden sm:block" />
            Just a great trip — personalised, detailed, ready in seconds.
          </p>
          <Link
            href={user ? '/create-trip' : '/register'}
            className="inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-violet-500/20 group"
          >
            {user ? 'Plan a New Trip' : "Get Started — It's Free"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs text-slate-600 mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

      <style>{`
        @keyframes fadeOutHero {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

    </div>
  );
}
