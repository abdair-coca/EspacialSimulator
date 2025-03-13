class FisicaNave {
    constructor() {
        // Constantes físicas
        this.G = 6.67430e-11; // Constante gravitacional universal
        this.M_SOL = 1.989e30; // Masa del Sol en kg
        this.UA = 149597870700; // Unidad Astronómica en metros
        
        // Parámetros orbitales (aproximados)
        this.ORBITA_TIERRA = 1.0; // UA
        this.ORBITA_MARTE = 1.524; // UA
        this.ORBITA_TIERRA_KM = this.ORBITA_TIERRA * this.UA / 1000;
        this.ORBITA_MARTE_KM = this.ORBITA_MARTE * this.UA / 1000;
        
        // Estado inicial de la nave
        this.estado = {
            masa: 1000, // kg
            combustible: 100, // porcentaje
            velocidad: 0, // km/s
            posicion: { x: this.ORBITA_TIERRA_KM, y: 0 },
            trayectoria: []
        };
    }

    // Calcular la velocidad orbital circular
    calcularVelocidadOrbital(radioUA) {
        const radioMetros = radioUA * this.UA;
        return Math.sqrt((this.G * this.M_SOL) / radioMetros) / 1000; // km/s
    }

    // Calcular la órbita de transferencia de Hohmann
    calcularOrbitaHohmann() {
        // Radio del perihelio (órbita de la Tierra)
        const r1 = this.ORBITA_TIERRA_KM;
        // Radio del afelio (órbita de Marte)
        const r2 = this.ORBITA_MARTE_KM;
        
        // Semieje mayor de la órbita de transferencia
        const a = (r1 + r2) / 2;
        
        // Velocidad en el perihelio
        const v1 = Math.sqrt(this.G * this.M_SOL * (2/r1 - 1/a)) / 1000;
        // Velocidad en el afelio
        const v2 = Math.sqrt(this.G * this.M_SOL * (2/r2 - 1/a)) / 1000;
        
        // Velocidad orbital de la Tierra
        const vTierra = this.calcularVelocidadOrbital(this.ORBITA_TIERRA);
        // Velocidad orbital de Marte
        const vMarte = this.calcularVelocidadOrbital(this.ORBITA_MARTE);
        
        // Delta-v necesario para la transferencia
        const deltaV1 = v1 - vTierra;
        const deltaV2 = vMarte - v2;
        
        // Tiempo de transferencia (en días)
        const periodo = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (this.G * this.M_SOL));
        const tiempoTransferencia = periodo / (2 * 24 * 3600);
        
        return {
            deltaV1,
            deltaV2,
            tiempoTransferencia,
            velocidadInicial: v1,
            velocidadFinal: v2
        };
    }

    // Actualizar el estado de la nave
    actualizarEstado(deltaTiempo) {
        const orbitaHohmann = this.calcularOrbitaHohmann();
        
        // Calcular consumo de combustible (simplificado)
        const consumoCombustible = (orbitaHohmann.deltaV1 + orbitaHohmann.deltaV2) * 
                                 (this.estado.masa / 1000) * 
                                 (deltaTiempo / (24 * 3600));
        
        // Actualizar combustible
        this.estado.combustible = Math.max(0, this.estado.combustible - consumoCombustible);
        
        // Actualizar velocidad
        this.estado.velocidad = orbitaHohmann.velocidadInicial;
        
        // Actualizar posición (simplificado)
        const angulo = (2 * Math.PI * deltaTiempo) / (orbitaHohmann.tiempoTransferencia * 24 * 3600);
        this.estado.posicion.x = this.ORBITA_TIERRA_KM * Math.cos(angulo);
        this.estado.posicion.y = this.ORBITA_TIERRA_KM * Math.sin(angulo);
        
        // Agregar posición a la trayectoria
        this.estado.trayectoria.push({
            x: this.estado.posicion.x,
            y: this.estado.posicion.y
        });
        
        return this.estado;
    }

    // Obtener información de la misión
    obtenerInformacionMision() {
        const orbitaHohmann = this.calcularOrbitaHohmann();
        
        return {
            distanciaTotal: (this.ORBITA_MARTE - this.ORBITA_TIERRA) * this.UA / 1000, // km
            tiempoEstimado: orbitaHohmann.tiempoTransferencia, // días
            deltaVTotal: orbitaHohmann.deltaV1 + orbitaHohmann.deltaV2, // km/s
            combustibleRestante: this.estado.combustible, // porcentaje
            velocidadActual: this.estado.velocidad, // km/s
            trayectoria: this.estado.trayectoria
        };
    }

    // Reiniciar la simulación
    reiniciar() {
        this.estado = {
            masa: 1000,
            combustible: 100,
            velocidad: 0,
            posicion: { x: this.ORBITA_TIERRA_KM, y: 0 },
            trayectoria: []
        };
    }
}

// Exportar la clase para su uso en otros archivos
window.FisicaNave = FisicaNave;