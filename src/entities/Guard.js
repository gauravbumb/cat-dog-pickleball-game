const THREE = window.THREE;
import { GUARD_SPEED, GUARD_SPEED_ALARM, ROAR_FREEZE } from '../constants.js';

function outlined(mesh, scale = 1.06) {
  const g = new THREE.Group();
  g.add(mesh);
  const o = new THREE.Mesh(mesh.geometry.clone(), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.BackSide }));
  o.scale.setScalar(scale);
  g.add(o);
  return g;
}

function makeAlertSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'black';
  ctx.font = 'bold 86px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 64, 68);
  const tex = new THREE.CanvasTexture(canvas);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
}

export class Guard {
  constructor(scene, startPos, patrolPath) {
    this.group = new THREE.Group();
    this.group.position.copy(startPos);
    this.patrolPath = patrolPath;
    this.patrolIndex = 0;
    this.state = 'PATROL';
    this.isFrozen = false;
    this.frozenTimer = 0;
    this.shootCooldown = 1;
    this.walkTime = 0;

    const body = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 6, 12), new THREE.MeshToonMaterial({ color: 0x1565c0 })));
    body.position.y = 0.45;
    this.group.add(body);

    this.head = new THREE.Group();
    const head = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), new THREE.MeshToonMaterial({ color: 0xffccbc })));
    this.head.position.set(0, 0.95, 0);
    const e1 = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshToonMaterial({ color: 0xffffff })), 1.03);
    e1.position.set(-0.07, 0.03, 0.2);
    const e2 = e1.clone();
    e2.position.x *= -1;
    const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshToonMaterial({ color: 0x111111 }));
    p1.position.set(-0.05, 0.03, 0.26);
    const p2 = p1.clone();
    p2.position.x *= -1;
    const brow1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.01), new THREE.MeshToonMaterial({ color: 0x2a2a2a }));
    brow1.position.set(-0.06, 0.11, 0.2);
    brow1.rotation.z = 0.28;
    const brow2 = brow1.clone();
    brow2.position.x *= -1;
    brow2.rotation.z *= -1;

    const hat = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), new THREE.MeshToonMaterial({ color: 0x1565c0 })), 1.03);
    hat.position.set(0, 0.23, 0);
    const brim = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), new THREE.MeshToonMaterial({ color: 0x0f4a91 })), 1.03);
    brim.position.set(0, 0.17, 0.07);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), new THREE.MeshToonMaterial({ color: 0xffeb3b }));
    badge.position.set(0, 0.2, 0.15);

    this.head.add(head, e1, e2, p1, p2, brow1, brow2, hat, brim, badge);
    this.group.add(this.head);

    this.armR = new THREE.Group();
    this.armL = new THREE.Group();
    this.legL = new THREE.Group();
    this.legR = new THREE.Group();

    this.armR.position.set(0.24, 0.7, 0);
    this.armL.position.set(-0.24, 0.7, 0);
    this.legL.position.set(-0.11, 0.26, 0);
    this.legR.position.set(0.11, 0.26, 0);
    const limb = new THREE.MeshToonMaterial({ color: 0xffccbc });
    const pants = new THREE.MeshToonMaterial({ color: 0x0d47a1 });
    this.armR.add(outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.24, 4, 8), limb)));
    this.armL.add(outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.24, 4, 8), limb)));
    this.legL.add(outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.34, 8), pants)));
    this.legR.add(outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.34, 8), pants)));

    this.rifleGroup = new THREE.Group();
    const rifle = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.58, 8), new THREE.MeshToonMaterial({ color: 0x37474f })), 1.03);
    rifle.rotation.z = Math.PI / 2;
    rifle.position.set(0.3, -0.05, 0.13);
    this.rifleGroup.add(rifle);
    this.armR.add(this.rifleGroup);

    this.group.add(this.armR, this.armL, this.legL, this.legR);

    this.alertSprite = makeAlertSprite();
    this.alertSprite.position.set(0, 1.6, 0);
    this.alertSprite.scale.set(0.5, 0.5, 0.5);
    this.alertSprite.visible = false;
    this.group.add(this.alertSprite);

    this.freezeGlow = new THREE.PointLight(0x4fc3f7, 0, 3);
    this.freezeGlow.position.set(0, 0.8, 0);
    this.group.add(this.freezeGlow);
    this.freezeBits = [];

    this.group.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    scene.add(this.group);
  }

  freeze() {
    this.isFrozen = true;
    this.frozenTimer = ROAR_FREEZE;
    this.freezeGlow.intensity = 0.9;
    this.group.traverse((m) => {
      if (m.isMesh && m.material?.color) m.material.color.lerp(new THREE.Color(0x4fc3f7), 0.55);
    });
    if (this.freezeBits.length === 0) {
      for (let i = 0; i < 6; i += 1) {
        const bit = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x9be7ff }));
        this.group.add(bit);
        this.freezeBits.push(bit);
      }
    }
  }

  update(delta, playerPos) {
    if (this.shootCooldown > 0) this.shootCooldown -= delta;

    if (this.isFrozen) {
      this.frozenTimer -= delta;
      this.freezeGlow.intensity = Math.max(0, this.freezeGlow.intensity - delta * 0.35);
      this.freezeBits.forEach((b, i) => {
        const t = performance.now() * 0.001 + i;
        b.position.set(Math.cos(t) * 0.22, 0.6 + Math.sin(t * 1.5) * 0.12, Math.sin(t) * 0.22);
      });
      if (this.frozenTimer <= 0) {
        this.isFrozen = false;
      }
      return;
    }

    let speed = this.state === 'ALARM' ? GUARD_SPEED_ALARM : GUARD_SPEED;
    if (this.state === 'ALERT') {
      const toPlayer = playerPos.clone().sub(this.group.position);
      toPlayer.y = 0;
      if (toPlayer.lengthSq() > 0.05) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, speed * delta);
        const tRot = Math.atan2(toPlayer.x, toPlayer.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, tRot, 0.13);
      }
    } else {
      const target = this.patrolPath[this.patrolIndex];
      const to = target.clone().sub(this.group.position);
      to.y = 0;
      if (to.length() < 0.2) {
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
      } else {
        to.normalize();
        this.group.position.addScaledVector(to, speed * delta);
        const tRot = Math.atan2(to.x, to.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, tRot, 0.09);
      }
    }

    this.walkTime += delta * 5;
    const swing = Math.sin(this.walkTime);
    this.legL.rotation.x = swing * 0.2;
    this.legR.rotation.x = -swing * 0.2;
    this.armL.rotation.x = -swing * 0.18;
    this.armR.rotation.x = swing * 0.18;
    this.group.position.y = Math.sin(this.walkTime * 2) * 0.02;
    this.group.rotation.z = Math.sin(this.walkTime) * 0.03;

    this.alertSprite.visible = this.state === 'ALERT' || this.state === 'ALARM';
  }

  recoil() {
    this.rifleGroup.position.x = 0.2;
  }

  postUpdate(delta) {
    this.rifleGroup.position.x = THREE.MathUtils.lerp(this.rifleGroup.position.x, 0, Math.min(1, delta * 14));
    this.alertSprite.material.rotation += delta * 0.4;
  }
}
