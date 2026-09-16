import {
  Color3,
  Color4,
  DirectionalLight,
  DynamicTexture,
  Engine,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

export type Puzzle = {
  id: number;
  enclosure: string;
  difficulty: string;
  title: string;
  question: string;
  options: string[];
  correct: number;
  reward: number;
};

export type GameStats = {
  score: number;
  coins: number;
  distance: number;
  level: number;
  tokens: number;
};

export type GameCallbacks = {
  onStats: (stats: GameStats) => void;
  onPuzzle: (puzzle: Puzzle) => void;
  onFeedback: (message: string, tone: "good" | "warn") => void;
  onFinish: () => void;
};

export type GameHandle = {
  scene: Scene;
  resolvePuzzle: (correct: boolean) => void;
  steer: (direction: -1 | 1) => void;
  dispose: () => void;
};

const PUZZLES: Puzzle[] = [
  {
    id: 1,
    enclosure: "بوابة الزرافة",
    difficulty: "سهل",
    title: "أكمل السلسلة",
    question: "الزرافة تلتقط الأوراق بهذا النمط: 2، 4، 6، ؟",
    options: ["7", "8", "10"],
    correct: 1,
    reward: 120,
  },
  {
    id: 2,
    enclosure: "ممر الفيل",
    difficulty: "متوسط",
    title: "منطق القطيع",
    question: "أي عبارة يجب أن تكون صحيحة إذا كانت كل الأفيال تشرب الماء عند الغروب؟",
    options: ["فيل واحد لا يشرب", "كل الأفيال تشرب عند الغروب", "لا يوجد غروب"],
    correct: 1,
    reward: 220,
  },
  {
    id: 3,
    enclosure: "عرين النمر",
    difficulty: "صعب",
    title: "مفاتيح العرين",
    question: "رتّب المفاتيح لفتح البوابة: الأحمر قبل الأزرق، والأخضر بعد الأحمر.",
    options: ["أزرق ← أحمر ← أخضر", "أحمر ← أخضر ← أزرق", "أخضر ← أحمر ← أزرق"],
    correct: 1,
    reward: 400,
  },
];

const jungleTextureUrl = "/manus-storage/jungle-ambience_5b160103.jpg";

function material(scene: Scene, name: string, color: Color3, emissive = 0) {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = new Color3(0.12, 0.12, 0.12);
  if (emissive > 0) mat.emissiveColor = color.scale(emissive);
  return mat;
}

function box(
  scene: Scene,
  name: string,
  dimensions: { width: number; height: number; depth: number },
  position: Vector3,
  mat: StandardMaterial,
  parent?: TransformNode,
) {
  const mesh = MeshBuilder.CreateBox(name, dimensions, scene);
  mesh.position.copyFrom(position);
  mesh.material = mat;
  if (parent) mesh.parent = parent;
  return mesh;
}

function sphere(
  scene: Scene,
  name: string,
  diameter: number,
  position: Vector3,
  mat: StandardMaterial,
  scaling = new Vector3(1, 1, 1),
  parent?: TransformNode,
) {
  const mesh = MeshBuilder.CreateSphere(name, { diameter, segments: 18 }, scene);
  mesh.position.copyFrom(position);
  mesh.scaling.copyFrom(scaling);
  mesh.material = mat;
  if (parent) mesh.parent = parent;
  return mesh;
}

function cylinder(
  scene: Scene,
  name: string,
  options: { height: number; diameter?: number; diameterTop?: number; diameterBottom?: number },
  position: Vector3,
  mat: StandardMaterial,
  parent?: TransformNode,
) {
  const mesh = MeshBuilder.CreateCylinder(name, { ...options, tessellation: 16 }, scene);
  mesh.position.copyFrom(position);
  mesh.material = mat;
  if (parent) mesh.parent = parent;
  return mesh;
}

function labelPlane(scene: Scene, text: string, position: Vector3, accent: string) {
  const texture = new DynamicTexture(`label-${text}`, { width: 512, height: 128 }, scene, true);
  texture.hasAlpha = true;
  const ctx = texture.getContext() as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = "rgba(11, 13, 15, .92)";
  ctx.fillRect(4, 4, 504, 120);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 120);
  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4d6";
  ctx.fillText(text, 256, 65);
  texture.update();
  const mat = new StandardMaterial(`label-mat-${text}`, scene);
  mat.diffuseTexture = texture;
  mat.opacityTexture = texture;
  mat.emissiveColor = new Color3(0.18, 0.07, 0.03);
  const plane = MeshBuilder.CreatePlane(`label-${text}-plane`, { width: 3.2, height: 0.8 }, scene);
  plane.position.copyFrom(position);
  plane.material = mat;
  return plane;
}

