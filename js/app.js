// Explorador de Rick and Morty
// Consume https://rickandmortyapi.com/api (pública, sin clave).

const API = 'https://rickandmortyapi.com/api';
const CLAVE_FAVORITOS = 'rm-favoritos';

const ESTADOS = { Alive: 'Vivo', Dead: 'Muerto', unknown: 'Desconocido' };

// Estado de la aplicación
const estado = {
  pagina: 1,
  totalPaginas: 1,
  nombre: '',
  filtro: '',
  favoritos: cargarFavoritos(),
};

// Referencias al DOM
const form = document.getElementById('form-busqueda');
const inputNombre = document.getElementById('nombre');
const selectEstado = document.getElementById('filtro-estado');
const mensaje = document.getElementById('mensaje');
const lista = document.getElementById('lista');
const btnAnterior = document.getElementById('btn-anterior');
const btnSiguiente = document.getElementById('btn-siguiente');
const paginaInfo = document.getElementById('pagina-info');
const listaFavoritos = document.getElementById('favoritos');
const dialogo = document.getElementById('detalle');
const dialogoContenido = document.getElementById('detalle-contenido');

// ---------- Acceso a la API ----------

async function obtenerPersonajes() {
  const params = new URLSearchParams({ page: estado.pagina });
  if (estado.nombre) params.set('name', estado.nombre);
  if (estado.filtro) params.set('status', estado.filtro);

  const respuesta = await fetch(`${API}/character?${params}`);
  // La API responde 404 cuando la búsqueda no tiene resultados
  if (respuesta.status === 404) return { info: { pages: 0 }, results: [] };
  if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
  return respuesta.json();
}

async function obtenerPersonaje(id) {
  const respuesta = await fetch(`${API}/character/${id}`);
  if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
  return respuesta.json();
}

async function obtenerEpisodios(urls) {
  if (urls.length === 0) return [];
  const ids = urls.map((url) => url.split('/').pop()).join(',');
  const respuesta = await fetch(`${API}/episode/${ids}`);
  if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
  const datos = await respuesta.json();
  // Con un solo id la API devuelve un objeto en lugar de un arreglo
  return Array.isArray(datos) ? datos : [datos];
}

// ---------- Renderizado ----------

function mostrarMensaje(texto, tipo = '') {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`.trim();
}

function crearTarjeta(personaje) {
  const esFavorito = estado.favoritos.some((f) => f.id === personaje.id);
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';
  tarjeta.innerHTML = `
    <button type="button" class="tarjeta-imagen" data-detalle="${personaje.id}" aria-label="Ver detalle de ${personaje.name}">
      <img src="${personaje.image}" alt="${personaje.name}" loading="lazy" width="300" height="300">
    </button>
    <div class="tarjeta-cuerpo">
      <h3>${personaje.name}</h3>
      <p class="estado estado-${personaje.status.toLowerCase()}">
        <span class="punto"></span>${ESTADOS[personaje.status] ?? personaje.status} · ${personaje.species}
      </p>
      <div class="tarjeta-acciones">
        <button type="button" class="btn btn-chico" data-detalle="${personaje.id}">Ver detalle</button>
        <button type="button" class="btn btn-chico ${esFavorito ? 'btn-activo' : ''}" data-favorito="${personaje.id}" aria-pressed="${esFavorito}">
          ${esFavorito ? '★ Favorito' : '☆ Favorito'}
        </button>
      </div>
    </div>
  `;
  // Guardamos los datos mínimos para poder agregarlo a favoritos
  tarjeta.dataset.id = personaje.id;
  tarjeta.dataset.nombre = personaje.name;
  tarjeta.dataset.imagen = personaje.image;
  return tarjeta;
}

function renderizarLista(personajes) {
  lista.innerHTML = '';
  personajes.forEach((p) => lista.appendChild(crearTarjeta(p)));
}

function renderizarPaginacion() {
  const total = Math.max(estado.totalPaginas, 1);
  paginaInfo.textContent = `Página ${estado.totalPaginas ? estado.pagina : 0} de ${estado.totalPaginas}`;
  btnAnterior.disabled = estado.pagina <= 1;
  btnSiguiente.disabled = estado.pagina >= total;
}

function renderizarFavoritos() {
  listaFavoritos.innerHTML = '';
  if (estado.favoritos.length === 0) {
    listaFavoritos.innerHTML = '<li class="vacio">Todavía no agregaste favoritos.</li>';
    return;
  }
  estado.favoritos.forEach((fav) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <img src="${fav.imagen}" alt="" width="40" height="40">
      <button type="button" class="enlace" data-detalle="${fav.id}">${fav.nombre}</button>
      <button type="button" class="btn btn-chico" data-quitar="${fav.id}" aria-label="Quitar ${fav.nombre} de favoritos">Quitar</button>
    `;
    listaFavoritos.appendChild(item);
  });
}

