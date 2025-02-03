// Global
const listElement = document.getElementById("list");
const mapElement = document.getElementById("map");

// Update Map Size
let mapSize = 900;
document.addEventListener("message", function(data) {
    mapSize = data.data;
});
mapElement.style.height = `${mapSize}px`;