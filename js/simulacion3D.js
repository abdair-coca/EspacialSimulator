class Simulacion3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.fisicaNave = new FisicaNave();
        this.sistemaSonido = new SistemaSonido();
        
        // Configuración de Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        
        // Habilitar sombras
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Optimizar renderer para móviles
        if (this.esDispositivoMovil()) {
            this.renderer.setPixelRatio(1);
            this.renderer.setSize(window.innerWidth, window.innerHeight, false);
        } else {
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        this.container.appendChild(this.renderer.domElement);
        
        // Controles de órbita optimizados
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        
        // Ajustar controles para dispositivos táctiles
        if (this.esDispositivoMovil()) {
            this.controls.enableRotate = true;
            this.controls.enableZoom = true;
            this.controls.enablePan = false;
            this.controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
        }
        
        // Inicializar elementos
        this.inicializarEscena();
        this.ajustarCamara();
        this.agregarLuces();
        this.crearCuerposCelestes();
        this.crearNave();
        
        // Estado de la simulación
        this.simulando = false;
        this.tiempoSimulacion = 0;
        this.faseDespegue = false;
        this.tiempoDespegue = 0;
        
        // Crear panel de información
        this.crearPanelInformacion();
        
        // Estado de la misión
        this.estadoMision = {
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
            razonFallo: '',
            tiempoTotal: 0,
            puntuacion: 0
        };
        
        // Manejar redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Manejar eventos táctiles
        this.setupEventosTactiles();
        
        // Configurar control de volumen
        const controlVolumen = document.getElementById('volumen');
        controlVolumen.addEventListener('input', (e) => {
            this.sistemaSonido.ajustarVolumen(parseFloat(e.target.value));
        });

        this.multijugador = new Multijugador(this);
        this.navesOtrosJugadores = new Map();
    }

    esDispositivoMovil() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupEventosTactiles() {
        if (this.esDispositivoMovil()) {
            // Prevenir el scroll por defecto en el contenedor
            this.container.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            // Manejar gestos de pellizco
            let distanciaInicial = 0;
            this.container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    distanciaInicial = Math.hypot(
                        e.touches[0].pageX - e.touches[1].pageX,
                        e.touches[0].pageY - e.touches[1].pageY
                    );
                }
            });
            
            this.container.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2) {
                    const distanciaActual = Math.hypot(
                        e.touches[0].pageX - e.touches[1].pageX,
                        e.touches[0].pageY - e.touches[1].pageY
                    );
                    
                    const delta = distanciaActual - distanciaInicial;
                    this.camera.position.z += delta * 0.01;
                }
            });
        }
    }

    inicializarEscena() {
        // Fondo negro
        this.scene.background = new THREE.Color(0x000000);
    }

    ajustarCamara() {
        // Ajustar cámara para ver todo el sistema solar
        this.camera.position.set(0, 5 * this.constantesSistemaSolar.ESCALA_DISTANCIA, 10 * this.constantesSistemaSolar.ESCALA_DISTANCIA);
        this.camera.lookAt(0, 0, 0);
    }

    agregarLuces() {
        // Luz ambiental mejorada
        const luzAmbiente = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(luzAmbiente);
        
        // Luz del sol (punto de luz) con sombras
        const luzSol = new THREE.PointLight(0xffffff, 1, 100);
        luzSol.position.set(0, 0, 0);
        luzSol.castShadow = true;
        luzSol.shadow.mapSize.width = 2048;
        luzSol.shadow.mapSize.height = 2048;
        luzSol.shadow.camera.near = 0.5;
        luzSol.shadow.camera.far = 100;
        this.scene.add(luzSol);
        
        // Luz de relleno para mejor detalle
        const luzRelleno = new THREE.DirectionalLight(0x404040, 0.5);
        luzRelleno.position.set(5, 5, 5);
        this.scene.add(luzRelleno);
    }

    crearCuerposCelestes() {
        // Constantes para el sistema solar
        const ESCALA_DISTANCIA = 0.1;
        const ESCALA_TAMAÑO = 0.05;
        const PERIODO_TIERRA = 365;
        const PERIODO_MARTE = 687;
        
        // Cargador de texturas
        const textureLoader = new THREE.TextureLoader();
        
        // Sol con efecto de brillo
        const geometriaSol = new THREE.SphereGeometry(1 * ESCALA_TAMAÑO, 64, 64);
        const materialSol = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1,
            specular: 0xffff00,
            shininess: 100,
            map: textureLoader.load('assets/textures/sun.jpg'),
            normalMap: textureLoader.load('assets/textures/sun_normal.jpg'),
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        this.sol = new THREE.Mesh(geometriaSol, materialSol);
        this.sol.castShadow = true;
        this.scene.add(this.sol);
        
        // Tierra con texturas mejoradas
        const geometriaTierra = new THREE.SphereGeometry(0.5 * ESCALA_TAMAÑO, 64, 64);
        const materialTierra = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textureLoader.load('assets/textures/earth.jpg'),
            normalMap: textureLoader.load('assets/textures/earth_normal.jpg'),
            specularMap: textureLoader.load('assets/textures/earth_specular.jpg'),
            normalScale: new THREE.Vector2(0.5, 0.5),
            shininess: 25,
            specular: 0x444444
        });
        this.tierra = new THREE.Mesh(geometriaTierra, materialTierra);
        this.tierra.position.x = 15 * ESCALA_DISTANCIA;
        this.tierra.castShadow = true;
        this.tierra.receiveShadow = true;
        this.scene.add(this.tierra);
        
        // Marte con texturas mejoradas
        const geometriaMarte = new THREE.SphereGeometry(0.4 * ESCALA_TAMAÑO, 64, 64);
        const materialMarte = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: textureLoader.load('assets/textures/mars.jpg'),
            normalMap: textureLoader.load('assets/textures/mars_normal.jpg'),
            specularMap: textureLoader.load('assets/textures/mars_specular.jpg'),
            normalScale: new THREE.Vector2(0.5, 0.5),
            shininess: 15,
            specular: 0x444444
        });
        this.marte = new THREE.Mesh(geometriaMarte, materialMarte);
        this.marte.position.x = 23 * ESCALA_DISTANCIA;
        this.marte.castShadow = true;
        this.marte.receiveShadow = true;
        this.scene.add(this.marte);
        
        // Órbitas con efecto de brillo
        this.crearOrbitas(ESCALA_DISTANCIA);
        
        // Guardar constantes para la animación
        this.constantesSistemaSolar = {
            ESCALA_DISTANCIA,
            ESCALA_TAMAÑO,
            PERIODO_TIERRA,
            PERIODO_MARTE
        };
    }

    crearOrbitas(ESCALA_DISTANCIA) {
        // Órbita de la Tierra con efecto de brillo
        const orbitaTierra = new THREE.RingGeometry(15 * ESCALA_DISTANCIA, 15.1 * ESCALA_DISTANCIA, 128);
        const materialOrbitaTierra = new THREE.MeshPhongMaterial({
            color: 0x2233ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3,
            emissive: 0x2233ff,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        const meshOrbitaTierra = new THREE.Mesh(orbitaTierra, materialOrbitaTierra);
        meshOrbitaTierra.rotation.x = Math.PI / 2;
        this.scene.add(meshOrbitaTierra);
        
        // Órbita de Marte con efecto de brillo
        const orbitaMarte = new THREE.RingGeometry(23 * ESCALA_DISTANCIA, 23.1 * ESCALA_DISTANCIA, 128);
        const materialOrbitaMarte = new THREE.MeshPhongMaterial({
            color: 0xff4422,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3,
            emissive: 0xff4422,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        const meshOrbitaMarte = new THREE.Mesh(orbitaMarte, materialOrbitaMarte);
        meshOrbitaMarte.rotation.x = Math.PI / 2;
        this.scene.add(meshOrbitaMarte);
    }

    crearNave() {
        // Crear grupo para la nave
        this.nave = new THREE.Group();
        
        // Cargador de texturas
        const textureLoader = new THREE.TextureLoader();
        
        // Fuselaje principal con textura metálica
        const geometriaFuselaje = new THREE.ConeGeometry(0.2, 1, 16);
        const materialFuselaje = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x333333,
            specular: 0x888888,
            shininess: 100,
            map: textureLoader.load('assets/textures/metal.jpg'),
            normalMap: textureLoader.load('assets/textures/metal_normal.jpg'),
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        const fuselaje = new THREE.Mesh(geometriaFuselaje, materialFuselaje);
        fuselaje.castShadow = true;
        fuselaje.receiveShadow = true;
        this.nave.add(fuselaje);
        
        // Cabina con efecto de cristal
        const geometriaCabina = new THREE.SphereGeometry(0.15, 16, 16);
        const materialCabina = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            specular: 0xffffff,
            shininess: 100,
            envMap: textureLoader.load('assets/textures/space.jpg')
        });
        const cabina = new THREE.Mesh(geometriaCabina, materialCabina);
        cabina.position.z = 0.8;
        cabina.castShadow = true;
        cabina.receiveShadow = true;
        this.nave.add(cabina);
        
        // Motores con efecto de emisión
        const geometriaMotor = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
        const materialMotor = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1,
            specular: 0xffffff,
            shininess: 100
        });
        
        // Motor central
        const motorCentral = new THREE.Mesh(geometriaMotor, materialMotor);
        motorCentral.position.z = -0.5;
        motorCentral.castShadow = true;
        this.nave.add(motorCentral);
        
        // Motores laterales
        const motorIzquierdo = new THREE.Mesh(geometriaMotor, materialMotor);
        motorIzquierdo.position.set(-0.15, 0, -0.5);
        motorIzquierdo.rotation.x = Math.PI / 4;
        motorIzquierdo.castShadow = true;
        this.nave.add(motorIzquierdo);
        
        const motorDerecho = new THREE.Mesh(geometriaMotor, materialMotor);
        motorDerecho.position.set(0.15, 0, -0.5);
        motorDerecho.rotation.x = -Math.PI / 4;
        motorDerecho.castShadow = true;
        this.nave.add(motorDerecho);
        
        // Tanques de combustible con textura metálica
        const geometriaTanque = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16);
        const materialTanque = new THREE.MeshPhongMaterial({
            color: 0x4444ff,
            specular: 0x888888,
            shininess: 100,
            map: textureLoader.load('assets/textures/metal.jpg'),
            normalMap: textureLoader.load('assets/textures/metal_normal.jpg'),
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        
        // Tanque izquierdo
        const tanqueIzquierdo = new THREE.Mesh(geometriaTanque, materialTanque);
        tanqueIzquierdo.position.set(-0.3, 0, 0);
        tanqueIzquierdo.rotation.x = Math.PI / 2;
        tanqueIzquierdo.castShadow = true;
        tanqueIzquierdo.receiveShadow = true;
        this.nave.add(tanqueIzquierdo);
        
        // Tanque derecho
        const tanqueDerecho = new THREE.Mesh(geometriaTanque, materialTanque);
        tanqueDerecho.position.set(0.3, 0, 0);
        tanqueDerecho.rotation.x = Math.PI / 2;
        tanqueDerecho.castShadow = true;
        tanqueDerecho.receiveShadow = true;
        this.nave.add(tanqueDerecho);
        
        // Paneles solares con efecto de emisión
        const geometriaPanel = new THREE.BoxGeometry(0.8, 0.1, 0.01, 16, 16, 1);
        const materialPanel = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5,
            specular: 0xffffff,
            shininess: 100,
            map: textureLoader.load('assets/textures/solar_panel.jpg')
        });
        
        // Panel superior
        const panelSuperior = new THREE.Mesh(geometriaPanel, materialPanel);
        panelSuperior.position.set(0, 0.5, 0);
        panelSuperior.rotation.x = Math.PI / 4;
        panelSuperior.castShadow = true;
        panelSuperior.receiveShadow = true;
        this.nave.add(panelSuperior);
        
        // Panel inferior
        const panelInferior = new THREE.Mesh(geometriaPanel, materialPanel);
        panelInferior.position.set(0, -0.5, 0);
        panelInferior.rotation.x = -Math.PI / 4;
        panelInferior.castShadow = true;
        panelInferior.receiveShadow = true;
        this.nave.add(panelInferior);
        
        // Alas con textura metálica
        const geometriaAla = new THREE.BoxGeometry(0.1, 0.8, 0.01, 16, 16, 1);
        const materialAla = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            specular: 0x888888,
            shininess: 100,
            map: textureLoader.load('assets/textures/metal.jpg'),
            normalMap: textureLoader.load('assets/textures/metal_normal.jpg'),
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        
        // Ala izquierda
        const alaIzquierda = new THREE.Mesh(geometriaAla, materialAla);
        alaIzquierda.position.set(-0.3, 0, 0.3);
        alaIzquierda.rotation.z = Math.PI / 4;
        alaIzquierda.castShadow = true;
        alaIzquierda.receiveShadow = true;
        this.nave.add(alaIzquierda);
        
        // Ala derecha
        const alaDerecha = new THREE.Mesh(geometriaAla, materialAla);
        alaDerecha.position.set(0.3, 0, 0.3);
        alaDerecha.rotation.z = -Math.PI / 4;
        alaDerecha.castShadow = true;
        alaDerecha.receiveShadow = true;
        this.nave.add(alaDerecha);
        
        // Efectos de partículas mejorados para los motores
        const particulasMotor = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0xff6600,
                size: 0.02,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                map: textureLoader.load('assets/textures/particle.png')
            })
        );
        this.particulasMotor = particulasMotor;
        this.nave.add(particulasMotor);
        
        // Posición inicial
        this.nave.position.x = 5;
        this.scene.add(this.nave);
        
        // Actualizar partículas de los motores
        this.actualizarParticulasMotor();
    }

    actualizarParticulasMotor() {
        if (!this.particulasMotor) return;
        
        const particulas = [];
        const intensidad = this.faseDespegue ? 2 : 1.5; // Más partículas durante el despegue
        
        for (let i = 0; i < 150 * intensidad; i++) {
            const x = (Math.random() - 0.5) * 0.3;
            const y = (Math.random() - 0.5) * 0.3;
            const z = -0.5 - Math.random() * 0.8;
            particulas.push(x, y, z);
        }
        
        this.particulasMotor.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(particulas, 3)
        );
    }

    actualizarPosiciones(deltaTiempo) {
        if (!this.constantesSistemaSolar) return;
        
        const { ESCALA_DISTANCIA, PERIODO_TIERRA, PERIODO_MARTE } = this.constantesSistemaSolar;
        
        // Rotar planetas en sus órbitas
        const tiempoDias = deltaTiempo * 24 * 60 * 60; // Convertir segundos a días
        
        // Tierra
        const anguloTierra = (tiempoDias / PERIODO_TIERRA) * Math.PI * 2;
        this.tierra.position.x = Math.cos(anguloTierra) * 15 * ESCALA_DISTANCIA;
        this.tierra.position.z = Math.sin(anguloTierra) * 15 * ESCALA_DISTANCIA;
        this.tierra.rotation.y += deltaTiempo * 0.1; // Rotación sobre su eje
        
        // Marte
        const anguloMarte = (tiempoDias / PERIODO_MARTE) * Math.PI * 2;
        this.marte.position.x = Math.cos(anguloMarte) * 23 * ESCALA_DISTANCIA;
        this.marte.position.z = Math.sin(anguloMarte) * 23 * ESCALA_DISTANCIA;
        this.marte.rotation.y += deltaTiempo * 0.05; // Rotación sobre su eje
        
        // Actualizar posición de la nave si está en simulación
        if (this.fisicaNave && this.fisicaNave.estado.simulando) {
            const estado = this.fisicaNave.estado;
            const posX = (estado.posicion.x / this.fisicaNave.ORBITA_TIERRA_KM) * 15 * ESCALA_DISTANCIA;
            const posY = (estado.posicion.y / this.fisicaNave.ORBITA_TIERRA_KM) * 15 * ESCALA_DISTANCIA;
            
            this.nave.position.x = posX;
            this.nave.position.y = posY;
            
            if (estado.velocidad > 0) {
                const angulo = Math.atan2(posY, posX);
                this.nave.rotation.z = angulo;
            }
        }
        
        // Actualizar partículas de los motores
        this.actualizarParticulasMotor();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        if (this.esDispositivoMovil()) {
            this.renderer.setSize(window.innerWidth, window.innerHeight, false);
        } else {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
        }
    }

    iniciarDespegue() {
        this.faseDespegue = true;
        this.tiempoDespegue = 0;
        
        // Reproducir sonidos de despegue
        this.sistemaSonido.reproducirDespegue();
        
        // Ajustar cámara para ver el despegue
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(5, 0, 0);
        this.controls.enabled = false;
        
        // Posicionar nave en la superficie
        this.nave.position.set(5, 0, 0);
        this.nave.rotation.z = 0;
        
        // Iniciar animación
        this.simulando = true;
        this.animarDespegue();
    }

    animarDespegue() {
        if (!this.simulando) return;
        
        this.tiempoDespegue += 1/60; // 60 FPS
        
        // Fases del despegue
        if (this.tiempoDespegue < 2) {
            // Fase 1: Preparación (2 segundos)
            this.nave.position.y = Math.sin(this.tiempoDespegue * Math.PI) * 0.1;
        } else if (this.tiempoDespegue < 4) {
            // Fase 2: Despegue inicial (2 segundos)
            const progreso = (this.tiempoDespegue - 2) / 2;
            this.nave.position.y = progreso * 2;
            this.nave.rotation.x = progreso * Math.PI / 4;
        } else if (this.tiempoDespegue < 8) {
            // Fase 3: Ascenso y giro (4 segundos)
            const progreso = (this.tiempoDespegue - 4) / 4;
            this.nave.position.y = 2 + progreso * 3;
            this.nave.position.x = 5 + Math.sin(progreso * Math.PI) * 0.5;
            this.nave.rotation.x = Math.PI / 4 + progreso * Math.PI / 2;
        } else if (this.tiempoDespegue < 12) {
            // Fase 4: Entrada en órbita (4 segundos)
            const progreso = (this.tiempoDespegue - 8) / 4;
            this.nave.position.y = 5 + Math.sin(progreso * Math.PI) * 0.5;
            this.nave.position.x = 5 + Math.cos(progreso * Math.PI) * 0.5;
            this.nave.rotation.x = Math.PI / 2;
            this.nave.rotation.z = progreso * Math.PI / 2;
        } else {
            // Finalizar despegue
            this.faseDespegue = false;
            this.controls.enabled = true;
            this.fisicaNave.reiniciar();
            this.fisicaNave.estado.simulando = true;
        }
        
        // Actualizar partículas de los motores
        this.actualizarParticulasMotor();
        
        // Renderizar escena
        this.renderer.render(this.scene, this.camera);
        
        // Continuar animación
        requestAnimationFrame(() => this.animarDespegue());
    }

    iniciarSimulacion() {
        if (this.simulando) return;
        
        this.iniciarDespegue();
        
        setTimeout(() => {
            this.simulando = true;
            this.tiempoSimulacion = 0;
            
            // Reproducir sonido de viaje espacial
            this.sistemaSonido.reproducirViajeEspacial();
            
            const simular = () => {
                if (!this.simulando) return;
                
                this.tiempoSimulacion += 1/60;
                this.fisicaNave.actualizarEstado(this.tiempoSimulacion);
                this.actualizarPosiciones(this.tiempoSimulacion);
                this.actualizarInformacionMision();
                this.verificarFinMision();
                
                this.controls.update();
                this.renderer.render(this.scene, this.camera);
                
                requestAnimationFrame(simular);
            };
            
            simular();
        }, 12000);

        this.multijugador.iniciarSimulacion();
    }

    detenerSimulacion() {
        this.simulando = false;
        this.sistemaSonido.detenerTodos();
        this.multijugador.detenerSimulacion();
    }

    reiniciarSimulacion() {
        this.detenerSimulacion();
        this.tiempoSimulacion = 0;
        this.fisicaNave.reiniciar();
        this.nave.position.set(5, 0, 0);
        this.nave.rotation.z = 0;
        this.multijugador.reiniciarSimulacion();
    }

    crearPanelInformacion() {
        // Crear contenedor del panel
        const panel = document.createElement('div');
        panel.id = 'panel-informacion';
        panel.className = 'panel-informacion';
        
        // Contenido del panel optimizado para móviles
        panel.innerHTML = `
            <div class="panel-header">
                <h3>Información de la Misión</h3>
                <button class="toggle-panel">▼</button>
            </div>
            <div class="panel-content">
                <div class="info-section">
                    <h4>Estado General</h4>
                    <div class="info-item">
                        <span>Combustible:</span>
                        <div class="progress-bar">
                            <div class="progress" id="combustible-progress"></div>
                        </div>
                        <span id="combustible-valor">100%</span>
                    </div>
                    <div class="info-item">
                        <span>Velocidad:</span>
                        <span id="velocidad-valor">0 km/s</span>
                    </div>
                    <div class="info-item">
                        <span>Distancia:</span>
                        <span id="distancia-valor">0 km</span>
                    </div>
                </div>
                <div class="info-section">
                    <h4>Sistemas</h4>
                    <div class="info-item">
                        <span>Motor:</span>
                        <div class="progress-bar">
                            <div class="progress" id="motor-progress"></div>
                        </div>
                        <span id="motor-valor">100%</span>
                    </div>
                    <div class="info-item">
                        <span>Paneles Solares:</span>
                        <div class="progress-bar">
                            <div class="progress" id="paneles-progress"></div>
                        </div>
                        <span id="paneles-valor">100%</span>
                    </div>
                    <div class="info-item">
                        <span>Navegación:</span>
                        <div class="progress-bar">
                            <div class="progress" id="navegacion-progress"></div>
                        </div>
                        <span id="navegacion-valor">100%</span>
                    </div>
                </div>
                <div class="info-section">
                    <h4>Eficiencia</h4>
                    <div class="info-item">
                        <span>Eficiencia General:</span>
                        <div class="progress-bar">
                            <div class="progress" id="eficiencia-progress"></div>
                        </div>
                        <span id="eficiencia-valor">100%</span>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos optimizados para móviles
        const styles = document.createElement('style');
        styles.textContent = `
            .panel-informacion {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px;
                border-radius: 8px;
                width: 300px;
                font-family: Arial, sans-serif;
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                touch-action: none;
            }
            
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                user-select: none;
            }
            
            .panel-header h3 {
                margin: 0;
                color: #00ff00;
                font-size: 18px;
            }
            
            .toggle-panel {
                background: none;
                border: none;
                color: #00ff00;
                cursor: pointer;
                font-size: 20px;
                padding: 5px;
                touch-action: manipulation;
            }
            
            .info-section {
                margin-bottom: 15px;
            }
            
            .info-section h4 {
                margin: 0 0 10px 0;
                color: #00ff00;
                font-size: 16px;
            }
            
            .info-item {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .info-item span {
                margin-right: 10px;
                min-width: 80px;
            }
            
            .progress-bar {
                flex-grow: 1;
                height: 8px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                overflow: hidden;
                touch-action: none;
            }
            
            .progress {
                height: 100%;
                background: #00ff00;
                transition: width 0.3s ease;
            }
            
            @media (max-width: 768px) {
                .panel-informacion {
                    top: 10px;
                    right: 10px;
                    width: 250px;
                    padding: 10px;
                }
                
                .panel-header h3 {
                    font-size: 16px;
                }
                
                .info-section h4 {
                    font-size: 14px;
                }
                
                .info-item {
                    font-size: 12px;
                }
                
                .info-item span {
                    min-width: 70px;
                }
            }
            
            @media (max-width: 480px) {
                .panel-informacion {
                    width: 200px;
                    padding: 8px;
                }
                
                .panel-header h3 {
                    font-size: 14px;
                }
                
                .info-section h4 {
                    font-size: 12px;
                }
                
                .info-item {
                    font-size: 11px;
                }
                
                .info-item span {
                    min-width: 60px;
                }
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(panel);
        
        // Agregar funcionalidad de toggle optimizada para móviles
        const toggleButton = panel.querySelector('.toggle-panel');
        const panelContent = panel.querySelector('.panel-content');
        
        const togglePanel = () => {
            const isVisible = panelContent.style.display !== 'none';
            panelContent.style.display = isVisible ? 'none' : 'block';
            toggleButton.textContent = isVisible ? '▼' : '▲';
        };
        
        toggleButton.addEventListener('click', togglePanel);
        toggleButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            togglePanel();
        });
    }

    actualizarInformacionMision() {
        if (!this.fisicaNave || !this.fisicaNave.estado.simulando) return;
        
        const estado = this.fisicaNave.estado;
        
        // Actualizar valores
        this.estadoMision.combustible = estado.combustible;
        this.estadoMision.velocidad = estado.velocidad;
        this.estadoMision.distancia = Math.sqrt(
            estado.posicion.x * estado.posicion.x + 
            estado.posicion.y * estado.posicion.y
        );
        this.estadoMision.tiempoTranscurrido += 1/60; // 60 FPS
        
        // Calcular eficiencia
        const eficienciaCombustible = (estado.combustible / 100) * 100;
        const eficienciaSistemas = (
            this.estadoMision.estadoSistemas.motor +
            this.estadoMision.estadoSistemas.panelesSolares +
            this.estadoMision.estadoSistemas.navegacion
        ) / 3;
        
        this.estadoMision.eficiencia = (eficienciaCombustible + eficienciaSistemas) / 2;
        
        // Actualizar UI
        this.actualizarUI();
    }

    actualizarUI() {
        // Actualizar barras de progreso
        document.getElementById('combustible-progress').style.width = `${this.estadoMision.combustible}%`;
        document.getElementById('motor-progress').style.width = `${this.estadoMision.estadoSistemas.motor}%`;
        document.getElementById('paneles-progress').style.width = `${this.estadoMision.estadoSistemas.panelesSolares}%`;
        document.getElementById('navegacion-progress').style.width = `${this.estadoMision.estadoSistemas.navegacion}%`;
        document.getElementById('eficiencia-progress').style.width = `${this.estadoMision.eficiencia}%`;
        
        // Actualizar valores numéricos
        document.getElementById('combustible-valor').textContent = `${Math.round(this.estadoMision.combustible)}%`;
        document.getElementById('velocidad-valor').textContent = `${Math.round(this.estadoMision.velocidad * 100) / 100} km/s`;
        document.getElementById('distancia-valor').textContent = `${Math.round(this.estadoMision.distancia)} km`;
        document.getElementById('motor-valor').textContent = `${Math.round(this.estadoMision.estadoSistemas.motor)}%`;
        document.getElementById('paneles-valor').textContent = `${Math.round(this.estadoMision.estadoSistemas.panelesSolares)}%`;
        document.getElementById('navegacion-valor').textContent = `${Math.round(this.estadoMision.estadoSistemas.navegacion)}%`;
        document.getElementById('eficiencia-valor').textContent = `${Math.round(this.estadoMision.eficiencia)}%`;
    }

    aplicarDecision(decision) {
        switch(decision.tipo) {
            case 'combustible':
                this.estadoMision.combustible = Math.min(100, this.estadoMision.combustible + decision.valor);
                break;
            case 'motor':
                this.estadoMision.estadoSistemas.motor = Math.min(100, this.estadoMision.estadoSistemas.motor + decision.valor);
                break;
            case 'paneles':
                this.estadoMision.estadoSistemas.panelesSolares = Math.min(100, this.estadoMision.estadoSistemas.panelesSolares + decision.valor);
                break;
            case 'navegacion':
                this.estadoMision.estadoSistemas.navegacion = Math.min(100, this.estadoMision.estadoSistemas.navegacion + decision.valor);
                break;
        }
        
        // Actualizar UI inmediatamente
        this.actualizarUI();
        
        // Reproducir sonido de alerta si hay problemas
        if (this.estadoMision.estadoSistemas.motor < 30 ||
            this.estadoMision.estadoSistemas.panelesSolares < 30 ||
            this.estadoMision.estadoSistemas.navegacion < 30) {
            this.sistemaSonido.reproducirAlerta();
        }
    }

    verificarFinMision() {
        if (!this.fisicaNave || !this.fisicaNave.estado.simulando) return;
        
        const estado = this.fisicaNave.estado;
        const distanciaAMarte = Math.sqrt(
            Math.pow(estado.posicion.x - this.fisicaNave.ORBITA_MARTE_KM, 2) +
            Math.pow(estado.posicion.y, 2)
        );
        
        // Verificar condiciones de éxito/fallo
        if (distanciaAMarte < 1000) {
            this.estadoMision.exito = true;
            this.estadoMision.tiempoTotal = this.estadoMision.tiempoTranscurrido;
            this.sistemaSonido.reproducirAterrizaje();
            setTimeout(() => {
                this.sistemaSonido.reproducirExito();
            }, 2000);
            this.mostrarPantallaResultados();
        } else if (estado.combustible <= 0 || 
                   this.estadoMision.estadoSistemas.motor <= 0 ||
                   this.estadoMision.estadoSistemas.navegacion <= 0) {
            this.estadoMision.exito = false;
            this.estadoMision.tiempoTotal = this.estadoMision.tiempoTranscurrido;
            
            // Reproducir sonido de fallo
            this.sistemaSonido.reproducirFallo();
            
            // Determinar razón del fallo
            if (estado.combustible <= 0) {
                this.estadoMision.razonFallo = 'combustible';
            } else if (this.estadoMision.estadoSistemas.motor <= 0) {
                this.estadoMision.razonFallo = 'motor';
            } else {
                this.estadoMision.razonFallo = 'navegacion';
            }
            
            this.mostrarPantallaResultados();
        }
    }

    calcularPuntuacion() {
        if (!this.estadoMision.exito) return 0;

        // Puntuación base por completar la misión
        let puntuacion = 1000;

        // Puntuación por combustible restante (máximo 500 puntos)
        const combustibleRestante = this.estadoMision.combustible;
        puntuacion += (combustibleRestante / 100) * 500;

        // Puntuación por tiempo (máximo 1000 puntos)
        // Tiempo óptimo estimado: 300 segundos (5 minutos)
        const tiempoOptimo = 300;
        const tiempoActual = this.estadoMision.tiempoTotal;
        if (tiempoActual <= tiempoOptimo) {
            puntuacion += 1000;
        } else {
            const penalizacionTiempo = Math.min(1000, (tiempoActual - tiempoOptimo) * 2);
            puntuacion -= penalizacionTiempo;
        }

        // Puntuación por estado de sistemas (máximo 500 puntos)
        const promedioSistemas = (
            this.estadoMision.estadoSistemas.motor +
            this.estadoMision.estadoSistemas.panelesSolares +
            this.estadoMision.estadoSistemas.navegacion
        ) / 3;
        puntuacion += (promedioSistemas / 100) * 500;

        // Puntuación por precisión de trayectoria (máximo 500 puntos)
        const distanciaOptima = this.fisicaNave.ORBITA_MARTE_KM;
        const distanciaRecorrida = this.estadoMision.distancia;
        const diferenciaDistancia = Math.abs(distanciaRecorrida - distanciaOptima);
        const penalizacionDistancia = Math.min(500, diferenciaDistancia / 1000);
        puntuacion += 500 - penalizacionDistancia;

        // Asegurar que la puntuación no sea negativa
        return Math.max(0, Math.round(puntuacion));
    }

    mostrarPantallaResultados() {
        // Detener la simulación
        this.detenerSimulacion();
        
        // Crear pantalla de resultados
        const pantalla = document.createElement('div');
        pantalla.id = 'pantalla-resultados';
        pantalla.className = 'pantalla-resultados';
        
        // Calcular puntuación final
        this.estadoMision.puntuacion = this.calcularPuntuacion();
        
        let contenido = '';
        if (this.estadoMision.exito) {
            contenido = this.crearContenidoExito();
        } else {
            contenido = this.crearContenidoFallo();
        }
        
        pantalla.innerHTML = `
            <div class="resultados-container">
                <h2>${this.estadoMision.exito ? '¡Misión Exitosa!' : 'Misión Fallida'}</h2>
                ${contenido}
                <div class="estadisticas">
                    <h3>Estadísticas de la Misión</h3>
                    <p>Tiempo Total: ${Math.round(this.estadoMision.tiempoTotal / 60)} minutos</p>
                    <p>Distancia Recorrida: ${Math.round(this.estadoMision.distancia)} km</p>
                    <p>Velocidad Máxima: ${Math.round(this.estadoMision.velocidad * 100) / 100} km/s</p>
                    <p>Eficiencia Final: ${Math.round(this.estadoMision.eficiencia)}%</p>
                    ${this.estadoMision.exito ? `<p class="puntuacion">Puntuación Final: ${this.estadoMision.puntuacion} puntos</p>` : ''}
                </div>
                <button class="btn-reiniciar">Reiniciar Misión</button>
            </div>
        `;
        
        // Agregar estilos
        const styles = document.createElement('style');
        styles.textContent = `
            .pantalla-resultados {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                color: white;
                font-family: Arial, sans-serif;
            }
            
            .resultados-container {
                background: rgba(0, 20, 40, 0.9);
                padding: 30px;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                border: 2px solid #00ff00;
            }
            
            .resultados-container h2 {
                color: #00ff00;
                text-align: center;
                margin-bottom: 20px;
            }
            
            .resultados-container h3 {
                color: #00ff00;
                margin-top: 20px;
            }
            
            .info-marte, .info-fallo {
                margin: 20px 0;
                padding: 15px;
                background: rgba(0, 255, 0, 0.1);
                border-radius: 8px;
            }
            
            .estadisticas {
                margin-top: 20px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
            }
            
            .btn-reiniciar {
                display: block;
                margin: 20px auto 0;
                padding: 10px 20px;
                background: #00ff00;
                color: black;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s;
            }
            
            .btn-reiniciar:hover {
                background: #00cc00;
            }
            
            .sugerencias {
                margin-top: 15px;
                padding: 10px;
                background: rgba(255, 0, 0, 0.1);
                border-radius: 5px;
            }
            
            .puntuacion {
                font-size: 24px;
                color: #00ff00;
                text-align: center;
                margin-top: 20px;
                padding: 10px;
                background: rgba(0, 255, 0, 0.1);
                border-radius: 8px;
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(pantalla);
        
        // Agregar evento para reiniciar
        const btnReiniciar = pantalla.querySelector('.btn-reiniciar');
        btnReiniciar.addEventListener('click', () => {
            document.body.removeChild(pantalla);
            this.reiniciarSimulacion();
        });
    }

    crearContenidoExito() {
        return `
            <div class="info-marte">
                <h3>¡Bienvenido a Marte!</h3>
                <p>Has llegado exitosamente al planeta rojo. Aquí hay información sobre tu destino:</p>
                <ul>
                    <li>Distancia al Sol: 227.9 millones de km</li>
                    <li>Período orbital: 687 días terrestres</li>
                    <li>Diámetro: 6,792 km</li>
                    <li>Temperatura promedio: -63°C</li>
                    <li>Atmósfera: CO2 (95%), N2 (2.7%), Ar (1.6%)</li>
                </ul>
                <p>Marte es el cuarto planeta del sistema solar y el segundo más pequeño. 
                   Es conocido por sus características distintivas como el Monte Olimpo, 
                   el volcán más grande del sistema solar, y el Valle Marineris, 
                   uno de los cañones más grandes conocidos.</p>
            </div>
        `;
    }

    crearContenidoFallo() {
        let mensajeFallo = '';
        let sugerencias = '';
        
        switch(this.estadoMision.razonFallo) {
            case 'combustible':
                mensajeFallo = 'La misión falló debido a la falta de combustible.';
                sugerencias = `
                    <ul>
                        <li>Optimiza la trayectoria para reducir el consumo de combustible</li>
                        <li>Considera usar una nave con mayor capacidad de combustible</li>
                        <li>Implementa técnicas de asistencia gravitatoria</li>
                    </ul>
                `;
                break;
            case 'motor':
                mensajeFallo = 'La misión falló debido a un fallo en el sistema de propulsión.';
                sugerencias = `
                    <ul>
                        <li>Mejora el mantenimiento del motor antes del lanzamiento</li>
                        <li>Implementa sistemas de respaldo</li>
                        <li>Considera usar motores más robustos</li>
                    </ul>
                `;
                break;
            case 'navegacion':
                mensajeFallo = 'La misión falló debido a problemas de navegación.';
                sugerencias = `
                    <ul>
                        <li>Mejora la precisión de los cálculos de trayectoria</li>
                        <li>Implementa sistemas de navegación más precisos</li>
                        <li>Considera usar asistencia de navegación automática</li>
                    </ul>
                `;
                break;
        }
        
        return `
            <div class="info-fallo">
                <h3>Misión Fallida</h3>
                <p>${mensajeFallo}</p>
                <div class="sugerencias">
                    <h4>Sugerencias para Mejorar:</h4>
                    ${sugerencias}
                </div>
            </div>
        `;
    }

    actualizarNaveOtroJugador(jugadorId, estado) {
        let nave = this.navesOtrosJugadores.get(jugadorId);
        
        if (!nave) {
            nave = this.crearNave();
            nave.material.color.setHex(0xff0000); // Color rojo para otras naves
            this.scene.add(nave);
            this.navesOtrosJugadores.set(jugadorId, nave);
        }
        
        // Actualizar posición y rotación
        nave.position.set(
            estado.posicion.x,
            estado.posicion.y,
            estado.posicion.z
        );
        nave.rotation.set(
            estado.rotacion.x,
            estado.rotacion.y,
            estado.rotacion.z
        );
    }

    actualizar() {
        this.multijugador.enviarEstado();
    }
}

// Inicializar la simulación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const simulacion = new Simulacion3D('simulation-container');
    
    // Agregar event listeners para los botones con soporte táctil
    const botones = ['startSimulation', 'stopSimulation', 'resetSimulation'];
    botones.forEach(id => {
        const boton = document.getElementById(id);
        if (boton) {
            boton.addEventListener('click', () => {
                switch(id) {
                    case 'startSimulation':
                        simulacion.iniciarSimulacion();
                        break;
                    case 'stopSimulation':
                        simulacion.detenerSimulacion();
                        break;
                    case 'resetSimulation':
                        simulacion.reiniciarSimulacion();
                        break;
                }
            });
            
            // Prevenir comportamiento por defecto en dispositivos táctiles
            boton.addEventListener('touchend', (e) => {
                e.preventDefault();
            });
        }
    });
}); 