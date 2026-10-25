const svCanvas = document.getElementById('sv-canvas');
const svCtx = svCanvas.getContext('2d');
const svCursor = document.getElementById('sv-cursor');
const hueCanvas = document.getElementById('hue-canvas');
const hueCtx = hueCanvas.getContext('2d');
const hueCursor = document.getElementById('hue-cursor');
const previewColor = document.getElementById('cp-current-color');
const hexInput = document.getElementById('cp-hex-input');
const presetsRow = document.getElementById('cp-presets-row');
const savedRow = document.getElementById('cp-saved-row');
const savePresetBtn = document.getElementById('cp-save-preset');
const controlPanel = document.getElementById('control-panel-ui');
const placementUI = document.getElementById('placement-ui');
const uiControls = document.getElementById('ui-controls');
const shopUI = document.getElementById('shop-ui');

// Shop Views
const shopView = document.getElementById('shop-view');
const cartView = document.getElementById('cart-view');
const cartItemsContainer = document.getElementById('cart-items-container');

const brightnessSlider = document.getElementById('brightness-slider');
const brightnessHandle = document.getElementById('brightness-handle');
const brightnessFill = document.getElementById('brightness-fill');
const brightnessValueEl = document.getElementById('brightness-value');

const distanceSlider = document.getElementById('distance-slider');
const distanceHandle = document.getElementById('distance-handle');
const distanceFill = document.getElementById('distance-fill');
const distanceValueEl = document.getElementById('distance-value');

const widthSlider = document.getElementById('width-slider');
const widthHandle = document.getElementById('width-handle');
const widthFill = document.getElementById('width-fill');
const widthValueEl = document.getElementById('width-value');

let currentH = 0;
let currentS = 0;
let currentV = 1;
let currentB = 8.0;
let minB = 0.5;
let maxB = 10.0;

let currentDist = 25.0;
let minDist = 1.0;
let maxDist = 50.0;

let currentWidth = 25.0;
let minWidth = 1.0;
let maxWidth = 50.0;

let currentNetId = null;

let isDraggingSV = false;
let isDraggingHue = false;
let isDraggingBrightness = false;
let isDraggingDistance = false;
let isDraggingWidth = false;

// Snapshot taken when the panel opens, used by the Reset button
let initialState = null;

let shopItems = {};
const itemImages = { lightcontrol: 'light_tablet.png' };
let cart = {};

// =============================================
// UI Show/Hide Helpers
// =============================================
function showUI(el, displayType = 'flex') {
    clearTimeout(el._hideTimer);
    el.style.display = displayType;
    el.classList.remove('hide');
    el.classList.add('reveal');
}
function hideUI(el) {
    el.classList.remove('reveal');
    el.classList.add('hide');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
        el.style.display = 'none';
        el.classList.remove('hide');
    }, 300);
}

function showShopView(viewId) {
    [shopView, cartView].forEach(v => v.style.display = 'none');
    const view = document.getElementById(viewId);
    view.style.display = 'flex';
    view.classList.remove('hide-card');
    view.classList.add('reveal-card');
}

function showShopUI(initialView = 'shop-view') {
    clearTimeout(shopUI._hideTimer);
    shopUI.style.display = 'flex';
    shopUI.classList.remove('hide-bg');
    shopUI.classList.add('reveal-bg');
    showShopView(initialView);
}
function hideShopUI() {
    shopUI.classList.remove('reveal-bg');
    shopUI.classList.add('hide-bg');
    [shopView, cartView].forEach(v => {
        v.classList.remove('reveal-card');
        v.classList.add('hide-card');
    });
    
    clearTimeout(shopUI._hideTimer);
    shopUI._hideTimer = setTimeout(() => {
        shopUI.style.display = 'none';
        shopUI.classList.remove('hide-bg');
        [shopView, cartView].forEach(v => v.classList.remove('hide-card'));
    }, 300);
}

