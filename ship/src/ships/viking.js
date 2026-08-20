// ships/viking.js - 역사 고증 바이킹 드래카르(Drakkar) 롱십 (고유 야간 화로 조명 시스템)
import {
    woodMat, darkWoodMat, metalMat, whiteMat,
    shieldMat, redShieldMat, yellowShieldMat, blueShieldMat, ropeMat,
    dragonEyeMat, fireEmberMat
} from '../materials.js';
import { shipGroup, clearShip, activeSails, activeOars, registerShipLight } from './shipManager.js';

// ────────────────────────────────────────────────────────────
//  헬퍼 — 리깅 밧줄
// ────────────────────────────────────────────────────────────
function createRope(p1, p2, radius = 0.013) {
    const v1 = new THREE.Vector3(...p1);
    const v2 = new THREE.Vector3(...p2);
    const dist = v1.distanceTo(v2);
    const ropeGeo = new THREE.CylinderGeometry(radius, radius, dist, 6);
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.copy(v1.clone().add(v2).multiplyScalar(0.5));
    rope.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        v2.clone().sub(v1).normalize()
    );
    rope.castShadow = true;
    return rope;
}

// ────────────────────────────────────────────────────────────
//  헬퍼 — 철제 화로 (Iron Brazier) & 타오르는 숯불
// ────────────────────────────────────────────────────────────
function createIronBrazier(x, y, z, offset = 0) {
    const bg = new THREE.Group();
    bg.position.set(x, y, z);

    // 1. 삼각 철제 다리 (Tripod legs)
    for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), metalMat);
        leg.position.set(Math.cos(ang) * 0.12, -0.12, Math.sin(ang) * 0.12);
        leg.rotation.z = Math.cos(ang) * 0.25;
        leg.rotation.x = Math.sin(ang) * -0.25;
        leg.castShadow = true;
        bg.add(leg);
    }

    // 2. 화로 그릇 (Iron Fire Bowl)
    const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.15, 0.14, 12), metalMat);
    bowl.position.y = 0.08;
    bowl.castShadow = true;
    bg.add(bowl);

    // 3. 붉게 타오르는 숯불 덩어리 (Glowing Embers)
    const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 8), fireEmberMat);
    ember.position.y = 0.14;
    ember.scale.set(1.0, 0.55, 1.0);
    bg.add(ember);

    // 4. 화염 광원 (PointLight with warm fire hue 0xff6611)
    const pLight = new THREE.PointLight(0xff6611, 0, 24, 1.8);
    pLight.position.set(0, 0.28, 0);
    bg.add(pLight);

    // 조명 관리자에 등록 (Flickering Fire)
    registerShipLight({
        type: 'flicker_brazier',
        light: pLight,
        mesh: ember,
        baseIntensity: 1.8,
        speed: 13 + offset * 2,
        offset: offset * 3.14
    });

    return bg;
}

// ────────────────────────────────────────────────────────────
//  정밀 방패 (Historical Round Shield)
// ────────────────────────────────────────────────────────────
function createDetailedShield(material) {
    const g = new THREE.Group();

    // 목재 원판
    const discGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.045, 24);
    discGeo.rotateX(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, material);
    disc.castShadow = true;
    disc.receiveShadow = true;
    g.add(disc);

    // 외곽 철 림
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.018, 8, 28), metalMat);
    rim.castShadow = true;
    g.add(rim);

    // 중앙 반구형 엄보(Umbo) 베이스 + 돔
    const umboBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.025, 16), metalMat);
    umboBase.rotation.x = Math.PI / 2;
    umboBase.position.z = 0.022;
    g.add(umboBase);

    const umboDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), metalMat);
    umboDome.rotation.x = Math.PI / 2;
    umboDome.position.z = 0.025;
    umboDome.castShadow = true;
    g.add(umboDome);

    // 8방향 리벳 볼트
    for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        const bolt = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.04, 6), metalMat);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(Math.cos(angle) * 0.225, Math.sin(angle) * 0.225, 0.022);
        g.add(bolt);
    }
    return g;
}

