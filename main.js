// Update Map Size
document.addEventListener("message", function(data) {
    alert(data.data);
});



// Global
const listElement = document.getElementById("list");
const mapElement = document.getElementById("map");

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