// App

const boxTemplate = document.getElementById("list-element-template");
const list = document.querySelector(".list .wrapper");
const modal = document.getElementById("modal");
const modalItemTemplate = document.querySelector(".modal-item-template");
const modalItemRowTemplate = document.querySelector(".modal-item-row-template");

let currentFilter = "all";

function init() {
    renderUpdate();
    renderList();
    addFilterEvents();
    addModalEvents();

    const titleElement = document.querySelector("body > .title");
    const fabElement = document.querySelector(".fab-map");

    if (titleElement && fabElement) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log("Title intersecting:", entry.isIntersecting);
                // When title is NOT visible (isIntersecting = false), show FAB
                if (entry.isIntersecting) {
                    fabElement.classList.remove("visible");
                    console.log("FAB hidden");
                } else {
                    fabElement.classList.add("visible");
                    console.log("FAB visible");
                }
            });
        }); // Default threshold is 0
        observer.observe(titleElement);
    } else {
        console.error("Title or FAB element not found");
    }
}

// Ensure DOM is ready before init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

async function renderUpdate() {
    const span = document.getElementById("time-span");
    let minutesElapsed = 0;

    function updateTime() {
        minutesElapsed++;
        span.textContent = `Actualizado hace ${minutesElapsed}m`;
    }
    span.textContent = "Actualizado recientemente";

    setInterval(updateTime, 60000);
}


async function renderList() {
    try {
        const data = await fetch("./data.json").then(res => {
            if (!res.ok) throw new Error("Failed to load data.json");
            return res.json();
        });
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

        // Filter
        let filteredAgrupaciones = data.agrupaciones;
        if (currentFilter === "favoritos") {
            filteredAgrupaciones = data.agrupaciones.filter(a => favorites.includes(a.nombre));
        } else if (currentFilter !== "all") {
            filteredAgrupaciones = data.agrupaciones.filter(a => a.tipo === currentFilter);
        }

        // Sort: Favorites first (only if not already filtering by favorites)
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
                        const newFavs = currentFavs.filter(id => id !== agrupacion.nombre);
                        localStorage.setItem("favorites", JSON.stringify(newFavs));
                    } else {
                        currentFavs.push(agrupacion.nombre);
                        localStorage.setItem("favorites", JSON.stringify(currentFavs));
                    }
                    renderList();
                });
            }

            list.appendChild(boxElement);
        });
    } catch (error) {
        console.error("Error rendering list:", error);
        list.innerHTML = `<p class='error'>Error al cargar las agrupaciones. Por favor, intenta de nuevo más tarde. (${error.message})</p>`;
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

async function fillModal(agrupacion) {
    const modalContent = document.querySelector("#modal .content");
    const modalTitle = document.querySelector(".modal-title");
    modalTitle.textContent = agrupacion.nombre;

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

                const modalItemButton = modalItemRow.querySelector(".button");
                modalItemButton.href = `/map.html?calle=${metadata.lugar.split(" ").join("+")}`;

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

async function addModalEvents() {
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

