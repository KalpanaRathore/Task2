// src/components/LocationTracker.js
import React, { useState } from 'react';
import axios from 'axios';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        try {
          // Fetch city, state, country using reverse geocoding
          const geoRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
          const addressComponents = geoRes.data.results[0].address_components;
          const city = addressComponents.find(comp => comp.types.includes("locality"))?.long_name || '';
          const state = addressComponents.find(comp => comp.types.includes("administrative_area_level_1"))?.long_name || '';
          const country = addressComponents.find(comp => comp.types.includes("country"))?.long_name || '';

          // Fetch weather data
          const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.REACT_APP_OPENWEATHERMAP_API_KEY}`);
          const weatherData = weatherRes.data;

          setWeather({
            city,
            state,
            country,
            temperature: weatherData.main.temp,
            description: weatherData.weather[0].description,
          });
        } catch (error) {
          setError('Error fetching data. Please try again later.');
          console.error('Error fetching data:', error);
        }
      }, (error) => {
        setError('Geolocation permission denied.');
        console.error('Geolocation error:', error);
      });
    } else {
      setError('Geolocation is not supported by this browser.');
      console.error('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div>
      <button onClick={getLocation}>Obtain Location</button>
      {location && (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ height: "400px", width: "800px" }}
            center={location}
            zoom={10}
          >
            <Marker position={location} />
          </GoogleMap>
        </LoadScript>
      )}
      {weather && (
        <div>
          <p>Location: {weather.city}, {weather.state}, {weather.country}</p>
          <p>Temperature: {weather.temperature}K</p>
          <p>Weather: {weather.description}</p>
        </div>
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default LocationTracker;
