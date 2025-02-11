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

async function init() {
    await handleParams();
    resizeMap();
    renderMarkers();
}

async function handleParams() {
    const params = new URLSearchParams(window.location.search);
    const calle = params.get('calle');
    const data = await fetch("./data.json").then(res => res.json()).then(data => data);
    const lugar = data.lugares.find((lugar) => lugar.nombre === calle);

    if (calle) {
        renderMap([lugar.lng, lugar.lat], 15);
        openPanel(data.agrupaciones, lugar);
    } else {
        renderMap([-6.2809909, 36.5113303], 12.75);
    }

}

function renderMap(coords, zoom) {
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: coords,
        zoom: zoom
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
    return agrupaciones
    .map(agrupacion => {
      // Filtramos las actuaciones que tienen al menos un metadata con la latitud y longitud dadas
      const actuacionesFiltradas = agrupacion.actuaciones
        .map(actuacion => {
          // Filtramos solo los metadata que coinciden con lat y lng
          const metadataFiltrada = actuacion.metadata.filter(meta => 
            meta.lat === lat && meta.lng === lng
          );

          // Si hay metadata coincidentes, devolvemos la actuación con solo esos metadata
          return metadataFiltrada.length > 0 
            ? { ...actuacion, metadata: metadataFiltrada } 
            : null;
        })
        .filter(actuacion => actuacion !== null); // Eliminamos actuaciones vacías

      // Si hay actuaciones válidas, devolvemos la agrupación con solo esas actuaciones
      return actuacionesFiltradas.length > 0 
        ? { ...agrupacion, actuaciones: actuacionesFiltradas } 
        : null;
    })
    .filter(agrupacion => agrupacion !== null); // Eliminamos agrupaciones vacías
}

function openPanel(agrupaciones, lugar) {
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

        // const actuacionesTitle = document.createElement("span");
        // actuacionesTitle.classList.add("text");
        // actuacionesTitle.textContent = "Horarios"
        // actuaciones.appendChild(actuacionesTitle)

        agrupacion.actuaciones.forEach((actuacion) => {
            const panelActuacionFragment = panelActuacionTemplate.content.cloneNode(true);
            const panelActuacionElement = panelActuacionFragment.querySelector(".panel-actuaciones-item");

            const fecha = panelActuacionFragment.querySelector(".fecha");
            fecha.textContent = actuacion.fecha;

            actuacion.metadata.forEach((metadata) => {
                const hora = document.createElement("span");
                hora.classList.add("muted");
                hora.textContent = metadata.hora;
                panelActuacionElement.appendChild(hora);
            })


            actuaciones.appendChild(panelActuacionElement);
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