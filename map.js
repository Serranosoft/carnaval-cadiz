// Variables
const mapElement = document.getElementById("map");
const panelElement = document.getElementById("panel");
const panelWrapperElement = panelElement.querySelector(".wrapper");
const panelContentElement = panelElement.querySelector(".content");
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
        zoom: 12.75
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
    console.log(agrupaciones);
    panelElement.classList.add("show");
    const result = getAgrupacionesFromLatLng(agrupaciones, lugar.lng, lugar.lat);
    renderPanelInfo(result, lugar.nombre);
}

function renderPanelInfo(agrupaciones, lugar) {
    const calle = document.createElement("span");
    calle.classList.add("text", "calle");
    calle.textContent = lugar;
    panelWrapperElement.appendChild(calle);

    agrupaciones.forEach((agrupacion) => {
        const panelAgrupacionFragment = panelAgrupacionTemplate.content.cloneNode(true);
        const panelAgrupacionElement = panelAgrupacionFragment.querySelector(".panel-agrupacion");
        const img = panelAgrupacionFragment.querySelector("img");
        const nombre = panelAgrupacionFragment.querySelector(".nombre");
        const apodo = panelAgrupacionFragment.querySelector(".apodo");
        const posicion = panelAgrupacionFragment.querySelector(".posicion");

        img.src = agrupacion.imagen;
        nombre.textContent = agrupacion.nombre;
        apodo.textContent = agrupacion.apodo;
        posicion.textContent = agrupacion.posicion;

        const actuaciones = document.createElement("div");
        actuaciones.classList.add("panel-actuaciones");

        const actuacionesTitle = document.createElement("span");
        actuacionesTitle.classList.add("text");
        actuacionesTitle.textContent = "Horarios"
        actuaciones.appendChild(actuacionesTitle)

        agrupacion.actuaciones.forEach((actuacion) => {
            const panelActuacionFragment = panelActuacionTemplate.content.cloneNode(true);
            
            const fecha = panelActuacionFragment.querySelector(".fecha");
            const hora = panelActuacionFragment.querySelector(".hora");
            
            fecha.textContent = actuacion.fecha;
            hora.textContent = `a las ${actuacion.hora}`;
            
            actuaciones.appendChild(panelActuacionFragment);
        })
        
        panelAgrupacionElement.appendChild(actuaciones);
        panelContentElement.appendChild(panelAgrupacionElement)
    })


}

function closePanel() {
    if (panelElement.classList.contains("show")) {
        panelElement.classList.remove("show");
        panelWrapperElement.lastElementChild.remove();
        panelContentElement.innerHTML = "";
    }
}