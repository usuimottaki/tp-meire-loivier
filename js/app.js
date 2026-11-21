"use strict";

const URL_API = "https://rickandmortyapi.com/api/character";
const CLAVE_FAVORITOS = "rym-favoritos";
const ESTADOS = { alive: "Vivo", dead: "Muerto", unknown: "Desconocido" };

const lista = document.getElementById("lista");
const mensaje = document.getElementById("mensaje");
const formBusqueda = document.getElementById("form-busqueda");
const inputNombre = document.getElementById("nombre");
const selectEstado = document.getElementById("filtro-estado");
const btnAnterior = document.getElementById("btn-anterior");
const btnSiguiente = document.getElementById("btn-siguiente");
const paginaInfo = document.getElementById("pagina-info");
const listaFavoritos = document.getElementById("favoritos");

const filtros = { nombre: "", estado: "" };
let paginaActual = 1;
let totalPaginas = 1;
let cargando = false;
let favoritos = leerFavoritos();

/* ---------- Acceso a la API ---------- */

function construirUrl() {
  const params = new URLSearchParams({ page: paginaActual });
  if (filtros.nombre) params.set("name", filtros.nombre);
  if (filtros.estado) params.set("status", filtros.estado);
  return `${URL_API}?${params}`;
}

async function obtenerPersonajes() {
  const respuesta = await fetch(construirUrl());
  // La API responde 404 cuando la búsqueda no tiene resultados.
  if (respuesta.status === 404) return { info: { pages: 1 }, results: [] };
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con el estado ${respuesta.status}.`);
  }
  return respuesta.json();
}

/* ---------- Renderizado ---------- */

function crearTarjeta(personaje) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";

  const imagen = document.createElement("img");
  imagen.src = personaje.image;
  imagen.alt = personaje.name;
  imagen.loading = "lazy";

  const nombre = document.createElement("h3");
  nombre.textContent = personaje.name;

  const detalle = document.createElement("p");
  detalle.textContent = `${ESTADOS[personaje.status.toLowerCase()] || personaje.status} · ${personaje.species}`;

  tarjeta.append(imagen, nombre, detalle);

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn btn-favorito";
  boton.dataset.id = personaje.id;
  boton.dataset.nombre = personaje.name;
  boton.dataset.imagen = personaje.image;
  boton.textContent = textoBotonFavorito(esFavorito(personaje.id));
  tarjeta.append(boton);

  return tarjeta;
}

function renderizarPersonajes(personajes) {
  lista.replaceChildren(...personajes.map(crearTarjeta));
}

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.className = esError ? "mensaje error" : "mensaje";
}

function establecerCargando(valor) {
  cargando = valor;
  document.querySelectorAll("button").forEach((boton) => {
    boton.disabled = valor;
  });
  if (valor) mostrarMensaje("Cargando personajes…");
}

/* ---------- Flujo principal ---------- */

async function cargarPersonajes() {
  if (cargando) return false;
  establecerCargando(true);
  let exito = false;
  try {
    const datos = await obtenerPersonajes();
    totalPaginas = datos.info.pages || 1;
    renderizarPersonajes(datos.results);
    mostrarMensaje("");
    exito = true;
  } catch (error) {
    const sinConexion = error instanceof TypeError;
    mostrarMensaje(
      sinConexion
        ? "No se pudo conectar con la API. Revisa tu conexión a internet."
        : error.message,
      true
    );
  } finally {
    establecerCargando(false);
    actualizarPaginacion();
  }
  return exito;
}

/* ---------- Búsqueda y paginación ---------- */

function actualizarPaginacion() {
  paginaInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnAnterior.disabled = paginaActual <= 1;
  btnSiguiente.disabled = paginaActual >= totalPaginas;
}

function manejarBusqueda(evento) {
  evento.preventDefault();
  if (cargando) return;
  filtros.nombre = inputNombre.value.trim();
  filtros.estado = selectEstado.value;
  paginaActual = 1;
  cargarPersonajes();
}

async function cambiarPagina(cambio) {
  if (cargando) return;
  paginaActual += cambio;
  const exito = await cargarPersonajes();
  if (!exito) {
    paginaActual -= cambio; // si falla, se conserva la página anterior
    actualizarPaginacion();
  }
}

formBusqueda.addEventListener("submit", manejarBusqueda);
btnAnterior.addEventListener("click", () => cambiarPagina(-1));
btnSiguiente.addEventListener("click", () => cambiarPagina(1));

/* ---------- Favoritos (localStorage) ---------- */

function leerFavoritos() {
  try {
    const guardado = localStorage.getItem(CLAVE_FAVORITOS);
    const datos = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function guardarFavoritos() {
  try {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch (error) {
    mostrarMensaje("No se pudieron guardar los favoritos en este navegador.", true);
  }
}

function esFavorito(id) {
  return favoritos.some((favorito) => favorito.id === id);
}

function textoBotonFavorito(activo) {
  return activo ? "★ Quitar de favoritos" : "☆ Agregar a favoritos";
}

function alternarFavorito(personaje) {
  favoritos = esFavorito(personaje.id)
    ? favoritos.filter((favorito) => favorito.id !== personaje.id)
    : [...favoritos, personaje];
  guardarFavoritos();
  renderizarFavoritos();
  actualizarBotonesFavorito();
}

function actualizarBotonesFavorito() {
  lista.querySelectorAll(".btn-favorito").forEach((boton) => {
    boton.textContent = textoBotonFavorito(esFavorito(Number(boton.dataset.id)));
  });
}

function crearItemFavorito(favorito) {
  const item = document.createElement("li");

  const imagen = document.createElement("img");
  imagen.src = favorito.image;
  imagen.alt = favorito.name;

  const nombre = document.createElement("span");
  nombre.textContent = favorito.name;

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "btn btn-quitar";
  quitar.dataset.id = favorito.id;
  quitar.textContent = "Quitar";

  item.append(imagen, nombre, quitar);
  return item;
}

function renderizarFavoritos() {
  if (favoritos.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "Aún no tienes favoritos.";
    listaFavoritos.replaceChildren(vacio);
    return;
  }
  listaFavoritos.replaceChildren(...favoritos.map(crearItemFavorito));
}

lista.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".btn-favorito");
  if (!boton) return;
  alternarFavorito({
    id: Number(boton.dataset.id),
    name: boton.dataset.nombre,
    image: boton.dataset.imagen,
  });
});

listaFavoritos.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".btn-quitar");
  if (!boton) return;
  favoritos = favoritos.filter((favorito) => favorito.id !== Number(boton.dataset.id));
  guardarFavoritos();
  renderizarFavoritos();
  actualizarBotonesFavorito();
});

/* ---------- Inicio ---------- */

renderizarFavoritos();
cargarPersonajes();
