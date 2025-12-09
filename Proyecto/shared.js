(() => {
    const App = (() => {
        //Referencias al DOM
        const htmlElements = {
            formulario: document.querySelector('#formulario-buscar-pokemon'),
            inputBuscar: document.querySelector('#buscar-pokemon-nombre-id'),
            contenedorPokemon: document.querySelector('#pokemon-contendor'),
        };
        //Plantillas HTML (vistas)
        const templates = {
            tarjetaPokemon: (pokemon) => {
                const tiposHtml = pokemon.types.map(tipo => `<span class="tipo-insignia">${tipo.type.name}</span>`).join('')

                const habilidadesHtml = pokemon.abilities.map(habilidad => {
                    const claseHabilidad = habilidad.is_hidden ? 'habilidad-oculta' : 'habilidad-normal';
                    return `<span class="${claseHabilidad}">${habilidad.ability.name}</span>`}).join('')

                const estadisticasHtml = pokemon.stats.map(estadisticas => `
                <div class="etiqueta-estadisticas">${estadisticas.stat.name.toUpperCase()}:</div>
                <div class="contenedor-barra-estadisticas">
                    <div class="barra-estadisticas" style="width: ${Math.min(estadisticas.base_stat, 100)}%"></div>
                </div>`).join('')

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
                </div>`;
            },
            error: (mensaje) => `<div class="mensaje-error"> ERROR: ${mensaje.toUpperCase()}</div>`,
            cargando: () => `<div class="cargando">CARGANDO DATOS...</div>`,
            vacio: () => ``
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
                    const historialConTiempo = {
                        ...pokemon,
                        timestamp: fechaAhoraActual,
                    };
                    historial.push(historialConTiempo);
                    // Guardar
                    localStorage.setItem(key, JSON.stringify(historial));
                    historial.forEach((historial) => {
                        console.log((`Pokemon: ${pokemon.name} en localStorage con tiempo:" ${new Date(fechaAhoraActual)}`))
                    })
                    return "guardado";
                }
            },
            obtenerHistorial() {
                const HORAS_24_EN_MS = 24 * 60 * 60 * 1000;
                const fechaAhoraActual = Date.now();
                let historial = JSON.parse(localStorage.getItem('historialPokemon')) || [];

                // Filtramos: Solo sobreviven los que (Ahora - Creado) sea MENOR a 24 horas
                const historialActualizado = historial.filter(pokemon => {
                    const tiempoTrancurrido = fechaAhoraActual - pokemon.timestamp;
                    return tiempoTrancurrido < HORAS_24_EN_MS;
                })
                // Si la cantidad de elementos cambió, significa que algunos expiraron y debemos actualizar el localStorage
                if(historial.length !== historialActualizado.length){
                    console.log("¡Se han borrado búsquedas expiradas del localStorage!")
                    localStorage.setItem('historialPokemon', JSON.stringify(historialActualizado));
                }
                else {
                    return historial;
                }
            },
            verificarPokemonApiCache(busqueda) {
                let historial = JSON.parse(localStorage.getItem('historialPokemon')) || [];
                const pokemonEncontrado = historial.find(p=> p.id == busqueda || p.name === busqueda.toLowerCase());
                if(pokemonEncontrado) {
                    pokemonEncontrado.esCache = true;
                    htmlElements.contenedorPokemon.innerHTML = templates.tarjetaPokemon(pokemonEncontrado);
                    console.log("ya esta en el historial");
                    return true;
                }
                else {
                    return false
                }
            }
        }
        //Manejadores de Eventos
        const handlers = {
            async alHacerClickBuscar(e) {
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
                        let guardarBusqueda = utils.guardarBusqueda(pokemon);
                        console.log(guardarBusqueda);
                    }
                } catch (error) {
                    utils.render(templates.error(error.message));
                }
            }
        }
        //Inicialización (API Pública)
        return {
            init() {
                htmlElements.formulario.addEventListener('submit', handlers.alHacerClickBuscar);
                const historial = utils.obtenerHistorial()
                if(historial.length > 0) {
                    document.addEventListener("DOMContentLoaded", () => {
                        historial.forEach(pokemon => {
                            console.log(pokemon.id,pokemon.name, new Date(pokemon.timestamp).toLocaleString());
                        })
                    })
                }
            }
        };
    })();
    //Ejecutar la Aplicación
    App.init();
})();