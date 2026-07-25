const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");

const textoPontuacao = document.getElementById("pontuacao");
const textoVidas = document.getElementById("vidas");
const botaoReiniciar = document.getElementById("reiniciar");

const joystick = document.getElementById("joystick");
const joystickBola = document.getElementById("joystick-bola");

const teclas = {};

const TOTAL_RECICLAVEIS = 25;

const VELOCIDADE_BASE_BICHO = 1.4;
const VELOCIDADE_BASE_TIRO = 3.5;

const INTERVALO_DISPARO = 2500;

// ======================================
// IMAGENS
// ======================================

const texturaFundo = new Image();
texturaFundo.src = "imagens/fundo.png";

const texturaJogador = new Image();
texturaJogador.src = "imagens/jogador.png";

const texturaPoluicao = new Image();
texturaPoluicao.src = "imagens/poluicao.png";

const texturaTiro = new Image();
texturaTiro.src = "imagens/tiro.png";

const texturasReciclaveis = [];

for (let i = 1; i <= TOTAL_RECICLAVEIS; i++) {
    const imagem = new Image();

    imagem.src = `imagens/reciclavel${i}.png`;

    texturasReciclaveis.push(imagem);
}

// ======================================
// OBJETOS DO JOGO
// ======================================

const jogador = {
    x: 60,
    y: 275,

    largura: 55,
    altura: 55,

    velocidadeNormal: 5,
    velocidadeLenta: 2
};

const reciclavel = {
    x: 450,
    y: 250,

    largura: 50,
    altura: 50
};

const bichoPoluicao = {
    x: 850,
    y: 480,

    largura: 70,
    altura: 70,

    velocidade: VELOCIDADE_BASE_BICHO
};

// ======================================
// VARIÁVEIS DO JOGO
// ======================================

let tiros = [];

let pontuacao = 0;
let vidas = 3;

let jogoTerminou = false;
let jogadorVenceu = false;

let jogadorLentoAte = 0;

let ultimoDisparo = 0;
let ultimoContatoComBicho = 0;

// ======================================
// CONTROLE DO JOYSTICK
// ======================================

const movimentoJoystick = {
    x: 0,
    y: 0
};

let joystickAtivo = false;
let ponteiroJoystick = null;

function atualizarJoystick(evento) {
    const area = joystick.getBoundingClientRect();

    const centroX =
        area.left + area.width / 2;

    const centroY =
        area.top + area.height / 2;

    let diferencaX =
        evento.clientX - centroX;

    let diferencaY =
        evento.clientY - centroY;

    const tamanhoBola =
        joystickBola.offsetWidth;

    const limite =
        area.width / 2 -
        tamanhoBola / 2 -
        7;

    const distancia = Math.hypot(
        diferencaX,
        diferencaY
    );

    if (distancia > limite) {
        diferencaX =
            diferencaX / distancia * limite;

        diferencaY =
            diferencaY / distancia * limite;
    }

    joystickBola.style.transform =
        `translate(
            calc(-50% + ${diferencaX}px),
            calc(-50% + ${diferencaY}px)
        )`;

    movimentoJoystick.x =
        diferencaX / limite;

    movimentoJoystick.y =
        diferencaY / limite;
}

function iniciarJoystick(evento) {
    evento.preventDefault();

    joystickAtivo = true;
    ponteiroJoystick = evento.pointerId;

    joystick.setPointerCapture(
        evento.pointerId
    );

    atualizarJoystick(evento);
}

function moverJoystick(evento) {
    if (
        !joystickAtivo ||
        evento.pointerId !== ponteiroJoystick
    ) {
        return;
    }

    evento.preventDefault();

    atualizarJoystick(evento);
}

function soltarJoystick(evento) {
    if (
        ponteiroJoystick !== null &&
        evento.pointerId !== ponteiroJoystick
    ) {
        return;
    }

    joystickAtivo = false;
    ponteiroJoystick = null;

    movimentoJoystick.x = 0;
    movimentoJoystick.y = 0;

    joystickBola.style.transform =
        "translate(-50%, -50%)";
}

joystick.addEventListener(
    "pointerdown",
    iniciarJoystick
);

joystick.addEventListener(
    "pointermove",
    moverJoystick
);

joystick.addEventListener(
    "pointerup",
    soltarJoystick
);

joystick.addEventListener(
    "pointercancel",
    soltarJoystick
);

