// App
init();

const boxTemplate = document.getElementById("list-element-template");
const list = document.querySelector(".list .wrapper");
const modal = document.getElementById("modal");
const modalItemTemplate = document.querySelector(".modal-item-template");
const modalItemRowTemplate = document.querySelector(".modal-item-row-template");

function init() {
    renderUpdate();
    renderList();

    addModalEvents();
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
    const data = await fetch("./data.json").then(res => res.json()).then(data => data);
    data.agrupaciones.forEach((agrupacion) => {
        const boxElement = boxTemplate.content.cloneNode(true);

        const image = boxElement.querySelector("img");
        const apodo = boxElement.querySelector(".apodo");
        const nombre = boxElement.querySelector(".nombre");
        const button = boxElement.querySelector("button");

        image.src = agrupacion.imagen;
        nombre.textContent = agrupacion.nombre;
        apodo.textContent = agrupacion.apodo;
        button.textContent = "Ver horarios";
        button.addEventListener("click", () => fillModal(agrupacion))

        list.appendChild(boxElement);
    })
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
}

async function addModalEvents() {
    const closeModalElement = document.getElementById("close-modal");
    closeModalElement.addEventListener("click", () => {
        modal.classList.remove("show");
        const modalContent = document.querySelector("#modal .content");
        modalContent.innerHTML = "";
    })
}

