class SistemaSonido {
    constructor() {
        this.sonidos = {};
        this.cargarSonidos();
    }

    cargarSonidos() {
        // Cargar sonidos
        this.sonidos.despegue = new Audio('assets/sounds/liftoff.mp3');
        this.sonidos.motor = new Audio('assets/sounds/engine.mp3');
        this.sonidos.espacio = new Audio('assets/sounds/space.mp3');
        this.sonidos.aterrizaje = new Audio('assets/sounds/landing.mp3');
        this.sonidos.alerta = new Audio('assets/sounds/alert.mp3');
        this.sonidos.exito = new Audio('assets/sounds/success.mp3');
        this.sonidos.fallo = new Audio('assets/sounds/failure.mp3');

        // Configurar sonidos
        this.sonidos.motor.loop = true;
        this.sonidos.espacio.loop = true;
        this.sonidos.espacio.volume = 0.3;
        this.sonidos.motor.volume = 0.5;
    }

    reproducirDespegue() {
        this.sonidos.despegue.currentTime = 0;
        this.sonidos.despegue.play();
        
        // Iniciar sonido del motor después de un breve retraso
        setTimeout(() => {
            this.sonidos.motor.play();
        }, 1000);
    }

    reproducirViajeEspacial() {
        this.sonidos.espacio.play();
    }

    reproducirAterrizaje() {
        this.sonidos.aterrizaje.currentTime = 0;
        this.sonidos.aterrizaje.play();
        
        // Detener sonidos de viaje
        this.sonidos.motor.pause();
        this.sonidos.espacio.pause();
    }

    reproducirAlerta() {
        this.sonidos.alerta.currentTime = 0;
        this.sonidos.alerta.play();
    }

    reproducirExito() {
        this.sonidos.exito.currentTime = 0;
        this.sonidos.exito.play();
    }

    reproducirFallo() {
        this.sonidos.fallo.currentTime = 0;
        this.sonidos.fallo.play();
    }

    detenerTodos() {
        Object.values(this.sonidos).forEach(sonido => {
            sonido.pause();
            sonido.currentTime = 0;
        });
    }

    ajustarVolumen(volumen) {
        Object.values(this.sonidos).forEach(sonido => {
            sonido.volume = volumen;
        });
    }
} 