const THREE = window.THREE;

function outlined(mesh, scale = 1.07) {
  const g = new THREE.Group();
  g.add(mesh);
  const outline = new THREE.Mesh(mesh.geometry.clone(), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.BackSide }));
  outline.scale.setScalar(scale);
  g.add(outline);
  return g;
}

function createEye(px) {
  const eye = new THREE.Group();
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), new THREE.MeshToonMaterial({ color: 0xffffff }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshToonMaterial({ color: 0x111111 }));
  pupil.scale.set(1, 0.7, 1);
  pupil.position.set(0.022, -0.005, 0.075);
  const spec = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), new THREE.MeshToonMaterial({ color: 0xffffff }));
  spec.position.set(0.03, 0.02, 0.095);
  eye.add(white, pupil, spec);
  eye.position.set(px, 0.09, 0.31);
  return eye;
}

export class Player {
  constructor(scene, startPos = new THREE.Vector3(2.5, 0, 2.5)) {
    this.group = new THREE.Group();
    this.group.position.copy(startPos);
    this.group.position.y = 0;

    this.walkTime = 0;

    this.hips = new THREE.Group();
    this.hips.position.y = 0.45;

    const body = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.55, 6, 12), new THREE.MeshToonMaterial({ color: 0x8d6e63 })));
    body.position.y = 0.2;

    const raincoat = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.62, 6, 12), new THREE.MeshToonMaterial({ color: 0x546e7a, transparent: true, opacity: 0.85 })), 1.04);
    raincoat.position.y = 0.2;

    this.headGroup = new THREE.Group();
    const head = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshToonMaterial({ color: 0xffccbc })));
    this.headGroup.position.set(0, 0.94, 0.03);

    const brim = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 20), new THREE.MeshToonMaterial({ color: 0x4e342e })), 1.03);
    brim.rotation.x = Math.PI / 2;
    brim.position.set(0, 0.13, 0.02);
    const cap = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.1, 16), new THREE.MeshToonMaterial({ color: 0x4e342e })), 1.03);
    cap.position.set(0, 0.2, 0);
    cap.rotation.z = -0.15;

    this.headGroup.add(head, createEye(-0.09), createEye(0.09), brim, cap);

    this.armL = new THREE.Group();
    this.armR = new THREE.Group();
    this.legL = new THREE.Group();
    this.legR = new THREE.Group();

    const armGeo = new THREE.CapsuleGeometry(0.08, 0.28, 4, 8);
    const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.38, 10);
    const limbMat = new THREE.MeshToonMaterial({ color: 0xffccbc });
    const pantsMat = new THREE.MeshToonMaterial({ color: 0x455a64 });

    const lArmMesh = outlined(new THREE.Mesh(armGeo, limbMat));
    const rArmMesh = outlined(new THREE.Mesh(armGeo, limbMat));
    lArmMesh.rotation.z = 0.1;
    rArmMesh.rotation.z = -0.1;

    const lLegMesh = outlined(new THREE.Mesh(legGeo, pantsMat));
    const rLegMesh = outlined(new THREE.Mesh(legGeo, pantsMat));

    this.armL.position.set(-0.26, 0.72, 0);
    this.armR.position.set(0.26, 0.72, 0);
    this.legL.position.set(-0.12, 0.28, 0);
    this.legR.position.set(0.12, 0.28, 0);

    this.armL.add(lArmMesh);
    this.armR.add(rArmMesh);
    this.legL.add(lLegMesh);
    this.legR.add(rLegMesh);

    this.group.add(this.hips, body, raincoat, this.headGroup, this.armL, this.armR, this.legL, this.legR);
    this.group.traverse((c) => {
      if (c.isMesh) c.castShadow = true;
    });
    scene.add(this.group);
  }

  updateAnimation(delta, speedNorm) {
    if (speedNorm > 0.1) {
      this.walkTime += delta * (5 + speedNorm * 5);
      const s = Math.sin(this.walkTime);
      this.legL.rotation.x = s * 0.26;
      this.legR.rotation.x = -s * 0.26;
      this.armL.rotation.x = -s * 0.24;
      this.armR.rotation.x = s * 0.24;
      this.headGroup.position.y = 0.94 + Math.sin(this.walkTime * 2) * 0.02;
    } else {
      this.walkTime += delta;
      this.legL.rotation.x *= 0.85;
      this.legR.rotation.x *= 0.85;
      this.armL.rotation.x *= 0.85;
      this.armR.rotation.x *= 0.85;
      this.headGroup.position.y = 0.94 + Math.sin(this.walkTime * 1.8) * 0.01;
    }
  }
}
