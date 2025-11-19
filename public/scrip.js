// 1. Selección de elementos
const grid = document.querySelector("#grid-videojuegos");
const spinner = document.querySelector("#spinner");
const selectOrdenar = document.querySelector("#ordenarPor");
const filtrarTienda = document.querySelector("#filtrar-tienda");
const siguienteBtn = document.querySelector("#siguiente-btn");
const anteriorBtn = document.querySelector("#anterior-btn");
const cargarMasBtn = document.querySelector("#cargar-mas-btn");
const paginaActualSpan = document.querySelector("#pagina-actual");

// Elementos de búsqueda
const buscarInput = document.querySelector("#buscar-input");
const buscarBtn = document.querySelector("#buscar-btn");

// Elementos del modal
const modal = document.querySelector("#modal-juego");
const cerrarModalBtn = document.querySelector("#cerrar-modal");
const modalImagen = document.querySelector("#modal-imagen");
const modalTitulo = document.querySelector("#modal-titulo");
const modalPrecioNormal = document.querySelector("#modal-precio-normal");
const modalPrecioOferta = document.querySelector("#modal-precio-oferta");
const modalAhorro = document.querySelector("#modal-ahorro");

// Variable para almacenar todos los juegos cargados
let videojuegosCargados = [];
let paginaActual = 0;
let todosCargados = []; // Acumular todos los juegos cargados dinámicamente

// Datos locales por si falla la API
const videojuegosLocales = [
    {
        title: "Elden Ring",
        thumb: "https://images.igdb.com/igdb/image/upload/t_cover_big/colr76.png",
        normalPrice: "_",
        salePrice: "_",
        savings: null,
    },
    {
        title: "God of War",
        thumb: "https://images.igdb.com/igdb/image/upload/t_cover_big/co6a5r.png",
        normalPrice: "_",
        salePrice: "_",
        savings: null,
    },
];

// ========== FUNCIONES DE SPINNER ==========

// Mostrar spinner
function mostrarSpinner() {
    spinner.classList.remove("hidden");
}

// Ocultar spinner
function ocultarSpinner() {
    spinner.classList.add("hidden");
}

// Renderizar tarjetas (reemplaza el grid)
function renderizarVideojuegos(lista) {
    grid.innerHTML = "";
    agregarVideojuegosAlGrid(lista);
}

// Agregar tarjetas al grid sin limpiar (para carga dinámica)
function agregarVideojuegosAlGrid(lista) {
    lista.forEach(juego => {
        const titulo = juego.title || juego.external || "Juego sin título";
        const imagen = juego.thumb || juego.thumb_url || juego.image || "";
        const normal = juego.normalPrice ?? "_";
        const oferta = juego.salePrice ?? juego.cheapest ?? "_";
        const ahorro = juego.savings ? Math.round(Number(juego.savings)) : null;

        const card = document.createElement("article");
        card.className = "bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 flex flex-col";

        card.innerHTML = `
        <img src="${imagen}" alt="${titulo}" class="h-40 w-full object-cover" />
        <div class="p-4 flex flex-col gap-2 flex-1">
            <h3 class="font-semibold text-slate-900 leading-tight">${titulo}</h3>

            <p class="text-xs text-slate-500">
                Precio: ${normal !== "_" ? `<s>$${normal}</s>` : "—"}
                ${oferta !== "_" ? ` · <span class="font-semibold text-slate-900">$${oferta}</span>` : ""}
                ${ahorro ? ` · Ahorro ${ahorro}%` : ""}
            </p>

            <button class="mt-2 w-full bg-slate-900 text-white py-2 rounded-lg text-sm hover:bg-slate-800">
                Ver detalle
            </button>
        </div>
        `;

        // Event listener para el botón "Ver detalle"
        const botonDetalle = card.querySelector("button");
        botonDetalle.addEventListener("click", () => {
            abrirModal(juego);
        });

        grid.appendChild(card);
    });
}

// Agregar cambios al siguiente

// Cargar desde API
async function cargarVideojuegosInicial() {
    try {
        mostrarSpinner();

        const url = `https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=30&page=${paginaActual}`;
        const resp = await fetch(url);
        const datos = await resp.json();

        window._juegosCache = datos;
        videojuegosCargados = datos;
        todosCargados = datos; // Iniciar con los primeros datos

        ocultarSpinner();
        renderizarVideojuegos(datos);
        actualizarBotonesPaginacion();
        actualizarIndicadorPagina();

    } catch (error) {
        console.error("Error al cargar los videojuegos:", error);
        ocultarSpinner();
        videojuegosCargados = videojuegosLocales;
        renderizarVideojuegos(videojuegosLocales);
    }
}