function addTree(scene: Scene, x: number, z: number, scale = 1) {
  const trunk = material(scene, `trunk-${x}-${z}`, new Color3(0.18, 0.09, 0.035));
  const leaf = material(scene, `leaf-${x}-${z}`, new Color3(0.08, 0.23, 0.12), 0.08);
  cylinder(scene, "tree-trunk", { height: 5 * scale, diameter: 0.6 * scale }, new Vector3(x, 2.5 * scale, z), trunk);
  sphere(scene, "tree-crown-a", 4.2 * scale, new Vector3(x, 5.8 * scale, z), leaf, new Vector3(1.25, 0.82, 1));
  sphere(scene, "tree-crown-b", 3.2 * scale, new Vector3(x + 1.1 * scale, 6.6 * scale, z + 0.4), leaf, new Vector3(1.05, 0.72, 0.9));
}

function addGiraffe(scene: Scene, x: number, z: number) {
  const gold = material(scene, "giraffe-gold", new Color3(0.68, 0.39, 0.12));
  const spots = material(scene, "giraffe-spots", new Color3(0.18, 0.07, 0.025));
  sphere(scene, "giraffe-body", 2.1, new Vector3(x, 1.65, z), gold, new Vector3(1.35, 0.7, 1));
  cylinder(scene, "giraffe-neck", { height: 3.9, diameter: 0.55 }, new Vector3(x + 0.35, 3.35, z), gold);
  sphere(scene, "giraffe-head", 1.15, new Vector3(x + 0.35, 5.45, z + 0.18), gold, new Vector3(1.2, 0.8, 1.1));
  sphere(scene, "giraffe-snout", 0.55, new Vector3(x + 0.35, 5.2, z + 0.72), spots, new Vector3(1, 0.75, 1));
  for (const dx of [-0.65, 0.65]) for (const dz of [-0.45, 0.45]) cylinder(scene, "giraffe-leg", { height: 1.8, diameter: 0.22 }, new Vector3(x + dx, 0.75, z + dz), gold);
  for (const p of [[-0.45, 2.2, 0.7], [0.55, 1.6, -0.7], [0.1, 3.2, 0.2], [0.4, 4.1, -0.2]] as number[][]) sphere(scene, "giraffe-spot", 0.26, new Vector3(x + p[0], p[1], z + p[2]), spots, new Vector3(1, 1.5, 0.35));
}

function addElephant(scene: Scene, x: number, z: number) {
  const grey = material(scene, "elephant-grey", new Color3(0.29, 0.31, 0.28));
  const dark = material(scene, "elephant-dark", new Color3(0.12, 0.13, 0.12));
  sphere(scene, "elephant-body", 3.4, new Vector3(x, 1.65, z), grey, new Vector3(1.2, 0.75, 1.15));
  sphere(scene, "elephant-head", 2.1, new Vector3(x, 2.45, z + 1.1), grey, new Vector3(1.05, 0.95, 0.9));
  cylinder(scene, "elephant-trunk", { height: 1.7, diameterTop: 0.48, diameterBottom: 0.23 }, new Vector3(x, 1.6, z + 2), grey);
  for (const dx of [-1.05, 1.05]) for (const dz of [-0.65, 0.65]) cylinder(scene, "elephant-leg", { height: 1.5, diameter: 0.42 }, new Vector3(x + dx, 0.75, z + dz), grey);
  for (const dx of [-0.9, 0.9]) {
    const ear = MeshBuilder.CreateTorus("elephant-ear", { diameter: 1.7, thickness: 0.15, tessellation: 18 }, scene);
    ear.position = new Vector3(x + dx, 2.75, z + 1.08);
    ear.scaling = new Vector3(0.9, 1.2, 0.35);
    ear.material = dark;
  }
}