// ────────────────────────────────────────────────────────────
//  정밀 노 (Oar)
// ────────────────────────────────────────────────────────────
export function createOar() {
    const g = new THREE.Group();

    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.032, 3.2, 8), woodMat);
    shaft.geometry.translate(0, -1.6, 0);
    shaft.castShadow = true;
    g.add(shaft);

    const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.030, 0.40, 8), darkWoodMat);
    grip.position.y = 0.12;
    grip.castShadow = true;
    g.add(grip);

    const bladeGeo = new THREE.BoxGeometry(0.17, 0.95, 0.038);
    bladeGeo.translate(0, -2.75, 0);
    const blade = new THREE.Mesh(bladeGeo, woodMat);
    blade.castShadow = true;
    g.add(blade);

    return g;
}

// ────────────────────────────────────────────────────────────
//  용머리: 오세베르그 스타일 S자 목 + 정교한 머리 조각
// ────────────────────────────────────────────────────────────
function createVikingDragonHead() {
    const hg = new THREE.Group();

    // 1. 목(Neck)
    const neckCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.30, 0.15),
        new THREE.Vector3(0, 0.25, 0.00),
        new THREE.Vector3(0, 0.90, -0.28),
        new THREE.Vector3(0, 1.55, -0.12),
        new THREE.Vector3(0, 1.90, -0.50),
        new THREE.Vector3(0, 2.10, -0.82)
    ]);
    const neckMesh = new THREE.Mesh(
        new THREE.TubeGeometry(neckCurve, 32, 0.185, 14, false), darkWoodMat);
    neckMesh.castShadow = true;
    neckMesh.receiveShadow = true;
    hg.add(neckMesh);

    // 등 지느러미
    const spineData = [
        { t: 0.20, h: 0.22 }, { t: 0.35, h: 0.30 },
        { t: 0.50, h: 0.36 }, { t: 0.65, h: 0.32 }, { t: 0.80, h: 0.24 }
    ];
    spineData.forEach(sd => {
        const pt = neckCurve.getPoint(sd.t);
        const tang = neckCurve.getTangent(sd.t);
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.055, sd.h, 5), shieldMat);
        fin.position.copy(pt);
        fin.rotation.x = tang.z * 1.2;
        fin.castShadow = true;
        hg.add(fin);
    });

    // 2. 머리 본체
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 2.10, -0.82);
    headPivot.rotation.x = 0.55;

    // 두개골
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.72), darkWoodMat);
    skull.castShadow = true;
    headPivot.add(skull);

    // 눈썹 능선
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.18), darkWoodMat);
    brow.position.set(0, 0.20, -0.20);
    brow.castShadow = true;
    headPivot.add(brow);

    // 상악
    const snoutGeo = new THREE.CylinderGeometry(0.04, 0.22, 0.88, 4);
    snoutGeo.rotateX(-Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeo, darkWoodMat);
    snout.position.set(0, -0.03, -0.76);
    snout.scale.set(1.0, 0.58, 1.0);
    snout.castShadow = true;
    headPivot.add(snout);

    // 하악
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.13, 0.82), darkWoodMat);
    jaw.position.set(0, -0.28, -0.52);
    jaw.rotation.x = 0.25;
    jaw.castShadow = true;
    headPivot.add(jaw);

    // 이빨
    const toothGeo = new THREE.ConeGeometry(0.032, 0.18, 4);
    [-0.14, -0.04, 0.04, 0.14].forEach(x => {
        for (let z = -0.38; z >= -0.80; z -= 0.18) {
            const t = new THREE.Mesh(toothGeo, whiteMat);
            t.position.set(x, -0.16, z);
            t.rotation.x = Math.PI;
            headPivot.add(t);
        }
        for (let z2 = -0.32; z2 >= -0.70; z2 -= 0.18) {
            const t2 = new THREE.Mesh(toothGeo, whiteMat);
            t2.position.set(x * 0.9, -0.22, z2);
            t2.rotation.x = 0.30;
            headPivot.add(t2);
        }
    });

    // 뿔 (자연스러운 단일 구간 뿔)
    [-0.20, 0.20].forEach(x => {
        const horn = new THREE.Mesh(
            new THREE.ConeGeometry(0.055, 0.65, 8), shieldMat);
        horn.position.set(x, 0.32, 0.12);
        horn.rotation.set(-0.70, 0, x > 0 ? 0.35 : -0.35);
        horn.castShadow = true;
        headPivot.add(horn);
    });

    // 눈 (금속 림 + 발광 동공)
    [-0.20, 0.20].forEach(x => {
        const eyeRim = new THREE.Mesh(
            new THREE.TorusGeometry(0.075, 0.018, 8, 16), metalMat);
        eyeRim.position.set(x, 0.12, -0.22);
        eyeRim.rotation.x = 0.18;
        headPivot.add(eyeRim);

        const eyeball = new THREE.Mesh(
            new THREE.SphereGeometry(0.065, 12, 10), dragonEyeMat);
        eyeball.position.set(x, 0.12, -0.22);
        headPivot.add(eyeball);
    });

    // 용머리 전방 붉은 안광 (Draconic Eye Gaze SpotLight)
    const eyeLight = new THREE.SpotLight(0xff2200, 0, 40, Math.PI / 4, 0.7, 1.2);
    eyeLight.position.set(0, 0.12, -0.3);
    eyeLight.target.position.set(0, -0.8, -15);
    headPivot.add(eyeLight);
    headPivot.add(eyeLight.target);

    registerShipLight({
        type: 'dragon_eye',
        light: eyeLight,
        baseIntensity: 1.5
    });

    hg.add(headPivot);
    return hg;
}

