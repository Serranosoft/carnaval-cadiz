// App
init();

const boxTemplate = document.getElementById("box-template");
const list = document.querySelector(".list .wrapper");

function init() {
    renderUpdate();
    renderList();
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
        
        const span1 = boxElement.querySelector(".span-1");
        const span2 = boxElement.querySelector(".span-2");
        const span3 = boxElement.querySelector(".span-3");
        
        span1.textContent = agrupacion.nombre;
        span2.textContent = agrupacion.apodo;
        span3.textContent = agrupacion.posicion;
        
        list.appendChild(boxElement)
    })
}
