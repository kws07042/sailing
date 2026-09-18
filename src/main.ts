import * as THREE from 'three';
import { SHIPS, type ShipKind } from './config/ships';
import { GRAPHICS, type GraphicsQuality } from './config/graphics';
import { WEATHER_LABELS, type WeatherKind } from './config/weather';
import './style.css';

type Vec = THREE.Vector3;
type WorldItem = { root: THREE.Group; radius: number; id: string; discovered?: boolean };
type NPC = { root: THREE.Group; kind: ShipKind; speed: number; angle: number; target: Vec; name: string };
type Cargo = { mesh: THREE.Group; phase: number };
type SaveData = { ship: ShipKind; quality: GraphicsQuality; sound: boolean; score: number; cargo: number; islands: number; distance: number };

const defaults: SaveData = { ship: 'steamship', quality: 'medium', sound: true, score: 0, cargo: 0, islands: 0, distance: 0 };
const load = (): SaveData => {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('sea-break-save') || '{}') }; }
  catch { return { ...defaults }; }
};
const save = () => localStorage.setItem('sea-break-save', JSON.stringify(state.save));

const app = document.querySelector<HTMLDivElement>('#app')!;

const state = {
  page: location.pathname,
  running: false,
  paused: false,
  boss: false,
  auto: false,
  weather: 'clear' as WeatherKind,
  speed: 0,
  boost: 100,
  save: load(),
  hint: true,
  fpsLowFor: 0
};

const icon = '<span class="brand-mark">≋</span>';
const nav = () => `<header class="site-nav"><a data-route="/" class="brand">${icon}<b>SEA BREAK</b></a><nav><a data-route="/about">About</a><a data-route="/how-to-play">How to play</a><a data-route="/privacy">Privacy</a><a data-route="/contact">Contact</a></nav><a class="nav-play" data-route="/play">Play now</a></header>`;
const ad = () => '<aside class="ad-slot" aria-label="Advertisement"><span>ADVERTISEMENT</span><small>Reserved ad space</small></aside>';
const footer = () => '<footer><b>SEA BREAK</b><span>A tiny ocean escape for your browser.</span><span>© 2026 Sea Break</span></footer>';

function route(path: string) {
  history.pushState({}, '', path);
  state.page = path;
  render();
}
window.addEventListener('popstate', () => { state.page = location.pathname; render(); });
document.addEventListener('click', e => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-route]');
  if (a) { e.preventDefault(); route(a.dataset.route || '/'); }
});

function landing() {
  app.innerHTML = `${nav()}<main class="landing">
    <section class="hero">
      <div class="hero-copy"><p class="eyebrow">YOUR FIVE-MINUTE OCEAN ESCAPE</p><h1>Leave the shore.<br><em>Keep the calm.</em></h1>
      <p>Explore an endless low-poly ocean, discover quiet islands, change the weather, or let autopilot take the helm.</p>
      <div class="hero-actions"><button class="primary" data-route="/play">PLAY NOW <span>→</span></button><a data-route="/how-to-play">View controls</a></div>
      <div class="quick-stats"><span><b>7</b> weather moods</span><span><b>3</b> distinct ships</span><span><b>∞</b> open horizon</span></div></div>
      <div class="hero-scene" aria-label="Stylized ocean preview"><div class="sun"></div><div class="island-preview"><i></i><i></i><i></i></div><div class="ship-preview">▲<small>▰▰</small></div><div class="wave-lines"></div><div class="scene-label">NO MISSIONS. NO PRESSURE.</div></div>
    </section>
    <section class="feature-strip"><p>DRIFT AT YOUR OWN PACE</p><div class="features">
      <article><span>01</span><h2>Explore</h2><p>Procedural islands appear across a horizon that keeps moving with you.</p></article>
      <article><span>02</span><h2>Change the sky</h2><p>Move from bright sun to fog, sunset, rain, storm, or stars in seconds.</p></article>
      <article><span>03</span><h2>Let go</h2><p>Turn on autopilot, orbit the camera, and simply watch the ocean pass.</p></article>
    </div></section>
    <section class="screenshot-block"><div><p class="eyebrow">BROWSER-FIRST SAILING</p><h2>A small game with a wide horizon.</h2><p>Built for a quick break on desktop Chrome or Edge. No account. No download. Your settings and discoveries stay in this browser.</p><button class="secondary" data-route="/play">Choose your vessel</button></div><div class="screenshot-placeholder"><span>LIVE GAMEPLAY</span><div class="fake-hud">23 <small>KNOTS</small></div></div></section>
    ${ad()}</main>${footer()}`;
}