// ────────────────────────────────────────────────────────────
//  선미 꼬리
// ────────────────────────────────────────────────────────────
function createVikingSternTail() {
    const sg = new THREE.Group();

    const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.30, -0.15),
        new THREE.Vector3(0, 0.25, 0.00),
        new THREE.Vector3(0, 0.85, 0.20),
        new THREE.Vector3(0, 1.40, 0.00),
        new THREE.Vector3(0, 1.65, -0.38),
        new THREE.Vector3(0, 1.45, -0.65)
    ]);
    const tailMesh = new THREE.Mesh(
        new THREE.TubeGeometry(tailCurve, 28, 0.155, 12, false), darkWoodMat);
    tailMesh.castShadow = true;
    tailMesh.receiveShadow = true;
    sg.add(tailMesh);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), darkWoodMat);
    tip.position.set(0, 1.45, -0.65);
    tip.scale.set(1.0, 0.7, 1.3);
    tip.castShadow = true;
    sg.add(tip);

    return sg;
}

// ────────────────────────────────────────────────────────────
//  우현 방향타 (Side Rudder)
// ────────────────────────────────────────────────────────────
function createVikingSteeringRudder() {
    const rg = new THREE.Group();

    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 2.8, 8), darkWoodMat);
    shaft.position.y = -0.5;
    shaft.castShadow = true;
    rg.add(shaft);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 1.4, 0.40), woodMat);
    blade.position.set(0, -1.15, 0.14);
    blade.castShadow = true;
    rg.add(blade);

    const bladeTip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.40), metalMat);
    bladeTip.position.set(0, -1.87, 0.14);
    rg.add(bladeTip);

    const tiller = new THREE.Mesh(
        new THREE.CylinderGeometry(0.030, 0.030, 0.85, 6), woodMat);
    tiller.rotation.z = Math.PI / 2;
    tiller.position.set(-0.38, 0.62, 0);
    tiller.castShadow = true;
    rg.add(tiller);

    [0.10, -0.08].forEach(y => {
        const band = new THREE.Mesh(
            new THREE.TorusGeometry(0.068, 0.020, 6, 14), metalMat);
        band.position.y = y;
        rg.add(band);
    });

    return rg;
}

