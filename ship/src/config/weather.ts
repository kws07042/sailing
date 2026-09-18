export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'sunset' | 'night';

export const WEATHER_LABELS: Record<WeatherKind, string> = {
  clear: '☀ Clear',
  cloudy: '☁ Cloudy',
  rain: '🌧 Rain',
  storm: '⛈ Storm',
  fog: '🌫 Fog',
  sunset: '🌅 Sunset',
  night: '🌙 Night'
};
