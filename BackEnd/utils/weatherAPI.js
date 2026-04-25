/**
 * Weather API Integration
 * Uses OpenWeatherMap API for real-time weather data
 * 
 * Why OpenWeatherMap?
 * - Free tier available with generous limits
 * - Provides current weather, forecasts, and alerts
 * - Essential for crop recommendations and farming alerts
 * 
 * Integration with MERN:
 * - Backend makes API calls to OpenWeatherMap
 * - Caches results to reduce API calls
 * - Frontend displays weather widgets and alerts
 */

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Safely get API key - checks at call time to handle missing env vars
 */
const getApiKey = () => {
  const key = process.env.WEATHER_API_KEY;
  if (!key || key === 'your_openweather_api_key' || key.trim() === '') {
    console.warn('[WeatherAPI] WEATHER_API_KEY is not configured. Using fallback demo data.');
    return null;
  }
  return key;
};

/**
 * Generate fallback weather data for demo/testing when API is unavailable
 */
const getFallbackWeather = (lat, lon) => {
  console.log(`[WeatherAPI] Using fallback weather data for lat=${lat}, lon=${lon}`);
  return {
    success: true,
    isFallback: true,
    data: {
      temperature: 28.5,
      feelsLike: 30.2,
      humidity: 65,
      pressure: 1013,
      windSpeed: 3.5,
      windDirection: 180,
      description: 'scattered clouds',
      icon: '03d',
      main: 'Clouds',
      visibility: 10000,
      clouds: 40,
      sunrise: Date.now() / 1000 - 21600,
      sunset: Date.now() / 1000 + 21600,
      city: 'Demo City',
      country: 'IN',
      timestamp: Math.floor(Date.now() / 1000),
    },
  };
};

/**
 * Generate fallback forecast data for demo/testing
 */
const getFallbackForecast = () => {
  console.log('[WeatherAPI] Using fallback forecast data');
  const forecast = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    forecast.push({
      date: date.toISOString().split('T')[0],
      avgTemp: (25 + Math.random() * 10).toFixed(1),
      minTemp: (20 + Math.random() * 5).toFixed(1),
      maxTemp: (30 + Math.random() * 8).toFixed(1),
      avgHumidity: Math.round(50 + Math.random() * 30),
      avgWind: (2 + Math.random() * 4).toFixed(1),
      description: i % 2 === 0 ? 'scattered clouds' : 'clear sky',
      icon: i % 2 === 0 ? '03d' : '01d',
    });
  }
  return { success: true, isFallback: true, data: forecast };
};

/**
 * Fetch current weather by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Weather data (never throws)
 */