// Cargar más juegos dinámicamente (sin reemplazar los anteriores)
async function cargarMasVideojuegos() {
    try {
        mostrarSpinner();
        
        paginaActual++; // Incrementar página
        const url = `https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=30&page=${paginaActual}`;
        const resp = await fetch(url);
        const datos = await resp.json();

        if (datos.length === 0) {
            console.log("No hay más juegos disponibles");
            paginaActual--; // Revertir increment
            alert("No hay más juegos disponibles");
            ocultarSpinner();
            return;
        }

        // Agregar nuevos juegos a la lista acumulada
        videojuegosCargados = datos;
        todosCargados = [...todosCargados, ...datos];

        // Agregar las nuevas tarjetas al grid sin limpiar
        agregarVideojuegosAlGrid(datos);
        
        ocultarSpinner();
        actualizarIndicadorPagina();
        
        // Scroll suave hacia los nuevos juegos
        setTimeout(() => {
            grid.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);

    } catch (error) {
        console.error("Error al cargar más videojuegos:", error);
        paginaActual--; // Revertir increment si hay error
        ocultarSpinner();
    }
}

// Función para ordenar videojuegos
function ordenarVideojuegos(criterio) {
    if (!criterio) {
        renderizarVideojuegos(videojuegosCargados);
        return;
    }

    let juegosOrdenados = [...videojuegosCargados];

    switch (criterio) {
        case "descuento-desc":
            // Mayor descuento primero
            juegosOrdenados.sort((a, b) => {
                const descuentoA = parseFloat(a.savings) || 0;
                const descuentoB = parseFloat(b.savings) || 0;
                return descuentoB - descuentoA;
            });
            break;

        case "descuento-asc":
            // Menor descuento primero
            juegosOrdenados.sort((a, b) => {
                const descuentoA = parseFloat(a.savings) || 0;
                const descuentoB = parseFloat(b.savings) || 0;
                return descuentoA - descuentoB;
            });
            break;

        case "precio-desc":
            // Precio mayor primero
            juegosOrdenados.sort((a, b) => {
                const precioA = parseFloat(a.salePrice) || parseFloat(a.normalPrice) || 0;
                const precioB = parseFloat(b.salePrice) || parseFloat(b.normalPrice) || 0;
                return precioB - precioA;
            });
            break;

        case "precio-asc":
            // Precio menor primero
            juegosOrdenados.sort((a, b) => {
                const precioA = parseFloat(a.salePrice) || parseFloat(a.normalPrice) || 0;
                const precioB = parseFloat(b.salePrice) || parseFloat(b.normalPrice) || 0;
                return precioA - precioB;
            });
            break;

        default:
            break;
    }

    renderizarVideojuegos(juegosOrdenados);
}

// Event listener para el select de ordenamiento
selectOrdenar.addEventListener("change", (e) => {
    ordenarVideojuegos(e.target.value);
});

// ========== FUNCIONES DE FILTRO ==========

// Filtrar videojuegos por tienda
function filtrarPorTienda(tiendaId) {
    if (!tiendaId) {
        // Si no hay tienda seleccionada, mostrar todos
        renderizarVideojuegos(videojuegosCargados);
        return;
    }

    // Filtrar juegos que tengan la tienda seleccionada en sus opciones de compra
    const juegosFiltrados = videojuegosCargados.filter(juego => {
        // Algunas APIs devuelven storeID, otras requieren validación
        // Para Cheapshark, verificamos si el juego está disponible en esa tienda
        return juego.storeID == tiendaId || juego.cheapest_price_store == tiendaId;
    });

    renderizarVideojuegos(juegosFiltrados);
}

// Event listener para el select de tienda
filtrarTienda.addEventListener("change", (e) => {
    filtrarPorTienda(e.target.value);
});

// ========== FUNCIONES DE BÚSQUEDA ==========

// Buscar videojuegos por nombre
async function buscarPorNombre(texto) {
    if (!texto.trim()) {
        // Si el input está vacío, mostrar todos los juegos
        ocultarSpinner();
        renderizarVideojuegos(videojuegosCargados);
        return;
    }

    try {
        mostrarSpinner();

        // Búsqueda local en los datos cargados
        const resultados = videojuegosCargados.filter(juego => {
            const titulo = (juego.title || juego.external || "").toLowerCase();
            return titulo.includes(texto.toLowerCase());
        });

        ocultarSpinner();
        renderizarVideojuegos(resultados);

    } catch (error) {
        console.error("Error al buscar:", error);
        ocultarSpinner();
    }
}

// Event listeners de búsqueda
buscarBtn.addEventListener("click", () => {
    buscarPorNombre(buscarInput.value);
});

// Buscar al presionar Enter
buscarInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        buscarPorNombre(buscarInput.value);
    }
});

