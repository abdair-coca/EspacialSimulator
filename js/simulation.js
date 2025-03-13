// Configuración de la simulación 3D
let scene, camera, renderer, mars;

function initSimulation() {
    // Crear la escena
    scene = new THREE.Scene();
    
    // Crear la cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Crear el renderer
    const container = document.getElementById('simulation-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Crear Marte (esfera básica por ahora)
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0xc1440e,
        specular: 0x333333,
        shininess: 25
    });
    mars = new THREE.Mesh(geometry, material);
    scene.add(mars);
    
    // Añadir luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Manejar el redimensionamiento de la ventana
    window.addEventListener('resize', onWindowResize, false);
    
    // Iniciar la animación
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotar Marte
    mars.rotation.y += 0.005;
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('simulation-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
} 