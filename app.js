import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { patterns, buildGlslFunctions, buildGlslModeSwitch } from './patterns.js';
import { startRecording, stopRecording, getIsRecording } from './recorder.js';

/* ============================================================
   SCENE SETUP
   ============================================================ */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
});
const pixelRatio = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ============================================================
   3D OBJECTS
   ============================================================ */
const sceneGroups = [];
let activeSceneIndex = 0;

/* --- Scene 0: Abstract Shapes (Classic Random) --- */
const groupShapes = new THREE.Group();
const shapeGeoms = [
    new THREE.TorusKnotGeometry(1.8, 0.5, 128, 32),
    new THREE.OctahedronGeometry(2),
    new THREE.BoxGeometry(2.5, 2.5, 2.5),
];

for (let i = 0; i < 40; i++) {
    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
        roughness: 0.1,
        metalness: 0.6,
    });
    const mesh = new THREE.Mesh(shapeGeoms[i % 3], mat);
    mesh.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    groupShapes.add(mesh);
}
scene.add(groupShapes);
sceneGroups.push(groupShapes);

/* --- Scene 1: Realistic Globe --- */
const groupGlobe = new THREE.Group();
const texLoader = new THREE.TextureLoader();
// Using standard Three.js example earth texture
const earthMap = texLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
const earthGeo = new THREE.SphereGeometry(3.5, 64, 64);
const earthMat = new THREE.MeshStandardMaterial({
    map: earthMap,
    color: 0xffffff, // White to let texture show, fallback if texture fails
    roughness: 0.6,
    metalness: 0.1
});
const earth = new THREE.Mesh(earthGeo, earthMat);

// Clouds (slightly larger sphere)
const cloudGeo = new THREE.SphereGeometry(3.55, 64, 64);
const cloudMat = new THREE.MeshBasicMaterial({
    map: texLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
});
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
earth.add(clouds);

groupGlobe.add(earth);
groupGlobe.visible = false;
scene.add(groupGlobe);
sceneGroups.push(groupGlobe);

/* --- Scene 2: Elegant Particle Saturn 🪐 --- */
const groupSaturn = new THREE.Group();

// 1. Procedural Planet Texture (Elegant Bands)
const canvasSat = document.createElement('canvas');
canvasSat.width = 128; canvasSat.height = 128;
const ctxSat = canvasSat.getContext('2d');
const grdSat = ctxSat.createLinearGradient(0, 0, 0, 128);
grdSat.addColorStop(0.0, '#0f2027'); // Deep Dark Blue
grdSat.addColorStop(0.4, '#203a43'); // Steel Blue
grdSat.addColorStop(0.6, '#2c5364'); // Lighter Blue
grdSat.addColorStop(1.0, '#0f2027');
ctxSat.fillStyle = grdSat;
ctxSat.fillRect(0, 0, 128, 128);
// Add subtle noise lines
ctxSat.fillStyle = 'rgba(255, 255, 255, 0.05)';
for (let i = 0; i < 20; i++) ctxSat.fillRect(0, Math.random() * 128, 128, 2);

const texSat = new THREE.CanvasTexture(canvasSat);

// 2. Planet Body (Dark Chrome Look)
const saturnGeo = new THREE.SphereGeometry(2.5, 64, 64);
const saturnMat = new THREE.MeshStandardMaterial({
    map: texSat,
    metalness: 0.6,
    roughness: 0.4,
    envMapIntensity: 1.0
});
const saturnPlanet = new THREE.Mesh(saturnGeo, saturnMat);
groupSaturn.add(saturnPlanet);

// 3. Particle Rings (Flowing & Elegant)
const count = 4000;
const ptsGeo = new THREE.BufferGeometry();
const ptsPos = new Float32Array(count * 3);
const ptsCol = new Float32Array(count * 3);
const ringInner = 3.2;
const ringOuter = 6.0;
const colIn = new THREE.Color(0x88ccff); // Light Blue
const colOut = new THREE.Color(0xffffff); // White

