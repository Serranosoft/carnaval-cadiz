// Variables
const mapElement = document.getElementById("map");
const panelElement = document.getElementById("panel");
const panelWrapperElement = panelElement.querySelector(".wrapper");
const panelContentElement = panelElement.querySelector(".content");
const panelCalleElement = panelElement.querySelector(".calle");
const panelHandleElement = panelElement.querySelector(".sheet-handle");
const panelAgrupacionTemplate = document.getElementById("panel-agrupacion-template");
const panelActuacionTemplate = document.getElementById("panel-actuacion-template");
let map;

// Initialize
init();

async function init() {
    await handleParams();
    resizeMap();
    renderMarkers();

    // Add interactions
    // Add interactions
    if (panelHandleElement && panelCalleElement) {
        let panelMaxHeight, peekViewHeight, peekTranslateY;

        const updateBreakpoints = () => {
            panelMaxHeight = Math.round(window.innerHeight * 0.92);
            peekViewHeight = Math.round(window.innerHeight * 0.40);
            peekTranslateY = panelMaxHeight - peekViewHeight;

            // Set CSS variable for strict pixel alignment
            panelElement.style.setProperty("--peek-offset", `${peekTranslateY}px`);
            panelElement.style.setProperty("--panel-height", `${panelMaxHeight}px`);
        };

        window.addEventListener("resize", updateBreakpoints);
        updateBreakpoints(); // Initial calculation

        panelHandleElement.addEventListener("click", togglePanelSize);

        let startY, currentY, initialTranslateY, startTime;

        const getTranslateY = (el) => {
            const style = window.getComputedStyle(el);
            const matrix = new WebKitCSSMatrix(style.transform);
            return matrix.m42;
        };

        const onTouchStart = (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
            initialTranslateY = getTranslateY(panelElement);
            panelElement.classList.add("dragging");
        };

        const onTouchMove = (e) => {
            if (startY === undefined) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            let newTranslateY = initialTranslateY + deltaY;

            // Constrain movement
            if (newTranslateY < 0) newTranslateY = newTranslateY * 0.2; // Rubber band effect at top
            if (newTranslateY > panelMaxHeight) newTranslateY = panelMaxHeight + (newTranslateY - panelMaxHeight) * 0.2;

            panelElement.style.transform = `translateY(${Math.round(newTranslateY)}px)`; // Round for sharpness during drag
        };

        const onTouchEnd = (e) => {
            if (startY === undefined) return;
            panelElement.classList.remove("dragging");
            panelElement.style.transform = ""; // Remove inline style to let classes take over

            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            const totalDelta = endY - startY;
            const duration = endTime - startTime;
            const velocity = totalDelta / duration; // px/ms
            const currentPos = initialTranslateY + totalDelta;

            // Snapping logic
            panelElement.classList.remove("show", "full");

            // Velocity-based snapping (Flick detection)
            if (velocity > 0.5) { // Fast flick down
                closePanel();
                startY = undefined;
                return;
            } else if (velocity < -0.5) { // Fast flick up
                panelElement.classList.add("show", "full");
                startY = undefined;
                return;
            }

            // Position-based snapping
            if (currentPos < peekTranslateY / 2) {
                panelElement.classList.add("show", "full"); // Full state
            } else if (currentPos < (panelMaxHeight + peekTranslateY) / 2) {
                panelElement.classList.add("show"); // Peek state
            } else {
                closePanel(); // Hidden state
            }

            startY = undefined;
        };

        [panelHandleElement, panelCalleElement].forEach(el => {
            el.addEventListener("touchstart", onTouchStart, { passive: true });
            el.addEventListener("touchmove", onTouchMove, { passive: true });
            el.addEventListener("touchend", onTouchEnd, { passive: true });
        });
    }
}

function togglePanelSize() {
    panelElement.classList.toggle("full");
}

async function handleParams() {
    const params = new URLSearchParams(window.location.search);
    const calle = params.get('calle');
    const data = await fetch("./data.json").then(res => res.json()).then(data => data);
    const lugar = data.lugares.find((lugar) => lugar.nombre === calle);

    if (calle && lugar) {
        renderMap([lugar.lng, lugar.lat], 15);
        openPanel(data.agrupaciones, lugar);
        panelElement.classList.add("full"); // Auto-expand when linking from detailed view
    } else {
        renderMap([-6.298469, 36.531949], 13.60);
    }

}

function renderMap(coords, zoom) {
    if (!map) {
        map = new maplibregl.Map({
            container: 'map',
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: coords,
            zoom: zoom
        });

        const mapCanvasElement = mapElement.querySelector(".maplibregl-canvas");
        mapCanvasElement.addEventListener("click", () => {
            closePanel();
        });
    } else {
        map.setCenter(coords);
        map.setZoom(zoom);
    }
}

function resizeMap() {
    // Usually only needed if communicating with a wrapper app
    document.addEventListener("message", function (data) {
        let mapSize = data.data;
        if (mapSize) mapElement.style.height = `${mapSize}px`;
    });
}

