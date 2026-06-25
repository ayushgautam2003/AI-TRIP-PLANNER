'use client';
import { useEffect, useState } from 'react';
import { Wind, Droplets, Eye } from 'lucide-react';

function weatherEmoji(code) {
  const c = Number(code);
  if (c === 113) return '☀️';
  if (c === 116) return '⛅';
  if (c === 119 || c === 122) return '☁️';
  if ([143, 248, 260].includes(c)) return '🌫️';
  if ([176, 263, 266, 293, 296, 299, 302].includes(c)) return '🌦️';
  if ([305, 308, 311, 314, 353, 356, 359].includes(c)) return '🌧️';
  if ([200, 386, 389, 392, 395].includes(c)) return '⛈️';
  if ([179, 182, 185, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371].includes(c)) return '❄️';
  return '🌤️';
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherWidget({ destination }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!destination) return;
    const city = destination.split(',')[0].trim();
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then(r => r.json())
      .then(data => setWeather(data))
      .catch(() => setError(true));
  }, [destination]);

  if (error || !weather) return null;

  const current = weather.current_condition?.[0];
  const forecast = weather.weather?.slice(0, 3) || [];
  if (!current) return null;

  const tempC = current.temp_C;
  const desc = current.weatherDesc?.[0]?.value || '';
  const humidity = current.humidity;
  const windKph = current.windspeedKmph;
  const visKm = current.visibility;
  const code = current.weatherCode;

  return (
    <div className="bg-linear-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sky-200 text-xs font-semibold uppercase tracking-wide mb-1">Live Weather · {destination.split(',')[0]}</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-extrabold leading-none">{tempC}°C</span>
            <span className="text-2xl mb-1">{weatherEmoji(code)}</span>
          </div>
          <p className="text-sky-100 text-sm mt-1">{desc}</p>
        </div>
        <div className="text-right space-y-1.5 mt-1">
          <div className="flex items-center justify-end gap-1.5 text-xs text-sky-100">
            <Droplets className="w-3.5 h-3.5" /> {humidity}% humidity
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-sky-100">
            <Wind className="w-3.5 h-3.5" /> {windKph} km/h
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-sky-100">
            <Eye className="w-3.5 h-3.5" /> {visKm} km visibility
          </div>
        </div>
      </div>

      {/* 3-day forecast */}
      {forecast.length > 0 && (
        <div className="border-t border-white/20 pt-3 grid grid-cols-3 gap-2">
          {forecast.map((day, i) => {
            const date = new Date(day.date);
            const dayName = i === 0 ? 'Today' : DAY_NAMES[date.getDay()];
            const icon = weatherEmoji(day.hourly?.[4]?.weatherCode || 113);
            return (
              <div key={i} className="text-center">
                <p className="text-sky-200 text-xs mb-1">{dayName}</p>
                <p className="text-lg">{icon}</p>
                <p className="text-xs font-semibold">{day.maxtempC}° <span className="text-sky-300 font-normal">{day.mintempC}°</span></p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
