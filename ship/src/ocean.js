// ocean.js - 바다 메시 및 파도 계산

import { scene } from './scene.js';

// ── 바다 메시 ────────────────────────────────────────────────
export const oceanGeo = new THREE.PlaneGeometry(400, 400, 80, 80);
oceanGeo.rotateX(-Math.PI / 2);

const oceanMat = new THREE.MeshPhongMaterial({
    color: 0x1A5276,
    flatShading: true,
    shininess: 90
});

export const ocean = new THREE.Mesh(oceanGeo, oceanMat);
scene.add(ocean);

// ── 파도 높이 계산 (Standing Wave) ──────────────────────────
export function getWaterHeight(x, z, time) {
    const scale = 0.05;
    const speed = 1.0;
    let y = Math.sin(x * scale) * Math.cos(time * speed) * 0.4;
    y    += Math.cos(z * scale * 1.2) * Math.sin(time * speed * 0.8) * 0.4;
    return y;
}

// ── 파도 애니메이션 업데이트 (게임 루프에서 호출) ─────────────
export function updateOcean(shipX, shipZ, time) {
    ocean.position.x = shipX;
    ocean.position.z = shipZ;

    const verts = oceanGeo.attributes.position;
    for (let i = 0; i < verts.count; i++) {
        const x = verts.getX(i) + ocean.position.x;
        const z = verts.getZ(i) + ocean.position.z;
        verts.setY(i, getWaterHeight(x, z, time));
    }
    oceanGeo.computeVertexNormals();
    oceanGeo.attributes.position.needsUpdate = true;
}
