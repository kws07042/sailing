// ships/shipManager.js - shipGroup 및 선박별 동적 조명/상태 관리
import { scene } from '../scene.js';

// ── 공유 선박 그룹 ──────────────────────────────────────────
export const shipGroup = new THREE.Group();
scene.add(shipGroup);

// ── 공유 애니메이션 상태 ────────────────────────────────────
export const activeSails = [];
export const activeOars = [];
export const activeShipLights = [];
export let currentShipType = 0; // 0: Steamboat, 1: Viking, 2: Turtle
export let isNightMode = false;

export function setCurrentShipType(t) {
    currentShipType = t;
}

export function setNightMode(val) {
    isNightMode = val;
}

// ── 조명 등록 ───────────────────────────────────────────────
export function registerShipLight(lightData) {
    activeShipLights.push(lightData);
}

// ── 선박 초기화 (기존 요소 & 조명 전체 정리) ─────────────────
export function clearShip() {
    for (let i = shipGroup.children.length - 1; i >= 0; i--) {
        const child = shipGroup.children[i];
        shipGroup.remove(child);
    }
    activeSails.length = 0;
    activeOars.length = 0;
    activeShipLights.length = 0;
}

// ── 선박별 동적 야간 조명 애니메이션 ────────────────────────
export function updateShipLights(time, dt, shipSpeed, isBoost) {
    for (const item of activeShipLights) {
        if (!isNightMode) {
            // 주간 모드: 모든 선박 조명 소등
            if (item.light) item.light.intensity = 0;
            if (item.pointLight) item.pointLight.intensity = 0;
            if (item.mesh && item.mesh.material && item.mesh.material.emissiveIntensity !== undefined) {
                item.mesh.material.emissiveIntensity = 0.2;
            }
            continue;
        }

        // 야간 모드: 타입별 고유 조명 물리 & 시각 효과
        if (item.type === 'flicker_brazier') {
            // [바이킹 화로]: 바람에 일렁이는 불꽃 깜빡임 (다중 고조파 삼각함수)
            const speed = item.speed || 15;
            const offset = item.offset || 0;
            const noise = Math.sin(time * speed + offset) * 0.35 + Math.cos(time * (speed * 1.8) + offset) * 0.2;
            const targetIntensity = Math.max(0.2, item.baseIntensity + noise);
            item.light.intensity = targetIntensity;

            // 불꽃 코어 메시 발광 연동
            if (item.mesh && item.mesh.material && item.mesh.material.emissiveIntensity !== undefined) {
                item.mesh.material.emissiveIntensity = 1.5 + noise * 1.2;
            }
        } else if (item.type === 'dragon_eye') {
            // [바이킹 용머리 안광]: 서서히 숨쉬는 붉은빛 시선
            const breathe = Math.sin(time * 3.5) * 0.25;
            item.light.intensity = item.baseIntensity + breathe;
        } else if (item.type === 'dragon_flame') {
            // [거북선 용구 화염]: 화포구에서 뿜어져 나오는 강렬한 화염광 (부스트/전진 시 폭증)
            const flamePulse = Math.sin(time * 24.0) * 0.45 + Math.cos(time * 42.0) * 0.25;
            const speedBonus = Math.abs(shipSpeed) * 0.25 + (isBoost ? 3.0 : 0);
            const intensity = item.baseIntensity + flamePulse + speedBonus;

            if (item.light) item.light.intensity = intensity;
            if (item.pointLight) item.pointLight.intensity = intensity * 0.8;

            if (item.mesh && item.mesh.material && item.mesh.material.emissiveIntensity !== undefined) {
                item.mesh.material.emissiveIntensity = 2.0 + flamePulse * 1.5 + (isBoost ? 4.0 : 0);
            }
        } else if (item.type === 'lantern') {
            // [거북선 전통 초롱등]: 은은하고 포근한 흔들림
            const sway = Math.sin(time * 6.0 + (item.offset || 0)) * 0.15;
            item.light.intensity = item.baseIntensity + sway;
        } else if (item.type === 'searchlight') {
            // [증기선 황동 탐조등]: 강력하고 일정한 백열 빔 + 미세 진동
            const hum = Math.sin(time * 50.0) * 0.04;
            item.light.intensity = item.baseIntensity + hum;
        } else if (item.type === 'cabin_glow') {
            // [증기선 선실 창문 백열등]: 따뜻한 실내등
            item.light.intensity = item.baseIntensity;
        }
    }
}
