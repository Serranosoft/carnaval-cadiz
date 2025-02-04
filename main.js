// App
init();

const boxTemplate = document.getElementById("box-template");
const list = document.querySelector(".list .wrapper");

function init() {
    render();
}

async function render() {
    const data = await fetch("./data.json").then(res => res.json()).then(data => data);
    data.agrupaciones.forEach((agrupacion) => {
        const boxElement = boxTemplate.content.cloneNode(true);
        const span1 = boxElement.querySelector(".span-1");
        span1.textContent = agrupacion.nombre;
        const span2 = boxElement.querySelector(".span-2");
        span2.textContent = agrupacion.apodo;
        const span3 = boxElement.querySelector(".span-3");
        span3.textContent = agrupacion.posicion;
        list.appendChild(boxElement)
    })
}