const controllerUI = document.getElementById('controller-ui');
const controllerList = document.getElementById('controller-list');
const controllerView = document.getElementById('controller-view');
function hideControllerUI() {
    controllerUI.classList.remove('reveal-bg');
    controllerUI.classList.add('hide-bg');
    controllerView.classList.remove('reveal-card');
    controllerView.classList.add('hide-card');
    clearTimeout(controllerUI._hideTimer);
    controllerUI._hideTimer = setTimeout(() => {
        controllerUI.style.display = 'none';
        controllerUI.classList.remove('hide-bg');
        controllerView.classList.remove('hide-card');
    }, 300);
}
document.getElementById('controller-close-action').addEventListener('click', function() {
    playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    hideControllerUI();
    fetch(`https://${GetParentResourceName()}/closeController`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    });
});

function playSound(sound, set) {
    fetch(`https://${GetParentResourceName()}/playSound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ sound: sound, set: set })
    });
}

// =============================================
// Color Math
// =============================================
function hsvToRgb(h, s, v) {
    let r, g, b;
    let i = Math.floor(h / 60) % 6;
    let f = h / 60 - Math.floor(h / 60);
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch(i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max == 0 ? 0 : d / max;
    if(max == min){
        h = 0;
    } else {
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, v];
}

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

// =============================================
// Canvas Drawing
// =============================================
function drawSVSquare() {
    const w = svCanvas.width, h = svCanvas.height;
    const [r, g, b] = hsvToRgb(currentH, 1, 1);
    svCtx.fillStyle = `rgb(${r},${g},${b})`;
    svCtx.fillRect(0, 0, w, h);

    const white = svCtx.createLinearGradient(0, 0, w, 0);
    white.addColorStop(0, 'rgba(255,255,255,1)');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    svCtx.fillStyle = white;
    svCtx.fillRect(0, 0, w, h);

    const black = svCtx.createLinearGradient(0, 0, 0, h);
    black.addColorStop(0, 'rgba(0,0,0,0)');
    black.addColorStop(1, 'rgba(0,0,0,1)');
    svCtx.fillStyle = black;
    svCtx.fillRect(0, 0, w, h);
}

function drawHueStrip() {
    const grad = hueCtx.createLinearGradient(0, 0, hueCanvas.width, 0);
    for (let i = 0; i <= 6; i++) {
        const [r, g, b] = hsvToRgb(i * 60, 1, 1);
        grad.addColorStop(i / 6, `rgb(${r},${g},${b})`);
    }
    hueCtx.fillStyle = grad;
    hueCtx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
}

// =============================================
// Presets (colour temperature + creative colours)
// =============================================
function kelvinToRgb(k) {
    const t = k / 100;
    let r, g, b;
    if (t <= 66) {
        r = 255;
        g = 99.4708025861 * Math.log(t) - 161.1195681661;
        b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    } else {
        r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
        g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
        b = 255;
    }
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
    return [clamp(r), clamp(g), clamp(b)];
}

const PRESETS = [
    { name: 'Warm 2700K',     rgb: kelvinToRgb(2700) },
    { name: 'Tungsten 3200K', rgb: kelvinToRgb(3200) },
    { name: 'Neutral 4500K',  rgb: kelvinToRgb(4500) },
    { name: 'Daylight 5600K', rgb: kelvinToRgb(5600) },
    { name: 'Cool 7500K',     rgb: kelvinToRgb(7500) },
    { sep: true },
    { name: 'Red',     rgb: [255, 0, 0] },
    { name: 'Magenta', rgb: [255, 0, 170] },
    { name: 'Blue',    rgb: [0, 90, 255] },
    { name: 'Green',   rgb: [0, 255, 60] }
];

function buildPresets() {
    presetsRow.innerHTML = '';
    PRESETS.forEach(p => {
        if (p.sep) {
            const sep = document.createElement('div');
            sep.className = 'cp-preset-sep';
            presetsRow.appendChild(sep);
            return;
        }
        const el = document.createElement('div');
        el.className = 'cp-preset';
        el.title = p.name;
        const hex = rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2]);
        el.dataset.hex = hex;
        el.style.background = hex;
        el.addEventListener('click', () => {
            playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
            setColorRgb(p.rgb[0], p.rgb[1], p.rgb[2]);
        });
        presetsRow.appendChild(el);
    });
}

// Sets the colour from RGB while keeping the current hue for greys/blacks
function setColorRgb(r, g, b) {
    const [h, s, v] = rgbToHsv(r, g, b);
    if (s > 0 && v > 0) currentH = Math.min(359.999, h);
    currentS = s;
    currentV = v;
    updateUI();
    sendLiveUpdate(true);
}

// =============================================
// UI Refresh
// =============================================
let lastHueKey = -1;

// Don't overwrite a field while the player is typing in it
function setField(el, text) {
    if (document.activeElement !== el) el.value = text;
}

function updateUI() {
    const [r, g, b] = hsvToRgb(currentH, currentS, currentV);
    const hex = rgbToHex(r, g, b);

    previewColor.style.background = hex;
    previewColor.style.boxShadow = `0 0 12px ${hex}`;
    setField(hexInput, hex);
    if (document.activeElement !== hexInput) hexInput.classList.remove('invalid');

    document.querySelectorAll('.cp-preset').forEach(el => {
        el.classList.toggle('active', el.dataset.hex === hex);
    });

    // Square only needs repainting when the hue changes
    const hueKey = Math.round(currentH * 10);
    if (hueKey !== lastHueKey) {
        lastHueKey = hueKey;
        drawSVSquare();
    }

    svCursor.style.left = (currentS * 100) + '%';
    svCursor.style.top = ((1 - currentV) * 100) + '%';
    svCursor.style.background = hex;

    const [hr, hg, hb] = hsvToRgb(currentH, 1, 1);
    hueCursor.style.left = (currentH / 360 * 100) + '%';
    hueCursor.style.background = `rgb(${hr},${hg},${hb})`;

    let bPercent = (currentB - minB) / (maxB - minB);
    brightnessHandle.style.left = (bPercent * 100) + '%';
    brightnessFill.style.width = (bPercent * 100) + '%';
    setField(brightnessValueEl, currentB.toFixed(1));
    brightnessHandle.style.background = hex;

    let dPercent = (currentDist - minDist) / (maxDist - minDist);
    distanceHandle.style.left = (dPercent * 100) + '%';
    distanceFill.style.width = (dPercent * 100) + '%';
    setField(distanceValueEl, currentDist.toFixed(1));
    distanceHandle.style.background = hex;

    let wPercent = (currentWidth - minWidth) / (maxWidth - minWidth);
    widthHandle.style.left = (wPercent * 100) + '%';
    widthFill.style.width = (wPercent * 100) + '%';
    setField(widthValueEl, currentWidth.toFixed(1));
    widthHandle.style.background = hex;
}

// =============================================
// Live Updates
// =============================================
let lastUpdate = 0;
function sendLiveUpdate(force) {
    if (currentNetId == null) return;

    const [r, g, b] = hsvToRgb(currentH, currentS, currentV);
    const now = Date.now();
    if (force || now - lastUpdate > 40) {
        lastUpdate = now;
        fetch(`https://${GetParentResourceName()}/liveUpdate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({
                netId: parseInt(currentNetId),
                r: r,
                g: g,
                b: b,
                brightness: currentB,
                distance: currentDist,
                width: currentWidth
            })
        });
    }
}

