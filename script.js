// --- BASE DE DATOS DE TUS CAMPAÑAS ---
// (Aquí pegarás lo que te dé el generador.html)
const campaignsData = [
    { id: 1, title: "Ladridos de mi Perro", category: "mascotas", src: "campañas/Mascotas-Ladridos de mi Perro.jpeg" },
    { id: 2, title: "Tu Mascota es tu Responsabilidad", category: "mascotas", src: "campañas/Mascotas-Tu Mascota es tu Responsabilidad.jpeg" },
    { id: 3, title: "Pausas Activas", category: "oficina", src: "campañas/Oficina-Pausas Activas.jpeg" },
    { id: 4, title: "Que la Vida no te Sorprenda", category: "reciclaje", src: "campañas/Reciclaje-Que la Vida no te Sorprenda.jpeg" },
    { id: 5, title: "¿Como disminuir la contaminacion por Ruido", category: "ruido", src: "campañas/Ruido-¿Como disminuir la contaminacion por Ruido.jpeg" },
    { id: 6, title: "Colaboracion en la Limpieza", category: "zonas-comunes", src: "campañas/Zonas Comunes-Colaboracion en la Limpieza.jpeg" },
    { id: 7, title: "Usa las Areas Comunes con Responsabilidad", category: "zonas-comunes", src: "campañas/Zonas Comunes-Usa las Areas Comunes con Responsabilidad.jpeg" }
];

// --- VARIABLES DE INTERFAZ ---
const catalogView = document.getElementById('catalog-view');
const editorView = document.getElementById('editor-view');
const galleryContainer = document.getElementById('galleryContainer');
const filtersContainer = document.getElementById('filtersContainer');
const searchInput = document.getElementById('searchInput');
const backBtn = document.getElementById('backBtn');

let canvas, currentLogoObject = null, watermarkObject = null, originalScaleRatio = 1;
let currentCategory = 'all'; // Recordamos qué categoría está seleccionada



// --- CONFIGURACIÓN DE PRECIOS Y CARRITO ---
const PRICE_PER_CAMPAIGN = 20000; // Ejemplo: $20.000 COP por imagen
const DISCOUNT_THRESHOLD = 3; // Cuántas imágenes debe comprar para el descuento
const DISCOUNT_PERCENTAGE = 0.20; // 20% de descuento si lleva 3 o más

let shoppingCart = [];
const cartView = document.getElementById('cart-view');
const viewCartBtn = document.getElementById('viewCartBtn');
const cartCount = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const subtotalPrice = document.getElementById('subtotalPrice');
const discountPrice = document.getElementById('discountPrice');
const totalPrice = document.getElementById('totalPrice');



// 1. GENERAR FILTROS AUTOMÁTICAMENTE
function generateFilters() {
    filtersContainer.innerHTML = '';

    // Crear el botón de "Todas" por defecto
    const btnAll = document.createElement('button');
    btnAll.className = 'filter-btn active';
    btnAll.innerText = 'Todas';
    btnAll.onclick = () => updateCategory('all', btnAll);
    filtersContainer.appendChild(btnAll);

    // Extraer las categorías únicas de la base de datos (sin repetir)
    const uniqueCategories = [...new Set(campaignsData.map(item => item.category))];

    uniqueCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        
        // Quitar guiones y poner mayúsculas (ej: "zonas-comunes" -> "Zonas Comunes")
        const cleanName = cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        btn.innerText = cleanName;
        btn.onclick = () => updateCategory(cat, btn);
        filtersContainer.appendChild(btn);
    });
}

// Actualizar la categoría al hacer clic en un botón
function updateCategory(categoryName, btnElement) {
    currentCategory = categoryName;
    
    // Cambiar la clase 'active' para que se pinte el botón correcto
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    
    renderGallery(); // Volver a dibujar la galería
}

// 2. RENDERIZAR LA GALERÍA (CON BÚSQUEDA Y FILTRO)
function renderGallery() {
    galleryContainer.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const filteredCampaigns = campaignsData.filter(camp => {
        // ¿Cumple con la categoría seleccionada?
        const matchCategory = currentCategory === 'all' || camp.category === currentCategory;
        
        // ¿Cumple con lo que está escrito en el buscador?
        const matchSearch = camp.title.toLowerCase().includes(searchTerm) || camp.category.toLowerCase().includes(searchTerm);
        
        return matchCategory && matchSearch;
    });

    if (filteredCampaigns.length === 0) {
        galleryContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #777;">No se encontraron campañas con esta búsqueda.</p>';
        return;
    }

    filteredCampaigns.forEach(camp => {
        const card = document.createElement('div');
        card.className = 'campaign-card';
        card.onclick = () => openEditor(camp.src);

        card.innerHTML = `
            <img src="${camp.src}" alt="${camp.title}">
            <div class="card-title">${camp.title}</div>
        `;
        galleryContainer.appendChild(card);
    });
}

// Escuchar cuando el usuario escribe en el buscador
searchInput.addEventListener('input', renderGallery);

