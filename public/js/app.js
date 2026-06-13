let equipments =
    JSON.parse(localStorage.getItem("equipments")) || [];

function saveEquipment() {

    const name =
        document.getElementById("name").value;

    const category =
        document.getElementById("category").value;

    const quantity =
        Number(document.getElementById("quantity").value);

    const description =
        document.getElementById("description").value;

    const imageFile =
        document.getElementById("imageFile").files[0];

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function (event) {
            addEquipment({
                name,
                category,
                quantity,
                description,
                image: event.target.result
            });
        };
        reader.readAsDataURL(imageFile);
    } else {
        addEquipment({
            name,
            category,
            quantity,
            description,
            image: ''
        });
    }
}

function addEquipment(item) {
    equipments.push(item);

    localStorage.setItem(
        "equipments",
        JSON.stringify(equipments)
    );

    clearAdminForm();
    loadEquipment();
    loadEquipmentTable();
}

function clearAdminForm() {
    document.getElementById("name").value = '';
    document.getElementById("category").value = '';
    document.getElementById("quantity").value = 1;
    document.getElementById("description").value = '';
    document.getElementById("imageFile").value = '';
    const preview = document.getElementById("imagePreview");
    preview.src = '';
    preview.classList.add('d-none');
}

function previewImage(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        const preview = document.getElementById("imagePreview");
        preview.src = event.target.result;
        preview.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
}

function loadEquipmentTable() {

    let html = "";

    equipments.forEach((item, index) => {

        html += `
        <tr>
            <td>${index + 1}</td>
            <td><img src="${item.image || 'https://via.placeholder.com/80x60?text=No+Image'}" width="80" height="60" style="object-fit:cover; border-radius:6px;"></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${item.description || '-'}</td>
        </tr>
        `;

    });

    document.getElementById("equipmentTable")
        .innerHTML = html;

}

if (document.getElementById('equipmentTable')) {
    loadEquipmentTable();
}