// game.js - 메인 게임 루프, 물리, 카메라 및 통합 시뮬레이션

import { scene, camera, renderer, sun, moon } from './scene.js';
import { getWaterHeight, updateOcean } from './ocean.js';
import {
    shipGroup, activeSails, activeOars, currentShipType,
    updateShipLights
} from './ships/shipManager.js';
import { buildSteamboat } from './ships/steamboat.js';
import { weatherMode, updateWeather } from './weather.js';
import { islands, updateChunks } from './world.js';
import { keys, isAutoPilot, mouseX, mouseY } from './controls.js';
import { createParticle, updateParticles } from './particles.js';

// ── 게임 물리 상태 ───────────────────────────────────────────
export let shipSpeed = 0;
export let shipRot = Math.PI; // 배는 초기 방향 -Z (선수 방향)로 출발

const clock = new THREE.Clock();

// ── 게임 초기화 ───────────────────────────────────────────────
export function initGame() {
    // 기본 시작 선박: 증기선
    buildSteamboat();

    // 초기 청크 로드
    updateChunks(0, 0, weatherMode);

    // 게임 루프 시작
    animate();
}

// ── 메인 애니메이션 루프 ──────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);
    const time = clock.elapsedTime;

    // 1. 파도 및 무한 바다 메시 업데이트
    updateOcean(shipGroup.position.x, shipGroup.position.z, time);

    // 2. 무한 섬 증식 (청크 업데이트)
    updateChunks(shipGroup.position.x, shipGroup.position.z, weatherMode);

    // 3. 플레이어 조작 및 오토파일럿
    if (isAutoPilot) {
        keys.w = true;
        keys.a = false;
        keys.d = false;

        const forwardX = -Math.sin(shipRot);
        const forwardZ = -Math.cos(shipRot);

        let maxThreat = 0;
        let bestTurn = 0;

        for (const isl of islands) {
            const dx = isl.x - shipGroup.position.x;
            const dz = isl.z - shipGroup.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            const safeDist = isl.radius + 80;
            if (dist < safeDist) {
                const dot = (dx * forwardX + dz * forwardZ) / dist;
                if (dot > -0.2) {
                    const cross = forwardX * dz - forwardZ * dx;
                    let c = cross;
                    if (Math.abs(c) < 1.0) c = 1.0;

                    const turnDir = (c > 0) ? 1 : -1;
                    const strength = (dot > 0 ? dot : 0.1) * (1.0 - dist / safeDist);
                    const avoidStrength = Math.pow(strength, 2);

                    if (avoidStrength > maxThreat) {
                        maxThreat = avoidStrength;
                        const panicMultiplier = (dist < isl.radius + 40) ? 4.0 : 1.5;
                        bestTurn = turnDir * 3.5 * dt * avoidStrength * panicMultiplier;
                    }
                }
            }
        }
        shipRot += bestTurn;
    }

    const isBoost = keys.shift && !isAutoPilot;
    const targetSpeed = (keys.w ? -1 : keys.s ? 0.5 : 0) * (isBoost ? 35 : 15);
    shipSpeed += (targetSpeed - shipSpeed) * 3 * dt;

    if (keys.a) shipRot += 1.8 * dt;
    if (keys.d) shipRot -= 1.8 * dt;

    const moveX = Math.sin(shipRot) * shipSpeed * dt;
    const moveZ = Math.cos(shipRot) * shipSpeed * dt;

    // 4. 섬 충돌 처리 (끼임 방지)
    let nextX = shipGroup.position.x + moveX;
    let nextZ = shipGroup.position.z + moveZ;
    let totalPushX = 0;
    let totalPushZ = 0;
    let hitCount = 0;

    for (const isl of islands) {
        const dx = nextX - isl.x;
        const dz = nextZ - isl.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        const colRadius = isl.radius + 4.0;
        if (dist < colRadius) {
            const push = (colRadius - dist);
            totalPushX += (dx / dist) * push;
            totalPushZ += (dz / dist) * push;
            hitCount++;
        }
    }

    if (hitCount > 0) {
        nextX += totalPushX / hitCount;
        nextZ += totalPushZ / hitCount;
        shipSpeed *= 0.95;
    }

    shipGroup.position.x = nextX;
    shipGroup.position.z = nextZ;
    shipGroup.rotation.y = shipRot;

    // 5. 부력 (수면 위 0.4 띄움)
    const floatHeight = getWaterHeight(shipGroup.position.x, shipGroup.position.z, time) + 0.4;
    shipGroup.position.y += (floatHeight - shipGroup.position.y) * 5 * dt;

    // 6. 배 피치 및 롤 (파도 경사도 반영)
    const wx1 = getWaterHeight(shipGroup.position.x + 1, shipGroup.position.z, time);
    const wx2 = getWaterHeight(shipGroup.position.x - 1, shipGroup.position.z, time);
    const wz1 = getWaterHeight(shipGroup.position.x, shipGroup.position.z + 1, time);
    const wz2 = getWaterHeight(shipGroup.position.x, shipGroup.position.z - 1, time);

    shipGroup.rotation.z = -(wx1 - wx2) * 0.1;
    shipGroup.rotation.x = (wz1 - wz2) * 0.1;

    // 7. 파티클 이펙트 발생 (연기/물보라)
    if (Math.abs(shipSpeed) > 1) {
        if (currentShipType === 0 || currentShipType === 2) {
            createParticle(true, isBoost, shipSpeed, shipRot, time);
        }
        createParticle(false, isBoost, shipSpeed, shipRot, time);
        if (isBoost && Math.random() > 0.5) {
            createParticle(false, true, shipSpeed, shipRot, time);
        }
    } else if (Math.random() > 0.9) {
        if (currentShipType === 0 || currentShipType === 2) {
            createParticle(true, false, shipSpeed, shipRot, time);
        }
    }

    // 8. 돛 펄럭임 및 D자형 팽창 애니메이션
    const windSpeed = Math.abs(shipSpeed) * 0.5 + 2.0;
    const bulgeAmount = 0.8 + Math.min(Math.max(shipSpeed * 0.03, 0), 1.0);

    for (const sailGeo of activeSails) {
        if (!sailGeo.boundingBox) sailGeo.computeBoundingBox();
        const width = sailGeo.boundingBox.max.x - sailGeo.boundingBox.min.x;
        const pos = sailGeo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const flap = Math.sin(x * 2.0 + time * windSpeed) * 0.1 * (y / 2.0 + 0.5);
            const normalizedX = x / (width / 2);
            const dShape = Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));
            pos.setZ(i, flap - (dShape * bulgeAmount));
        }
        sailGeo.computeVertexNormals();
        sailGeo.attributes.position.needsUpdate = true;
    }

    // 9. 노 젓기 애니메이션
    const rowSpeed = shipSpeed * 0.5;
    for (const oar of activeOars) {
        const rowAngle = time * rowSpeed;
        oar.mesh.rotation.z = oar.baseRotZ + Math.sin(rowAngle * oar.side) * 0.3;
        oar.mesh.rotation.y = Math.cos(rowAngle) * 0.4 * oar.side;
    }

    // 10. 파티클 및 날씨 업데이트
    updateParticles();
    updateWeather(shipGroup.position.x, shipGroup.position.z, dt, time);

    // 11. 선박별 고유 야간 조명 동적 업데이트 (화염 깜빡임/화염광/탐조등)
    updateShipLights(time, dt, shipSpeed, keys.shift);

    // 12. 3인칭 카메라 이동
    const camDist = 20;
    const cx = shipGroup.position.x + Math.sin(mouseX) * Math.cos(mouseY) * camDist;
    const cy = shipGroup.position.y + Math.sin(mouseY) * camDist;
    const cz = shipGroup.position.z + Math.cos(mouseX) * Math.cos(mouseY) * camDist;

    camera.position.set(cx, cy, cz);
    camera.lookAt(shipGroup.position.x, shipGroup.position.y + 2, shipGroup.position.z);

    // 12. 태양 및 달 위치 동기화
    if (moon.visible) {
        moon.position.set(shipGroup.position.x - 40, 35, shipGroup.position.z - 80);
    }
    if (sun.visible) {
        sun.position.set(shipGroup.position.x + 40, 45, shipGroup.position.z - 90);
    }

    // 13. 렌더링
    renderer.render(scene, camera);
}

// ── 게임 자동 시작 ──────────────────────────────────────────
initGame();
