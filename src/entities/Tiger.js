const THREE = window.THREE;
import { ROAR_COOLDOWN, ROAR_RADIUS, TIGER_MIN_DIST, TIGER_SPEED } from '../constants.js';

function outlined(mesh, scale = 1.07) {
  const g = new THREE.Group();
  g.add(mesh);
  const o = new THREE.Mesh(mesh.geometry.clone(), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.BackSide }));
  o.scale.setScalar(scale);
  g.add(o);
  return g;
}

function eye(px) {
  const g = new THREE.Group();
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshToonMaterial({ color: 0xffffff }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshToonMaterial({ color: 0x0d0d0d }));
  pupil.position.set(-0.02, 0, 0.08);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshToonMaterial({ color: 0xffffff }));
  dot.position.set(-0.007, 0.02, 0.1);
  g.add(white, pupil, dot);
  g.position.set(px, 0.08, 0.41);
  return g;
}

export class Tiger {
  constructor(scene, startPos = new THREE.Vector3(4.5, 0, 15.5)) {
    this.group = new THREE.Group();
    this.group.position.copy(startPos);

    this.bodyGroup = new THREE.Group();
    const body = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.65, 6, 14), new THREE.MeshToonMaterial({ color: 0xff8f00 })));
    body.rotation.z = Math.PI / 2;
    body.scale.y = 0.72;
    body.position.y = 0.45;
    this.bodyGroup.add(body);

    this.headGroup = new THREE.Group();
    const head = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 18), new THREE.MeshToonMaterial({ color: 0xff8f00 })));
    head.scale.y = 0.9;
    const muzzle = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.22), new THREE.MeshToonMaterial({ color: 0xffccbc })), 1.03);
    muzzle.position.set(0, -0.1, 0.32);
    this.jaw = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.08, 0.18), new THREE.MeshToonMaterial({ color: 0xffccbc })), 1.03);
    this.jaw.position.set(0, -0.18, 0.3);

    const earL = outlined(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 12), new THREE.MeshToonMaterial({ color: 0xff6d00 })));
    earL.position.set(-0.16, 0.28, 0.05);
    earL.rotation.z = 0.2;
    const earR = earL.clone();
    earR.position.x *= -1;
    earR.rotation.z *= -1;

    this.headGroup.add(head, muzzle, this.jaw, earL, earR, eye(-0.12), eye(0.12));
    this.headGroup.position.set(0.55, 0.56, 0);

    for (let i = 0; i < 5; i += 1) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.55), new THREE.MeshToonMaterial({ color: 0x1a1a1a }));
      stripe.position.set(-0.42 + i * 0.2, 0.5, 0);
      stripe.rotation.y = 0.4 - i * 0.15;
      this.bodyGroup.add(stripe);
    }

    for (let i = 0; i < 2; i += 1) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.2), new THREE.MeshToonMaterial({ color: 0x1a1a1a }));
      stripe.position.set(-0.09 + i * 0.18, 0.56, 0.32);
      this.headGroup.add(stripe);
    }

    this.tailRoot = new THREE.Group();
    const t1 = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 8), new THREE.MeshToonMaterial({ color: 0xff8f00 })));
    t1.rotation.z = Math.PI / 2.4;
    const t2 = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.35, 8), new THREE.MeshToonMaterial({ color: 0xff8f00 })));
    t2.position.set(-0.28, 0.16, 0);
    t2.rotation.z = Math.PI / 2.6;
    this.tailRoot.add(t1, t2);
    this.tailRoot.position.set(-0.58, 0.5, 0);

    this.group.add(this.bodyGroup, this.headGroup, this.tailRoot);
    this.group.traverse((m) => { if (m.isMesh) m.castShadow = true; });

    this.roarRing = null;
    this.roarLight = new THREE.PointLight(0xff8f00, 0, 8);
    this.roarLight.position.y = 1;
    this.group.add(this.roarLight);
    scene.add(this.group);

    this.following = false;
    this.roarCooldown = 0;
    this.moveTime = 0;
    this.breathe = 0;
  }

  tryRoar(scene) {
    if (this.roarCooldown > 0) return false;
    this.roarCooldown = ROAR_COOLDOWN;
    this.roarTimer = 0.4;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.35, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(this.group.position).setY(0.05);
    scene.add(ring);
    this.roarRing = { mesh: ring, life: 0 };
    this.roarLight.intensity = 1.5;
    return true;
  }

  update(delta, playerPos, scene) {
    if (this.roarCooldown > 0) this.roarCooldown -= delta;
    this.breathe += delta;

    let moving = false;
    if (this.following) {
      const toPlayer = playerPos.clone().sub(this.group.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();
      if (dist > TIGER_MIN_DIST) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, TIGER_SPEED * delta);
        const target = Math.atan2(toPlayer.x, toPlayer.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, target, 0.12);
        moving = true;
      }
    }

    if (moving) {
      this.moveTime += delta * 8;
      this.group.position.x += Math.sin(this.moveTime * 2) * 0.002;
      this.group.position.z += Math.cos(this.moveTime * 2) * 0.002;
      this.group.rotation.z = Math.sin(this.moveTime * 2) * 0.05;
      this.headGroup.position.y = 0.56 + Math.sin(this.moveTime * 2) * 0.03;
    } else {
      this.group.rotation.z *= 0.9;
      this.bodyGroup.scale.set(
        1 + Math.sin(this.breathe * Math.PI) * 0.04,
        1 + Math.sin(this.breathe * Math.PI) * 0.02,
        1 + Math.sin(this.breathe * Math.PI) * 0.04,
      );
      this.tailRoot.rotation.y = Math.sin(this.breathe * 1.7) * 0.25;
    }

    if (this.roarTimer > 0) {
      this.roarTimer -= delta;
      const p = 1 - this.roarTimer / 0.4;
      this.headGroup.rotation.x = 0.3 * (1 - p);
      this.jaw.rotation.x = -0.5 * (1 - p);
      this.bodyGroup.scale.setScalar(1 + 0.15 * (1 - p));
    } else {
      this.headGroup.rotation.x *= 0.82;
      this.jaw.rotation.x *= 0.82;
      this.bodyGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.18);
    }

    this.roarLight.intensity = Math.max(0, this.roarLight.intensity - delta * 5);

    if (this.roarRing) {
      this.roarRing.life += delta;
      const t = this.roarRing.life / 0.4;
      this.roarRing.mesh.scale.setScalar(THREE.MathUtils.lerp(0.2, ROAR_RADIUS * 0.7, t));
      this.roarRing.mesh.material.opacity = THREE.MathUtils.lerp(0.8, 0, t);
      if (t >= 1) {
        scene.remove(this.roarRing.mesh);
        this.roarRing.mesh.geometry.dispose();
        this.roarRing.mesh.material.dispose();
        this.roarRing = null;
      }
    }
  }
}
