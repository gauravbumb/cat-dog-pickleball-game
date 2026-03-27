const THREE = window.THREE;
import {
  MAP_H,
  MAP_W,
  RAIN_COLOR,
  RAIN_COUNT,
  RAIN_MIN_Y,
  RAIN_PARTICLE_SIZE,
  RAIN_SPEED_MAX,
  RAIN_SPEED_MIN,
  RAIN_TOP_Y,
} from '../constants.js';

export class Rain {
  constructor(scene) {
    this.scene = scene;
    this.speeds = new Float32Array(RAIN_COUNT);
    this.positions = new Float32Array(RAIN_COUNT * 3);
    this.splashes = [];
    this.splashTimer = 0;

    this.geometry = new THREE.BufferGeometry();

    for (let i = 0; i < RAIN_COUNT; i += 1) {
      const idx = i * 3;
      this.positions[idx] = Math.random() * MAP_W;
      this.positions[idx + 1] = Math.random() * RAIN_TOP_Y;
      this.positions[idx + 2] = Math.random() * MAP_H;
      this.speeds[i] = THREE.MathUtils.randFloat(RAIN_SPEED_MIN, RAIN_SPEED_MAX);
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: RAIN_COLOR,
      size: RAIN_PARTICLE_SIZE,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.rotation.x = THREE.MathUtils.degToRad(10);
    this.scene.add(this.points);

    this.splashGeometry = new THREE.RingGeometry(0.02, 0.08, 16);
    this.splashMaterial = new THREE.MeshBasicMaterial({
      color: 0xb4dcff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  spawnSplash() {
    const splash = new THREE.Mesh(this.splashGeometry, this.splashMaterial.clone());
    splash.rotation.x = -Math.PI / 2;
    splash.position.set(Math.random() * MAP_W, 0.01, Math.random() * MAP_H);
    splash.scale.setScalar(0.01);
    splash.userData.life = 0;
    this.scene.add(splash);
    this.splashes.push(splash);
  }

  update(delta) {
    const pos = this.geometry.attributes.position;

    for (let i = 0; i < RAIN_COUNT; i += 1) {
      const yIdx = i * 3 + 1;
      pos.array[yIdx] -= this.speeds[i] * delta;

      if (pos.array[yIdx] < RAIN_MIN_Y) {
        pos.array[i * 3] = Math.random() * MAP_W;
        pos.array[yIdx] = RAIN_TOP_Y;
        pos.array[i * 3 + 2] = Math.random() * MAP_H;
      }
    }

    pos.needsUpdate = true;

    this.splashTimer += delta;
    if (this.splashTimer > 0.06) {
      this.splashTimer = 0;
      this.spawnSplash();
    }

    for (let i = this.splashes.length - 1; i >= 0; i -= 1) {
      const splash = this.splashes[i];
      splash.userData.life += delta;
      const t = splash.userData.life / 0.3;
      splash.scale.setScalar(THREE.MathUtils.lerp(0, 0.3, t));
      splash.material.opacity = THREE.MathUtils.lerp(0.3, 0, t);

      if (t >= 1) {
        this.scene.remove(splash);
        splash.material.dispose();
        this.splashes.splice(i, 1);
      }
    }
  }
}