for (let i = 0; i < count; i++) {
    // Distribute in a ring
    const rad = ringInner + Math.random() * (ringOuter - ringInner);
    const ang = Math.random() * Math.PI * 2;
    // Add varying thickness spread for realism
    const spread = (Math.random() - 0.5) * 0.15;

    ptsPos[i * 3] = Math.cos(ang) * rad;
    ptsPos[i * 3 + 1] = spread; // Flat on Y plane (before rotation)
    ptsPos[i * 3 + 2] = Math.sin(ang) * rad;

    // Gradient Color
    const t = (rad - ringInner) / (ringOuter - ringInner);
    const c = colIn.clone().lerp(colOut, t);
    // Random transparency flickering logic is in material/shader usually, 
    // but here we just vary brightness slightly
    const dim = 0.5 + Math.random() * 0.5;
    ptsCol[i * 3] = c.r * dim;
    ptsCol[i * 3 + 1] = c.g * dim;
    ptsCol[i * 3 + 2] = c.b * dim;
}
ptsGeo.setAttribute('position', new THREE.BufferAttribute(ptsPos, 3));
ptsGeo.setAttribute('color', new THREE.BufferAttribute(ptsCol, 3));

const ptsMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const saturnRings = new THREE.Points(ptsGeo, ptsMat);
// Rotate 90deg to be flat like a proper ring around the vertical planet
saturnRings.rotation.z = Math.PI / 8; // Slight tilt relative to planet?
saturnRings.rotation.x = Math.PI / 2; // Flat

// Group holding rings should tilt with planet
const ringsGroup = new THREE.Group();
ringsGroup.add(saturnRings);
// We want rings to be flat relative to planet equator. Planet is Y-up.
// If we rotate planet logic, we rotate this group.
groupSaturn.add(ringsGroup);

// Initial Tilt of System
groupSaturn.rotation.z = Math.PI / 6;
groupSaturn.rotation.x = Math.PI / 8;

groupSaturn.visible = false;
scene.add(groupSaturn);
sceneGroups.push(groupSaturn);

/* --- Scene Switcher --- */
window.switchScene = (index) => {
    activeSceneIndex = index;
    cleanup();
    sceneGroups.forEach((g, i) => {
        g.visible = (i === index);
    });

    // Reset camera for Waves
    if (index === 2) {
        camera.position.set(0, 4, 6);
        camera.lookAt(0, 0, 0);
    } else {
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
    }

    // UI Update
    document.querySelectorAll('.btn-scene').forEach(b => b.classList.remove('active'));
    // Note: button IDs are handled in HTML onclick
    document.getElementById(`btn-scene-${index + 1}`)?.classList.add('active');

    // Switch to 3D source mode if not already
    switchTo3D();
};

/* ============================================================
   LIGHTING
   ============================================================ */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const light = new THREE.DirectionalLight(0xffffff, 4);
light.position.set(5, 5, 5);
scene.add(light);

/* ============================================================
   MEDIA PLANE — fullscreen quad for image/video/webcam
   ============================================================ */
function calcPlaneSize() {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.tan(vFov / 2) * camera.position.z;
    const w = h * camera.aspect;
    return { w, h };
}

const planeSize = calcPlaneSize();
let mediaGeo = new THREE.PlaneGeometry(planeSize.w, planeSize.h);
const mediaMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
const mediaPlane = new THREE.Mesh(mediaGeo, mediaMat);
mediaPlane.position.z = 0;
mediaPlane.visible = false;
scene.add(mediaPlane);

let currentSource = '3d';
let activeVideoEl = null;
let activeVideoTexture = null;
let webcamStream = null;

/* ============================================================
   RENDER TARGET
   ============================================================ */
const rawRenderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth * pixelRatio,
    window.innerHeight * pixelRatio
);

/* ============================================================
   PATTERN SHADER — built dynamically + color processing
   ============================================================ */