function addTiger(scene: Scene, x: number, z: number) {
  const orange = material(scene, "tiger-orange", new Color3(0.72, 0.24, 0.05));
  const stripe = material(scene, "tiger-stripe", new Color3(0.08, 0.035, 0.018));
  sphere(scene, "tiger-body", 2.25, new Vector3(x, 1.25, z), orange, new Vector3(1.4, 0.7, 0.9));
  sphere(scene, "tiger-head", 1.2, new Vector3(x, 1.85, z + 0.9), orange, new Vector3(1.1, 0.9, 0.95));
  for (const dx of [-0.45, 0, 0.45]) box(scene, "tiger-stripe", { width: 0.15, height: 0.8, depth: 1.45 }, new Vector3(x + dx, 1.35, z - 0.1), stripe);
  for (const dx of [-0.7, 0.7]) for (const dz of [-0.42, 0.42]) cylinder(scene, "tiger-leg", { height: 0.8, diameter: 0.25 }, new Vector3(x + dx, 0.55, z + dz), orange);
}

function addLion(scene: Scene) {
  const root = new TransformNode("lion-root", scene);
  root.position = new Vector3(0, 0.15, -7);
  const fur = material(scene, "lion-fur", new Color3(0.68, 0.3, 0.07));
  const mane = material(scene, "lion-mane", new Color3(0.16, 0.055, 0.018));
  const cream = material(scene, "lion-cream", new Color3(0.86, 0.53, 0.2));
  sphere(scene, "lion-body", 2.2, new Vector3(0, 1.75, 0), fur, new Vector3(1.05, 0.62, 1.45), root);
  box(scene, "lion-back-highlight", { width: 1.05, height: 0.22, depth: 1.65 }, new Vector3(0, 2.26, -0.08), cream, root);
  sphere(scene, "lion-chest", 1.25, new Vector3(0, 1.85, 1.0), cream, new Vector3(0.78, 0.75, 0.72), root);
  sphere(scene, "lion-mane", 1.5, new Vector3(0, 2.7, 1.05), mane, new Vector3(1.08, 1.15, 0.92), root);
  sphere(scene, "lion-head", 1.15, new Vector3(0, 2.75, 1.23), fur, new Vector3(1.02, 0.92, 0.95), root);
  sphere(scene, "lion-muzzle", 0.54, new Vector3(0, 2.5, 1.77), cream, new Vector3(1, 0.75, 0.8), root);
  for (const dx of [-0.42, 0.42]) sphere(scene, "lion-ear", 0.34, new Vector3(dx, 3.33, 1.14), mane, new Vector3(1, 0.85, 0.65), root);
  for (const dx of [-0.58, 0.58]) for (const dz of [-0.58, 0.58]) cylinder(scene, "lion-leg", { height: 1.6, diameter: 0.32 }, new Vector3(dx, 0.82, dz), fur, root);
  const tail = cylinder(scene, "lion-tail", { height: 1.65, diameter: 0.18 }, new Vector3(0, 1.55, -1.45), fur, root);
  tail.rotation.x = -0.75;
  sphere(scene, "lion-tail-tip", 0.4, new Vector3(0, 2.12, -2.03), mane, new Vector3(1.3, 1, 1.3), root);
  return { root, legs: scene.meshes.filter((mesh) => mesh.name === "lion-leg"), tail };
}

