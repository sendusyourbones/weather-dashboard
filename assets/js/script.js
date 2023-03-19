// HTML element variables
const searchButton = document.getElementById('search-btn');
const clearButton = document.getElementById('clear-btn');
const searchHistoryEl = document.getElementById('search-history');
const noMatchesEl = document.getElementById('no-matches');
const currentEl = document.getElementById('current');
const forecastHeadEl = document.getElementById('forecast-header');
const forecastRowEl = document.getElementById('forecast-row');

// Local storage variable for search history
let searchHistoryArr = JSON.parse(localStorage.getItem('searchHistory'));

// If local storage search history is empty, create empty array, otherwise show search history
function checkStorage() {
    if (!searchHistoryArr) {
        searchHistoryArr = [];
    } else {
        showHistory();
    }
}

// Create a button for a city in the search-history div
function createCityButton(cityName) {
    const cityButton = document.createElement('button');
    cityButton.setAttribute('type', 'button');
    cityButton.setAttribute('class', 'btn btn-secondary');
    cityButton.textContent = cityName;
    searchHistoryEl.appendChild(cityButton);
}

// Create a button for each city in local storage
function showHistory() {
    searchHistoryArr.forEach((element) => createCityButton(element.city));
}

// Clear search history from local storage
function clearHistory() {
    localStorage.clear();
    location.reload();
}

// Get latitude and longitude of searched city
function getLatLon() {
    // Generate API request URL based on city entered in search
    const cityInput = document.getElementById('city').value;

    const requestUrl = `//api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=1&appid=c5d162e25c0efc91cbc5528544ce5b89`;

    // Clear search field
    document.getElementById('city').value = '';

    // Make API request
    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // If API request returns an empty array, display error message
            if (data.length === 0) {
                noMatchesEl.textContent = `Sorry, we could not find any cities matching ${cityInput}. Please try again. (Note: You must search for a city by name)`
            // Otherwise call functions to get current weather, get forecast, and add searched city to history
            } else {
                getCurrentWeather(data[0].lat, data[0].lon);
                getForecast(data[0].lat, data[0].lon);
                addToHistory(data[0].name, data[0].lat, data[0].lon);
            }  
        });
}

// Add searched city to search history
function addToHistory(cityName, lat, lon) {
    // Put name, latitude, and longitude of searched city into an object
    const currentSearchObj = {};

    currentSearchObj.city = cityName;
    currentSearchObj.lat = lat;
    currentSearchObj.lon = lon;

    // Add object to search history array and add array to local storage
    searchHistoryArr.push(currentSearchObj);

    localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));

    // Create a button for the city in the search-history div
    createCityButton(cityName);
}

// Get current weather for searched city
function getCurrentWeather(lat, lon) {
    // Clear current weather and no matches HTML elements
    currentEl.innerHTML = '';
    noMatchesEl.textContent = '';

    // Generate API request URL using latitude and longitude of searched city
    const requestUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=c5d162e25c0efc91cbc5528544ce5b89`;

    // Make API request
    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Using the returned data, generate HTML elements with current weather in searched city
            currentEl.innerHTML = `
                <div id="current-inner">
                    <h4>${data.name} (${getDate(data.dt, data.timezone)})</h4>
                    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png"/>
                    <p>Temp: ${data.main.temp}\u00B0 F</p>
                    <p>Wind: ${data.wind.speed} MPH</p>
                    <p>Humidity: ${data.main.humidity}%</p>
                </div>
            `;
        });
}

// Get 5-day forecast for searched city
function getForecast(lat, lon) {
    // Clear 5-day forecast HTML elements
    forecastHeadEl.setAttribute('class', 'hidden');
    forecastRowEl.innerHTML = '';

    // Generate API request URL using latitude and longitude of searched city
    const requestUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=c5d162e25c0efc91cbc5528544ce5b89`;
    
    // Make API request
    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Show forecast header
            forecastHeadEl.setAttribute('class', 'visible');

            // Create an array with every 8th forecast from the returned data
            const forecastArray = [];

            for (let i = 7; i < 40; i += 8) {
                forecastArray.push(data.list[i]);
            }

            // For each of the forecasts
            for (let i = 0; i < 5; i++) {
                // Create a div to contain the day's forecast
                const forecastEl = document.createElement('div');
                forecastEl.setAttribute('class', 'col-sm-auto day');

                // Calculate the date
                const forecastDate = getDate(forecastArray[i].dt, data.city.timezone);

                // Using the returned data, generate HTML elements with forecasted weather in searched city and append to forecast row
                forecastEl.innerHTML = `
                    <h4>${forecastDate}</h4>
                    <img src="https://openweathermap.org/img/wn/${forecastArray[i].weather[0].icon}@2x.png"/>
                    <p>Temp: ${forecastArray[i].main.temp}\u00B0 F</p>
                    <p>Wind: ${forecastArray[i].wind.speed} MPH</p>
                    <p>Humidity: ${forecastArray[i].main.humidity}%</p>
                `;
                forecastRowEl.appendChild(forecastEl);
            }
        });
}

// Get date of forecast in searched city's timezone
function getDate(timeSec, offsetSec) {
    // Convert time of weather report in seconds to milliseconds
    // Create Date object from this value
    const dateTime = new Date(timeSec * 1000);
    // Convert to UTC 00:00 by:
    // Getting time in milliseconds since epoch for the Date object
    // Getting the difference in minutes between Date object in UTC time and local time
    // Converting the difference to milliseconds
    // Adding these two values together
    const utc = dateTime.getTime() + (dateTime.getTimezoneOffset() * 60000);
    // Convert timezone offset in seconds to milliseconds
    // Add this to UTC time
    // Create Date object from this
    const dateTimeOffset = new Date(utc + (1000 * offsetSec));
    // Return date string from this new Date object
    return dateTimeOffset.toLocaleDateString();
}

// Search for a city from search history
function searchFromHistory(event) {
    const clickedEl = event.target;

    // If the clicked element was a button
    if (clickedEl.matches('button')) {
        // Find the button's city in local storage
        const clickedCityObj = searchHistoryArr.find((element) => element.city === clickedEl.textContent);

        // Get current weather and 5-day forecast for that city
        getCurrentWeather(clickedCityObj.lat, clickedCityObj.lon);
        getForecast(clickedCityObj.lat, clickedCityObj.lon);
    }
}

// Event listeners
searchButton.addEventListener('click', getLatLon);
clearButton.addEventListener('click', clearHistory);
searchHistoryEl.addEventListener('click', searchFromHistory);

// On page load, check local storage
checkStorage();