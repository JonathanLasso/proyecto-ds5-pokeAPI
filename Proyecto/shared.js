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
            sugerencias: document.querySelector('#sugerencias'),
        };
        //Plantillas HTML (vistas)
        const templates = {
            tarjetaPokemon: (pokemon, estadoCache, pokemonEvoluciones = [], tipoEvolucion) => {
                // Tipos
                const tiposHtml = pokemon.types.map(tipo => `<span class="tipo-insignia">${tipo.type.name}</span>`).join('');
                // Habilidades
                const habilidadesHtml = pokemon.abilities.map(habilidad => {
                    const claseHabilidad = habilidad.is_hidden ? 'habilidad-oculta' : 'habilidad-normal';
                    if(claseHabilidad === "habilidad-oculta") {
                        return `<span class="${claseHabilidad}">${habilidad.ability.name} (Oculta)</span>`;
                    }
                    else{
                        return `<span class="${claseHabilidad}">${habilidad.ability.name}</span>`;
                    }
                }).join('');
                // Estadísticas
                const estadisticasHtml = pokemon.stats.map(estadisticas => `
                    <div class="etiqueta-estadisticas"> ${estadisticas.stat.name.toUpperCase()}:</div>
                    <div class="contenedor-barra-estadisticas">
                        <div class="barra-estadisticas" style="width: ${Math.min(estadisticas.base_stat, 100)}%"></div>
                    </div>
                `).join('');
                // Favorito
                const estadoBotonFavorito = utils.verificarSiPokemonEsFavorito(pokemon.id) ? 'boton-favorito-seleccionado' : '';
                let evolucionesPokemon = '';
                // Evolución Lineal
                if (tipoEvolucion === "lineal") {
                    evolucionesPokemon = `
                        <div class="evoluciones ${tipoEvolucion}">
                            ${pokemonEvoluciones.map((evolucion, index) => {
                                const estadoSeleccionado = utils.verificarPokemonSeleccionado(evolucion.name) ? 'evolucion-pokemon-seleccionado' : '';
                                    return `
                                    <div class="contenedor-evoluciones ${tipoEvolucion}">
                                        <div class="evolucion-pokemon ${estadoSeleccionado}"data-nombre-pokemon="${evolucion.name}">
                                            <img class="imagen-pokemon-evolucion" src="${evolucion.sprite}" alt="${evolucion.name}">
                                            <span class="nombre-pokemon-evolucion"> ${evolucion.name}</span>
                                            <span class="nombre-pokemon-evolucion"> ${evolucion.level || evolucion.condition || ""} </span>
                                        </div>
                                        ${index < pokemonEvoluciones.length - 1 ? `<span class="flecha">→</span>` : ''}
                                    </div>
                            `;}).join('')}
                        </div>
                    `;
                }
                // EVOLUCIÓN POR CONDICIÓN
                if (tipoEvolucion === "condicion" && pokemonEvoluciones.length) {
                    let pokemon = {
                        scyther: pokemonEvoluciones[0],
                        scizor: pokemonEvoluciones[1],
                        kleavor: pokemonEvoluciones[2],
                    }
                    const base = pokemonEvoluciones[0];
                    const ramas = pokemonEvoluciones.slice(1);
                    const estadoSeleccionado = utils.verificarPokemonSeleccionado(base.name) ? 'evolucion-pokemon-seleccionado' : '';
                    evolucionesPokemon = `
                        <div class="evoluciones ${tipoEvolucion} ${pokemon.scyther.name || pokemon.scizor.name || pokemon.kleavor.name}">
                            <div class="contenedor-evoluciones-base">
                                <div class="evolucion-pokemon ${estadoSeleccionado}"data-nombre-pokemon="${base.name}">
                                    <img class="imagen-pokemon-evolucion" src="${base.sprite}" alt="${base.name}">
                                    <span class="nombre-pokemon-evolucion"> ${base.name} </span>
                                </div>
                                <span class="flecha">→</span>
                            </div>
                            <div class="contenedor-evoluciones-ramas ${pokemon.scyther.name || pokemon.scizor.name || pokemon.kleavor.name}">
                                ${ramas.map(evolucion => {
                                    const estadoSeleccionado = utils.verificarPokemonSeleccionado(evolucion.name) ? 'evolucion-pokemon-seleccionado' : '';
                                    return `
                                        <div class="evolucion-pokemon ${estadoSeleccionado}"data-nombre-pokemon="${evolucion.name}">
                                            <img class="imagen-pokemon-evolucion" src="${evolucion.sprite}" alt="${evolucion.name}">
                                            <span class="nombre-pokemon-evolucion"> ${evolucion.name} </span>
                                            <span class="nombre-pokemon-evolucion"> ${evolucion.level || evolucion.condition} </span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }
                // TARJETA FINAL
                return `
                    <div class="tarjeta-pokemon ${estadoCache}">
                        <div class="contenedor-imagen-pokemon">
                            <img class="imagen-pokemon" src="${pokemon.sprites.front_default || ''}" alt="${pokemon.name}">
                        </div>
                        <div class="informacion-pokemon">
                            <audio id="audioPokemon" autoplay muted>
                                <source src="${pokemon.cries.latest}" type="audio/ogg">
                            </audio>
                            <h2 class="nombre-pokemon">#${pokemon.id} ${pokemon.name}</h2>
                            <div class="tipos-pokemon">${tiposHtml}</div>
                            <h2 class="habilidades-pokemon">Habilidades</h2>
                            <div class="habilidad-pokemon">${habilidadesHtml}</div>
                            <div class="estadisticas-pokemon">${estadisticasHtml}</div>
                        </div>
                        <div class="contenedor-boton-favoritos">
                            <button class="boton-favorito ${estadoBotonFavorito}" data-id-pokemon="${pokemon.id}">❤</button>
                        </div>
                        <hr class="linea">
                        <h4 class="titulo">Cadena de evolución</h4>
                        <div class="contenedor-evolucion-pokemon">${evolucionesPokemon}</div>
                    </div>
                `;
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
            async fetchCadenaEvolucionPokemon(busqueda) {
              try {
                  const pokemon = await utils.fetchPokemon(busqueda);
                  const respuestaEspeciePokemon = await fetch(pokemon.species.url);
                  const especiePokemon = await respuestaEspeciePokemon.json();
                  const respuestaCadenaEvolucionPokemon = await fetch(especiePokemon.evolution_chain.url);
                  const cadenaEvolucion = await respuestaCadenaEvolucionPokemon.json();
                  return cadenaEvolucion;
              }   catch (error) {
                  throw error;
              }
            },
            async fetchPokemones() {
                const respuesta = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
                const informacion = await respuesta.json();
                return informacion.results;
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
            guardarPokemonSeleccionado(pokemon) {
                localStorage.setItem("pokemonSeleccionado", pokemon)
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
            obtenerPokemonSeleccionado() {
              pokemonSeleccionado = localStorage.getItem('pokemonSeleccionado');
              return pokemonSeleccionado;
            },
            async obtenerEvolucionesPokemon(cadenaEvolucionPokemon) {
                const listaEvoluciones = [];
                try {
                    const recorrerCadenaEvolucion = async (nodoEvolucion) => {
                        const datosPokemon = await utils.fetchPokemon(nodoEvolucion.species.name);
                        const detalles = nodoEvolucion.evolution_details[0] || null;
                        listaEvoluciones.push({
                            name: datosPokemon.name,
                            sprite: datosPokemon.sprites.front_default,
                            level: detalles?.min_level || null,
                            condition: detalles?.trigger?.name || null,
                        });
                        for (const siguienteEvolucion of nodoEvolucion.evolves_to) {
                            await recorrerCadenaEvolucion(siguienteEvolucion);
                        }
                    };
                    await recorrerCadenaEvolucion(cadenaEvolucionPokemon.chain);
                    return listaEvoluciones;
                }catch (error){
                    throw error;
                }
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
            verificarPokemonSeleccionado(pokemon_name) {
                return utils.obtenerPokemonSeleccionado() === pokemon_name;
            },
            verificarTipoEvolucion(cadenaEvolucionPokemon) {
                let tipoEvolucion = "lineal"
                if (cadenaEvolucionPokemon.chain.evolves_to.length > 1) {
                    tipoEvolucion = "condicion"
                    return tipoEvolucion;
                }
                return tipoEvolucion;
            },
            redirecionarAlIndex(nombrePokemon = null){
                if(nombrePokemon === null) {
                    window.location.href ='index.html';
                }
                else{
                    window.location.href =`index.html?busqueda=${nombrePokemon}`;
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
            borrarPokemonCache(pokemon_id){
                let cachePokemones = utils.obtenerCachePokemones();
                let id = cachePokemones.findIndex(p => p.id === pokemon_id);
                if (id !== -1) {
                    cachePokemones.splice(id, 1);
                    utils.guardarCachePokemones(cachePokemones);
                }
            },
             renderizarSugerencias(resultados) {
                htmlElements.sugerencias.innerHTML = "";
                resultados.slice(0, 10).forEach(p => {
                    const lista = document.createElement("li");
                    lista.textContent = p.name;
                    lista.addEventListener("click", () => {
                        htmlElements.inputBuscar.value = p.name;
                        htmlElements.sugerencias.innerHTML = "";
                    });
                    htmlElements.sugerencias.appendChild(lista);
                });
            },
            borrarPokemonFavorito(pokemon_id) {
                let pokemonesFavoritos = utils.obtenerPokemonesFavoritos();
                let id = pokemonesFavoritos.findIndex(p => p.id === pokemon_id);
                if (id !== -1) {
                    pokemonesFavoritos.splice(id, 1);
                    utils.guardarPokemonesFavoritos(pokemonesFavoritos);
                }
            },
            seleccionarPokemon(nombre, elementoDOM = null, redireccionar = true) {
                //Limpiar selección visual
                const seleccionado = document.querySelector(".evolucion-pokemon-seleccionado");
                if (seleccionado) {
                    seleccionado.classList.remove("evolucion-pokemon-seleccionado");
                }
                //Marcar visualmente si hay elemento
                elementoDOM?.classList.add("evolucion-pokemon-seleccionado");
                //Guardar selección
                utils.guardarPokemonSeleccionado(nombre);
                //Redireccionar
                if (redireccionar) {
                    utils.redirecionarAlIndex(nombre);
                }
            },
            sonidoPokemon(){
                setTimeout(() => {
                    const audio = document.getElementById('audioPokemon');
                    if (audio) {
                        audio.muted = false;     // quitar mute
                        audio.play();  // reproducir
                    }
                }, 200);
            },
            filtrarPokemones(pokemones, busqueda) {
                return pokemones.filter(p => p.name.includes(busqueda.toLowerCase()));
            },
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
                            if(estadoCache === "api" || estadoCache === "cache-expirado") {
                              const pokemon = await utils.fetchPokemon(busqueda);
                              const cadenaEvolutivaPokemon = await utils.fetchCadenaEvolucionPokemon(busqueda);
                              const pokemonEvoluciones = await  utils.obtenerEvolucionesPokemon(cadenaEvolutivaPokemon)
                              const tipoEvolucionPokemon = utils.verificarTipoEvolucion(cadenaEvolutivaPokemon);
                              utils.seleccionarPokemon(pokemon.name, null, false);
                              utils.render(templates.tarjetaPokemon(pokemon, estadoCache, pokemonEvoluciones, tipoEvolucionPokemon));
                              utils.sonidoPokemon();
                              utils.guardarBusqueda(pokemon);
                            }
                            else if(estadoCache === "cache") {
                              const pokemon = utils.obtenerPokemonCache(busqueda);
                              const cadenaEvolutivaPokemon = await utils.fetchCadenaEvolucionPokemon(pokemon.name);
                              const pokemonEvoluciones = await  utils.obtenerEvolucionesPokemon(cadenaEvolutivaPokemon)
                              const tipoEvolucionPokemon = utils.verificarTipoEvolucion(cadenaEvolutivaPokemon);
                              utils.seleccionarPokemon(pokemon.name, null, false);
                              utils.render(templates.tarjetaPokemon(pokemon, estadoCache, pokemonEvoluciones, tipoEvolucionPokemon));
                              utils.sonidoPokemon();
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
                    utils.seleccionarPokemon(nombrePokemon, null);
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
                    utils.seleccionarPokemon(nombrePokemon, null)
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
            alHacerClickBotonPokemon(e){
              const pokemon = e.target.closest(".evolucion-pokemon");
                if (!pokemon) return;
                const nombre = pokemon.dataset.nombrePokemon;
                utils.seleccionarPokemon(nombre, pokemon)
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
                            const cadenaEvolutivaPokemon = await utils.fetchCadenaEvolucionPokemon(busqueda);
                            const pokemonEvoluciones = await  utils.obtenerEvolucionesPokemon(cadenaEvolutivaPokemon)
                            const tipoEvolucionPokemon = utils.verificarTipoEvolucion(cadenaEvolutivaPokemon);
                            utils.render(templates.tarjetaPokemon(pokemon, estadoCache, pokemonEvoluciones, tipoEvolucionPokemon));
                            utils.sonidoPokemon();
                            utils.guardarBusqueda(pokemon);
                        } else if (estadoCache === "cache") {
                            const pokemon = utils.obtenerPokemonCache(busqueda);
                            const cadenaEvolutivaPokemon = await utils.fetchCadenaEvolucionPokemon(pokemon.name);
                            const pokemonEvoluciones = await  utils.obtenerEvolucionesPokemon(cadenaEvolutivaPokemon)
                            const tipoEvolucionPokemon = utils.verificarTipoEvolucion(cadenaEvolutivaPokemon);
                            utils.render(templates.tarjetaPokemon(pokemon, estadoCache, pokemonEvoluciones, tipoEvolucionPokemon));
                            utils.sonidoPokemon();
                        }
                    } catch (error) {
                        utils.render(templates.error(error.message));
                    }
                }
            },
            async AlHacerClickBusquedaAutoCompletado() {
                let pokemones = [];
                const busqueda = htmlElements.inputBuscar.value.trim();
                if(busqueda.length < 2){
                    htmlElements.sugerencias.innerHTML = "";
                    return
                }
                if (pokemones.length === 0) {
                    pokemones = await utils.fetchPokemones();
                }
                const resultados = utils.filtrarPokemones(pokemones, busqueda);
                utils.renderizarSugerencias(resultados);
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
                    htmlElements.contenedorPokemon.addEventListener('click', handlers.alHacerClickBotonPokemon);
                    htmlElements.inputBuscar.addEventListener("input", handlers.AlHacerClickBusquedaAutoCompletado)
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