// ============== SHADER DEFINITIONS ==============

// Vertex Shader (standard, passa le coordinate)
const vs = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    
    void main() {
        vTexCoord = aTexCoord;
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0; // Mappa da [0,1] a [-1,1]
        gl_Position = positionVec4;
    }
`;

// Fragment Shader per Galassia Luminosa (Sketches 1, 2, 3, 4)
// Usa l'interpolazione (smoothstep) per creare un glow bianco
const fsGalaxy = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform vec3 u_color;
    
    void main() {
        vec2 uv = vTexCoord - 0.5; // Centro a (0,0)
        float d = length(uv); // Distanza dal centro (da 0.0 a 0.5)
        
        // Interpolazione del colore per il glow
        // Inizia a sfumare da 0.45 (bordo esterno) fino a 0.1 (nucleo)
        // pow() crea una curva di attenuazione più morbida
        float intensity = 1.0 - smoothstep(0.1, 0.45, d); 
        
        gl_FragColor = vec4(u_color, pow(intensity, 2.0));
    }
`;

// Fragment Shader per Galassia "Anti-Glow" (NON PIÙ USATO NELLO SKETCH 2)
// Usa l'interpolazione per creare un nucleo bianco e un alone scuro
const fsAntiGalaxy = `
    precision mediump float;
    varying vec2 vTexCoord;
    
    void main() {
        vec2 uv = vTexCoord - 0.5;
        float d = length(uv); // da 0.0 a 0.5
        
        // Nucleo bianco solido
        float core = 1.0 - smoothstep(0.4, 0.42, d);
        
        // "Anti-glow" scuro (alpha) che inizia dove finisce il nucleo
        float anti_glow_alpha = (1.0 - smoothstep(0.42, 0.5, d)) * 0.7;
        
        // Colore: bianco per il nucleo (core), nero (0,0,0) per l'anti-glow
        vec3 color = vec3(core); 
        
        // Alpha: opaco per il nucleo, 70% opaco per l'anti-glow
        float alpha = core + anti_glow_alpha;
        
        gl_FragColor = vec4(color, alpha); // Core: (1,1,1,1), Anti-Glow: (0,0,0,0.7)
    }
`;


