document.addEventListener('DOMContentLoaded', () => {
    // Secciones
    const loginSection = document.getElementById('cashier-login-section');
    const panelSection = document.getElementById('cashier-panel-section');

    // Elementos del Panel
    const dniInput = document.getElementById('scanned-dni');
    const addStampBtn = document.getElementById('add-stamp-btn');
    const redeemCoffeeBtn = document.getElementById('redeem-coffee-btn');
    const errorMessage = document.getElementById('cashier-error-message');
    const successMessage = document.getElementById('cashier-success-message');
    const resetDataBtn = document.getElementById('reset-data-btn');
    const logoutBtn = document.getElementById('cashier-logout-btn');

    // Elementos del Login
    const loginForm = document.getElementById('cashier-login-form');
    const userLoginInput = document.getElementById('cashier-user');
    const passLoginInput = document.getElementById('cashier-password');
    const loginError = document.getElementById('cashier-login-error');

    // Credenciales (para simulación)
    const CASHIER_USER = 'cajero';
    const CASHIER_PASS = '1234';

    const MAX_STAMPS = 6;

    const getCustomers = () => {
        return JSON.parse(localStorage.getItem('loyaltyCustomers')) || {};
    };

    const isCashierLoggedIn = () => {
        return localStorage.getItem('cashierSession') === 'true';
    };

    const setCashierLoggedIn = (status) => {
        if (status) localStorage.setItem('cashierSession', 'true');
        else localStorage.removeItem('cashierSession');
    };

    const saveCustomers = (customers) => {
        localStorage.setItem('loyaltyCustomers', JSON.stringify(customers));
    };

    const showMessage = (element, message, isError = false) => {
        element.textContent = message;
        element.classList.toggle('error-message', isError);
        element.classList.toggle('success-message', !isError);
        setTimeout(() => {
            element.textContent = '';
        }, 3000);
    };

    const showLogin = () => {
        loginSection.classList.remove('hidden');
        panelSection.classList.add('hidden');
    };

    const showPanel = () => {
        loginSection.classList.add('hidden');
        panelSection.classList.remove('hidden');

        // Leer DNI de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const dniFromUrl = urlParams.get('dni');
        if (dniFromUrl) {
            dniInput.value = dniFromUrl;
            showMessage(successMessage, `Cliente ${dniFromUrl} cargado.`);
        } else {
            showMessage(errorMessage, 'No se especificó un cliente. Escanea un QR.', true);
        }
    };

    // --- MANEJO DE EVENTOS ---

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (userLoginInput.value.trim() === CASHIER_USER && passLoginInput.value.trim() === CASHIER_PASS) {
            setCashierLoggedIn(true);
            showPanel();
        } else {
            loginError.textContent = 'Usuario o PIN incorrecto.';
        }
    });

    logoutBtn.addEventListener('click', () => {
        setCashierLoggedIn(false);
        showLogin();
    });

    addStampBtn.addEventListener('click', () => {
        const dni = dniInput.value.trim();
        if (!dni) {
            showMessage(errorMessage, 'No hay un DNI de cliente cargado.', true);
            return;
        }

        const customers = getCustomers();
        if (!customers[dni]) {
            showMessage(errorMessage, 'Cliente no encontrado. Verifica el DNI.', true);
            return;
        }

        let currentStamps = customers[dni].stamps;

        if (currentStamps >= MAX_STAMPS - 1) {
            showMessage(errorMessage, `El cliente ya tiene ${currentStamps} sellos. Debe canjear su café gratis.`, true);
            return;
        }

        customers[dni].stamps++;
        saveCustomers(customers);
        showMessage(successMessage, `Sello añadido. El cliente ahora tiene ${customers[dni].stamps} sello(s).`);
        // Deshabilitar botones para evitar doble acción
        addStampBtn.disabled = true;
    });

    redeemCoffeeBtn.addEventListener('click', () => {
        const dni = dniInput.value.trim();
        if (!dni) {
            showMessage(errorMessage, 'No hay un DNI de cliente cargado.', true);
            return;
        }

        const customers = getCustomers();
        if (!customers[dni]) {
            showMessage(errorMessage, 'Cliente no encontrado. Verifica el DNI.', true);
            return;
        }

        let currentStamps = customers[dni].stamps;

        if (currentStamps < MAX_STAMPS - 1) {
            showMessage(errorMessage, `El cliente solo tiene ${currentStamps} sello(s). Aún no puede canjear.`, true);
            return;
        }

        // Reiniciar sellos a 0
        customers[dni].stamps = 0;
        saveCustomers(customers);
        showMessage(successMessage, '¡Café canjeado! Los sellos del cliente se han reiniciado a 0.');
        // Deshabilitar botones para evitar doble acción
        redeemCoffeeBtn.disabled = true;
    });

    // --- ACCIÓN DE ADMINISTRADOR: RESETEAR DATOS ---
    resetDataBtn.addEventListener('click', () => {
        const confirmation = prompt("¡Atención! Esto borrará TODOS los datos de clientes de fidelización. Esta acción no se puede deshacer.\n\nEscribe 'BORRAR' para confirmar.");
        if (confirmation === 'BORRAR') {
            localStorage.removeItem('loyaltyCustomers');
            localStorage.removeItem('currentLoyaltyDNI');
            showMessage(successMessage, 'Todos los datos de clientes han sido eliminados.');
            alert('Datos reseteados. La página de clientes se recargará.');
        }
    });

    // --- INICIALIZACIÓN ---
    if (isCashierLoggedIn()) {
        showPanel();
    } else {
        showLogin();
    }
});