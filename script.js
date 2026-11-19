
/* =====================================
   1. HTML ELEMENTS
===================================== */

const searchInput = document.getElementById("searchInput");

const searchBtn = document.getElementById("searchBtn");

const countriesContainer = document.getElementById("countriesContainer");

const regionFilter = document.getElementById("regionFilter");

const sortSelect = document.getElementById("sortSelect");

const favoritesBtn = document.getElementById("favoritesBtn");


/* =====================================
   2. VARIABLES
===================================== */

let countries = [];

let populations = [];

let regions = {};

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let showFavorites = false;


/* =====================================
   3. LOAD COUNTRIES FROM API
===================================== */

async function loadCountries() {

    countriesContainer.textContent = "Loading countries...";

    try {

        // Get countries and capitals

        const response = await fetch(
            "https://countriesnow.space/api/v0.1/countries/capital"
        );

        if (!response.ok) {
            throw new Error("Failed to load countries");
        }

        const data = await response.json();

        if (data.error || !Array.isArray(data.data)) {
            throw new Error("Invalid countries data");
        }

        countries = data.data;


        // Get population

        try {

            const populationResponse = await fetch(
                "https://countriesnow.space/api/v0.1/countries/population"
            );

            if (!populationResponse.ok) {
                throw new Error("Failed to load population");
            }

            const populationData = await populationResponse.json();

            if (!populationData.error && Array.isArray(populationData.data)) {
                populations = populationData.data;
            }

        } catch (error) {

            console.error("Population error:", error);

        }

        
        // Get regions from local JSON

        try {

            const regionResponse = await fetch("./regions.json");

            if (!regionResponse.ok) {
                throw new Error("Failed to load regions");
            }

            regions = await regionResponse.json();

        } catch (error) {

            console.error("Region error:", error);

        }


        // Display countries

        updateCountries();

    } catch (error) {

        countriesContainer.textContent = "Failed to load countries";

        console.error("Countries error:", error);

    }

}


/* =====================================
   4. GET COUNTRY POPULATION
===================================== */

function getPopulation(country) {

    const populationCountry = populations.find(function(item) {

        return item.country.toLowerCase() === country.name.toLowerCase();

    });

    if (populationCountry && populationCountry.populationCounts.length > 0) {

        const populationList = populationCountry.populationCounts;

        const latestPopulation = populationList[populationList.length - 1];

        return latestPopulation.value;

    }

    return 0;

}


/* =====================================
   5. DISPLAY COUNTRY CARD
===================================== */

function displayCountry(country) {

    // Create HTML elements

    const card = document.createElement("div");

    const title = document.createElement("h2");

    const capital = document.createElement("p");

    const population = document.createElement("p");

    const region = document.createElement("p");

    const flag = document.createElement("img");

    const favoriteBtn = document.createElement("button");


    // Country name

    title.textContent = country.name;


    // Capital

    capital.textContent = "Capital: " + (country.capital || "Unknown");


    // Flag

    if (country.iso2) {

        flag.src = "https://flagcdn.com/w320/" +
            country.iso2.toLowerCase() + ".png";

        flag.alt = "Flag of " + country.name;

    }


    // Population

    const countryPopulation = getPopulation(country);

    if (countryPopulation > 0) {

        population.textContent = "Population: " +
            countryPopulation.toLocaleString();

    } else {

        population.textContent = "Population: No data";

    }


    // Region

    let countryRegion = "Unknown";

    if (country.iso2) {

        countryRegion = regions[country.iso2.toLowerCase()] || "Unknown";

    }

    region.textContent = "Region: " + countryRegion;


    // Favorite button text

    if (favorites.includes(country.name)) {

        favoriteBtn.textContent = "Remove from Favorites";

    } else {

        favoriteBtn.textContent = "Add to Favorites";

    }


    // Favorite button click

    favoriteBtn.addEventListener("click", function() {

        if (favorites.includes(country.name)) {

            favorites = favorites.filter(function(name) {

                return name !== country.name;

            });

            favoriteBtn.textContent = "Add to Favorites";

        } else {

            favorites.push(country.name);

            favoriteBtn.textContent = "Remove from Favorites";

        }


        // Save favorites

        localStorage.setItem(
            "favorites",
            JSON.stringify(favorites)
        );


        // Update favorite countries view

        if (showFavorites) {

            updateCountries();

        }

    });


    // Add elements to card

    if (country.iso2) {
        card.appendChild(flag);
    }

    card.appendChild(title);

    card.appendChild(capital);

    card.appendChild(population);

    card.appendChild(region);

    card.appendChild(favoriteBtn);


    // Add card to page

    countriesContainer.appendChild(card);

}


/* =====================================
   6. SEARCH, FILTER AND SORT
===================================== */

function updateCountries() {

    // Get values from HTML

    const countryName = searchInput.value.trim().toLowerCase();

    const selectedRegion = regionFilter.value;

    const sortType = sortSelect.value;


    // Copy countries array

    let result = [...countries];


    // Search countries

    if (countryName !== "") {

        result = result.filter(function(country) {

            return country.name.toLowerCase().includes(countryName);

        });

    }


    // Filter by region

    if (selectedRegion !== "All") {

        result = result.filter(function(country) {

            if (!country.iso2) {
                return false;
            }

            return regions[country.iso2.toLowerCase()] === selectedRegion;

        });

    }


    // Filter favorites

    if (showFavorites) {

        result = result.filter(function(country) {

            return favorites.includes(country.name);

        });

    }


    // Sort A to Z

    if (sortType === "az") {

        result.sort(function(a, b) {

            return a.name.localeCompare(b.name);

        });

    }


    // Sort Z to A

    else if (sortType === "za") {

        result.sort(function(a, b) {

            return b.name.localeCompare(a.name);

        });

    }


    // Sort population high to low

    else if (sortType === "populationHigh") {

        result.sort(function(a, b) {

            return getPopulation(b) - getPopulation(a);

        });

    }


    // Sort population low to high

    else if (sortType === "populationLow") {

        result.sort(function(a, b) {

            return getPopulation(a) - getPopulation(b);

        });

    }


    // Clear previous results

    countriesContainer.innerHTML = "";


    // No countries found

    if (result.length === 0) {

        countriesContainer.textContent = "No countries found";

        return;

    }


    // Display results

    result.forEach(function(country) {

        displayCountry(country);

    });

}


/* =====================================
   7. EVENT LISTENERS
===================================== */

// Search button

searchBtn.addEventListener("click", updateCountries);


// Search when pressing Enter

searchInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        updateCountries();

    }

});


// Region filter

regionFilter.addEventListener("change", updateCountries);


// Sorting

sortSelect.addEventListener("change", updateCountries);


// Favorites button

favoritesBtn.addEventListener("click", function() {

    showFavorites = !showFavorites;

    if (showFavorites) {

        favoritesBtn.textContent = "Show All";

    } else {

        favoritesBtn.textContent = "Favorites";

    }

    updateCountries();

});


/* =====================================
   8. START APPLICATION
===================================== */

loadCountries();
