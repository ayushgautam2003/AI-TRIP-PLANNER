'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { TRAVELER_OPTIONS, BUDGET_OPTIONS, INTEREST_OPTIONS } from '@/constants/options';
import { Loader2, MapPin } from 'lucide-react';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';

const AGENT_STEPS = [
  { emoji: '🔍', label: 'Destination Research Agent',  detail: 'Gathering local intelligence & insights…' },
  { emoji: '📅', label: 'Itinerary Planner Agent',     detail: 'Crafting your day-by-day activities…' },
  { emoji: '🏨', label: 'Hotel Concierge Agent',        detail: 'Finding the perfect accommodation…' },
  { emoji: '💰', label: 'Budget Analyst Agent',         detail: 'Estimating costs & budget breakdown…' },
  { emoji: '🍽', label: 'Restaurant Scout Agent',       detail: 'Discovering local food experiences…' },
  { emoji: '✅', label: 'Finalising your trip plan',    detail: 'Assembling everything together…' },
];

// Dark theme styles for GooglePlacesAutocomplete
const placesStyles = {
  control: (base) => ({
    ...base,
    background: '#334155',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    padding: '4px 6px',
    boxShadow: 'none',
    '&:hover': { borderColor: 'rgba(255,255,255,0.25)' },
  }),
  input: (base) => ({ ...base, color: 'white' }),
  singleValue: (base) => ({ ...base, color: 'white' }),
  placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.25)' }),
  menu: (base) => ({
    ...base,
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
  }),
  menuList: (base) => ({ ...base, padding: '4px' }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'rgba(139,92,246,0.12)' : 'transparent',
    color: state.isFocused ? '#8b5cf6' : 'rgba(255,255,255,0.75)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  }),
  indicatorsContainer: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)' }),
  clearIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'white' } }),
  dropdownIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)' }),
  loadingIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)' }),
  loadingMessage: (base) => ({ ...base, color: 'rgba(255,255,255,0.5)' }),
  noOptionsMessage: (base) => ({ ...base, color: 'rgba(255,255,255,0.4)' }),
};

export default function CreateTripPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [destination, setDestination] = useState(null);
  const [days, setDays] = useState('');
  const [budgetType, setBudgetType] = useState('');
  const [travelersType, setTravelersType] = useState('');
  const [interests, setInterests] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [error, setError] = useState('');
  const stepTimerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!generating) {
      clearInterval(stepTimerRef.current);
      setAgentStep(0);
      return;
    }
    const hasFoodInterest = interests.some(i =>
      i.toLowerCase().includes('food') || i.toLowerCase().includes('cuisine') || i.toLowerCase().includes('restaurant')
    );
    const steps = hasFoodInterest ? AGENT_STEPS : AGENT_STEPS.filter((_, i) => i !== 4);
    let current = 0;
    setAgentStep(0);
    stepTimerRef.current = setInterval(() => {
      current = Math.min(current + 1, steps.length - 1);
      setAgentStep(current);
    }, 4000);
    return () => clearInterval(stepTimerRef.current);
  }, [generating, interests]);

  function toggleInterest(interest) {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  }

  async function handleGenerate() {
    if (!destination || !days || !budgetType || !travelersType) {
      setError('Please fill in all required fields.');
      return;
    }
    if (Number(days) < 1 || Number(days) > 30) {
      setError('Days must be between 1 and 30.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const { data } = await api.post('/api/trips', {
        destination: destination.label,
        destinationPlaceId: destination.value?.place_id,
        days: Number(days),
        budgetType,
        travelersType,
        interests,
      });
      router.push(`/trip/${data.trip._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate trip. Please try again.');
      setGenerating(false);
    }
  }

  const hasFoodInterest = interests.some(i =>
    i.toLowerCase().includes('food') || i.toLowerCase().includes('cuisine') || i.toLowerCase().includes('restaurant')
  );
  const activeSteps = hasFoodInterest ? AGENT_STEPS : AGENT_STEPS.filter((_, i) => i !== 4);

  if (authLoading) return null;

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">

      <h1 className="text-3xl font-extrabold text-white mb-2">Plan Your Next Adventure</h1>
      <p className="text-slate-400 text-sm mb-10">Tell us your preferences and AI will craft your perfect itinerary.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-8">
          {error}
        </div>
      )}

      {generating ? (

        /* ── Agent progress card ── */
        <div className="bg-[#1e293b] border border-white/8 rounded-2xl p-8 text-center">
          <div className="mb-6 text-5xl leading-none">{activeSteps[agentStep]?.emoji}</div>
          <h2 className="text-xl font-bold text-white mb-2">{activeSteps[agentStep]?.label}</h2>
          <p className="text-slate-400 text-sm mb-10">{activeSteps[agentStep]?.detail}</p>

          <div className="space-y-3 text-left max-w-sm mx-auto">
            {activeSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  idx < agentStep
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : idx === agentStep
                    ? 'bg-violet-500/20 border border-violet-500/40 text-violet-400'
                    : 'bg-[#334155] border border-white/12 text-slate-500'
                }`}>
                  {idx < agentStep
                    ? '✓'
                    : idx === agentStep
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : idx + 1}
                </div>
                <span className={`text-sm ${
                  idx < agentStep  ? 'text-emerald-400/60 line-through' :
                  idx === agentStep ? 'text-white font-semibold' :
                  'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-10">AI is crafting your perfect itinerary — this takes 20–40 seconds</p>
        </div>

      ) : (

        /* ── Form ── */
        <div className="space-y-10">

          {/* Destination */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 mb-3">
              <MapPin className="w-4 h-4 text-violet-500" /> Where do you want to go?
            </label>
            <GooglePlacesAutocomplete
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}
              selectProps={{
                value: destination,
                onChange: setDestination,
                placeholder: 'Search destination…',
                styles: placesStyles,
              }}
            />
          </div>

          {/* Days */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              How many days? <span className="text-slate-500 font-normal">(1–30)</span>
            </label>
            <input
              type="number"
              min={1} max={30}
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full bg-[#334155] border border-white/12 focus:border-white/30 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors"
              placeholder="e.g. 5"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">What is your budget?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BUDGET_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBudgetType(opt.id)}
                  className={`flex flex-col items-start p-4 border-2 rounded-xl transition-all text-left ${
                    budgetType === opt.id
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/12 bg-[#334155] hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl mb-2">{opt.icon}</span>
                  <span className={`font-bold text-sm ${budgetType === opt.id ? 'text-violet-400' : 'text-white/80'}`}>{opt.title}</span>
                  <span className="text-xs text-slate-400 mt-1">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Travelers */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Who&apos;s travelling?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRAVELER_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTravelersType(opt.id)}
                  className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                    travelersType === opt.id
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/12 bg-[#334155] hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl mb-2">{opt.icon}</span>
                  <span className={`font-semibold text-sm ${travelersType === opt.id ? 'text-violet-400' : 'text-white/75'}`}>{opt.title}</span>
                  <span className="text-xs text-slate-500 mt-0.5">{opt.people} people</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Your interests <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    interests.includes(interest)
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-[#334155] text-white/60 border-white/12 hover:border-white/25 hover:text-white/80'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-bold text-base py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Generate My Trip ✨
          </button>

        </div>
      )}
    </div>
  );
}
