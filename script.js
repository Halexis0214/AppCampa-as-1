// =========================================================
// --- BASE DE DATOS DE TUS CAMPAÑAS ---
// =========================================================
const campaignsData = [
    { id: 1, title: "Ladridos de mi Perro", category: "mascotas", src: "campañas/Mascotas-Ladridos de mi Perro.jpeg" },
    { id: 2, title: "Tu Mascota es tu Responsabilidad", category: "mascotas", src: "campañas/Mascotas-Tu Mascota es tu Responsabilidad.jpeg" },
    { id: 3, title: "Pausas Activas", category: "oficina", src: "campañas/Oficina-Pausas Activas.jpeg" },
    { id: 4, title: "Que la Vida no te Sorprenda", category: "reciclaje", src: "campañas/Reciclaje-Que la Vida no te Sorprenda.jpeg" },
    { id: 5, title: "¿Como disminuir la contaminacion por Ruido", category: "ruido", src: "campañas/Ruido-¿Como disminuir la contaminacion por Ruido.jpeg" },
    { id: 6, title: "Colaboracion en la Limpieza", category: "zonas-comunes", src: "campañas/Zonas Comunes-Colaboracion en la Limpieza.jpeg" },
    { id: 7, title: "Usa las Areas Comunes con Responsabilidad", category: "zonas-comunes", src: "campañas/Zonas Comunes-Usa las Areas Comunes con Responsabilidad.jpeg" }
];

// =========================================================
// --- VARIABLES DE INTERFAZ ---
// =========================================================
const catalogView = document.getElementById('catalog-view');
const editorView = document.getElementById('editor-view');
const galleryContainer = document.getElementById('galleryContainer');
const filtersContainer = document.getElementById('filtersContainer');
const searchInput = document.getElementById('searchInput');
const backBtn = document.getElementById('backBtn');

let canvas, currentLogoObject = null, watermarkObject = null, originalScaleRatio = 1;
let currentCategory = 'all';

const PRICE_PER_CAMPAIGN = 20000; 
const DISCOUNT_THRESHOLD = 3; 
const DISCOUNT_PERCENTAGE = 0.20; 

let shoppingCart = [];
const cartView = document.getElementById('cart-view');
const viewCartBtn = document.getElementById('viewCartBtn');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const subtotalPrice = document.getElementById('subtotalPrice');
const discountPrice = document.getElementById('discountPrice');
const totalPrice = document.getElementById('totalPrice');

// =========================================================
// --- LÓGICA DE LA INTERFAZ ---
// =========================================================
function generateFilters() {
    filtersContainer.innerHTML = '';
    const btnAll = document.createElement('button');
    btnAll.className = 'filter-btn active';
    btnAll.innerText = 'Todas';
    btnAll.onclick = () => updateCategory('all', btnAll);
    filtersContainer.appendChild(btnAll);

    const uniqueCategories = [...new Set(campaignsData.map(item => item.category))];
    uniqueCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        const cleanName = cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        btn.innerText = cleanName;
        btn.onclick = () => updateCategory(cat, btn);
        filtersContainer.appendChild(btn);
    });
}

function updateCategory(categoryName, btnElement) {
    currentCategory = categoryName;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    renderGallery(); 
}

function renderGallery() {
    galleryContainer.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const filteredCampaigns = campaignsData.filter(camp => {
        const matchCategory = currentCategory === 'all' || camp.category === currentCategory;
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
        card.innerHTML = `<img src="${camp.src}" alt="${camp.title}"><div class="card-title">${camp.title}</div>`;
        galleryContainer.appendChild(card);
    });
}

searchInput.addEventListener('input', renderGallery);

function openEditor(imageSrc) {
    catalogView.style.display = 'none';
    editorView.style.display = 'flex';
    if (!canvas) canvas = new fabric.Canvas('canvasEditor', { backgroundColor: '#fff' });
    loadCampaignToCanvas(imageSrc);
}

backBtn.addEventListener('click', () => {
    editorView.style.display = 'none';
    catalogView.style.display = 'block';
    if (canvas) canvas.clear();
    currentLogoObject = null;
    watermarkObject = null;
});

function loadCampaignToCanvas(imageSrc) {
    fabric.Image.fromURL(imageSrc, function(img) {
        let MAX_SIZE = 550; 
        if (window.innerWidth < 600) MAX_SIZE = window.innerWidth - 40; 
        
        originalScaleRatio = 1; 
        if (img.width > MAX_SIZE || img.height > MAX_SIZE) {
            originalScaleRatio = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
        }

        canvas.setWidth(img.width * originalScaleRatio);
        canvas.setHeight(img.height * originalScaleRatio);
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), { 
            scaleX: originalScaleRatio, scaleY: originalScaleRatio, crossOrigin: 'anonymous' 
        });
        addWatermark();
    }, { crossOrigin: 'anonymous' });
}