// 3. CAMBIAR ENTRE VISTAS
function openEditor(imageSrc) {
    catalogView.style.display = 'none';
    editorView.style.display = 'flex';
    
    if (!canvas) {
        canvas = new fabric.Canvas('canvasEditor', { backgroundColor: '#fff' });
    }
    
    loadCampaignToCanvas(imageSrc);
}

backBtn.addEventListener('click', () => {
    editorView.style.display = 'none';
    catalogView.style.display = 'block';
    if (canvas) canvas.clear();
    currentLogoObject = null;
    watermarkObject = null;
});

// Arrancar la app (Se aseguran de llamar a ambas funciones al final de tu archivo original)
// RECUERDA: Al final de todo tu script.js (después de la lógica de descarga y bloqueo) 
// debe decir esto:
// generateFilters();
// renderGallery();

// 4. LÓGICA DE FABRIC.JS (AJUSTE AUTOMÁTICO DE TAMAÑO)
function loadCampaignToCanvas(imageSrc) {
    fabric.Image.fromURL(imageSrc, function(img) {
        
        // --- MAGIA RESPONSIVE ---
        // Si la pantalla es pequeña (celular), el tamaño máximo será el ancho de la pantalla menos un margen.
        // Si es PC, el tamaño máximo sigue siendo 550px.
        let MAX_SIZE = 550; 
        if (window.innerWidth < 600) {
            MAX_SIZE = window.innerWidth - 40; 
        }
        
        originalScaleRatio = 1; 

        if (img.width > MAX_SIZE || img.height > MAX_SIZE) {
            originalScaleRatio = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
        }

        canvas.setWidth(img.width * originalScaleRatio);
        canvas.setHeight(img.height * originalScaleRatio);

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), { 
            scaleX: originalScaleRatio,
            scaleY: originalScaleRatio,
            crossOrigin: 'anonymous' 
        });
        
        addWatermark();
    }, { crossOrigin: 'anonymous' });
}

// Lógica de la marca de agua (VERSIÓN DE ALTA SEGURIDAD)
function addWatermark() {
    fabric.Image.fromURL('logo-impactar.png', function(wm) { 
        if (!wm) return;

        // 1. AUMENTAMOS EL TAMAÑO: Ahora ocupa el 120% del ancho (cruza de lado a lado sin dejar huecos)
        const scale = (canvas.width * 1.2) / wm.width;
        
        wm.set({
            originX: 'center',
            originY: 'center',
            left: canvas.width / 2, 
            top: canvas.height / 2, 
            scaleX: scale,
            scaleY: scale,
            angle: -35, // Inclinación ideal para cruzar de esquina a esquina
            
            // 2. AUMENTAMOS LA VISIBILIDAD: Subimos de 0.35 a 0.55. 
            // Es lo suficientemente oscura para arruinar una captura de pantalla, 
            // pero deja ver el diseño de fondo.
            opacity: 0.55, 
            
            selectable: false, 
            evented: false     
        });

        watermarkObject = wm;
        canvas.add(wm);
        canvas.bringToFront(wm);
        canvas.renderAll();
    });
}

// Subir logo del cliente
document.getElementById('logoUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, function(img) {
            if (currentLogoObject) canvas.remove(currentLogoObject);

            img.set({
                left: 50, top: 50, cornerColor: '#007bff',
                cornerSize: 15, transparentCorners: false, borderColor: '#007bff'
            });

            // Ajustamos el tamaño del logo para que no ocupe más del 30% del espacio
            if (img.width > canvas.width * 0.3) {
                img.scaleToWidth(canvas.width * 0.3);
            }

            currentLogoObject = img;
            canvas.add(img);
            
            if (watermarkObject) canvas.bringToFront(watermarkObject);
            
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});

// --- LÓGICA DEL CARRITO DE COMPRAS ---

// --- 6. LÓGICA DEL CARRITO ---
const addToCartBtn = document.getElementById('addToCartBtn');
if(addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
        if(!canvas.backgroundImage) return;
        
        // 1. Tomar la foto final
        canvas.discardActiveObject();
        canvas.renderAll();
        const previewURL = canvas.toDataURL({ format: 'jpeg', quality: 0.5 });

        // 2. Guardar en el carrito y actualizar
        shoppingCart.push({ id: Date.now(), preview: previewURL });
        updateCartUI();
        
        // 3. Cerrar el editor y limpiar el lienzo suavemente
        editorView.style.display = 'none';
        catalogView.style.display = 'block';
        if (canvas) {
            canvas.clear();
            canvas.backgroundColor = '#fff'; // Evita errores de fondo transparente
        }
        currentLogoObject = null;
        watermarkObject = null;
        
        // 4. --- NUEVO AVISO PROFESIONAL (Evita que la pantalla se congele) ---
        const btnCarrito = document.getElementById('viewCartBtn');
        if (btnCarrito) {
            // Cambiamos el estilo temporalmente para confirmar la acción
            btnCarrito.style.backgroundColor = '#0dcaf0'; // Color azul claro vibrante
            btnCarrito.innerHTML = '¡Añadido! ✅';
            btnCarrito.style.transform = 'scale(1.15)'; // Se hace un poquito más grande
            
            // Después de 2 segundos, vuelve a la normalidad
            setTimeout(() => {
                btnCarrito.style.backgroundColor = '#198754'; // Vuelve al verde
                btnCarrito.innerHTML = `🛒 Ver Carrito <span id="cartCount">${shoppingCart.length}</span>`;
                btnCarrito.style.transform = 'scale(1)';
            }, 2000); 
        }
    });
}

