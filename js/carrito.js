document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.getElementById("cart-items-container");
  const cartTotalElement = document.getElementById("cart-total");
  const checkoutForm = document.getElementById("checkout-form");
  const addressFields = document.getElementById("address-fields");
  const pickupFields = document.getElementById("pickup-fields");
  const emptyCartMessage = document.getElementById("empty-cart-message");
  const cartSummary = document.getElementById("cart-summary");
  const deliveryTimeNotice = document.getElementById("delivery-time-notice");
  const deliveryOptionsContainer = document.querySelector(".delivery-options-container");
  const closedStoreOverlay = document.getElementById("closed-store-overlay");
  const deliverySlider = document.querySelector(".delivery-slider");
  const deliveryNoticeContainer = document.getElementById("delivery-notice-container");
  const deliveryButtons = document.querySelectorAll(".delivery-option-btn");

  const STORE_SCHEDULE = {
    0: null,
    1: [{ open: "07:00", close: "12:00" }, { open: "17:00", close: "21:00" }],
    2: [{ open: "07:00", close: "12:00" }, { open: "17:00", close: "21:00" }],
    3: [{ open: "07:00", close: "12:00" }, { open: "17:00", close: "21:00" }],
    4: [{ open: "07:00", close: "12:00" }, { open: "17:00", close: "21:00" }],
    5: [{ open: "07:00", close: "12:00" }, { open: "17:00", close: "21:00" }],
    6: [{ open: "09:00", close: "12:00" }, { open: "17:00", close: "21:00" }],
  };

  function isStoreOpen() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    const todaysSchedule = STORE_SCHEDULE[dayOfWeek];
    if (!todaysSchedule) return false;
    return todaysSchedule.some(slot => currentTime >= slot.open && currentTime < slot.close);
  }

  function formatPrice(num) {
    if (num === null || num === undefined) return "";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(num);
  }

  function getCart() {
    return JSON.parse(localStorage.getItem("italiaCafeCart")) || [];
  }

  function saveCart(cart) {
    localStorage.setItem("italiaCafeCart", JSON.stringify(cart));
    renderCart();
    if (window.updateCartUI) {
      window.updateCartUI();
    }
  }

  function addItemToCart(product) {
    const cart = getCart();
    cart.push(product);
    saveCart(cart);
  }

  function removeOneItemFromCart(productName) {
    const cart = getCart();
    const indexToRemove = cart.findIndex(item => item.nombre === productName);
    if (indexToRemove > -1) {
      cart.splice(indexToRemove, 1);
      saveCart(cart);
    }
  }

  function removeAllItemsByName(productName) {
    let cart = getCart();
    cart = cart.filter(item => item.nombre !== productName);
    saveCart(cart);
  }

  function checkDeliveryAvailability() {
    const deliveryOptionEl = document.querySelector('.delivery-option-btn[data-value="delivery"]');
    if (!deliveryOptionEl) return;

    const schedule = {
      0: null,
      1: [{ open: 7, close: 12.5 }, { open: 17, close: 21 }],
      6: [{ open: 9.25, close: 12.5 }, { open: 17, close: 21 }],
    };

    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));

    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 60;

    const todaysSchedule = schedule[dayOfWeek] || schedule[1];

    let isOpen = false;
    if (todaysSchedule) {
      for (const slot of todaysSchedule) {
        if (currentTime >= slot.open && currentTime < slot.close) {
          isOpen = true;
          break;
        }
      }
    }

    const isDeliveryTime = currentTime >= 7.5 && currentTime < 9.5;

    if (isOpen) {
      deliveryOptionEl.disabled = false;
      deliveryOptionEl.textContent = "Envío";
      deliveryTimeNotice.innerHTML = isDeliveryTime
        ? '<i class="fas fa-check-circle" style="color: var(--color-price);"></i> Envío gratis disponible ahora (de 7:30 a 9:30 hs).'
        : '<i class="fas fa-info-circle"></i> Envío gratis de 7:30 a 9:30 hs. Fuera de dicho horario, se aplicará costo de envío.';
    } else {
      deliveryOptionEl.disabled = true;
      deliveryOptionEl.textContent = "Envío (No disp.)";
      deliveryTimeNotice.innerHTML = '<i class="fas fa-times-circle"></i> Los envíos no están disponibles en este momento.';
    }
  }

  function checkExecutiveBreakfastInCart() {
    const cart = getCart();
    const hasExecutiveBreakfast = cart.some(item => item.categoria === "Desayuno Ejecutivo");

    if (hasExecutiveBreakfast) {
      const pickupButton = document.querySelector('.delivery-option-btn[data-value="pickup"]');
      const deliveryButton = document.querySelector('.delivery-option-btn[data-value="delivery"]');

      if (pickupButton) pickupButton.disabled = true;
      if (deliveryButton) {
        deliveryButton.click();
        deliveryButton.classList.add('active');
        pickupButton.classList.remove('active');
      }
      if (deliveryNoticeContainer) {
        const notice = document.createElement('div');
        notice.className = 'delivery-notice executive-breakfast-notice';
        notice.innerHTML = `<i class="fas fa-info-circle"></i> El Desayuno Ejecutivo solo está disponible para envío a domicilio.`;
        deliveryNoticeContainer.prepend(notice);
      }
    }
  }


  function renderCart() {
    const cart = getCart();
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      emptyCartMessage.classList.remove("hidden");
      cartSummary.classList.add("hidden");
      return;
    }

    emptyCartMessage.classList.add("hidden");
    cartSummary.classList.remove("hidden");

    const groupedCart = cart.reduce((acc, item) => {
      if (!acc[item.nombre]) {
        acc[item.nombre] = { ...item, quantity: 0 };
      }
      acc[item.nombre].quantity++;
      return acc;
    }, {});

    let total = 0;

    Object.values(groupedCart).forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "cart-item";
      itemElement.innerHTML = `
        <img src="${item.img}" alt="${item.nombre}" class="cart-item-img" loading="lazy" draggable="false" oncontextmenu="return false;">
        <div class="cart-item-details">
          <div>
            <span class="item-name">${item.nombre}</span>
            ${item.descripcion ? `<p class="cart-item-desc">${item.descripcion}</p>` : ''}
          </div>
        </div>
        <div class="cart-item-actions">
          <div class="item-quantity-controls">
            <button class="quantity-btn decrease-btn" data-name="${item.nombre}">-</button>
            <span class="item-quantity">${item.quantity}</span>
            <button class="quantity-btn increase-btn" data-name="${item.nombre}">+</button>
          </div>
          <span class="item-price">${formatPrice(item.precio * item.quantity)}</span>
          <button class="remove-item-btn" data-name="${item.nombre}">&times;</button>
        </div>
      `;
      cartItemsContainer.appendChild(itemElement);
      total += item.precio * item.quantity;
    });

    cartTotalElement.textContent = `Total: ${formatPrice(total)}`;

    document.querySelectorAll(".remove-item-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const itemName = e.target.dataset.name;
        removeAllItemsByName(itemName);
      });
    });

    document.querySelectorAll(".increase-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const itemName = e.target.dataset.name;
        const cart = getCart();
        const itemToAdd = cart.find(p => p.nombre === itemName);
        if (itemToAdd) {
          addItemToCart(itemToAdd);
        }
      });
    });

    document.querySelectorAll(".decrease-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const itemName = e.target.dataset.name;
        removeOneItemFromCart(itemName);
      });
    });
  }

  let currentDeliveryOption = 'pickup';
  deliveryButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      deliveryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentDeliveryOption = button.dataset.value;
      const isDelivery = currentDeliveryOption === 'delivery';
      
      deliverySlider.style.transform = `translateX(${isDelivery ? '100%' : '0'})`;
      addressFields.classList.toggle('hidden', !isDelivery);
      pickupFields.classList.toggle('hidden', isDelivery);
      document.getElementById("address").required = isDelivery;
    });
  });

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!isStoreOpen()) {
      alert("El local se encuentra cerrado en este momento. No se puede enviar el pedido.");
      location.reload();
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    const name = document.getElementById("customer-name").value;
    const deliveryType = currentDeliveryOption === 'pickup' ? 'Retirar en el local' : 'Envío a domicilio';

    let message = `¡Hola! Quisiera hacer un pedido:\n\n`;
    message += `*Nombre y Apellido:* ${name}\n`;
    message += `*Tipo de entrega:* ${deliveryType}\n`;

    if (currentDeliveryOption === "pickup") {
      const pickupDetails = document.getElementById("pickup-details").value;
      if (pickupDetails) {
        message += `*Aclaraciones de retiro:* ${pickupDetails}\n`;
      }
    }

    if (currentDeliveryOption === "delivery") {
      const address = document.getElementById("address").value;
      const addressDetails = document.getElementById("address-details").value;
      message += `*Dirección:* ${address}\n`;
      if (addressDetails) {
        message += `*Aclaraciones:* ${addressDetails}\n`;
      }
    }

    message += `\n*Pedido:*\n`;

    const groupedCart = cart.reduce((acc, item) => {
      if (!acc[item.nombre]) {
        acc[item.nombre] = { ...item, quantity: 0 };
      }
      acc[item.nombre].quantity++;
      return acc;
    }, {});

    let total = 0;
    Object.values(groupedCart).forEach(item => {
      message += `- ${item.quantity}x ${item.nombre} (${formatPrice(item.precio * item.quantity)})\n`;
      total += item.precio * item.quantity;
    });

    message += `\n*Total:* ${formatPrice(total)}`;

    const whatsappNumber = "5493624688355";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    localStorage.removeItem("italiaCafeCart");

    window.open(whatsappUrl, "_blank");

    alert("¡Gracias por tu pedido! Serás redirigido a WhatsApp para enviarlo.");
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
  });

  renderCart();
  checkDeliveryAvailability();
  checkExecutiveBreakfastInCart();

  if (!isStoreOpen()) {
    if (closedStoreOverlay) closedStoreOverlay.classList.remove("hidden");
    if (cartItemsContainer) cartItemsContainer.classList.add("hidden");
    if (cartSummary) cartSummary.classList.add("hidden");
    if (emptyCartMessage) emptyCartMessage.classList.add("hidden");
    if (deliveryOptionsContainer) deliveryOptionsContainer.parentElement.classList.add("hidden");
  } else {
    if (closedStoreOverlay) closedStoreOverlay.classList.add("hidden");
  }
});
