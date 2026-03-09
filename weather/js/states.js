// ===== WEATHER STATES CONFIG =====
// bg gradient = base sky tone; atmosphere.js renders all depth on top
const WEATHER_STATES = {
  sunny: {
    label: 'Sunny',
    desc: 'Clear skies, UV index high',
    icon: '🌤️',
    temp: '24°',
    humidity: '42%',
    wind: '12 km/h',
    visibility: '10 km',
    // Clean cerulean → warmer horizon
    gradient: 'linear-gradient(175deg, #1565a8 0%, #1e78be 30%, #3a9fd4 58%, #e8b455 82%, #d4890a 100%)',
    glowColor: 'rgba(255, 210, 80, 0.65)',
    atmosphere: 'sunny',
    particles: 'none',
    lightning: false,
  },
  cloudy: {
    label: 'Cloudy',
    desc: 'Overcast, mild conditions',
    icon: '🌥️',
    temp: '17°',
    humidity: '68%',
    wind: '18 km/h',
    visibility: '6 km',
    // Cool steel → horizon haze
    gradient: 'linear-gradient(175deg, #253444 0%, #344f66 30%, #577a96 58%, #7ea0b8 82%, #a8c2d5 100%)',
    glowColor: 'rgba(180, 200, 222, 0.5)',
    atmosphere: 'cloudy',
    particles: 'none',
    lightning: false,
  },
  rainy: {
    label: 'Rainy',
    desc: 'Heavy rain, carry an umbrella',
    icon: '🌦️',
    temp: '13°',
    humidity: '91%',
    wind: '24 km/h',
    visibility: '3 km',
    // Near-black navy → deep teal
    gradient: 'linear-gradient(175deg, #090e18 0%, #111e32 28%, #152844 55%, #1a3a5c 80%, #1e4a70 100%)',
    glowColor: 'rgba(46, 125, 168, 0.5)',
    atmosphere: 'rainy',
    particles: 'rain',
    lightning: false,
  },
  stormy: {
    label: 'Stormy',
    desc: 'Severe storm warning issued',
    icon: '⚡',
    temp: '10°',
    humidity: '96%',
    wind: '58 km/h',
    visibility: '1 km',
    // Near-black purple
    gradient: 'linear-gradient(175deg, #06050e 0%, #0e0b20 25%, #160f35 50%, #1f1855 75%, #2a2070 100%)',
    glowColor: 'rgba(99, 90, 220, 0.6)',
    atmosphere: 'stormy',
    particles: 'rain',
    lightning: false, // handled by atmosphere.js
  },
  snowy: {
    label: 'Snowy',
    desc: 'Light snowfall, roads icy',
    icon: '🌨️',
    temp: '−3°',
    humidity: '78%',
    wind: '9 km/h',
    visibility: '4 km',
    // Icy pale blue-white
    gradient: 'linear-gradient(175deg, #c8ddf0 0%, #b8d0ea 28%, #a5c0e0 55%, #b2cce8 80%, #c5daf2 100%)',
    glowColor: 'rgba(160, 210, 250, 0.6)',
    atmosphere: 'snowy',
    particles: 'none',
    lightning: false,
  },
};
