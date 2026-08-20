// weather.js - 날씨 시스템 (비/눈/안개 파티클)

import { scene } from './scene.js';

export let weatherParticles = null;
export let weatherMode      = 0; // 0:clear 1:rain 2:snow 3:fog
export let lastWeatherMode  = 0;

export function createWeather(count) {
    if (weatherParticles) scene.remove(weatherParticles);
    weatherParticles = null;

    const geo = new THREE.BufferGeometry();

    if (weatherMode === 1) {
        // 비: LineSegments
        const linePos = new Float32Array(count * 6);
        for (let i = 0; i < count; i++) {
            const px = (Math.random() - 0.5) * 200;
            const pz = (Math.random() - 0.5) * 200;
            const py = Math.random() * 100;
            linePos[i*6]   = px; linePos[i*6+1] = py;     linePos[i*6+2] = pz;
            linePos[i*6+3] = px; linePos[i*6+4] = py - 3; linePos[i*6+5] = pz;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const mat = new THREE.LineBasicMaterial({ color: 0xaaaaee, transparent: true, opacity: 0.55 });
        weatherParticles = new THREE.LineSegments(geo, mat);

    } else if (weatherMode === 2) {
        // 눈: Points
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i*3]   = (Math.random() - 0.5) * 200;
            pos[i*3+1] = Math.random() * 100;
            pos[i*3+2] = (Math.random() - 0.5) * 200;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, transparent: true, opacity: 0.85 });
        weatherParticles = new THREE.Points(geo, mat);
    }

    if (weatherParticles) scene.add(weatherParticles);
}

// 게임 루프에서 호출 - 날씨 파티클 위치/애니메이션 갱신
export function updateWeather(shipX, shipZ, dt, time) {
    if (!weatherParticles) return;

    weatherParticles.position.x = shipX;
    weatherParticles.position.z = shipZ;

    const wpos = weatherParticles.geometry.attributes.position;

    if (weatherMode === 1) {
        // 비: 선분 쌍을 아래로 이동
        for (let i = 0; i < wpos.count; i += 2) {
            let y1 = wpos.getY(i);
            let y2 = wpos.getY(i + 1);
            y1 -= 60 * dt;
            y2 -= 60 * dt;
            if (y2 < -2) {
                y1 = 98 + Math.random() * 4;
                y2 = y1 - 3;
                const nx = (Math.random() - 0.5) * 200;
                const nz = (Math.random() - 0.5) * 200;
                wpos.setX(i, nx);   wpos.setZ(i, nz);
                wpos.setX(i+1, nx); wpos.setZ(i+1, nz);
            }
            wpos.setY(i, y1);
            wpos.setY(i + 1, y2);
        }
    } else if (weatherMode === 2) {
        // 눈: 흩날리며 낙하
        for (let i = 0; i < wpos.count; i++) {
            let y = wpos.getY(i);
            y -= 7 * dt;
            let x = wpos.getX(i);
            x += Math.sin(time * 0.6 + i * 0.3) * 0.1;
            wpos.setX(i, x);
            if (y < 0) {
                y = 98 + Math.random() * 4;
                wpos.setX(i, (Math.random() - 0.5) * 200);
                wpos.setZ(i, (Math.random() - 0.5) * 200);
            }
            wpos.setY(i, y);
        }
    }

    weatherParticles.geometry.attributes.position.needsUpdate = true;
}

// weatherMode를 외부에서 설정하는 setter (순환 참조 방지용)
export function setWeatherMode(mode) {
    weatherMode = mode;
}
export function setLastWeatherMode(mode) {
    lastWeatherMode = mode;
}
export function clearWeatherParticles() {
    if (weatherParticles) {
        scene.remove(weatherParticles);
        weatherParticles = null;
    }
}
