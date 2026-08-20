import {
    darkWoodMat,
    woodMat,
    koreanSailMat,
    dragonWoodMat,
    dragonDarkMat,
    dragonHornMat,
    dragonEyeMat,
    dragonEyeWhiteMat,
    dragonEyeIrisMat,
    dragonEyePupilMat,
    dragonEyeRimMat,
    dragonToothMat,
    dragonThroatMat,
    fireEmberMat,
    lanternGlowMat,
    brassMat,
    redShieldMat,
    blueShieldMat
} from '../materials.js';
import { shipGroup, clearShip, activeOars, activeSails, registerShipLight } from './shipManager.js';
import { createOar } from './viking.js';

// ============================================================
//  용머리 (Turtle Ship Dragon Head)
//  - 전통 목조/청동 조각상 양식의 정밀 모델링
//  - 유색 눈 (황금 테두리 + 흰자위 + 발광 붉은 홍채 + 세로 동공)
//  - MeshStandardMaterial 적용
// ============================================================
export function createTurtleDragonHead() {
    const headGroup = new THREE.Group();

    // ────────────────────────────────────────────────────────
    // 1. 목 부분 (Neck Column) - 아래로 길게 연결되는 기둥 형태
    // ────────────────────────────────────────────────────────
    const neckGroup = new THREE.Group();
    const neckTotalHeight = 1.9;
    const neckRadiusBottom = 0.58;
    const neckRadiusTop = 0.44;

    // 목 메인 기둥 (살짝 앞쪽으로 굽이치며 올라가는 유기적 형태)
    const neckMainGeo = new THREE.CylinderGeometry(neckRadiusTop, neckRadiusBottom, neckTotalHeight, 18);
    neckMainGeo.translate(0, neckTotalHeight / 2, 0);
    const neckMain = new THREE.Mesh(neckMainGeo, dragonWoodMat);
    neckMain.rotation.x = -0.22; // 완만하게 앞쪽으로 전진하는 각도
    neckGroup.add(neckMain);

    // 전통 목조각의 마디/비늘 링 (Neck Rings / Collars)
    const ringCount = 5;
    for (let i = 1; i <= ringCount; i++) {
        const t = i / (ringCount + 1);
        const ringRadius = THREE.MathUtils.lerp(neckRadiusBottom + 0.06, neckRadiusTop + 0.05, t);
        const ringGeo = new THREE.TorusGeometry(ringRadius, 0.045, 8, 18);
        const ringMesh = new THREE.Mesh(ringGeo, dragonDarkMat);
        ringMesh.rotation.x = Math.PI / 2 - 0.22;
        const ry = THREE.MathUtils.lerp(0.2, neckTotalHeight - 0.2, t);
        const rz = Math.sin(-0.22) * ry;
        ringMesh.position.set(0, Math.cos(-0.22) * ry, rz);
        neckGroup.add(ringMesh);
    }
    headGroup.add(neckGroup);

    // 목 끝 좌표
    const neckTopY = Math.cos(-0.22) * neckTotalHeight;
    const neckTopZ = Math.sin(-0.22) * neckTotalHeight;

    // 목-두상 연결 조인트 (목덜미 갈기 장식)
    const neckJoint = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 14), dragonWoodMat);
    neckJoint.position.set(0, neckTopY, neckTopZ);
    headGroup.add(neckJoint);

    // ────────────────────────────────────────────────────────
    // 2. 머리/얼굴 부분 (Head & Skull) - 길쭉한 형태의 기본 두상
    // ────────────────────────────────────────────────────────
    const headOrigin = new THREE.Group();
    headOrigin.position.set(0, neckTopY + 0.05, neckTopZ - 0.55);

    // 2-1. 후두부 / 두개골 (Cranium & Back Head)
    const skullGeo = new THREE.BoxGeometry(1.05, 0.85, 0.95);
    const skull = new THREE.Mesh(skullGeo, dragonWoodMat);
    skull.position.set(0, 0.2, 0.1);
    headOrigin.add(skull);

    // 2-2. 이마 및 눈썹 융기 (Forehead & Brow Ridges)
    const browGeo = new THREE.BoxGeometry(1.12, 0.28, 0.65);
    const brow = new THREE.Mesh(browGeo, dragonDarkMat);
    brow.position.set(0, 0.42, -0.22);
    headOrigin.add(brow);

    // 2-3. 길쭉한 주둥이 (Elongated Snout - 윗입 상단)
    const snoutGeo = new THREE.BoxGeometry(0.92, 0.32, 1.25);
    const snout = new THREE.Mesh(snoutGeo, dragonWoodMat);
    snout.position.set(0, 0.05, -0.85);
    headOrigin.add(snout);

    // 콧등 중앙 능선 (Nose Bridge Ridge)
    const noseRidgeGeo = new THREE.BoxGeometry(0.35, 0.15, 1.15);
    const noseRidge = new THREE.Mesh(noseRidgeGeo, dragonDarkMat);
    noseRidge.position.set(0, 0.25, -0.85);
    headOrigin.add(noseRidge);

    // 콧구멍 (Nostrils)
    [-0.24, 0.24].forEach(x => {
        const nostrilGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.18, 10);
        const nostril = new THREE.Mesh(nostrilGeo, dragonDarkMat);
        nostril.rotation.x = Math.PI / 2.5;
        nostril.position.set(x, 0.24, -1.38);
        headOrigin.add(nostril);
    });

    // ────────────────────────────────────────────────────────
    // 3. 눈과 뿔 (Eyes & Horns)
    // ────────────────────────────────────────────────────────
    // 3-1. 생동감 있는 유색 눈 (Vibrant Eyes: 황금 안와 테두리 + 흰자위 + 발광 붉은 홍채 + 검은 동공)
    [-0.52, 0.52].forEach(x => {
        const side = x > 0 ? 1 : -1;
        const eyeGroup = new THREE.Group();
        eyeGroup.position.set(x, 0.28, -0.15);

        // 안와 테두리 (Gold/Bronze Eye Rim)
        const rimGeo = new THREE.TorusGeometry(0.17, 0.035, 8, 16);
        const rim = new THREE.Mesh(rimGeo, dragonEyeRimMat);
        rim.rotation.y = side * Math.PI / 2;
        eyeGroup.add(rim);

        // 흰자위 (White Sclera)
        const scleraGeo = new THREE.SphereGeometry(0.15, 16, 14);
        const sclera = new THREE.Mesh(scleraGeo, dragonEyeWhiteMat);
        sclera.scale.set(0.65, 1.0, 1.0);
        eyeGroup.add(sclera);

        // 선명하게 빛나는 홍채 (Glowing Ruby Red / Amber Iris)
        const irisGeo = new THREE.SphereGeometry(0.105, 16, 14);
        const iris = new THREE.Mesh(irisGeo, dragonEyeIrisMat);
        iris.position.set(side * 0.06, 0, 0);
        iris.scale.set(0.5, 1.0, 1.0);
        eyeGroup.add(iris);

        // 검은 동공 (Deep Black Pupil)
        const pupilGeo = new THREE.SphereGeometry(0.055, 12, 12);
        const pupil = new THREE.Mesh(pupilGeo, dragonEyePupilMat);
        pupil.position.set(side * 0.09, 0, 0);
        pupil.scale.set(0.4, 1.2, 0.6); // 날카로운 용의 세로 동공
        eyeGroup.add(pupil);

        headOrigin.add(eyeGroup);
    });

    // 3-2. 매끄러운 뿔 (Smooth Backward-Curving Horns)
    [-0.32, 0.32].forEach((x, idx) => {
        const hornGroup = new THREE.Group();
        hornGroup.position.set(x, 0.55, 0.05);

        // 세그먼트 1 (기저부)
        const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.6, 12), dragonHornMat);
        h1.position.set(0, 0.25, 0.1);
        h1.rotation.x = 0.65;
        h1.rotation.z = (idx === 0 ? -0.25 : 0.25);
        hornGroup.add(h1);

        // 세그먼트 2 (중간부)
        const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.55, 12), dragonHornMat);
        h2.position.set(idx === 0 ? -0.12 : 0.12, 0.58, 0.38);
        h2.rotation.x = 1.05;
        h2.rotation.z = (idx === 0 ? -0.4 : 0.4);
        hornGroup.add(h2);

        // 세그먼트 3 (끝단 원뿔)
        const h3 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.45, 12), dragonHornMat);
        h3.position.set(idx === 0 ? -0.25 : 0.25, 0.76, 0.72);
        h3.rotation.x = 1.35;
        h3.rotation.z = (idx === 0 ? -0.5 : 0.5);
        hornGroup.add(h3);

        // 보조 작은 뿔 (갈래뿔)
        const subHorn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32, 10), dragonHornMat);
        subHorn.position.set(idx === 0 ? -0.08 : 0.08, 0.42, 0.18);
        subHorn.rotation.x = 0.2;
        subHorn.rotation.z = (idx === 0 ? -0.6 : 0.6);
        hornGroup.add(subHorn);

        headOrigin.add(hornGroup);
    });

    // ────────────────────────────────────────────────────────
    // 4. 입과 연기 구멍 (Open Gaping Maw & Internal Smoke Cannon)
    // ────────────────────────────────────────────────────────
    // 4-1. 윗입턱 (Upper Jaw Base)
    const upperJawBase = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 1.25), dragonWoodMat);
    upperJawBase.position.set(0, -0.05, -0.85);
    headOrigin.add(upperJawBase);

    // 4-2. 아래턱 (Lower Jaw)
    const lowerJawGroup = new THREE.Group();
    lowerJawGroup.position.set(0, -0.22, -0.2);
    lowerJawGroup.rotation.x = 0.28;

    const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.22, 1.2), dragonWoodMat);
    lowerJaw.position.set(0, -0.1, -0.6);
    lowerJawGroup.add(lowerJaw);

    // 턱수염 조각 (Chin Beard)
    const beardGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
    const beard = new THREE.Mesh(beardGeo, dragonDarkMat);
    beard.rotation.x = -0.3;
    beard.position.set(0, -0.25, -1.05);
    lowerJawGroup.add(beard);

    headOrigin.add(lowerJawGroup);

    // 4-3. 목 뒤쪽/입 안쪽 유기적 구조 (Throat Cavity)
    const throatGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.8, 12);
    const throat = new THREE.Mesh(throatGeo, dragonThroatMat);
    throat.rotation.x = Math.PI / 2;
    throat.position.set(0, -0.12, -0.35);
    headOrigin.add(throat);

    // 4-4. 입 안쪽 화포/연기 방출구 및 화염 광원
    const cannonMuzzleGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.65, 14, 1, true);
    const cannonMuzzle = new THREE.Mesh(cannonMuzzleGeo, dragonDarkMat);
    cannonMuzzle.rotation.x = Math.PI / 2;
    cannonMuzzle.position.set(0, -0.12, -0.75);
    headOrigin.add(cannonMuzzle);

    // 입 안쪽 불타는 화염 코어
    const fireCore = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), fireEmberMat);
    fireCore.position.set(0, -0.12, -0.70);
    headOrigin.add(fireCore);

    // 전방 화염 방출 스포트라이트 (Maw Fire Projector)
    const flameSpot = new THREE.SpotLight(0xff3a00, 0, 65, Math.PI / 3.0, 0.5, 1.2);
    flameSpot.position.set(0, -0.12, -0.75);
    flameSpot.target.position.set(0, -0.8, -25);
    headOrigin.add(flameSpot);
    headOrigin.add(flameSpot.target);

    // 구강 주변 보조 화염광
    const flamePoint = new THREE.PointLight(0xff5500, 0, 16, 2.0);
    flamePoint.position.set(0, -0.12, -0.8);
    headOrigin.add(flamePoint);

    registerShipLight({
        type: 'dragon_flame',
        light: flameSpot,
        pointLight: flamePoint,
        mesh: fireCore,
        baseIntensity: 2.2
    });

    // 4-5. 날카로운 이빨 및 대형 송곳니 (Fangs & Teeth)
    [-0.34, 0.34].forEach(x => {
        const bigFang = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.28, 8), dragonToothMat);
        bigFang.position.set(x, -0.18, -1.35);
        bigFang.rotation.x = Math.PI - 0.15;
        headOrigin.add(bigFang);
    });

    for (let i = 0; i < 5; i++) {
        const tz = -1.2 + i * 0.18;
        [-0.36, 0.36].forEach(x => {
            const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 6), dragonToothMat);
            tooth.position.set(x, -0.16, tz);
            tooth.rotation.x = Math.PI;
            headOrigin.add(tooth);
        });
    }

    [-0.30, 0.30].forEach(x => {
        const bigBotFang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 8), dragonToothMat);
        bigBotFang.position.set(x, 0.08, -1.1);
        bigBotFang.rotation.x = 0.2;
        lowerJawGroup.add(bigBotFang);
    });

    for (let i = 0; i < 4; i++) {
        const tz = -0.95 + i * 0.18;
        [-0.32, 0.32].forEach(x => {
            const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.16, 6), dragonToothMat);
            tooth.position.set(x, 0.06, tz);
            lowerJawGroup.add(tooth);
        });
    }

    headGroup.add(headOrigin);

    // 4-6. 연기 방출 기준점
    const smokePoint = new THREE.Object3D();
    smokePoint.position.set(0, neckTopY - 0.08, neckTopZ - 1.95);
    headGroup.add(smokePoint);

    return headGroup;
}

