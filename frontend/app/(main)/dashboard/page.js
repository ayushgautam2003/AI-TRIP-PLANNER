'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MapPin, Clock, Trash2, Plus, Loader2, X, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function tripPhoto(destination) {
  return `${API_URL}/api/places/photo?query=${encodeURIComponent(destination + ' travel landmark')}`;
}

const BUDGET_LABEL = { low: 'Budget', medium: 'Moderate', high: 'Luxury' };

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/api/trips')
      .then(({ data }) => { setTrips(data.trips); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/trips/${deleteTarget._id}`);
      setTrips(prev => prev.filter(t => t._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // stay open
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">

      {/* Page header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white">My Trips</h1>
          <p className="text-slate-400 text-sm mt-1">
            {trips.length === 0 ? 'No trips yet' : `${trips.length} trip${trips.length !== 1 ? 's' : ''} planned`}
          </p>
        </div>
        <Link
          href="/create-trip"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> New Trip
        </Link>
      </div>

      {/* Empty state */}
      {trips.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
          <div className="text-5xl mb-5">✈️</div>
          <h2 className="text-xl font-bold text-white mb-2">No trips yet</h2>
          <p className="text-slate-400 text-sm mb-8">Generate your first AI-powered itinerary in under a minute.</p>
          <Link
            href="/create-trip"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Plan Your First Trip <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map(trip => (
            <div
              key={trip._id}
              className="bg-[#1e293b] border border-white/8 rounded-2xl overflow-hidden hover:border-white/16 transition-all group"
            >
              {/* Photo */}
              <div className="relative h-44 overflow-hidden bg-[#334155]">
                <img
                  src={tripPhoto(trip.destination)}
                  alt={trip.destination}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/75 to-transparent" />
                <h3 className="absolute bottom-3 left-4 right-10 text-white font-bold text-base leading-tight line-clamp-2">
                  {trip.destination}
                </h3>
                <button
                  onClick={() => setDeleteTarget(trip)}
                  className="absolute top-3 right-3 bg-black/40 hover:bg-red-500/80 text-white backdrop-blur-sm rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete trip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="flex items-center gap-1 text-xs text-slate-300 bg-white/6 border border-white/8 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> {trip.days} day{trip.days > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full font-medium">
                    {BUDGET_LABEL[trip.budgetType]}
                  </span>
                  <span className="text-xs text-slate-400 bg-white/6 border border-white/8 px-2.5 py-1 rounded-full capitalize">
                    {trip.travelersType}
                  </span>
                </div>

                {trip.estimatedBudget?.total && (
                  <div className="text-sm text-slate-300 mb-3">
                    <span className="font-bold text-white">{trip.estimatedBudget.total}</span>
                    <span className="text-slate-500"> estimated</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/6">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/trip/${trip._id}`}
                    className="text-sm font-semibold text-violet-500 hover:text-violet-400 transition-colors flex items-center gap-1"
                  >
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-lg">Delete trip?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="font-medium text-white/70">{deleteTarget.destination}</span> will be permanently removed.
                </p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-slate-500 hover:text-white/70 p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-60 text-red-400 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-white/6 border border-white/10 text-white/70 font-semibold py-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
