// Instanced
const raw = document.createElement("canvas");
raw.width = 16;
raw.height = 16;
const rtx = raw.getContext("2d")!;
rtx.fillStyle = "orange";
rtx.fillRect(0, 0, 16, 16);
// rtx.fillStyle = "pink";
// rtx.fillRect(0, 0, 16 / 2, 16 / 2);
const texture = new THREE.CanvasTexture(raw);
texture.magFilter = THREE.NearestFilter;

// set up cube
const geometry = new THREE.PlaneBufferGeometry(2, 2);
const material = new THREE.MeshBasicMaterial({
  map: texture,
  wireframe: true,
});
const mesh = new THREE.InstancedMesh(geometry, material, 90 * 120);
scene.add(mesh);

camera.position.z = 5;

const visibleHeight =
  2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
const zoomPixel = visibleHeight / window.innerHeight;

camera.position.z = 0;

const size = zoomPixel * 16;
const scaler = new THREE.Vector3(size / 2, size / 2, 1);
const matrix = new THREE.Matrix4();
matrix.scale(scaler);
for (let r = 0; r < 120; r++) {
  for (let c = 0; c < 90; c++) {
    matrix.setPosition(
      c * size - (90 / 2) * size,
      r * size - (120 / 2) * size,
      0
    );
    mesh.setMatrixAt(r * 90 + c, matrix);
  }
}