function addFence(scene: Scene, side: -1 | 1, z: number, steel: StandardMaterial, red: StandardMaterial) {
  const x = side * 6;
  cylinder(scene, "fence-post", { height: 3.2, diameter: 0.22 }, new Vector3(x, 1.6, z), steel);
  box(scene, "fence-rail", { width: 0.18, height: 0.16, depth: 8 }, new Vector3(x, 2.7, z + 3.8), steel);
  box(scene, "fence-rail", { width: 0.18, height: 0.16, depth: 8 }, new Vector3(x, 1.55, z + 3.8), steel);
  if (Math.round(z) % 24 === 0) {
    box(scene, "red-banner", { width: 0.06, height: 2.3, depth: 0.95 }, new Vector3(x + side * 0.08, 2.25, z + 3.35), red);
  }
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement, callbacks: GameCallbacks): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.09, 0.08, 0.045, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.009;
  scene.fogColor = new Color3(0.23, 0.18, 0.1);

  const hemi = new HemisphericLight("warm-sky", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.72;
  hemi.diffuse = new Color3(1, 0.78, 0.52);
  hemi.groundColor = new Color3(0.08, 0.12, 0.06);
  const sun = new DirectionalLight("sunset-key", new Vector3(-0.35, -1, 0.55), scene);
  sun.position = new Vector3(-30, 42, -40);
  sun.intensity = 1.25;
  sun.diffuse = new Color3(1, 0.72, 0.42);
  const fill = new PointLight("path-fill", new Vector3(0, 5, 25), scene);
  fill.intensity = 0.2;
  fill.diffuse = new Color3(1, 0.22, 0.06);
  const glow = new GlowLayer("beacon-glow", scene);
  glow.intensity = 0.7;

  const pathMat = material(scene, "dust-path", new Color3(0.25, 0.13, 0.05));
  const earthMat = material(scene, "earth", new Color3(0.12, 0.15, 0.075));
  const steelMat = material(scene, "charcoal-steel", new Color3(0.075, 0.08, 0.075));
  const redMat = material(scene, "banner-red", new Color3(0.52, 0.035, 0.025), 0.15);
  const stoneMat = material(scene, "stone", new Color3(0.25, 0.2, 0.13));
  const goldMat = material(scene, "coin-gold", new Color3(0.95, 0.52, 0.08), 0.22);
  const beaconMat = material(scene, "beacon-red", new Color3(0.9, 0.06, 0.03), 0.9);

  MeshBuilder.CreateGround("zoo-path", { width: 10.5, height: 240 }, scene).material = pathMat;
  box(scene, "left-earth", { width: 8, height: 0.25, depth: 240 }, new Vector3(-9.5, -0.12, 110), earthMat);
  box(scene, "right-earth", { width: 8, height: 0.25, depth: 240 }, new Vector3(9.5, -0.12, 110), earthMat);

  const backdrop = MeshBuilder.CreatePlane("jungle-backdrop", { width: 140, height: 100 }, scene);
  backdrop.position = new Vector3(0, 28, 150);
  const backdropMat = new StandardMaterial("jungle-backdrop-mat", scene);
  backdropMat.diffuseTexture = new Texture(jungleTextureUrl, scene);
  backdropMat.emissiveColor = new Color3(0.13, 0.085, 0.035);
  backdropMat.backFaceCulling = false;
  backdrop.material = backdropMat;

  for (let z = -8; z < 220; z += 8) {
    addFence(scene, -1, z, steelMat, redMat);
    addFence(scene, 1, z, steelMat, redMat);
    if (z % 16 === 0) {
      addTree(scene, -10.3 - (z % 3) * 0.5, z + 3, 0.8 + ((z / 16) % 2) * 0.18);
      addTree(scene, 10.1 + (z % 4) * 0.35, z + 5, 0.72 + ((z / 16) % 2) * 0.2);
      sphere(scene, "path-rock", 1.4, new Vector3(-4.8, 0.65, z + 1.5), stoneMat, new Vector3(1.6, 0.55, 1));
      sphere(scene, "path-rock", 1.1, new Vector3(4.7, 0.5, z + 4.5), stoneMat, new Vector3(1.2, 0.5, 0.9));
    }
  }

  addGiraffe(scene, -8.1, 35);
  addElephant(scene, 8, 91);
  addTiger(scene, -8, 150);
  labelPlane(scene, "GIRAFFE GATE", new Vector3(-5.78, 3.9, 34), "#ee8f28");
  labelPlane(scene, "ELEPHANT PASS", new Vector3(5.78, 3.9, 90), "#e54c2f");
  labelPlane(scene, "TIGER DEN", new Vector3(-5.78, 3.9, 149), "#f2b54b");

  const lion = addLion(scene);
  const tokens: { mesh: Mesh; collected: boolean; x: number; z: number }[] = [];
  const tokenPositions = [
    [-2.4, 10], [0, 18], [2.4, 26], [-1.7, 34], [1.7, 42],
    [0, 58], [-2.4, 66], [2.4, 76], [0, 86], [-2.4, 98],
    [2.4, 108], [0, 119], [-2.2, 130], [2.2, 140], [0, 150],
    [-1.7, 163], [1.7, 176], [0, 188],
  ];
  for (const [x, z] of tokenPositions) {
    const token = MeshBuilder.CreateCylinder("gold-token", { height: 0.18, diameter: 0.82, tessellation: 24 }, scene);
    token.position = new Vector3(x, 1.25, z);
    token.rotation.x = Math.PI / 2;
    token.material = goldMat;
    glow.addIncludedOnlyMesh(token);
    tokens.push({ mesh: token, collected: false, x, z });
  }

  const beacons = [52, 104, 156].map((z, index) => {
    const root = new TransformNode(`puzzle-beacon-${index}`, scene);
    root.position = new Vector3(0, 0, z);
    cylinder(scene, "beacon-base", { height: 0.55, diameter: 2.2 }, new Vector3(0, 0.3, 0), steelMat, root);
    const orb = sphere(scene, "beacon-orb", 1.1, new Vector3(0, 2.1, 0), beaconMat, new Vector3(1, 1.25, 1), root);
    glow.addIncludedOnlyMesh(orb);
    for (const y of [1.25, 2.9]) {
      const ring = MeshBuilder.CreateTorus("beacon-ring", { diameter: 1.8, thickness: 0.06, tessellation: 32 }, scene);
      ring.position = new Vector3(0, y, 0);
      ring.rotation.x = Math.PI / 2;
      ring.material = beaconMat;
      ring.parent = root;
    }
    labelPlane(scene, `LEVEL ${index + 1}`, new Vector3(0, 4.2, z - 0.7), "#ff623b");
    return { root, orb, solved: false };
  });

  const demo = new URLSearchParams(window.location.search).has("demo");
  let playerZ = -7;
  let playerX = 0;
  let score = 0;
  let coins = 0;
  let collectedTokens = 0;
  let puzzleIndex = 0;
  let paused = false;
  let finished = false;
  let lastTime = performance.now();
  let lastHud = 0;
  let feedbackTimer = 0;
  let keyLeft = false;
  let keyRight = false;
  let disposed = false;

  const onKeyDown = (event: KeyboardEvent) => {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(event.key)) event.preventDefault();
    if (["ArrowLeft", "a", "A"].includes(event.key)) keyLeft = true;
    if (["ArrowRight", "d", "D"].includes(event.key)) keyRight = true;
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (["ArrowLeft", "a", "A"].includes(event.key)) keyLeft = false;
    if (["ArrowRight", "d", "D"].includes(event.key)) keyRight = false;
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const steer = (direction: -1 | 1) => {
    if (paused || finished) return;
    playerX = Math.max(-3.25, Math.min(3.25, playerX + direction * 1.35));
  };

  const resolvePuzzle = (correct: boolean) => {
    if (!paused || finished || puzzleIndex >= PUZZLES.length) return;
    if (!correct) {
      callbacks.onFeedback("ما زال القفل مغلقًا — جرّب قراءة التلميح مرة أخرى.", "warn");
      return;
    }
    const puzzle = PUZZLES[puzzleIndex];
    score += puzzle.reward;
    coins += Math.ceil(puzzle.reward / 40);
    beacons[puzzleIndex].solved = true;
    beacons[puzzleIndex].orb.material = goldMat;
    callbacks.onFeedback(`رائع! +${puzzle.reward} نقطة و +${Math.ceil(puzzle.reward / 40)} عملات`, "good");
    puzzleIndex += 1;
    paused = false;
    if (puzzleIndex === PUZZLES.length) {
      score += 500;
      setTimeout(() => {
        if (!disposed) callbacks.onFinish();
      }, 1100);
    }
  };

  const tick = () => {
    if (disposed) return;
    const now = performance.now();
    const delta = Math.min(0.035, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    if (!paused && !finished) {
      if (demo) {
        const upcoming = tokens.find((token) => !token.collected && token.z > playerZ + 4);
        if (upcoming) playerX += Math.sign(upcoming.x - playerX) * delta * 2.2;
      } else {
        if (keyLeft) playerX -= delta * 4.3;
        if (keyRight) playerX += delta * 4.3;
      }
      playerX = Math.max(-3.45, Math.min(3.45, playerX));
      playerZ += delta * 8.8;
      lion.root.position.x = playerX;
      lion.root.position.z = playerZ;
      const runCycle = now * 0.012;
      lion.legs.forEach((leg, index) => { leg.rotation.z = Math.sin(runCycle + index * Math.PI) * 0.34; });
      lion.tail.rotation.z = Math.sin(runCycle * 0.85) * 0.32;
      lion.root.rotation.y = Math.sin(runCycle * 0.4) * 0.035;

      for (const token of tokens) {
        if (!token.collected) {
          token.mesh.rotation.y += delta * 3.8;
          token.mesh.rotation.z += delta * 0.9;
          token.mesh.position.y = 1.25 + Math.sin(now * 0.003 + token.z) * 0.1;
          if (Math.abs(token.z - playerZ) < 1.6 && Math.abs(token.x - playerX) < 1.15) {
            token.collected = true;
            token.mesh.setEnabled(false);
            collectedTokens += 1;
            score += 50;
            coins += 1;
          }
        }
      }

      if (puzzleIndex < beacons.length && !beacons[puzzleIndex].solved && playerZ > beacons[puzzleIndex].root.position.z - 2.8) {
        paused = true;
        callbacks.onPuzzle(PUZZLES[puzzleIndex]);
        if (demo) setTimeout(() => resolvePuzzle(true), 800);
      }
    }

    const cameraZ = playerZ - 18;
    camera.position = new Vector3(playerX * 0.5, 5.1, cameraZ);
    camera.setTarget(new Vector3(playerX * 0.18, 1.8, playerZ + 13));
    beacons.forEach((beacon) => { if (!beacon.solved) beacon.orb.rotation.y += delta * 1.6; });

    if (now - lastHud > 90) {
      lastHud = now;
      callbacks.onStats({ score, coins, distance: Math.max(0, Math.round((playerZ + 7) * 1.8)), level: Math.min(3, puzzleIndex + 1), tokens: collectedTokens });
    }
    if (feedbackTimer > 0) feedbackTimer -= delta;
  };

  const camera = new (await import("@babylonjs/core/Cameras/freeCamera")).FreeCamera("runner-camera", new Vector3(0, 4.6, -20), scene);
  camera.minZ = 0.1;
  camera.maxZ = 260;
  camera.fov = 0.9;
  camera.setTarget(new Vector3(0, 1.7, 12));
  scene.activeCamera = camera;
  scene.registerBeforeRender(tick);
  callbacks.onStats({ score, coins, distance: 0, level: 1, tokens: 0 });

  return {
    scene,
    resolvePuzzle,
    steer,
    dispose: () => {
      disposed = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      scene.dispose();
    },
  };
}