function contentPage(title: string, kicker: string, body: string) {
  app.innerHTML = `${nav()}<main class="text-page"><p class="eyebrow">${kicker}</p><h1>${title}</h1><div class="prose">${body}</div>${ad()}</main>${footer()}`;
}

function shipCard(kind: ShipKind) {
  const s = SHIPS[kind];
  const stars = (n:number) => '★'.repeat(n) + '☆'.repeat(4-n);
  return `<button class="ship-card ${state.save.ship===kind?'selected':''}" data-ship="${kind}">
    <div class="ship-art ${kind}"><span></span></div><div class="ship-card-head"><h3>${s.label}</h3><i>${state.save.ship===kind?'SELECTED':'CHOOSE'}</i></div>
    <dl><div><dt>Speed</dt><dd>${stars(s.stats[0])}</dd></div><div><dt>Acceleration</dt><dd>${stars(s.stats[1])}</dd></div><div><dt>Turning</dt><dd>${stars(s.stats[2])}</dd></div></dl></button>`;
}

function playMenu() {
  app.innerHTML = `<main class="start-screen">
    <div class="start-ocean"></div><div class="start-panel"><div class="start-brand">${icon}<p>TAKE A BREATH</p><h1>SEA<br>BREAK</h1></div>
    <div class="ship-select"><p class="eyebrow">CHOOSE YOUR VESSEL</p><div class="ship-grid">${shipCard('steamship')}${shipCard('turtle')}${shipCard('viking')}</div></div>
    <div class="start-actions"><button id="start" class="primary">START VOYAGE <span>→</span></button><button data-route="/" class="ghost">Back to shore</button><p>WASD MOVE &nbsp;·&nbsp; SHIFT BOOST &nbsp;·&nbsp; P AUTOPILOT &nbsp;·&nbsp; ESC MENU</p></div></div>
    <div class="mobile-note">Desktop recommended for the best sailing experience.</div></main>`;
  document.querySelectorAll<HTMLElement>('[data-ship]').forEach(el => el.onclick = () => {
    state.save.ship = el.dataset.ship as ShipKind; save(); playMenu();
  });
  document.querySelector<HTMLButtonElement>('#start')!.onclick = startGame;
}

function render() {
  if (state.running) return;
  switch (state.page) {
    case '/play': playMenu(); break;
    case '/about': contentPage('About Sea Break','A TINY OCEAN ESCAPE','<h2>Made for the space between things.</h2><p>Sea Break is a lightweight 3D sailing game designed for five to fifteen quiet minutes. There is no campaign to finish and no leaderboard demanding attention—only a ship, a changing sky, and a horizon.</p><p>Every vessel and island is assembled from original low-poly geometry. The project uses no paid or copyrighted game assets.</p>'); break;
    case '/how-to-play': contentPage('How to play','TAKE THE HELM','<div class="control-list"><b>W</b><span>Accelerate forward</span><b>S</b><span>Brake or reverse</span><b>A / D</b><span>Turn gradually</span><b>SHIFT</b><span>Boost while the gauge has charge</span><b>SPACE</b><span>Align camera behind ship</span><b>P</b><span>Toggle autopilot</span><b>ESC</b><span>Pause menu</span><b>H</b><span>Instant neutral pause screen</span></div><p>Drag the mouse to orbit the camera. Use the wheel to zoom. Any manual movement input immediately releases autopilot.</p>'); break;
    case '/privacy': contentPage('Privacy','PLAIN AND SIMPLE','<h2>No account. No tracking by the game.</h2><p>Sea Break stores your selected ship, graphics preference, sound preference, distance, cargo count, and discovered-island count locally in your browser using localStorage.</p><p>The MVP sends no gameplay data to a server. If advertising or analytics are added later, this policy will be updated before those services are enabled.</p>'); break;
    case '/contact': contentPage('Contact & feedback','SEND A SIGNAL','<h2>Found rough water?</h2><p>Feedback, bug reports, accessibility suggestions, and performance reports are welcome through the GitHub repository issue tracker.</p><p>Please include your browser, operating system, graphics setting, and a short description of what happened.</p><a class="primary inline-button" href="https://github.com/kws07042/sailing/issues" target="_blank" rel="noreferrer">OPEN GITHUB ISSUES →</a>'); break;
    default: landing();
  }
}

const materials = {
  wood: new THREE.MeshStandardMaterial({ color: 0x70462c, roughness: .9 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x25333a, roughness: .65, metalness: .25 }),
  pale: new THREE.MeshStandardMaterial({ color: 0xe5dfcc, roughness: .85 }),
  red: new THREE.MeshStandardMaterial({ color: 0xa73d35, roughness: .8 })
};
const mk = (g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0) => { const v=new THREE.Mesh(g,m);v.position.set(x,y,z);v.castShadow=true;v.receiveShadow=true;return v; };