// ────────────────────────────────────────────────────────────
//  헬퍼: 조선식 청사초롱 / 호롱등 (Joseon Traditional Lantern)
// ────────────────────────────────────────────────────────────
function createJoseonLantern(x, y, z, isRed = true, offset = 0) {
    const lg = new THREE.Group();
    lg.position.set(x, y, z);

    // 상단 황동 고리
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 4, 12), brassMat);
    ring.position.y = 0.20;
    lg.add(ring);

    // 한지/비단 등불 몸통 (Lantern Body)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 8), lanternGlowMat);
    body.position.y = 0.05;
    lg.add(body);

    // 상하단 목재 마개
    [0.17, -0.07].forEach(dy => {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 8), darkWoodMat);
        cap.position.y = dy;
        lg.add(cap);
    });

    // 하단 장식 수술 (Tassel)
    const tassel = new THREE.Mesh(
        new THREE.ConeGeometry(0.035, 0.14, 6),
        isRed ? redShieldMat : blueShieldMat
    );
    tassel.position.y = -0.15;
    lg.add(tassel);

    // 내부 호롱불 광원 (Warm Lantern Light)
    const pLight = new THREE.PointLight(0xffaa22, 0, 16, 2.0);
    pLight.position.set(0, 0.05, 0);
    lg.add(pLight);

    registerShipLight({
        type: 'lantern',
        light: pLight,
        baseIntensity: 1.2,
        offset: offset * 2.0
    });

    return lg;
}

