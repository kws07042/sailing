// world.js - 섬/나무/청크 생성 및 관리

import { scene } from './scene.js';
import {
    treeTrunkMat, treeLeavesMat,
    snowTrunkMat, snowLeavesMat,
    islandColors, snowSandColors, snowGrassColors, snowRockColors
} from './materials.js';
import { weatherMode } from './weather.js';

// ── 청크 설정 ─────────────────────────────────────────────────
export const CHUNK_SIZE  = 120;
export const RENDER_DIST = 3;

export const activeChunks  = new Map();
export const pendingChunks = new Set();
export const islands       = [];

// ── 최적화 팀 (무거운 작업을 프레임 단위로 분할) ──────────────
export class OptimizationTeam {
    constructor() {
        this.taskQueue    = [];
        this.isProcessing = false;
        this.maxWorkTimeMs = 12;
    }
    addTask(fn) {
        this.taskQueue.push(fn);
        if (!this.isProcessing) this.processQueue();
    }
    clearTasks() {
        this.taskQueue    = [];
        this.isProcessing = false;
    }
    processQueue() {
        if (this.taskQueue.length === 0) { this.isProcessing = false; return; }
        this.isProcessing = true;
        const startTime = performance.now();
        while (this.taskQueue.length > 0 && (performance.now() - startTime) < this.maxWorkTimeMs) {
            this.taskQueue.shift()();
        }
        if (this.taskQueue.length > 0) requestAnimationFrame(() => this.processQueue());
        else this.isProcessing = false;
    }
}
export const optimTeam = new OptimizationTeam();

// ── 유틸 ─────────────────────────────────────────────────────
export function seededRandom(x, z) {
    return (Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
}

// ── 나무 생성 ─────────────────────────────────────────────────
function createTree(isPalm = false) {
    // weatherMode import는 런타임에 참조하므로 최신 값 반영
    const { weatherMode: wm } = (typeof weatherMode !== 'undefined')
        ? { weatherMode }
        : { weatherMode: 0 };
    const tMat = (wm === 2) ? snowTrunkMat  : treeTrunkMat;
    const lMat = (wm === 2) ? snowLeavesMat : treeLeavesMat;

    const group = new THREE.Group();

    if (isPalm) {
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 6, 5);
        trunkGeo.translate(0, 3, 0);
        const trunk = new THREE.Mesh(trunkGeo, tMat);
        trunk.rotation.z = (Math.random() - 0.5) * 0.4;

        for (let i = 0; i < 6; i++) {
            const leafGeo = new THREE.BoxGeometry(0.8, 0.1, 4.5);
            leafGeo.translate(0, 0, 2.2);
            const leaf = new THREE.Mesh(leafGeo, lMat);
            leaf.position.set(0, 5.8, 0);
            leaf.rotation.y = (Math.PI * 2 / 6) * i;
            leaf.rotation.x = Math.PI / 5 + Math.random() * 0.2;
            trunk.add(leaf);
        }
        group.add(trunk);
    } else {
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 2.5, 5);
        trunkGeo.translate(0, 1.25, 0);
        const trunk = new THREE.Mesh(trunkGeo, tMat);

        [[1.6, 2.5, 2.5], [1.2, 2.0, 4.0], [0.8, 1.5, 5.2]].forEach(([r, h, y]) => {
            const geo = new THREE.ConeGeometry(r, h, 6);
            geo.translate(0, y, 0);
            trunk.add(new THREE.Mesh(geo, lMat));
        });
        group.add(trunk);
    }

    group.traverse(child => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    return group;
}

