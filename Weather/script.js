document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const cityInput = document.getElementById("cityInput");
  const searchBtn = document.getElementById("searchBtn");
  const locationBtn = document.getElementById("locationBtn");
  const loader = document.getElementById("loader");
  const dashboard = document.getElementById("dashboard");
  const errorSection = document.getElementById("error");
  const errorMsg = document.getElementById("errorMsg");

  const unitToggle = document.getElementById("unitToggle");
  const unitLabel = document.getElementById("unitLabel");

  // Weather Data Elements
  const cityNameEl = document.getElementById("cityName");
  const currentDateEl = document.getElementById("currentDate");
  const currentTempEl = document.getElementById("currentTemp");
  const weatherDescEl = document.getElementById("weatherDesc");
  const mainIconEl = document.getElementById("mainIcon");
  const feelsLikeEl = document.getElementById("feelsLike");
  const humidityEl = document.getElementById("humidity");
  const windSpeedEl = document.getElementById("windSpeed");
  const uvIndexEl = document.getElementById("uvIndex");
  const rainEl = document.getElementById("precipitation");
  const pressureEl = document.getElementById("pressure");
  const visibilityEl = document.getElementById("visibility");
  const sunriseEl = document.getElementById("sunrise");
  const hourlyForecastEl = document.getElementById("hourlyForecast");
  const dailyForecastEl = document.getElementById("dailyForecast");

  // State
  let currentData = null;
  let currentUnits = "C"; // C or F
  let currentCity = "";
  let weatherChart = null; // Global chart instance

  // Constants
  const INDIA_DATA = {
    "Karnataka": [
      { "name": "Bagalkote", "talukas": ["Bagalkote", "Jamkhandi", "Mudhol", "Badami", "Bilagi", "Hunagunda", "Ilkal", "Rabkavi Banhatti", "Guledgudda"] },
      { "name": "Ballari", "talukas": ["Ballari", "Kurugodu", "Kampli", "Sanduru", "Siraguppa"] },
      { "name": "Belagavi", "talukas": ["Belagavi", "Athani", "Bailhongal", "Chikkodi", "Gokak", "Khanapura", "Mudalgi", "Nippani", "Rayabaga", "Savadatti", "Ramadurga", "Kagawada", "Hukkeri", "Kitturu"] },
      { "name": "Bengaluru Urban", "talukas": ["Bengaluru North", "Bengaluru South", "Bengaluru East", "Bengaluru West", "Yelahanka", "Anekal"] },
      { "name": "Mysuru", "talukas": ["Mysuru", "Hunsur", "Nanjangud", "Periyapatna", "T. Narasipura"] },
      { "name": "Haveri", "talukas": ["Haveri", "Byadagi", "Hanagal", "Shiggaon", "Ranebennuru"] }
    ],
    "Maharashtra": [
      { "name": "Pune", "talukas": ["Pune City", "Haveli", "Khed", "Baramati", "Shirur", "Ambegaon", "Maval", "Mulshi"] },
      { "name": "Mumbai", "talukas": ["Mumbai City", "Mumbai Suburban", "Borivali", "Andheri", "Kurla"] },
      { "name": "Nagpur", "talukas": ["Nagpur", "Kamthi", "Hingna", "Katol", "Kalameshwar", "Ramtek"] },
      { "name": "Nashik", "talukas": ["Nashik", "Sinnar", "Igatpuri", "Niphad", "Yeola", "Malegaon"] }
    ],
    "Tamil Nadu": [
      { "name": "Chennai", "talukas": ["Chennai", "Egmore", "Mylapore", "Saidapet", "Tondiarpet"] },
      { "name": "Coimbatore", "talukas": ["Coimbatore North", "Coimbatore South", "Mettupalayam", "Pollachi", "Sulur"] },
      { "name": "Madurai", "talukas": ["Madurai North", "Madurai South", "Melur", "Thirumangalam", "Usilampatti"] }
    ]
  };

  const WEATHER_CODES = {
    0: { desc: "Clear sky", icon: "ph-sun", theme: "theme-clear" },
    1: { desc: "Mainly clear", icon: "ph-sun-dim", theme: "theme-clear" },
    2: { desc: "Partly cloudy", icon: "ph-cloud-sun", theme: "theme-cloudy" },
    3: { desc: "Overcast", icon: "ph-cloud", theme: "theme-cloudy" },
    45: { desc: "Fog", icon: "ph-cloud-fog", theme: "theme-cloudy" },
    48: { desc: "Depositing rime fog", icon: "ph-cloud-fog", theme: "theme-cloudy" },
    51: { desc: "Light drizzle", icon: "ph-cloud-rain", theme: "theme-rainy" },
    61: { desc: "Slight rain", icon: "ph-cloud-rain", theme: "theme-rainy" },
    63: { desc: "Moderate rain", icon: "ph-cloud-rain", theme: "theme-rainy" },
    80: { desc: "Rain showers", icon: "ph-cloud-showers", theme: "theme-rainy" },
    95: { desc: "Thunderstorm", icon: "ph-cloud-lightning", theme: "theme-stormy" },
  };

  // UI Elements for Browse
  const browseBtn = document.getElementById("browseBtn");
  const browseModal = document.getElementById("browseModal");
  const closeModal = document.getElementById("closeModal");
  const districtSelect = document.getElementById("districtSelect");
  const talukaSelect = document.getElementById("talukaSelect");
  const applyLocation = document.getElementById("applyLocation");

  // Dashboard Protection & Login Check
  const path = window.location.pathname;
  const isLoginPage = path.includes("login.html") || path.endsWith("/login") || path.endsWith("/login/");
  const isLoggedIn = localStorage.getItem("whether_logged_in");

  if (!isLoginPage && !isLoggedIn) {
    window.location.href = "login.html";
    return; // Stop initialization if redirecting
  } else if (isLoginPage && isLoggedIn) {
    window.location.href = "index.html";
    return;
  }

  // Initialize
  if (dashboard) {
    init();
    initBrowseLogic();
  }

  function initBrowseLogic() {
    if (!browseBtn) return;

    const stateSelect = document.getElementById("stateSelect");

    function updateDistricts() {
      const state = stateSelect.value;
      districtSelect.innerHTML = '<option value="">Select District</option>';
      talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
      talukaSelect.disabled = true;
      applyLocation.disabled = true;

      if (state && INDIA_DATA[state]) {
        INDIA_DATA[state].forEach(d => {
          const option = document.createElement("option");
          option.value = d.name;
          option.textContent = d.name;
          districtSelect.appendChild(option);
        });
      }
    }

    stateSelect.addEventListener("change", updateDistricts);
    updateDistricts(); // Initial load

    browseBtn.addEventListener("click", () => browseModal.classList.remove("hidden"));
    closeModal.addEventListener("click", () => browseModal.classList.add("hidden"));

    districtSelect.addEventListener("change", (e) => {
      const distName = e.target.value;
      const state = stateSelect.value;
      talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
      applyLocation.disabled = true;

      if (distName && state) {
        const district = INDIA_DATA[state].find(d => d.name === distName);
        district.talukas.forEach(t => {
          const option = document.createElement("option");
          option.value = t;
          option.textContent = t;
          talukaSelect.appendChild(option);
        });
        talukaSelect.disabled = false;
      } else {
        talukaSelect.disabled = true;
      }
    });

    talukaSelect.addEventListener("change", (e) => {
      applyLocation.disabled = !e.target.value;
    });

    applyLocation.addEventListener("click", async () => {
      const taluka = talukaSelect.value;
      const district = districtSelect.value;
      const state = stateSelect.value;
      const query = `${taluka}, ${district}, ${state}`;

      browseModal.classList.add("hidden");
      cityInput.value = query;
      handleSearch();
    });
  }

  function init() {
    // Try to get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, "Local Weather");
        },
        () => {
          fetchWeatherByCoords(12.9716, 77.5946, "Bengaluru, Karnataka"); // Default to Bengaluru
        }
      );
    } else {
      fetchWeatherByCoords(12.9716, 77.5946, "Bengaluru, Karnataka");
    }

    // Event Listeners
    if (searchBtn) searchBtn.addEventListener("click", handleSearch);
    if (cityInput) {
      cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
      });
    }
    if (locationBtn) {
      locationBtn.addEventListener("click", () => {
        navigator.geolocation.getCurrentPosition((pos) => {
          fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, "Local Weather");
        });
      });
    }

    if (unitToggle) unitToggle.addEventListener("click", toggleUnits);
  }

  function toggleUnits() {
    currentUnits = currentUnits === "C" ? "F" : "C";
    if (unitLabel) unitLabel.textContent = `°${currentUnits}`;
    if (currentData) updateUI(currentData, currentCity);
  }

  function convertTemp(celsius) {
    if (currentUnits === "C") return Math.round(celsius);
    return Math.round((celsius * 9 / 5) + 32);
  }

  async function handleSearch() {
    const query = cityInput.value.trim();
    if (!query) return;

    showLoading();

    // Attempt 1: Full query (e.g., "Shiggaon, Haveri, Karnataka")
    let results = await performGeocoding(query);

    // Attempt 2: Fallback to Taluka + District (e.g., "Shiggaon, Haveri")
    if (results.length === 0 && query.includes(',')) {
      const parts = query.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        results = await performGeocoding(`${parts[0]}, ${parts[1]}`);
      }
    }

    // Attempt 3: Fallback to just the Taluka (e.g., "Shiggaon")
    if (results.length === 0 && query.includes(',')) {
      const primaryName = query.split(',')[0].trim();
      results = await performGeocoding(primaryName);
    }

    if (results.length === 0) {
      showError("Location not found. Please try a simpler name.");
      return;
    }

    const city = results[0];
    let locationLabel = city.name;
    if (city.admin3 && city.admin3 !== city.name) locationLabel = `${city.name}, ${city.admin3}`;
    if (city.admin2 && city.admin2 !== city.admin3) locationLabel += `, ${city.admin2}`;
    if (city.admin1) locationLabel += `, ${city.admin1}`;

    fetchWeatherByCoords(city.latitude, city.longitude, locationLabel);
  }

  async function performGeocoding(name) {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      return geoData.results || [];
    } catch (err) {
      console.error("Geocoding error:", err);
      return [];
    }
  }

  async function fetchWeatherByCoords(lat, lon, cityName) {
    showLoading();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,precipitation_probability,surface_pressure,visibility&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=7`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      currentData = data;
      currentCity = cityName;
      updateUI(data, cityName);
    } catch (err) {
      showError("Failed to fetch weather data.");
    }
  }

  function updateUI(data, cityName) {
    const current = data.current;
    const weather = WEATHER_CODES[current.weather_code] || { desc: "Unknown", icon: "ph-cloud", theme: "theme-default" };

    // Basic Info
    if (cityNameEl) cityNameEl.textContent = cityName;
    if (currentDateEl) {
      currentDateEl.textContent = `${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (currentTempEl) currentTempEl.textContent = convertTemp(current.temperature_2m);
    if (weatherDescEl) weatherDescEl.textContent = weather.desc;

    // Icon & Theme
    if (mainIconEl) mainIconEl.className = `ph ${weather.icon}`;
    document.body.className = weather.theme;

    // Metrics
    if (feelsLikeEl) feelsLikeEl.textContent = `${convertTemp(current.apparent_temperature)}°`;
    if (humidityEl) humidityEl.textContent = `${current.relative_humidity_2m}%`;
    if (windSpeedEl) windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
    if (uvIndexEl) uvIndexEl.textContent = data.daily.uv_index_max[0];
    if (rainEl) rainEl.textContent = `${current.precipitation_probability}%`;
    if (pressureEl) pressureEl.textContent = `${Math.round(current.surface_pressure)} hPa`;
    if (visibilityEl) visibilityEl.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    if (sunriseEl && data.daily.sunrise[0]) {
      const sunriseTime = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      sunriseEl.textContent = sunriseTime;
    }

    // Update Trend Chart
    updateTrendChart(data);

    // Hourly Forecast
    if (hourlyForecastEl) {
      hourlyForecastEl.innerHTML = "";
      const now = new Date();
      const currentHour = now.getHours();

      for (let i = currentHour; i < currentHour + 12; i++) {
        const temp = data.hourly.temperature_2m[i];
        const code = data.hourly.weather_code[i];
        const wInfo = WEATHER_CODES[code] || { icon: "ph-cloud" };
        const time = i % 24;
        const ampm = time >= 12 ? 'PM' : 'AM';
        const displayTime = `${time % 12 || 12} ${ampm}`;

        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
                  <span class="time">${displayTime}</span>
                  <i class="ph ${wInfo.icon}"></i>
                  <span class="temp">${convertTemp(temp)}°</span>
              `;
        hourlyForecastEl.appendChild(card);
      }
    }

    // Daily Forecast
    if (dailyForecastEl) {
      dailyForecastEl.innerHTML = "";
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 1; i < 7; i++) {
        const max = data.daily.temperature_2m_max[i];
        const min = data.daily.temperature_2m_min[i];
        const code = data.daily.weather_code[i];
        const wInfo = WEATHER_CODES[code] || { icon: "ph-cloud" };
        const dayIndex = (new Date().getDay() + i) % 7;

        const card = document.createElement("div");
        card.className = "daily-card";
        card.innerHTML = `
                  <div class="daily-info">
                       <span class="day">${days[dayIndex]}</span>
                       <i class="ph ${wInfo.icon}"></i>
                  </div>
                  <div class="daily-temps">
                       <span class="max">${convertTemp(max)}°</span>
                       <span class="min">${convertTemp(min)}°</span>
                  </div>
              `;
        dailyForecastEl.appendChild(card);
      }
    }

    showDashboard();
  }

  function updateTrendChart(data) {
    const ctx = document.getElementById('tempChart');
    if (!ctx) return;

    const now = new Date();
    const currentHour = now.getHours();

    // Prepare 24h data
    const labels = [];
    const temps = [];

    for (let i = currentHour; i < currentHour + 24; i++) {
      const time = i % 24;
      const ampm = time >= 12 ? 'pm' : 'am';
      const displayTime = `${time % 12 || 12}${ampm}`;
      labels.push(displayTime);
      temps.push(convertTemp(data.hourly.temperature_2m[i]));
    }

    if (weatherChart) {
      weatherChart.data.labels = labels;
      weatherChart.data.datasets[0].data = temps;
      weatherChart.update();
    } else {
      weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Temperature',
            data: temps,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#0ea5e9',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#0f172a',
              bodyColor: '#0ea5e9',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (context) => `${context.parsed.y}°${currentUnits}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8
              }
            },
            y: {
              grid: {
                color: 'rgba(226, 232, 240, 0.5)',
                drawBorder: false
              },
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: (value) => `${value}°`
              }
            }
          }
        }
      });
    }
  }

  function showLoading() {
    loader.classList.remove("hidden");
    dashboard.classList.add("hidden");
    errorSection.classList.add("hidden");
  }

  function showDashboard() {
    loader.classList.add("hidden");
    dashboard.classList.remove("hidden");
    errorSection.classList.add("hidden");
  }

  function showError(msg) {
    if (loader) loader.classList.add("hidden");
    if (dashboard) dashboard.classList.add("hidden");
    if (errorSection) {
      errorSection.classList.remove("hidden");
      if (errorMsg) errorMsg.textContent = msg;
    }
  }

  // Login Handling
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // Mock validation
      if (email && password.length >= 6) {
        localStorage.setItem("whether_logged_in", "true");
        window.location.href = "index.html";
      } else {
        alert("Please enter a valid email and a password with at least 6 characters.");
      }
    });
  }

  // Logout Handling
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("whether_logged_in");
      window.location.href = "login.html";
    });
  }
});
