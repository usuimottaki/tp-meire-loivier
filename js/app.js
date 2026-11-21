"use strict";

const URL_API = "https://rickandmortyapi.com/api/character";
const ESTADOS = { alive: "Vivo", dead: "Muerto", unknown: "Desconocido" };

const lista = document.getElementById("lista");
const mensaje = document.getElementById("mensaje");

const filtros = { nombre: "", estado: "" };
let paginaActual = 1;
let totalPaginas = 1;
let cargando = false;

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
  }
  return exito;
}



/* ---------- Inicio ---------- */

cargarPersonajes();
