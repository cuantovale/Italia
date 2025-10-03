document.addEventListener('DOMContentLoaded', () => {
    // Secciones principales
    const loginSection = document.getElementById('login-section');
    const registrationSection = document.getElementById('registration-section');
    const loyaltyCardSection = document.getElementById('loyalty-card-section');

    // Formularios y elementos
    const loginForm = document.getElementById('login-form');
    const registrationForm = document.getElementById('registration-form');
    const welcomeMessage = document.getElementById('welcome-message');
    const qrcodeContainer = document.getElementById('qrcode');
    const stampsGrid = document.getElementById('stamps-grid');
    const freeCoffeeAlert = document.getElementById('free-coffee-alert');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Links para cambiar de formulario
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    const MAX_STAMPS = 6;

    // Función para obtener los datos de los clientes desde localStorage
    const getCustomers = () => {
        return JSON.parse(localStorage.getItem('loyaltyCustomers')) || {};
    };

    // Función para guardar los datos de los clientes
    const saveCustomers = (customers) => {
        localStorage.setItem('loyaltyCustomers', JSON.stringify(customers));
    };

    // Función para renderizar los sellos
    const renderStamps = (count) => {
        stampsGrid.innerHTML = '';
        for (let i = 1; i <= MAX_STAMPS; i++) {
            const stamp = document.createElement('div');
            stamp.classList.add('stamp');
            if (i <= count) {
                stamp.classList.add('stamped');
                stamp.innerHTML = `<i class="fas fa-mug-hot"></i>`;
            } else {
                stamp.innerHTML = `<span>${i}</span>`;
            }
            stampsGrid.appendChild(stamp);
        }

        // Mostrar alerta de café gratis si tiene 5 sellos
        if (count === MAX_STAMPS - 1) {
            freeCoffeeAlert.classList.remove('hidden');
        } else {
            freeCoffeeAlert.classList.add('hidden');
        }
    };

    // Función para mostrar la tarjeta de fidelidad
    const showLoyaltyCard = (dni) => {
        const customers = getCustomers();
        const customer = customers[dni];

        if (!customer) {
            showLogin(); // Si por alguna razón no existe el cliente, vuelve al login
            return;
        }

        welcomeMessage.textContent = `¡Hola! Tu DNI es ${dni}`;
        
        // Limpiar QR anterior y generar uno nuevo con la URL del sitio web de producción
        const baseUrl = 'https://italiacafe.com.ar';
        const cashierUrl = `${baseUrl}/cajero.html?dni=${dni}`;

        qrcodeContainer.innerHTML = '';
        new QRCode(qrcodeContainer, {
            text: cashierUrl,
            width: 180,
            height: 180,
            colorDark: "#304d3a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        renderStamps(customer.stamps);

        loginSection.classList.add('hidden');
        registrationSection.classList.add('hidden');
        loyaltyCardSection.classList.remove('hidden');
    };

    // Funciones para mostrar/ocultar formularios
    const showLogin = () => {
        loginSection.classList.remove('hidden');
        registrationSection.classList.add('hidden');
        loyaltyCardSection.classList.add('hidden');
    };

    const showRegistration = () => {
        loginSection.classList.add('hidden');
        registrationSection.classList.remove('hidden');
        loyaltyCardSection.classList.add('hidden');
    };

    // Listeners para cambiar entre login y registro
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegistration();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });

    // Manejar el envío del formulario de registro
    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Obtener elementos específicos del formulario de registro
        const dniInput = document.getElementById('register-dni');
        const passwordInput = document.getElementById('register-password');
        const errorMessage = document.getElementById('register-error-message');

        const dni = dniInput.value.trim();
        const password = passwordInput.value.trim();

        if (!/^\d{7,8}$/.test(dni)) {
            errorMessage.textContent = 'Por favor, ingresa un DNI válido (7 u 8 dígitos).';
            return;
        }
        if (!/^\d{4}$/.test(password)) {
            errorMessage.textContent = 'El PIN debe tener exactamente 4 dígitos.';
            return;
        }
        errorMessage.textContent = '';

        const customers = getCustomers();
        if (customers[dni]) {
            errorMessage.textContent = 'Este DNI ya está registrado. Intenta iniciar sesión.';
            return;
        }

        customers[dni] = { password: password, stamps: 0 };
        saveCustomers(customers);
        
        // Después de registrar, llevar al login para que inicie sesión
        alert('¡Registro exitoso! Ahora inicia sesión con tu DNI y tu nuevo PIN.');
        showLogin();
    });

    // Manejar el envío del formulario de inicio de sesión
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Obtener elementos específicos del formulario de inicio de sesión
        const dniInput = document.getElementById('login-dni');
        const passwordInput = document.getElementById('login-password');
        const errorMessage = document.getElementById('login-error-message');
        const dni = dniInput.value.trim();
        const password = passwordInput.value.trim();

        const customers = getCustomers();
        const customer = customers[dni];

        if (!customer || customer.password !== password) {
            errorMessage.textContent = 'DNI o PIN incorrecto. Por favor, verifica tus datos.';
            return;
        }

        errorMessage.textContent = '';
        localStorage.setItem('currentLoyaltyDNI', dni);
        showLoyaltyCard(dni);
    });

    // Manejar el botón de salir
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentLoyaltyDNI');
        // Limpiar campos de los formularios al salir
        document.getElementById('login-dni').value = '';
        document.getElementById('login-password').value = '';
        showLogin();
    });

    // Al cargar la página, verificar si ya hay un usuario logueado
    const loggedInDNI = localStorage.getItem('currentLoyaltyDNI');
    if (loggedInDNI) {
        showLoyaltyCard(loggedInDNI);
    } else {
        showLogin();
    }

    // Actualizar la vista si los datos cambian en otra pestaña (ej. el cajero)
    window.addEventListener('storage', (event) => {
        if (event.key === 'loyaltyCustomers' || event.key === 'currentLoyaltyDNI') {
            const currentDNI = localStorage.getItem('currentLoyaltyDNI');
            if (currentDNI) {
                showLoyaltyCard(currentDNI);
            }
        }
    });
});