function updateSV(e) {
    const rect = svCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    currentS = x / rect.width;
    currentV = 1 - (y / rect.height);
    updateUI();
    sendLiveUpdate();
}

function updateHue(e) {
    const rect = hueCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    currentH = Math.min(359.999, (x / rect.width) * 360);
    updateUI();
    sendLiveUpdate();
}

function sliderPercent(track, e) {
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    return x / rect.width;
}

function updateBrightnessSlider(e) {
    currentB = minB + (sliderPercent(brightnessSlider, e) * (maxB - minB));
    updateUI();
    sendLiveUpdate();
}

function updateDistanceSlider(e) {
    currentDist = minDist + (sliderPercent(distanceSlider, e) * (maxDist - minDist));
    updateUI();
    sendLiveUpdate();
}

function updateWidthSlider(e) {
    currentWidth = minWidth + (sliderPercent(widthSlider, e) * (maxWidth - minWidth));
    updateUI();
    sendLiveUpdate();
}

// =============================================
// Mouse Event Listeners
// =============================================
svCanvas.addEventListener('mousedown', (e) => { isDraggingSV = true; updateSV(e); });
hueCanvas.addEventListener('mousedown', (e) => { isDraggingHue = true; updateHue(e); });
brightnessSlider.addEventListener('mousedown', (e) => { isDraggingBrightness = true; updateBrightnessSlider(e); });
distanceSlider.addEventListener('mousedown', (e) => { isDraggingDistance = true; updateDistanceSlider(e); });
widthSlider.addEventListener('mousedown', (e) => { isDraggingWidth = true; updateWidthSlider(e); });

