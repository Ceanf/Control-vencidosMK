// ================== ELEMENTOS ==================
const form = document.getElementById("productForm");
const tabla = document.getElementById("tablaProductos");
const busqueda = document.getElementById("busqueda");
const paginacion = document.getElementById("paginacion");

// Modales
const modalEditar = document.getElementById("modalEditar");
const modalRetiro = document.getElementById("modalRetiro");
const modalEliminar = document.getElementById("modalEliminar");

// Inputs editar
const editProducto = document.getElementById("editProducto");
const editCodigo = document.getElementById("editCodigo");
const editVencimiento = document.getElementById("editVencimiento");
const editUnidades = document.getElementById("editUnidades");
const editEstado = document.getElementById("editEstado");

// Otros
const fechaHoy = document.getElementById("fechaHoy");
const productoEliminar = document.getElementById("productoEliminar");
const listaRetiros = document.getElementById("listaRetiros");

// ================== VARIABLES ==================
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let indexActual = null;
let indexSeleccionado = null;

let paginaActual = 1;
const registrosPorPagina = 8;

// ================== UTIL ==================
function fechaISO(f) {
  return f.toISOString().split("T")[0];
}

// ================== RENDER TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  paginacion.innerHTML = "";

  const texto = busqueda.value.toLowerCase();
  const hoy = new Date();

  // 🔍 FILTRAR
  const filtrados = productos.filter(p => {
    const venc = new Date(p.vencimiento);

    let estado = "Vigente";
    if (p.retiroReal) estado = "Retirado";
    else if (venc < hoy) estado = "Vencido";

    const contenido = `
      ${p.producto}
      ${p.codigo}
      ${p.vencimiento}
      ${p.retiroPrevisto}
      ${estado}
    `.toLowerCase();

    return contenido.includes(texto);
  });

  // 📄 PAGINACIÓN
  const totalPaginas = Math.ceil(filtrados.length / registrosPorPagina);
  if (paginaActual > totalPaginas) paginaActual = 1;

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const visibles = filtrados.slice(inicio, inicio + registrosPorPagina);

  visibles.forEach((p, i) => {
    const venc = new Date(p.vencimiento);

    let estado = "Vigente";
    let clase = "vigente";

    if (p.retiroReal) {
      estado = "Retirado";
      clase = "retirado";
    } else if (venc < hoy) {
      estado = "Vencido";
      clase = "vencido";
    }

    const indexReal = productos.indexOf(p);

    tabla.innerHTML += `
      <tr>
        <td data-label="#">${inicio + i + 1}</td>
        <td data-label="Producto">${p.producto}</td>
        <td data-label="Código">${p.codigo}</td>
        <td data-label="Vencimiento">${p.vencimiento}</td>
        <td data-label="Unidades">${p.unidades}</td>
        <td data-label="Retiro Prev.">${p.retiroPrevisto}</td>
        <td data-label="Retiro Real">${p.retiroReal || "-"}</td>
        <td data-label="Estado">
          <span class="badge ${clase}">${estado}</span>
        </td>
        <td data-label="Acciones">
          <button onclick="abrirEditar(${indexReal})">Editar</button>
          <button onclick="abrirRetiro(${indexReal})" ${p.retiroReal ? "disabled" : ""}>Retirar</button>
          <button class="danger" onclick="abrirEliminar(${indexReal})">Eliminar</button>
        </td>
      </tr>
    `;
  });

  renderPaginacion(totalPaginas);
  localStorage.setItem("productos", JSON.stringify(productos));
  renderResumen();
}

// ================== PAGINACIÓN ==================
function renderPaginacion(total) {
  if (total <= 1) return;

  const btnPrev = document.createElement("button");
  btnPrev.textContent = "Anterior";
  btnPrev.disabled = paginaActual === 1;
  btnPrev.onclick = () => {
    paginaActual--;
    renderTabla();
  };
  paginacion.appendChild(btnPrev);

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) btn.classList.add("active");
    btn.onclick = () => {
      paginaActual = i;
      renderTabla();
    };
    paginacion.appendChild(btn);
  }

  const btnNext = document.createElement("button");
  btnNext.textContent = "Siguiente";
  btnNext.disabled = paginaActual === total;
  btnNext.onclick = () => {
    paginaActual++;
    renderTabla();
  };
  paginacion.appendChild(btnNext);
}

