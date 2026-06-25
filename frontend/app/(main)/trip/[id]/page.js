'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { TRAVELER_OPTIONS, BUDGET_OPTIONS, INTEREST_OPTIONS } from '@/constants/options';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import {
  MapPin, Clock, Ticket, Star, Hotel, Wallet, Plane, Utensils,
  RefreshCw, Plus, Trash2, Loader2, ChevronDown, ChevronUp,
  ExternalLink, Pencil, X, Activity, UtensilsCrossed,
  Lightbulb, Globe, Bus, CloudSun, Info, Trophy, NotebookPen, Check,
  Phone, AlertTriangle, Map, Navigation,
} from 'lucide-react';
import WeatherWidget from '@/components/WeatherWidget';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function photoUrl(query) {
  if (!query) return `${API_URL}/api/places/photo?query=travel+destination`;
  return `${API_URL}/api/places/photo?query=${encodeURIComponent(query)}`;
}

// Dark theme for GooglePlacesAutocomplete inside modals
const placesStyles = {
  control: (base) => ({
    ...base,
    background: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    padding: '4px 6px',
    boxShadow: 'none',
    '&:hover': { borderColor: 'rgba(255,255,255,0.25)' },
  }),
  input: (base) => ({ ...base, color: 'white' }),
  singleValue: (base) => ({ ...base, color: 'white' }),
  placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.25)' }),
  menu: (base) => ({ ...base, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', overflow: 'hidden' }),
  menuList: (base) => ({ ...base, padding: '4px' }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'rgba(139,92,246,0.12)' : 'transparent',
    color: state.isFocused ? '#8b5cf6' : 'rgba(255,255,255,0.75)',
    borderRadius: '0.5rem',
  }),
  indicatorsContainer: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)' }),
  clearIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'white' } }),
  dropdownIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)' }),
  noOptionsMessage: (base) => ({ ...base, color: 'rgba(255,255,255,0.4)' }),
};

