
const canvas = document.getElementById("EwyTitle");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 220;

const texto = "Ewy World";
const fonte = "bold 115px Georgia";

const x = canvas.width / 2;
const y = canvas.height / 2;

ctx.font = fonte;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.lineJoin = "round";

// Gerador de números aleatórios reproduzíveis
let seed = 12345;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

// Máscara com o formato das letras
const mask = document.createElement("canvas");
mask.width = canvas.width;
mask.height = canvas.height;

const m = mask.getContext("2d");

m.font = fonte;
m.textAlign = "center";
m.textBaseline = "middle";
m.fillStyle = "#ffffff";
m.fillText(texto, x, y);

// Camada de terra
const soil = document.createElement("canvas");
soil.width = canvas.width;
soil.height = canvas.height;

const s = soil.getContext("2d");

// Cor base da terra
s.fillStyle = "#412A4D";
s.fillRect(0, 0, soil.width, soil.height);

// Camadas irregulares de solo
const camadas = [
    { cor: "#886A91", inicio: 55, fim: 90 },
    { cor: "#65476F", inicio: 90, fim: 125 },
    { cor: "#412A4D", inicio: 125, fim: 165 },
    { cor: "#291B32", inicio: 165, fim: 210 }
];

camadas.forEach(camada => {
    s.fillStyle = camada.cor;

    for (let px = 0; px < soil.width; px += 6) {
        const variacao = Math.floor(random() * 15) - 7;

        s.fillRect(
            px,
            camada.inicio + variacao,
            6,
            camada.fim - camada.inicio
        );
    }
});

// Pequenos fragmentos de terra e pedras
const cores = [
    "#A88BAF",
    "#795C85",
    "#412A4D",
    "#302038",
    "#65476F"
];

for (let i = 0; i < 3500; i++) {
    const px = Math.floor(random() * soil.width);
    const py = Math.floor(random() * soil.height);

    const tamanho = 2 + Math.floor(random() * 5);

    s.fillStyle = cores[Math.floor(random() * cores.length)];

    s.fillRect(px, py, tamanho, tamanho);
}

// Pedras maiores
for (let i = 0; i < 130; i++) {
    const px = random() * soil.width;
    const py = random() * soil.height;

    const largura = 5 + random() * 9;
    const altura = 3 + random() * 5;

    s.fillStyle = "#291B32";
    s.fillRect(px, py, largura, altura);

    s.fillStyle = "#886A91";
    s.fillRect(px, py, largura * 0.6, 2);
}

// Recortar a terra no formato das letras
s.globalCompositeOperation = "destination-in";
s.drawImage(mask, 0, 0);
s.globalCompositeOperation = "source-over";

// Contorno externo
ctx.strokeStyle = "#211627";
ctx.lineWidth = 14;
ctx.strokeText(texto, x, y);

// Contorno interno
ctx.strokeStyle = "#795C85";
ctx.lineWidth = 5;
ctx.strokeText(texto, x, y);

// Aplicar a textura
ctx.drawImage(soil, 0, 0);

// Pequeno brilho superior
ctx.globalAlpha = 0.25;
ctx.strokeStyle = "#B69BBE";
ctx.lineWidth = 2;
ctx.strokeText(texto, x, y - 2);
ctx.globalAlpha = 1;