async function renderMarkers() {
    const data = await fetch("./data.json").then(res => res.json()).then(data => data);

    data.lugares.forEach((lugar) => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        // Classic Pin SVG with Primary Color (#800020)
        el.innerHTML = `
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16344 0 0 7.16344 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16344 24.8366 0 16 0ZM16 23.5C11.8579 23.5 8.5 20.1421 8.5 16C8.5 11.8579 11.8579 8.5 16 8.5C20.1421 8.5 23.5 11.8579 23.5 16C23.5 20.1421 20.1421 23.5 16 23.5Z" fill="#800020" stroke="#ffffff" stroke-width="1.5"/>
            </svg>
        `;

        el.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent map click from closing immediately
            closePanel(); // Close first to reset state properly
            openPanel(data.agrupaciones, lugar);
            panelElement.classList.add("full");
        });

        new maplibregl.Marker({
            element: el,
            anchor: 'bottom' // Ensures the tip of our CSS pin points to the location
        }).setLngLat([lugar.lng, lugar.lat]).addTo(map);
    });
}

function getAgrupacionesFromLatLng(agrupaciones, lng, lat) {
    return agrupaciones
        .map(agrupacion => {
            const actuacionesFiltradas = agrupacion.actuaciones
                .map(actuacion => {
                    const metadataFiltrada = actuacion.metadata.filter(meta =>
                        meta.lat === lat && meta.lng === lng
                    );
                    return metadataFiltrada.length > 0
                        ? { ...actuacion, metadata: metadataFiltrada }
                        : null;
                })
                .filter(actuacion => actuacion !== null);

            return actuacionesFiltradas.length > 0
                ? { ...agrupacion, actuaciones: actuacionesFiltradas }
                : null;
        })
        .filter(agrupacion => agrupacion !== null);
}

function openPanel(agrupaciones, lugar) {
    panelElement.classList.remove("full");
    panelElement.classList.add("show");

    panelContentElement.innerHTML = "";

    if (panelCalleElement) {
        panelCalleElement.textContent = lugar.nombre;
    }

    const result = getAgrupacionesFromLatLng(agrupaciones, lugar.lng, lugar.lat);
    const sorted = result
        .map(agrupacion => ({
            ...agrupacion,
            actuaciones: agrupacion.actuaciones.sort((a, b) =>
                a.metadata[0].hora.localeCompare(b.metadata[0].hora)
            )
        }))
        .sort((a, b) => {
            // Safe guard against missing metadata
            const timeA = a.actuaciones[0]?.metadata[0]?.hora || "23:59";
            const timeB = b.actuaciones[0]?.metadata[0]?.hora || "23:59";
            return timeA.localeCompare(timeB);
        });
    renderPanelInfo(sorted);
}

function renderPanelInfo(agrupaciones) {
    if (agrupaciones.length === 0) {
        const empty = document.createElement("div");
        empty.classList.add("text", "subtext");
        empty.style.padding = "2rem";
        empty.style.textAlign = "center";
        empty.textContent = "No hay actuaciones programadas en este punto.";
        panelContentElement.appendChild(empty);
        return;
    }

    agrupaciones.forEach((agrupacion) => {
        const panelAgrupacionFragment = panelAgrupacionTemplate.content.cloneNode(true);
        const panelAgrupacionElement = panelAgrupacionFragment.querySelector(".panel-agrupacion");
        const img = panelAgrupacionFragment.querySelector("img");
        const nombre = panelAgrupacionFragment.querySelector(".nombre");
        const apodo = panelAgrupacionFragment.querySelector(".apodo");
        const posicion = panelAgrupacionFragment.querySelector(".posicion");

        img.src = agrupacion.imagen || "/src/marker.jpg"; // Fallback image
        nombre.textContent = agrupacion.nombre;
        apodo.textContent = agrupacion.apodo;
        posicion.textContent = agrupacion.posicion;

        const actuaciones = document.createElement("div");
        actuaciones.classList.add("panel-actuaciones");

        agrupacion.actuaciones.forEach((actuacion) => {
            const panelActuacionFragment = panelActuacionTemplate.content.cloneNode(true);
            const panelActuacionElement = panelActuacionFragment.querySelector(".panel-actuaciones-item");

            const fecha = panelActuacionFragment.querySelector(".fecha");
            fecha.textContent = actuacion.fecha;

            const hoursContainer = panelActuacionFragment.querySelector(".hours");

            actuacion.metadata.forEach((metadata) => {
                const hora = document.createElement("span");
                hora.classList.add("muted");
                hora.textContent = metadata.hora;
                hoursContainer.appendChild(hora);
            })

            actuaciones.appendChild(panelActuacionElement);
        })

        panelAgrupacionElement.appendChild(actuaciones);
        panelContentElement.appendChild(panelAgrupacionElement);
    })
}

function closePanel() {
    panelElement.classList.remove("show", "full");
}