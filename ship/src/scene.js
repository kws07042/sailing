// scene.js - 씬, 카메라, 렌더러, 조명 초기화

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 30, 150);

export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명
export const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

export const dirLight = new THREE.DirectionalLight(0xffddaa, 1.2);
dirLight.position.set(100, 100, 50);
scene.add(dirLight);

// 태양
const sunGeo  = new THREE.SphereGeometry(15, 32, 32);
const sunMat  = new THREE.MeshBasicMaterial({ color: 0xffffaa });
export const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// 달
const moonGeo = new THREE.SphereGeometry(10, 32, 32);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff });
export const moon = new THREE.Mesh(moonGeo, moonMat);
moon.visible = false;
scene.add(moon);

// 창 크기 조절 대응
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