export const getCurrentWeather = async (lat, lon) => {
  const API_KEY = getApiKey();

  // Return fallback if no API key configured
  if (!API_KEY) {
    return getFallbackWeather(lat, lon);
  }

  try {
    console.log(`[WeatherAPI] Fetching weather for lat=${lat}, lon=${lon}`);
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      { timeout: 8000 }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WeatherAPI] API HTTP error: ${response.status} - ${errorText}`);
      return getFallbackWeather(lat, lon);
    }

    const data = await response.json();
    console.log(`[WeatherAPI] Success - city: ${data.name}, temp: ${data.main?.temp}°C`);

    return {
      success: true,
      data: {
        temperature: data.main?.temp ?? 0,
        feelsLike: data.main?.feels_like ?? 0,
        humidity: data.main?.humidity ?? 0,
        pressure: data.main?.pressure ?? 0,
        windSpeed: data.wind?.speed ?? 0,
        windDirection: data.wind?.deg ?? 0,
        description: data.weather?.[0]?.description ?? 'unknown',
        icon: data.weather?.[0]?.icon ?? '',
        main: data.weather?.[0]?.main ?? 'Unknown',
        visibility: data.visibility ?? 0,
        clouds: data.clouds?.all ?? 0,
        sunrise: data.sys?.sunrise ?? 0,
        sunset: data.sys?.sunset ?? 0,
        city: data.name ?? 'Unknown',
        country: data.sys?.country ?? '',
        timestamp: data.dt ?? Math.floor(Date.now() / 1000),
      },
    };
  } catch (error) {
    console.error('[WeatherAPI] Network/fetch error:', error.message);
    return getFallbackWeather(lat, lon);
  }
};

/**
 * Fetch 5-day weather forecast
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Forecast data (never throws)
 */
export const getWeatherForecast = async (lat, lon) => {
  const API_KEY = getApiKey();

  if (!API_KEY) {
    return getFallbackForecast();
  }

  try {
    console.log(`[WeatherAPI] Fetching forecast for lat=${lat}, lon=${lon}`);
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      { timeout: 8000 }
    );

    if (!response.ok) {
      console.error(`[WeatherAPI] Forecast API HTTP error: ${response.status}`);
      return getFallbackForecast();
    }

    const data = await response.json();

    if (!data.list || !Array.isArray(data.list)) {
      console.error('[WeatherAPI] Invalid forecast response structure');
      return getFallbackForecast();
    }

    // Group forecast by day
    const dailyForecast = {};
    data.list.forEach((item) => {
      const date = item.dt_txt?.split(' ')[0];
      if (!date) return;
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date,
          temps: [],
          descriptions: [],
          icons: [],
          humidity: [],
          wind: [],
        };
      }
      dailyForecast[date].temps.push(item.main?.temp ?? 0);
      dailyForecast[date].descriptions.push(item.weather?.[0]?.description ?? '');
      dailyForecast[date].icons.push(item.weather?.[0]?.icon ?? '');
      dailyForecast[date].humidity.push(item.main?.humidity ?? 0);
      dailyForecast[date].wind.push(item.wind?.speed ?? 0);
    });

    // Calculate daily averages
    const forecast = Object.values(dailyForecast).map((day) => ({
      date: day.date,
      avgTemp: day.temps.length > 0 ? (day.temps.reduce((a, b) => a + b, 0) / day.temps.length).toFixed(1) : '0',
      minTemp: day.temps.length > 0 ? Math.min(...day.temps).toFixed(1) : '0',
      maxTemp: day.temps.length > 0 ? Math.max(...day.temps).toFixed(1) : '0',
      avgHumidity: day.humidity.length > 0 ? Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length) : 0,
      avgWind: day.wind.length > 0 ? (day.wind.reduce((a, b) => a + b, 0) / day.wind.length).toFixed(1) : '0',
      description: day.descriptions[Math.floor(day.descriptions.length / 2)] || '',
      icon: day.icons[Math.floor(day.icons.length / 2)] || '',
    }));

    console.log(`[WeatherAPI] Forecast success - ${forecast.length} days`);
    return { success: true, data: forecast };
  } catch (error) {
    console.error('[WeatherAPI] Forecast fetch error:', error.message);
    return getFallbackForecast();
  }
};

/**
 * Get crop recommendations based on weather
 * Simple rule-based system that NEVER throws errors
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} soilType - Type of soil
 * @returns {Promise<object>} Always returns { success, data } - never throws
 */
export const getCropSuggestion = async (lat, lon, soilType) => {
  try {
    console.log(`[CropSuggestion] lat=${lat}, lon=${lon}, soil=${soilType}`);

    // Validate inputs
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      console.warn('[CropSuggestion] Invalid coordinates, using defaults');
      lat = 20.5937;
      lon = 78.9629;
    }

    // Get weather (always returns data, never throws)
    const weather = await getCurrentWeather(lat, lon);

    // Extract weather data with safe fallbacks
    const temp = weather.data?.temperature ?? 28;
    const humidity = weather.data?.humidity ?? 60;
    const conditions = (weather.data?.main ?? '').toLowerCase();

    // Rule-based recommendation logic
    let suggestions = [];

    if (temp >= 25 && temp <= 35 && humidity > 60) {
      suggestions = ['Rice', 'Sugarcane', 'Cotton', 'Soybean'];
    } else if (temp >= 20 && temp <= 30 && humidity > 40) {
      suggestions = ['Wheat', 'Maize', 'Barley', 'Mustard'];
    } else if (temp >= 15 && temp <= 25) {
      suggestions = ['Potato', 'Peas', 'Cabbage', 'Cauliflower'];
    } else if (temp > 35) {
      suggestions = ['Bajra', 'Jowar', 'Groundnut', 'Sesame'];
    } else {
      suggestions = ['Gram', 'Lentil', 'Peas', 'Linseed'];
    }

    // Adjust based on soil type
    if (soilType && typeof soilType === 'string') {
      const soilMap = {
        clay: ['Rice', 'Wheat', 'Sugarcane'],
        sandy: ['Groundnut', 'Bajra', 'Potato'],
        loamy: ['Maize', 'Cotton', 'Vegetables'],
        black: ['Cotton', 'Soybean', 'Sugarcane'],
        red: ['Groundnut', 'Millets', 'Pulses'],
        alluvial: ['Rice', 'Wheat', 'Sugarcane', 'Vegetables'],
      };

      const soilCrops = soilMap[soilType.toLowerCase()];
      if (soilCrops && Array.isArray(soilCrops)) {
        const filtered = suggestions.filter((crop) => soilCrops.includes(crop));
        if (filtered.length > 0) {
          suggestions = filtered;
        }
      }
    }

    console.log(`[CropSuggestion] Returning ${suggestions.length} suggestions`);

    return {
      success: true,
      data: {
        currentWeather: weather.data,
        suggestedCrops: suggestions.slice(0, 4),
        soilType: soilType || 'Not specified',
        note: weather.isFallback
          ? '⚠️ Using demo weather data (API key not configured). These are general recommendations. Consult a local agricultural expert for precise advice.'
          : 'These are general recommendations. Consult a local agricultural expert for precise advice.',
      },
    };
  } catch (error) {
    // This catch should theoretically never be hit, but it's here as ultimate safety
    console.error('[CropSuggestion] Unexpected error:', error.message);
    return {
      success: true,
      data: {
        currentWeather: {
          temperature: 28,
          humidity: 60,
          description: 'demo data',
          city: 'Demo',
        },
        suggestedCrops: ['Wheat', 'Rice', 'Maize', 'Sugarcane'],
        soilType: soilType || 'Not specified',
        note: 'Using default recommendations due to a system error. Please try again later.',
      },
    };
  }
};