function addWatermark() {
    fabric.Image.fromURL('logo-impactar.png', function(wm) { 
        if (!wm) return;
        const scale = (canvas.width * 1.2) / wm.width;
        wm.set({
            originX: 'center', originY: 'center',
            left: canvas.width / 2, top: canvas.height / 2, 
            scaleX: scale, scaleY: scale, angle: -35, opacity: 0.55, 
            selectable: false, evented: false     
        });
        watermarkObject = wm;
        canvas.add(wm);
        canvas.bringToFront(wm);
        canvas.renderAll();
    });
}

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
            if (img.width > canvas.width * 0.3) img.scaleToWidth(canvas.width * 0.3);
            currentLogoObject = img;
            canvas.add(img);
            if (watermarkObject) canvas.bringToFront(watermarkObject);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});

// =========================================================
// --- LÓGICA DEL CARRITO (AHORA EXPORTA IMAGEN LIMPIA) ---
// =========================================================
const addToCartBtn = document.getElementById('addToCartBtn');
if(addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
        if(!canvas.backgroundImage) return;
        
        canvas.discardActiveObject();
        
        // 1. Ocultar marca de agua temporalmente
        if (watermarkObject) watermarkObject.set('opacity', 0);
        canvas.renderAll();
        
        // 2. Tomar "foto" de alta calidad SIN marca de agua (Para Make.com)
        const cleanURL = canvas.toDataURL({ format: 'jpeg', quality: 0.9 });
        
        // 3. Volver a mostrar la marca de agua y tomar foto de baja calidad (Para visualización del cliente)
        if (watermarkObject) watermarkObject.set('opacity', 0.55);
        canvas.renderAll();
        const previewURL = canvas.toDataURL({ format: 'jpeg', quality: 0.3 });

        // 4. Guardar ambas versiones en el carrito
        shoppingCart.push({ 
            id: Date.now(), 
            preview: previewURL,    // Visible en la web
            cleanImage: cleanURL    // Oculta para enviar por correo
        });
        
        updateCartUI();
        
        editorView.style.display = 'none';
        catalogView.style.display = 'block';
        if (canvas) {
            canvas.clear();
            canvas.backgroundColor = '#fff'; 
        }
        currentLogoObject = null;
        watermarkObject = null;
        
        const btnCarrito = document.getElementById('viewCartBtn');
        if (btnCarrito) {
            btnCarrito.style.backgroundColor = '#0dcaf0'; 
            btnCarrito.innerHTML = '¡Añadido! ✅';
            btnCarrito.style.transform = 'scale(1.15)'; 
            
            setTimeout(() => {
                btnCarrito.style.backgroundColor = '#198754'; 
                btnCarrito.innerHTML = `🛒 Ver Carrito <span id="cartCount">${shoppingCart.length}</span>`;
                btnCarrito.style.transform = 'scale(1)';
            }, 2000); 
        }
    });
}

function updateCartUI() {
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.innerText = shoppingCart.length;
    
    viewCartBtn.style.display = shoppingCart.length > 0 ? 'inline-block' : 'none';
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

    let subtotal = shoppingCart.length * PRICE_PER_CAMPAIGN;
    let discount = 0;
    if (shoppingCart.length >= DISCOUNT_THRESHOLD) discount = subtotal * DISCOUNT_PERCENTAGE;
    let finalTotal = subtotal - discount;

    subtotalPrice.innerText = `$${subtotal.toLocaleString()}`;
    discountPrice.innerText = `-$${discount.toLocaleString()}`;
    totalPrice.innerText = `$${finalTotal.toLocaleString()}`;
}

window.removeFromCart = function(id) {
    shoppingCart = shoppingCart.filter(item => item.id !== id);
    updateCartUI();
};

viewCartBtn.addEventListener('click', () => {
    catalogView.style.display = 'none';
    cartView.style.display = 'block';
});

document.getElementById('backFromCartBtn').addEventListener('click', () => {
    cartView.style.display = 'none';
    catalogView.style.display = 'block';
});

generateFilters();
renderGallery();

// =========================================================
// --- ESCUDO ANTI-ROBO ---
// =========================================================
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
        e.preventDefault();
        alert("Acción no permitida por seguridad.");
    }
});

// =========================================================
// --- LÓGICA VISUAL DEL CUPÓN ---
// =========================================================
const applyCouponBtn = document.getElementById('applyCouponBtn');
const couponMessage = document.getElementById('couponMessage');

if (applyCouponBtn) {
    applyCouponBtn.addEventListener('click', function() {
        const cuponInput = document.getElementById('discountCode').value.trim().toUpperCase();
        
        if (cuponInput === "IMPACTANDOHOGARES") {
            couponMessage.style.display = "block";
            couponMessage.style.color = "#00a650"; 
            couponMessage.innerHTML = "✅ ¡Cupón aplicado exitosamente! Se te cobrará con tarifa especial de aliado.";
        } else if (cuponInput === "PRUEBAMAKE") {
            couponMessage.style.display = "block";
            couponMessage.style.color = "#0056b3"; 
            couponMessage.innerHTML = "🚀 ¡Modo de simulación activado! Los archivos se enviarán gratis a Make.";
        } else if (cuponInput === "") {
            couponMessage.style.display = "block";
            couponMessage.style.color = "#f29d00"; 
            couponMessage.innerHTML = "⚠️ Escribe un código antes de presionar aplicar.";
        } else {
            couponMessage.style.display = "block";
            couponMessage.style.color = "#ff3333"; 
            couponMessage.innerHTML = "❌ El código ingresado no es válido.";
        }
    });
}

