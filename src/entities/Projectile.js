const THREE = window.THREE;

export class Projectile {
  constructor(scene, origin, dir) {
    this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), new THREE.MeshToonMaterial({ color: 0xcfd8dc }));
    this.mesh.rotation.z = Math.PI / 2;
    this.mesh.position.copy(origin);
    this.velocity = dir.clone().normalize().multiplyScalar(9.5);
    this.active = true;
    this.life = 2.5;
    scene.add(this.mesh);
  }

  update(delta) {
    if (!this.active) return;
    this.life -= delta;
    if (this.life <= 0) this.active = false;
    this.mesh.position.addScaledVector(this.velocity, delta);
  }
}
