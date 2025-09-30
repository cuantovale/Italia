document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const productSearch = document.getElementById('product-search');
    const productListContainer = document.getElementById('product-list');
    const outputDataTextarea = document.getElementById('output-data');
    const cropperModal = document.getElementById('image-crop-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const confirmCropBtn = document.getElementById('crop-confirm-btn');
    const cancelCropBtn = document.getElementById('crop-cancel-btn');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    let productToUpdate = null; // Guardará el producto al que se le asignará la imagen
    let currentMenuData = JSON.parse(JSON.stringify(MENU_DATA)); // Deep copy
    let cropper = null;
    let originalFile = null;

    function renderProductList(filter = '') {
        productListContainer.innerHTML = '';
        const normalizedFilter = filter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        currentMenuData.forEach(category => {
            category.productos.forEach(product => {
                const productNameNormalized = product.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (filter && !productNameNormalized.includes(normalizedFilter)) {
                    return;
                }

                const listItem = document.createElement('div');
                listItem.className = 'product-list-item';
                listItem.dataset.productName = product.nombre;
                listItem.dataset.categoryName = category.categoria;

                if (product.img !== 'images/productos/default.svg') {
                    listItem.classList.add('assigned');
                }

                const buttonText = product.img === 'images/productos/default.svg' ? 'Asignar Imagen' : 'Editar Foto';
                const imgSrc = product.img;

                listItem.innerHTML = `
                    <div class="product-list-img-container">
                        <img src="${imgSrc}" alt="Imagen de ${product.nombre}" class="product-list-img">
                    </div>
                    <div class="product-list-info">
                        <div class="name">${product.nombre}</div>
                        <div class="category">${category.categoria}</div>
                    </div>
                    <button class="assign-btn">${buttonText}</button>
                `;

                productListContainer.appendChild(listItem);
            });
        });

        document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const listItem = event.target.closest('.product-list-item');
                productToUpdate = {
                    productName: listItem.dataset.productName,
                    categoryName: listItem.dataset.categoryName,
                    element: listItem
                };
                imageInput.click(); // Abre el selector de archivos
            });
        });

        document.querySelectorAll('.product-list-img').forEach(img => {
            img.addEventListener('click', (event) => {
                const src = event.target.src;
                lightboxImg.src = src;
                lightbox.classList.remove('hidden');
            });
        });
    }

    function updateOutputData() {
        const outputString = `const MENU_DATA = ${JSON.stringify(currentMenuData, null, 2)};`;
        outputDataTextarea.value = outputString;
    }

    function showCropper(file) {
        originalFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.src = e.target.result;
            cropperModal.style.display = 'flex';
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1 / 1,
                viewMode: 1,
                dragMode: 'move',
                background: false,
                autoCropArea: 0.8,
            });
        };
        reader.readAsDataURL(file);
    }

    function hideCropper() {
        cropperModal.style.display = 'none';
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        imageInput.value = ''; // Reset input
    }

    confirmCropBtn.addEventListener('click', () => {
        if (cropper && productToUpdate && originalFile) {
            // Nota: El recorte genera una nueva imagen. El flujo actual asume que el archivo ya existe en el servidor.
            // Para que esto funcione, deberás guardar la imagen recortada con el mismo nombre que el archivo original.
            // Cropper.js no puede guardar archivos en tu servidor, pero puedes descargar la imagen recortada.
            const canvas = cropper.getCroppedCanvas({
                width: 512, // Definimos una resolución estándar
                height: 512,
                imageSmoothingQuality: 'high',
            });

            // Para simplificar, actualizaremos la UI con la imagen recortada (como DataURL)
            // y mantendremos el nombre del archivo original en los datos.
            const croppedImageDataUrl = canvas.toDataURL(originalFile.type);
            const imagePath = `images/productos/${originalFile.name}`;

            // Actualizar el modelo de datos
            const category = currentMenuData.find(cat => cat.categoria === productToUpdate.categoryName);
            const product = category.productos.find(prod => prod.nombre === productToUpdate.productName);
            if (product) {
                product.img = imagePath;
            }

            // Actualizar la UI
            productToUpdate.element.classList.add('assigned');
            const imgElement = productToUpdate.element.querySelector('.product-list-img');
            if (imgElement) {
                imgElement.src = croppedImageDataUrl; // Mostramos la vista previa recortada
            }
            productToUpdate.element.querySelector('.assign-btn').textContent = 'Editar Foto';
            updateOutputData();

            alert(`Imagen asignada. Recuerda subir el archivo "${originalFile.name}" (ya recortado si es necesario) a la carpeta images/productos/ para que se vea en el menú final.`);

            hideCropper();
            productToUpdate = null;
        }
    });

    cancelCropBtn.addEventListener('click', hideCropper);

    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && productToUpdate) {
            showCropper(file);
        }
    });

    productSearch.addEventListener('input', () => {
        renderProductList(productSearch.value);
    });

    // Lightbox close events
    lightboxClose.addEventListener('click', () => lightbox.classList.add('hidden'));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.add('hidden');
    });

    // Initial render
    renderProductList();
    updateOutputData();
});