// Funzione per creare un'istanza p5.js in un elemento specifico
function createP5Sketch(sketchFunction, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenitore con ID "${containerId}" non trovato.`);
        return;
    }
    return new p5(sketchFunction, container);
}

// ============== SKETCH 1: Il Telescopio Ordinario ==============
const sketch1 = (p) => {
    let glowColor;
    let sensorCharge = 0;
    let maxCharge = 200;
    let charging = false;
    let imageFormed = false;
    let clickAreaX, clickAreaY, clickAreaW, clickAreaH;
    let photons = [];
    let sensorPos, sensorSize;

    let galaxyShader, galaxyTexture; // Per lo shader

    // Colori per il gradiente del telescopio
    let telBody1, telBody2, telLens;

    // Funzioni helper per il glow (usate solo per i fotoni ora)
    const setGlow = (color, blur) => {
        p.drawingContext.shadowBlur = blur;
        p.drawingContext.shadowColor = color;
    };
    const resetGlow = () => {
        p.drawingContext.shadowBlur = 0;
    };

    // Helper per gradiente lineare
    const drawLinearGradient = (x, y, w, h, c1, c2, axis) => {
        p.noFill();
        if (axis === 'Y') {
            for (let i = y; i <= y + h; i++) {
                let inter = p.map(i, y, y + h, 0, 1);
                let c = p.lerpColor(c1, c2, inter);
                p.stroke(c);
                p.line(x, i, x + w, i);
            }
        } else { // 'X'
            for (let i = x; i <= x + w; i++) {
                let inter = p.map(i, x, x + w, 0, 1);
                let c = p.lerpColor(c1, c2, inter);
                p.stroke(c);
                p.line(i, y, i, y + h);
            }
        }
        p.noStroke();
    };


    const resizeElements = () => {
        clickAreaW = p.width * 0.2;
        clickAreaH = p.width * 0.2;
        clickAreaX = p.width * 0.15;
        clickAreaY = p.height * 0.5 - clickAreaH / 2;

        sensorPos = { x: p.width * 0.8, y: p.height * 0.5 };
        sensorSize = { w: p.width * 0.1, h: p.height * 0.1 };
    };

    p.setup = () => {
        const container = p.canvas.parentElement;
        p.createCanvas(container.offsetWidth, container.offsetHeight); 
        
        p.noStroke();
        glowColor = p.color(255);
        
        // Colori gradiente
        telBody1 = p.color(45, 45, 50);
        telBody2 = p.color(65, 65, 70);
        telLens = p.color(30, 30, 35);

        // Setup per lo shader della galassia
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);

        resizeElements();
    };

    p.draw = () => {
        p.background(10, 10, 12);

        // Telescopio (con gradiente)
        let telX = p.width * 0.7;
        let telY = p.height * 0.35;
        let telW = p.width * 0.2;
        let telH = p.height * 0.3;
        // Corpo del telescopio con gradiente
        drawLinearGradient(telX, telY, telW, telH, telBody1, telBody2, 'Y');
        p.noFill(); // Riempiamo con il gradiente, quindi no fill
        p.rect(telX, telY, telW, telH, 10); // Disegno il rettangolo sopra per i bordi arrotondati
        
        // Lente/Apertura (più scura)
        p.fill(telLens);
        p.ellipse(p.width * 0.7, p.height * 0.5, p.width * 0.15, p.height * 0.3);
        
        
        // Sensore
        p.fill(30);
        p.rect(sensorPos.x - sensorSize.w / 2, sensorPos.y - sensorSize.h / 2, sensorSize.w, sensorSize.h);

        // Galassia (renderizzata con lo shader)
        // 1. Aggiorna la texture dello shader
        galaxyTexture.shader(galaxyShader);
        galaxyShader.setUniform('u_color', [1.0, 1.0, 1.0]); // Colore bianco
        galaxyTexture.background(0, 0, 0, 0); // Sfondo trasparente
        galaxyTexture.rect(0, 0, 128, 128); // Esegui lo shader

        // 2. Disegna la texture sul canvas principale
        p.imageMode(p.CENTER);
        // Disegno la texture 2x della dimensione dell'area click per mostrare l'intero glow
        p.image(galaxyTexture, clickAreaX + clickAreaW / 2, clickAreaY + clickAreaH / 2, clickAreaW * 2, clickAreaH * 2);

        // Indicatore di carica
        p.fill(30);
        p.rect(p.width * 0.75, p.height * 0.8, 100, 20, 3);
        setGlow(glowColor, 10);
        p.fill(240);
        let chargeWidth = p.map(sensorCharge, 0, maxCharge, 0, 100);
        p.rect(p.width * 0.75, p.height * 0.8, chargeWidth, 20, 3);
        resetGlow();

        p.fill(255);
        p.textSize(12);
        p.textAlign(p.CENTER);
        p.textFont('Cormorant Garamond');
        p.text('Sensore', p.width * 0.75 + 50, p.height * 0.78);

        // ... (logica di carica)
        if (charging) {
            sensorCharge += 1;
            if (p.frameCount % 5 === 0) {
                photons.push({
                    x: clickAreaX + p.random(clickAreaW),
                    y: clickAreaY + p.random(clickAreaH),
                    t: 0
                });
            }
            if (sensorCharge >= maxCharge) {
                sensorCharge = maxCharge;
                charging = false;
                imageFormed = true;
            }
        }

        // Fotoni (luminosi)
        setGlow(glowColor, 8);
        p.fill(255, 200);
        for (let i = photons.length - 1; i >= 0; i--) {
            let ph = photons[i];
            ph.t += 0.02;
            let currentX = p.lerp(ph.x, sensorPos.x, ph.t);
            let currentY = p.lerp(ph.y, sensorPos.y, ph.t);
            p.ellipse(currentX, currentY, 3, 3);
            if (ph.t >= 1.0) {
                photons.splice(i, 1);
            }
        }
        resetGlow();

        if (imageFormed) {
            // Immagine formata
            let alpha = p.map(sensorCharge, maxCharge - 50, maxCharge, 0, 255);
            setGlow(glowColor, 15);
            p.fill(240, alpha);
            p.ellipse(sensorPos.x, sensorPos.y, sensorSize.w * 0.8, sensorSize.h * 0.8);
            resetGlow();
        }

        // Guida (MODIFICATA)
        if (!charging && !imageFormed) {
             p.fill(255, 255, 255, 180);
             p.textAlign(p.CENTER, p.CENTER);
             p.textSize(14);
             // Sposta il testo vicino alla galassia
             p.text("Clicca qui per osservare", clickAreaX + clickAreaW / 2, clickAreaY + clickAreaH * 1.5); 
             
             // Highlight pulsante
             let pulseAlpha = p.map(p.sin(p.frameCount * 0.05), -1, 1, 50, 150);
             p.noFill();
             p.strokeWeight(2);
             p.stroke(255, 255, 255, pulseAlpha);
             p.ellipse(clickAreaX + clickAreaW/2, clickAreaY + clickAreaH/2, clickAreaW * 1.6, clickAreaH * 1.6);
             p.noStroke(); // Resetta lo stroke
        }
    };

    p.mousePressed = () => {
        // Usa p.touches per compatibilità mobile
        if (p.touches.length > 0 || p.mouseIsPressed) {
            let tX = (p.touches.length > 0) ? p.touches[0].x : p.mouseX;
            let tY = (p.touches.length > 0) ? p.touches[0].y : p.mouseY;

            if (tX > clickAreaX && tX < clickAreaX + clickAreaW &&
                tY > clickAreaY && tY < clickAreaY + clickAreaH) {
                if (!charging) {
                    charging = true;
                    imageFormed = false;
                    sensorCharge = 0;
                    photons = [];
                }
            }
        }
    };
    
    // Rendi touchPressed alias di mousePressed per coerenza
    p.touchStarted = p.mousePressed;

    p.windowResized = () => {
        const container = p.canvas.parentElement;
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        
        // MODIFICA CORRETTIVA
        // Ricrea la texture E LO SHADER
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);
        
        resizeElements();
    };
};

// ============== SKETCH 2: Il Telescopio di Chen ==============
const sketch2 = (p) => {
    let glowColor;
    let sensorCharge = 200;
    let maxCharge = 200;
    let minCharge = 0;
    let discharging = false;
    let imageFormed = false;
    let clickAreaX, clickAreaY, clickAreaW, clickAreaH;
    let photons = [];
    let sensorPos, sensorSize;
    
    // MODIFICA: Usa lo shader standard fsGalaxy
    let galaxyShader, galaxyTexture; // Per lo shader

    // Colori per il gradiente del telescopio
    let telBody1, telBody2, telLens;

    const setGlow = (color, blur) => {
        p.drawingContext.shadowBlur = blur;
        p.drawingContext.shadowColor = color;
    };
    const resetGlow = () => {
        p.drawingContext.shadowBlur = 0;
    };

    // Helper per gradiente lineare
    const drawLinearGradient = (x, y, w, h, c1, c2, axis) => {
        p.noFill();
        if (axis === 'Y') {
            for (let i = y; i <= y + h; i++) {
                let inter = p.map(i, y, y + h, 0, 1);
                let c = p.lerpColor(c1, c2, inter);
                p.stroke(c);
                p.line(x, i, x + w, i);
            }
        } else { // 'X'
            for (let i = x; i <= x + w; i++) {
                let inter = p.map(i, x, x + w, 0, 1);
                let c = p.lerpColor(c1, c2, inter);
                p.stroke(c);
                p.line(i, y, i, y + h);
            }
        }
        p.noStroke();
    };

    const resizeElements = () => {
        clickAreaW = p.width * 0.2;
        clickAreaH = p.width * 0.2;
        clickAreaX = p.width * 0.15;
        clickAreaY = p.height * 0.5 - clickAreaH / 2;

        sensorPos = { x: p.width * 0.8, y: p.height * 0.5 };
        sensorSize = { w: p.width * 0.1, h: p.height * 0.1 };
    };

    p.setup = () => {
        const container = p.canvas.parentElement;
        p.createCanvas(container.offsetWidth, container.offsetHeight); 
        
        p.noStroke();
        glowColor = p.color(255);
        
        // Colori gradiente
        telBody1 = p.color(45, 45, 50);
        telBody2 = p.color(65, 65, 70);
        telLens = p.color(30, 30, 35);
        
        // MODIFICA: Setup per lo shader galassia (fsGalaxy)
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);
        
        resizeElements();
    };

    p.draw = () => {
        p.background(10, 10, 12);

        // Telescopio (con gradiente)
        let telX = p.width * 0.7;
        let telY = p.height * 0.35;
        let telW = p.width * 0.2;
        let telH = p.height * 0.3;
        // Corpo del telescopio con gradiente
        drawLinearGradient(telX, telY, telW, telH, telBody1, telBody2, 'Y');
        p.noFill(); 
        p.rect(telX, telY, telW, telH, 10); 
        
        // Lente/Apertura (più scura)
        p.fill(telLens);
        p.ellipse(p.width * 0.7, p.height * 0.5, p.width * 0.15, p.height * 0.3);
        
        // Sensore (scuro)
        p.fill(30);
        p.rect(sensorPos.x - sensorSize.w / 2, sensorPos.y - sensorSize.h / 2, sensorSize.w, sensorSize.h);

        // MODIFICA: Galassia (renderizzata con lo shader standard)
        // 1. Aggiorna la texture dello shader
        galaxyTexture.shader(galaxyShader);
        galaxyShader.setUniform('u_color', [1.0, 1.0, 1.0]); // Colore bianco
        galaxyTexture.background(0, 0, 0, 0);
        galaxyTexture.rect(0, 0, 128, 128);

        // 2. Disegna la texture sul canvas
        p.imageMode(p.CENTER);
        p.image(galaxyTexture, clickAreaX + clickAreaW / 2, clickAreaY + clickAreaH / 2, clickAreaW * 2, clickAreaH * 2);

        // Indicatore di carica (luminoso)
        p.fill(30);
        p.rect(p.width * 0.75, p.height * 0.8, 100, 20, 3);
        setGlow(glowColor, 10);
        p.fill(240); // Barra bianca
        let chargeWidth = p.map(sensorCharge, minCharge, maxCharge, 0, 100);
        p.rect(p.width * 0.75, p.height * 0.8, chargeWidth, 20, 3);
        resetGlow();
        
        // Glow del sensore durante la scarica
        if (discharging) {
            setGlow(glowColor, 25);
            p.fill(240, p.random(30, 60));
            p.rect(p.width * 0.75 - 5, p.height * 0.8 - 5, 110, 30, 5);
            resetGlow();
        }

        p.fill(255);
        p.textSize(12);
        p.textAlign(p.CENTER);
        p.textFont('Cormorant Garamond');
        p.text('Sensore (Carico)', p.width * 0.75 + 50, p.height * 0.78);

        // ... (logica di scarica)
        if (discharging) {
            sensorCharge -= 1;
            if (p.frameCount % 5 === 0) {
                photons.push({
                    x: sensorPos.x + p.random(-sensorSize.w/2, sensorSize.w/2),
                    y: sensorPos.y + p.random(-sensorSize.h/2, sensorSize.h/2),
                    t: 0
                });
            }
            if (sensorCharge <= minCharge) {
                sensorCharge = minCharge;
                discharging = false;
                imageFormed = true;
            }
        }
        
        // Fotoni (luminosi)
        let targetX = clickAreaX + clickAreaW / 2;
        let targetY = clickAreaY + clickAreaH / 2;
        setGlow(glowColor, 8);
        
        for (let i = photons.length - 1; i >= 0; i--) {
            let ph = photons[i];
            ph.t += 0.02;
            let currentX = p.lerp(ph.x, targetX, ph.t);
            let currentY = p.lerp(ph.y, targetY, ph.t);
            
            let alpha = p.map(ph.t, 0.8, 1.0, 200, 0);
            p.fill(255, alpha); // Bianco
            p.ellipse(currentX, currentY, 3, 3);
            
            if (ph.t >= 1.0) {
                photons.splice(i, 1);
            }
        }
        resetGlow();

        if (imageFormed) {
            // Immagine "negativa"
            setGlow(glowColor, 15);
            p.fill(240, 150);
            p.ellipse(sensorPos.x, sensorPos.y, sensorSize.w * 0.8, sensorSize.h * 0.8);
            resetGlow();
        }
        
        // Guida (MODIFICATA)
        if (!discharging && !imageFormed) {
             p.fill(255, 255, 255, 180);
             p.textAlign(p.CENTER, p.CENTER);
             p.textSize(14);
             // Sposta il testo vicino alla galassia
             p.text("Clicca qui per 'scaricare'", clickAreaX + clickAreaW / 2, clickAreaY + clickAreaH * 1.5);
             
             // Highlight pulsante
             let pulseAlpha = p.map(p.sin(p.frameCount * 0.05), -1, 1, 50, 150);
             p.noFill();
             p.strokeWeight(2);
             p.stroke(255, 255, 255, pulseAlpha);
             p.ellipse(clickAreaX + clickAreaW/2, clickAreaY + clickAreaH/2, clickAreaW * 1.6, clickAreaH * 1.6);
             p.noStroke(); // Resetta lo stroke
        }
    };

    p.mousePressed = () => {
        // Usa p.touches per compatibilità mobile
        if (p.touches.length > 0 || p.mouseIsPressed) {
            let tX = (p.touches.length > 0) ? p.touches[0].x : p.mouseX;
            let tY = (p.touches.length > 0) ? p.touches[0].y : p.mouseY;

            if (tX > clickAreaX && tX < clickAreaX + clickAreaW &&
                tY > clickAreaY && tY < clickAreaY + clickAreaH) {
                if (!discharging) {
                    discharging = true;
                    imageFormed = false;
                    sensorCharge = maxCharge;
                    photons = [];
                }
            }
        }
    };
    
    // Rendi touchPressed alias di mousePressed per coerenza
    p.touchStarted = p.mousePressed;
    
    p.windowResized = () => {
        const container = p.canvas.parentElement;
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        
        // MODIFICA CORRETTIVA
        // Ricrea la texture E LO SHADER
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);
        
        resizeElements();
    };
};

// ============== SKETCH 3: La Macchina di Hazzard ==============
const sketch3 = (p) => {
    let sensorCharge = 150;
    let maxCharge = 200;
    let minCharge = 0;
    let shutterOpen = false;
    let shutterTargetY = 0;
    let shutterCurrentY = 0;
    
    let shutterActionTime = -1;
    let anticipatedAction = false;
    let futureDelay = 120; // 120 frame = 4 secondi a 30fps

    let shutterPos, detectorPos, galaxyPos;
    let glowColor;
    
    let galaxyShader, galaxyTexture; // Per lo shader

    // Colori per gradiente shutter
    let shutterFrame1, shutterFrame2, shutterBlade1, shutterBlade2;

    const setGlow = (color, blur) => {
        p.drawingContext.shadowBlur = blur;
        p.drawingContext.shadowColor = color;
    };
    const resetGlow = () => {
        p.drawingContext.shadowBlur = 0;
    };

    // Helper per gradiente lineare
    const drawLinearGradient = (x, y, w, h, c1, c2, axis) => {
        p.noFill();
        if (axis === 'Y') {
            for (let i = y; i <= y + h; i++) {
                let inter = p.map(i, y, y + h, 0, 1);
                let c = p.lerpColor(c1, c2, inter);
                p.stroke(c);
                p.line(x, i, x + w, i);
            }
        } else { // 'X'
            for (let i = x; i <= x + w; i++) {
                let inter = p.map(i, x, x + w, 0, 1);
                let c = p.lerpColor(c1, c2, inter);
                p.stroke(c);
                p.line(i, y, i, y + h);
            }
        }
        p.noStroke();
    };

    const resizeElements = () => {
        galaxyPos = { x: p.width * 0.2, y: p.height * 0.5 };
        shutterPos = { x: p.width * 0.45, y: p.height * 0.4, w: p.width * 0.1, h: p.height * 0.2 };
        detectorPos = { x: p.width * 0.8, y: p.height * 0.4, w: p.width * 0.1, h: p.height * 0.2 };
    };

    p.setup = () => {
        const container = p.canvas.parentElement;
        p.createCanvas(container.offsetWidth, container.offsetHeight); 
        p.noStroke();
        p.frameRate(30); // Imposta framerate per consistenza delay
        
        glowColor = p.color(255);

        // Colori gradiente
        shutterFrame1 = p.color(70, 70, 75);
        shutterFrame2 = p.color(90, 90, 95);
        shutterBlade1 = p.color(140, 140, 145);
        shutterBlade2 = p.color(160, 160, 165);

        // Setup per lo shader della galassia
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);
        
        resizeElements();
        
        shutterTargetY = shutterPos.h;
        shutterCurrentY = shutterPos.h;
    };

    p.draw = () => {
        p.background(10, 10, 12);
        p.textFont('Cormorant Garamond');

        // Galassia (renderizzata con shader)
        galaxyTexture.shader(galaxyShader);
        galaxyShader.setUniform('u_color', [1.0, 1.0, 1.0]); // Bianco
        galaxyTexture.background(0, 0, 0, 0);
        galaxyTexture.rect(0, 0, 128, 128);
        
        p.imageMode(p.CENTER);
        // Calcolo la dimensione in base a quella originale
        let galaxyW = p.width * 0.15;
        let galaxyH = p.height * 0.15;
        p.image(galaxyTexture, galaxyPos.x, galaxyPos.y, galaxyW * 2, galaxyH * 2);

        p.textSize(12);
        p.fill(255);
        p.textAlign(p.CENTER);
        p.text("Galassia di Chen", galaxyPos.x, galaxyPos.y + p.height * 0.15);

        // Rilevatore
        let jitter = 0;
        if (anticipatedAction) {
            jitter = p.random(-1, 1);
        }
        p.fill(50);
        p.rect(detectorPos.x, detectorPos.y, detectorPos.w, detectorPos.h, 5);
        
        // Carica
        setGlow(glowColor, 15);
        p.fill(240);
        let chargeHeight = p.map(sensorCharge, minCharge, maxCharge, 0, detectorPos.h);
        p.rect(detectorPos.x + jitter, detectorPos.y + (detectorPos.h - chargeHeight), 
               detectorPos.w, chargeHeight, 5);
        resetGlow();
        
        p.fill(255);
        p.text('Rilevatore', detectorPos.x + detectorPos.w / 2, detectorPos.y - 10);

        // Shutter (con gradiente)
        shutterTargetY = shutterOpen ? 0 : shutterPos.h;
        shutterCurrentY = p.lerp(shutterCurrentY, shutterTargetY, 0.1);
        
        // Frame
        drawLinearGradient(shutterPos.x, shutterPos.y, shutterPos.w, shutterPos.h, shutterFrame1, shutterFrame2, 'Y');
        p.noFill();
        p.rect(shutterPos.x, shutterPos.y, shutterPos.w, shutterPos.h, 5); // Per i bordi
        
        // Blade
        if (shutterCurrentY > 1) { // Evita di disegnare se è 0
            drawLinearGradient(shutterPos.x, shutterPos.y, shutterPos.w, shutterCurrentY, shutterBlade1, shutterBlade2, 'Y');
            p.noFill();
            p.rect(shutterPos.x, shutterPos.y, shutterPos.w, shutterCurrentY, 5); // Per i bordi
        }
        
        p.fill(255);
        p.text('Shutter (Clicca!)', shutterPos.x + shutterPos.w / 2, shutterPos.y - 10);

        // Percorso ottico
        p.stroke(100, 100, 100, 50);
        p.strokeWeight(2);
        p.line(galaxyPos.x + p.width * 0.075, galaxyPos.y, shutterPos.x, galaxyPos.y);
        p.line(shutterPos.x + shutterPos.w, galaxyPos.y, detectorPos.x, galaxyPos.y);
        
        // Segnale di anticipazione
        if (anticipatedAction) {
            setGlow(glowColor, 10);
            p.stroke(255, 100);
            p.strokeWeight(p.random(1, 3));
            p.line(detectorPos.x, galaxyPos.y + p.random(-2, 2), 
                   shutterPos.x + shutterPos.w, galaxyPos.y + p.random(-2, 2));
            resetGlow();
        }
        p.noStroke();

        // ... (Logica di anticipazione)
        
        // Gestione dell'anticipazione (quando shutterActionTime è impostato)
        if (shutterActionTime !== -1) {
            // Se siamo nel periodo di ANTICIPAZIONE (prima dell'azione)
            if (p.frameCount >= (shutterActionTime - futureDelay) && p.frameCount < shutterActionTime) {
                anticipatedAction = true;
                // L'azione futura è APRIRE (shutterOpen = true) -> il sensore si SCARICA in anticipo
                if (shutterOpen && sensorCharge > minCharge) {
                    sensorCharge -= (maxCharge / futureDelay); // Scarica costante
                } 
                // L'azione futura è CHIUDERE (shutterOpen = false) -> il sensore si CARICA in anticipo
                else if (!shutterOpen && sensorCharge < maxCharge) {
                    sensorCharge += (maxCharge / futureDelay); // Carica costante
                }
            }
            // Se abbiamo superato il tempo dell'azione (l'azione è avvenuta)
            else if (p.frameCount >= shutterActionTime) {
                anticipatedAction = false;
                shutterActionTime = -1; // Resetta il timer
                // Sincronizza lo stato (per sicurezza)
                sensorCharge = shutterOpen ? minCharge : maxCharge;
            }
        }
        
        // Normalizza i valori per evitare overflow/underflow
        sensorCharge = p.constrain(sensorCharge, minCharge, maxCharge);


        // Messaggi
        p.fill(255, 255, 255, 180);
        p.textSize(14);
        p.textAlign(p.LEFT);
        p.text("Stato Rilevatore: " + (anticipatedAction ? "ANTICIPAZIONE ATTIVA" : "Stabile"), p.width * 0.05, p.height * 0.1);
        p.text("Shutter (Stato): " + (shutterOpen ? "APERTO" : "CHIUSO"), p.width * 0.05, p.height * 0.15);
        if(anticipatedAction) {
            setGlow(glowColor, 10);
            p.fill(255);
            let actionText = shutterOpen ? "APERTURA" : "CHIUSURA";
            p.text("Reazione in corso... Anticipando " + actionText, p.width * 0.05, p.height * 0.2);
            resetGlow();
        }
    };

    p.mousePressed = () => {
        // Usa p.touches per compatibilità mobile
        if (p.touches.length > 0 || p.mouseIsPressed) {
            let tX = (p.touches.length > 0) ? p.touches[0].x : p.mouseX;
            let tY = (p.touches.length > 0) ? p.touches[0].y : p.mouseY;

            if (tX > shutterPos.x && tX < shutterPos.x + shutterPos.w &&
                tY > shutterPos.y && tY < shutterPos.y + shutterPos.h) {
                
                // Solo se non stiamo già anticipando un'azione
                if (shutterActionTime === -1) { 
                    shutterOpen = !shutterOpen; // Decidi l'azione futura
                    shutterActionTime = p.frameCount + futureDelay; // Imposta il tempo dell'azione
                    // Non impostare anticipatedAction = true qui, lascia che la logica in draw() lo gestisca
                }
            }
        }
    };
    
    // Rendi touchPressed alias di mousePressed per coerenza
    p.touchStarted = p.mousePressed;
    
    p.windowResized = () => {
        const container = p.canvas.parentElement;
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        
        // MODIFICA CORRETTIVA
        // Ricrea la texture E LO SHADER
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);
        
        resizeElements();
    };
};


// ============== SKETCH 4: Implicazioni e Messaggio dal Futuro ==============
const sketch4 = (p) => {
    let sensorCharge = 0;
    let message = "";
    let displayedMessage = "";
    let messageIndex = 0;
    let typingSpeed = 3;
    let messageComplete = false;
    let animationStarted = false;
    let particles = [];
    let detectorPos;
    let glowColor;

    let galaxyShader, galaxyTexture; // Per lo shader

    const setGlow = (color, blur) => {
        p.drawingContext.shadowBlur = blur;
        p.drawingContext.shadowColor = color;
    };
    const resetGlow = () => {
        p.drawingContext.shadowBlur = 0;
    };

    const resizeElements = () => {
        detectorPos = { x: p.width * 0.75, y: p.height * 0.5, w: p.width * 0.2, h: p.height * 0.3 };
    };

    p.setup = () => {
        const container = p.canvas.parentElement;
        p.createCanvas(container.offsetWidth, container.offsetHeight); 
        p.noStroke();
        p.frameRate(30);
        
        glowColor = p.color(255);

        // Setup per lo shader della galassia
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);
        
        resizeElements();
    };

    p.draw = () => {
        p.background(10, 10, 12);
        p.textFont('Cormorant Garamond');

        // Galassia (Fonte luminosa)
        galaxyTexture.shader(galaxyShader);
        galaxyShader.setUniform('u_color', [1.0, 1.0, 1.0]); // Bianco
        galaxyTexture.background(0, 0, 0, 0);
        galaxyTexture.rect(0, 0, 128, 128);
        
        p.imageMode(p.CENTER);
        let galaxyW = p.width * 0.1;
        let galaxyH = p.height * 0.1;
        p.image(galaxyTexture, p.width * 0.2, p.height * 0.5, galaxyW * 2.5, galaxyH * 2.5);
        
        p.fill(255);
        p.textSize(12);
        p.textAlign(p.CENTER);
        p.text("Fonte (Futuro)", p.width * 0.2, p.height * 0.6);

        // Rilevatore (scuro)
        p.fill(50);
        p.rect(detectorPos.x - detectorPos.w / 2, detectorPos.y - detectorPos.h / 2, detectorPos.w, detectorPos.h, 5);
        p.fill(255);
        p.text('Rilevatore Hazzard', detectorPos.x, detectorPos.y - detectorPos.h / 2 - 10);

        if (!animationStarted) {
            p.fill(255, 255, 255, 180);
            p.textSize(16);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("Clicca per ricevere il messaggio dal futuro", p.width / 2, p.height * 0.3);
            return;
        }

        // ... (logica di carica)
        if (sensorCharge < 100) {
            sensorCharge += 0.5;
            if (p.frameCount % 2 === 0) {
                particles.push({
                    x: p.width * 0.2,
                    y: p.height * 0.5,
                    t: 0,
                    vx: p.random(2, 4),
                    vy: p.random(-1, 1)
                });
            }
        }
        
        // Particelle di segnale (luminose)
        setGlow(glowColor, 8);
        for (let i = particles.length - 1; i >= 0; i--) {
            let pt = particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.t += 1;
            
            let alpha = p.map(pt.x, p.width * 0.2, detectorPos.x, 150, 0);
            p.fill(255, alpha); // Bianco
            p.ellipse(pt.x, pt.y, 3, 3);
            
            if (pt.x > detectorPos.x) {
                particles.splice(i, 1);
            }
        }
        resetGlow();

        // Mostra il messaggio (con leggero glow)
        if (sensorCharge >= 100) {
            if (!messageComplete && p.frameCount % typingSpeed === 0 && messageIndex < message.length) {
                displayedMessage += message.charAt(messageIndex);
                messageIndex++;
            } else if (messageIndex >= message.length) {
                messageComplete = true;
            }

            setGlow(p.color(240, 240, 255, 100), 10);
            p.fill(240);
            p.textSize(16);
            p.textAlign(p.CENTER, p.CENTER); // Centra il testo verticalmente
            p.textFont("Courier New");
            p.text(displayedMessage, detectorPos.x, detectorPos.y);
            
            // Cursore
            if (!messageComplete && p.frameCount % 15 < 8) {
                // Ricalcolo posizione cursore (più preciso)
                let lines = displayedMessage.split('\n');
                let lastLine = lines[lines.length - 1];
                let textH = p.textSize();
                let textW = p.textWidth(lastLine);
                
                // Posizione iniziale del testo (centrato)
                let startX = detectorPos.x - p.textWidth(lastLine) / 2;
                let startY = detectorPos.y - (lines.length - 1) * (textH / 2);
                
                p.fill(240);
                p.rect(startX + textW + 2, startY + (lines.length - 1) * textH - (textH / 2) + 2, 8, 2);
            }
            resetGlow();
        }
    };

    p.mousePressed = () => {
        if (!animationStarted) {
            animationStarted = true;
            sensorCharge = 0;
            displayedMessage = "";
            messageIndex = 0;
            messageComplete = false;
            particles = [];
        } else if (messageComplete) {
            animationStarted = false;
        }
    };
    
    // Rendi touchPressed alias di mousePressed per coerenza
    p.touchStarted = p.mousePressed;
    
    p.windowResized = () => {
        const container = p.canvas.parentElement;
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        
        // MODIFICA CORRETTIVA
        // Ricrea la texture E LO SHADER
        galaxyTexture = p.createGraphics(128, 128, p.WEBGL);
        galaxyTexture.noStroke();
        galaxyShader = galaxyTexture.createShader(vs, fsGalaxy);
        
        resizeElements();
    };
};


// Inizializza gli sketch
window.onload = () => {
    createP5Sketch(sketch1, 'sketch-concetto-base');
    createP5Sketch(sketch2, 'sketch-galassie-invertite');
    createP5Sketch(sketch3, 'sketch-macchine-hazzard');
    createP5Sketch(sketch4, 'sketch-implicazioni');
};