function createShip(kind: ShipKind, npc=false) {
  const root = new THREE.Group(); root.name = kind;
  const config = SHIPS[kind];
  const hullMat = new THREE.MeshStandardMaterial({color:config.color,roughness:.82,metalness:kind==='steamship'?.25:.02});
  const w=kind==='turtle'?4.8:kind==='viking'?3.3:4.2, len=kind==='steamship'?12:10.5;
  root.add(mk(new THREE.BoxGeometry(w,1.25,len),hullMat,0,1,0));
  const bow=mk(new THREE.ConeGeometry(w/2,3.2,4),hullMat,0,1,-len/2-1.2);bow.rotation.x=-Math.PI/2;bow.rotation.y=Math.PI/4;root.add(bow);
  if(kind==='steamship'){
    root.add(mk(new THREE.BoxGeometry(3.2,1.8,4.4),materials.pale,0,2.35,1));
    root.add(mk(new THREE.BoxGeometry(2.6,1,2.1),materials.pale,0,3.55,1.8));
    const pipe=mk(new THREE.CylinderGeometry(.6,.78,3,12),materials.dark,0,4.1,-1);root.add(pipe);
    const cap=mk(new THREE.CylinderGeometry(.78,.78,.25,12),materials.red,0,5.55,-1);root.add(cap);
  } else if(kind==='turtle'){
    const roof=mk(new THREE.SphereGeometry(2.5,16,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x74624b,roughness:1}),0,1.5,0);roof.scale.z=1.8;root.add(roof);
    for(let z=-3;z<=3;z+=1.5)root.add(mk(new THREE.ConeGeometry(.13,.7,5),materials.dark,0,3.2,z));
    const head=mk(new THREE.ConeGeometry(.5,1.8,8),materials.wood,0,2,-6);head.rotation.x=-Math.PI/2;root.add(head);
  } else {
    const mast=mk(new THREE.CylinderGeometry(.13,.18,7.5,8),materials.wood,0,4,0);root.add(mast);
    root.add(mk(new THREE.PlaneGeometry(5.4,4.3),new THREE.MeshStandardMaterial({color:0xd8c49c,side:THREE.DoubleSide,roughness:1}),0,4,.05));
    for(let z=-3.6;z<=3.6;z+=1.45){const shield=mk(new THREE.CylinderGeometry(.55,.55,.18,12),z%2>0?materials.red:new THREE.MeshStandardMaterial({color:0x315d70}),1.7,1.25,z);shield.rotation.z=Math.PI/2;root.add(shield);}
  }
  const port=mk(new THREE.SphereGeometry(.12,8,8),new THREE.MeshBasicMaterial({color:0xff493d}),-w/2,2,-3);
  const star=mk(new THREE.SphereGeometry(.12,8,8),new THREE.MeshBasicMaterial({color:0x76ff9b}),w/2,2,-3);root.add(port,star);
  root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=!npc;o.receiveShadow=true;}});
  return root;
}

