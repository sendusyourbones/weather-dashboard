const searchButton = document.getElementById('search-btn');
const clearButton = document.getElementById('clear-btn');
const searchHistoryEl = document.getElementById('search-history');
const currentEl = document.getElementById('current');
const forecastHeadEl = document.getElementById('forecast-header');
const forecastRowEl = document.getElementById('forecast-row');

let searchHistoryArr = JSON.parse(localStorage.getItem('searchHistory'));

function checkStorage() {
    if (!searchHistoryArr) {
        searchHistoryArr = [];
    } else {
        showHistory();
    }
}

function createCityButton(cityName) {
    const cityButton = document.createElement('button');
    cityButton.setAttribute('type', 'button');
    cityButton.setAttribute('class', 'btn btn-secondary');
    cityButton.textContent = cityName;
    searchHistoryEl.appendChild(cityButton);
}

function showHistory() {
    searchHistoryArr.forEach((element) => createCityButton(element.city));
}

function clearHistory() {
    localStorage.clear();
    searchHistoryEl.innerHTML = '';
}

function getLatLon() {
    const cityInput = document.getElementById('city').value;

    const requestUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${ cityInput }&limit=1&appid=c5d162e25c0efc91cbc5528544ce5b89`;

    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            getCurrentWeather(data[0].lat, data[0].lon);
            getForecast(data[0].lat, data[0].lon);
            addToHistory(data[0].name, data[0].lat, data[0].lon);
        });
}

function addToHistory(cityName, lat, lon) {
    const currentSearchObj = {};

    currentSearchObj.city = cityName;
    currentSearchObj.lat = lat;
    currentSearchObj.lon = lon;

    searchHistoryArr.push(currentSearchObj);

    localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));

    createCityButton(cityName);
}

function getCurrentWeather(lat, lon) {
    currentEl.innerHTML = '';

    const requestUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=c5d162e25c0efc91cbc5528544ce5b89`;

    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            currentEl.innerHTML = `
                <h2>${ data.name } (${ getDate(data.dt, data.timezone) })</h2>
                <p>Temp: ${data.main.temp}\u00B0 F</p>
                <p>Wind: ${data.wind.speed} MPH</p>
                <p>Humidity: ${data.main.humidity}%</p>
            `;
        });
}

function getForecast(lat, lon) {
    forecastHeadEl.setAttribute('class', 'hidden');
    forecastRowEl.innerHTML = '';

    const requestUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=c5d162e25c0efc91cbc5528544ce5b89`;
    
    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            forecastHeadEl.setAttribute('class', 'visible');

            const forecastArray = [];

            for (let i = 7; i < 40; i += 8) {
                forecastArray.push(data.list[i]);
            }

            for (let i = 0; i < 5; i++) {
                const forecastEl = document.createElement('div');
                forecastEl.setAttribute('class', `col-xs-10 col-lg day`);

                const forecastDate = getDate(forecastArray[i].dt, data.city.timezone);

                forecastEl.innerHTML = `
                    <h4>${ forecastDate }</h4>
                    <img src="https://openweathermap.org/img/wn/${ forecastArray[i].weather[0].icon }@2x.png"/>
                    <p>Temp: ${ forecastArray[i].main.temp }\u00B0 F</p>
                    <p>Wind: ${ forecastArray[i].wind.speed } MPH</p>
                    <p>Humidity: ${ forecastArray[i].main.humidity }%</p>
                `;
                forecastRowEl.appendChild(forecastEl);
            }
        });
}

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

function searchFromHistory(event) {
    const clickedEl = event.target;
    if (clickedEl.matches('button')) {
        const clickedCityObj = searchHistoryArr.find((element) => element.city === clickedEl.textContent);
        getCurrentWeather(clickedCityObj.lat, clickedCityObj.lon);
        getForecast(clickedCityObj.lat, clickedCityObj.lon);
    }
}

searchButton.addEventListener('click', getLatLon);
clearButton.addEventListener('click', clearHistory);
searchHistoryEl.addEventListener('click', searchFromHistory);

checkStorage();