function updateCartUI() {
    // Actualizar la bolita flotante
    cartCount.innerText = shoppingCart.length;
    viewCartBtn.style.display = shoppingCart.length > 0 ? 'inline-block' : 'none';

    // Limpiar vista del carrito
    cartItemsContainer.innerHTML = '';
    const promoMsg = document.getElementById('dynamicPromoMessage');

    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
        subtotalPrice.innerText = '$0';
        discountPrice.innerText = '$0';
        totalPrice.innerText = '$0';
        promoMsg.style.display = 'none';
        return;
    }

    // --- LÓGICA DEL MENSAJE INTELIGENTE ---
    promoMsg.style.display = 'block';
    if (shoppingCart.length > 0 && shoppingCart.length < DISCOUNT_THRESHOLD) {
        let faltan = DISCOUNT_THRESHOLD - shoppingCart.length;
        promoMsg.innerHTML = `¡Agrega <strong>${faltan}</strong> campaña(s) más para obtener tu 20% de descuento! 🎁`;
        promoMsg.style.backgroundColor = '#fff3cd';
        promoMsg.style.color = '#856404';
    } else if (shoppingCart.length >= DISCOUNT_THRESHOLD) {
        promoMsg.innerHTML = `🎉 ¡Felicidades! Tienes un 20% de descuento aplicado en tu compra.`;
        promoMsg.style.backgroundColor = '#d4edda';
        promoMsg.style.color = '#155724';
    }

    // Dibujar cada item en el carrito
    shoppingCart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.preview}" alt="Previsualización">
            <div class="cart-item-info">
                <div class="cart-item-title">Campaña Personalizada #${index + 1}</div>
                <div>Precio: $${PRICE_PER_CAMPAIGN.toLocaleString()}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${item.id})">❌ Quitar</button>
        `;
        cartItemsContainer.appendChild(div);
    });

    // Calcular las matemáticas
    let subtotal = shoppingCart.length * PRICE_PER_CAMPAIGN;
    let discount = 0;

    // Aplicar descuento si lleva la cantidad mínima
    if (shoppingCart.length >= DISCOUNT_THRESHOLD) {
        discount = subtotal * DISCOUNT_PERCENTAGE;
    }

    let finalTotal = subtotal - discount;

    // Mostrar en pantalla (formateado con separadores de miles)
    subtotalPrice.innerText = `$${subtotal.toLocaleString()}`;
    discountPrice.innerText = `-$${discount.toLocaleString()}`;
    totalPrice.innerText = `$${finalTotal.toLocaleString()}`;
}

    // Dibujar cada item en el carrito
    shoppingCart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.preview}" alt="Previsualización">
            <div class="cart-item-info">
                <div class="cart-item-title">Campaña Personalizada #${index + 1}</div>
                <div>Precio: $${PRICE_PER_CAMPAIGN.toLocaleString()}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${item.id})">❌ Quitar</button>
        `;
        cartItemsContainer.appendChild(div);
    });

    // Calcular las matemáticas
    let subtotal = shoppingCart.length * PRICE_PER_CAMPAIGN;
    let discount = 0;

    // Aplicar descuento si lleva la cantidad mínima
    if (shoppingCart.length >= DISCOUNT_THRESHOLD) {
        discount = subtotal * DISCOUNT_PERCENTAGE;
    }

    let finalTotal = subtotal - discount;

    // Mostrar en pantalla (formateado con separadores de miles)
    subtotalPrice.innerText = `$${subtotal.toLocaleString()}`;
    discountPrice.innerText = `-$${discount.toLocaleString()}`;
    totalPrice.innerText = `$${finalTotal.toLocaleString()}`;


// 3. Quitar del carrito
window.removeFromCart = function(id) {
    shoppingCart = shoppingCart.filter(item => item.id !== id);
    updateCartUI();
};

// 4. Navegación del Carrito
viewCartBtn.addEventListener('click', () => {
    catalogView.style.display = 'none';
    cartView.style.display = 'block';
});

document.getElementById('backFromCartBtn').addEventListener('click', () => {
    cartView.style.display = 'none';
    catalogView.style.display = 'block';
});

// Iniciar la app
generateFilters();
renderGallery();

// --- ESCUDO ANTI-ROBO (BLOQUEO DE CLIC DERECHO Y ATAJOS) ---

// 1. Desactivar el clic derecho en toda la página
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// 2. Bloquear atajos de teclado para guardar (Ctrl+S) o Imprimir (Ctrl+P)
document.addEventListener('keydown', function(e) {
    // Si presionan Control (Windows) o Command (Mac) + S o P
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
        e.preventDefault();
        alert("Acción no permitida por seguridad.");
    }
});