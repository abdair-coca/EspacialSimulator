class SistemaDesafios {
    constructor() {
        this.desafios = [
            {
                id: 'fallo_motor',
                titulo: 'Fallo en el Motor Principal',
                descripcion: 'Se ha detectado una anomalía en el motor principal. El rendimiento se ha reducido en un 30%.',
                opciones: [
                    {
                        texto: 'Realizar reparación de emergencia',
                        efecto: { combustible: -10, tiempo: 2, riesgo: 0.3 }
                    },
                    {
                        texto: 'Continuar con el motor dañado',
                        efecto: { combustible: -5, tiempo: 0, riesgo: 0.5 }
                    }
                ]
            },
            {
                id: 'tormenta_solar',
                titulo: 'Tormenta Solar Detectada',
                descripcion: 'Una tormenta solar se dirige hacia la nave. Los sistemas de protección están activados.',
                opciones: [
                    {
                        texto: 'Desviar la nave para evadir la tormenta',
                        efecto: { combustible: -15, tiempo: 3, riesgo: 0.2 }
                    },
                    {
                        texto: 'Mantener el curso y reforzar escudos',
                        efecto: { combustible: -8, tiempo: 1, riesgo: 0.4 }
                    }
                ]
            },
            {
                id: 'fallo_comunicacion',
                titulo: 'Problemas de Comunicación',
                descripcion: 'La antena principal ha dejado de funcionar correctamente.',
                opciones: [
                    {
                        texto: 'Activar sistema de respaldo',
                        efecto: { combustible: -5, tiempo: 1, riesgo: 0.1 }
                    },
                    {
                        texto: 'Intentar reparar la antena principal',
                        efecto: { combustible: -8, tiempo: 2, riesgo: 0.3 }
                    }
                ]
            },
            {
                id: 'radiacion_alta',
                titulo: 'Niveles de Radiación Elevados',
                descripcion: 'Se han detectado niveles de radiación superiores a los esperados.',
                opciones: [
                    {
                        texto: 'Activar blindaje adicional',
                        efecto: { combustible: -12, tiempo: 1, riesgo: 0.2 }
                    },
                    {
                        texto: 'Ajustar la trayectoria para minimizar exposición',
                        efecto: { combustible: -10, tiempo: 2, riesgo: 0.3 }
                    }
                ]
            }
        ];
        
        this.modal = null;
        this.crearModal();
    }

    crearModal() {
        // Crear el modal si no existe
        if (!document.getElementById('desafioModal')) {
            const modalHTML = `
                <div class="modal fade" id="desafioModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="desafioTitulo"></h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p id="desafioDescripcion"></p>
                                <div id="desafioOpciones" class="mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        this.modal = new bootstrap.Modal(document.getElementById('desafioModal'));
    }

    generarDesafioAleatorio() {
        const indice = Math.floor(Math.random() * this.desafios.length);
        return this.desafios[indice];
    }

    mostrarDesafio(desafio) {
        const titulo = document.getElementById('desafioTitulo');
        const descripcion = document.getElementById('desafioDescripcion');
        const opciones = document.getElementById('desafioOpciones');
        
        titulo.textContent = desafio.titulo;
        descripcion.textContent = desafio.descripcion;
        
        opciones.innerHTML = desafio.opciones.map(opcion => `
            <button class="btn btn-primary w-100 mb-2" onclick="sistemaDesafios.resolverDesafio('${desafio.id}', '${opcion.texto}')">
                ${opcion.texto}
            </button>
        `).join('');
        
        this.modal.show();
    }

    resolverDesafio(desafioId, opcionSeleccionada) {
        const desafio = this.desafios.find(d => d.id === desafioId);
        const opcion = desafio.opciones.find(o => o.texto === opcionSeleccionada);
        
        // Aplicar efectos
        this.aplicarEfectos(opcion.efecto);
        
        // Cerrar modal
        this.modal.hide();
        
        // Mostrar resultado
        this.mostrarResultado(desafio, opcion);
    }

    aplicarEfectos(efecto) {
        // Actualizar estado de la nave
        const fisicaNave = window.fisicaNave;
        if (fisicaNave) {
            // Reducir combustible
            const combustibleActual = fisicaNave.estado.combustible;
            fisicaNave.estado.combustible = Math.max(0, combustibleActual - efecto.combustible);
            
            // Ajustar tiempo de viaje
            if (efecto.tiempo > 0) {
                fisicaNave.estado.tiempoViaje += efecto.tiempo;
            }
            
            // Aplicar riesgo
            if (Math.random() < efecto.riesgo) {
                this.aplicarConsecuenciaAleatoria();
            }
        }
    }

    aplicarConsecuenciaAleatoria() {
        const consecuencias = [
            'Reducción adicional del 10% en el combustible',
            'Aumento del tiempo de viaje en 1 día',
            'Daño en los sistemas de la nave'
        ];
        
        const consecuencia = consecuencias[Math.floor(Math.random() * consecuencias.length)];
        console.log('Consecuencia aplicada:', consecuencia);
    }

    mostrarResultado(desafio, opcion) {
        const toastHTML = `
            <div class="toast" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">Resultado del Desafío</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    <p>Has elegido: ${opcion.texto}</p>
                    <p>Efectos:</p>
                    <ul>
                        <li>Combustible: -${opcion.efecto.combustible}%</li>
                        <li>Tiempo adicional: ${opcion.efecto.tiempo} días</li>
                        <li>Riesgo: ${Math.round(opcion.efecto.riesgo * 100)}%</li>
                    </ul>
                </div>
            </div>
        `;
        
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.innerHTML = toastHTML;
        document.body.appendChild(toastContainer);
        
        const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
        toast.show();
        
        // Eliminar el toast después de que se oculte
        toastContainer.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }
}

// Inicializar el sistema de desafíos
let sistemaDesafios;

document.addEventListener('DOMContentLoaded', () => {
    sistemaDesafios = new SistemaDesafios();
    
    // Programar desafíos aleatorios durante el viaje
    setInterval(() => {
        if (window.fisicaNave && window.fisicaNave.estado.simulando) {
            if (Math.random() < 0.1) { // 10% de probabilidad cada intervalo
                const desafio = sistemaDesafios.generarDesafioAleatorio();
                sistemaDesafios.mostrarDesafio(desafio);
            }
        }
    }, 30000); // Verificar cada 30 segundos
}); 