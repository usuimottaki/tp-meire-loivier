# Explorador de Rick and Morty

Aplicación web que consume la API pública de Rick and Morty para explorar sus personajes. Permite buscar por nombre, filtrar por estado, navegar por páginas y guardar personajes favoritos que se conservan al recargar la página.

**Autor:** Olivier Meire · Fundamentos de Desarrollo Web · UCSA
## Sitios publicados
- GitHub Pages: https://github.com/usuimottaki/tp-meire-loivier
- Vercel / Netlify: https://vercel.com/olivier-meire/tp-meire-loivier / https://app.netlify.com/projects/tp-meire-loivier
## Funcionalidades
- Listado de personajes con imagen, nombre, estado y especie.
- Búsqueda por nombre y filtro por estado (vivo, muerto, desconocido).
- Paginación con botones «Anterior» y «Siguiente».
- Ventana de detalle de cada personaje: género, origen, ubicación actual y lista de episodios en los que aparece (endpoints `/character/{id}` y `/episode/{ids}`).
- Favoritos guardados en `localStorage`, con opción de quitarlos.
- Indicador de carga, mensaje cuando no hay resultados y mensaje de error si falla la conexión.
- Número de versión visible en el pie de página.

## Tecnologías
- HTML5, CSS3, JavaScript (ES6+), Fetch API, localStorage.
- [The Rick and Morty API](https://rickandmortyapi.com).

## Estructura del proyecto
tp-apellido-nombre/
├── index.html        Página principal
├── README.md         Documentación del proyecto
├── .gitignore        Archivos excluidos del repositorio
├── css/
│   └── estilos.css   Estilos de la aplicación
├── js/
│   └── app.js        Lógica: acceso a la API, renderizado y eventos
└── img/
    └── captura.png   Captura usada en este README
## Cómo ejecutarlo localmente
1. Abrir `index.html` en el navegador (o con Live Server).

## Despliegue
El sitio se publica desde la rama `main` (carpeta raíz) en GitHub Pages y en Vercel o Netlify. Ambas plataformas están conectadas al repositorio: cada `git push` a `main` actualiza las dos URL automáticamente, sin subir archivos a mano.
