/**
 * Idea 3: La Frase in Loop
 */
const sketchText = (p) => {
    let vocabolario = [];
    let fraseAttuale = "Clicca 'Genera Frase' per iniziare...";
    
    let bottone;
    let canvasContainer;

    p.setup = () => {
        canvasContainer = p.select('#canvas-text');
        let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
        canvas.parent(canvasContainer);
        p.pixelDensity(1);

        // 1. Inizializza il vocabolario
        let parole = [
            "il", "gatto", "corre", "sul", "tetto", "cane", "dorme",
            "sempre", "raramente", "vede", "un", "uccello", "blu",
            "grande", "piccolo", "sole", "brilla", "nel", "cielo", "luna",
            "guarda", "sogna"
        ];
        
        for (let parola of parole) {
            vocabolario.push({
                parola: parola,
                prob: p.random(0.5, 1.5) // Inizia con probabilità simili
            });
        }
        
        // 2. Setup UI
        let uiContainer = p.select('#ui-text');
        bottone = p.createButton('Genera Frase');
        bottone.parent(uiContainer);
        bottone.mousePressed(generaFrase);
        
        p.noLoop();
        p.draw();
    };

    p.draw = () => {
        p.background('#111');
        
        // 1. Disegna il vocabolario
        disegnaVocabolario();
        
        // 2. Disegna la frase attuale
        p.fill('#a0c0ff');
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Cormorant Garamond');
        p.textSize(22);
        p.textStyle(p.ITALIC);
        p.text(fraseAttuale, p.width * 0.1, p.height - 60, p.width * 0.8);
    };

    function disegnaVocabolario() {
        let maxProb = p.max(vocabolario.map(item => item.prob));
        if (maxProb === 0) maxProb = 1;

        let x = 20;
        let y = 30;
        let yStep = 30;
        
        p.textAlign(p.LEFT, p.TOP);
        p.textStyle(p.NORMAL);

        for (let item of vocabolario) {
            let size = p.map(item.prob, 0, maxProb, 12, 28);
            let alpha = p.map(item.prob, 0, maxProb, 80, 255);
            
            p.fill(224, alpha);
            p.textSize(size);
            p.textFont('Lato');
            
            let parolaWidth = p.textWidth(item.parola);
            
            if (x + parolaWidth > p.width - 20) {
                x = 20;
                y += yStep;
                yStep = size * 1.5; // Aumenta lo step y in base alla riga precedente
            }
            
            p.text(item.parola, x, y);
            x += parolaWidth + 15;
            
            if(size * 1.5 > yStep) yStep = size * 1.5;
        }
    }

    function generaFrase() {
        // 1. Genera la frase
        let paroleUsate = [];
        let lunghezzaFrase = p.int(p.random(5, 9));
        
        for (let i = 0; i < lunghezzaFrase; i++) {
            let parolaObj = pickWeightedWord();
            paroleUsate.push(parolaObj);
        }
        
        fraseAttuale = paroleUsate.map(item => item.parola).join(' ');
        
        // 2. Aggiorna probabilità (il feedback loop)
        let decay = 0.95; // Lento decadimento per tutte
        let boost = 0.5;  // Aumento per quelle usate
        
        for (let item of vocabolario) {
            item.prob *= decay;
            // Aggiungi un minimo per evitare che collassi a 0 assoluto
            if (item.prob < 0.1) item.prob = 0.1; 
        }
        
        for (let parolaObj of paroleUsate) {
            parolaObj.prob += boost;
        }
        
        p.redraw();
    }

    // Helper: Sceglie un oggetto parola basato sul peso
    function pickWeightedWord() {
        let totalWeight = vocabolario.reduce((sum, item) => sum + item.prob, 0);
        
        let r = p.random(totalWeight);
        let sum = 0;
        for (let item of vocabolario) {
            sum += item.prob;
            if (r < sum) {
                return item;
            }
        }
        return vocabolario[vocabolario.length - 1]; // Fallback
    }

    p.windowResized = () => {
        p.resizeCanvas(canvasContainer.width, canvasContainer.height);
        p.redraw();
    };
};

new p5(sketchText, 'canvas-text');