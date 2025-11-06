/**
 * Idea 2: L'Istogramma che Scompare
 */
const sketchHisto = (p) => {
    let numBarre = 50;
    let distribuzioneAttuale = new Array(numBarre).fill(0);
    let M_campioni = 1000; // Numero di campioni per generazione
    let generazione = 0;
    
    let bottone;
    let canvasContainer;

    p.setup = () => {
        canvasContainer = p.select('#canvas-histo');
        let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
        canvas.parent(canvasContainer);
        p.pixelDensity(1);

        // 1. Inizializza la distribuzione (con p.noise per code e picchi)
        let noiseScale = 0.1;
        let total = 0;
        for (let i = 0; i < numBarre; i++) {
            // Usa noise e potenzialo per creare picchi più alti
            let val = p.pow(p.noise(i * noiseScale), 2);
            distribuzioneAttuale[i] = val;
            total += val;
        }
        // Normalizza al numero di campioni M
        for (let i = 0; i < numBarre; i++) {
            distribuzioneAttuale[i] = (distribuzioneAttuale[i] / total) * M_campioni;
        }

        // 2. Setup UI
        let uiContainer = p.select('#ui-histo');
        bottone = p.createButton('Campiona e Riadatta');
        bottone.parent(uiContainer);
        bottone.mousePressed(campiona);

        p.noLoop();
        p.draw();
    };

    p.draw = () => {
        p.background('#111');
        p.noStroke();

        // 1. Disegna l'istogramma
        let barWidth = p.width / numBarre;
        let maxVal = p.max(distribuzioneAttuale);
        
        if (maxVal === 0) maxVal = 1; // Evita divisione per 0

        for (let i = 0; i < numBarre; i++) {
            let val = distribuzioneAttuale[i];
            let h = p.map(val, 0, maxVal, 0, p.height - 30); // Lascia spazio per testo
            
            // Colora le barre basse (le "code") in modo diverso
            if (val > 0 && val < M_campioni * 0.005) { // Se è molto piccolo ma non 0
                p.fill('#7080a0'); // Colore "dim"
            } else {
                p.fill('#a0c0ff'); // Colore highlight
            }
            
            p.rect(i * barWidth, p.height - h, barWidth - 1, h);
        }

        // 2. Disegna UI interna
        p.fill(255);
        p.textFont('Lato');
        p.textSize(14);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`Generazione: ${generazione}`, 15, 15);
        
        let barreAttive = distribuzioneAttuale.filter(v => v > 0).length;
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`Modalità Attive: ${barreAttive} / ${numBarre}`, p.width - 15, 15);
    };

    function campiona() {
        generazione++;
        
        // 1. Calcola il peso totale e le probabilità
        let totalWeight = distribuzioneAttuale.reduce((a, b) => a + b, 0);
        
        // Se il modello è collassato (tutto 0), non fare nulla
        if (totalWeight === 0) {
            p.redraw();
            return;
        }

        let probabilities = distribuzioneAttuale.map(v => v / totalWeight);
        
        // 2. Campiona M volte
        let nuovaDistribuzione = new Array(numBarre).fill(0);
        for (let i = 0; i < M_campioni; i++) {
            let idx = pickWeightedIndex(probabilities);
            nuovaDistribuzione[idx]++;
        }
        
        distribuzioneAttuale = nuovaDistribuzione;
        p.redraw();
    }

    // Helper: Sceglie un indice basato su un array di probabilità
    function pickWeightedIndex(prob) {
        let r = p.random(1);
        let sum = 0;
        for (let i = 0; i < prob.length; i++) {
            sum += prob[i];
            if (r < sum) {
                return i;
            }
        }
        return prob.length - 1; // Fallback
    }
    
    p.windowResized = () => {
        p.resizeCanvas(canvasContainer.width, canvasContainer.height);
        p.redraw();
    };
};

new p5(sketchHisto, 'canvas-histo');