window.addEventListener(
    "blur",
    function () {
        joystickAtivo = false;
        ponteiroJoystick = null;

        movimentoJoystick.x = 0;
        movimentoJoystick.y = 0;

        joystickBola.style.transform =
            "translate(-50%, -50%)";

        for (const tecla in teclas) {
            teclas[tecla] = false;
        }
    }
);

// ======================================
// CONTROLE DO TECLADO
// ======================================

document.addEventListener(
    "keydown",
    function (evento) {
        const tecla =
            evento.key.toLowerCase();

        teclas[tecla] = true;

        if (tecla.startsWith("arrow")) {
            evento.preventDefault();
        }
    }
);

document.addEventListener(
    "keyup",
    function (evento) {
        const tecla =
            evento.key.toLowerCase();

        teclas[tecla] = false;
    }
);

botaoReiniciar.addEventListener(
    "click",
    reiniciarJogo
);

// ======================================
// FUNÇÕES AUXILIARES
// ======================================

function imagemCarregada(imagem) {
    return (
        imagem.complete &&
        imagem.naturalWidth > 0
    );
}

function houveColisao(objeto1, objeto2) {
    return (
        objeto1.x <
            objeto2.x + objeto2.largura &&

        objeto1.x + objeto1.largura >
            objeto2.x &&

        objeto1.y <
            objeto2.y + objeto2.altura &&

        objeto1.y + objeto1.altura >
            objeto2.y
    );
}

function criarPosicaoAleatoria(objeto) {
    let tentativas = 0;

    do {
        objeto.x =
            Math.random() *
            (canvas.width - objeto.largura);

        objeto.y =
            Math.random() *
            (canvas.height - objeto.altura);

        tentativas++;

    } while (
        tentativas < 50 &&
        (
            houveColisao(objeto, jogador) ||
            houveColisao(objeto, bichoPoluicao)
        )
    );
}

function atualizarTextoPontuacao() {
    textoPontuacao.textContent =
        `Recicláveis: ${pontuacao}/${TOTAL_RECICLAVEIS}`;
}

// ======================================
// DIFICULDADE
// ======================================

function atualizarDificuldade() {
    let multiplicadorBicho = 1;

    // A partir de 5 itens:
    // 5% mais rápido
    if (pontuacao >= 5) {
        multiplicadorBicho *= 1.05;
    }

    // A partir de 10 itens:
    // mais 10% rápido
    if (pontuacao >= 10) {
        multiplicadorBicho *= 1.10;
    }

    // A partir de 15 itens:
    // mais 60% rápido
    if (pontuacao >= 15) {
        multiplicadorBicho *= 1.60;
    }

    // A partir de 18 itens:
    // mais 20% rápido
    if (pontuacao >= 18) {
        multiplicadorBicho *= 1.20;
    }

    bichoPoluicao.velocidade =
        VELOCIDADE_BASE_BICHO *
        multiplicadorBicho;
}

function obterVelocidadeTiro() {
    // A partir de 18 itens:
    // tiros 93% mais rápidos
    if (pontuacao >= 18) {
        return VELOCIDADE_BASE_TIRO * 1.93;
    }

    return VELOCIDADE_BASE_TIRO;
}

// ======================================
// MOVIMENTAÇÃO DO JOGADOR
// ======================================

function moverJogador(tempoAtual) {
    const jogadorEstaLento =
        tempoAtual < jogadorLentoAte;

    const velocidade =
        jogadorEstaLento
            ? jogador.velocidadeLenta
            : jogador.velocidadeNormal;

    let movimentoX = movimentoJoystick.x;
    let movimentoY = movimentoJoystick.y;

    if (
        teclas["arrowup"] ||
        teclas["w"]
    ) {
        movimentoY -= 1;
    }

    if (
        teclas["arrowdown"] ||
        teclas["s"]
    ) {
        movimentoY += 1;
    }

    if (
        teclas["arrowleft"] ||
        teclas["a"]
    ) {
        movimentoX -= 1;
    }

    if (
        teclas["arrowright"] ||
        teclas["d"]
    ) {
        movimentoX += 1;
    }

    const intensidade = Math.hypot(
        movimentoX,
        movimentoY
    );

    if (intensidade > 1) {
        movimentoX /= intensidade;
        movimentoY /= intensidade;
    }

    jogador.x +=
        movimentoX * velocidade;

    jogador.y +=
        movimentoY * velocidade;

    jogador.x = Math.max(
        0,
        Math.min(
            canvas.width - jogador.largura,
            jogador.x
        )
    );

    jogador.y = Math.max(
        0,
        Math.min(
            canvas.height - jogador.altura,
            jogador.y
        )
    );
}