// ────────────────────────────────────────────────────────────
//  룬 문자 돛 텍스처 (Elder Futhark 룬 3종)
// ────────────────────────────────────────────────────────────
function createRunicSailTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const sw = 64;
    for (let x = 0; x < canvas.width; x += sw) {
        ctx.fillStyle = (Math.floor(x / sw)) % 2 === 0 ? '#b81c1c' : '#f5e8c8';
        ctx.fillRect(x, 0, sw, canvas.height);
    }
    ctx.fillStyle = '#6b1010';
    ctx.fillRect(canvas.width / 2 - 4, 0, 8, canvas.height);
    ctx.fillStyle = '#5a0e0e';
    ctx.fillRect(0, 20, canvas.width, 28);
    ctx.fillRect(0, canvas.height - 48, canvas.width, 28);

    ctx.strokeStyle = '#f0d090';
    ctx.lineWidth = 5;
    ctx.lineCap = 'square';
    const cx = canvas.width / 2;

    // Tiwaz (↑)
    ctx.beginPath();
    ctx.moveTo(cx, 90); ctx.lineTo(cx, 160);
    ctx.moveTo(cx - 20, 108); ctx.lineTo(cx, 90); ctx.lineTo(cx + 20, 108);
    ctx.stroke();

    // Algiz (Y)
    ctx.beginPath();
    ctx.moveTo(cx, 210); ctx.lineTo(cx, 280);
    ctx.moveTo(cx, 240); ctx.lineTo(cx - 20, 220);
    ctx.moveTo(cx, 240); ctx.lineTo(cx + 20, 220);
    ctx.stroke();

    // Othala (◇)
    ctx.beginPath();
    ctx.moveTo(cx, 320); ctx.lineTo(cx + 28, 355); ctx.lineTo(cx, 390);
    ctx.lineTo(cx - 28, 355); ctx.lineTo(cx, 320);
    ctx.moveTo(cx - 28, 355); ctx.lineTo(cx - 28, 390);
    ctx.moveTo(cx + 28, 355); ctx.lineTo(cx + 28, 390);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
}

