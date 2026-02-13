// App

const boxTemplate = document.getElementById("list-element-template");
const list = document.querySelector(".list .wrapper");
const modal = document.getElementById("modal");
const modalItemTemplate = document.querySelector(".modal-item-template");
const modalItemRowTemplate = document.querySelector(".modal-item-row-template");

let currentFilter = "all";
let allAgrupaciones = []; // Cache for data

async function init() {
    await loadData();
    renderUpdate();
    renderList();
    addFilterEvents();
    addModalEvents();
    addSearchEvents();

    const titleElement = document.querySelector("body > .title");
    const fabElement = document.querySelector(".fab-map");

    if (titleElement && fabElement) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    fabElement.classList.remove("visible");
                } else {
                    fabElement.classList.add("visible");
                }
            });
        });
        observer.observe(titleElement);
    }
}

// Ensure DOM is ready before init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

async function loadData() {
    try {
        const response = await fetch("./data.json");
        if (!response.ok) throw new Error("Failed to load data.json");
        const data = await response.json();
        allAgrupaciones = data.agrupaciones;
        console.log("Data loaded for search:", allAgrupaciones.length);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

async function renderUpdate() {
    const span = document.getElementById("time-span");
    let minutesElapsed = 0;

    function updateTime() {
        minutesElapsed++;
        span.textContent = `Act. hace ${minutesElapsed}m`;
    }
    span.textContent = "Act. recientemente";

    setInterval(updateTime, 60000);
}


function renderList() {
    try {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

        // Filter using cached data
        let filteredAgrupaciones = allAgrupaciones;
        if (currentFilter === "favoritos") {
            filteredAgrupaciones = allAgrupaciones.filter(a => favorites.includes(a.nombre));
        } else if (currentFilter !== "all") {
            filteredAgrupaciones = allAgrupaciones.filter(a => a.tipo === currentFilter);
        }

        // Sort: Favorites first
        const sortedAgrupaciones = [...filteredAgrupaciones].sort((a, b) => {
            const aFav = favorites.includes(a.nombre);
            const bFav = favorites.includes(b.nombre);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });

        list.innerHTML = "";

        sortedAgrupaciones.forEach((agrupacion) => {
            const boxElement = boxTemplate.content.cloneNode(true);

            const image = boxElement.querySelector("img");
            const apodo = boxElement.querySelector(".apodo");
            const nombre = boxElement.querySelector(".nombre");
            const button = boxElement.querySelector(".view-times-btn");
            const favBtn = boxElement.querySelector(".favorite-btn");
            const isFav = favorites.includes(agrupacion.nombre);

            if (image) image.src = agrupacion.imagen;
            if (nombre) nombre.textContent = agrupacion.nombre;
            if (apodo) apodo.textContent = agrupacion.apodo;
            if (button) {
                button.textContent = "Ver horarios";
                button.addEventListener("click", () => fillModal(agrupacion));
            }

            if (favBtn) {
                if (isFav) favBtn.classList.add("active");
                favBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const currentFavs = JSON.parse(localStorage.getItem("favorites") || "[]");

                    if (currentFavs.includes(agrupacion.nombre)) {
                        // Removing: Animate first, then update
                        favBtn.classList.remove("active");
                        favBtn.classList.add("removing");

                        setTimeout(() => {
                            const newFavs = currentFavs.filter(id => id !== agrupacion.nombre);
                            localStorage.setItem("favorites", JSON.stringify(newFavs));
                            renderList();
                        }, 300); // Wait for animation
                    } else {
                        // Adding: Update immediately (animation plays on new render)
                        currentFavs.push(agrupacion.nombre);
                        localStorage.setItem("favorites", JSON.stringify(currentFavs));
                        renderList();
                    }
                });
            }

            list.appendChild(boxElement);
        });
    } catch (error) {
        console.error("Error rendering list:", error);
        list.innerHTML = `<p class='error'>Error al cargar las agrupaciones. (${error.message})</p>`;
    }
}

function addFilterEvents() {
    const chips = document.querySelectorAll(".filter-chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentFilter = chip.dataset.filter;
            renderList();
        });
    });
}