class Game {
  renderer: THREE.WebGLRenderer; scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,1600);
  player:THREE.Group; ocean:THREE.Mesh; sun=new THREE.DirectionalLight(0xfff1cd,2.4); ambient=new THREE.HemisphereLight(0xaee8ff,0x15303c,1.8);
  islands:WorldItem[]=[]; npcs:NPC[]=[]; cargos:Cargo[]=[]; rain!:THREE.Points; stars!:THREE.Points;
  keys=new Set<string>(); pressed=new Set<string>(); yaw=0; camYaw=0;camPitch=.34;camDist=26; mouse=false; last=performance.now(); elapsed=0;
  autoTarget=new THREE.Vector3(150,0,-200); wake:THREE.Points; ui:HTMLElement; lightning=0; lastSpawn=0; sampleFrames=0; sampleTime=0;

  constructor(private host:HTMLElement){
    const canvas=document.createElement('canvas');canvas.id='game-canvas';host.appendChild(canvas);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;
    this.scene.background=new THREE.Color(0x91d5e4);this.scene.fog=new THREE.FogExp2(0x91cad5,.0014);
    this.scene.add(this.ambient,this.sun);this.sun.position.set(-120,170,-80);
    this.player=createShip(state.save.ship);this.scene.add(this.player);
    const oceanGeo=new THREE.PlaneGeometry(1600,1600,90,90);oceanGeo.rotateX(-Math.PI/2);
    this.ocean=new THREE.Mesh(oceanGeo,new THREE.MeshStandardMaterial({color:0x0a7899,roughness:.22,metalness:.08,transparent:true,opacity:.96}));
    this.ocean.receiveShadow=true;this.scene.add(this.ocean);
    this.wake=this.makeParticles(180,0xd8fbff,3.4,.5);this.scene.add(this.wake);
    this.makeSky();this.makeRain();this.generateWorld(true);this.bind();
    this.ui=this.makeUI();this.applyQuality(state.save.quality);this.resize();this.applyWeather('clear',true);
    requestAnimationFrame(this.loop);
  }

  makeParticles(count:number,color:number,size:number,opacity:number){
    const p=new Float32Array(count*3);for(let i=0;i<count;i++){p[i*3]=(Math.random()-.5)*10;p[i*3+1]=.1;p[i*3+2]=Math.random()*35;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));
    return new THREE.Points(geo,new THREE.PointsMaterial({color,size,transparent:true,opacity,depthWrite:false}));
  }
  makeSky(){
    const starPos=new Float32Array(900*3);for(let i=0;i<900;i++){const r=600,phi=Math.acos(1-2*Math.random()),t=Math.random()*Math.PI*2;starPos[i*3]=r*Math.sin(phi)*Math.cos(t);starPos[i*3+1]=Math.abs(r*Math.cos(phi));starPos[i*3+2]=r*Math.sin(phi)*Math.sin(t);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(starPos,3));this.stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.8,transparent:true,opacity:0}));this.scene.add(this.stars);
  }
  makeRain(){
    const p=new Float32Array(900*3);for(let i=0;i<900;i++){p[i*3]=(Math.random()-.5)*100;p[i*3+1]=Math.random()*55;p[i*3+2]=(Math.random()-.5)*100;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));this.rain=new THREE.Points(g,new THREE.PointsMaterial({color:0xbde8ff,size:.23,transparent:true,opacity:.62,depthWrite:false}));this.rain.visible=false;this.scene.add(this.rain);
  }
  makeUI(){
    const ui=document.createElement('div');ui.className='game-ui';ui.innerHTML=`
      <div class="game-top"><div class="mini-brand">${icon}<b>SEA BREAK</b></div><button id="weather-button">WEATHER <span>☀</span></button></div>
      <div id="weather-menu" class="weather-menu">${Object.entries(WEATHER_LABELS).map(([k,v])=>`<button data-weather="${k}">${v}</button>`).join('')}</div>
      <div class="stats-panel"><div><small>SPEED</small><b id="speed">0</b><span>knots</span></div><div><small>DISTANCE</small><b id="distance">0.0</b><span>km</span></div><div><small>CARGO</small><b id="cargo">${state.save.cargo}</b></div></div>
      <div class="boost"><div><span>BOOST</span><b id="boost-value">100%</b></div><i><em id="boost-bar"></em></i></div>
      <div id="auto" class="auto-pill">AUTO PILOT</div><canvas id="minimap" width="170" height="170"></canvas>
      <div id="toast" class="toast"></div><div id="controls" class="control-hint">WASD <span>MOVE</span> &nbsp; SHIFT <span>BOOST</span> &nbsp; P <span>AUTO PILOT</span></div>
      <button class="sound-toggle" id="sound">${state.save.sound?'SOUND ON':'SOUND OFF'}</button>
      <div id="pause" class="pause-menu"><p>VOYAGE PAUSED</p><h2>SEA BREAK</h2><button data-pause="continue">Continue</button><button data-pause="weather">Weather</button><button data-pause="graphics">Graphics</button><button data-pause="sound">Sound</button><button data-pause="main">Main menu</button><div id="graphics" class="graphics-row"><button data-quality="low">LOW</button><button data-quality="medium">MEDIUM</button><button data-quality="high">HIGH</button></div></div>
      <div id="boss" class="boss-screen"><span>PAUSED</span><small>Press H to return</small></div>`;
    this.host.appendChild(ui);
    ui.querySelector('#weather-button')!.addEventListener('click',()=>ui.querySelector('#weather-menu')!.classList.toggle('open'));
    ui.querySelectorAll<HTMLElement>('[data-weather]').forEach(b=>b.onclick=()=>{this.applyWeather(b.dataset.weather as WeatherKind);ui.querySelector('#weather-menu')!.classList.remove('open')});
    ui.querySelectorAll<HTMLElement>('[data-quality]').forEach(b=>b.onclick=()=>this.applyQuality(b.dataset.quality as GraphicsQuality));
    ui.querySelectorAll<HTMLElement>('[data-pause]').forEach(b=>b.onclick=()=>this.pauseAction(b.dataset.pause!));
    ui.querySelector('#sound')!.addEventListener('click',()=>{state.save.sound=!state.save.sound;save();ui.querySelector('#sound')!.textContent=state.save.sound?'SOUND ON':'SOUND OFF'});
    return ui;
  }
  bind(){
    addEventListener('resize',()=>this.resize());
    addEventListener('keydown',e=>{if(!e.repeat)this.pressed.add(e.code);this.keys.add(e.code)});
    addEventListener('keyup',e=>this.keys.delete(e.code));
    this.renderer.domElement.addEventListener('pointerdown',()=>this.mouse=true);
    addEventListener('pointerup',()=>this.mouse=false);
    addEventListener('pointermove',e=>{if(this.mouse&&!state.paused){this.camYaw-=e.movementX*.004;this.camPitch=THREE.MathUtils.clamp(this.camPitch-e.movementY*.003,-.05,1.05)}});
    this.renderer.domElement.addEventListener('wheel',e=>this.camDist=THREE.MathUtils.clamp(this.camDist+e.deltaY*.02,13,45),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&!state.paused)this.togglePause()});
  }
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();const q=GRAPHICS[state.save.quality];this.renderer.setPixelRatio(Math.min(devicePixelRatio,q.pixelRatio));this.renderer.setSize(innerWidth,innerHeight)}
  applyQuality(q:GraphicsQuality){state.save.quality=q;save();const c=GRAPHICS[q];this.renderer.shadowMap.enabled=c.shadows;this.sun.castShadow=c.shadows;this.camera.far=c.viewDistance+400;this.camera.updateProjectionMatrix();this.resize();this.ui?.querySelectorAll('[data-quality]').forEach(el=>el.classList.toggle('active',(el as HTMLElement).dataset.quality===q))}
  applyWeather(kind:WeatherKind,instant=false){
    state.weather=kind;const settings={
      clear:[0x8ed8e9,0x0b7f9f,.0012,2.5,1.8],cloudy:[0x7d929c,0x416f7c,.0017,1.35,1.2],rain:[0x657b86,0x285e70,.0021,1.05,.95],
      storm:[0x172b39,0x183d51,.0025,.45,.55],fog:[0xa6bdbe,0x5b8d91,.006,.9,1.25],sunset:[0xf19b67,0x256f83,.0016,2.1,1.5],night:[0x061327,0x071e35,.0019,.25,.3]
    }[kind] as number[];
    const bg=new THREE.Color(settings[0]), water=settings[1];this.scene.background=bg;this.scene.fog=new THREE.FogExp2(bg,settings[2]);
    (this.ocean.material as THREE.MeshStandardMaterial).color.setHex(water);this.sun.intensity=settings[3];this.ambient.intensity=settings[4];
    this.sun.color.set(kind==='sunset'?0xff9b5e:kind==='night'?0x91a8d4:0xfff1cd);this.rain.visible=kind==='rain'||kind==='storm';(this.stars.material as THREE.PointsMaterial).opacity=kind==='night'?.88:0;
    this.camera.fov=58;this.camera.updateProjectionMatrix();const b=this.ui?.querySelector('#weather-button span');if(b)b.textContent=WEATHER_LABELS[kind].split(' ')[0];
    if(!instant)this.toast(WEATHER_LABELS[kind].replace(/^[^ ]+ /,'')+' weather');
  }
  island(x:number,z:number,index:number){
    const root=new THREE.Group();root.position.set(x,0,z);const radius=16+Math.random()*18;
    const sand=mk(new THREE.CylinderGeometry(radius,radius*1.17,2.4,9),new THREE.MeshStandardMaterial({color:0xd8bd79,roughness:1}),0,.8,0);root.add(sand);
    const hill=mk(new THREE.ConeGeometry(radius*.72,10+Math.random()*9,8),new THREE.MeshStandardMaterial({color:0x4d7a4c,roughness:1}),0,6,0);root.add(hill);
    const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.4,0),new THREE.MeshStandardMaterial({color:0x606765,roughness:1}),8);
    const trees=new THREE.Group();const trunk=new THREE.CylinderGeometry(.25,.35,2.6,6),leaf=new THREE.ConeGeometry(1.35,3.6,7);
    for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,r=Math.random()*radius*.55,m=new THREE.Matrix4().makeTranslation(Math.cos(a)*r,2.2,Math.sin(a)*r);rocks.setMatrixAt(i,m);const t=mk(trunk,materials.wood,Math.cos(a)*r,4,Math.sin(a)*r);const l=mk(leaf,new THREE.MeshStandardMaterial({color:0x2f7047}),t.position.x,6,t.position.z);trees.add(t,l)}
    root.add(rocks,trees);if(index%4===0){root.add(mk(new THREE.CylinderGeometry(1.1,1.4,10,10),materials.pale,radius*.2,10,0));root.add(mk(new THREE.CylinderGeometry(1.5,1.5,2.5,10),materials.red,radius*.2,16,0));}
    this.scene.add(root);const names=['Whisper','Blackrock','Green Turtle','Moon Bay','Stillwater','Silver Pine','Driftwood','Far Lantern'];return{root,radius,id:names[index%names.length]+' Island'};
  }
  generateWorld(initial=false){
    const center=this.player.position;const desired=initial?7:2;
    for(let i=0;i<desired;i++){const a=Math.random()*Math.PI*2,r=initial?170+Math.random()*430:420+Math.random()*160;this.islands.push(this.island(center.x+Math.cos(a)*r,center.z+Math.sin(a)*r,this.islands.length));}
    while(this.npcs.length<7){const kinds:ShipKind[]=['steamship','turtle','viking'];const kind=kinds[Math.floor(Math.random()*3)],root=createShip(kind,true),a=Math.random()*Math.PI*2,r=100+Math.random()*360;root.position.set(center.x+Math.cos(a)*r,0,center.z+Math.sin(a)*r);this.scene.add(root);this.npcs.push({root,kind,speed:7+Math.random()*6,angle:Math.random()*6.2,target:new THREE.Vector3(),name:['NORTH STAR','ODIN','THE WANDERER','TURTLE 07','SEA LARK','MORNING TIDE'][this.npcs.length%6]});}
    while(this.cargos.length<9){const box=new THREE.Group(),crate=mk(new THREE.BoxGeometry(2.2,1.6,2.2),materials.wood);box.add(crate);const ring=mk(new THREE.TorusGeometry(1.5,.12,6,14),new THREE.MeshBasicMaterial({color:0xffcb66}));ring.rotation.x=Math.PI/2;box.add(ring);const a=Math.random()*6.2,r=100+Math.random()*430;box.position.set(center.x+Math.cos(a)*r,1,center.z+Math.sin(a)*r);this.scene.add(box);this.cargos.push({mesh:box,phase:Math.random()*6});}
  }
  manual(){return this.keys.has('KeyW')||this.keys.has('KeyA')||this.keys.has('KeyS')||this.keys.has('KeyD')}
  updatePlayer(dt:number){
    if(this.pressed.delete('KeyP')){state.auto=!state.auto;this.ui.querySelector('#auto')!.classList.toggle('show',state.auto);if(state.auto)this.pickAutoTarget();this.toast(state.auto?'AUTO PILOT ON':'AUTO PILOT OFF')}
    if(this.manual()&&state.auto){state.auto=false;this.ui.querySelector('#auto')!.classList.remove('show');this.toast('MANUAL CONTROL')}
    if(this.pressed.delete('Space'))this.camYaw=0;
    const cfg=SHIPS[state.save.ship],boosting=this.keys.has('ShiftLeft')&&this.keys.has('KeyW')&&state.boost>0;
    if(boosting){state.boost=Math.max(0,state.boost-dt*24)}else state.boost=Math.min(100,state.boost+dt*13);
    let throttle=this.keys.has('KeyW')?1:this.keys.has('KeyS')?-1:0, steer=(this.keys.has('KeyA')?1:0)-(this.keys.has('KeyD')?1:0);
    if(state.auto){const desired=Math.atan2(this.autoTarget.x-this.player.position.x,-(this.autoTarget.z-this.player.position.z));let diff=Math.atan2(Math.sin(desired-this.yaw),Math.cos(desired-this.yaw));steer=THREE.MathUtils.clamp(diff*1.5,-1,1);throttle=1;if(this.player.position.distanceTo(this.autoTarget)<30)this.pickAutoTarget();}
    const target=throttle>=0?(cfg.maxSpeed*(boosting?1.45:1)*throttle):cfg.reverseSpeed*throttle;
    state.speed=THREE.MathUtils.damp(state.speed,target,throttle?cfg.acceleration*.15:cfg.drag,dt);
    const speedFactor=Math.max(.25,1-Math.abs(state.speed)/(cfg.maxSpeed*2));this.yaw+=steer*cfg.turnRate*speedFactor*dt*(state.speed>=0?1:-.6);
    this.player.rotation.y=this.yaw;const forward=new THREE.Vector3(Math.sin(this.yaw),0,-Math.cos(this.yaw));const movement=forward.multiplyScalar(state.speed*dt);this.player.position.add(movement);state.save.distance+=Math.abs(state.speed*dt)/1000;
    const wave=Math.sin(this.elapsed*1.6+this.player.position.x*.02)*.12;this.player.position.y=.45+wave;this.player.rotation.x=Math.sin(this.elapsed*1.4)*.012*(state.weather==='storm'?2.8:1);this.player.rotation.z=Math.sin(this.elapsed*1.1)*.018*(state.weather==='storm'?3:1);
    this.ocean.position.set(this.player.position.x,0,this.player.position.z);
    const wakePos=this.wake.geometry.getAttribute('position') as THREE.BufferAttribute;for(let i=0;i<wakePos.count;i++){let z=wakePos.getZ(i)+dt*(5+Math.abs(state.speed)*.7);if(z>36)z=Math.random()*4;wakePos.setZ(i,z);wakePos.setX(i,(Math.random()-.5)*(2.5+z*.13));wakePos.setY(i,.12+Math.random()*.12)}wakePos.needsUpdate=true;this.wake.position.copy(this.player.position);this.wake.rotation.y=this.yaw;this.wake.visible=Math.abs(state.speed)>1;
    for(const island of this.islands){const d=this.player.position.distanceTo(island.root.position);if(d<island.radius+5){const push=this.player.position.clone().sub(island.root.position).setY(0).normalize();this.player.position.addScaledVector(push,(island.radius+5-d)*.3);state.speed*=-.18}if(!island.discovered&&d<85){island.discovered=true;state.save.islands++;this.toast('ISLAND DISCOVERED — '+island.id);save()}}
    for(let i=this.cargos.length-1;i>=0;i--){const c=this.cargos[i];c.mesh.position.y=1+Math.sin(this.elapsed*1.7+c.phase)*.25;c.mesh.rotation.y+=dt*.3;if(c.mesh.position.distanceTo(this.player.position)<7){this.scene.remove(c.mesh);this.cargos.splice(i,1);state.save.cargo++;state.save.score+=100;this.toast('+100 CARGO RECOVERED');save()}}
    if(boosting){this.camera.fov=THREE.MathUtils.damp(this.camera.fov,64,6,dt)}else this.camera.fov=THREE.MathUtils.damp(this.camera.fov,58,5,dt);this.camera.updateProjectionMatrix();
  }
  pickAutoTarget(){const a=Math.random()*Math.PI*2,r=180+Math.random()*220;this.autoTarget.set(this.player.position.x+Math.cos(a)*r,0,this.player.position.z+Math.sin(a)*r)}
  updateNPC(dt:number){
    for(const n of this.npcs){if(n.target.distanceTo(n.root.position)<35){const a=Math.random()*6.2,r=120+Math.random()*260;n.target.set(this.player.position.x+Math.cos(a)*r,0,this.player.position.z+Math.sin(a)*r)}
      const desired=Math.atan2(n.target.x-n.root.position.x,-(n.target.z-n.root.position.z));let diff=Math.atan2(Math.sin(desired-n.angle),Math.cos(desired-n.angle));
      for(const island of this.islands){const d=n.root.position.distanceTo(island.root.position);if(d<island.radius+35){const avoid=Math.atan2(n.root.position.x-island.root.position.x,-(n.root.position.z-island.root.position.z));diff+=Math.atan2(Math.sin(avoid-n.angle),Math.cos(avoid-n.angle))*1.4}}
      n.angle+=THREE.MathUtils.clamp(diff,-.55,.55)*dt;n.root.rotation.y=n.angle;n.root.position.x+=Math.sin(n.angle)*n.speed*dt;n.root.position.z-=Math.cos(n.angle)*n.speed*dt;n.root.position.y=.45+Math.sin(this.elapsed*1.3+n.angle)*.11;
    }
  }
  updateWeather(dt:number){
    if(this.rain.visible){const p=this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;for(let i=0;i<p.count;i++){let y=p.getY(i)-dt*(state.weather==='storm'?46:29);if(y<0)y=45+Math.random()*15;p.setY(i,y)}p.needsUpdate=true;this.rain.position.set(this.player.position.x,0,this.player.position.z)}
    if(state.weather==='storm'){this.lightning-=dt;if(this.lightning<0&&Math.random()<.012){this.lightning=.1;this.ambient.intensity=3.5;setTimeout(()=>this.ambient.intensity=.55,90)}} 
  }
  updateCamera(dt:number){const angle=this.yaw+this.camYaw,offset=new THREE.Vector3(-Math.sin(angle)*this.camDist,7+this.camPitch*18,Math.cos(angle)*this.camDist);const target=this.player.position.clone().add(offset);this.camera.position.lerp(target,1-Math.exp(-dt*5));this.camera.lookAt(this.player.position.clone().add(new THREE.Vector3(0,3,0)))}
  cleanup(){
    const far=650;this.islands=this.islands.filter(i=>{if(i.root.position.distanceTo(this.player.position)>far){this.scene.remove(i.root);return false}return true});
    this.npcs.forEach(n=>{if(n.root.position.distanceTo(this.player.position)>far){const a=Math.random()*6.2;n.root.position.set(this.player.position.x+Math.cos(a)*450,0,this.player.position.z+Math.sin(a)*450)}});
    this.cargos=this.cargos.filter(c=>{if(c.mesh.position.distanceTo(this.player.position)>far){this.scene.remove(c.mesh);return false}return true});this.generateWorld();
  }
  drawMap(){
    const c=this.ui.querySelector<HTMLCanvasElement>('#minimap')!,x=c.getContext('2d')!,s=c.width;x.clearRect(0,0,s,s);x.save();x.translate(s/2,s/2);x.beginPath();x.arc(0,0,s/2-4,0,Math.PI*2);x.fillStyle='rgba(4,24,34,.82)';x.fill();x.clip();
    const scale=.18;for(const i of this.islands){const dx=(i.root.position.x-this.player.position.x)*scale,dz=(i.root.position.z-this.player.position.z)*scale;x.fillStyle='#d5bd78';x.beginPath();x.arc(dx,dz,Math.max(2,i.radius*scale),0,Math.PI*2);x.fill()}
    x.fillStyle='#d5eaf0';for(const n of this.npcs){const dx=(n.root.position.x-this.player.position.x)*scale,dz=(n.root.position.z-this.player.position.z)*scale;x.fillRect(dx-1,dz-3,2,6)}
    x.rotate(-this.yaw);x.fillStyle='#ffcc69';x.beginPath();x.moveTo(0,-8);x.lineTo(5,6);x.lineTo(-5,6);x.closePath();x.fill();x.restore();x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=2;x.beginPath();x.arc(s/2,s/2,s/2-4,0,Math.PI*2);x.stroke();
  }
  toast(message:string){const t=this.ui.querySelector('#toast')!;t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2700)}
  togglePause(){state.paused=!state.paused;this.ui.querySelector('#pause')!.classList.toggle('show',state.paused)}
  pauseAction(action:string){if(action==='continue')this.togglePause();if(action==='weather'){this.togglePause();this.ui.querySelector('#weather-menu')!.classList.add('open')}if(action==='graphics')this.ui.querySelector('#graphics')!.classList.toggle('show');if(action==='sound'){state.save.sound=!state.save.sound;save()}if(action==='main')this.quit()}
  quit(){save();state.running=false;state.paused=false;this.renderer.dispose();this.host.innerHTML='';route('/');}
  loop=(now:number)=>{
    if(!state.running)return;const dt=Math.min(.05,(now-this.last)/1000);this.last=now;
    if(this.pressed.delete('Escape'))this.togglePause();if(this.pressed.delete('KeyH')){state.boss=!state.boss;state.paused=state.boss;this.ui.querySelector('#boss')!.classList.toggle('show',state.boss)}
    if(!state.paused){this.elapsed+=dt;this.updatePlayer(dt);this.updateNPC(dt);this.updateWeather(dt);this.updateCamera(dt);if(this.elapsed-this.lastSpawn>12){this.cleanup();this.lastSpawn=this.elapsed}this.sampleFrames++;this.sampleTime+=dt;if(this.sampleTime>5){const fps=this.sampleFrames/this.sampleTime;state.fpsLowFor=fps<28?state.fpsLowFor+this.sampleTime:0;if(state.fpsLowFor>12&&state.save.quality!=='low'){this.toast('LOW FPS — TRY LOW GRAPHICS');state.fpsLowFor=0}this.sampleFrames=0;this.sampleTime=0}}
    this.renderer.render(this.scene,this.camera);this.drawMap();this.ui.querySelector('#speed')!.textContent=Math.abs(state.speed).toFixed(0);this.ui.querySelector('#distance')!.textContent=state.save.distance.toFixed(1);this.ui.querySelector('#cargo')!.textContent=String(state.save.cargo);this.ui.querySelector('#boost-value')!.textContent=Math.round(state.boost)+'%';(this.ui.querySelector('#boost-bar') as HTMLElement).style.width=state.boost+'%';
    if(this.elapsed>7)this.ui.querySelector('#controls')!.classList.add('hide');if(Math.floor(this.elapsed)%8===0)save();this.pressed.clear();requestAnimationFrame(this.loop);
  }
}

function startGame(){
  state.running=true;state.paused=false;state.auto=false;app.innerHTML='<main id="game-host"></main>';new Game(document.querySelector<HTMLElement>('#game-host')!);
}

render();