// ────────────────────────────────────────────────────────────
//  메인 빌드 함수
// ────────────────────────────────────────────────────────────
export function buildVikingShip() {
    clearShip();

    // ── 1. 선체 (Hull)
    const hullMat = new THREE.MeshPhongMaterial({
        color: 0x8B5A2B,
        side: THREE.DoubleSide
    });

    const hullGeo = new THREE.BoxGeometry(2.3, 1.40, 10.5, 18, 14, 30);
    const pos = hullGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const yNorm = (y + 0.70) / 1.40;
        const zNorm = z / 5.25;

        const bowF = Math.pow(Math.max(0.02, 1.0 - Math.pow(zNorm * 1.05, 2)), 0.40);
        const sternF = Math.pow(Math.max(0.04, 1.0 - Math.pow(-zNorm * 0.92, 2)), 0.44);
        const planW = z < 0 ? bowF : sternF;
        x *= planW;

        const normX = Math.min(1.0, Math.abs(x) / Math.max(0.01, 1.15 * planW));
        if (yNorm < 0.82) {
            const lift = (1.0 - Math.cos(normX * Math.PI * 0.5)) * 0.38
                * Math.pow(1.0 - yNorm / 0.82, 1.4);
            y += lift;
        }

        x *= (0.30 + 0.70 * Math.pow(yNorm, 0.65));

        const keel = Math.pow(zNorm, 2) * 0.22;
        const bowS = Math.pow(Math.max(0, -z - 1.5) / 3.75, 1.6) * 1.30;
        const sternS = Math.pow(Math.max(0, z - 1.5) / 3.75, 1.6) * 1.05;
        y += keel + (bowS + sternS) * (1.10 - yNorm * 0.25);

        pos.setXYZ(i, x, y, z);
    }
    hullGeo.computeVertexNormals();

    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.position.y = 0.18;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    shipGroup.add(hullMesh);

    // ── 2. 내부 늑골(Thwarts) 및 화물
    for (let z = -2.8; z <= 2.8; z += 0.80) {
        const bench = new THREE.Mesh(
            new THREE.BoxGeometry(1.62, 0.075, 0.20), darkWoodMat);
        bench.position.set(0, 0.58, z);
        bench.castShadow = true;
        bench.receiveShadow = true;
        shipGroup.add(bench);

        [-0.55, 0.55].forEach(xp => {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.035, 0.035, 0.20, 6), darkWoodMat);
            post.position.set(xp, 0.47, z);
            post.castShadow = true;
            shipGroup.add(post);
        });
    }

    // 오크통 3개 + 화물 상자 2개
    const barrelGeo = new THREE.CylinderGeometry(0.19, 0.23, 0.48, 14);
    [[-0.40, 0.56, 0.40], [-0.40, 0.56, -0.40], [0.40, 0.56, 0.00]]
        .forEach(p => {
            const b = new THREE.Mesh(barrelGeo, darkWoodMat);
            b.position.set(p[0], p[1], p[2]);
            b.castShadow = true;
            shipGroup.add(b);
            [0.10, -0.10].forEach(dy => {
                const hoop = new THREE.Mesh(
                    new THREE.TorusGeometry(0.21, 0.012, 6, 16), metalMat);
                hoop.rotation.x = Math.PI / 2;
                hoop.position.set(p[0], p[1] + dy, p[2]);
                shipGroup.add(hoop);
            });
        });

    const crateGeo = new THREE.BoxGeometry(0.36, 0.30, 0.36);
    [[0.40, 0.50, 0.50], [0.40, 0.50, -0.50]].forEach((p, i) => {
        const c = new THREE.Mesh(crateGeo, woodMat);
        c.position.set(p[0], p[1], p[2]);
        c.rotation.y = i * 0.20;
        c.castShadow = true;
        shipGroup.add(c);
    });

    // ── 3. 야간 테마 광원: 선수 & 선미 철제 화로 (Iron Braziers)
    const bowBrazier = createIronBrazier(0, 0.76, -3.2, 0.1);
    shipGroup.add(bowBrazier);

    const sternBrazier = createIronBrazier(0, 0.76, 3.2, 0.9);
    shipGroup.add(sternBrazier);

    // ── 4. 용머리, 선미 꼬리, 방향타
    const dragonHead = createVikingDragonHead();
    dragonHead.position.set(0, 1.72, -4.90);
    dragonHead.rotation.x = -0.28;
    shipGroup.add(dragonHead);

    const sternTail = createVikingSternTail();
    sternTail.position.set(0, 1.62, 4.90);
    sternTail.rotation.x = 0.28;
    shipGroup.add(sternTail);

    const rudder = createVikingSteeringRudder();
    rudder.position.set(1.18, 0.42, 3.8);
    rudder.rotation.y = -0.12;
    shipGroup.add(rudder);

    // ── 5. 돛대 시스템
    const mastStep = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.30, 0.65), darkWoodMat);
    mastStep.position.set(0, 0.45, 0);
    mastStep.castShadow = true;
    shipGroup.add(mastStep);

    const partner = new THREE.Mesh(
        new THREE.BoxGeometry(1.10, 0.08, 0.30), darkWoodMat);
    partner.position.set(0, 0.62, 0);
    partner.castShadow = true;
    shipGroup.add(partner);

    const mastMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.145, 6.5, 12), darkWoodMat);
    mastMesh.position.set(0, 3.65, 0);
    mastMesh.castShadow = true;
    shipGroup.add(mastMesh);

    const masthead = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), metalMat);
    masthead.position.set(0, 6.92, 0);
    shipGroup.add(masthead);

    const yard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.048, 5.0, 10), darkWoodMat);
    yard.position.set(0, 6.0, -0.18);
    yard.rotation.z = Math.PI / 2;
    yard.castShadow = true;
    shipGroup.add(yard);

    [-2.50, 2.50].forEach(x => {
        const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.068, 0.068, 0.15, 8), shieldMat);
        cap.rotation.z = Math.PI / 2;
        cap.position.set(x, 6.0, -0.18);
        shipGroup.add(cap);
    });

    // ── 6. 리깅 (포어스테이, 백스테이, 슈라우드, 브레이스, 핼야드)
    shipGroup.add(createRope([0, 6.88, 0.0], [0, 1.80, -4.75], 0.016));
    shipGroup.add(createRope([0, 6.88, 0.0], [0, 1.70, 4.75], 0.014));
    [-1.10, 1.10].forEach(x => {
        shipGroup.add(createRope([0, 6.60, 0], [x, 0.90, -0.8]));
        shipGroup.add(createRope([0, 6.60, 0], [x, 0.90, 0.8]));
        shipGroup.add(createRope([0, 6.60, 0], [x, 0.90, 2.2]));
    });
    shipGroup.add(createRope([-2.45, 6.0, -0.18], [-1.05, 0.90, 2.4]));
    shipGroup.add(createRope([2.45, 6.0, -0.18], [1.05, 0.90, 2.4]));
    shipGroup.add(createRope([0, 6.05, -0.18], [0, 0.62, 0.65], 0.011));

    // ── 7. 룬 문자 돛 (바람에 부푼 3D 곡면)
    const runicSailMat = new THREE.MeshPhongMaterial({
        map: createRunicSailTexture(),
        side: THREE.DoubleSide
    });
    const sailGeo = new THREE.PlaneGeometry(4.4, 3.6, 16, 16);
    const sPos = sailGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
        const u = sPos.getX(i) / 2.2;
        const v = sPos.getY(i) / 1.8;
        const bulge = (1.0 - u * u) * (1.0 - v * v * 0.4) * 0.38;
        sPos.setZ(i, sPos.getZ(i) + bulge);
    }
    sailGeo.computeVertexNormals();
    const sailMesh = new THREE.Mesh(sailGeo, runicSailMat);
    sailMesh.position.set(0, 4.20, -0.30);
    sailMesh.castShadow = true;
    sailMesh.receiveShadow = true;
    shipGroup.add(sailMesh);
    activeSails.push(sailGeo);

    // ── 8. 방패 (8쌍)
    const shieldMats = [
        redShieldMat, yellowShieldMat, blueShieldMat,
        redShieldMat, yellowShieldMat, blueShieldMat,
        redShieldMat, yellowShieldMat
    ];
    shieldMats.forEach((mat, idx) => {
        const sz = -2.80 + idx * 0.80;

        const sL = createDetailedShield(mat);
        sL.position.set(-1.22, 0.82, sz);
        sL.rotation.y = -Math.PI / 2;
        sL.rotation.z = -0.08;
        sL.castShadow = true;
        shipGroup.add(sL);

        const altMat = shieldMats[(idx + 3) % shieldMats.length];
        const sR = createDetailedShield(altMat);
        sR.position.set(1.22, 0.82, sz);
        sR.rotation.y = Math.PI / 2;
        sR.rotation.z = 0.08;
        sR.castShadow = true;
        shipGroup.add(sR);
    });

    // ── 9. 노 (5쌍)
    for (let z = -2.0; z <= 2.0; z += 1.0) {
        const oarL = createOar();
        oarL.position.set(-1.12, 0.52, z);
        oarL.rotation.z = -Math.PI / 4;
        oarL.children[2].rotation.y = Math.PI / 2;
        shipGroup.add(oarL);
        activeOars.push({ mesh: oarL, side: 1, baseRotZ: -Math.PI / 4 });

        const oarR = createOar();
        oarR.position.set(1.12, 0.52, z);
        oarR.rotation.z = Math.PI / 4;
        oarR.children[2].rotation.y = Math.PI / 2;
        shipGroup.add(oarR);
        activeOars.push({ mesh: oarR, side: -1, baseRotZ: Math.PI / 4 });
    }
}
