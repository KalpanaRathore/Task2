// src/App.js
import React, { useState } from 'react';
import './App.css'
import axios from 'axios';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [token, setToken] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const register = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/register', credentials);
      alert('Registration successful');
    } catch (error) {
      alert('Registration failed');
    }
  };

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', credentials);
      setToken(res.data.token);
      setUser(credentials.username);
      alert('Login successful');
    } catch (error) {
      alert('Login failed');
    }
  };

  const getLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Get city, state, and country using reverse geocoding
          const geocodeRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
          console.log(geocodeRes)
          
          if (geocodeRes.data.results && geocodeRes.data.results.length > 0) {
            const addressComponents = geocodeRes.data.results[0].address_components;
            const city = addressComponents.find(comp => comp.types.includes('locality'))?.long_name || 'Unknown City';
            const state = addressComponents.find(comp => comp.types.includes('administrative_area_level_1'))?.long_name || 'Unknown State';
            const country = addressComponents.find(comp => comp.types.includes('country'))?.long_name || 'Unknown Country';

            // Get weather data
            const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.REACT_APP_OPENWEATHERMAP_API_KEY}`);
            const weatherData = weatherRes.data;

            // Set location and weather state
            setLocation({ city, state, country, latitude, longitude });
            setWeather(weatherData);

            // Save location to server
            await axios.post('http://localhost:5000/api/location', { city, state, country, latitude, longitude }, { headers: { Authorization: token } });
          } else {
            alert('Unable to retrieve location data');
          }
        } catch (error) {
          console.error('Error fetching location or weather data:', error);
          alert('Error fetching location or weather data');
        }
      }, (error) => {
        console.error('Geolocation error:', error);
        alert('Error obtaining geolocation');
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div>
      {!user ? (
        <div>
          <input type="text" name="username" placeholder="Username" onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} />
          <button onClick={register}>Register</button>
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <div>
          <button onClick={getLocation}>Obtain Location</button>
          {location && (
            <div>
              <h3>Your Location:</h3>
              <p>{`${location.city}, ${location.state}, ${location.country}`}</p>
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{ width: '400px', height: '400px' }}
                  center={{ lat: location.latitude, lng: location.longitude }}
                  zoom={10}
                >
                  <Marker position={{ lat: location.latitude, lng: location.longitude }} />
                </GoogleMap>
              </LoadScript>
              {weather && (
                <div>
                  <h3>Weather Conditions:</h3>
                  <p>{`Temperature: ${Math.round(weather.main.temp - 273.15)}°C`}</p>
                  <p>{`Weather: ${weather.weather[0].description}`}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
