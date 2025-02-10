// App
init();

const boxTemplate = document.getElementById("list-element-template");
const list = document.querySelector(".list .wrapper");
const modal = document.getElementById("modal");

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
        button.addEventListener("click", () => {
            modal.classList.add("show");
        })

        list.appendChild(boxElement);
    })
}

async function addModalEvents() {
    const closeModalElement = document.getElementById("close-modal");
    closeModalElement.addEventListener("click", () => {
        modal.classList.remove("show");
    })
}