document.addEventListener('mousemove', (e) => {
    if (isDraggingSV) updateSV(e);
    if (isDraggingHue) updateHue(e);
    if (isDraggingBrightness) updateBrightnessSlider(e);
    if (isDraggingDistance) updateDistanceSlider(e);
    if (isDraggingWidth) updateWidthSlider(e);
});

document.addEventListener('mouseup', () => {
    const wasDragging = isDraggingSV || isDraggingHue || isDraggingBrightness || isDraggingDistance || isDraggingWidth;
    isDraggingSV = false;
    isDraggingHue = false;
    isDraggingBrightness = false;
    isDraggingDistance = false;
    isDraggingWidth = false;
    // Make sure the final position isn't lost to the 40ms throttle
    if (wasDragging) sendLiveUpdate(true);
});

// =============================================
// Typed Input (hex + slider values)
// =============================================
document.querySelectorAll('#control-panel-ui input').forEach(inp => {
    inp.addEventListener('focus', () => {
        inp.dataset.prev = inp.value;
        inp.select();
    });
    inp.addEventListener('keydown', (e) => {
        // Keep typing from reaching the global Escape handler
        e.stopPropagation();
        if (e.key === 'Enter') {
            inp.blur();
        } else if (e.key === 'Escape') {
            inp.value = inp.dataset.prev || inp.value;
            inp.blur();
        }
    });
    inp.addEventListener('blur', () => updateUI());
});

function bindValueInput(el, getMin, getMax, apply) {
    el.addEventListener('change', () => {
        let v = parseFloat(el.value.replace(',', '.'));
        if (isNaN(v)) { updateUI(); return; }
        v = Math.max(getMin(), Math.min(getMax(), v));
        apply(v);
        updateUI();
        sendLiveUpdate(true);
    });
}
bindValueInput(brightnessValueEl, () => minB, () => maxB, v => { currentB = v; });
bindValueInput(distanceValueEl, () => minDist, () => maxDist, v => { currentDist = v; });
bindValueInput(widthValueEl, () => minWidth, () => maxWidth, v => { currentWidth = v; });

hexInput.addEventListener('input', () => {
    let v = hexInput.value.trim();
    if (v[0] !== '#') v = '#' + v;
    const m = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(v);
    if (!m) {
        hexInput.classList.add('invalid');
        return;
    }
    hexInput.classList.remove('invalid');
    let hx = m[1];
    if (hx.length === 3) hx = hx.split('').map(ch => ch + ch).join('');
    setColorRgb(parseInt(hx.slice(0, 2), 16), parseInt(hx.slice(2, 4), 16), parseInt(hx.slice(4, 6), 16));
});

buildPresets();
drawHueStrip();

// =============================================
// Saved presets (colour + brightness + distance + width)
// Stored in the NUI's localStorage, so they persist between sessions.
// =============================================
const SAVED_KEY = 'blights:savedPresets';
const MAX_SAVED = 12;
let savedPresets = [];

function loadSavedPresets() {
    try {
        const raw = localStorage.getItem(SAVED_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        savedPresets = Array.isArray(arr) ? arr.filter(p =>
            p && typeof p.hex === 'string' && /^#[0-9A-F]{6}$/i.test(p.hex) &&
            isFinite(p.b) && isFinite(p.dist) && isFinite(p.width)
        ).slice(0, MAX_SAVED) : [];
    } catch (err) {
        savedPresets = [];
    }
}

function persistSavedPresets() {
    try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(savedPresets));
    } catch (err) { /* storage unavailable - presets last for this session only */ }
}

