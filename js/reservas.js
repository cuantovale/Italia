document.addEventListener("DOMContentLoaded", () => {
  // Inicializar Flatpickr para el campo de fecha
  flatpickr("#event-date", {
    locale: "es",
    dateFormat: "d/m/Y",
    minDate: "today",
    disableMobile: "true", // Usar el calendario de flatpickr en móviles
    "disable": [
        function(date) {
            // Deshabilitar Domingos (0)
            return (date.getDay() === 0);
        }
    ]
  });

  // Elementos del formulario
  const form = document.getElementById("reserva-form");
  const eventTimeSelect = document.getElementById("event-time");
  const specificTimeGroup = document.getElementById("specific-time-group");
  const specificTimeInput = document.getElementById("specific-time");
  const eventReasonSelect = document.getElementById("event-reason");

  // Inicializar Flatpickr para el campo de hora (se configurará al cambiar la franja)
  let timePicker = null;

  // Lógica para mostrar/ocultar campo de hora específica
  eventTimeSelect.addEventListener("change", (e) => {
    const selectedValue = e.target.value;
    if (selectedValue.includes("Mañana")) {
      specificTimeGroup.classList.remove("hidden");
      timePicker = flatpickr("#specific-time", {
        enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true,
        minTime: "07:00", maxTime: "12:30", minuteIncrement: 15,
        disableMobile: "true"
      });
    } else if (selectedValue.includes("Tarde")) {
      specificTimeGroup.classList.remove("hidden");
      timePicker = flatpickr("#specific-time", {
        enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true,
        minTime: "17:00", maxTime: "21:00", minuteIncrement: 15,
        disableMobile: "true"
      });
    } else {
      specificTimeGroup.classList.add("hidden");
      if (timePicker) {
        timePicker.destroy();
        timePicker = null;
      }
    }
  });
  
  const showError = (input, message) => {
    const formGroup = input.parentElement;
    const error = formGroup.querySelector(".error-message");
    input.classList.add("is-invalid");
    error.textContent = message;
  };

  const hideError = (input) => {
    const formGroup = input.parentElement;
    const error = formGroup.querySelector(".error-message");
    input.classList.remove("is-invalid");
    error.textContent = "";
  };

  const validateForm = (isSubmitting = false) => {
    let isValid = true;
    // Seleccionar solo los inputs requeridos que NO están en un contenedor oculto
    const requiredInputs = form.querySelectorAll("input[required]:not(.hidden input), select[required]:not(.hidden select)");
    
    if (isSubmitting) {
        form.querySelectorAll("input[required], select[required]").forEach(hideError);
    }
    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        showError(input, "Este campo es obligatorio.");
        isValid = false;
      } else {
        hideError(input);
      }
    });
    return isValid;
  };

  form.querySelectorAll("input[required], select[required]").forEach(input => {
    input.addEventListener("input", () => {
      if (input.value.trim()) {
        hideError(input);
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateForm(true)) {
      return;
    }

    // Recopilar datos del formulario
    const name = document.getElementById("customer-name").value;
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const specificTime = specificTimeInput.value;
    const people = document.getElementById("people-count").value;
    const reason = document.getElementById("event-reason").value;
    const cakeOrder = document.getElementById("cake-order").value;

    // Construir el mensaje de WhatsApp
    let message = `¡Hola! Quisiera consultar por una reserva para el salón de eventos:\n\n`;
    message += `*Nombre:* ${name}\n`;
    message += `*Fecha:* ${date}\n`;
    message += `*Horario:* ${time}\n`;
    message += `*Cantidad de personas (aprox):* ${people}\n`;
    message += `*Motivo:* ${reason}\n`;

    if (cakeOrder.trim()) {
      message += `*Pedido especial:* ${cakeOrder}\n`;
    }

    message += `\nQuedo a la espera de su confirmación. ¡Muchas gracias!`;
    const whatsappNumber = "5493624688355";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  });
});