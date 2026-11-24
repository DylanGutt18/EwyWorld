
'use strict';

// ======================================================
// EWY WORLD - DEMO 0.2
// Motor, mecânicas e renderização de cenários
// ======================================================

const $ = id => document.getElementById(id);
const c = $('screen');
const g = c.getContext('2d');

const WIDTH = 960;
const HEIGHT = 540;
const GROUND = 460;

g.imageSmoothingEnabled = false;

// ======================================================
// 1. CONFIGURAÇÃO DAS FASES
// ======================================================

const stages = [
    {
        name: 'Vila dos Carvalhos Rosados',
        length: 1900,
        theme: 0
    },
    {
        name: 'Floresta dos Ossinhos',
        length: 2600,
        theme: 1
    },
    {
        name: 'Cavernas de Cristal',
        length: 2500,
        theme: 2
    },
    {
        name: 'Posto dos Humacacos',
        length: 2800,
        theme: 3
    }
];

const worldThemes = [
    {
        skyTop: '#060b24',
        skyBottom: '#304784',
        mountainFar: '#293e78',
        mountainNear: '#14264f',
        grass: '#eda5cb',
        grassLight: '#ffd1e7',
        grassDark: '#ad628e',
        soil: '#69405e',
        soilLight: '#80506c',
        soilDark: '#4b304a',
        leaves: '#d987b4',
        leavesLight: '#ffc0dc',
        leavesDark: '#96547f',
        trunk: '#655063'
    },
    {
        skyTop: '#0b202d',
        skyBottom: '#426c79',
        mountainFar: '#345966',
        mountainNear: '#203e48',
        grass: '#a2c6a0',
        grassLight: '#d3e8bc',
        grassDark: '#628e76',
        soil: '#49584e',
        soilLight: '#627561',
        soilDark: '#34443d',
        leaves: '#7ba78c',
        leavesLight: '#b5d2a1',
        leavesDark: '#426f61',
        trunk: '#594d50'
    },
    {
        skyTop: '#100e21',
        skyBottom: '#393052',
        mountainFar: '#32294c',
        mountainNear: '#211b36',
        grass: '#9e8ed4',
        grassLight: '#cfc0ff',
        grassDark: '#675591',
        soil: '#49405e',
        soilLight: '#625575',
        soilDark: '#302940',
        leaves: '#8673b8',
        leavesLight: '#c2a9ef',
        leavesDark: '#564677',
        trunk: '#50435f'
    },
    {
        skyTop: '#281b35',
        skyBottom: '#a66e78',
        mountainFar: '#70516c',
        mountainNear: '#45334e',
        grass: '#bb889d',
        grassLight: '#e3b4c4',
        grassDark: '#805a76',
        soil: '#594052',
        soilLight: '#775467',
        soilDark: '#3b293a',
        leaves: '#ab718e',
        leavesLight: '#dca2b9',
        leavesDark: '#76475f',
        trunk: '#534050'
    }
];

// ======================================================
// 2. SALVAMENTO
// ======================================================

let save = {
    unlocked: 0,
    bones: 0,
    xp: 0
};

try {
    Object.assign(
        save,
        JSON.parse(
            localStorage.getItem('ewy-demo') || '{}'
        )
    );
} catch (error) {
    console.warn('Erro ao carregar progresso:', error);
}

save.unlocked = Math.max(
    0,
    Math.min(3, Number(save.unlocked) || 0)
);

function persist() {
    try {
        localStorage.setItem(
            'ewy-demo',
            JSON.stringify(save)
        );
    } catch (error) {
        console.warn('Erro ao salvar:', error);
    }
}

// ======================================================
// 3. VARIÁVEIS DO JOGO
// ======================================================

let active = false;
let stage = 0;
let p;

let platforms = [];
let bones = [];
let enemies = [];
let npcs = [];
let decorations = [];

let gate = true;

let camX = 0;
let camY = 0;

let keys = {};
let pressed = {};

let msgTime = 0;
let clock = 0;

let last = 0;
let acc = 0;

// Cache gráfico para melhorar desempenho
const treeCache = new Map();

// ======================================================
// 4. CARREGAMENTO DAS IMAGENS
// ======================================================

const sprites = {};

for (const name of [
    'Ewelyn',
    'dylan',
    'freddy',
    'lua',
    'penelope'
]) {
    const image = new Image();

    image.src = 'Images/' + name + '.png';

    sprites[name] = image;
}

// ======================================================
// 5. FUNÇÕES AUXILIARES
// ======================================================