function renderSavedPresets() {
    savedRow.innerHTML = '';
    savePresetBtn.disabled = savedPresets.length >= MAX_SAVED;
    savePresetBtn.title = savePresetBtn.disabled ? 'Preset limit reached - delete one first' : 'Save the current colour and settings';

    if (savedPresets.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cp-saved-empty';
        empty.textContent = 'No saved presets yet';
        savedRow.appendChild(empty);
        return;
    }

    savedPresets.forEach((p, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'cp-preset-wrap';

        const sw = document.createElement('div');
        sw.className = 'cp-preset';
        sw.style.background = p.hex;
        sw.title = `${p.hex}  |  Brightness ${p.b.toFixed(1)}  |  Distance ${p.dist.toFixed(1)}  |  Width ${p.width.toFixed(1)}`;
        sw.addEventListener('click', () => applySavedPreset(p));

        const del = document.createElement('div');
        del.className = 'cp-preset-del';
        del.textContent = '×';
        del.title = 'Delete preset';
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
            savedPresets.splice(idx, 1);
            persistSavedPresets();
            renderSavedPresets();
        });

        wrap.appendChild(sw);
        wrap.appendChild(del);
        savedRow.appendChild(wrap);
    });
}

function applySavedPreset(p) {
    playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    const [r, g, b] = [parseInt(p.hex.slice(1, 3), 16), parseInt(p.hex.slice(3, 5), 16), parseInt(p.hex.slice(5, 7), 16)];
    const [h, s, v] = rgbToHsv(r, g, b);
    if (s > 0 && v > 0) currentH = Math.min(359.999, h);
    currentS = s;
    currentV = v;
    currentB = Math.max(minB, Math.min(maxB, p.b));
    currentDist = Math.max(minDist, Math.min(maxDist, p.dist));
    currentWidth = Math.max(minWidth, Math.min(maxWidth, p.width));
    updateUI();
    sendLiveUpdate(true);
}

savePresetBtn.addEventListener('click', () => {
    if (savedPresets.length >= MAX_SAVED) return;
    const [r, g, b] = hsvToRgb(currentH, currentS, currentV);
    const entry = {
        hex: rgbToHex(r, g, b),
        b: Math.round(currentB * 10) / 10,
        dist: Math.round(currentDist * 10) / 10,
        width: Math.round(currentWidth * 10) / 10
    };
    // Don't store an identical preset twice
    const dupe = savedPresets.some(p => p.hex === entry.hex && p.b === entry.b && p.dist === entry.dist && p.width === entry.width);
    if (dupe) return;
    playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    savedPresets.push(entry);
    persistSavedPresets();
    renderSavedPresets();
});

loadSavedPresets();
renderSavedPresets();

// Escape Key Listener
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (controlPanel.style.display === 'block') {
            document.getElementById('cp-cancel').click();
        } else if (controllerUI.style.display === 'flex') {
            document.getElementById('controller-close-action').click();
        } else if (shopUI.style.display === 'flex') {
            if (cartView.style.display === 'flex') {
                document.getElementById('back-btn').click();
            } else {
                document.getElementById('shop-close-action').click();
            }
        } else if (placementUI.style.display === 'none' || !placementUI.style.display) {
            // Safety net: nothing visible but focus may still be held -> release it
            fetch(`https://${GetParentResourceName()}/closeController`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                body: JSON.stringify({})
            });
        }
    }
});

// =============================================
// Cart Logic
// =============================================
function updateCartTotals() {
    let total = 0;
    for (let item in cart) {
        total += (cart[item].price * cart[item].qty);
    }
    document.getElementById('shop-cart-total').innerText = '$' + total;
    document.getElementById('cart-total-val').innerText = '$' + total;
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let hasItems = false;

    for (let item in cart) {
        if (cart[item].qty > 0) {
            hasItems = true;
            let itemData = cart[item];
            let div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-icon">
                    <img src="nui://qb-inventory/html/images/${itemImages[item] || item + '.png'}" alt="${item}">
                </div>
                <div class="cart-item-details">
                    <h4>${itemData.name}</h4>
                    <div class="cart-item-price">$${itemData.price} each</div>
                </div>
                <div class="cart-qty">
                    <div class="qty-btn cart-minus" data-item="${item}"><i class="fas fa-minus"></i></div>
                    <div class="qty-val">${itemData.qty}</div>
                    <div class="qty-btn cart-plus" data-item="${item}"><i class="fas fa-plus"></i></div>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        }
    }

    if (!hasItems) {
        cartItemsContainer.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    }

    document.querySelectorAll('.cart-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            playSound("CONTINUE", "HUD_FRONTEND_DEFAULT_SOUNDSET");
            let item = this.getAttribute('data-item');
            cart[item].qty++;
            renderCart();
            updateCartTotals();
        });
    });

    document.querySelectorAll('.cart-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            playSound("CONTINUE", "HUD_FRONTEND_DEFAULT_SOUNDSET");
            let item = this.getAttribute('data-item');
            cart[item].qty--;
            if (cart[item].qty <= 0) delete cart[item];
            renderCart();
            updateCartTotals();
        });
    });

    updateCartTotals();
}

