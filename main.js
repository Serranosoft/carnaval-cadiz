// Global
const listElement = document.getElementById("list");
const mapElement = document.getElementById("map");

// Update Map Size
let mapSize = 900;
document.addEventListener("message", function(data) {
    mapSize = data.data;
});
mapElement.style.height = `${mapSize}px`;

// Toggle Map/List

const toggleMapElement = document.getElementById("toggle-map");
toggleMapElement.addEventListener("click", () => {
    listElement.classList.add("hidden");
    mapElement.classList.add("show");
})

const toggleListElement = document.getElementById("toggle-list");
toggleListElement.addEventListener("click", () => {
    listElement.classList.remove("hidden");
    mapElement.classList.remove("show");
})