// ================== REGISTRAR ==================
form.addEventListener("submit", e => {
  e.preventDefault();

  const venc = new Date(vencimiento.value);
  const retiroPrev = new Date(venc);
  retiroPrev.setDate(retiroPrev.getDate() - 7);

  productos.push({
    producto: producto.value,
    codigo: codigo.value,
    vencimiento: fechaISO(venc),
    unidades: unidades.value,
    retiroPrevisto: fechaISO(retiroPrev),
    retiroReal: null
  });

  form.reset();
  renderTabla();
});

// ================== EDITAR ==================
function abrirEditar(i) {
  indexActual = i;
  const p = productos[i];

  editProducto.value = p.producto;
  editCodigo.value = p.codigo;
  editVencimiento.value = p.vencimiento;
  editUnidades.value = p.unidades;
  editEstado.value = p.retiroReal ? "Retirado" : "Vigente";

  modalEditar.style.display = "flex";
}

function cerrarEditar() {
  modalEditar.style.display = "none";
}

function guardarEdicion() {
  const venc = new Date(editVencimiento.value);
  const retiroPrev = new Date(venc);
  retiroPrev.setDate(retiroPrev.getDate() - 7);

  let retiroReal = productos[indexActual].retiroReal;

  if (editEstado.value === "Retirado" && !retiroReal) {
    retiroReal = fechaISO(new Date());
  }

  if (editEstado.value === "Vigente") {
    retiroReal = null;
  }

  productos[indexActual] = {
    ...productos[indexActual],
    producto: editProducto.value,
    codigo: editCodigo.value,
    vencimiento: fechaISO(venc),
    unidades: editUnidades.value,
    retiroPrevisto: fechaISO(retiroPrev),
    retiroReal
  };

  cerrarEditar();
  renderTabla();
}

// ================== RETIRO ==================
function abrirRetiro(i) {
  indexActual = i;
  fechaHoy.textContent = fechaISO(new Date());
  modalRetiro.style.display = "flex";
}

function cerrarRetiro() {
  modalRetiro.style.display = "none";
}

function confirmarRetiro() {
  productos[indexActual].retiroReal = fechaISO(new Date());
  cerrarRetiro();
  renderTabla();
}

// ================== ELIMINAR ==================
function abrirEliminar(i) {
  indexSeleccionado = i;
  productoEliminar.textContent = productos[i].producto;
  modalEliminar.style.display = "flex";
}

function cerrarEliminar() {
  modalEliminar.style.display = "none";
}

function confirmarEliminar() {
  productos.splice(indexSeleccionado, 1);
  cerrarEliminar();
  renderTabla();
}

// ================== RESUMEN ==================
function renderResumen() {
  listaRetiros.innerHTML = "";

  const hoy = new Date();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();

  productos
    .filter(p => !p.retiroReal)
    .filter(p => {
      const f = new Date(p.retiroPrevisto);
      return f.getMonth() === mes && f.getFullYear() === anio;
    })
    .sort((a, b) => new Date(a.retiroPrevisto) - new Date(b.retiroPrevisto))
    .forEach(p => {
      listaRetiros.innerHTML += `
        <li>${p.producto}<span>${p.retiroPrevisto}</span></li>
      `;
    });
}

// ================== BUSQUEDA ==================
busqueda.addEventListener("input", () => {
  paginaActual = 1;
  renderTabla();
});

// ================== EXPORTAR A EXCEL ==================
function exportarExcel() {
  if (productos.length === 0) {
    alert("No hay productos para exportar");
    return;
  }

  const data = productos.map((p, i) => ({
    "#": i + 1,
    Producto: p.producto,
    Código: p.codigo,
    Vencimiento: p.vencimiento,
    Unidades: p.unidades,
    "Retiro previsto": p.retiroPrevisto,
    "Retiro real": p.retiroReal || "",
    Estado: p.retiroReal ? "Retirado" : "Vigente"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  XLSX.writeFile(wb, "control_vencidos.xlsx");
}
// ================== MODAL RESUMEN ==================
const modalResumen = document.getElementById("modalResumen");

function abrirResumen() {
  renderResumen(); // reutilizamos tu función existente
  modalResumen.style.display = "flex";
}

function cerrarResumen() {
  modalResumen.style.display = "none";
}


// ================== INIT ==================
renderTabla();


