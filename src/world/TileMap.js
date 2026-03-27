const THREE = window.THREE;
import { MAP_H, MAP_W, TILE } from '../constants.js';

function makeConcreteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#37474F';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 12000; i += 1) {
    const v = 40 + Math.random() * 40;
    ctx.fillStyle = `rgba(${v}, ${v + 6}, ${v + 10}, ${Math.random() * 0.13})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }

  ctx.strokeStyle = 'rgba(17, 24, 29, 0.25)';
  for (let i = 0; i < 30; i += 1) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

export class TileMap {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'TileMap';
    this.grid = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => 'FLOOR'));
    this.interactives = {
      cage: new THREE.Vector2(4, 15),
      desk: new THREE.Vector2(18, 6),
      truck: [new THREE.Vector2(28, 27), new THREE.Vector2(29, 27)],
      baskets: [new THREE.Vector2(7, 10), new THREE.Vector2(15, 20), new THREE.Vector2(23, 9)],
    };

    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      map: makeConcreteTexture(),
      roughness: 0.2,
      metalness: 0.1,
    });
    this.puddleMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.78 });
    this.wallMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9, metalness: 0.0 });

    this.walls = [];
    this.puddles = [];
    this.cageDoorMeshes = [];
    this.basketMeshes = [];

    this.build();
    this.scene.add(this.group);
  }

  setTile(x, z, type) {
    if (x < 0 || z < 0 || x >= MAP_W || z >= MAP_H) return;
    this.grid[z][x] = type;
  }

  isBlocked(x, z, cageUnlocked) {
    if (x < 0 || z < 0 || x >= MAP_W || z >= MAP_H) return true;
    const t = this.grid[z][x];
    if (t === 'WALL') return true;
    if (t === 'CAGE' && !cageUnlocked) return true;
    return false;
  }

  getTile(x, z) {
    if (x < 0 || z < 0 || x >= MAP_W || z >= MAP_H) return 'WALL';
    return this.grid[z][x];
  }

  worldToTile(v) {
    return { x: Math.floor(v.x), z: Math.floor(v.z) };
  }

  buildWallsLayout() {
    for (let x = 0; x < MAP_W; x += 1) {
      this.setTile(x, 0, 'WALL');
      this.setTile(x, MAP_H - 1, 'WALL');
    }
    for (let z = 0; z < MAP_H; z += 1) {
      this.setTile(0, z, 'WALL');
      this.setTile(MAP_W - 1, z, 'WALL');
    }

    for (let x = 5; x <= 25; x += 1) this.setTile(x, 12, 'WALL');
    for (let x = 6; x <= 27; x += 1) this.setTile(x, 22, 'WALL');
    for (let z = 4; z <= 19; z += 1) this.setTile(10, z, 'WALL');
    for (let z = 14; z <= 27; z += 1) this.setTile(20, z, 'WALL');

    this.setTile(4, 15, 'CAGE');
    this.setTile(18, 6, 'DESK');
    this.setTile(28, 27, 'TRUCK');
    this.setTile(29, 27, 'TRUCK');

    const puddles = [
      [3, 8], [4, 8], [5, 8], [13, 18], [14, 18], [15, 18], [24, 5], [24, 6], [25, 6], [26, 25], [27, 25],
    ];
    puddles.forEach(([x, z]) => this.setTile(x, z, 'PUDDLE'));

    this.interactives.baskets.forEach((b) => this.setTile(b.x, b.y, 'BASKET'));
  }

  createFloorTile(x, z) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(TILE, TILE), this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x + 0.5, 0, z + 0.5);
    floor.receiveShadow = true;
    this.group.add(floor);

    const tile = this.grid[z][x];
    if (tile === 'PUDDLE') {
      const water = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 1), this.puddleMat.clone());
      water.position.set(x + 0.5, 0.01, z + 0.5);
      water.receiveShadow = true;
      water.userData.baseOpacity = water.material.opacity;
      this.group.add(water);
      this.puddles.push(water);
    }
  }

  createWall(x, z) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), this.wallMat);
    wall.position.set(x + 0.5, 0.6, z + 0.5);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);
    this.walls.push(wall);
  }

  createCageDoor(x, z) {
    const doorGroup = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xff6d00 }));
    panel.castShadow = true;
    doorGroup.add(panel);
    for (let i = -0.35; i <= 0.35; i += 0.14) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.1, 0.12), new THREE.MeshStandardMaterial({ color: 0x2b2b2b }));
      bar.position.x = i;
      doorGroup.add(bar);
    }
    doorGroup.position.set(x + 0.5, 0.6, z + 0.5);
    this.group.add(doorGroup);
    this.cageDoorMeshes.push(doorGroup);
  }

  createDesk(x, z) {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    desk.position.set(x + 0.5, 0.25, z + 0.5);
    desk.castShadow = true;
    desk.receiveShadow = true;
    this.group.add(desk);
  }

  createTruck(x, z) {
    const truck = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), new THREE.MeshStandardMaterial({ color: 0x69f0ae }));
    body.position.set(0.5, 0.5, 0);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.95), new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
    cab.position.set(-0.45, 0.45, 0);
    body.castShadow = true;
    cab.castShadow = true;
    truck.add(body, cab);
    truck.position.set(x + 0.5, 0, z + 0.5);
    this.group.add(truck);
  }

  createBasket(x, z) {
    const basket = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.18, 16), new THREE.MeshToonMaterial({ color: 0x8d6e63 }));
    const meat = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshToonMaterial({ color: 0xef5350 }));
    meat.position.y = 0.13;
    basket.add(base, meat);
    basket.position.set(x + 0.5, 0.12, z + 0.5);
    basket.userData.collected = false;
    this.group.add(basket);
    this.basketMeshes.push(basket);
  }

  build() {
    this.buildWallsLayout();
    for (let z = 0; z < MAP_H; z += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        this.createFloorTile(x, z);
        const t = this.grid[z][x];
        if (t === 'WALL') this.createWall(x, z);
        if (t === 'CAGE') this.createCageDoor(x, z);
        if (t === 'DESK') this.createDesk(x, z);
        if (t === 'TRUCK' && x === 28) this.createTruck(x, z);
        if (t === 'BASKET') this.createBasket(x, z);
      }
    }
  }

  unlockCage() {
    this.cageDoorMeshes.forEach((m) => this.group.remove(m));
    this.cageDoorMeshes = [];
  }

  update(delta, elapsed) {
    this.puddles.forEach((p, i) => {
      p.material.opacity = p.userData.baseOpacity + Math.sin(elapsed * 3 + i) * 0.06;
    });
  }
}