// ======================================
// MOVIMENTAÇÃO DA POLUIÇÃO
// ======================================

function moverBichoPoluicao() {
    const centroJogadorX =
        jogador.x + jogador.largura / 2;

    const centroJogadorY =
        jogador.y + jogador.altura / 2;

    const centroBichoX =
        bichoPoluicao.x +
        bichoPoluicao.largura / 2;

    const centroBichoY =
        bichoPoluicao.y +
        bichoPoluicao.altura / 2;

    const diferencaX =
        centroJogadorX - centroBichoX;

    const diferencaY =
        centroJogadorY - centroBichoY;

    const distancia = Math.hypot(
        diferencaX,
        diferencaY
    );

    if (distancia > 0) {
        bichoPoluicao.x +=
            diferencaX /
            distancia *
            bichoPoluicao.velocidade;

        bichoPoluicao.y +=
            diferencaY /
            distancia *
            bichoPoluicao.velocidade;
    }

    bichoPoluicao.x = Math.max(
        0,
        Math.min(
            canvas.width -
                bichoPoluicao.largura,
            bichoPoluicao.x
        )
    );

    bichoPoluicao.y = Math.max(
        0,
        Math.min(
            canvas.height -
                bichoPoluicao.altura,
            bichoPoluicao.y
        )
    );
}

// ======================================
// CRIAÇÃO DOS TIROS
// ======================================

function criarTiro(
    desvioAngulo,
    paraTras = false
) {
    const centroBichoX =
        bichoPoluicao.x +
        bichoPoluicao.largura / 2;

    const centroBichoY =
        bichoPoluicao.y +
        bichoPoluicao.altura / 2;

    const centroJogadorX =
        jogador.x + jogador.largura / 2;

    const centroJogadorY =
        jogador.y + jogador.altura / 2;

    const anguloParaJogador =
        Math.atan2(
            centroJogadorY -
                centroBichoY,

            centroJogadorX -
                centroBichoX
        );

    let anguloTiro =
        anguloParaJogador +
        desvioAngulo;

    if (paraTras) {
        anguloTiro += Math.PI;
    }

    const velocidadeTiro =
        obterVelocidadeTiro();

    const distanciaDaOrigem =
        bichoPoluicao.largura / 2;

    const origemX =
        centroBichoX +
        Math.cos(anguloTiro) *
        distanciaDaOrigem;

    const origemY =
        centroBichoY +
        Math.sin(anguloTiro) *
        distanciaDaOrigem;

    tiros.push({
        x: origemX - 10,
        y: origemY - 10,

        largura: 20,
        altura: 20,

        velocidadeX:
            Math.cos(anguloTiro) *
            velocidadeTiro,

        velocidadeY:
            Math.sin(anguloTiro) *
            velocidadeTiro
    });
}

// ======================================
// RAJADAS
// ======================================

function atirarRajada(tempoAtual) {
    if (
        tempoAtual - ultimoDisparo <
        INTERVALO_DISPARO
    ) {
        return;
    }

    ultimoDisparo = tempoAtual;

    // A partir de 18:
    // três tiros para frente
    // e três tiros para trás
    if (pontuacao >= 18) {
        criarTiro(-0.22);
        criarTiro(0);
        criarTiro(0.22);

        criarTiro(-0.22, true);
        criarTiro(0, true);
        criarTiro(0.22, true);

        return;
    }

    // A partir de 10:
    // três tiros
    if (pontuacao >= 10) {
        criarTiro(-0.22);
        criarTiro(0);
        criarTiro(0.22);

        return;
    }

    // Antes de 10:
    // dois tiros
    criarTiro(-0.14);
    criarTiro(0.14);
}

// ======================================
// MOVIMENTAÇÃO DOS TIROS
// ======================================

function moverTiros() {
    for (const tiro of tiros) {
        tiro.x += tiro.velocidadeX;
        tiro.y += tiro.velocidadeY;
    }

    tiros = tiros.filter(
        function (tiro) {
            return (
                tiro.x > -100 &&
                tiro.x <
                    canvas.width + 100 &&

                tiro.y > -100 &&
                tiro.y <
                    canvas.height + 100
            );
        }
    );
}