const fragmentShader = /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform float uSize;
    uniform float uCellSize;
    uniform float uMode;
    uniform float uColorMode;
    uniform vec3 uTintColor;
    uniform vec3 uBgColor;
    uniform float uInvert;
    uniform float uExposure;
    varying vec2 vUv;

    ${buildGlslFunctions()}

    // Color mode processing
    vec3 processColor(vec3 col) {
        if (uColorMode < 0.5) {
            // 0: Original RGB
            return col;
        } else if (uColorMode < 1.5) {
            // 1: Terminal Green
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            return vec3(lum * 0.2, lum, lum * 0.1);
        } else if (uColorMode < 2.5) {
            // 2: Monochrome White
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            return vec3(lum);
        } else if (uColorMode < 3.5) {
            // 3: Neon — boost saturation
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            vec3 boosted = mix(vec3(lum), col, 2.5);
            return max(boosted, vec3(0.0));
        } else {
            // 4: Custom Tint
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            return uTintColor * lum;
        }
    }

    void main() {
        float aspect = uResolution.x / uResolution.y;
        vec2 aspectUv    = vUv    * vec2(aspect, 1.0);
        vec2 aspectMouse = uMouse * vec2(aspect, 1.0);

        float squareDist = max(
            abs(aspectUv.x - aspectMouse.x),
            abs(aspectUv.y - aspectMouse.y)
        );

        vec2 gridRes   = uResolution / uCellSize;
        vec2 sampledUv = (floor(vUv * gridRes) + 0.5) / gridRes;
        vec4 color     = texture2D(tDiffuse, sampledUv);
        
        // Apply exposure
        vec3 exposedColor = color.rgb * uExposure;
        
        float rawBrightness = dot(exposedColor, vec3(0.299, 0.587, 0.114));
        // Clamp brightness to 0-1 range to avoid artifacts
        rawBrightness = clamp(rawBrightness, 0.0, 1.0);
        
        float brightness = uInvert > 0.5 ? (1.0 - rawBrightness) : rawBrightness;

        vec2  localUv = fract(vUv * gridRes) - 0.5;
        float pattern = 0.0;

        ${buildGlslModeSwitch()}

        // Apply color mode
        vec3 processed = processColor(color.rgb);

        // Mix: pattern shape → processed color, background → uBgColor
        vec3 patternResult = mix(uBgColor, processed, pattern);

        float mask   = step(uSize, squareDist);
        float border = step(uSize, squareDist) - step(uSize + 0.002, squareDist);

        // Reveal area shows original, pattern area shows processed result
        vec3 revealColor = processColor(texture2D(tDiffuse, vUv).rgb);
        vec4 finalColor = mix(vec4(revealColor, 1.0), vec4(patternResult, 1.0), mask);
        gl_FragColor = finalColor + (vec4(0.0, 1.0, 0.0, 1.0) * border * 0.5);
    }
