const canvas = document.querySelector('#game');
const message = document.querySelector('#message');
const collectionEl = document.querySelector('#collection');

if (!canvas || !message || !collectionEl) {
  throw new Error('게임에 필요한 HTML 요소를 찾을 수 없습니다. index.html, src/main.js, src/styles.css 구조를 확인하세요.');
}

const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('이 브라우저는 canvas 2D 렌더링을 지원하지 않아 게임 화면을 그릴 수 없습니다.');
}

ctx.imageSmoothingEnabled = false;

const TILE = 32;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const keys = new Set();
let lastTime = 0;
let encounterPulse = 0;

const player = {
  x: 370,
  y: 260,
  w: 22,
  h: 28,
  speed: 132,
  dir: 'down',
  step: 0,
};

const villagers = [
  {
    name: '단풍 할머니',
    x: 154,
    y: 180,
    color: '#d8704a',
    hat: '#a63f3a',
    lines: [
      '오늘 풀숲이 유난히 바스락거리는구나. 작은 무당벌레가 숨어 있을지도 몰라.',
      '벌레는 놀라지 않게 천천히 다가가야 한단다.',
    ],
    talkIndex: 0,
  },
  {
    name: '초록 모자 루',
    x: 566,
    y: 140,
    color: '#6fb37a',
    hat: '#3f7d50',
    lines: [
      '강가 옆 꽃밭에서는 반짝날개 나방을 봤어!',
      '잡은 벌레 기록장을 채우면 마을 축제에서 자랑할 수 있어.',
    ],
    talkIndex: 0,
  },
  {
    name: '우체부 미나',
    x: 484,
    y: 362,
    color: '#5a8bd8',
    hat: '#314f9c',
    lines: [
      '다리 아래 그늘에서 통통 뛰는 방울메뚜기가 자주 보여요.',
      'Space를 누를 때 타이밍이 좋으면 희귀 벌레를 만날 수 있대요!',
    ],
    talkIndex: 0,
  },
];

const bugs = [
  { name: '점박이 무당벌레', color: '#e84855', rarity: '흔함', chance: 0.38 },
  { name: '방울메뚜기', color: '#63c74d', rarity: '흔함', chance: 0.28 },
  { name: '파란 장수풍뎅이', color: '#2f80ed', rarity: '드묾', chance: 0.18 },
  { name: '반짝날개 나방', color: '#f6d365', rarity: '희귀', chance: 0.11 },
  { name: '별빛 사슴벌레', color: '#b46cff', rarity: '전설', chance: 0.05 },
];

const grassPatches = [
  { x: 86, y: 86, w: 120, h: 82 },
  { x: 534, y: 70, w: 132, h: 92 },
  { x: 78, y: 360, w: 166, h: 82 },
  { x: 574, y: 332, w: 104, h: 104 },
  { x: 332, y: 104, w: 92, h: 70 },
];

const solidRects = [
  { x: 30, y: 28, w: 156, h: 46 },
  { x: 614, y: 208, w: 116, h: 78 },
  { x: 268, y: 382, w: 132, h: 78 },
  { x: 0, y: -20, w: WIDTH, h: 20 },
  { x: 0, y: HEIGHT, w: WIDTH, h: 20 },
  { x: -20, y: 0, w: 20, h: HEIGHT },
  { x: WIDTH, y: 0, w: 20, h: HEIGHT },
];

const collection = new Map(bugs.map((bug) => [bug.name, 0]));

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;

  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    player.step += dt * 10;
  } else {
    player.step = 0;
  }

  movePlayer(dx * player.speed * dt, 0);
  movePlayer(0, dy * player.speed * dt);
  encounterPulse += dt;
}

function movePlayer(dx, dy) {
  if (!dx && !dy) return;
  const next = { x: player.x + dx, y: player.y + dy, w: player.w, h: player.h };
  if (!solidRects.some((rect) => rectsOverlap(next, rect))) {
    player.x = next.x;
    player.y = next.y;
  }
}

function interact() {
  const center = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  const nearbyVillager = villagers.find((v) => dist(center, { x: v.x + 12, y: v.y + 14 }) < 54);
  if (nearbyVillager) {
    const line = nearbyVillager.lines[nearbyVillager.talkIndex % nearbyVillager.lines.length];
    nearbyVillager.talkIndex += 1;
    say(`${nearbyVillager.name}: “${line}”`);
    return;
  }

  const nearbyGrass = grassPatches.find((patch) => rectsOverlap({ x: center.x - 18, y: center.y - 18, w: 36, h: 36 }, patch));
  if (nearbyGrass) {
    catchBug();
    return;
  }

  say('가까운 주민이나 흔들리는 풀숲 옆에서 Space를 눌러 보세요.');
}

function catchBug() {
  const roll = Math.random();
  let total = 0;
  const caught = bugs.find((bug) => {
    total += bug.chance;
    return roll <= total;
  }) ?? bugs[0];
  collection.set(caught.name, collection.get(caught.name) + 1);
  renderCollection();
  say(`풀숲에서 ${caught.rarity} 벌레인 ${caught.name}을(를) 잡았어요!`);
}

function say(text) {
  message.textContent = text;
}

function renderCollection() {
  collectionEl.innerHTML = '';
  bugs.forEach((bug) => {
    const item = document.createElement('div');
    item.className = 'bug-card';
    item.innerHTML = `
      <span class="bug-dot" style="--bug-color: ${bug.color}"></span>
      <span>${bug.name}</span>
      <strong>${collection.get(bug.name)}</strong>
    `;
    collectionEl.append(item);
  });
}

function draw() {
  drawWorld();
  grassPatches.forEach(drawGrassPatch);
  drawHouses();
  villagers.forEach(drawVillager);
  drawPlayer();
  drawHudHint();
}

