(() => {
    const App = (() => {
        const constantes = {
            tiempoExpiracion: 15 * 1000,
        }
        //Referencias al DOM
        const htmlElements = {
            formulario: document.querySelector('#formulario-buscar'),
            inputBuscar: document.querySelector('#buscar-pokemon-nombre-id'),
            contenedorPokemon: document.querySelector('#pokemon-contendor'),
            listaPokemon: document.querySelector('#lista-pokemon'),
            listaFavoritosPokemons: document.querySelector('#lista-favoritos-pokemon'),
            botonBuscar: document.querySelector('#buscar'),
            botonHistorico: document.querySelector('#historico'),
            botonFavoritos: document.querySelector('#favoritos'),
            selectorBusqueda: document.querySelector('#buscar-por'),
        };
        //Plantillas HTML (vistas)
        const templates = {
            tarjetaPokemon: (pokemon, estadoCache) => {
                //para el tipos de pokemon
                const tiposHtml = pokemon.types.map(tipo => `<span class="tipo-insignia">${tipo.type.name}</span>`).join('')
                //habilidades del pokemon
                const habilidadesHtml = pokemon.abilities.map(habilidad => {
                    const claseHabilidad = habilidad.is_hidden ? 'habilidad-oculta' : 'habilidad-normal';
                    return `<span class="${claseHabilidad}">${habilidad.ability.name}</span>`
                }).join('')
                //Estadisticas del pokemon
                const estadisticasHtml = pokemon.stats.map(estadisticas => `
                <div class="etiqueta-estadisticas">${estadisticas.stat.name.toUpperCase()}:</div>
                <div class="contenedor-barra-estadisticas">
                    <div class="barra-estadisticas" style="width: ${Math.min(estadisticas.base_stat, 100)}%"></div>
                </div>`).join('')
                const estadoBotonFavorito = utils.verificarSiPokemonEsFavorito(pokemon.id) ? 'boton-favorito-seleccionado' : '';
                return `
                <div class="tarjeta-pokemon ${estadoCache}">
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
                        <button class="boton-favorito ${estadoBotonFavorito}" data-id-pokemon="${pokemon.id}" >❤</button>
                    </div>
                </div>`;
            },
            tarjetaHabilidad: async (habilidad) => {
                const promesasPokemones = habilidad.pokemon.map(async hp => {
                    let pokemon;
                    let indiceHabilidad;
                    try {
                        pokemon = await utils.fetchURL(hp.pokemon.url);
                    } catch (error) {
                        console.error(error);
                        return '';
                    }
                    indiceHabilidad =pokemon.abilities.findIndex(pa => pa.ability.name === habilidad.name)
                    const habilidadOculta = pokemon.abilities[indiceHabilidad].is_hidden ? "(oculta)" : ""
                    return `
                    <div class="pokemon-habilidad">
                        <img class="imagen-pokemon-habilidad" src="${pokemon.sprites.front_default}" alt="imagen de pokemon ${pokemon.name}">
                        <span class="nombre-pokemon-habilidad">${pokemon.name}</span>
                        <span class="habilidad-pokemon-oculta">${habilidadOculta}</span>
                        
                    </div>
                    `;
                });
                const pokemonesHTML = await Promise.all(promesasPokemones);
                return `
                <div class="tarjeta-habilidad">
                <div class="informacion-pokemon">
                    <h2 class="nombre-pokemon">✨ ${habilidad.name} <span class="habilidad-id">#${habilidad.id}</span></h2>
                </div>
                    <div class="efecto">
                        <h3>EFECTO</h3>
                        <p>${habilidad.effect_entries[1].short_effect}</p>
                    </div>
                    <h3>Pokémon con esta habilidad ${habilidad.pokemon.length}</h3>
                    <div class="contenedor-pokemon-habilidad">
                        ${pokemonesHTML.join('\n')}
                    </div>
                </div>`;
            },
            error: (mensaje) => `<div class="mensaje-error"> ERROR: ${mensaje.toUpperCase()}</div>`,
            cargando: () => `<div class="cargando">CARGANDO DATOS...</div>`,
            vacioHistorial: () => {
                return `
                <div id="vacio">
                    <h2 id="imagen">📜 </h2>
                    <h2 id="titulo">No hay pokémones en el histórico</h2>
                    <p id="informacion">Busca un pokémon para agregarlo aquí</p>
                </div>`
            },
            vacioFavoritos: () => {
                return `
              <div id="vacio">
                    <h2 id="imagen">❤️</h2>
                    <h2 id="titulo">No tienes pokèmones favoritos</h2>
                    <p id="informacion">Busca un pokèmon y marcalo como favorito</p>
              </div>`
            },
            listaPokemons: (pokemon) => {
                //para el tipos de pokemon
                const tiposHtml = pokemon.types.map(tipo => `<span id="tipo-insignia-lista-pokemon" class="tipo-insignia">${tipo.type.name}</span>`).join('');
                const estadoBotonFavorito = utils.verificarSiPokemonEsFavorito(pokemon.id) ? 'boton-favorito-seleccionado' : '';
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
                        <button class="boton-favorito ${estadoBotonFavorito}" data-id-pokemon="${pokemon.id}">❤</button>
                     </div>
                     <div class="contenedor-boton-eliminar">
                        <button class="boton-eliminar" data-id-pokemon="${pokemon.id}">🗑️</button>
                     </div>
                </div>`
            },
            botonLimpiarTodo: () => {
                return `
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
            async fetchHabilidad(busqueda) {
                try {
                    const response = await fetch(`https://pokeapi.co/api/v2/ability/${busqueda.toLowerCase()}`);
                    if (!response.ok) {
                        throw new Error('Habilidad no encontrada');
                    }
                    const data = await response.json();
                    return data;
                } catch (error) {
                    throw error;
                }
            },
            async fetchURL(url) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Error al conectarse con la API');
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
                const index = historial.findIndex(p => p.id == pokemon.id || p.name === pokemon.name.toLowerCase())
                if (index !== -1) {
                    historial.splice(index, 1);
                }
                //creamos un historial con tiempo
                const historialConTiempo = {
                    ...pokemon,
                    timestamp: fechaAhoraActual,
                };
                historial.push(historialConTiempo);
                // Guardar
                localStorage.setItem(key, JSON.stringify(historial));
            },
            guardarCachePokemones(cachePokemones) {
                const key = "historialPokemon";
                localStorage.setItem(key, JSON.stringify(cachePokemones));

            },
            guardarPokemonFavorito(pokemon) {
                const key = "pokemonesFavoritos";
                let pokemonesFavoritos = JSON.parse(localStorage.getItem(key)) || [];
                pokemonesFavoritos.push(pokemon);
                localStorage.setItem(key, JSON.stringify(pokemonesFavoritos));
            },

            guardarPokemonesFavoritos(pokemones) {
                const key = "pokemonesFavoritos";
                localStorage.setItem(key, JSON.stringify(pokemones));
            },
            obtenerCachePokemones() {
                let cachePokemones = JSON.parse(localStorage.getItem('historialPokemon')) || [];
                return cachePokemones
            },
            obtenerPokemonCache(pokemon) {
                let cachePokemones = JSON.parse(localStorage.getItem('historialPokemon')) || [];
                const cachePokemonEncontrado = cachePokemones.find(p => p.id == pokemon || p.name === pokemon);
                return cachePokemonEncontrado;
            },

            obtenerPokemonesFavoritos() {
                let pokemonesFavoritos = JSON.parse(localStorage.getItem('pokemonesFavoritos')) || [];
                return pokemonesFavoritos
            },
            verificarPokemonApiCache(busqueda) {
                let historial = JSON.parse(localStorage.getItem('historialPokemon')) || [];
                const fechaAhoraActual = Date.now();
                const pokemonEncontrado = historial.find(p => p.id == busqueda || p.name === busqueda.toLowerCase());
                if (pokemonEncontrado) {
                    const tiempoTrancurrido = fechaAhoraActual - pokemonEncontrado.timestamp;
                    if (tiempoTrancurrido > constantes.tiempoExpiracion) {
                        return "cache-expirado";
                    } else
                        return "cache";
                } else {
                    return "api"
                }
            },
            verificarSiPokemonEsFavorito(pokemon_id) {
                const pokemonesFavoritos = utils.obtenerPokemonesFavoritos();
                return pokemonesFavoritos.some(p => p.id === pokemon_id);
            },

            redirecionarAlIndex(nombrePokemon = null) {
                if (nombrePokemon === null) {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = `index.html?busqueda=${nombrePokemon}`;
                }
            },
            redirecionarAlHistorico() {
                window.location.href = 'historico.html';
            },
            redirecionarAlFavoritos() {
                window.location.href = 'favoritos.html';
            },
            renderizarListaPokemon(listaPokemones) {
                if (listaPokemones.length === 0) {
                    htmlElements.listaPokemon.innerHTML = templates.vacioHistorial()
                    return;
                }
                let listaOrdenaPokemones = listaPokemones.sort((a, b) => b.timestamp - a.timestamp);

                htmlElements.listaPokemon.innerHTML = listaOrdenaPokemones.map(pokemon => templates.listaPokemons(pokemon)).join('') +
                    templates.botonLimpiarTodo();
            },
            renderizarListaPokemonesFavoritos(listaPokemones) {
                if (listaPokemones.length === 0) {
                    htmlElements.listaFavoritosPokemons.innerHTML = templates.vacioFavoritos();
                    return;
                }
                htmlElements.listaFavoritosPokemons.innerHTML = listaPokemones.map(pokemon => templates.listaFavoritosPokemons(pokemon)).join('') +
                    templates.botonLimpiarTodo();
            },
            borrarPokemonCache(pokemon_id) {
                let cachePokemones = utils.obtenerCachePokemones();
                let id = cachePokemones.findIndex(p => p.id === pokemon_id);
                if (id !== -1) {
                    cachePokemones.splice(id, 1);
                    utils.guardarCachePokemones(cachePokemones);
                }
            },
            borrarPokemonFavorito(pokemon_id) {
                let pokemonesFavoritos = utils.obtenerPokemonesFavoritos();
                let id = pokemonesFavoritos.findIndex(p => p.id === pokemon_id);
                if (id !== -1) {
                    pokemonesFavoritos.splice(id, 1);
                    utils.guardarPokemonesFavoritos(pokemonesFavoritos);
                }
            }
        }
        //Manejadores de Eventos
        const handlers = {
            async alHacerClickBuscarPokemon(e) {
                e.preventDefault();
                const busqueda = htmlElements.inputBuscar.value.trim();
                const buscarPor = htmlElements.selectorBusqueda.value.toLowerCase();

                if (!busqueda) {
                    utils.render(templates.error("Ingresa un nombre"));
                    return;
                }
                utils.render(templates.cargando());
                switch (buscarPor) {
                    case "pokémon":
                        try {
                            const estadoCache = utils.verificarPokemonApiCache(busqueda);

                            if (estadoCache === "api" || estadoCache === "cache-expirado") {
                                const pokemon = await utils.fetchPokemon(busqueda);
                                utils.render(templates.tarjetaPokemon(pokemon, estadoCache));
                                utils.guardarBusqueda(pokemon);
                            } else if (estadoCache === "cache") {
                                const pokemon = utils.obtenerPokemonCache(busqueda);
                                utils.render(templates.tarjetaPokemon(pokemon, estadoCache));
                            }
                        } catch (error) {
                            utils.render(templates.error(error.message));
                        }
                        break;
                    case "habilidad":
                        try {
                            const habilidad = await utils.fetchHabilidad(busqueda);
                            const html = await templates.tarjetaHabilidad(habilidad);
                            utils.render(html);
                        } catch (error) {
                            utils.render(templates.error(error.message));
                        }
                        console.log("habilidad");
                        break;
                }


            },
            alHacerClickHistorico() {
                utils.redirecionarAlHistorico();
            },
            alHacerClickBuscar() {

                utils.redirecionarAlIndex();
            },
            alHacerClickFavoritos() {
                utils.redirecionarAlFavoritos();
            },
            alHacerClickTarjetaPokemon(e) {
                const botonEliminar = e.target.closest(".boton-eliminar");
                const botonFavorito = e.target.closest(".boton-favorito");
                const botonLimpiarTodo = e.target.closest(".boton-limpiar-todo");
                const tarjetaPokemonHistorico = e.target.closest(".tarjeta-pokemon-historico");
                if (botonEliminar) {
                    const id = parseInt(botonEliminar.getAttribute("data-id-pokemon"));
                    if (confirm(`¿Estás seguro de eliminar el pokémon con id: ${id} del historial ?`)) {
                        utils.borrarPokemonCache(id);
                        utils.renderizarListaPokemon(utils.obtenerCachePokemones());
                    }
                } else if (botonFavorito) {
                    const id = parseInt(botonFavorito.getAttribute("data-id-pokemon"));
                    if (botonFavorito.classList.contains("boton-favorito-seleccionado")) {
                        botonFavorito.classList.remove("boton-favorito-seleccionado");
                        utils.borrarPokemonFavorito(id);
                    } else {
                        botonFavorito.classList.add("boton-favorito-seleccionado");
                        utils.guardarPokemonFavorito(utils.obtenerPokemonCache(id));
                    }
                } else if (botonLimpiarTodo) {
                    if (confirm("¿Estás seguro de que quieres limpiar todo el histórico y el caché?")) {
                        utils.guardarCachePokemones([]);
                        utils.renderizarListaPokemon([]);
                    }
                } else if (tarjetaPokemonHistorico) {
                    const nombrePokemon = tarjetaPokemonHistorico.getAttribute("data-nombre-pokemon");
                    utils.redirecionarAlIndex(nombrePokemon);
                }
            },
            alHacerClickTarjetaPokemonFavorito(e) {
                const botonEliminar = e.target.closest(".boton-eliminar");
                const botonLimpiarTodo = e.target.closest(".boton-limpiar-todo");
                const tarjetaPokemonHistorico = e.target.closest(".tarjeta-pokemon-historico");

                if (botonEliminar) {
                    const id = parseInt(botonEliminar.getAttribute("data-id-pokemon"));
                    if (confirm(`¿Estás seguro de eliminar de favoritos el pokémon con id: ${id} del historial ?`)) {
                        utils.borrarPokemonFavorito(id);
                        utils.renderizarListaPokemonesFavoritos(utils.obtenerPokemonesFavoritos());
                    }
                } else if (botonLimpiarTodo) {
                    if (confirm("¿Estás seguro de que quieres eliminar todos los favoritos?")) {
                        utils.guardarPokemonesFavoritos([]);
                        utils.renderizarListaPokemonesFavoritos([]);
                    }
                } else if (tarjetaPokemonHistorico) {
                    const nombrePokemon = tarjetaPokemonHistorico.getAttribute("data-nombre-pokemon");
                    utils.redirecionarAlIndex(nombrePokemon);
                }
            },
            alHacerClickBotonFavoritos(e) {
                const botonFavorito = e.target.closest(".boton-favorito");
                const id = parseInt(botonFavorito.getAttribute("data-id-pokemon"));
                if (botonFavorito.classList.contains("boton-favorito-seleccionado")) {
                    botonFavorito.classList.remove("boton-favorito-seleccionado");
                    utils.borrarPokemonFavorito(id);
                } else {
                    botonFavorito.classList.add("boton-favorito-seleccionado");
                    utils.guardarPokemonFavorito(utils.obtenerPokemonCache(id));
                }
            },
            async alCargarContenidoDeDOMIndex() {
                const parametros = new URLSearchParams(window.location.search);
                if (parametros.has("busqueda")) {
                    const busqueda = parametros.get("busqueda");
                    htmlElements.inputBuscar.value = busqueda;
                    utils.render(templates.cargando());
                    try {
                        const estadoCache = utils.verificarPokemonApiCache(busqueda);

                        if (estadoCache === "api" || estadoCache === "cache-expirado") {
                            const pokemon = await utils.fetchPokemon(busqueda);
                            utils.render(templates.tarjetaPokemon(pokemon, estadoCache));
                            utils.guardarBusqueda(pokemon);
                        } else if (estadoCache === "cache") {
                            const pokemon = utils.obtenerPokemonCache(busqueda);
                            utils.render(templates.tarjetaPokemon(pokemon, estadoCache));
                        }
                    } catch (error) {
                        utils.render(templates.error(error.message));
                    }
                }
            }
        }
        //Inicialización (API Pública)
        return {
            init() {
                htmlElements.botonBuscar.addEventListener('click', handlers.alHacerClickBuscar);
                htmlElements.botonHistorico.addEventListener('click', handlers.alHacerClickHistorico);
                htmlElements.botonFavoritos.addEventListener('click', handlers.alHacerClickFavoritos);

                if (window.location.pathname.includes('index.html')) {
                    htmlElements.formulario.addEventListener('submit', handlers.alHacerClickBuscarPokemon);
                    htmlElements.contenedorPokemon.addEventListener('click', handlers.alHacerClickBotonFavoritos);
                    document.addEventListener('DOMContentLoaded', handlers.alCargarContenidoDeDOMIndex);
                }

                if (window.location.pathname.includes('historico.html')) {
                    htmlElements.listaPokemon.addEventListener('click', handlers.alHacerClickTarjetaPokemon);
                    utils.renderizarListaPokemon(utils.obtenerCachePokemones());
                }

                if (window.location.pathname.includes('favoritos.html')) {
                    utils.renderizarListaPokemonesFavoritos(utils.obtenerPokemonesFavoritos());
                    htmlElements.listaFavoritosPokemons.addEventListener('click', handlers.alHacerClickTarjetaPokemonFavorito);
                }
            }
        };
    })();
    //Ejecutar la Aplicación
    App.init();
})();