`;

const PatternShader = {
    uniforms: {
        tDiffuse: { value: null },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: {
            value: new THREE.Vector2(
                window.innerWidth * pixelRatio,
                window.innerHeight * pixelRatio
            ),
        },
        uSize: { value: 0.18 },
        uCellSize: { value: 14.0 * pixelRatio },
        uMode: { value: 0.0 },
        uColorMode: { value: 0.0 },
        uTintColor: { value: new THREE.Vector3(1.0, 0.0, 1.0) },
        uBgColor: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
        uInvert: { value: 0.0 },
        uExposure: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader,
};

/* ============================================================
   COMPOSER
   ============================================================ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const effectPass = new ShaderPass(PatternShader);
composer.addPass(effectPass);

/* ============================================================
   PATTERN SWITCHING
   ============================================================ */
let currentMode = 0;

window.setPattern = (mode, btn) => {
    currentMode = mode;
    effectPass.uniforms.uMode.value = mode;
    document.querySelectorAll('#pattern-buttons .btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('current-pattern').innerText = patterns[mode]?.name || 'Unknown';
};

/* ============================================================
   COLOR MODE
   ============================================================ */
let currentColorMode = 0;

window.setColorMode = (mode, btn) => {
    currentColorMode = mode;
    effectPass.uniforms.uColorMode.value = mode;
    document.querySelectorAll('.btn-color').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Show/hide tint picker
    const tintRow = document.getElementById('tint-picker-row');
    if (mode === 4) {
        tintRow.classList.add('visible');
    } else {
        tintRow.classList.remove('visible');
    }
};

/* ============================================================
   INVERT MODE (Paper Mode)
   ============================================================ */
window.toggleInvert = (checkbox) => {
    effectPass.uniforms.uInvert.value = checkbox.checked ? 1.0 : 0.0;

    // Auto-set background to white if inverting, black if not (optional UX helper)
    const bgPicker = document.getElementById('bg-color');
    if (checkbox.checked && bgPicker.value === '#000000') {
        bgPicker.value = '#ffffff';
        effectPass.uniforms.uBgColor.value.set(1.0, 1.0, 1.0);
    } else if (!checkbox.checked && bgPicker.value === '#ffffff') {
        bgPicker.value = '#000000';
        effectPass.uniforms.uBgColor.value.set(0.0, 0.0, 0.0);
    }
};

/* ============================================================
   SOURCE SWITCHING — 3D / Image / Video / Webcam
   ============================================================ */
function setSourceActive(type) {
    document.querySelectorAll('.btn-source').forEach((b) => b.classList.remove('active'));
    const btnId = { '3d': 'btn-src-3d', image: 'btn-src-img', video: 'btn-src-vid', webcam: 'btn-src-cam' }[type];
    document.getElementById(btnId)?.classList.add('active');
}

function cleanup() {
    // Cleanup video/webcam
    if (activeVideoEl) {
        activeVideoEl.pause();
        activeVideoEl.src = '';
        activeVideoEl.load();
        activeVideoEl.remove();
        activeVideoEl = null;
    }
    if (activeVideoTexture) {
        activeVideoTexture.dispose();
        activeVideoTexture = null;
    }
    if (webcamStream) {
        webcamStream.getTracks().forEach((t) => t.stop());
        webcamStream = null;
    }
}

function updateSourceInfo(filename) {
    const el = document.getElementById('source-info');
    if (filename) {
        el.textContent = '📎 ' + filename;
        el.classList.add('visible');
    } else {
        el.textContent = '';
        el.classList.remove('visible');
    }
}

/* --- 3D Scene --- */
function switchTo3D() {
    cleanup();
    // Make sure current active scene is visible
    sceneGroups.forEach((g, i) => {
        g.visible = (i === activeSceneIndex);
    });
    mediaPlane.visible = false;
    currentSource = '3d';
    // Update active button state
    document.querySelectorAll('.btn-source').forEach((b) => b.classList.remove('active'));
    document.getElementById(`btn-scene-${activeSceneIndex + 1}`)?.classList.add('active');

    updateSourceInfo(null);
    document.getElementById('current-source').innerText = '3D Scene';
    showToast('Source: 3D Scene');
}

/* --- Image --- */
function switchToImage() {
    document.getElementById('image-input').click();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    cleanup();

    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const tex = new THREE.Texture(img);
            tex.needsUpdate = true;
            tex.colorSpace = THREE.SRGBColorSpace;
            mediaMat.map = tex;
            mediaMat.color.set(0xffffff);
            mediaMat.needsUpdate = true;
            fitMediaPlane(img.width / img.height);
            sceneGroups.forEach(g => g.visible = false);
            mediaPlane.visible = true;
            currentSource = 'image';
            setSourceActive('image');
            updateSourceInfo(file.name);
            document.getElementById('current-source').innerText = 'Image';
            showToast('Image loaded ✓');
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

/* --- Video --- */
function switchToVideo() {
    document.getElementById('video-input').click();
}

function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    cleanup();

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.style.display = 'none';
    document.body.appendChild(video);

    video.addEventListener('loadedmetadata', () => {
        video.play();
        const tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        mediaMat.map = tex;
        mediaMat.color.set(0xffffff);
        mediaMat.needsUpdate = true;
        fitMediaPlane(video.videoWidth / video.videoHeight);
        activeVideoEl = video;
        activeVideoTexture = tex;
        sceneGroups.forEach(g => g.visible = false);
        mediaPlane.visible = true;
        currentSource = 'video';
        setSourceActive('video');
        updateSourceInfo(file.name);
        document.getElementById('current-source').innerText = 'Video';
        showToast('Video loaded ✓');
    });
    e.target.value = '';
}

/* --- Webcam --- */
async function switchToWebcam() {
    cleanup();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
        });
        webcamStream = stream;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        await video.play();

        const tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;

        mediaMat.map = tex;
        mediaMat.color.set(0xffffff);
        mediaMat.needsUpdate = true;
        fitMediaPlane(video.videoWidth / video.videoHeight);

        activeVideoEl = video;
        activeVideoTexture = tex;

        sceneGroups.forEach(g => g.visible = false);
        mediaPlane.visible = true;
        currentSource = 'webcam';
        setSourceActive('webcam');
        updateSourceInfo('Webcam');
        document.getElementById('current-source').innerText = 'Webcam';
        showToast('Webcam connected ✓');
    } catch (err) {
        console.error('Webcam error:', err);
        showToast('Webcam access denied ✗');
    }
}

/* --- Fit plane to camera view --- */
function fitMediaPlane(mediaAspect) {
    const { w: viewW, h: viewH } = calcPlaneSize();
    const viewAspect = viewW / viewH;
    let pw, ph;
    if (mediaAspect > viewAspect) {
        pw = viewW;
        ph = viewW / mediaAspect;
    } else {
        ph = viewH;
        pw = viewH * mediaAspect;
    }
    mediaGeo.dispose();
    mediaGeo = new THREE.PlaneGeometry(pw, ph);
    mediaPlane.geometry = mediaGeo;
}

/* Expose to HTML */
window.switchTo3D = switchTo3D;
window.switchToImage = switchToImage;
window.switchToVideo = switchToVideo;
window.switchToWebcam = switchToWebcam;

document.getElementById('image-input').addEventListener('change', handleImageUpload);
document.getElementById('video-input').addEventListener('change', handleVideoUpload);

/* ============================================================
   CONTROLS — sliders & pickers
   ============================================================ */

// Cell Size slider
const cellSlider = document.getElementById('cell-size-slider');
const cellVal = document.getElementById('cell-size-val');
cellSlider.addEventListener('input', () => {
    const v = parseFloat(cellSlider.value);
    effectPass.uniforms.uCellSize.value = v * pixelRatio;
    cellVal.textContent = v;
});

// Reveal Size slider
const revealSlider = document.getElementById('reveal-slider');
const revealVal = document.getElementById('reveal-val');
revealSlider.addEventListener('input', () => {
    effectPass.uniforms.uSize.value = v;
    revealVal.textContent = revealSlider.value;
});

// Exposure slider
const expoSlider = document.getElementById('exposure-slider');
const expoVal = document.getElementById('exposure-val');
effectPass.uniforms.uExposure = { value: 1.0 }; // Init Uniform if not set
expoSlider.addEventListener('input', () => {
    const v = parseFloat(expoSlider.value);
    effectPass.uniforms.uExposure.value = v;
    expoVal.textContent = v.toFixed(1);
});

// Tint Color picker
document.getElementById('tint-color').addEventListener('input', (e) => {
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    effectPass.uniforms.uTintColor.value.set(r, g, b);
});

// Background Color picker
document.getElementById('bg-color').addEventListener('input', (e) => {
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    effectPass.uniforms.uBgColor.value.set(r, g, b);
});

/* ============================================================
   MOUSE / TOUCH
   ============================================================ */
function updateMouse(x, y) {
    effectPass.uniforms.uMouse.value.set(
        x / window.innerWidth,
        1.0 - y / window.innerHeight
    );
}
window.addEventListener('mousemove', (e) => updateMouse(e.clientX, e.clientY));
window.addEventListener(
    'touchmove',
    (e) => updateMouse(e.touches[0].clientX, e.touches[0].clientY),
    { passive: false }
);

/* ============================================================
   RESIZE
   ============================================================ */
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pr = window.devicePixelRatio;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    effectPass.uniforms.uResolution.value.set(w * pr, h * pr);
    rawRenderTarget.setSize(w * pr, h * pr);

    if (currentSource !== '3d' && mediaMat.map) {
        const img = mediaMat.map.image;
        if (img) {
            const aspect = (img.videoWidth || img.width) / (img.videoHeight || img.height);
            if (aspect) fitMediaPlane(aspect);
        }
    }
});

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

/* ============================================================
   DOWNLOAD HELPER
   ============================================================ */
function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 200);
}

/* ============================================================
   EXPORT PNG
   ============================================================ */
window.exportPNG = () => {
    showToast('Generating PNG…');
    const savedSize = effectPass.uniforms.uSize.value;
    effectPass.uniforms.uSize.value = 0.0;
    composer.render();
    effectPass.uniforms.uSize.value = savedSize;

    renderer.domElement.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const slug = patterns[currentMode]?.slug || 'pattern';
        triggerDownload(url, `pattern_${slug}_${Date.now()}.png`);
        showToast('PNG saved ✓');
    }, 'image/png');
};

/* ============================================================
   EXPORT SVG — uses svgRender() from patterns.js
   ============================================================ */
window.exportSVG = () => {
    const btnSvg = document.getElementById('btn-svg');
    btnSvg.disabled = true;
    showToast('Generating SVG… please wait');

    renderer.setRenderTarget(rawRenderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    const rtW = rawRenderTarget.width;
    const rtH = rawRenderTarget.height;
    const pixelBuffer = new Uint8Array(rtW * rtH * 4);
    renderer.readRenderTargetPixels(rawRenderTarget, 0, 0, rtW, rtH, pixelBuffer);

    const cellSize = effectPass.uniforms.uCellSize.value;
    const cols = Math.floor(rtW / cellSize);
    const rows = Math.floor(rtH / cellSize);
    const svgCell = 14;
    const svgW = cols * svgCell;
    const svgH = rows * svgCell;

    // Get background color hex
    const bg = effectPass.uniforms.uBgColor.value;
    const bgHex =
        '#' +
        ((Math.round(bg.x * 255) << 16) | (Math.round(bg.y * 255) << 8) | Math.round(bg.z * 255))
            .toString(16)
            .padStart(6, '0');

    const pat = patterns[currentMode];
    const parts = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const px = Math.floor((col + 0.5) * cellSize);
            const py = Math.floor((row + 0.5) * cellSize);
            const flippedY = rtH - 1 - py;
            const idx = (flippedY * rtW + px) * 4;

            let r = pixelBuffer[idx] / 255;
            let g = pixelBuffer[idx + 1] / 255;
            let b = pixelBuffer[idx + 2] / 255;

            // Apply Exposure
            r *= effectPass.uniforms.uExposure.value;
            g *= effectPass.uniforms.uExposure.value;
            b *= effectPass.uniforms.uExposure.value;

            let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            // Clamp brightness
            brightness = Math.min(1.0, Math.max(0.0, brightness));

            if (effectPass.uniforms.uInvert.value > 0.5) {
                brightness = 1.0 - brightness;
            }

            if (brightness < 0.03) continue;

            // Apply color mode for SVG
            if (currentColorMode === 1) {
                const lum = brightness;
                r = lum * 0.2; g = lum; b = lum * 0.1;
            } else if (currentColorMode === 2) {
                r = g = b = brightness;
            } else if (currentColorMode === 3) {
                const lum = brightness;
                r = Math.max(0, r * 2.5 - lum * 1.5);
                g = Math.max(0, g * 2.5 - lum * 1.5);
                b = Math.max(0, b * 2.5 - lum * 1.5);
            } else if (currentColorMode === 4) {
                const tint = effectPass.uniforms.uTintColor.value;
                r = tint.x * brightness;
                g = tint.y * brightness;
                b = tint.z * brightness;
            }

            const hex =
                '#' +
                ((Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255))
                    .toString(16)
                    .padStart(6, '0');

            const cx = (col + 0.5) * svgCell;
            const cy = (row + 0.5) * svgCell;
            const half = svgCell / 2;

            const shapes = pat.svgRender(cx, cy, half, brightness, hex);
            parts.push(...shapes);
        }
    }

    const svgContent = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW * 2}" height="${svgH * 2}" style="background:${bgHex}">`,
        ...parts,
        '</svg>',
    ].join('\n');

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const slug = pat?.slug || 'pattern';
    triggerDownload(url, `pattern_${slug}_${Date.now()}.svg`);
    btnSvg.disabled = false;
    showToast('SVG saved ✓');
};