async function cargarPagina() {
  mostrarMensaje('Cargando personajes…', 'cargando');
  lista.setAttribute('aria-busy', 'true');
  btnAnterior.disabled = true;
  btnSiguiente.disabled = true;

  try {
    const datos = await obtenerPersonajes();
    estado.totalPaginas = datos.info.pages;
    renderizarLista(datos.results);
    if (datos.results.length === 0) {
      mostrarMensaje('No se encontraron personajes con esos criterios.');
    } else {
      mostrarMensaje('');
    }
  } catch (error) {
    console.error(error);
    lista.innerHTML = '';
    estado.totalPaginas = 0;
    mostrarMensaje('No se pudo conectar con la API. Revisá tu conexión e intentá de nuevo.', 'error');
  } finally {
    lista.removeAttribute('aria-busy');
    renderizarPaginacion();
  }
}

// ---------- Detalle del personaje (origen, ubicación y episodios) ----------

async function abrirDetalle(id) {
  dialogoContenido.innerHTML = '<p class="mensaje cargando">Cargando detalle…</p>';
  dialogo.showModal();

  try {
    const personaje = await obtenerPersonaje(id);
    const episodios = await obtenerEpisodios(personaje.episode);
    dialogoContenido.innerHTML = `
      <div class="detalle-cabecera">
        <img src="${personaje.image}" alt="${personaje.name}" width="160" height="160">
        <div>
          <h2>${personaje.name}</h2>
          <dl class="datos">
            <dt>Estado</dt><dd>${ESTADOS[personaje.status] ?? personaje.status}</dd>
            <dt>Especie</dt><dd>${personaje.species}${personaje.type ? ` (${personaje.type})` : ''}</dd>
            <dt>Género</dt><dd>${personaje.gender}</dd>
            <dt>Origen</dt><dd>${personaje.origin.name}</dd>
            <dt>Ubicación</dt><dd>${personaje.location.name}</dd>
          </dl>
        </div>
      </div>
      <h3>Aparece en ${episodios.length} episodio${episodios.length === 1 ? '' : 's'}</h3>
      <ul class="episodios">
        ${episodios.map((e) => `<li><span class="codigo">${e.episode}</span> ${e.name} <small>${e.air_date}</small></li>`).join('')}
      </ul>
    `;
  } catch (error) {
    console.error(error);
    dialogoContenido.innerHTML = '<p class="mensaje error">No se pudo cargar el detalle del personaje.</p>';
  }
}

// ---------- Favoritos (localStorage) ----------

function cargarFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) ?? [];
  } catch {
    return [];
  }
}

function guardarFavoritos() {
  localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(estado.favoritos));
}

function alternarFavorito(tarjeta) {
  const id = Number(tarjeta.dataset.id);
  const existe = estado.favoritos.some((f) => f.id === id);
  if (existe) {
    estado.favoritos = estado.favoritos.filter((f) => f.id !== id);
  } else {
    estado.favoritos.push({ id, nombre: tarjeta.dataset.nombre, imagen: tarjeta.dataset.imagen });
  }
  guardarFavoritos();
  renderizarFavoritos();
  actualizarBotonFavorito(id);
}

function quitarFavorito(id) {
  estado.favoritos = estado.favoritos.filter((f) => f.id !== id);
  guardarFavoritos();
  renderizarFavoritos();
  actualizarBotonFavorito(id);
}

function actualizarBotonFavorito(id) {
  const boton = lista.querySelector(`[data-favorito="${id}"]`);
  if (!boton) return;
  const esFavorito = estado.favoritos.some((f) => f.id === id);
  boton.classList.toggle('btn-activo', esFavorito);
  boton.setAttribute('aria-pressed', esFavorito);
  boton.textContent = esFavorito ? '★ Favorito' : '☆ Favorito';
}

// ---------- Eventos ----------

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  estado.nombre = inputNombre.value.trim();
  estado.filtro = selectEstado.value;
  estado.pagina = 1;
  cargarPagina();
});

selectEstado.addEventListener('change', () => form.requestSubmit());

btnAnterior.addEventListener('click', () => {
  if (estado.pagina > 1) {
    estado.pagina--;
    cargarPagina();
  }
});

btnSiguiente.addEventListener('click', () => {
  if (estado.pagina < estado.totalPaginas) {
    estado.pagina++;
    cargarPagina();
  }
});

lista.addEventListener('click', (evento) => {
  const botonFavorito = evento.target.closest('[data-favorito]');
  if (botonFavorito) {
    alternarFavorito(botonFavorito.closest('.tarjeta'));
    return;
  }
  const botonDetalle = evento.target.closest('[data-detalle]');
  if (botonDetalle) abrirDetalle(botonDetalle.dataset.detalle);
});

listaFavoritos.addEventListener('click', (evento) => {
  const botonQuitar = evento.target.closest('[data-quitar]');
  if (botonQuitar) {
    quitarFavorito(Number(botonQuitar.dataset.quitar));
    return;
  }
  const botonDetalle = evento.target.closest('[data-detalle]');
  if (botonDetalle) abrirDetalle(botonDetalle.dataset.detalle);
});

dialogo.addEventListener('click', (evento) => {
  // Cerrar al hacer clic fuera del contenido o en el botón de cerrar
  if (evento.target === dialogo || evento.target.closest('[data-cerrar]')) dialogo.close();
});

// ---------- Inicio ----------

renderizarFavoritos();
cargarPagina();