// ── 청크 생성 ─────────────────────────────────────────────────
export function generateChunk(cx, cz, currentWeatherMode) {
    const chunkGroup  = new THREE.Group();
    const islandCount = Math.floor(Math.abs(seededRandom(cx, cz)) * 3) + 1;

    for (let i = 0; i < islandCount; i++) {
        const rx     = seededRandom(cx + i, cz) - 0.5;
        const rz     = seededRandom(cx, cz + i) - 0.5;
        const worldX = cx * CHUNK_SIZE + rx * CHUNK_SIZE * 0.8;
        const worldZ = cz * CHUNK_SIZE + rz * CHUNK_SIZE * 0.8;
        const rad    = 6 + Math.abs(seededRandom(cx + i * 2, cz + i * 2)) * 12;

        const typeRoll = Math.abs(seededRandom(cx + i * 3, cz + i * 3));
        let type = 0;
        if (typeRoll < 0.3) type = 1;
        else if (typeRoll < 0.6) type = 2;

        const isSnow      = (currentWeatherMode === 2);
        const sandPalette = isSnow ? snowSandColors  : islandColors.sand;
        const grassPalette= isSnow ? snowGrassColors : islandColors.grass;
        const rockPalette = isSnow ? snowRockColors  : islandColors.rock;

        const pick = (pal, salt) => pal[Math.floor(Math.abs(seededRandom(cx + i, cz + salt)) * pal.length)];
        const sandMat  = new THREE.MeshPhongMaterial({ color: pick(sandPalette, 1),  flatShading: true });
        const grassMat = new THREE.MeshPhongMaterial({ color: pick(grassPalette, 2), flatShading: true });
        const rockMat  = new THREE.MeshPhongMaterial({ color: pick(rockPalette, 3),  flatShading: true });

        // 모래/잔디 베이스
        if (type === 0 || type === 1) {
            const baseRadius = (type === 1) ? rad * 4.0 : rad * 1.5;
            const baseHeight = (type === 1) ? rad * 1.2 : rad * 1.5;
            const base = new THREE.Mesh(new THREE.ConeGeometry(baseRadius, baseHeight, 16, 1), sandMat);
            base.position.set(worldX, (type === 1) ? -rad * 0.2 : -rad * 0.5, worldZ);
            chunkGroup.add(base);
        }

        if (type === 0) {
            const islandGeo = new THREE.ConeGeometry(rad, rad * 1.5, 16, 8);
            const pos = islandGeo.attributes.position;
            for (let j = 0; j < pos.count; j++) {
                let px = pos.getX(j), py = pos.getY(j), pz = pos.getZ(j);
                if (py > -rad * 0.5) {
                    const n = seededRandom(px + worldX, pz + worldZ) * 0.4;
                    px += px * n; pz += pz * n;
                }
                pos.setXYZ(j, px, py, pz);
            }
            islandGeo.computeVertexNormals();
            const island = new THREE.Mesh(islandGeo, grassMat);
            island.position.set(worldX, 0, worldZ);
            island.rotation.y = seededRandom(cx, cz) * Math.PI * 2;
            chunkGroup.add(island);
        } else if (type === 2) {
            const mountainGeo = new THREE.ConeGeometry(rad * 1.2, rad * 3.5, 12, 10);
            const pos = mountainGeo.attributes.position;
            for (let j = 0; j < pos.count; j++) {
                let px = pos.getX(j), py = pos.getY(j), pz = pos.getZ(j);
                const n = seededRandom(px + worldX, py + pz) * 0.5;
                px += px * n; pz += pz * n;
                pos.setXYZ(j, px, py, pz);
            }
            mountainGeo.computeVertexNormals();
            const mountain = new THREE.Mesh(mountainGeo, rockMat);
            mountain.position.set(worldX, rad * 0.5, worldZ);
            mountain.rotation.y = seededRandom(cx, cz) * Math.PI * 2;
            chunkGroup.add(mountain);
        }

        // 나무 배치 (레이캐스터로 지형 밀착)
        let treeCount = 0, isPalm = false;
        if (type === 1) { treeCount = 5 + Math.floor(Math.abs(seededRandom(cx, cz)) * 6); isPalm = true; }
        else if (type === 0) { treeCount = Math.floor(rad * 0.8); }

        chunkGroup.updateMatrixWorld(true);
        const raycaster  = new THREE.Raycaster();
        const downVector = new THREE.Vector3(0, -1, 0);

        for (let t = 0; t < treeCount; t++) {
            const angle   = seededRandom(worldX + t, worldZ) * Math.PI * 2;
            const maxDist = (type === 1) ? rad * 2.5 : rad * 0.9;
            const dist    = Math.abs(seededRandom(worldX, worldZ + t)) * maxDist;
            const tx      = worldX + Math.cos(angle) * dist;
            const tz      = worldZ + Math.sin(angle) * dist;

            raycaster.set(new THREE.Vector3(tx, 100, tz), downVector);
            const hits = raycaster.intersectObject(chunkGroup, true);
            if (hits.length > 0 && hits[0].point.y > 0.5) {
                const tree = createTree(isPalm);
                tree.position.set(tx, hits[0].point.y, tz);
                if (!isPalm) {
                    tree.rotation.x = (seededRandom(t, 1) - 0.5) * 0.2;
                    tree.rotation.z = (seededRandom(1, t) - 0.5) * 0.2;
                } else {
                    tree.rotation.y = seededRandom(1, t) * Math.PI * 2;
                }
                chunkGroup.add(tree);
            }
        }

        islands.push({ x: worldX, z: worldZ, radius: rad, chunkKey: `${cx},${cz}` });
    }

    scene.add(chunkGroup);
    return chunkGroup;
}

// ── 청크 갱신 (매 프레임) ─────────────────────────────────────
export function updateChunks(playerX, playerZ, currentWeatherMode) {
    const cx = Math.floor(playerX / CHUNK_SIZE);
    const cz = Math.floor(playerZ / CHUNK_SIZE);
    const newActiveKeys = new Set();

    for (let x = cx - RENDER_DIST; x <= cx + RENDER_DIST; x++) {
        for (let z = cz - RENDER_DIST; z <= cz + RENDER_DIST; z++) {
            const key = `${x},${z}`;
            newActiveKeys.add(key);
            if (!activeChunks.has(key) && !pendingChunks.has(key)) {
                pendingChunks.add(key);
                optimTeam.addTask(() => {
                    if (pendingChunks.has(key)) {
                        activeChunks.set(key, generateChunk(x, z, currentWeatherMode));
                        pendingChunks.delete(key);
                    }
                });
            }
        }
    }

    for (const [key, chunk] of activeChunks.entries()) {
        if (!newActiveKeys.has(key)) {
            scene.remove(chunk);
            activeChunks.delete(key);
            for (let i = islands.length - 1; i >= 0; i--) {
                if (islands[i].chunkKey === key) islands.splice(i, 1);
            }
        }
    }

    for (const key of pendingChunks) {
        if (!newActiveKeys.has(key)) pendingChunks.delete(key);
    }
}

// ── 전체 청크 재로드 (날씨 변경 시) ──────────────────────────
export function reloadAllChunks(shipX, shipZ, currentWeatherMode) {
    islands.length = 0;
    for (const [, chunk] of activeChunks.entries()) scene.remove(chunk);
    activeChunks.clear();
    pendingChunks.clear();
    optimTeam.clearTasks();
    updateChunks(shipX || 0, shipZ || 0, currentWeatherMode);
}
