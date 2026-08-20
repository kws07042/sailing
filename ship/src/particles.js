// particles.js - 배의 연기 및 물보라 파티클 시스템

import { scene } from './scene.js';
import { shipGroup, currentShipType } from './ships/shipManager.js';
import { getWaterHeight } from './ocean.js';

export const particles = [];

export function createParticle(isSmoke, isBoost, shipSpeed, shipRot, time) {
    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshBasicMaterial({
        color: isSmoke ? 0xaaaaaa : 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    const p = new THREE.Mesh(geo, mat);

    if (isSmoke) {
        // 배가 전진할 때 배와 연기가 겹치지 않도록, 선박 속도에 비례해 위로 솟구치는 힘을 더함
        const upForce = 0.05 + (Math.abs(shipSpeed) * 0.005);

        if (currentShipType === 2) {
            // 거북선 용머리에서 연기 발생
            p.position.copy(shipGroup.position);
            p.position.y += 3.0;
            const localZ = -5.0;
            p.position.x += Math.sin(shipRot) * localZ;
            p.position.z += Math.cos(shipRot) * localZ;
            p.userData = {
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.03,
                    upForce + Math.random() * 0.04,
                    (Math.random() - 0.5) * 0.03
                ),
                life: 1.0,
                decay: 0.015
            };
        } else {
            // 쌍발 굴뚝에서 발생 (기본 증기선)
            const side = Math.random() > 0.5 ? 1 : -1;
            p.position.copy(shipGroup.position);
            p.position.y += 4.2;
            const localX = 0.5 * side;
            const localZ = 1.2;
            p.position.x += Math.sin(shipRot) * localZ + Math.cos(shipRot) * localX;
            p.position.z += Math.cos(shipRot) * localZ - Math.sin(shipRot) * localX;
            p.userData = {
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.03,
                    upForce + Math.random() * 0.04,
                    (Math.random() - 0.5) * 0.03
                ),
                life: 1.0,
                decay: 0.015
            };
        }
    } else {
        // 배 후미에서 발생 (물보라)
        p.position.copy(shipGroup.position);
        p.position.x += Math.sin(shipRot) * 2.5;
        p.position.z += Math.cos(shipRot) * 2.5;
        p.position.y = getWaterHeight(p.position.x, p.position.z, time);
        p.position.x += (Math.random() - 0.5) * 2.0;
        p.position.z += (Math.random() - 0.5) * 2.0;
        p.userData = { vel: new THREE.Vector3(0, 0, 0), life: 1.0, decay: 0.03 };
    }

    scene.add(p);
    particles.push(p);
}

export function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.vel);
        p.userData.life -= p.userData.decay;
        p.scale.setScalar(Math.max(0.01, p.userData.life));
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }
}