// =========================================================
// --- PROCESO DE COMPRA (CONEXIÓN A MAKE.COM MODIFICADA) ---
// =========================================================
const checkoutBtn = document.getElementById('checkoutBtn');

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
        const cantidad = shoppingCart.length;

        if (cantidad === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        const emailInput = document.getElementById('customerEmail').value;
        if (!emailInput || !emailInput.includes('@') || !emailInput.includes('.')) {
            alert("⚠️ Por favor, ingresa un correo electrónico válido para poder enviarte tus campañas.");
            document.getElementById('customerEmail').focus();
            return;
        }

        const cuponInput = document.getElementById('discountCode').value.trim().toUpperCase();
        
        const linksNormales = {
            1: "https://mpago.li/154bvKx",
            2: "https://mpago.li/2W9cRQ2",
            3: "https://mpago.li/2LqtbqC",
            4: "https://mpago.li/2Kd1pVT",
            5: "AQUI_TU_LINK_NORMAL_5",
            6: "AQUI_TU_LINK_NORMAL_6",
            7: "AQUI_TU_LINK_NORMAL_7",
            8: "AQUI_TU_LINK_NORMAL_8",
            9: "AQUI_TU_LINK_NORMAL_9",
            10: "AQUI_TU_LINK_NORMAL_10",
            11: "AQUI_TU_LINK_NORMAL_11",
            12: "AQUI_TU_LINK_NORMAL_12",
            13: "AQUI_TU_LINK_NORMAL_13",
            14: "AQUI_TU_LINK_NORMAL_14",
            15: "AQUI_TU_LINK_NORMAL_15"
        };

        const linksAliados = {
            1: "https://mpago.li/2tBfe21",
            2: "https://mpago.li/2nciCbr",
            3: "https://mpago.li/1awJAts",
            4: "https://mpago.li/25nB5UR",
            5: "AQUI_TU_LINK_ALIADO_5",
            6: "AQUI_TU_LINK_ALIADO_6",
            7: "AQUI_TU_LINK_ALIADO_7",
            8: "AQUI_TU_LINK_ALIADO_8",
            9: "AQUI_TU_LINK_ALIADO_9",
            10: "AQUI_TU_LINK_ALIADO_10",
            11: "AQUI_TU_LINK_ALIADO_11",
            12: "AQUI_TU_LINK_ALIADO_12",
            13: "AQUI_TU_LINK_ALIADO_13",
            14: "AQUI_TU_LINK_ALIADO_14",
            15: "AQUI_TU_LINK_ALIADO_15"
        };

        let linkDePago = "";
        let esPruebaMake = false;

        if (cuponInput === "PRUEBAMAKE") {
            esPruebaMake = true;
        } else if (cuponInput === "IMPACTANDOHOGARES") { 
            linkDePago = linksAliados[cantidad];
        } else if (cuponInput === "") {
            linkDePago = linksNormales[cantidad];
        } else {
            alert("❌ El código de aliado no es válido. Por favor verifícalo o deja la casilla en blanco para continuar.");
            document.getElementById('discountCode').focus();
            return;
        }

        if (!esPruebaMake && !linkDePago) {
            alert("¡Wow! Estás llevando más de 15 campañas. Te redirigiremos a nuestro WhatsApp para darte una atención corporativa personalizada.");
            window.open(`https://wa.me/573000000000?text=Hola,%20quiero%20comprar%20${cantidad}%20campañas%20en%20Impactarco.`, '_blank');
            return;
        }

        checkoutBtn.innerHTML = "Preparando envío seguro... ⏳";
        checkoutBtn.style.backgroundColor = "#009ee3"; 

        // --- MAGIA: EMPAQUETAMOS LOS DATOS Y LAS IMÁGENES LIMPIAS ---
        const orderData = {
            email: emailInput,
            cupon: cuponInput,
            cantidad: cantidad,
            campanas: shoppingCart.map(item => item.cleanImage) // Array con las imágenes sin marca de agua
        };

        // --- ENVIAMOS EL PAQUETE AL ROBOT DE MAKE ---
        fetch("https://hook.us2.make.com/h4tv65qzhjgckc1f25cf01z2sfavb6cd", {
            method: "POST",
            body: JSON.stringify(orderData)
        })
        .then(response => {
            if (esPruebaMake) {
                checkoutBtn.innerHTML = "¡Prueba enviada con éxito! ✅";
                checkoutBtn.style.backgroundColor = "#28a745";
                alert("🚀 ¡Datos enviados a Make! Revisa tu flujo para ver la simulación.");
            } else {
                window.location.href = linkDePago;
            }
        })
        .catch(error => {
            console.error("Error conectando con Make:", error);
            if (esPruebaMake) {
                alert("❌ Hubo un problema al conectar con Make durante la prueba.");
            } else {
                window.location.href = linkDePago;
            }
        });
    });
}