// =============================================
// NUI Message Handler
// =============================================
window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === 'show') {
        uiControls.innerHTML = '';
        if (data.controls) {
            data.controls.forEach((ctrl, index) => {
                if (index > 0) {
                    const divider = document.createElement('div');
                    divider.className = 'control-divider';
                    uiControls.appendChild(divider);
                }
                
                const group = document.createElement('div');
                group.className = 'control-group';
                group.innerHTML = `
                    <div class="control-btn">
                        <div class="ctrl-key">${ctrl.key}</div>
                        <div class="ctrl-text">${ctrl.action}</div>
                    </div>
                `;
                uiControls.appendChild(group);
            });
        }
        showUI(placementUI, 'flex');
    } 
    else if (data.action === 'hide') {
        hideUI(placementUI);
    }
    else if (data.action === 'openControlPanel') {
        currentNetId = data.netId;
        minB = data.minBrightness;
        maxB = data.maxBrightness;
        currentB = data.brightness;
        currentDist = data.distance;
        currentWidth = data.width;
        
        let r = 255, g = 255, b = 255;
        if(data.color && typeof data.color === 'object') {
            r = data.color.r || 255;
            g = data.color.g || 255;
            b = data.color.b || 255;
        }
        
        let [h, s, v] = rgbToHsv(r, g, b);
        currentH = h;
        currentS = s;
        currentV = v;

        document.getElementById('cp-back').style.display = data.fromController ? 'block' : 'none';
        initialState = { h: currentH, s: currentS, v: currentV, b: currentB, dist: currentDist, width: currentWidth };
        disarmSync();
        lastHueKey = -1;
        updateUI();
        showUI(controlPanel, 'block');
    }
    else if (data.action === 'openController') {
        controllerList.innerHTML = '';
        (data.lights || []).forEach((l, i) => {
            const isTube = l.itemType === 'tubeworklight';
            const name = isTube ? 'Omni Tube Light' : 'Studio Light';
            const img = isTube ? 'tubeworklight.png' : 'worklight.png';
            const row = document.createElement('div');
            row.className = 'controller-item';
            row.innerHTML = `
                <div class="shop-item-icon"><img src="nui://qb-inventory/html/images/${img}" alt="${name}"></div>
                <div class="item-info">
                    <h3>${name} #${i + 1}</h3>
                    <p class="controller-dist">${Math.round(l.dist)}m away</p>
                </div>
                <div class="controller-swatch" style="background: rgb(${l.color.r},${l.color.g},${l.color.b})"></div>
            `;
            row.addEventListener('click', () => {
                playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
                hideControllerUI();
                fetch(`https://${GetParentResourceName()}/controllerSelect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                    body: JSON.stringify({ netId: l.netId })
                });
            });
            row.style.setProperty('--i', Math.min(i, 8));
            controllerList.appendChild(row);
        });
        clearTimeout(controllerUI._hideTimer);
        controllerUI.style.display = 'flex';
        controllerUI.classList.remove('hide-bg');
        controllerUI.classList.add('reveal-bg');
        controllerView.classList.remove('hide-card');
        controllerView.classList.add('reveal-card');
    }
    else if (data.action === 'openShop') {
        shopItems = data.items;
        cart = {};
        
        for (let item in shopItems) {
            let priceEl = document.getElementById(`price-${item}`);
            if (priceEl) priceEl.innerText = shopItems[item].price;
            let btn = document.querySelector(`.add-cart-btn[data-item="${item}"]`);
            if (btn) btn.setAttribute('data-price', shopItems[item].price);
        }

        updateCartTotals();
        showShopUI('shop-view');
    }
});

// =============================================
// Button Click Listeners
// =============================================
document.getElementById('cp-confirm').addEventListener('click', function() {
    playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    const [r, g, b] = hsvToRgb(currentH, currentS, currentV);
    fetch(`https://${GetParentResourceName()}/saveControlPanel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
            netId: parseInt(currentNetId),
            r: r,
            g: g,
            b: b,
            brightness: currentB,
            distance: currentDist,
            width: currentWidth
        })
    }).then(() => {
        hideUI(controlPanel);
    });
});

