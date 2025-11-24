const tituloEl = document.getElementById('titulo');
const contenidoEl = document.getElementById('contenido');
const tagsEl = document.getElementById('lista-tags');
const tonosEl = document.getElementById('lista-tonos');
const temasEl = document.getElementById('lista-temas');
const mensajeEl = document.getElementById('mensaje');
const endpointInput = document.getElementById('endpoint');
const cargarBtn = document.getElementById('cargar');

function renderLista(lista = [], container, emptyText) {
  container.innerHTML = '';

  if (!lista || lista.length === 0) {
    const li = document.createElement('li');
    li.textContent = emptyText;
    container.appendChild(li);
    return;
  }

  lista.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item?.nombre ?? 'Sin nombre';
    container.appendChild(li);
  });
}

function renderDatos(data) {
  const articulo = data?.articulo ?? {};
  const variables = Array.isArray(data?.variables_categorizacion)
    ? data.variables_categorizacion[0]
    : {};

  tituloEl.textContent = articulo.titulo ?? 'Sin título';
  contenidoEl.textContent = articulo.contenido ?? 'Sin contenido';

  renderLista(variables?.tags, tagsEl, 'Sin tags');
  renderLista(variables?.tonos, tonosEl, 'Sin tonos');
  renderLista(variables?.temas, temasEl, 'Sin temas');
}

async function cargarDatos(endpoint) {
  mensajeEl.textContent = '';

  if (!endpoint) {
    mensajeEl.textContent = 'Debes ingresar un endpoint válido.';
    return;
  }

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    renderDatos(data);
  } catch (error) {
    console.error('No se pudieron cargar los datos', error);
    mensajeEl.textContent =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al cargar los datos.';
  }
}

function inicializar() {
  if (!tituloEl || !contenidoEl || !tagsEl || !tonosEl || !temasEl || !mensajeEl) {
    console.error('No se encontraron los nodos necesarios en el DOM. Revisa los IDs.');
    return;
  }

  cargarBtn?.addEventListener('click', () => {
    void cargarDatos(endpointInput?.value?.trim());
  });
}

document.addEventListener('DOMContentLoaded', inicializar);

// Exportamos para tests manuales en consola si es necesario
export { cargarDatos, renderDatos };
