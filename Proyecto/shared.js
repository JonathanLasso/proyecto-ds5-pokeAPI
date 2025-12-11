(() => {
    const App = (() => {
        const constantes = {
            tiempoExpiracion: 15 * 1000,
        }
        //Referencias al DOM
        const htmlElements = {
            formulario: document.querySelector('#formulario-buscar-pokemon'),
            inputBuscar: document.querySelector('#buscar-pokemon-nombre-id'),
            contenedorPokemon: document.querySelector('#pokemon-contendor'),
            listaPokemon: document.querySelector('#lista-pokemon'),
            listaFavoritosPokemons: document.querySelector('#lista-favoritos-pokemons'),
            botonBuscar: document.querySelector('#buscar'),
            botonHistorico: document.querySelector('#historico'),
            botonFavoritos: document.querySelector('#favoritos'),
        };
        //Plantillas HTML (vistas)
        const templates = {
            tarjetaPokemon: (pokemon) => {
                //para el tipos de pokemon
                const tiposHtml = pokemon.types.map(tipo => `<span class="tipo-insignia">${tipo.type.name}</span>`).join('')
                //habilidades del pokemon
                const habilidadesHtml = pokemon.abilities.map(habilidad => {
                    const claseHabilidad = habilidad.is_hidden ? 'habilidad-oculta' : 'habilidad-normal';
                    return `<span class="${claseHabilidad}">${habilidad.ability.name}</span>`}).join('')
                //Estadisticas del pokemon
                const estadisticasHtml = pokemon.stats.map(estadisticas => `
                <div class="etiqueta-estadisticas">${estadisticas.stat.name.toUpperCase()}:</div>
                <div class="contenedor-barra-estadisticas">
                    <div class="barra-estadisticas" style="width: ${Math.min(estadisticas.base_stat, 100)}%"></div>
                </div>`).join('')
                //Para verificar si viene del cache o API
                const cacheBadge = pokemon.esCache ? 'cache' : 'api';

                return `
                <div class="tarjeta-pokemon ${cacheBadge}">
                    <div class="contenedor-imagen-pokemon">
                        <img class="imagen-pokemon" src="${pokemon.sprites.front_default || ''}" alt="${pokemon.name}">
                    </div>
                    <div class="informacion-pokemon">
                        <h2 class="nombre-pokemon">#${pokemon.id} ${pokemon.name}</h2>
                        <div class="tipos-pokemon">${tiposHtml}</div>
                        <h2 class="habilidades-pokemon">Habilidades</h2>
                        <div class="habilidad-pokemon">${habilidadesHtml}</div>
                        <div class="estadisticas-pokemon">${estadisticasHtml}</div>
                    </div>
                    <div class="contenedor-boton-favoritos">
                        <button class="boton-favoritos-buscar">❤️</button>
                    </div>
                </div>`;
            },
            error: (mensaje) => `<div class="mensaje-error"> ERROR: ${mensaje.toUpperCase()}</div>`,
            cargando: () => `<div class="cargando">CARGANDO DATOS...</div>`,
            vacioHistorial: () => {
                return`
                <div id="vacio-historico">
                    <h2 id="imagen-historico">📜 </h2>
                    <h2 id="titulo">No hay pokémones en el histórico</h2>
                    <p id="informacion-vacio">Busca un pokémon para agregarlo aquí</p>
                </div>`
            },
            listaPokemons: (pokemon) => {
                //para el tipos de pokemon
                const tiposHtml = pokemon.types.map(tipo => `<span id="tipo-insignia-lista-pokemon" class="tipo-insignia">${tipo.type.name}</span>`).join('')
                return `
                <div class="tarjeta-pokemon-historico" data-nombre-pokemon="${pokemon.name}">
                    <div class="contenedor-imagen-pokemon-historico">
                        <img class="imagen-pokemon" src="${pokemon.sprites.front_default || ''}" alt="${pokemon.name}">
                    </div>
                     <div class="informacion-pokemon">
                        <h2 class="nombre-pokemon-historico">#${pokemon.id} ${pokemon.name}</h2>
                        <div id="tipos-pokemon-historico" class="tipos-pokemon">${tiposHtml}</div>
                     </div>
                     <div class="contenedor-boton-favoritos">
                        <button class="boton-favoritos">❤️</button>
                     </div>
                     <div class="contenedor-boton-eliminar">
                        <button class="boton-eliminar" data-id-pokemon="${pokemon.id}">🗑️</button>
                     </div>
                </div>`
            },
            botonLimpiarTodo: () => {
                return`
                <div class="contendor-boton-limpiar-todo">
                    <button class="boton-limpiar-todo" >🗑️ Limpiar todo</button>
                </div>`
            },
            listaFavoritosPokemons: (pokemon) => {
                //para el tipos de pokemon
                const tiposHtml = pokemon.types.map(tipo => `<span id="tipo-insignia-lista-pokemon" class="tipo-insignia">${tipo.type.name}</span>`).join('')
                return `
                <div class="tarjeta-pokemon-historico" data-nombre-pokemon="${pokemon.name}">
                    <div class="contenedor-imagen-pokemon-historico">
                        <img class="imagen-pokemon" src="${pokemon.sprites.front_default || ''}" alt="${pokemon.name}">
                    </div>
                     <div class="informacion-pokemon">
                        <h2 class="nombre-pokemon-historico">#${pokemon.id} ${pokemon.name}</h2>
                        <div id="tipos-pokemon-historico" class="tipos-pokemon">${tiposHtml}</div>
                     </div>
                     <div class="contenedor-boton-eliminar">
                        <button class="boton-eliminar" data-id-pokemon="${pokemon.id}">🗑️</button>
                     </div>
                </div>`
            }
        }
        //Funciones de Utilidad
        const utils = {
            async fetchPokemon(busqueda) {
                try {
                    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${busqueda.toLowerCase()}`);
                    if (!response.ok) {
                        throw new Error('Pokemon no encontrado');
                    }
                    const data = await response.json();
                    return data;
                } catch (error) {
                    throw error;
                }
            },
            render(html) {
                htmlElements.contenedorPokemon.innerHTML = html;
            },
            guardarBusqueda(pokemon) {
                const key = "historialPokemon";
                const fechaAhoraActual = Date.now();
                // si no hay nada en el localstorage se crea y si no se lee el localstorage
                let historial = JSON.parse(localStorage.getItem(key)) || [];
                // Verificación si hay busquedas repetidas
                if (!historial.some(p=> p.id === pokemon.id || p.name === pokemon.name)) {
                    //creamos un historial con tiempo
                    const historialConTiempo = {
                        ...pokemon,
                        timestamp: fechaAhoraActual,
                    };
                    historial.push(historialConTiempo);
                    // Guardar
                    localStorage.setItem(key, JSON.stringify(historial));
                }
            },
            guardarCachePokemones(cachePokemones){
                const key = "historialPokemon";
                localStorage.setItem(key, JSON.stringify(cachePokemones));

            },
            obtenerCachePokemones() {
                let cachePokemones = JSON.parse(localStorage.getItem('historialPokemon')) || [];
                return cachePokemones
            },
            verificarPokemonApiCache(busqueda) {
                let historial = JSON.parse(localStorage.getItem('historialPokemon')) || [];
                const fechaAhoraActual = Date.now();
                const pokemonEncontrado = historial.find(p=> p.id == busqueda || p.name === busqueda.toLowerCase());
                if(pokemonEncontrado) {
                    const tiempoTrancurrido = fechaAhoraActual - pokemonEncontrado.timestamp;
                    if(tiempoTrancurrido > constantes.tiempoExpiracion){
                        return false
                    }
                    pokemonEncontrado.esCache = true; //creamos una propieda llamada esCache para verificar que si esta en el cache
                    htmlElements.contenedorPokemon.innerHTML = templates.tarjetaPokemon(pokemonEncontrado);
                    return true;
                }
                else {
                    return false
                }
            },
            redirecionarAlIndex(nombrePokemon = null){
                if(nombrePokemon === null) {
                    window.location.href ='index.html';
                }
                else{
                    window.location.href =`index.html?busqueda=${nombrePokemon}`;
                }
            },
            redirecionarAlHistorico(){
                window.location.href ='historico.html';
            },
            redirecionarAlFavoritos() {
              window.location.href ='favoritos.html';
            },
            renderizarListaPokemon(listaPokemones){
                if(listaPokemones.length === 0){
                    htmlElements.listaPokemon.innerHTML = templates.vacioHistorial()
                    return;
                }
                let listaOrdenaPokemones = listaPokemones.sort((a,b) => b.timestamp - a.timestamp);
                htmlElements.listaPokemon.innerHTML = listaOrdenaPokemones.map(pokemon => templates.listaPokemons(pokemon)).join('') +
                templates.botonLimpiarTodo();
            },
            borrarPokemonCache(pokemon_id){
                let cachePokemones = utils.obtenerCachePokemones();
                let id = cachePokemones.findIndex(p => p.id === pokemon_id);
                if(id !== -1){
                    cachePokemones.splice(id, 1);
                    utils.guardarCachePokemones(cachePokemones);
                }
            }
        }
        //Manejadores de Eventos
        const handlers = {
            async alHacerClickBuscarPokemon(e) {
                e.preventDefault();
                const busqueda = htmlElements.inputBuscar.value.trim();

                if (!busqueda) {
                    utils.render(templates.error("Ingresa un nombre"));
                    return;
                }

                utils.render(templates.cargando());

                try {
                    if(!utils.verificarPokemonApiCache(busqueda)) {
                        const pokemon = await utils.fetchPokemon(busqueda);
                        pokemon.esCache = false;
                        utils.render(templates.tarjetaPokemon(pokemon));
                        utils.guardarBusqueda(pokemon);
                    }
                } catch (error) {
                    utils.render(templates.error(error.message));
                }
            },
            alHacerClickHistorico(){
                utils.redirecionarAlHistorico();
            },
            alHacerClickBuscar() {
                utils.redirecionarAlIndex();
            },
            alHacerClickFavoritos() {
                utils.redirecionarAlFavoritos();
            },
            alCargarHistorico(){
                let listaPokemones = utils.obtenerCachePokemones();
                utils.renderizarListaPokemon(listaPokemones);
            },
            alHacerClickTarjetaPokemon(e){
                const botonEliminar = e.target.closest(".boton-eliminar")
                const botonLimpiarTodo = e.target.closest(".boton-limpiar-todo");
                const tarjetaPokemonHistorico = e.target.closest(".tarjeta-pokemon-historico");
                if(botonEliminar) {
                    const id = parseInt(botonEliminar.getAttribute("data-id-pokemon"));
                    if(confirm(`¿Estás seguro de eliminar el pokémon con id: ${id} del historial ?`)){
                        utils.borrarPokemonCache(id);
                        utils.renderizarListaPokemon(utils.obtenerCachePokemones());
                    }
                }
                else if(botonLimpiarTodo) {
                    if(confirm("¿Estás seguro de que quieres limpiar todo el histórico y el caché?")){
                        utils.guardarCachePokemones([]);
                        utils.renderizarListaPokemon([]);
                    }
                }
                else if(tarjetaPokemonHistorico) {
                    const nombrePokemon = tarjetaPokemonHistorico.getAttribute("data-nombre-pokemon");
                    utils.redirecionarAlIndex(nombrePokemon);
                }
            },
            async alCargarContenidoDeDOMIndex() {
                const parametros = new URLSearchParams(window.location.search);
                if(parametros.has("busqueda")){
                    const busqueda = parametros.get("busqueda");
                    if(parametros) {
                        utils.render(templates.cargando());
                        try {
                            if(!utils.verificarPokemonApiCache(busqueda)) {
                                const pokemon = await utils.fetchPokemon(busqueda);
                                pokemon.esCache = false;
                                utils.render(templates.tarjetaPokemon(pokemon));
                                utils.guardarBusqueda(pokemon);
                            }
                        } catch (error) {
                            utils.render(templates.error(error.message));
                        }
                    }
                }
            }
        }
        //Inicialización (API Pública)
        return {
            init() {
                if(window.location.pathname.includes('index.html')) {
                    htmlElements.formulario.addEventListener('submit', handlers.alHacerClickBuscarPokemon);
                    document.addEventListener('DOMContentLoaded', handlers.alCargarContenidoDeDOMIndex);
                }
                if(window.location.pathname.includes('historico.html')) {
                    htmlElements.listaPokemon.addEventListener('click', handlers.alHacerClickTarjetaPokemon);
                    handlers.alCargarHistorico();
                }
                htmlElements.botonBuscar.addEventListener('click', handlers.alHacerClickBuscar);
                htmlElements.botonHistorico.addEventListener('click', handlers.alHacerClickHistorico);
                htmlElements.botonFavoritos.addEventListener('click', handlers.alHacerClickFavoritos);
            }
        };
    })();
    //Ejecutar la Aplicación
    App.init();
})();