export default function TripDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState(0);

  const [regenDay, setRegenDay] = useState(null);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  const [addingToDay, setAddingToDay] = useState(null);
  const [newActivity, setNewActivity] = useState({ time: '', title: '', description: '', ticketPrice: '', rating: '' });
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [mapDay, setMapDay] = useState(null);

  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/trips/${id}`)
      .then(({ data }) => { setTrip(data.trip); setNotes(data.trip.notes || ''); setLoading(false); })
      .catch(() => { setError('Trip not found or you do not have access.'); setLoading(false); });
  }, [id]);

  function openEditModal() {
    setEditForm({
      destination: trip.destination ? { label: trip.destination, value: {} } : null,
      days: trip.days,
      budgetType: trip.budgetType,
      travelersType: trip.travelersType,
      interests: [...trip.interests],
    });
    setEditOpen(true);
  }

  function toggleEditInterest(interest) {
    setEditForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }));
  }

  async function handleFullRegenerate() {
    if (!editForm.destination || !editForm.days || !editForm.budgetType || !editForm.travelersType) {
      setError('Please fill all fields before regenerating.');
      return;
    }
    setEditLoading(true);
    try {
      const { data } = await api.post(`/api/trips/${id}/full-regenerate`, {
        destination: editForm.destination.label,
        days: Number(editForm.days),
        budgetType: editForm.budgetType,
        travelersType: editForm.travelersType,
        interests: editForm.interests,
      });
      setTrip(data.trip);
      setEditOpen(false);
      setExpandedDay(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate trip.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleRegenerateDay() {
    if (!regenDay) return;
    setRegenLoading(true);
    try {
      const { data } = await api.post(`/api/trips/${id}/regenerate-day`, {
        dayNumber: regenDay,
        instruction: regenInstruction,
      });
      setTrip(data.trip);
      setRegenDay(null);
      setRegenInstruction('');
    } catch {
      setError('Failed to regenerate day.');
    } finally {
      setRegenLoading(false);
    }
  }

  async function handleAddActivity(dayIndex) {
    if (!newActivity.title.trim()) return;
    setSaving(true);
    const updated = trip.itinerary.map((d, i) =>
      i !== dayIndex ? d : { ...d, activities: [...d.activities, { ...newActivity }] }
    );
    try {
      const { data } = await api.put(`/api/trips/${id}`, { itinerary: updated });
      setTrip(data.trip);
      setAddingToDay(null);
      setNewActivity({ time: '', title: '', description: '', ticketPrice: '', rating: '' });
    } catch {
      setError('Failed to save activity.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteActivity(dayIndex, actIndex) {
    const updated = trip.itinerary.map((d, i) =>
      i !== dayIndex ? d : { ...d, activities: d.activities.filter((_, ai) => ai !== actIndex) }
    );
    try {
      const { data } = await api.put(`/api/trips/${id}`, { itinerary: updated });
      setTrip(data.trip);
    } catch {
      setError('Failed to delete activity.');
    }
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    try {
      await api.put(`/api/trips/${id}`, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch { /* silent */ } finally {
      setNotesSaving(false);
    }
  }

  function googleMapsUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function dayRouteUrl(activities, destination) {
    const waypoints = activities.map(a => encodeURIComponent(`${a.title} ${destination}`)).join('/');
    return `https://www.google.com/maps/dir/${waypoints}`;
  }

  function mapEmbedUrl(activities, destination) {
    const query = activities.map(a => a.title).join(' + ') + ' in ' + destination;
    return `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&q=${encodeURIComponent(query)}&zoom=13`;
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error && !trip) {
    return <div className="max-w-3xl mx-auto px-5 py-16 text-center text-red-400 text-sm">{error}</div>;
  }

  const budgetLabel = { low: 'Budget', medium: 'Moderate', high: 'Luxury' };

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">

      {/* ── Trip header ── */}
      <div className="mb-7">
        <h1 className="text-4xl font-extrabold text-white flex items-center gap-2.5 mb-3">
          <MapPin className="w-7 h-7 text-violet-500 shrink-0" />
          {trip.destination}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
            {trip.days} day{trip.days > 1 ? 's' : ''}
          </span>
          <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
            {budgetLabel[trip.budgetType]}
          </span>
          <span className="text-xs font-semibold text-white/55 bg-white/6 border border-white/8 px-3 py-1.5 rounded-full capitalize">
            {trip.travelersType}
          </span>
          {trip.interests.map(i => (
            <span key={i} className="text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full">{i}</span>
          ))}
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 ml-auto text-white/45 hover:text-white/80 text-xs font-semibold bg-[#334155] hover:bg-white/10 border border-white/8 px-3 py-1.5 rounded-full transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Trip
          </button>
        </div>
        <p className="text-white/20 text-xs mt-2">Created {new Date(trip.createdAt).toLocaleDateString()}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>
      )}

      {/* Live Weather */}
      <WeatherWidget destination={trip.destination} />

      {/* ── Destination Insights ── */}
      {trip.destinationInsights && (
        <section className="mb-7 bg-[#1e293b] border border-sky-500/20 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Destination Intelligence</span>
          </h2>
          {trip.destinationInsights.overview && (
            <p className="text-sm text-white/55 mb-5 leading-relaxed">{trip.destinationInsights.overview}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {trip.destinationInsights.mustSeeHighlights?.length > 0 && (
              <div className="bg-[#334155] rounded-xl p-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Must-See
                </h3>
                <ul className="space-y-1.5">
                  {trip.destinationInsights.mustSeeHighlights.map((h, i) => (
                    <li key={i} className="text-sm text-white/65 flex items-start gap-1.5">
                      <span className="text-yellow-500 mt-0.5 shrink-0">★</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {trip.destinationInsights.localTips?.length > 0 && (
              <div className="bg-[#334155] rounded-xl p-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-violet-400" /> Local Tips
                </h3>
                <ul className="space-y-1.5">
                  {trip.destinationInsights.localTips.map((tip, i) => (
                    <li key={i} className="text-sm text-white/65 flex items-start gap-1.5">
                      <span className="text-violet-400 mt-0.5 shrink-0">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {trip.destinationInsights.culturalNotes?.length > 0 && (
              <div className="bg-[#334155] rounded-xl p-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400" /> Cultural Notes
                </h3>
                <ul className="space-y-1.5">
                  {trip.destinationInsights.culturalNotes.map((note, i) => (
                    <li key={i} className="text-sm text-white/65 flex items-start gap-1.5">
                      <span className="text-sky-400 mt-0.5 shrink-0">•</span> {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-[#334155] rounded-xl p-4 space-y-3">
              {trip.destinationInsights.weatherNote && (
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <CloudSun className="w-3.5 h-3.5 text-sky-400" /> Weather
                  </h3>
                  <p className="text-sm text-white/60">{trip.destinationInsights.weatherNote}</p>
                </div>
              )}
              {trip.destinationInsights.transportTips && (
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-emerald-400" /> Getting Around
                  </h3>
                  <p className="text-sm text-white/60">{trip.destinationInsights.transportTips}</p>
                </div>
              )}
              {trip.destinationInsights.bestAreas?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> Best Areas
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {trip.destinationInsights.bestAreas.map((area, i) => (
                      <span key={i} className="text-xs bg-white/6 text-white/60 border border-white/8 px-2 py-0.5 rounded-full">{area}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* ── Emergency Info ── */}
      {trip.emergencyInfo && (
        <section className="mb-7 bg-[#1e293b] border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-2 border-b border-red-500/12 bg-red-500/8">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <h2 className="font-bold text-red-300 text-sm">Emergency & Practical Info</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>
              <h3 className="text-xs font-bold text-white/35 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Emergency Numbers
              </h3>
              <div className="space-y-2">
                {trip.emergencyInfo.generalEmergency && (
                  <div className="flex items-center justify-between bg-red-500/10 border border-red-500/15 rounded-xl px-3 py-2">
                    <span className="text-sm text-white/65 font-medium">General Emergency</span>
                    <span className="font-bold text-red-400 text-lg">{trip.emergencyInfo.generalEmergency}</span>
                  </div>
                )}
                {[['Police', trip.emergencyInfo.police], ['Ambulance', trip.emergencyInfo.ambulance], ['Fire', trip.emergencyInfo.fire]]
                  .filter(([, v]) => v)
                  .map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between bg-white/4 rounded-xl px-3 py-2">
                      <span className="text-sm text-white/45">{label}</span>
                      <span className="font-bold text-white/80">{val}</span>
                    </div>
                  ))}
                {trip.emergencyInfo.hospitalArea && (
                  <div className="bg-sky-500/10 border border-sky-500/15 rounded-xl px-3 py-2 mt-1">
                    <span className="text-xs text-sky-400 font-semibold">🏥 Nearest Hospital Area</span>
                    <p className="text-sm text-white/55 mt-0.5">{trip.emergencyInfo.hospitalArea}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {trip.emergencyInfo.safetyTips?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white/35 uppercase tracking-wide mb-2">Safety Tips</h3>
                  <ul className="space-y-1.5">
                    {trip.emergencyInfo.safetyTips.map((tip, i) => (
                      <li key={i} className="text-sm text-white/55 flex items-start gap-2">
                        <span className="text-violet-400 mt-0.5 shrink-0">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(trip.emergencyInfo.localCurrency || trip.emergencyInfo.tippingCulture) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2">
                  {trip.emergencyInfo.localCurrency && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-sm">💵</span>
                      <span className="text-sm text-white/65">
                        <span className="font-semibold">{trip.emergencyInfo.localCurrency}</span>
                        {trip.emergencyInfo.currencyCode && <span className="text-white/35"> ({trip.emergencyInfo.currencyCode})</span>}
                      </span>
                    </div>
                  )}
                  {trip.emergencyInfo.tippingCulture && (
                    <p className="text-xs text-white/45">{trip.emergencyInfo.tippingCulture}</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* ── Budget ── */}
      {trip.estimatedBudget && (
        <section className="bg-linear-to-r from-violet-500 to-amber-500 text-white rounded-2xl p-6 mb-7">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Wallet className="w-4 h-4" /> Estimated Budget
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Flights',        value: trip.estimatedBudget.flights,        icon: <Plane className="w-3.5 h-3.5" /> },
              { label: 'Accommodation',  value: trip.estimatedBudget.accommodation,  icon: <Hotel className="w-3.5 h-3.5" /> },
              { label: 'Food',           value: trip.estimatedBudget.food,           icon: <Utensils className="w-3.5 h-3.5" /> },
              { label: 'Activities',     value: trip.estimatedBudget.activities,     icon: <Activity className="w-3.5 h-3.5" /> },
            ].map(item => (
              <div key={item.label} className="bg-black/15 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-violet-100/75 text-xs mb-1">{item.icon}{item.label}</div>
                <div className="font-bold text-base">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/25 pt-3 flex justify-between items-center">
            <span className="font-semibold text-violet-100/80 text-sm">Total Estimated</span>
            <span className="text-2xl font-extrabold">{trip.estimatedBudget.total}</span>
          </div>
        </section>
      )}

      {/* ── Hotels ── */}
      {trip.hotels?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-violet-500" /> Recommended Hotels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trip.hotels.map((hotel, i) => (
              <a
                key={i}
                href={googleMapsUrl(`${hotel.name} ${trip.destination}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1e293b] border border-white/8 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all group"
              >
                <img
                  src={photoUrl(`${hotel.name} hotel ${trip.destination}`)}
                  alt={hotel.name}
                  className="w-full h-36 object-cover"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=350&fit=crop'; }}
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-bold text-white/85 text-sm group-hover:text-violet-400 transition-colors leading-tight">{hotel.name}</h3>
                    <ExternalLink className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                  </div>
                  <span className="inline-block text-violet-400 bg-violet-500/10 text-xs font-medium px-2 py-0.5 rounded-full mb-2">{hotel.type}</span>
                  <div className="flex items-center gap-1 text-xs text-white/45 mb-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {hotel.rating}
                  </div>
                  <div className="text-sm font-semibold text-white/70">{hotel.pricePerNight}</div>
                  {hotel.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hotel.amenities.slice(0, 3).map(a => (
                        <span key={a} className="text-xs bg-[#334155] text-white/40 border border-white/6 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Restaurants ── */}
      {trip.restaurants?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-violet-500" /> Must-Try Restaurants
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trip.restaurants.map((r, i) => (
              <a
                key={i}
                href={googleMapsUrl(`${r.name} restaurant ${trip.destination}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-0 bg-[#1e293b] border border-white/8 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all group"
              >
                <img
                  src={photoUrl(`${r.name} restaurant ${trip.destination}`)}
                  alt={r.name}
                  className="w-28 object-cover shrink-0"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop'; }}
                />
                <div className="p-3 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-bold text-white/85 text-sm group-hover:text-violet-400 transition-colors leading-tight">{r.name}</h3>
                    <ExternalLink className="w-3.5 h-3.5 text-white/25 shrink-0" />
                  </div>
                  <span className="text-xs text-violet-400 font-medium">{r.cuisine}</span>
                  <div className="flex items-center gap-1 text-xs text-white/40 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {r.rating}
                    <span className="mx-1 text-white/20">·</span>
                    <span className="font-semibold text-white/55">{r.priceRange}</span>
                  </div>
                  {r.specialty && <p className="text-xs text-white/35 mt-1.5 line-clamp-2">🍽 {r.specialty}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Itinerary ── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white mb-5 flex items-baseline gap-2">
          Day-by-Day Itinerary
          <span className="text-xs font-normal text-white/30">({trip.itinerary.length} days)</span>
        </h2>
        <div className="space-y-3">
          {trip.itinerary.map((day, dayIndex) => (
            <div key={day.day} className="bg-[#1e293b] border border-white/8 rounded-2xl overflow-hidden">

              {/* Day accordion header */}
              <div
                className="flex items-center justify-between px-5 py-4 hover:bg-[#334155] transition-colors cursor-pointer"
                onClick={() => setExpandedDay(expandedDay === dayIndex ? -1 : dayIndex)}
              >
                <div className="flex items-center gap-3">
                  <span className="bg-violet-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    {day.day}
                  </span>
                  <div>
                    <div className="font-bold text-white/85 text-sm">Day {day.day}</div>
                    {day.theme && <div className="text-xs text-white/40 mt-0.5">{day.theme}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); setMapDay(mapDay === dayIndex ? null : dayIndex); setExpandedDay(dayIndex); }}
                    className={`flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg transition-all ${
                      mapDay === dayIndex
                        ? 'text-sky-400 border-sky-500/30 bg-sky-500/10'
                        : 'text-white/40 hover:text-sky-400 border-white/8 hover:border-sky-500/30 bg-white/3'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" /> Map
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setRegenDay(day.day); setRegenInstruction(''); }}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-violet-400 border border-white/8 hover:border-violet-500/30 px-2.5 py-1.5 rounded-lg transition-all bg-white/3"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                  {expandedDay === dayIndex
                    ? <ChevronUp className="w-4 h-4 text-white/30" />
                    : <ChevronDown className="w-4 h-4 text-white/30" />}
                </div>
              </div>

              {/* Day content */}
              {expandedDay === dayIndex && (
                <div className="border-t border-white/6 px-5 py-5 space-y-6">

                  {/* Map embed */}
                  {mapDay === dayIndex && day.activities.length > 0 && (
                    <div className="rounded-xl overflow-hidden border border-sky-500/20">
                      <iframe
                        title={`Day ${day.day} map`}
                        width="100%"
                        height="260"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapEmbedUrl(day.activities, trip.destination)}
                      />
                      <div className="bg-sky-500/10 border-t border-sky-500/15 px-4 py-2.5 flex items-center justify-between">
                        <p className="text-xs text-sky-400/80">
                          {day.activities.length} stops · Day {day.day}
                        </p>
                        <a
                          href={dayRouteUrl(day.activities, trip.destination)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Navigation className="w-3 h-3" /> Get Route
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {day.activities.map((act, actIndex) => (
                    <div key={actIndex} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 shrink-0" />
                        {actIndex < day.activities.length - 1 && (
                          <div className="w-px flex-1 bg-violet-500/15 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <img
                          src={photoUrl(`${act.title} ${trip.destination}`)}
                          alt={act.title}
                          className="w-full h-44 object-cover rounded-xl mb-3"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {act.time && (
                              <span className="flex items-center gap-1 text-xs text-violet-400 font-medium mb-1">
                                <Clock className="w-3 h-3" /> {act.time}
                              </span>
                            )}
                            <h4 className="font-semibold text-white/85 text-sm">{act.title}</h4>
                            {act.description && <p className="text-sm text-white/45 mt-1 leading-relaxed">{act.description}</p>}
                            <div className="flex flex-wrap gap-3 mt-2">
                              {act.ticketPrice && (
                                <span className="flex items-center gap-1 text-xs text-white/40">
                                  <Ticket className="w-3 h-3" /> {act.ticketPrice}
                                </span>
                              )}
                              {act.rating && (
                                <span className="flex items-center gap-1 text-xs text-white/40">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {act.rating}
                                </span>
                              )}
                              <a
                                href={googleMapsUrl(act.title + ' ' + trip.destination)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> Maps
                              </a>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteActivity(dayIndex, actIndex)}
                            className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all p-1 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add activity */}
                  {addingToDay === dayIndex ? (
                    <div className="bg-[#334155] border border-violet-500/20 rounded-xl p-4 space-y-3">
                      <h4 className="font-semibold text-white/75 text-sm">Add Activity</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          placeholder="Title *"
                          value={newActivity.title}
                          onChange={e => setNewActivity(a => ({ ...a, title: e.target.value }))}
                          className="bg-[#334155] border border-white/10 focus:border-white/30 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 col-span-2 transition-colors"
                        />
                        <input
                          placeholder="Time (e.g. 9:00 AM)"
                          value={newActivity.time}
                          onChange={e => setNewActivity(a => ({ ...a, time: e.target.value }))}
                          className="bg-[#334155] border border-white/10 focus:border-white/30 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 transition-colors"
                        />
                        <input
                          placeholder="Ticket price"
                          value={newActivity.ticketPrice}
                          onChange={e => setNewActivity(a => ({ ...a, ticketPrice: e.target.value }))}
                          className="bg-[#334155] border border-white/10 focus:border-white/30 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 transition-colors"
                        />
                        <textarea
                          placeholder="Description"
                          value={newActivity.description}
                          onChange={e => setNewActivity(a => ({ ...a, description: e.target.value }))}
                          rows={2}
                          className="bg-[#334155] border border-white/10 focus:border-white/30 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 col-span-2 resize-none transition-colors"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddActivity(dayIndex)}
                          disabled={saving}
                          className="bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {saving ? 'Saving…' : 'Add'}
                        </button>
                        <button
                          onClick={() => setAddingToDay(null)}
                          className="text-white/45 text-sm px-4 py-2 rounded-lg border border-white/10 hover:bg-white/6 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToDay(dayIndex)}
                      className="flex items-center gap-2 text-sm text-white/35 hover:text-violet-400 font-medium transition-colors mt-1"
                    >
                      <Plus className="w-4 h-4" /> Add activity
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Trip Notes ── */}
      <section className="mt-8 border-t border-white/6 pt-6">
        <div
          className="flex items-center justify-between cursor-pointer py-2"
          onClick={() => setNotesOpen(o => !o)}
        >
          <h2 className="text-base font-bold text-white/75 flex items-center gap-2">
            <NotebookPen className="w-4.5 h-4.5 text-violet-500" /> Trip Notes
            {notes && <span className="text-xs font-normal text-white/25 ml-1">· saved</span>}
          </h2>
          {notesOpen
            ? <ChevronUp className="w-4 h-4 text-white/30" />
            : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>

        {notesOpen && (
          <div className="mt-3">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Personal notes, reminders, things to pack, visa requirements…"
              className="w-full bg-[#334155] border border-white/10 focus:border-white/30 focus:outline-none rounded-xl px-4 py-3 text-sm text-white/75 placeholder-white/25 resize-none transition-colors"
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleSaveNotes}
                disabled={notesSaving}
                className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                {notesSaving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  : notesSaved
                  ? <><Check className="w-3.5 h-3.5" /> Saved!</>
                  : 'Save Notes'}
              </button>
              <span className="text-xs text-white/20">Notes are private to you</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Regenerate Day Modal ── */}
      {regenDay !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Regenerate Day {regenDay}</h3>
            <p className="text-sm text-white/40 mb-4">Add an instruction to guide the AI (optional).</p>
            <textarea
              value={regenInstruction}
              onChange={e => setRegenInstruction(e.target.value)}
              placeholder={`e.g. "More outdoor activities" or "Focus on local food"`}
              rows={3}
              className="w-full bg-[#334155] border border-white/10 focus:border-white/28 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 resize-none mb-4 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={handleRegenerateDay}
                disabled={regenLoading}
                className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {regenLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  : <><RefreshCw className="w-4 h-4" /> Regenerate</>}
              </button>
              <button
                onClick={() => setRegenDay(null)}
                className="flex-1 bg-[#334155] border border-white/10 text-white/65 font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Trip Modal ── */}
      {editOpen && editForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h3 className="text-base font-bold text-white">Edit Trip & Regenerate</h3>
              <button onClick={() => setEditOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">

              <div>
                <label className="block text-sm font-semibold text-white/55 mb-2">Destination</label>
                <GooglePlacesAutocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}
                  selectProps={{
                    value: editForm.destination,
                    onChange: v => setEditForm(f => ({ ...f, destination: v })),
                    placeholder: 'Search destination…',
                    styles: placesStyles,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/55 mb-2">Number of Days</label>
                <input
                  type="number" min={1} max={30}
                  value={editForm.days}
                  onChange={e => setEditForm(f => ({ ...f, days: e.target.value }))}
                  className="w-full bg-[#334155] border border-white/10 focus:border-white/30 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/55 mb-2">Budget</label>
                <div className="grid grid-cols-3 gap-3">
                  {BUDGET_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setEditForm(f => ({ ...f, budgetType: opt.id }))}
                      className={`flex flex-col items-center p-3 border-2 rounded-xl transition-all ${
                        editForm.budgetType === opt.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/8 bg-white/3 hover:border-white/18'
                      }`}
                    >
                      <span className="text-2xl mb-1">{opt.icon}</span>
                      <span className={`text-xs font-semibold ${editForm.budgetType === opt.id ? 'text-violet-400' : 'text-white/70'}`}>{opt.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/55 mb-2">Who&apos;s travelling?</label>
                <div className="grid grid-cols-4 gap-2">
                  {TRAVELER_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setEditForm(f => ({ ...f, travelersType: opt.id }))}
                      className={`flex flex-col items-center p-2 border-2 rounded-xl transition-all ${
                        editForm.travelersType === opt.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/8 bg-white/3 hover:border-white/18'
                      }`}
                    >
                      <span className="text-xl mb-1">{opt.icon}</span>
                      <span className={`text-xs font-semibold ${editForm.travelersType === opt.id ? 'text-violet-400' : 'text-white/65'}`}>{opt.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/55 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleEditInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        editForm.interests.includes(interest)
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'bg-[#334155] text-white/55 border-white/10 hover:border-white/22'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleFullRegenerate}
                disabled={editLoading}
                className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {editLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Regenerating trip…</>
                  : <><RefreshCw className="w-5 h-5" /> Save & Regenerate Trip</>}
              </button>
              <p className="text-xs text-white/20 text-center mt-2">This will replace your current itinerary.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