function fillModal(agrupacion) {
    const modalContent = document.querySelector("#modal .content");
    const modalTitle = document.querySelector(".modal-title");
    const modalApodo = document.querySelector(".modal-apodo");
    modalTitle.textContent = agrupacion.nombre;
    modalApodo.textContent = agrupacion.apodo || "";

    const modalItemRef = modalItemTemplate.content.cloneNode(true);
    const modalItem = modalItemRef.querySelector(".item");
    const emptyMessageEl = modalItem.querySelector(".empty");

    if (agrupacion.actuaciones.length > 0) {
        emptyMessageEl.style.display = "none";
        agrupacion.actuaciones.forEach((actuacion) => {
            const date = modalItem.querySelector(".modal-item-date");
            date.textContent = actuacion.fecha;

            const modalInfo = modalItem.querySelector(".info");
            actuacion.metadata.forEach((metadata) => {
                const modalItemRowRef = modalItemRowTemplate.content.cloneNode(true);
                const modalItemRow = modalItemRowRef.querySelector(".row");

                const modalItemHour = modalItemRow.querySelector(".modal-item-hour");
                modalItemHour.textContent = metadata.hora;

                const modalItemStreet = modalItemRow.querySelector(".modal-item-street");
                modalItemStreet.textContent = metadata.lugar;

                const modalItemButton = modalItemRow.querySelector("a.button");
                modalItemButton.href = `/map.html?calle=${metadata.lugar.split(" ").join("+")}`;

                // Share Functionality
                const shareBtn = modalItemRow.querySelector(".share-btn");
                if (shareBtn) {
                    shareBtn.addEventListener("click", async () => {
                        const shareData = {
                            title: `Actuación de ${agrupacion.nombre}`,
                            text: `¡No te pierdas a ${agrupacion.nombre} en ${metadata.lugar} a las ${metadata.hora}! 🎭 #CarnavalCádiz`,
                            url: window.location.origin // Or specific deep link if available
                        };

                        try {
                            if (navigator.share) {
                                await navigator.share(shareData);
                            } else {
                                // Fallback: Copy to clipboard
                                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                                alert("Información copiada al portapapeles");
                            }
                        } catch (err) {
                            console.error("Error sharing:", err);
                        }
                    });
                }

                modalInfo.appendChild(modalItemRow);
            })

            modalItem.appendChild(modalInfo);
            modalContent.appendChild(modalItem);
        })
    } else {
        emptyMessageEl.textContent = `${agrupacion.nombre} no han publicado horarios`;
        modalContent.appendChild(emptyMessageEl);
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function addModalEvents() {
    const closeModalElement = document.getElementById("close-modal");
    if (closeModalElement) {
        closeModalElement.addEventListener("click", () => {
            modal.classList.remove("show");
            document.body.style.overflow = "";
            const modalContent = document.querySelector("#modal .content");
            modalContent.innerHTML = "";
        })
    }

    // Close modal when clicking outside the wrapper
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
            document.body.style.overflow = "";
            const modalContent = document.querySelector("#modal .content");
            modalContent.innerHTML = "";
        }
    });
}

function addSearchEvents() {
    const searchBtn = document.getElementById("search-btn");
    const searchModal = document.getElementById("search-modal");
    const closeSearchBtn = document.getElementById("close-search");
    const searchInput = document.getElementById("search-input");
    const searchResults = document.querySelector(".search-results");
    const searchEmpty = document.querySelector(".search-empty-state");

    if (searchBtn && searchModal) {
        searchBtn.addEventListener("click", () => {
            searchModal.classList.add("show");
            document.body.style.overflow = "hidden";
            searchInput.focus();
        });
    }

    const closeSearch = () => {
        searchModal.classList.remove("show");
        document.body.style.overflow = "";
        searchInput.value = "";
        searchResults.innerHTML = "";
        searchEmpty.style.display = "none";
    };

    if (closeSearchBtn) {
        closeSearchBtn.addEventListener("click", closeSearch);
    }

    // Close search on backdrop click
    searchModal.addEventListener("click", (e) => {
        if (e.target === searchModal) {
            closeSearch();
        }
    });

    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = "";

        if (query.length === 0) {
            searchEmpty.style.display = "none";
            return;
        }

        console.log(`Filtering for "${query}" in ${allAgrupaciones.length} items`);

        const results = allAgrupaciones.filter(a => {
            const nombre = (a.nombre || "").toLowerCase();
            const apodo = (a.apodo || "").toLowerCase();
            const autor = (a.autor || "").toLowerCase();

            return nombre.includes(query) ||
                apodo.includes(query) ||
                autor.includes(query)
        });

        console.log(`Found ${results.length} matches`);

        if (results.length > 0) {
            searchEmpty.style.display = "none";
            results.forEach(agrupacion => {
                const el = document.createElement("div");
                el.className = "panel-agrupacion";
                el.style.marginBottom = "1rem";
                el.style.cursor = "pointer";
                el.innerHTML = `
                    <div class="row">
                        <img src="${agrupacion.imagen}" alt="${agrupacion.nombre}" style="width: 50px; height: 50px; border-radius: 1rem; object-fit: cover;">
                        <div class="column">
                            <span class="nombre" style="font-size: 1.1rem;">${agrupacion.nombre}</span>
                            <span class="apodo" style="font-size: 0.85rem;">${agrupacion.apodo}</span>
                        </div>
                    </div>
                `;
                el.addEventListener("click", () => {
                    fillModal(agrupacion);
                    closeSearch();
                });
                searchResults.appendChild(el);
            });
        } else {
            searchEmpty.style.display = "block";
        }
    });
}
