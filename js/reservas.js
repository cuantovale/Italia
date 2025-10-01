document.addEventListener('DOMContentLoaded', () => {
    const reservationForm = document.getElementById('reservation-form');
    if (!reservationForm) return;

    const dateInput = document.getElementById('event-date');
    const startTimeInput = document.getElementById('event-time-start');
    const endTimeInput = document.getElementById('event-time-end');

    // Pre-rellenar la fecha mínima para que no se puedan elegir fechas pasadas
    const fp = flatpickr(dateInput, {
        locale: "es",
        dateFormat: "d/m/Y",
        minDate: "today",
        altInput: true, // Muestra un formato amigable pero envía el formato estándar
        altFormat: "j \\de F, Y",
        onChange: function(selectedDates, dateStr, instance) {
            // Cuando la fecha cambia, actualizamos las horas disponibles
            updateStartTimes();
        },
    });

    const generateTimeOptions = (start, end, interval = 30) => {
        let options = '';
        let [startHour, startMinute] = start.split(':').map(Number);
        let [endHour, endMinute] = end.split(':').map(Number);

        let currentTime = new Date();
        currentTime.setHours(startHour, startMinute, 0, 0);

        let endTime = new Date();
        endTime.setHours(endHour, endMinute, 0, 0);

        while (currentTime <= endTime) {
            const timeString = currentTime.toTimeString().substring(0, 5);
            options += `<option value="${timeString}">${timeString}</option>`;
            currentTime.setMinutes(currentTime.getMinutes() + interval);
        }
        return options;
    };

    function updateStartTimes() {
        const selectedDates = fp.selectedDates;
        if (selectedDates.length === 0) return;
        const selectedDate = selectedDates[0];
        const dayOfWeek = selectedDate.getDay(); // 0=Domingo, 6=Sábado

        const morningStart = (dayOfWeek === 6) ? '09:00' : '07:00';
        const morningOptions = generateTimeOptions(morningStart, '12:30');
        const afternoonOptions = generateTimeOptions('17:00', '21:00');

        startTimeInput.innerHTML = `
            <optgroup label="Mañana">${morningOptions}</optgroup>
            <optgroup label="Tarde">${afternoonOptions}</optgroup>
        `;
        updateEndTimes();
    }

    function updateEndTimes() {
        const selectedStartTime = startTimeInput.value;
        if (!selectedStartTime) {
            endTimeInput.innerHTML = '<option>Selecciona una hora de inicio</option>';
            return;
        }

        const isInMorning = selectedStartTime < '13:00';
        const endRange = isInMorning ? '12:30' : '21:00';

        let [startHour, startMinute] = selectedStartTime.split(':').map(Number);
        let nextTime = new Date();
        nextTime.setHours(startHour, startMinute + 30, 0, 0);
        const nextTimeString = nextTime.toTimeString().substring(0, 5);

        endTimeInput.innerHTML = generateTimeOptions(nextTimeString, endRange);
    }

    dateInput.addEventListener('change', updateStartTimes);
    startTimeInput.addEventListener('change', updateEndTimes);
    // Inicializar los horarios al cargar la página
    // No es necesario, flatpickr lo maneja con onChange

    reservationForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // --- VALIDACIÓN PERSONALIZADA ---
        const fieldsToValidate = [
            { id: 'customer-name', message: 'Por favor, ingresa tu nombre.' },
            { id: 'customer-phone', message: 'Por favor, ingresa tu teléfono.' },
            { id: 'event-type', message: 'Por favor, selecciona un tipo de evento.' },
            { id: 'event-date', message: 'Por favor, selecciona una fecha.' },
            { id: 'guest-count', message: 'Por favor, indica la cantidad de personas.' },
            { id: 'event-time-start', message: 'Por favor, selecciona una hora de inicio.', checkDefault: true },
            { id: 'event-time-end', message: 'Por favor, selecciona una hora de finalización.', checkDefault: true }
        ];

        // Limpiar errores al interactuar con el campo
        fieldsToValidate.forEach(field => {
            const input = document.getElementById(field.id);
            const eventType = input.tagName.toLowerCase() === 'select' ? 'change' : 'input';
            input.addEventListener(eventType, () => {
                input.classList.remove('is-invalid');
                const errorContainer = input.nextElementSibling;
                if (errorContainer && errorContainer.classList.contains('error-message')) {
                    errorContainer.textContent = '';
                }
            });
        });

        let isFormValid = true;

        // Limpiar errores previos
        fieldsToValidate.forEach(field => {
            const input = document.getElementById(field.id);
            const errorContainer = input.nextElementSibling;
            input.classList.remove('is-invalid');
            if (errorContainer && errorContainer.classList.contains('error-message')) {
                errorContainer.textContent = '';
            }
        });

        for (const field of fieldsToValidate) {
            const input = document.getElementById(field.id);
            const value = input.value.trim();
            const isDefaultOption = field.checkDefault && (input.options.length > 0 && input.options[0].textContent.includes('Selecciona'));

            if (!value || value === '' || isDefaultOption) {
                isFormValid = false;
                const errorContainer = input.nextElementSibling;
                input.classList.add('is-invalid');
                if (errorContainer && errorContainer.classList.contains('error-message')) {
                    errorContainer.textContent = field.message;
                }
            }
        }

        if (!isFormValid) return;
        // --- FIN DE LA VALIDACIÓN ---

        const name = document.getElementById('customer-name').value;
        const phone = document.getElementById('customer-phone').value;
        const eventType = document.getElementById('event-type').value;
        const eventDate = document.getElementById('event-date').value;
        const startTime = document.getElementById('event-time-start').value;
        const endTime = document.getElementById('event-time-end').value;
        const guests = document.getElementById('guest-count').value;
        const comments = document.getElementById('additional-comments').value;

        // La fecha ya viene en formato dd/mm/yyyy del input
        const formattedDate = eventDate;

        let message = `¡Hola Italia Café! 👋\nQuisiera consultar por una reserva para el salón de eventos:\n\n`;
        message += `*Nombre:* ${name}\n`;
        message += `*Teléfono:* ${phone}\n`;
        message += `*Tipo de Evento:* ${eventType}\n`;
        message += `*Fecha:* ${formattedDate}\n`;
        message += `*Horario:* de ${startTime} a ${endTime} hs\n`;
        message += `*Cantidad de Personas:* ${guests}\n`;

        if (comments) {
            message += `*Consulta Adicional:* ${comments}\n`;
        }

        message += `\nAguardo su confirmación. ¡Gracias!`;

        const whatsappNumber = "5493624688355";
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");
    });

    // Inicialización de Lenis para scroll suave
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
});