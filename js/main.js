// Funcionalidad principal del sitio web
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de la simulación
    const startButton = document.getElementById('startSimulation');
    if (startButton) {
        startButton.addEventListener('click', function() {
            // Scroll suave a la sección de simulación
            document.getElementById('simulacion').scrollIntoView({
                behavior: 'smooth'
            });
            // Iniciar la simulación
            initSimulation();
        });
    }

    // Navegación suave para todos los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animación de las cards al hacer scroll
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        observer.observe(card);
    });

    // Configuración de arrastrar y soltar
    const componentes = document.querySelectorAll('.componente');
    const naveContainer = document.getElementById('naveContainer');

    componentes.forEach(componente => {
        componente.addEventListener('dragstart', handleDragStart);
    });

    naveContainer.addEventListener('dragover', handleDragOver);
    naveContainer.addEventListener('drop', handleDrop);

    // Actualizar especificaciones iniciales
    actualizarEspecificaciones();
});

// Función para inicializar la simulación
function initSimulation() {
    // Esta función será implementada en simulation.js
    console.log('Iniciando simulación...');
}

// Configuración de componentes de la nave
const componentesConfig = {
    motor: {
        nombre: 'Motor Principal',
        peso: 1000,
        empuje: 500,
        autonomia: 0,
        capacidad: 0,
        costo: 500000,
        eficiencia: 0.85,
        descripcion: 'Motor de propulsión principal con alta eficiencia'
    },
    tanque: {
        nombre: 'Tanque de Combustible',
        peso: 2000,
        empuje: 0,
        autonomia: 30,
        capacidad: 0,
        costo: 300000,
        eficiencia: 0.95,
        descripcion: 'Tanque de almacenamiento de combustible criogénico'
    },
    cabina: {
        nombre: 'Cabina de Tripulación',
        peso: 1500,
        empuje: 0,
        autonomia: 0,
        capacidad: 4,
        costo: 800000,
        eficiencia: 1,
        descripcion: 'Módulo habitable para la tripulación'
    },
    paneles: {
        nombre: 'Paneles Solares',
        peso: 500,
        empuje: 0,
        autonomia: 15,
        capacidad: 0,
        costo: 200000,
        eficiencia: 0.75,
        descripcion: 'Sistema de generación de energía solar'
    }
};

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.componente);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const componenteTipo = e.dataTransfer.getData('text/plain');
    const componente = componentesConfig[componenteTipo];
    
    if (componente) {
        const componenteElement = document.createElement('div');
        componenteElement.className = 'componente-colocado';
        componenteElement.dataset.componente = componenteTipo;
        componenteElement.innerHTML = `
            <div class="componente-header">
                <i class="fas ${getIconForComponente(componenteTipo)}"></i>
                <span>${componente.nombre}</span>
                <div class="remove-componente">×</div>
            </div>
            <div class="componente-details">
                <div class="detail-item">
                    <span class="detail-label">Peso:</span>
                    <span class="detail-value">${componente.peso} kg</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Costo:</span>
                    <span class="detail-value">$${componente.costo.toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Eficiencia:</span>
                    <span class="detail-value">${(componente.eficiencia * 100).toFixed(0)}%</span>
                </div>
            </div>
            <div class="componente-tooltip">
                ${componente.descripcion}
            </div>
        `;

        // Eliminar el placeholder si existe
        const placeholder = e.currentTarget.querySelector('.nave-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        e.currentTarget.appendChild(componenteElement);

        // Agregar eventos para el componente
        const removeBtn = componenteElement.querySelector('.remove-componente');
        removeBtn.addEventListener('click', function() {
            componenteElement.remove();
            actualizarEspecificaciones();
        });

        // Agregar evento para mostrar tooltip
        componenteElement.addEventListener('mouseenter', function() {
            this.querySelector('.componente-tooltip').style.display = 'block';
        });

        componenteElement.addEventListener('mouseleave', function() {
            this.querySelector('.componente-tooltip').style.display = 'none';
        });

        actualizarEspecificaciones();
    }
}

function getIconForComponente(tipo) {
    const iconos = {
        motor: 'fa-rocket',
        tanque: 'fa-gas-pump',
        cabina: 'fa-user-astronaut',
        paneles: 'fa-solar-panel'
    };
    return iconos[tipo] || 'fa-cube';
}

function actualizarEspecificaciones() {
    const componentesColocados = document.querySelectorAll('.componente-colocado');
    let pesoTotal = 0;
    let empujeTotal = 0;
    let autonomiaMax = 0;
    let capacidadTotal = 0;
    let costoTotal = 0;
    let eficienciaPromedio = 0;

    componentesColocados.forEach(componente => {
        const tipo = componente.dataset.componente;
        const config = componentesConfig[tipo];
        
        pesoTotal += config.peso;
        empujeTotal += config.empuje;
        autonomiaMax = Math.max(autonomiaMax, config.autonomia);
        capacidadTotal += config.capacidad;
        costoTotal += config.costo;
        eficienciaPromedio += config.eficiencia;
    });

    eficienciaPromedio = componentesColocados.length > 0 
        ? eficienciaPromedio / componentesColocados.length 
        : 0;

    document.getElementById('pesoTotal').textContent = `${pesoTotal} kg`;
    document.getElementById('empuje').textContent = `${empujeTotal} kN`;
    document.getElementById('autonomia').textContent = `${autonomiaMax} días`;
    document.getElementById('capacidad').textContent = `${capacidadTotal} tripulantes`;
    document.getElementById('costoTotal').textContent = `$${costoTotal.toLocaleString()}`;
    document.getElementById('eficienciaPromedio').textContent = `${(eficienciaPromedio * 100).toFixed(0)}%`;
} 