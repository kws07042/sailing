// controls.js - 키보드/마우스/UI 이벤트 리스너

import { scene, ambientLight, dirLight, sun, moon } from './scene.js';
import {
    currentShipType, setCurrentShipType,
    isNightMode, setNightMode,
    shipGroup
} from './ships/shipManager.js';
import {
    weatherMode, lastWeatherMode,
    setWeatherMode, setLastWeatherMode,
    clearWeatherParticles, createWeather
} from './weather.js';
import { buildSteamboat } from './ships/steamboat.js';
import { buildVikingShip }  from './ships/viking.js';
import { buildTurtleShip }  from './ships/turtle.js';
import { reloadAllChunks }  from './world.js';

// ── 입력 상태 ─────────────────────────────────────────────────
export const keys = { w: false, a: false, s: false, d: false, shift: false };
export let isAutoPilot = false;

// ── 마우스 카메라 ─────────────────────────────────────────────
export let isMouseDown = false;
export let mouseX = Math.PI;
export let mouseY = 0.4;

// ── 키보드 ────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
    if (Object.prototype.hasOwnProperty.call(keys, e.key.toLowerCase()))
        keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', e => {
    if (Object.prototype.hasOwnProperty.call(keys, e.key.toLowerCase()))
        keys[e.key.toLowerCase()] = false;
});

// ── 마우스 ────────────────────────────────────────────────────
window.addEventListener('mousedown', () => isMouseDown = true);
window.addEventListener('mouseup',   () => isMouseDown = false);
window.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    mouseX -= e.movementX * 0.005;
    mouseY += e.movementY * 0.005;
    mouseY = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, mouseY));
});
window.addEventListener('contextmenu', e => e.preventDefault());

// ── UI: 주야 전환 ──────────────────────────────────────────────
const timeToggle = document.getElementById('timeToggle');
if (timeToggle) {
    timeToggle.addEventListener('click', () => {
        setNightMode(!isNightMode);
        if (isNightMode) {
            scene.background.setHex(0x050510);
            scene.fog.color.setHex(0x050510);
            dirLight.intensity = 0.1;
            ambientLight.intensity = 0.2;
            moon.visible = true; sun.visible = false;
            timeToggle.innerText = 'Day Mode';
            timeToggle.style.backgroundColor = '#ddd';
            timeToggle.style.color = 'black';
        } else {
            scene.background.setHex(0x87CEEB);
            scene.fog.color.setHex(0x87CEEB);
            dirLight.intensity = 1.2;
            ambientLight.intensity = 0.7;
            moon.visible = false; sun.visible = true;
            timeToggle.innerText = 'Night Mode';
            timeToggle.style.backgroundColor = '#333';
            timeToggle.style.color = 'white';
        }
    });
}

// ── UI: 날씨 전환 ──────────────────────────────────────────────
const weatherToggle = document.getElementById('weatherToggle');
if (weatherToggle) {
    weatherToggle.addEventListener('click', () => {
        const prev = weatherMode;
        setWeatherMode((weatherMode + 1) % 4);
        clearWeatherParticles();

        const needReload = (weatherMode === 2) || (lastWeatherMode === 2);
        setLastWeatherMode(weatherMode);

        const labels = ['Weather: Clear', 'Weather: Rain', 'Weather: Snow', 'Weather: Fog'];
        weatherToggle.innerText = labels[weatherMode];

        if (weatherMode === 0) { scene.fog.near = 30; scene.fog.far = 150; }
        else if (weatherMode === 1) { createWeather(2000); scene.fog.near = 20; scene.fog.far = 120; }
        else if (weatherMode === 2) { createWeather(1500); scene.fog.near = 25; scene.fog.far = 130; }
        else { scene.fog.near = 10; scene.fog.far = 40; }

        if (needReload) reloadAllChunks(shipGroup.position.x, shipGroup.position.z, weatherMode);
    });
}

// ── UI: 배 전환 ────────────────────────────────────────────────
const shipToggle = document.getElementById('shipToggle');
if (shipToggle) {
    shipToggle.addEventListener('click', () => {
        setCurrentShipType((currentShipType + 1) % 3);
        const labels = ['Ship: Steamboat', 'Ship: Viking', 'Ship: Turtle'];
        shipToggle.innerText = labels[currentShipType];
        if (currentShipType === 0) buildSteamboat();
        else if (currentShipType === 1) buildVikingShip();
        else buildTurtleShip();
    });
}

// ── UI: 자동 항법 ──────────────────────────────────────────────
const autoToggle = document.getElementById('autoToggle');
if (autoToggle) {
    autoToggle.addEventListener('click', () => {
        isAutoPilot = !isAutoPilot;
        autoToggle.innerText = isAutoPilot ? 'Auto: ON' : 'Auto: OFF';
        autoToggle.style.backgroundColor = isAutoPilot ? '#f44336' : '#4CAF50';
        if (!isAutoPilot) { keys.w = false; keys.a = false; keys.d = false; }
    });
}
