
const canvas = document.getElementById("EwyTitle");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 220;

const texto = "Ewy World";
const x = 450, y = 110;

ctx.font = "bold 115px Georgia";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.lineJoin = "round";

// Gerador aleatório reproduzível
let seed = 12345;
const random = () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
};

// Criar textura de terra
const terra = document.createElement("canvas");
terra.width = canvas.width;
terra.height = canvas.height;

const t = terra.getContext("2d");

t.fillStyle = "#412A4D";
t.fillRect(0, 0, 900, 220);

// Camadas de solo
[
    ["#886A91", 55, 90],
    ["#65476F", 90, 125],
    ["#412A4D", 125, 165],
    ["#291B32", 165, 210]
].forEach(([cor, inicio, fim]) => {
    t.fillStyle = cor;

    for (let px = 0; px < 900; px += 6) {
        t.fillRect(px, inicio + Math.floor(random() * 15) - 7, 6, fim - inicio);
    }
});

// Fragmentos de terra
const cores = ["#A88BAF", "#795C85", "#412A4D", "#302038", "#65476F"];

for (let i = 0; i < 3500; i++) {
    t.fillStyle = cores[Math.floor(random() * cores.length)];
    t.fillRect(
        Math.floor(random() * 900),
        Math.floor(random() * 220),
        2 + Math.floor(random() * 5),
        2 + Math.floor(random() * 5)
    );
}

// Pedras
for (let i = 0; i < 130; i++) {
    const px = random() * 900;
    const py = random() * 220;
    const w = 5 + random() * 9;

    t.fillStyle = "#291B32";
    t.fillRect(px, py, w, 3 + random() * 5);

    t.fillStyle = "#886A91";
    t.fillRect(px, py, w * 0.6, 2);
}

// Recortar textura no formato do texto
t.globalCompositeOperation = "destination-in";
t.font = ctx.font;
t.textAlign = "center";
t.textBaseline = "middle";
t.fillText(texto, x, y);

// Desenhar contornos
[
    ["#211627", 14],
    ["#795C85", 5]
].forEach(([cor, largura]) => {
    ctx.strokeStyle = cor;
    ctx.lineWidth = largura;
    ctx.strokeText(texto, x, y);
});

// Aplicar terra
ctx.drawImage(terra, 0, 0);

// Brilho superior
ctx.globalAlpha = 0.25;
ctx.strokeStyle = "#B69BBE";
ctx.lineWidth = 2;
ctx.strokeText(texto, x, y - 2);
ctx.globalAlpha = 1;