document.getElementById('cp-cancel').addEventListener('click', function() {
    playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    fetch(`https://${GetParentResourceName()}/closeControlPanel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    }).then(() => {
        hideUI(controlPanel);
    });
});

// Back: discard unsaved tweaks and return to the controller light list
document.getElementById('cp-back').addEventListener('click', function() {
    playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    document.getElementById('cp-reset').click();
    hideUI(controlPanel);
    fetch(`https://${GetParentResourceName()}/controllerBack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    });
});

document.getElementById('cp-close-action').addEventListener('click', function() {
    document.getElementById('cp-cancel').click();
});

const syncBtn = document.getElementById('cp-sync');
let syncArmed = false;
let syncTimer = null;

function disarmSync() {
    syncArmed = false;
    clearTimeout(syncTimer);
    syncBtn.textContent = 'Sync All';
    syncBtn.classList.remove('armed');
}

// Sync All overwrites every light, so it needs a second click to confirm
syncBtn.addEventListener('click', function() {
    if (!syncArmed) {
        syncArmed = true;
        syncBtn.textContent = 'Sure?';
        syncBtn.classList.add('armed');
        syncTimer = setTimeout(disarmSync, 3000);
        return;
    }
    disarmSync();
    playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    const [r, g, b] = hsvToRgb(currentH, currentS, currentV);
    fetch(`https://${GetParentResourceName()}/syncAllLights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
            r: r,
            g: g,
            b: b,
            brightness: currentB
        })
    }).then(() => {
        hideUI(controlPanel);
    });
});

// Reset puts everything back to how it was when the panel was opened
document.getElementById('cp-reset').addEventListener('click', function() {
    if (!initialState) return;
    playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    currentH = initialState.h;
    currentS = initialState.s;
    currentV = initialState.v;
    currentB = initialState.b;
    currentDist = initialState.dist;
    currentWidth = initialState.width;
    updateUI();
    sendLiveUpdate(true);
});

// Shop Listeners
document.getElementById('shop-close-action').addEventListener('click', function() {
    playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    fetch(`https://${GetParentResourceName()}/closeShop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    }).then(() => {
        hideShopUI();
    });
});

document.getElementById('cart-close-action').addEventListener('click', function() {
    playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    fetch(`https://${GetParentResourceName()}/closeShop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    }).then(() => {
        hideShopUI();
    });
});

document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
        let item = this.getAttribute('data-item');
        let name = this.getAttribute('data-name');
        let price = parseInt(this.getAttribute('data-price'));
        
        if (!cart[item]) {
            cart[item] = { name: name, price: price, qty: 0 };
        }
        cart[item].qty++;
        updateCartTotals();
        
        this.innerHTML = '<i class="fas fa-check"></i> Added';
        setTimeout(() => {
            this.innerHTML = 'Add to Cart';
        }, 1000);
    });
});

document.getElementById('checkout-btn').addEventListener('click', () => {
    playSound("SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    showShopView('cart-view');
    renderCart();
});

document.getElementById('back-btn').addEventListener('click', () => {
    playSound("BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    showShopView('shop-view');
});

document.getElementById('shop-cash-btn').addEventListener('click', function() {
    playSound("CONFIRM_BEEP_01", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    fetch(`https://${GetParentResourceName()}/processPurchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
            cart: cart,
            paymentType: 'cash'
        })
    }).then(() => {
        hideShopUI();
    });
});

document.getElementById('shop-card-btn').addEventListener('click', function() {
    playSound("CONFIRM_BEEP_01", "HUD_FRONTEND_DEFAULT_SOUNDSET");
    fetch(`https://${GetParentResourceName()}/processPurchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
            cart: cart,
            paymentType: 'bank'
        })
    }).then(() => {
        hideShopUI();
    });
});

// Initialize Canvas
drawColorWheel();
updateUI();