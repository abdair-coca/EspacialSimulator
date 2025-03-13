const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

// Almacenar información de los jugadores
const jugadores = new Map();

server.on('connection', (ws) => {
    console.log('Nuevo jugador conectado');
    
    // Asignar ID único al jugador
    const jugadorId = Date.now().toString();
    
    // Inicializar estado del jugador
    jugadores.set(jugadorId, {
        id: jugadorId,
        ws: ws,
        estado: {
            simulando: false,
            combustible: 100,
            velocidad: 0,
            distancia: 0,
            tiempoTranscurrido: 0,
            eficiencia: 100,
            estadoSistemas: {
                motor: 100,
                panelesSolares: 100,
                navegacion: 100
            },
            exito: false,
            puntuacion: 0
        }
    });
    
    // Enviar ID al jugador
    ws.send(JSON.stringify({
        tipo: 'inicializacion',
        jugadorId: jugadorId,
        jugadoresActivos: jugadores.size
    }));
    
    // Manejar mensajes del jugador
    ws.on('message', (mensaje) => {
        const datos = JSON.parse(mensaje);
        
        switch(datos.tipo) {
            case 'actualizarEstado':
                actualizarEstadoJugador(jugadorId, datos.estado);
                break;
            case 'iniciarSimulacion':
                iniciarSimulacionJugador(jugadorId);
                break;
            case 'detenerSimulacion':
                detenerSimulacionJugador(jugadorId);
                break;
            case 'reiniciarSimulacion':
                reiniciarSimulacionJugador(jugadorId);
                break;
        }
    });
    
    // Manejar desconexión
    ws.on('close', () => {
        console.log('Jugador desconectado:', jugadorId);
        jugadores.delete(jugadorId);
        
        // Notificar a otros jugadores
        broadcast({
            tipo: 'jugadorDesconectado',
            jugadorId: jugadorId
        });
    });
});

function actualizarEstadoJugador(jugadorId, estado) {
    const jugador = jugadores.get(jugadorId);
    if (jugador) {
        jugador.estado = estado;
        
        // Verificar si el jugador llegó a Marte
        if (estado.exito && !jugador.estado.exito) {
            jugador.estado.exito = true;
            jugador.estado.tiempoTotal = estado.tiempoTranscurrido;
            jugador.estado.puntuacion = calcularPuntuacion(estado);
            
            // Notificar a todos los jugadores
            broadcast({
                tipo: 'jugadorGanador',
                jugadorId: jugadorId,
                puntuacion: jugador.estado.puntuacion
            });
        }
        
        // Broadcast del estado actualizado a todos los jugadores
        broadcast({
            tipo: 'actualizarEstadoJugador',
            jugadorId: jugadorId,
            estado: jugador.estado
        });
    }
}

function iniciarSimulacionJugador(jugadorId) {
    const jugador = jugadores.get(jugadorId);
    if (jugador) {
        jugador.estado.simulando = true;
        jugador.estado.tiempoTranscurrido = 0;
        
        broadcast({
            tipo: 'simulacionIniciada',
            jugadorId: jugadorId
        });
    }
}

function detenerSimulacionJugador(jugadorId) {
    const jugador = jugadores.get(jugadorId);
    if (jugador) {
        jugador.estado.simulando = false;
        
        broadcast({
            tipo: 'simulacionDetenida',
            jugadorId: jugadorId
        });
    }
}

function reiniciarSimulacionJugador(jugadorId) {
    const jugador = jugadores.get(jugadorId);
    if (jugador) {
        jugador.estado = {
            simulando: false,
            combustible: 100,
            velocidad: 0,
            distancia: 0,
            tiempoTranscurrido: 0,
            eficiencia: 100,
            estadoSistemas: {
                motor: 100,
                panelesSolares: 100,
                navegacion: 100
            },
            exito: false,
            puntuacion: 0
        };
        
        broadcast({
            tipo: 'simulacionReiniciada',
            jugadorId: jugadorId
        });
    }
}

function calcularPuntuacion(estado) {
    let puntuacion = 1000; // Puntuación base
    
    // Puntuación por combustible restante
    puntuacion += (estado.combustible / 100) * 500;
    
    // Puntuación por tiempo
    const tiempoOptimo = 300;
    if (estado.tiempoTranscurrido <= tiempoOptimo) {
        puntuacion += 1000;
    } else {
        const penalizacionTiempo = Math.min(1000, (estado.tiempoTranscurrido - tiempoOptimo) * 2);
        puntuacion -= penalizacionTiempo;
    }
    
    // Puntuación por sistemas
    const promedioSistemas = (
        estado.estadoSistemas.motor +
        estado.estadoSistemas.panelesSolares +
        estado.estadoSistemas.navegacion
    ) / 3;
    puntuacion += (promedioSistemas / 100) * 500;
    
    return Math.max(0, Math.round(puntuacion));
}

function broadcast(mensaje) {
    const mensajeString = JSON.stringify(mensaje);
    jugadores.forEach(jugador => {
        if (jugador.ws.readyState === WebSocket.OPEN) {
            jugador.ws.send(mensajeString);
        }
    });
}

console.log('Servidor WebSocket iniciado en el puerto 8080'); 