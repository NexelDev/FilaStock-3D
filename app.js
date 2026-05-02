let data = JSON.parse(localStorage.getItem('filaStockData')) || { drawers: [] };
let currentDrawerIndex = null;

function saveData() {
    localStorage.setItem('filaStockData', JSON.stringify(data));
}

function renderDrawerList() {
    const list = document.getElementById('drawer-list');
    list.innerHTML = '';
    data.drawers.forEach((drawer, index) => {
        const li = document.createElement('li');
        li.textContent = drawer.name;
        if (index === currentDrawerIndex) li.classList.add('active');
        li.onclick = () => openDrawer(index);
        list.appendChild(li);
    });
}

function openDrawer(index) {
    if (index === null || !data.drawers[index]) {
        document.getElementById('drawer-header').classList.add('hidden');
        document.getElementById('drawer-grid').innerHTML = '';
        document.getElementById('current-drawer-title').textContent = "Sélectionnez un tiroir";
        return;
    }
    
    currentDrawerIndex = index;
    renderDrawerList();
    const drawer = data.drawers[index];
    
    document.getElementById('drawer-header').classList.remove('hidden');
    document.getElementById('current-drawer-title').textContent = drawer.name;
    
    const grid = document.getElementById('drawer-grid');
    grid.style.gridTemplateColumns = `repeat(${drawer.width}, auto)`;
    grid.innerHTML = '';

    for (let y = 0; y < drawer.height; y++) {
        for (let x = 0; x < drawer.width; x++) {
            const slotData = drawer.slots[`${x}-${y}`];
            const slotEl = document.createElement('div');
            slotEl.className = 'slot';
            
            if (drawer.orientation === 'vertical') slotEl.classList.add('vertical');
            
            if (slotData) {
                slotEl.classList.add('filled');
                slotEl.style.backgroundColor = slotData.color;
                
                const hex = slotData.color.replace('#', '');
                const brightness = (parseInt(hex.substr(0,2),16)*299 + parseInt(hex.substr(2,2),16)*587 + parseInt(hex.substr(4,2),16)*114) / 1000;
                slotEl.style.color = brightness > 125 ? '#2c3e50' : 'white';

                slotEl.innerHTML = `
                    <span class="slot-material">${slotData.material}</span>
                    <span class="slot-range">${slotData.range || ''}</span>
                    <span class="slot-brand">${slotData.brand || ''}</span>
                    ${slotData.rfid ? '<span class="slot-rfid">RFID</span>' : ''}
                `;
            } else {
                // L'AJOUT EST ICI : On affiche "VIDE" avec la classe CSS
                slotEl.innerHTML = `<span class="slot-empty">Vide</span>`;
            }
            
            slotEl.onclick = () => openFilamentModal(x, y);
            grid.appendChild(slotEl);
        }
    }
}

function toggleCustomMaterial() {
    const select = document.getElementById('fil-material');
    const customInput = document.getElementById('fil-custom-material');
    if (select.value === 'Autre') {
        customInput.classList.remove('hidden');
        customInput.focus();
    } else {
        customInput.classList.add('hidden');
    }
}

function openFilamentModal(x, y) {
    document.getElementById('slot-x').value = x;
    document.getElementById('slot-y').value = y;
    const slotData = data.drawers[currentDrawerIndex].slots[`${x}-${y}`];
    
    const standardMaterials = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA'];
    const select = document.getElementById('fil-material');
    const customInput = document.getElementById('fil-custom-material');

    const colorVal = slotData?.color || '#3498db';
    document.getElementById('fil-color').value = colorVal;
    document.getElementById('color-preview').style.backgroundColor = colorVal;
    document.getElementById('color-hex-display').textContent = colorVal.toUpperCase();

    if (slotData) {
        if (standardMaterials.includes(slotData.material)) {
            select.value = slotData.material;
            customInput.classList.add('hidden');
        } else {
            select.value = 'Autre';
            customInput.value = slotData.material;
            customInput.classList.remove('hidden');
        }
        document.getElementById('fil-range').value = slotData.range || '';
        document.getElementById('fil-brand').value = slotData.brand || '';
        document.getElementById('fil-rfid').checked = slotData.rfid || false;
    } else {
        select.value = 'PLA';
        customInput.value = '';
        customInput.classList.add('hidden');
        document.getElementById('fil-range').value = '';
        document.getElementById('fil-brand').value = '';
        document.getElementById('fil-rfid').checked = false;
    }
    document.getElementById('modal-filament').classList.remove('hidden');
}

document.getElementById('fil-color').addEventListener('input', function() {
    document.getElementById('color-preview').style.backgroundColor = this.value;
    document.getElementById('color-hex-display').textContent = this.value.toUpperCase();
});

document.getElementById('btn-save-filament').onclick = () => {
    const x = document.getElementById('slot-x').value;
    const y = document.getElementById('slot-y').value;
    const matSelect = document.getElementById('fil-material').value;
    const material = (matSelect === 'Autre') ? document.getElementById('fil-custom-material').value : matSelect;

    data.drawers[currentDrawerIndex].slots[`${x}-${y}`] = {
        material: material || '?',
        range: document.getElementById('fil-range').value,
        brand: document.getElementById('fil-brand').value,
        color: document.getElementById('fil-color').value,
        rfid: document.getElementById('fil-rfid').checked
    };
    saveData(); closeModals(); openDrawer(currentDrawerIndex);
};

document.getElementById('btn-delete-drawer').onclick = () => {
    if (confirm(`Supprimer définitivement le tiroir "${data.drawers[currentDrawerIndex].name}" ?`)) {
        data.drawers.splice(currentDrawerIndex, 1);
        currentDrawerIndex = data.drawers.length > 0 ? 0 : null;
        saveData(); openDrawer(currentDrawerIndex);
    }
};

document.getElementById('btn-save-drawer').onclick = () => {
    const name = document.getElementById('drawer-name').value;
    const width = parseInt(document.getElementById('drawer-width').value);
    const height = parseInt(document.getElementById('drawer-height').value);
    const orientation = document.getElementById('drawer-orientation-global').value;
    
    if (name && width > 0 && height > 0) {
        data.drawers.push({ name, width, height, orientation, slots: {} });
        saveData(); closeModals();
        openDrawer(data.drawers.length - 1);
    }
};

function closeModals() { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); }
document.getElementById('btn-new-drawer').onclick = () => document.getElementById('modal-drawer').classList.remove('hidden');
document.getElementById('btn-delete-filament').onclick = () => {
    delete data.drawers[currentDrawerIndex].slots[`${document.getElementById('slot-x').value}-${document.getElementById('slot-y').value}`];
    saveData(); closeModals(); openDrawer(currentDrawerIndex);
};

function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `filastock_export.json`;
    a.click();
}

function importJSON(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            data = JSON.parse(e.target.result);
            saveData(); location.reload();
        } catch(err) { alert("Erreur fichier"); }
    };
    reader.readAsText(input.files[0]);
}

// Initialisation de la PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('Service Worker non enregistré', err));
}

if (data.drawers.length > 0) openDrawer(0);
else renderDrawerList();