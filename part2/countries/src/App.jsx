import { useState, useEffect } from "react";
import axios from "axios";

const Weather = ({ capital }) => {
  const [weather, setWeather] = useState(null);
  const apiKey = import.meta.env.VITE_WEATHER_KEY;

  useEffect(() => {
    if (!capital || !apiKey) return;

    axios
      .get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(capital)}&units=metric&appid=${apiKey}`,
      )
      .then((response) => {
        setWeather(response.data);
      })
      .catch(() => {
        setWeather(null);
      });
  }, [capital, apiKey]);

  if (!weather) {
    return null;
  }

  const iconCode = weather.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  return (
    <div>
      <h2>Weather in {capital}</h2>
      <div>Temperature {weather.main.temp} Celsius</div>
      <img src={iconUrl} alt={weather.weather[0].description} />
      <div>Wind {weather.wind.speed} m/s</div>
    </div>
  );
};

const CountryDetail = ({ country }) => {
  const languages = country.languages ? Object.values(country.languages) : [];
  const capital = country.capital?.[0];

  return (
    <div>
      <h1>{country.name.common}</h1>
      <div>Capital {capital}</div>
      <div>Area {country.area}</div>

      <h2>Languages</h2>
      <ul>
        {languages.map((lang) => (
          <li key={lang}>{lang}</li>
        ))}
      </ul>

      <img
        src={country.flags.png}
        alt={country.flags.alt || `Flag of ${country.name.common}`}
        width="160"
      />

      <Weather capital={capital} />
    </div>
  );
};

const CountryList = ({
  countries,
  search,
  selectedCountry,
  onSelectCountry,
}) => {
  if (selectedCountry) {
    return <CountryDetail country={selectedCountry} />;
  }

  if (search.trim() === "") {
    return null;
  }

  if (countries.length > 10) {
    return <div>Too many matches, specify another filter</div>;
  }

  if (countries.length > 1) {
    return (
      <div>
        {countries.map((country) => (
          <div key={country.cca3}>
            {country.name.common}{" "}
            <button onClick={() => onSelectCountry(country)}>Show</button>
          </div>
        ))}
      </div>
    );
  }

  if (countries.length === 1) {
    return <CountryDetail country={countries[0]} />;
  }

  return <div>No matches found</div>;
};

const App = () => {
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    axios
      .get("https://studies.cs.helsinki.fi/restcountries/api/all")
      .then((response) => {
        setCountries(response.data);
      });
  }, []);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setSelectedCountry(null);
  };

  const filteredCountries = countries.filter((country) =>
    country.name.common.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div>
      <div>
        find countries <input value={search} onChange={handleSearchChange} />
      </div>

      <CountryList
        countries={filteredCountries}
        search={search}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
      />
    </div>
  );
};

export default App;