/* ============================================================
   EXPORT RECORDING
   ============================================================ */
window.toggleRecord = () => {
    const btn = document.getElementById('btn-record');

    if (getIsRecording()) {
        stopRecording();
        btn.innerHTML = '🔴 Record WebM';
        btn.style.background = '';
        btn.style.color = '#ff0000';
        showToast('Processing Video…');
    } else {
        startRecording(renderer.domElement, () => {
            // Callback when recording stops automatically or error
            const b = document.getElementById('btn-record');
            b.innerHTML = '🔴 Record WebM';
            b.style.background = '';
            b.style.color = '#ff0000';
        });

        btn.innerHTML = '⏹ Stop Rec';
        btn.style.background = '#ff0000';
        btn.style.color = '#fff';
        showToast('Recording Started…');
    }
};

/* ============================================================
   ANIMATION LOOP
   ============================================================ */
function animate() {
    requestAnimationFrame(animate);
    if (currentSource === '3d') {
        const time = Date.now() * 0.001;

        if (activeSceneIndex === 0) {
            // Shapes (Rotate the whole group like original)
            groupShapes.rotation.y += 0.002;
            groupShapes.rotation.x += 0.001;
        } else if (activeSceneIndex === 1) {
            // Globe (Rotate earth on axis)
            earth.rotation.y = time * 0.1;
            clouds.rotation.y = time * 0.13; // Clouds move slightly faster
        } else if (activeSceneIndex === 2) {
            // Elegant Saturn
            saturnPlanet.rotation.y = time * 0.05;
            // Rotate particles ring
            saturnRings.rotation.z = -time * 0.1;
            // Gentle floating
            groupSaturn.position.y = Math.sin(time * 0.5) * 0.2;
        }
    }
    composer.render();
}

animate();
