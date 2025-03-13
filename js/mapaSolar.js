class MapaSolar {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.puntosControl = [];
        this.trayectoria = [];
        this.planetas = {
            sol: { x: 0, y: 0, radio: 30, color: '#ffd700' },
            tierra: { x: 200, y: 0, radio: 15, color: '#4a90e2' },
            marte: { x: 400, y: 0, radio: 20, color: '#e74c3c' }
        };
        
        // Inicializar física de la nave
        this.fisicaNave = new FisicaNave();
        this.simulando = false;
        this.tiempoSimulacion = 0;
        
        this.inicializar();
    }

    inicializar() {
        this.ajustarCanvas();
        this.agregarEventListeners();
        this.dibujar();
    }

    ajustarCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Centrar el sistema solar
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }

    agregarEventListeners() {
        window.addEventListener('resize', () => this.ajustarCanvas());
        this.canvas.addEventListener('click', (e) => this.agregarPuntoControl(e));
        this.canvas.addEventListener('mousemove', (e) => this.actualizarTrayectoria(e));
    }

    agregarPuntoControl(e) {
        if (this.simulando) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.offsetX;
        const y = e.clientY - rect.top - this.offsetY;
        
        this.puntosControl.push({ x, y });
        this.actualizarTrayectoria();
    }

    actualizarTrayectoria() {
        if (this.puntosControl.length < 2) return;

        this.trayectoria = [];
        const puntos = this.puntosControl;
        
        // Generar puntos de la curva de Bézier
        for (let t = 0; t <= 1; t += 0.01) {
            const punto = this.calcularPuntoBezier(t, puntos);
            this.trayectoria.push(punto);
        }
        
        this.dibujar();
        this.actualizarInformacion();
    }

    calcularPuntoBezier(t, puntos) {
        if (puntos.length === 2) {
            return {
                x: puntos[0].x + (puntos[1].x - puntos[0].x) * t,
                y: puntos[0].y + (puntos[1].y - puntos[0].y) * t
            };
        }
        
        const puntosIntermedios = [];
        for (let i = 0; i < puntos.length - 1; i++) {
            puntosIntermedios.push({
                x: puntos[i].x + (puntos[i + 1].x - puntos[i].x) * t,
                y: puntos[i].y + (puntos[i + 1].y - puntos[i].y) * t
            });
        }
        
        return this.calcularPuntoBezier(t, puntosIntermedios);
    }

    dibujar() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar trayectoria
        if (this.trayectoria.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.trayectoria[0].x + this.offsetX,
                this.trayectoria[0].y + this.offsetY
            );
            
            for (let i = 1; i < this.trayectoria.length; i++) {
                this.ctx.lineTo(
                    this.trayectoria[i].x + this.offsetX,
                    this.trayectoria[i].y + this.offsetY
                );
            }
            
            this.ctx.strokeStyle = '#2ecc71';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Dibujar planetas
        Object.values(this.planetas).forEach(planeta => {
            this.ctx.beginPath();
            this.ctx.arc(
                planeta.x + this.offsetX,
                planeta.y + this.offsetY,
                planeta.radio,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = planeta.color;
            this.ctx.fill();
        });
        
        // Dibujar puntos de control
        this.puntosControl.forEach(punto => {
            this.ctx.beginPath();
            this.ctx.arc(
                punto.x + this.offsetX,
                punto.y + this.offsetY,
                5,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fill();
        });

        // Dibujar nave si está simulando
        if (this.simulando) {
            const estado = this.fisicaNave.estado;
            const posX = (estado.posicion.x / this.fisicaNave.ORBITA_TIERRA_KM) * 200 + this.offsetX;
            const posY = (estado.posicion.y / this.fisicaNave.ORBITA_TIERRA_KM) * 200 + this.offsetY;
            
            this.ctx.beginPath();
            this.ctx.arc(posX, posY, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
        }
    }

    actualizarInformacion() {
        if (this.trayectoria.length < 2) return;

        const infoMision = this.fisicaNave.obtenerInformacionMision();
        
        // Actualizar elementos en el DOM
        document.getElementById('distanciaTotal').textContent = `${Math.round(infoMision.distanciaTotal)} km`;
        document.getElementById('tiempoEstimado').textContent = `${Math.round(infoMision.tiempoEstimado)} días`;
        document.getElementById('consumoCombustible').textContent = `${Math.round(infoMision.combustibleRestante)}%`;
        document.getElementById('velocidadPromedio').textContent = `${Math.round(infoMision.velocidadActual * 100) / 100} km/s`;
    }

    iniciarSimulacion() {
        if (this.simulando) return;
        
        this.simulando = true;
        this.tiempoSimulacion = 0;
        this.fisicaNave.reiniciar();
        
        const simular = () => {
            if (!this.simulando) return;
            
            this.tiempoSimulacion += 1/60; // 60 FPS
            this.fisicaNave.actualizarEstado(this.tiempoSimulacion);
            this.dibujar();
            this.actualizarInformacion();
            
            requestAnimationFrame(simular);
        };
        
        simular();
    }

    detenerSimulacion() {
        this.simulando = false;
    }

    limpiarTrayectoria() {
        this.puntosControl = [];
        this.trayectoria = [];
        this.simulando = false;
        this.dibujar();
        this.actualizarInformacion();
    }
}

// Inicializar el mapa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const mapa = new MapaSolar('mapaSolar');
    
    // Agregar event listeners para los botones
    document.getElementById('btnIniciar').addEventListener('click', () => {
        mapa.iniciarSimulacion();
    });
    
    document.getElementById('btnSimular').addEventListener('click', () => {
        mapa.iniciarSimulacion();
    });
    
    document.getElementById('btnLimpiar').addEventListener('click', () => {
        mapa.limpiarTrayectoria();
    });
}); 