function randomSeed(n) {
    const value =
        Math.sin(n * 127.1 + 311.7) * 43758.5453;

    return value - Math.floor(value);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function rect(x, y, w, h, color) {
    g.fillStyle = color;

    g.fillRect(
        Math.round(x),
        Math.round(y),
        Math.round(w),
        Math.round(h)
    );
}

function text(t, x, y, color = '#ffffff') {
    g.font = 'bold 14px monospace';

    g.strokeStyle = '#19172b';
    g.lineWidth = 3;
    g.strokeText(t, x, y);

    g.fillStyle = color;
    g.fillText(t, x, y);
}

function overlap(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function visible(x, width = 100) {
    return (
        x + width > camX - 100 &&
        x < camX + WIDTH + 100
    );
}

function say(message) {
    msgTime = 360;
    $('dialog').textContent = message;
}

// ======================================================
// 6. MENU E MAPA
// ======================================================

function menu() {
    active = false;

    $('menu').hidden = false;
    $('game').hidden = true;

    $('map').replaceChildren();

    stages.forEach((s, i) => {
        const button = document.createElement('button');

        button.textContent =
            (i + 1) + ' · ' + s.name;

        button.disabled = i > save.unlocked;

        button.onclick = () => start(i);

        $('map').append(button);
    });
}

$('play').onclick = () => {
    start(Math.min(save.unlocked, 3));
};

$('reset').onclick = () => {
    if (confirm('Apagar progresso da demo?')) {
        save = {
            unlocked: 0,
            bones: 0,
            xp: 0
        };

        persist();
        start(0);
    }
};

$('back').onclick = menu;

// ======================================================
// 7. INICIALIZAÇÃO DAS FASES
// ======================================================

function start(i) {
    stage = i;

    const s = stages[i];

    p = {
        x: 70,
        y: 350,
        w: 34,
        h: 52,
        vx: 0,
        vy: 0,
        hp: 5,
        max: 5,
        dir: 1,
        ground: false,
        attack: 0,
        hurt: 0,
        bones: save.bones,
        xp: save.xp
    };

    camX = 0;
    camY = 0;

    keys = {};
    pressed = {};

    gate = i !== 2;

    // Terreno principal

    platforms = [
        {
            x: 0,
            y: GROUND,
            w: s.length,
            h: 200
        }
    ];

    // Plataformas elevadas

    for (
        let x = 360;
        x < s.length - 240;
        x += 340
    ) {
        platforms.push({
            x: x,
            y: 365 - (Math.floor(x / 340) % 3) * 32,
            w: 145,
            h: 28
        });
    }

    // Ossinhos

    bones = [];

    for (
        let x = 180;
        x < s.length - 100;
        x += 105
    ) {
        bones.push({
            x,
            y: 420,
            taken: false
        });
    }

    for (const a of platforms.slice(1)) {
        bones.push({
            x: a.x + 60,
            y: a.y - 28,
            taken: false
        });
    }

    // Inimigos

    enemies = [];

    if (i > 0) {
        for (
            let x = 480;
            x < s.length - 400;
            x += 390
        ) {
            enemies.push({
                x,
                home: x,
                y: 422,
                w: 40,
                h: 38,
                hp: 2,
                maxHp: 2,
                dir: 1
            });
        }
    }

    // Chefe

    if (i === 3) {
        enemies.push({
            x: 2350,
            home: 2350,
            y: 380,
            w: 76,
            h: 80,
            hp: 12,
            maxHp: 12,
            dir: -1,
            boss: true
        });
    }

    // Personagens amigáveis

    if (i === 0) {
        npcs = [
            {
                x: 240,
                name: 'penelope',
                label: 'Penélope'
            },
            {
                x: 650,
                name: 'freddy',
                label: 'Freddy'
            },
            {
                x: 1300,
                name: 'dylan',
                label: 'Dylan'
            }
        ];
    } else if (i === 2) {
        npcs = [
            {
                x: 650,
                name: 'lua',
                label: 'Lua'
            }
        ];
    } else {
        npcs = [
            {
                x: 160,
                name: 'freddy',
                label: 'Freddy'
            }
        ];
    }

    // Elementos decorativos

    decorations = [];

    for (let x = 90; x < s.length; x += 75) {
        const r = randomSeed(x + i * 100);

        decorations.push({
            x: x + r * 25,
            y: GROUND,
            seed: x,
            type:
                r > 0.85 ? 'barrel' :
                r > 0.70 ? 'rock' :
                r > 0.40 ? 'flower' :
                'bush'
        });
    }

    active = true;

    $('menu').hidden = true;
    $('game').hidden = false;

    const messages = [
        'Penélope tem uma missão para você. Explore a vila!',
        'Colete ossinhos e enfrente os Humacacos.',
        'Encontre Lua para abrir a passagem de cristal.',
        'Derrote o capitão Humacaco!'
    ];

    say(messages[i]);
}

// ======================================================
// 8. CONTROLES
// ======================================================

function key(k, on) {
    if (on && !keys[k]) {
        pressed[k] = true;
    }

    keys[k] = on;
}

addEventListener('keydown', e => {
    const allowed = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'Space',
        'KeyA',
        'KeyD',
        'KeyJ',
        'KeyE'
    ];

    if (active && allowed.includes(e.code)) {
        e.preventDefault();
        key(e.code, true);
    }
});

addEventListener('keyup', e => {
    key(e.code, false);
});

addEventListener('blur', () => {
    keys = {};
    pressed = {};
});

document.querySelectorAll('[data-key]').forEach(b => {
    b.onpointerdown = e => {
        b.setPointerCapture(e.pointerId);
        key(b.dataset.key, true);
    };

    b.onpointerup = b.onpointercancel = () => {
        key(b.dataset.key, false);
    };
});

// ======================================================
// 9. MOVIMENTAÇÃO E FÍSICA
// ======================================================

function update() {
    clock++;

    const s = stages[stage];

    const right = keys.ArrowRight || keys.KeyD;
    const left = keys.ArrowLeft || keys.KeyA;

    p.vx = (
        (right ? 1 : 0) -
        (left ? 1 : 0)
    ) * 4.5;

    if (p.vx) {
        p.dir = Math.sign(p.vx);
    }

    // Pulo

    if (
        (pressed.Space || pressed.ArrowUp) &&
        p.ground
    ) {
        p.vy = -14.5;
        p.ground = false;
    }

    const oldBottom = p.y + p.h;

    p.x = clamp(
        p.x + p.vx,
        0,
        s.length - p.w
    );

    // Portão da caverna

    if (
        !gate &&
        p.x > 1650 - p.w &&
        p.x < 1700
    ) {
        p.x = 1650 - p.w;
    }

    // Gravidade

    p.vy += 0.65;
    p.y += p.vy;

    p.ground = false;

    for (const a of platforms) {
        if (
            p.vy >= 0 &&
            oldBottom <= a.y + 1 &&
            p.y + p.h >= a.y &&
            p.x + p.w > a.x &&
            p.x < a.x + a.w
        ) {
            p.y = a.y - p.h;
            p.vy = 0;
            p.ground = true;
        }
    }

    // Ataque

    if (pressed.KeyJ && p.attack <= 0) {
        p.attack = 20;

        const hit = {
            x: p.dir > 0 ? p.x : p.x - 65,
            y: p.y - 10,
            w: p.w + 65,
            h: p.h + 20
        };

        for (const e of enemies) {
            if (e.hp > 0 && overlap(hit, e)) {
                e.hp--;

                if (e.hp === 0) {
                    p.xp += e.boss ? 100 : 20;
                    p.bones += e.boss ? 15 : 3;

                    say(
                        e.boss
                            ? 'Capitão derrotado!'
                            : '+20 XP · +3 ossinhos'
                    );
                }
            }
        }
    }

    p.attack = Math.max(0, p.attack - 1);
    p.hurt = Math.max(0, p.hurt - 1);

    // Inteligência dos inimigos

    for (const e of enemies) {
        if (e.hp <= 0) continue;

        const distance = p.x - e.x;

        if (Math.abs(distance) < 250) {
            e.dir = Math.sign(distance) || 1;
        } else if (Math.abs(e.x - e.home) > 100) {
            e.dir = Math.sign(e.home - e.x);
        }

        e.x = clamp(
            e.x + e.dir * (e.boss ? 1.4 : 1.1),
            0,
            s.length - e.w
        );

        if (overlap(p, e) && p.hurt <= 0) {
            p.hp--;
            p.hurt = 75;

            p.x = clamp(
                p.x + Math.sign(p.x - e.x || 1) * 35,
                0,
                s.length - p.w
            );

            if (p.hp <= 0) {
                start(stage);
                return;
            }
        }
    }

    // Coleta de ossinhos

    for (const b of bones) {
        if (
            !b.taken &&
            Math.abs(p.x + 17 - b.x) < 25 &&
            Math.abs(p.y + 25 - b.y) < 35
        ) {
            b.taken = true;
            p.bones++;
        }
    }

    // Interações

    if (pressed.KeyE) {
        const n = npcs.find(
            n => Math.abs(n.x - p.x) < 100
        );

        if (n) {
            interact(n);
        } else if (p.x > s.length - 150) {
            if (
                stage === 3 &&
                enemies.some(e => e.boss && e.hp > 0)
            ) {
                say('Derrote o capitão primeiro!');
            } else {
                finishStage();
                return;
            }
        }
    }

    // Câmera horizontal

    const targetX = clamp(
        p.x - 380,
        0,
        s.length - WIDTH
    );

    camX += (targetX - camX) * 0.12;

    // Câmera vertical inteligente

    const targetY = p.y < 150
        ? Math.max(-180, p.y - 150)
        : 0;

    camY += (targetY - camY) * 0.06;

    pressed = {};

    if (msgTime > 0 && --msgTime === 0) {
        $('dialog').textContent =
            'Explore · E para conversar ou sair da fase';
    }

    updateHUD();
}

// ======================================================
// 10. INTERAÇÕES E PROGRESSÃO
// ======================================================

function interact(n) {
    switch (n.name) {
        case 'freddy':

            if (p.bones >= 5 && p.hp < p.max) {
                p.bones -= 5;
                p.hp = p.max;

                say(
                    'Freddy: cura completa por 5 ossinhos!'
                );
            } else {
                say(
                    'Freddy: cura por 5 ossinhos. Au au!'
                );
            }

            break;

        case 'penelope':

            say(
                'Penélope: os Humacacos estão reunindo cristais. Descubra por quê!'
            );

            break;

        case 'dylan':

            p.hp = p.max;

            say(
                'Dylan: estou com você! Vida restaurada.'
            );

            break;

        case 'lua':

            gate = true;

            say(
                'Lua encontrou a alavanca escondida! Passagem aberta.'
            );

            break;
    }
}

function finishStage() {
    save.bones = p.bones;
    save.xp = p.xp;

    save.unlocked = Math.max(
        save.unlocked,
        Math.min(3, stage + 1)
    );

    persist();
    menu();

    if (stage === 3) {
        alert('Demo concluída! Obrigado por jogar Ewy World.');
    }
}

function updateHUD() {
    $('hud').textContent =
        '♥ '.repeat(p.hp) +
        ' | Ossinhos: ' + p.bones +
        ' | Nível ' + (1 + Math.floor(p.xp / 100)) +
        ' · XP ' + p.xp +
        ' | ' + stages[stage].name;
}

// ======================================================
// 11. CÉU E ESTRELAS
// ======================================================

function drawSky(theme) {
    const gradient = g.createLinearGradient(
        0, 0, 0, HEIGHT
    );

    gradient.addColorStop(0, theme.skyTop);
    gradient.addColorStop(1, theme.skyBottom);

    g.fillStyle = gradient;
    g.fillRect(0, 0, WIDTH, HEIGHT);

    if (stage === 2) return;

    // Estrelas cintilantes

    for (let i = 0; i < 130; i++) {
        const x = randomSeed(i + 10) * WIDTH;
        const y = randomSeed(i + 500) * 340;

        g.globalAlpha =
            0.55 + Math.sin(clock * 0.025 + i) * 0.35;

        const size = i % 9 === 0 ? 3 : 1;

        rect(x, y, size, size, '#ffffff');

        if (i % 17 === 0) {
            rect(x - 3, y + 1, 9, 1, '#dbe5ff');
            rect(x + 1, y - 3, 1, 9, '#dbe5ff');
        }
    }

    g.globalAlpha = 1;

    drawMoon(180 - camX * 0.025, 95);
}

// ======================================================
// 12. LUA PIXELADA
// ======================================================

function drawMoon(x, y) {
    const glow = g.createRadialGradient(
        x, y, 20,
        x, y, 100
    );

    glow.addColorStop(0, '#ffe8bb55');
    glow.addColorStop(1, '#ffe8bb00');

    g.fillStyle = glow;

    g.fillRect(
        x - 100,
        y - 100,
        200,
        200
    );

    const craters = [
        [-15, -12, 8],
        [12, -20, 6],
        [18, 12, 10],
        [-20, 18, 7],
        [0, 4, 5]
    ];

    for (let py = -42; py <= 42; py += 3) {
        for (let px = -42; px <= 42; px += 3) {
            const distance = Math.hypot(px, py);

            if (distance > 42) continue;

            let color = '#ffe3b4';

            if (distance > 38) {
                color = '#fff3dc';
            } else {
                for (const [cx, cy, radius] of craters) {
                    if (
                        Math.hypot(px - cx, py - cy) < radius
                    ) {
                        color = '#cba3a3';
                    }
                }

                if (
                    color === '#ffe3b4' &&
                    randomSeed(px * 19 + py * 37) > 0.85
                ) {
                    color = '#ebc8a6';
                }
            }

            rect(x + px, y + py, 3, 3, color);
        }
    }
}

// ======================================================
// 13. NUVENS COM PARALLAX
// ======================================================

function drawClouds() {
    if (stage === 2) return;

    for (let i = 0; i < 8; i++) {
        const position =
            i * 230 - camX * 0.12 + clock * 0.12;

        const x =
            ((position % 1500) + 1500) % 1500 - 250;

        const y =
            55 + randomSeed(i + 90) * 200;

        const width =
            100 + randomSeed(i + 50) * 100;

        const colors = [
            '#344879',
            '#455e98',
            '#637fb6'
        ];

        for (let layer = 0; layer < 3; layer++) {
            for (let px = 0; px < width; px += 4) {
                const wave =
                    Math.sin(px / width * Math.PI);

                const height = Math.floor(
                    (
                        wave * (32 - layer * 7) +
                        Math.sin(px * 0.09) * 8
                    ) / 4
                ) * 4;

                if (height <= 0) continue;

                rect(
                    x + px,
                    y - height - layer * 5,
                    4,
                    height,
                    colors[layer]
                );
            }
        }
    }
}

// ======================================================
// 14. MONTANHAS EM CAMADAS
// ======================================================

function drawMountains(
    color,
    speed,
    baseY,
    height,
    width
) {
    const offset = camX * speed;

    const first =
        Math.floor(offset / width) - 1;

    for (let i = first; i < first + 8; i++) {
        const x = i * width - offset;

        const peak =
            height * (0.6 + randomSeed(i) * 0.4);

        g.fillStyle = color;
        g.beginPath();

        g.moveTo(x, baseY);

        for (let j = 0; j <= width; j += 8) {
            const slope =
                Math.sin(j / width * Math.PI);

            const noise =
                randomSeed(i * 100 + j) * 12;

            g.lineTo(
                x + j,
                baseY -
                Math.floor(
                    (slope * peak + noise) / 4
                ) * 4
            );
        }

        g.lineTo(x + width, HEIGHT);
        g.lineTo(x, HEIGHT);

        g.closePath();
        g.fill();
    }
}

// ======================================================
// 15. CARVALHOS ROSADOS
// ======================================================

// As árvores são desenhadas uma única vez em canvases
// auxiliares e reutilizadas durante a renderização.

function createTree(theme, seed) {
    const canvas = document.createElement('canvas');

    canvas.width = 240;
    canvas.height = 280;

    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;
    ctx.translate(120, 270);

    function pixel(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    // Tronco retorcido

    ctx.fillStyle = '#382c40';
    ctx.beginPath();

    ctx.moveTo(-35, 0);
    ctx.lineTo(-18, -35);
    ctx.lineTo(-22, -80);
    ctx.lineTo(-5, -125);
    ctx.lineTo(-35, -170);
    ctx.lineTo(-17, -182);
    ctx.lineTo(15, -125);
    ctx.lineTo(35, -175);
    ctx.lineTo(48, -160);
    ctx.lineTo(22, -80);
    ctx.lineTo(24, -35);
    ctx.lineTo(40, 0);

    ctx.closePath();
    ctx.fill();

    // Interior do tronco

    ctx.fillStyle = theme.trunk;
    ctx.beginPath();

    ctx.moveTo(-25, 0);
    ctx.lineTo(-10, -35);
    ctx.lineTo(-15, -80);
    ctx.lineTo(0, -125);
    ctx.lineTo(13, -110);
    ctx.lineTo(15, -75);
    ctx.lineTo(16, -30);
    ctx.lineTo(30, 0);

    ctx.closePath();
    ctx.fill();

    // Galhos

    ctx.strokeStyle = theme.trunk;
    ctx.lineWidth = 13;

    ctx.beginPath();

    ctx.moveTo(0, -80);
    ctx.lineTo(-45, -125);
    ctx.lineTo(-70, -155);

    ctx.moveTo(8, -100);
    ctx.lineTo(50, -135);
    ctx.lineTo(75, -165);

    ctx.stroke();

    // Textura da madeira

    for (let i = 0; i < 30; i++) {
        const y =
            -randomSeed(seed + i + 80) * 100;

        const x =
            randomSeed(seed + i) * 18 - 9;

        pixel(x, y, 2, 10, '#9b7083');
    }

    // Copa

    const clusters = [
        [-72, -150, 34],
        [-43, -185, 38],
        [0, -205, 43],
        [45, -185, 39],
        [75, -150, 31],
        [0, -155, 48]
    ];

    for (const [cx, cy, radius] of clusters) {
        for (
            let py = -radius;
            py < radius;
            py += 4
        ) {
            for (
                let px = -radius;
                px < radius;
                px += 4
            ) {
                const distance = Math.hypot(px, py);

                const noise = randomSeed(
                    seed + cx * 7 + px * 13 + py * 17
                );

                if (
                    distance > radius - noise * 8
                ) {
                    continue;
                }

                let color = theme.leaves;

                if (py > radius * 0.35) {
                    color = theme.leavesDark;
                } else if (
                    py < -radius * 0.2 &&
                    noise > 0.35
                ) {
                    color = theme.leavesLight;
                } else if (noise > 0.93) {
                    color = '#ffe0ed';
                }

                pixel(
                    cx + px,
                    cy + py,
                    4,
                    4,
                    color
                );
            }
        }
    }

    return canvas;
}

function drawTree(x, y, scale, theme, seed) {
    const variant =
        Math.abs(Math.floor(seed)) % 5;

    const cacheKey =
        stage + '-' + variant;

    if (!treeCache.has(cacheKey)) {
        treeCache.set(
            cacheKey,
            createTree(theme, variant * 173)
        );
    }

    const image = treeCache.get(cacheKey);

    g.drawImage(
        image,
        Math.round(x - 120 * scale),
        Math.round(y - 270 * scale),
        Math.round(240 * scale),
        Math.round(280 * scale)
    );
}

// ======================================================
// 16. TERRENO E PLATAFORMAS
// ======================================================

function drawTerrain(a, theme) {
    if (!visible(a.x, a.w)) return;

    const tileSize = 16;

    const startX = Math.max(
        a.x,
        Math.floor(camX / tileSize) * tileSize
    );

    const endX = Math.min(
        a.x + a.w,
        camX + WIDTH + 20
    );

    rect(
        startX,
        a.y,
        endX - startX,
        a.h,
        theme.soil
    );

    // Textura da terra

    for (
        let x = startX;
        x < endX;
        x += tileSize
    ) {
        for (
            let y = a.y + 12;
            y < a.y + a.h;
            y += tileSize
        ) {
            const seed = randomSeed(x * 17 + y * 31);

            const color =
                seed > 0.55
                    ? theme.soilLight
                    : theme.soilDark;

            rect(
                x,
                y,
                Math.min(12, endX - x),
                Math.min(8, a.y + a.h - y),
                color
            );
        }
    }

    // Contorno inferior

    rect(
        startX,
        a.y + a.h - 3,
        endX - startX,
        3,
        theme.soilDark
    );

    // Grama

    rect(
        startX,
        a.y,
        endX - startX,
        9,
        theme.grass
    );

    rect(
        startX,
        a.y,
        endX - startX,
        3,
        theme.grassLight
    );

    // Pontas irregulares

    for (let x = startX; x < endX; x += 4) {
        const length =
            3 + Math.floor(randomSeed(x) * 9);

        const w = Math.min(4, endX - x);

        rect(
            x,
            a.y + 8,
            w,
            length,
            theme.grassDark
        );

        rect(
            x,
            a.y + 5,
            Math.min(3, w),
            length,
            theme.grass
        );
    }
}

// ======================================================
// 17. FLORES
// ======================================================

function drawFlower(x, y, seed) {
    const height =
        10 + randomSeed(seed) * 15;

    const sway =
        Math.sin(clock * 0.025 + seed) * 2;

    rect(
        x,
        y - height,
        2,
        height,
        '#527b70'
    );

    rect(x - 5, y - 8, 5, 3, '#80a88c');
    rect(x + 2, y - 12, 5, 3, '#80a88c');

    const fx = x + sway;
    const fy = y - height;

    rect(fx - 3, fy - 4, 8, 10, '#fff0f7');
    rect(fx - 5, fy - 1, 12, 4, '#fff0f7');

    rect(fx, fy, 3, 3, '#edb65e');
}

// ======================================================
// 18. ARBUSTOS
// ======================================================

function drawBush(x, y, theme, seed) {
    for (let i = 0; i < 7; i++) {
        const bx =
            x + randomSeed(seed + i) * 35 - 17;

        const by =
            y - randomSeed(seed + i + 30) * 20;

        const size =
            8 + randomSeed(seed + i + 60) * 10;

        rect(
            bx,
            by - size,
            size,
            size,
            theme.leavesDark
        );

        rect(
            bx + 2,
            by - size - 2,
            size - 3,
            size - 3,
            theme.leaves
        );

        rect(
            bx + 3,
            by - size - 2,
            4,
            3,
            theme.leavesLight
        );
    }
}

// ======================================================
// 19. PEDRAS
// ======================================================

function drawRock(x, y) {
    rect(x - 15, y - 13, 30, 13, '#343247');
    rect(x - 11, y - 20, 22, 18, '#77778f');
    rect(x - 7, y - 23, 13, 6, '#a4a5bc');
    rect(x - 10, y - 17, 7, 7, '#b7b6c7');
    rect(x + 4, y - 13, 10, 11, '#505168');
}

// ======================================================
// 20. BARRIS
// ======================================================

function drawBarrel(x, y) {
    const w = 34;
    const h = 43;

    x -= w / 2;
    y -= h;

    rect(x - 2, y + 4, w + 4, h - 6, '#302338');

    rect(x, y, w, h, '#67424a');
    rect(x + 3, y + 2, w - 6, h - 4, '#965f5b');

    // Tábuas

    for (let i = 5; i < w; i += 7) {
        rect(
            x + i,
            y + 3,
            2,
            h - 6,
            '#51323d'
        );
    }

    // Aros metálicos

    rect(x - 1, y + 7, w + 2, 5, '#414052');
    rect(x - 1, y + 8, w + 2, 2, '#9293aa');

    rect(x - 1, y + h - 12, w + 2, 5, '#414052');
    rect(x - 1, y + h - 11, w + 2, 2, '#9293aa');

    rect(x + 4, y, w - 8, 4, '#c78b76');
}

// ======================================================
// 21. CRISTAIS
// ======================================================

function drawCrystal(x, y, size, seed) {
    const glow =
        0.2 + Math.sin(clock * 0.035 + seed) * 0.08;

    g.globalAlpha = glow;

    rect(
        x - size,
        y - size * 2,
        size * 2,
        size * 2,
        '#b58cff'
    );

    g.globalAlpha = 1;

    g.fillStyle = '#5c4a9c';

    g.beginPath();

    g.moveTo(x - size / 2, y);
    g.lineTo(x - size / 2, y - size);
    g.lineTo(x, y - size * 1.7);
    g.lineTo(x + size / 2, y - size);
    g.lineTo(x + size / 2, y);

    g.closePath();
    g.fill();

    g.fillStyle = '#b9a3ff';

    g.beginPath();

    g.moveTo(x, y);
    g.lineTo(x, y - size * 1.7);
    g.lineTo(x + size / 2, y - size);
    g.lineTo(x + size / 2, y);

    g.closePath();
    g.fill();

    rect(
        x - 2,
        y - size,
        3,
        size * 0.6,
        '#e4d8ff'
    );
}

// ======================================================
// 22. CERCAS DE MADEIRA
// ======================================================

function drawFence(x, y) {
    for (let i = 0; i < 3; i++) {
        rect(
            x + i * 30,
            y - 35,
            8,
            35,
            '#503440'
        );

        rect(
            x + i * 30 + 2,
            y - 33,
            3,
            31,
            '#a47465'
        );
    }

    rect(x, y - 28, 68, 7, '#63414a');
    rect(x, y - 28, 68, 2, '#b58370');

    rect(x, y - 13, 68, 7, '#63414a');
    rect(x, y - 13, 68, 2, '#b58370');
}

// ======================================================
// 23. DECORAÇÕES DO CENÁRIO
// ======================================================

function drawDecorations(theme) {
    for (const d of decorations) {
        if (!visible(d.x, 50)) continue;

        if (stage === 2) {
            drawCrystal(
                d.x,
                d.y,
                10 + randomSeed(d.seed) * 18,
                d.seed
            );

            continue;
        }

        switch (d.type) {
            case 'barrel':
                drawBarrel(d.x, d.y);
                break;

            case 'rock':
                drawRock(d.x, d.y);
                break;

            case 'flower':
                drawFlower(d.x, d.y, d.seed);
                break;

            case 'bush':
                drawBush(d.x, d.y, theme, d.seed);
                break;
        }
    }

    if (stage === 0) {
        for (let x = 340; x < 1800; x += 450) {
            if (visible(x, 70)) {
                drawFence(x, GROUND);
            }
        }
    }
}

// ======================================================
// 24. PÉTALAS ANIMADAS
// ======================================================

function drawPetals(theme) {
    if (stage === 2) return;

    for (let i = 0; i < 40; i++) {
        const speed =
            0.25 + randomSeed(i) * 0.5;

        const position =
            randomSeed(i + 30) * WIDTH +
            Math.sin(clock * 0.015 + i) * 45 -
            camX * 0.35;

        const x =
            ((position % WIDTH) + WIDTH) % WIDTH;

        const y =
            (
                randomSeed(i + 70) * HEIGHT +
                clock * speed
            ) % HEIGHT;

        g.globalAlpha = 0.75;

        rect(x, y, 4, 3, theme.leavesLight);
        rect(x + 1, y + 3, 3, 2, theme.leaves);
    }

    g.globalAlpha = 1;
}

// ======================================================
// 25. OSSINHOS
// ======================================================

function drawBone(b) {
    const floatY =
        Math.sin(clock * 0.06 + b.x) * 5;

    g.save();

    g.translate(b.x, b.y + floatY);
    g.rotate(-0.4);

    // Contorno

    rect(-10, -4, 20, 8, '#543c55');

    rect(-13, -8, 8, 8, '#543c55');
    rect(-13, 0, 8, 8, '#543c55');

    rect(5, -8, 8, 8, '#543c55');
    rect(5, 0, 8, 8, '#543c55');

    // Corpo

    rect(-9, -2, 18, 4, '#fff0dc');

    rect(-11, -6, 5, 12, '#fff0dc');
    rect(6, -6, 5, 12, '#fff0dc');

    // Brilho e sombra

    rect(-9, -3, 18, 2, '#ffffff');
    rect(-7, 2, 14, 2, '#d8a9ae');

    g.restore();
}

// ======================================================
// 26. PERSONAGENS
// ======================================================

function actor(name, x, y, w, h, dir = 1) {
    const im = sprites[name];

    g.save();

    g.translate(
        Math.round(x + (dir < 0 ? w : 0)),
        Math.round(y)
    );

    g.scale(dir, 1);

    if (im && im.complete && im.naturalWidth) {
        // Recortes provisórios das imagens originais.

        const crops = {
            Ewelyn: [0, 0, 0.30, 0.43],
            dylan: [0, 0, 0.30, 0.43],
            freddy: [0, 0, 0.31, 0.46]
        };

        const crop =
            crops[name] || [0, 0, 1, 1];

        g.drawImage(
            im,
            im.naturalWidth * crop[0],
            im.naturalHeight * crop[1],
            im.naturalWidth * crop[2],
            im.naturalHeight * crop[3],
            0,
            0,
            w,
            h
        );

    } else if (
        name === 'lua' ||
        name === 'penelope' ||
        name === 'freddy'
    ) {
        // Representação provisória dos animais.

        const fur =
            name === 'freddy'
                ? '#292631'
                : '#fff4e9';

        const ears =
            name === 'freddy'
                ? '#17151d'
                : '#b9814d';

        rect(2, h * 0.35, w - 4, h * 0.5, fur);

        rect(w * 0.12, 0, w * 0.2, h * 0.4, ears);
        rect(w * 0.65, 0, w * 0.2, h * 0.4, ears);

        rect(w * 0.3, h * 0.45, 4, 4, '#30233e');
        rect(w * 0.65, h * 0.45, 4, 4, '#30233e');

        rect(
            w * 0.2,
            h * 0.7,
            w * 0.6,
            4,
            name === 'freddy' ? '#d54d58' : '#e8a0c6'
        );

    } else {
        // Representação provisória humana.

        rect(8, 0, w - 16, 18, '#53313e');
        rect(10, 5, w - 20, 15, '#c88e71');
        rect(5, 20, w - 10, h - 28, '#a56a89');
        rect(7, h - 10, 8, 10, '#3e304a');
        rect(w - 15, h - 10, 8, 10, '#3e304a');
    }

    g.restore();
}

// ======================================================
// 27. INIMIGOS
// ======================================================

function drawEnemy(e) {
    if (e.hp <= 0 || !visible(e.x, e.w)) {
        return;
    }

    const color =
        e.boss ? '#d6d2dc' : '#77514d';

    // Corpo

    rect(e.x, e.y, e.w, e.h, '#382b3c');

    rect(
        e.x + 3,
        e.y + 3,
        e.w - 6,
        e.h - 6,
        color
    );

    // Orelhas

    rect(e.x - 3, e.y + 5, 7, 10, color);

    rect(
        e.x + e.w - 4,
        e.y + 5,
        7,
        10,
        color
    );

    // Rosto

    rect(
        e.x + 5,
        e.y + 6,
        e.w - 10,
        15,
        '#b68c77'
    );

    rect(e.x + 8, e.y + 10, 5, 5, '#231c32');

    rect(
        e.x + e.w - 13,
        e.y + 10,
        5,
        5,
        '#231c32'
    );

    // Armadura

    rect(
        e.x + 5,
        e.y + e.h * 0.55,
        e.w - 10,
        e.h * 0.3,
        '#55556b'
    );

    // Barra de vida

    rect(e.x, e.y - 10, e.w, 5, '#39283a');

    rect(
        e.x,
        e.y - 10,
        e.w * e.hp / e.maxHp,
        5,
        '#ed7790'
    );

    if (e.boss) {
        text(
            'Capitão Humacaco',
            e.x - 30,
            e.y - 20
        );
    }
}

// ======================================================
// 28. PORTAL DE SAÍDA
// ======================================================

function drawPortal(x, y) {
    const glow = g.createRadialGradient(
        x + 30,
        y + 45,
        10,
        x + 30,
        y + 45,
        85
    );

    glow.addColorStop(0, '#e6aaff55');
    glow.addColorStop(1, '#e6aaff00');

    g.fillStyle = glow;

    g.fillRect(
        x - 60,
        y - 45,
        180,
        180
    );

    rect(x, y + 10, 60, 85, '#392c50');
    rect(x + 10, y, 40, 15, '#392c50');

    rect(x + 5, y + 12, 50, 83, '#9472b7');
    rect(x + 13, y + 5, 34, 15, '#9472b7');

    rect(x + 12, y + 20, 36, 75, '#d9b7ec');

    for (let i = 0; i < 12; i++) {
        const py =
            (i * 17 + clock * 0.7) % 70;

        const px =
            randomSeed(i + 10) * 30;

        rect(
            x + 15 + px,
            y + 22 + py,
            3,
            3,
            '#fff1dc'
        );
    }

    text('SAÍDA [E]', x - 12, y - 15);
}

// ======================================================
// 29. CENÁRIO DAS CAVERNAS
// ======================================================

function drawCaveBackground() {
    for (let i = -1; i < 12; i++) {
        const x =
            i * 120 - (camX * 0.25 % 120);

        const height =
            40 + randomSeed(i + 80) * 120;

        g.fillStyle = '#29233f';

        g.beginPath();

        g.moveTo(x, 0);
        g.lineTo(x + 90, 0);
        g.lineTo(x + 45, height);

        g.closePath();
        g.fill();

        drawCrystal(
            x + 60,
            420,
            18 + randomSeed(i) * 15,
            i
        );
    }
}

// ======================================================
// 30. RENDERIZAÇÃO PRINCIPAL
// ======================================================

function draw() {
    const s = stages[stage];
    const theme = worldThemes[s.theme];

    g.globalAlpha = 1;

    // CAMADA 1 - Céu

    drawSky(theme);

    // CAMADA 2 - Nuvens

    drawClouds();

    // CAMADA 3 - Montanhas

    drawMountains(
        theme.mountainFar,
        0.15,
        465,
        170,
        310
    );

    drawMountains(
        theme.mountainNear,
        0.30,
        490,
        125,
        250
    );

    // CAMADA 4 - Vegetação distante

    if (stage !== 2) {
        g.globalAlpha = 0.55;

        for (let i = -1; i < 8; i++) {
            const x =
                i * 220 - (camX * 0.5 % 220);

            drawTree(
                x,
                465,
                0.65,
                theme,
                i + 10
            );
        }

        g.globalAlpha = 1;
    } else {
        drawCaveBackground();
    }

    // CAMADA 5 - Mundo interativo

    g.save();

    g.translate(
        -Math.round(camX),
        -Math.round(camY)
    );

    // Árvores próximas

    if (stage !== 2) {
        for (
            let x = 110;
            x < s.length;
            x += 490
        ) {
            if (!visible(x - 150, 300)) continue;

            drawTree(
                x,
                GROUND,
                1.15,
                theme,
                x
            );
        }
    }

    // Terreno

    for (const a of platforms) {
        drawTerrain(a, theme);
    }

    // Vegetação e objetos

    drawDecorations(theme);

    // Ossinhos

    for (const b of bones) {
        if (!b.taken && visible(b.x, 25)) {
            drawBone(b);
        }
    }

    // NPCs

    for (const n of npcs) {
        if (!visible(n.x, 50)) continue;

        actor(n.name, n.x, 410, 42, 50);

        text(
            n.label,
            n.x - 12,
            400,
            '#ffe2ef'
        );

        if (Math.abs(n.x - p.x) < 100) {
            text('[E]', n.x, 380, '#fff1ba');
        }
    }

    // Inimigos

    for (const e of enemies) {
        drawEnemy(e);
    }

    // Portão de cristal

    if (!gate) {
        rect(1650, 200, 30, 260, '#5b4b9e');

        for (let y = 200; y < 460; y += 16) {
            rect(1655, y, 8, 12, '#c5b5ff');
            rect(1668, y + 4, 6, 12, '#9280e2');
        }
    }

    // Portal

    drawPortal(s.length - 95, 365);

    // Ewelyn

    if (p.hurt <= 0 || clock % 8 < 4) {
        const walking =
            p.ground && p.vx !== 0
                ? Math.sin(clock * 0.25) * 2
                : 0;

        actor(
            'Ewelyn',
            p.x,
            p.y + walking,
            p.w,
            p.h,
            p.dir
        );
    }

    // Efeito de ataque

    if (p.attack > 10) {
        g.strokeStyle = '#ffe6b7';
        g.lineWidth = 5;

        g.beginPath();

        g.arc(
            p.x + p.w / 2,
            p.y + 25,
            48,
            p.dir > 0 ? -1.2 : 2,
            p.dir > 0 ? 1.2 : 4.3
        );

        g.stroke();
    }

    g.restore();

    // CAMADA 6 - Partículas em primeiro plano

    drawPetals(theme);
}

// ======================================================
// 31. LOOP PRINCIPAL
// ======================================================

function loop(t) {
    acc += Math.min(
        100,
        t - (last || t)
    );

    last = t;

    while (acc >= 1000 / 60) {
        if (active) {
            update();
        }

        acc -= 1000 / 60;
    }

    if (active) {
        draw();
    }

    requestAnimationFrame(loop);
}

// ======================================================
// 32. INICIALIZAÇÃO DO JOGO
// ======================================================

menu();

requestAnimationFrame(loop);