function drawWorld() {
  ctx.fillStyle = '#8fd46f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#76bf63';
  for (let y = 0; y < HEIGHT; y += TILE) {
    for (let x = 0; x < WIDTH; x += TILE) {
      if ((x / TILE + y / TILE) % 2 === 0) ctx.fillRect(x, y, TILE, TILE);
    }
  }

  ctx.fillStyle = '#d7b56d';
  ctx.fillRect(0, 232, WIDTH, 48);
  ctx.fillRect(354, 0, 48, HEIGHT);
  ctx.fillStyle = '#c49b57';
  ctx.fillRect(0, 260, WIDTH, 4);
  ctx.fillRect(382, 0, 4, HEIGHT);

  ctx.fillStyle = '#64a9d8';
  ctx.fillRect(0, 458, WIDTH, 54);
  ctx.fillStyle = '#87c7ee';
  for (let x = -20; x < WIDTH; x += 72) ctx.fillRect(x + (encounterPulse * 18) % 72, 480, 34, 4);
}

function drawGrassPatch(patch) {
  ctx.fillStyle = '#3b9b52';
  ctx.fillRect(patch.x, patch.y, patch.w, patch.h);
  ctx.fillStyle = '#54c05d';
  for (let y = patch.y + 8; y < patch.y + patch.h; y += 18) {
    for (let x = patch.x + 8; x < patch.x + patch.w; x += 18) {
      const sway = Math.sin(encounterPulse * 5 + x) * 2;
      ctx.fillRect(x + sway, y, 5, 14);
      ctx.fillRect(x + 6 + sway, y + 4, 5, 10);
    }
  }
}

function drawHouses() {
  drawHouse(30, 28, '#e7c16b', '#b2473d');
  drawHouse(614, 208, '#f1d28c', '#6c6ac8');
  drawHouse(268, 382, '#e8b06a', '#3f7d50');
}

function drawHouse(x, y, wall, roof) {
  ctx.fillStyle = roof;
  ctx.fillRect(x + 8, y, 140, 20);
  ctx.fillRect(x, y + 20, 156, 20);
  ctx.fillStyle = wall;
  ctx.fillRect(x + 12, y + 40, 132, 52);
  ctx.fillStyle = '#76513b';
  ctx.fillRect(x + 68, y + 58, 24, 34);
  ctx.fillStyle = '#f7f1a1';
  ctx.fillRect(x + 28, y + 52, 24, 18);
  ctx.fillRect(x + 104, y + 52, 24, 18);
}

function drawVillager(v) {
  ctx.fillStyle = '#2d2d35';
  ctx.fillRect(v.x + 5, v.y + 24, 14, 6);
  ctx.fillStyle = v.color;
  ctx.fillRect(v.x + 2, v.y + 12, 20, 18);
  ctx.fillStyle = '#f0b58a';
  ctx.fillRect(v.x + 4, v.y + 4, 16, 14);
  ctx.fillStyle = v.hat;
  ctx.fillRect(v.x + 2, v.y, 20, 6);
  ctx.fillStyle = '#2d2d35';
  ctx.fillRect(v.x + 7, v.y + 9, 3, 3);
  ctx.fillRect(v.x + 15, v.y + 9, 3, 3);
}

function drawPlayer() {
  const bob = Math.floor(Math.sin(player.step) * 2);
  ctx.fillStyle = 'rgba(42, 36, 28, 0.25)';
  ctx.fillRect(player.x + 2, player.y + player.h - 2, player.w + 4, 5);
  ctx.fillStyle = '#2d2d35';
  ctx.fillRect(player.x + 4, player.y + 22 + bob, 5, 8);
  ctx.fillRect(player.x + 15, player.y + 22 - bob, 5, 8);
  ctx.fillStyle = '#ffcf5a';
  ctx.fillRect(player.x + 2, player.y + 10, 22, 16);
  ctx.fillStyle = '#f0b58a';
  ctx.fillRect(player.x + 5, player.y + 2, 16, 13);
  ctx.fillStyle = '#6b3f2a';
  ctx.fillRect(player.x + 3, player.y, 20, 6);
  ctx.fillStyle = '#1b1b25';
  if (player.dir === 'left') ctx.fillRect(player.x + 6, player.y + 8, 3, 3);
  else if (player.dir === 'right') ctx.fillRect(player.x + 17, player.y + 8, 3, 3);
  else {
    ctx.fillRect(player.x + 8, player.y + 8, 3, 3);
    ctx.fillRect(player.x + 16, player.y + 8, 3, 3);
  }
}

function drawHudHint() {
  const center = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  const nearAction = villagers.some((v) => dist(center, { x: v.x + 12, y: v.y + 14 }) < 54)
    || grassPatches.some((patch) => rectsOverlap({ x: center.x - 18, y: center.y - 18, w: 36, h: 36 }, patch));
  if (!nearAction) return;
  ctx.fillStyle = '#fff6d6';
  ctx.fillRect(player.x - 12, player.y - 22, 50, 16);
  ctx.fillStyle = '#3b2f2f';
  ctx.font = '10px monospace';
  ctx.fillText('SPACE', player.x - 5, player.y - 10);
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'w', 'a', 's', 'd', 'r'].includes(key)) {
    event.preventDefault();
  }
  if (key === ' ') interact();
  else if (key === 'r') {
    bugs.forEach((bug) => collection.set(bug.name, 0));
    renderCollection();
    say('벌레 기록장을 깨끗하게 비웠어요. 다시 모험을 시작해요!');
  } else {
    keys.add(key);
  }
});

window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

renderCollection();
document.body.classList.add('game-ready');
say('게임 로직이 정상적으로 로드됐어요! 방향키/WASD로 움직이고 Space로 상호작용하세요.');
requestAnimationFrame(loop);
