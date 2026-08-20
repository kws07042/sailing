// materials.js - 전체에서 공유하는 재질(Material) 및 텍스처

// ── 기본 재질 ──────────────────────────────────────────────
export const woodMat     = new THREE.MeshPhongMaterial({ color: 0x8B5A2B });
export const darkWoodMat = new THREE.MeshPhongMaterial({ color: 0x3d2314 });
export const metalMat    = new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 100 });
export const whiteMat    = new THREE.MeshPhongMaterial({ color: 0xffffff });
export const sailMat       = new THREE.MeshPhongMaterial({ color: 0xeeeecc, side: THREE.DoubleSide });
export const koreanSailMat = new THREE.MeshPhongMaterial({ color: 0xd6b27c, side: THREE.DoubleSide });
export const shieldMat       = new THREE.MeshPhongMaterial({ color: 0xccaa33 });
export const redShieldMat    = new THREE.MeshPhongMaterial({ color: 0xb22222 });
export const yellowShieldMat = new THREE.MeshPhongMaterial({ color: 0xcc9922 });
export const blueShieldMat   = new THREE.MeshPhongMaterial({ color: 0x224488 });
export const ropeMat         = new THREE.MeshPhongMaterial({ color: 0x8a7a60 });

// ── 전통 목조/청동 조각상 전용 MeshStandardMaterial ─────────────
export const dragonWoodMat = new THREE.MeshStandardMaterial({
    color: 0x332014,
    roughness: 0.65,
    metalness: 0.18
});
export const dragonDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1e120b,
    roughness: 0.75,
    metalness: 0.12
});
export const dragonHornMat = new THREE.MeshStandardMaterial({
    color: 0x261910,
    roughness: 0.4,
    metalness: 0.25
});
export const dragonEyeMat = new THREE.MeshStandardMaterial({
    color: 0xff1100,
    roughness: 0.15,
    emissive: 0xff1100,
    emissiveIntensity: 1.2
});
export const dragonEyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.05
});
export const dragonEyeIrisMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    roughness: 0.1,
    emissive: 0xff1100,
    emissiveIntensity: 1.5
});
export const dragonEyePupilMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.05,
    metalness: 0.5
});
export const dragonEyeRimMat = new THREE.MeshStandardMaterial({
    color: 0xd4a017,
    roughness: 0.35,
    metalness: 0.7
});
export const dragonToothMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede0,
    roughness: 0.35,
    metalness: 0.05
});
export const dragonThroatMat = new THREE.MeshStandardMaterial({
    color: 0x0f0703,
    roughness: 0.9
});

// ── 조명 및 발광체 전용 재질 ──────────────────────────────────
export const fireEmberMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: 0xff4400,
    emissiveIntensity: 2.5,
    roughness: 0.2
});
export const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    emissive: 0xff9922,
    emissiveIntensity: 1.8,
    roughness: 0.4
});
export const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.25
});
export const lensGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1
});

// ── 줄무늬 돛 텍스처 ────────────────────────────────────────
function createStripedTexture() {
    const canvas = document.createElement('canvas');
    canvas.width  = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const stripeWidth = 64;
    for (let x = 0; x < canvas.width; x += stripeWidth) {
        ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? '#cc2222' : '#ffffff';
        ctx.fillRect(x, 0, stripeWidth, canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}
export const stripedSailMat = new THREE.MeshPhongMaterial({
    map: createStripedTexture(),
    side: THREE.DoubleSide
});

// ── 나무/섬 관련 재질 ────────────────────────────────────────
export const treeTrunkMat  = new THREE.MeshPhongMaterial({ color: 0x5c4033 });
export const treeLeavesMat = new THREE.MeshPhongMaterial({ color: 0x228b22, flatShading: true });

// ── 눈 날씨 전용 ─────────────────────────────────────────────
export const snowLeavesMat = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });
export const snowTrunkMat  = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });

// ── 섬 색상 팔레트 ───────────────────────────────────────────
export const islandColors = {
    sand:  [0xe6d690, 0xd4c37b, 0xf2e2a0, 0xdfce83],
    grass: [0x2d8a35, 0x427533, 0x315c26, 0x546b3f, 0x485e33],
    rock:  [0x666666, 0x555555, 0x777777, 0x444444, 0x3a3a3a]
};

export const snowSandColors  = [0xeeeeee, 0xdddddd, 0xf5f5f5];
export const snowGrassColors = [0xffffff, 0xf0f0f0, 0xe8e8e8];
export const snowRockColors  = [0xcccccc, 0xbbbbbb, 0xd4d4d4];
