// ships/steamboat.js - 증기선 모델 (19세기 빈티지 황동 탐조등 & 선실 백열등 조명)

import { woodMat, darkWoodMat, metalMat, whiteMat, brassMat, lensGlassMat } from '../materials.js';
import { shipGroup, clearShip, registerShipLight } from './shipManager.js';

export function buildSteamboat() {
    clearShip();

    // 1. 선체 (Hull)
    const hullGeo = new THREE.BoxGeometry(3, 1.5, 6, 8, 2, 8);
    const pos = hullGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const yNorm = (y + 0.75) / 1.5;
        if (z < -1) x *= (3 + z) / 2;
        else if (z > 2) x *= 0.8;
        x *= (0.5 + 0.5 * yNorm);
        if (z < -1) y += (-1 - z) * 0.3 * (1 - yNorm);
        if (z > 1.5) y += (z - 1.5) * 0.2 * (1 - yNorm);
        pos.setXYZ(i, x, y, z);
    }
    hullGeo.computeVertexNormals();
    hullGeo.scale(1, 1.3, 1);
    shipGroup.add(new THREE.Mesh(hullGeo, woodMat));

    // 2. 선실 (Cabin)
    const cabinMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 3), whiteMat);
    cabinMesh.position.set(0, 1.65, 0.5);
    shipGroup.add(cabinMesh);

    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 3.2), darkWoodMat);
    roofMesh.position.set(0, 2.3, 0.5);
    shipGroup.add(roofMesh);

    // 선실 내부 따뜻한 백열등
    const cabinLight = new THREE.PointLight(0xffaa44, 0, 14, 1.8);
    cabinLight.position.set(0, 1.65, 0.5);
    shipGroup.add(cabinLight);

    registerShipLight({
        type: 'cabin_glow',
        light: cabinLight,
        baseIntensity: 1.4
    });

    // 3. 조타실 (Helm)
    const helmMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.5), whiteMat);
    helmMesh.position.set(0, 2.75, -0.2);
    shipGroup.add(helmMesh);

    const helmRoofMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.7), darkWoodMat);
    helmRoofMesh.position.set(0, 3.2, -0.2);
    shipGroup.add(helmRoofMesh);

    // ── 3-1. 조타실 지붕 위 19세기 황동 서치라이트 (Brass Searchlight) ──
    const searchGroup = new THREE.Group();
    searchGroup.position.set(0, 3.48, -0.25);

    // 마운팅 브라켓
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 8), brassMat);
    bracket.position.y = -0.11;
    searchGroup.add(bracket);

    // 원통형 황동 케이스
    const casingGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 12);
    casingGeo.rotateX(-Math.PI / 2);
    const casing = new THREE.Mesh(casingGeo, brassMat);
    searchGroup.add(casing);

    // 전면 유리 렌즈
    const lensGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 12);
    lensGeo.rotateX(-Math.PI / 2);
    const lens = new THREE.Mesh(lensGeo, lensGlassMat);
    lens.position.z = -0.19;
    searchGroup.add(lens);

    // 강력한 전방 원추형 서치라이트 (SpotLight)
    const searchLight = new THREE.SpotLight(0xfffae0, 0, 90, Math.PI / 5.5, 0.35, 1.2);
    searchLight.position.set(0, 0, -0.2);
    searchLight.target.position.set(0, -1.0, -35);
    searchGroup.add(searchLight);
    searchGroup.add(searchLight.target);

    shipGroup.add(searchGroup);

    registerShipLight({
        type: 'searchlight',
        light: searchLight,
        baseIntensity: 2.6
    });

    // 4. 굴뚝 (쌍발)
    const stackGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5);
    [-0.5, 0.5].forEach(xOff => {
        const stack = new THREE.Mesh(stackGeo, metalMat);
        stack.position.set(xOff, 3.3, 1.2);
        stack.rotation.x = -0.15;
        shipGroup.add(stack);
    });

    // 5. 앞부분 돛대
    const mastMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 3.5), darkWoodMat);
    mastMesh.position.set(0, 2.3, -2.2);
    shipGroup.add(mastMesh);
}