// ======================================
// COLISÃO COM OS TIROS
// ======================================

function verificarColisaoDosTiros(
    tempoAtual
) {
    tiros = tiros.filter(
        function (tiro) {
            if (
                houveColisao(
                    jogador,
                    tiro
                )
            ) {
                jogadorLentoAte =
                    tempoAtual + 2000;

                return false;
            }

            return true;
        }
    );
}

// ======================================
// PERDER RECURSOS
// ======================================

function perderRecursosColetados(
    tempoAtual
) {
    pontuacao = 0;

    jogadorLentoAte = 0;

    atualizarTextoPontuacao();
    atualizarDificuldade();

    jogador.x = 60;
    jogador.y = 275;

    bichoPoluicao.x = 850;
    bichoPoluicao.y = 480;

    tiros = [];

    ultimoDisparo = tempoAtual;

    criarPosicaoAleatoria(
        reciclavel
    );
}

// ======================================
// COLISÕES
// ======================================

function verificarColisoes(tempoAtual) {
    if (
        pontuacao <
            TOTAL_RECICLAVEIS &&

        houveColisao(
            jogador,
            reciclavel
        )
    ) {
        pontuacao++;

        atualizarTextoPontuacao();
        atualizarDificuldade();

        if (
            pontuacao >=
            TOTAL_RECICLAVEIS
        ) {
            jogoTerminou = true;
            jogadorVenceu = true;

            return;
        }

        criarPosicaoAleatoria(
            reciclavel
        );
    }

    const tempoDesdeContato =
        tempoAtual -
        ultimoContatoComBicho;

    if (
        houveColisao(
            jogador,
            bichoPoluicao
        ) &&

        tempoDesdeContato > 1000
    ) {
        ultimoContatoComBicho =
            tempoAtual;

        vidas--;

        textoVidas.textContent =
            "Vidas: " + vidas;

        perderRecursosColetados(
            tempoAtual
        );

        if (vidas <= 0) {
            jogoTerminou = true;
            jogadorVenceu = false;
        }
    }

    verificarColisaoDosTiros(
        tempoAtual
    );
}

// ======================================
// DESENHAR CENÁRIO
// ======================================

function desenharCenario() {
    if (
        imagemCarregada(texturaFundo)
    ) {
        ctx.drawImage(
            texturaFundo,
            0,
            0,
            canvas.width,
            canvas.height
        );
    } else {
        ctx.fillStyle = "#9bd18b";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#63b5e8";

        ctx.fillRect(
            0,
            250,
            canvas.width,
            100
        );
    }

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;

    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";

    ctx.strokeText(
        "Proteja o meio ambiente!",
        canvas.width / 2,
        35
    );

    ctx.fillText(
        "Proteja o meio ambiente!",
        canvas.width / 2,
        35
    );
}

// ======================================
// DESENHAR JOGADOR
// ======================================

function desenharJogador(tempoAtual) {
    if (
        imagemCarregada(
            texturaJogador
        )
    ) {
        ctx.drawImage(
            texturaJogador,

            jogador.x,
            jogador.y,

            jogador.largura,
            jogador.altura
        );
    } else {
        ctx.fillStyle = "#146b32";

        ctx.fillRect(
            jogador.x,
            jogador.y,

            jogador.largura,
            jogador.altura
        );

        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "🌱",

            jogador.x +
                jogador.largura / 2,

            jogador.y + 39
        );
    }

    if (
        tempoAtual <
        jogadorLentoAte
    ) {
        ctx.fillStyle = "yellow";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;

        ctx.font =
            "bold 16px Arial";

        ctx.textAlign = "center";

        ctx.strokeText(
            "LENTO!",

            jogador.x +
                jogador.largura / 2,

            jogador.y - 10
        );

        ctx.fillText(
            "LENTO!",

            jogador.x +
                jogador.largura / 2,

            jogador.y - 10
        );
    }
}

// ======================================
// DESENHAR RECICLÁVEL
// ======================================

