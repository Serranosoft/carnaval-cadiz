// Variables
const mapElement = document.getElementById("map");
const panelElement = document.getElementById("panel");
const panelAgrupacionTemplate = document.getElementById("panel-agrupacion-template");
const panelActuacionTemplate = document.getElementById("panel-actuacion-template");
let map;

// Initialize
init();

function init() {
    renderMap();
    resizeMap();
    renderMarkers();
}

function renderMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-6.2809909, 36.5113303],
        zoom: 16
    });

    const mapCanvasElement = mapElement.querySelector(".maplibregl-canvas");
    mapCanvasElement.addEventListener("click", closePanel);
}

function resizeMap() {
    document.addEventListener("message", function (data) {
        let mapSize = data.data;
        mapElement.style.height = `${mapSize}px`;
    });
}

async function renderMarkers() {
    const data = await fetch("./data.json").then(res => res.json()).then(data => data);

    data.lugares.forEach((lugar) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(https://picsum.photos/60/60/)`;
        el.addEventListener("click", () => openPanel(data.agrupaciones, lugar));

        new maplibregl.Marker({ element: el }).setLngLat([lugar.lng, lugar.lat]).addTo(map);
    })
}

function getAgrupacionesFromLatLng(agrupaciones, lng, lat) {

    let result = [];

    // Encuentra todas las coincidencias de agrupaciones en un lugar en concreto y deja como null las que no.
    result = agrupaciones.map((agrupacion) => {
        const coincidences = agrupacion.actuaciones.filter((actuacion) => actuacion.lugar.lat === lat && actuacion.lugar.lng === lng);
        if (coincidences.length > 0) {
            return { ...agrupacion, actuaciones: coincidences };
        }
        return null;
    })

    // Filtra el resultado para no tener valores nulos
    result = result.filter(agrupacion => agrupacion !== null);

    return result;
}

function openPanel(agrupaciones, lugar) {
    panelElement.classList.add("show");
    const result = getAgrupacionesFromLatLng(agrupaciones, lugar.lng, lugar.lat);
    renderPanelInfo(result);
}

function renderPanelInfo(agrupaciones) {
    agrupaciones.forEach((agrupacion) => {
        const panelAgrupacionElement = panelAgrupacionTemplate.content.cloneNode(true);
        const nombre = panelAgrupacionElement.querySelector(".nombre");
        const apodo = panelAgrupacionElement.querySelector(".apodo");
        const posicion = panelAgrupacionElement.querySelector(".posicion");
        
        nombre.textContent = agrupacion.nombre;
        apodo.textContent = agrupacion.apodo;
        posicion.textContent = agrupacion.posicion;
        
        agrupacion.actuaciones.forEach((actuacion) => {
            const panelActuacionElement = panelActuacionTemplate.content.cloneNode(true);
            const lugar = panelActuacionElement.querySelector(".lugar");
            const fecha = panelActuacionElement.querySelector(".fecha");
            const hora = panelActuacionElement.querySelector(".hora");
            lugar.textContent = actuacion.lugar.nombre;
            fecha.textContent = actuacion.fecha;
            hora.textContent = actuacion.hora;

            panelAgrupacionElement.appendChild(panelActuacionElement);
        })

        panelElement.appendChild(panelAgrupacionElement)
    })

    
}

function closePanel() {
    if (panelElement.classList.contains("show")) {
        panelElement.classList.remove("show");
        panelElement.innerHTML = "";
    }
}