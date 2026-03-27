const THREE = window.THREE;
import { CAM_ALERT_GRACE, CAM_COOLDOWN, CAM_RANGE, CAM_ROT_SPEED, CAM_SWEEP_DEG } from '../constants.js';

const STATE_COLOR = {
  IDLE: 0xff1744,
  ALERT: 0xffd600,
  ALARM: 0xff1744,
};

export class Camera3D {
  constructor(scene, position, baseYaw = 0) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.baseYaw = baseYaw;
    this.angle = -CAM_SWEEP_DEG * 0.5;
    this.sweepDir = 1;
    this.state = 'IDLE';
    this.alertTimer = 0;
    this.cooldownTimer = 0;

    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.8, 0.28), new THREE.MeshStandardMaterial({ color: 0x546e7a }));
    mount.position.y = 0.9;
    mount.castShadow = true;
    this.group.add(mount);

    this.head = new THREE.Group();
    this.head.position.y = 1.65;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.2), new THREE.MeshToonMaterial({ color: 0x263238 }));
    this.lens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshToonMaterial({ color: STATE_COLOR.IDLE }));
    this.lens.position.z = 0.16;
    this.head.add(body, this.lens);

    this.cone = new THREE.Mesh(
      new THREE.ConeGeometry(CAM_RANGE, CAM_RANGE, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff1744, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.cone.rotation.x = Math.PI / 2;
    this.cone.position.set(0, 0.02, CAM_RANGE * 0.5 + 0.1);
    this.head.add(this.cone);

    this.light = new THREE.PointLight(0xff1744, 0.8, 3);
    this.light.position.copy(this.lens.position);
    this.head.add(this.light);

    this.group.add(this.head);
    scene.add(this.group);
  }

  update(delta, playerPos) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) this.state = 'IDLE';
    }

    if (this.state !== 'ALARM') {
      this.angle += this.sweepDir * CAM_ROT_SPEED * delta;
      if (this.angle > CAM_SWEEP_DEG * 0.5 || this.angle < -CAM_SWEEP_DEG * 0.5) this.sweepDir *= -1;
    }

    this.head.rotation.y = this.baseYaw + THREE.MathUtils.degToRad(this.angle);

    const origin = this.group.position.clone().add(new THREE.Vector3(0, 1.65, 0));
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.head.getWorldQuaternion(new THREE.Quaternion()));
    const toPlayer = playerPos.clone().sub(origin);
    toPlayer.y = 0;

    const dist = toPlayer.length();
    let seen = false;
    if (dist < CAM_RANGE && dist > 0.01) {
      const dot = toPlayer.normalize().dot(new THREE.Vector3(forward.x, 0, forward.z).normalize());
      seen = dot > Math.cos(THREE.MathUtils.degToRad(CAM_SWEEP_DEG * 0.35));
    }

    if (seen) {
      this.alertTimer += delta;
      if (this.alertTimer > CAM_ALERT_GRACE) {
        this.state = 'ALARM';
        this.cooldownTimer = CAM_COOLDOWN;
      } else {
        this.state = 'ALERT';
      }
    } else {
      this.alertTimer = Math.max(0, this.alertTimer - delta * 0.7);
      if (this.state !== 'ALARM') this.state = this.alertTimer > 0 ? 'ALERT' : 'IDLE';
    }

    if (this.state === 'ALARM') {
      const flick = Math.floor(performance.now() * 0.025) % 2 === 0;
      this.lens.material.color.set(flick ? 0xffffff : 0xff1744);
      this.cone.material.color.set(0xff1744);
      this.cone.material.opacity = 0.3;
      this.light.color.set(flick ? 0xffffff : 0xff1744);
      this.light.intensity = 0.8 + Math.sin(performance.now() * 0.02) * 0.4;
    } else if (this.state === 'ALERT') {
      this.lens.material.color.set(0xffd600);
      this.cone.material.color.set(0xffd600);
      this.cone.material.opacity = 0.22;
      this.light.color.set(0xffd600);
      this.light.intensity = 0.6;
    } else {
      this.lens.material.color.set(STATE_COLOR.IDLE);
      this.cone.material.color.set(0xff1744);
      this.cone.material.opacity = 0.12;
      this.light.color.set(0xff1744);
      this.light.intensity = 0.5;
    }

    return this.state;
  }
}