function desenharReciclavel() {
    if (
        pontuacao >=
        TOTAL_RECICLAVEIS
    ) {
        return;
    }

    const imagemAtual =
        texturasReciclaveis[
            pontuacao
        ];

    if (
        imagemCarregada(imagemAtual)
    ) {
        ctx.drawImage(
            imagemAtual,

            reciclavel.x,
            reciclavel.y,

            reciclavel.largura,
            reciclavel.altura
        );
    } else {
        ctx.fillStyle = "#1677d2";

        ctx.fillRect(
            reciclavel.x,
            reciclavel.y,

            reciclavel.largura,
            reciclavel.altura
        );

        ctx.fillStyle = "white";

        ctx.font =
            "bold 18px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            pontuacao + 1,

            reciclavel.x +
                reciclavel.largura / 2,

            reciclavel.y + 32
        );
    }
}

// ======================================
// DESENHAR POLUIÇÃO
// ======================================

function desenharBichoPoluicao() {
    if (
        imagemCarregada(
            texturaPoluicao
        )
    ) {
        ctx.drawImage(
            texturaPoluicao,

            bichoPoluicao.x,
            bichoPoluicao.y,

            bichoPoluicao.largura,
            bichoPoluicao.altura
        );
    } else {
        ctx.fillStyle = "#4b164c";

        ctx.fillRect(
            bichoPoluicao.x,
            bichoPoluicao.y,

            bichoPoluicao.largura,
            bichoPoluicao.altura
        );

        ctx.fillStyle = "white";
        ctx.font = "38px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "☣",

            bichoPoluicao.x +
                bichoPoluicao.largura / 2,

            bichoPoluicao.y + 49
        );
    }
}

// ======================================
// DESENHAR TIROS
// ======================================

function desenharTiros() {
    for (const tiro of tiros) {
        if (
            imagemCarregada(
                texturaTiro
            )
        ) {
            ctx.drawImage(
                texturaTiro,

                tiro.x,
                tiro.y,

                tiro.largura,
                tiro.altura
            );
        } else {
            ctx.beginPath();

            ctx.arc(
                tiro.x +
                    tiro.largura / 2,

                tiro.y +
                    tiro.altura / 2,

                tiro.largura / 2,

                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#b400ff";

            ctx.fill();

            ctx.strokeStyle =
                "#330044";

            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// ======================================
// MENSAGEM FINAL
// ======================================

function desenharMensagemFinal() {
    ctx.fillStyle =
        "rgba(0, 0, 0, 0.78)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font =
        "bold 46px Arial";

    if (jogadorVenceu) {
        ctx.fillText(
            "Você coletou 25 recicláveis!",

            canvas.width / 2,
            260
        );

        ctx.font =
            "bold 30px Arial";

        ctx.fillText(
            "O meio ambiente foi salvo!",

            canvas.width / 2,
            315
        );
    } else {
        ctx.fillText(
            "A poluição venceu!",

            canvas.width / 2,
            285
        );
    }

    ctx.font = "24px Arial";

    ctx.fillText(
        "Clique em Reiniciar jogo.",

        canvas.width / 2,
        370
    );
}

// ======================================
// REINICIAR O JOGO
// ======================================

function reiniciarJogo() {
    pontuacao = 0;
    vidas = 3;

    jogoTerminou = false;
    jogadorVenceu = false;

    jogador.x = 60;
    jogador.y = 275;

    jogadorLentoAte = 0;

    bichoPoluicao.x = 850;
    bichoPoluicao.y = 480;

    bichoPoluicao.velocidade =
        VELOCIDADE_BASE_BICHO;

    tiros = [];

    ultimoDisparo =
        performance.now();

    ultimoContatoComBicho = 0;

    movimentoJoystick.x = 0;
    movimentoJoystick.y = 0;

    joystickBola.style.transform =
        "translate(-50%, -50%)";

    atualizarTextoPontuacao();

    textoVidas.textContent =
        "Vidas: 3";

    criarPosicaoAleatoria(
        reciclavel
    );
}

// ======================================
// LOOP PRINCIPAL
// ======================================

function executarJogo(tempoAtual) {
    desenharCenario();

    desenharReciclavel();
    desenharBichoPoluicao();
    desenharTiros();
    desenharJogador(tempoAtual);

    if (!jogoTerminou) {
        moverJogador(tempoAtual);
        moverBichoPoluicao();

        atirarRajada(tempoAtual);
        moverTiros();

        verificarColisoes(
            tempoAtual
        );
    } else {
        desenharMensagemFinal();
    }

    requestAnimationFrame(
        executarJogo
    );
}

reiniciarJogo();

requestAnimationFrame(
    executarJogo
);