// ============================================================
//  거북선 전체 선체 빌드
// ============================================================
export function buildTurtleShip() {
    clearShip();

    // 1. 하부 선체
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 5.5), darkWoodMat);
    shipGroup.add(baseMesh);

    // 좌우 겹판 선체 벽
    for (let i = 0; i < 3; i++) {
        const sideGeo = new THREE.BoxGeometry(0.2, 0.4, 6.0 + i * 0.2);
        const sideL = new THREE.Mesh(sideGeo, darkWoodMat);
        sideL.position.set(-1.2 - i * 0.2, 0.2 + i * 0.3, 0);
        sideL.rotation.z = -0.15;
        shipGroup.add(sideL);

        const sideR = new THREE.Mesh(sideGeo, darkWoodMat);
        sideR.position.set(1.2 + i * 0.2, 0.2 + i * 0.3, 0);
        sideR.rotation.z = 0.15;
        shipGroup.add(sideR);
    }

    // 선수/선미 장갑
    const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 0.4), darkWoodMat);
    frontMesh.position.set(0, 0.5, -3.1);
    frontMesh.rotation.x = -0.15;
    shipGroup.add(frontMesh);

    const backMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 0.4), darkWoodMat);
    backMesh.position.set(0, 0.5, 3.1);
    backMesh.rotation.x = 0.15;
    shipGroup.add(backMesh);

    // 갑판
    const deckMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.2, 6.4),
        new THREE.MeshPhongMaterial({ color: 0x3d2b1f })
    );
    deckMesh.position.set(0, 1.0, 0);
    shipGroup.add(deckMesh);

    // 2. 도깨비 얼굴 장식 (귀면)
    const demonGroup = new THREE.Group();
    demonGroup.position.set(0, 0.6, -3.3);

    const demonBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16),
        new THREE.MeshPhongMaterial({ color: 0x551111 })
    );
    demonBase.rotation.x = Math.PI / 2;
    demonGroup.add(demonBase);

    const dEyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const dEyeMat = new THREE.MeshPhongMaterial({ color: 0xffcc00, emissive: 0xaa8800 });
    [-0.25, 0.25].forEach(xOff => {
        const eye = new THREE.Mesh(dEyeGeo, dEyeMat);
        eye.position.set(xOff, 0.15, -0.05);
        demonGroup.add(eye);
    });

    const dTooth = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.25, 4),
        new THREE.MeshPhongMaterial({ color: 0xffffff })
    );
    for (let i = -2; i <= 2; i++) {
        const t = dTooth.clone();
        t.position.set(i * 0.18, -0.25, -0.05);
        demonGroup.add(t);
    }
    shipGroup.add(demonGroup);

    // 3. 지붕 (등껍질 - 육각형 철갑 스케일)
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 1.1, 0);

    const ironMat = new THREE.MeshPhongMaterial({ color: 0x2a2e35, shininess: 80, flatShading: true });
    const roofBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 6.2, 10, 1, false, 0, Math.PI),
        ironMat
    );
    roofBase.rotation.z = Math.PI / 2;
    roofBase.rotation.y = Math.PI / 2;
    roofGroup.add(roofBase);

    const scaleGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 6);
    const spikeGeo = new THREE.ConeGeometry(0.04, 0.45, 4);
    const spikeMat = new THREE.MeshPhongMaterial({ color: 0x999999, shininess: 100 });

    for (let a = Math.PI / 10; a < Math.PI; a += Math.PI / 8) {
        for (let l = -2.9; l <= 2.9; l += 0.42) {
            const scale = new THREE.Mesh(scaleGeo, ironMat);
            scale.position.set(Math.cos(a) * 1.82, Math.sin(a) * 1.82, l);
            scale.rotation.x = Math.PI / 2;
            scale.rotation.z = -a;
            scale.add(new THREE.Mesh(spikeGeo, spikeMat));
            roofGroup.add(scale);
        }
    }
    shipGroup.add(roofGroup);

    // 4. 거북선 등(철갑 지붕) 위 전통 돛 2개 (앞돛 & 본돛)
    const mastConfigs = [
        { z: -1.0, mastH: 4.6, sailW: 2.7, sailH: 2.8, yBase: 2.2, battens: 4 }, // 앞돛 (Fore Mast)
        { z: 1.1, mastH: 5.5, sailW: 3.2, sailH: 3.4, yBase: 2.2, battens: 5 }  // 본돛 (Main Mast)
    ];

    for (let i = 0; i < mastConfigs.length; i++) {
        const cfg = mastConfigs[i];

        // 돛대 기둥 (Mast)
        const mastGeo = new THREE.CylinderGeometry(0.08, 0.12, cfg.mastH, 12);
        const mast = new THREE.Mesh(mastGeo, darkWoodMat);
        mast.position.set(0, cfg.yBase + cfg.mastH / 2, cfg.z);
        shipGroup.add(mast);

        // 최상단 가로대 (Yard / Crossbar)
        const yardGeo = new THREE.CylinderGeometry(0.045, 0.045, cfg.sailW + 0.3, 8);
        const yard = new THREE.Mesh(yardGeo, darkWoodMat);
        yard.rotation.z = Math.PI / 2;
        yard.position.set(0, cfg.yBase + cfg.mastH - 0.2, cfg.z - 0.1);
        shipGroup.add(yard);

        // 전통 한선 돛 (황토색/삼베 캔버스)
        const sailGeo = new THREE.PlaneGeometry(cfg.sailW, cfg.sailH, 10, 10);
        const sail = new THREE.Mesh(sailGeo, koreanSailMat);
        sail.position.set(0, cfg.yBase + cfg.mastH / 2 + 0.3, cfg.z - 0.15);
        shipGroup.add(sail);
        activeSails.push(sailGeo);

        // 조선식 대나무 멍에살 (Horizontal bamboo battens)
        const battenStep = cfg.sailH / (cfg.battens + 1);
        for (let b = 1; b <= cfg.battens; b++) {
            const bGeo = new THREE.CylinderGeometry(0.025, 0.025, cfg.sailW * 0.96, 6);
            const batten = new THREE.Mesh(bGeo, woodMat);
            batten.rotation.z = Math.PI / 2;
            batten.position.set(0, cfg.yBase + 1 + b * battenStep, cfg.z - 0.18);
            shipGroup.add(batten);
        }

        // 돛대 상단 장수기 / 깃발 (Flag - 돛대 중앙 X=0 정렬)
        const flagGeo = new THREE.PlaneGeometry(0.55, 0.38);
        const flagMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0xcc2222 : 0x2233cc, side: THREE.DoubleSide });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0, cfg.yBase + cfg.mastH + 0.18, cfg.z - 0.08);
        shipGroup.add(flag);

        // 돛대 가로대 양 끝 조선식 전통 등불/청사초롱
        const lanternY = cfg.yBase + cfg.mastH - 0.45;
        const halfYard = (cfg.sailW + 0.25) / 2;
        shipGroup.add(createJoseonLantern(-halfYard, lanternY, cfg.z - 0.1, i === 0, i * 1.5));
        shipGroup.add(createJoseonLantern( halfYard, lanternY, cfg.z - 0.1, i !== 0, i * 1.5 + 0.7));
    }

    // 4. 화포 및 노
    const cannonMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    for (let z = -2.0; z <= 2.0; z += 1.0) {
        const cannonGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8);

        const cannonL = new THREE.Mesh(cannonGeo, cannonMat);
        cannonL.rotation.z = Math.PI / 2;
        cannonL.position.set(-1.8, 0.7, z);
        shipGroup.add(cannonL);

        const cannonR = new THREE.Mesh(cannonGeo, cannonMat);
        cannonR.rotation.z = -Math.PI / 2;
        cannonR.position.set(1.8, 0.7, z);
        shipGroup.add(cannonR);

        const oarL = createOar();
        oarL.position.set(-1.6, 0.3, z + 0.5);
        oarL.rotation.z = -Math.PI / 4;
        oarL.children[2].rotation.y = Math.PI / 2;
        shipGroup.add(oarL);
        activeOars.push({ mesh: oarL, side: 1, baseRotZ: -Math.PI / 4 });

        const oarR = createOar();
        oarR.position.set(1.6, 0.3, z + 0.5);
        oarR.rotation.z = Math.PI / 4;
        oarR.children[2].rotation.y = Math.PI / 2;
        shipGroup.add(oarR);
        activeOars.push({ mesh: oarR, side: -1, baseRotZ: Math.PI / 4 });
    }

    // 5. 선미 꼬리 장식
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.4), darkWoodMat);
    tailMesh.position.set(0, 1.2, 3.2);
    tailMesh.rotation.x = -0.5;
    shipGroup.add(tailMesh);

    // 6. 초정밀 용머리 부착 (선수 갑판 끝부분)
    const headGroup = createTurtleDragonHead();
    headGroup.position.set(0, 0.85, -3.0);
    shipGroup.add(headGroup);
}