// ========== FUNCIONES DEL MODAL =========

// Abrir modal con datos del juego
function abrirModal(juego) {
    const titulo = juego.title || juego.external || "Juego sin título";
    let imagen = juego.thumb || juego.thumb_url || juego.image || "";
    const normal = juego.normalPrice ?? "_";
    const oferta = juego.salePrice ?? juego.cheapest ?? "_";
    const ahorro = juego.savings ? Math.round(Number(juego.savings)) : null;

    // Si no hay imagen, mostrar una por defecto
    if (!imagen) {
        imagen = "https://via.placeholder.com/300x400?text=Sin+Imagen";
    }

    // Llenar datos del modal
    modalImagen.src = imagen;
    modalImagen.alt = titulo;
    modalImagen.onerror = function() {
        this.src = "https://via.placeholder.com/300x400?text=Error+en+Imagen";
    };
    
    modalTitulo.textContent = titulo;
    
    // Mostrar precio normal
    if (normal !== "_" && normal !== null) {
        modalPrecioNormal.innerHTML = `<s>$${normal}</s>`;
    } else {
        modalPrecioNormal.textContent = "No disponible";
    }

    // Mostrar precio oferta
    if (oferta !== "_" && oferta !== null) {
        modalPrecioOferta.textContent = `$${oferta}`;
    } else {
        modalPrecioOferta.textContent = "No disponible";
    }

    // Mostrar ahorro
    if (ahorro && ahorro > 0) {
        modalAhorro.textContent = `${ahorro}% de descuento`;
    } else {
        modalAhorro.textContent = "Sin descuento";
    }

    // Mostrar modal
    modal.classList.remove("hidden");
}

// Cerrar modal
function cerrarModal() {
    modal.classList.add("hidden");
}

// Event listeners del modal
cerrarModalBtn.addEventListener("click", cerrarModal);

// Cerrar modal al hacer clic en el fondo (overlay)
modal.addEventListener("click", (e) => {
    // Solo cerrar si hicimos clic en el overlay, no en el contenido del modal
    if (e.target.id === "modal-juego") {
        cerrarModal();
    }
});

// Cerrar modal con tecla Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        cerrarModal();
    }
});

// ========== FUNCIONES DE PAGINACIÓN ==========

// Actualizar estado de botones de paginación
function actualizarBotonesPaginacion() {
    // Desabilitar botón anterior si estamos en la primera página
    anteriorBtn.disabled = paginaActual === 0;
}

// Actualizar indicador de página actual
function actualizarIndicadorPagina() {
    paginaActualSpan.textContent = paginaActual + 1;
}

// Ir a siguiente página
async function irSiguiente() {
    paginaActual++;
    buscarInput.value = ""; // Limpiar búsqueda
    filtrarTienda.value = ""; // Limpiar filtro de tienda
    selectOrdenar.value = ""; // Limpiar ordenamiento
    window.scrollTo(0, 0); // Scroll hacia arriba
    cargarVideojuegosInicial();
}

// Ir a página anterior
async function irAnterior() {
    if (paginaActual > 0) {
        paginaActual--;
        buscarInput.value = ""; // Limpiar búsqueda
        filtrarTienda.value = ""; // Limpiar filtro de tienda
        selectOrdenar.value = ""; // Limpiar ordenamiento
        window.scrollTo(0, 0); // Scroll hacia arriba
        cargarVideojuegosInicial();
    }
}

// Event listeners de paginación
siguienteBtn.addEventListener("click", irSiguiente);
anteriorBtn.addEventListener("click", irAnterior);
cargarMasBtn.addEventListener("click", cargarMasVideojuegos);

cargarVideojuegosInicial();