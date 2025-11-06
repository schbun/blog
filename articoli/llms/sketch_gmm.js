/**
 * Idea 1: La Nuvola che si Restringe (GMM)
 */
const sketchGMM = (p) => {
    let datiReali = [];
    let datiAttuali = [];
    let generazione = 0;
    let numPuntiTotali = 300;

    let bottone;
    let sliderReale;
    let testoSlider;
    
    let canvasContainer;

    p.setup = () => {
        canvasContainer = p.select('#canvas-gmm');
        let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
        canvas.parent(canvasContainer);
        p.pixelDensity(1); // Performance

        // 1. Crea i dati reali (3 cluster)
        datiReali.push(...creaCluster(numPuntiTotali / 3, -150, -100, 30));
        datiReali.push(...creaCluster(numPuntiTotali / 3, 150, -100, 30));
        datiReali.push(...creaCluster(numPuntiTotali / 3, 0, 150, 40));
        
        datiAttuali = [...datiReali]; // Copia iniziale

        // 2. Setup UI
        let uiContainer = p.select('#ui-gmm');
        
        bottone = p.createButton('Prossima Generazione');
        bottone.parent(uiContainer);
        bottone.mousePressed(prossimaGenerazione);

        let sliderContainer = p.createDiv();
        sliderContainer.parent(uiContainer);
        sliderContainer.style('display', 'flex').style('align-items', 'center');

        p.createSpan('Dati Reali %: ').parent(sliderContainer);
        sliderReale = p.createSlider(0, 100, 0);
        sliderReale.parent(sliderContainer);
        sliderReale.style('margin', '0 10px');
        testoSlider = p.createSpan('0%').parent(sliderContainer);
        
        p.noLoop(); // Disegna solo on setup e quando richiesto
        p.draw(); // Chiamata iniziale
    };

    p.draw = () => {
        p.background('#111');
        p.translate(p.width / 2, p.height / 2); // Centra
        
        // 1. Disegna i dati reali (grigio, sfondo)
        p.stroke(255, 255, 255, 30);
        p.strokeWeight(2);
        for (let v of datiReali) {
            p.point(v.x, v.y);
        }

        // 2. Disegna i dati attuali (blu, primo piano)
        p.stroke('#a0c0ff');
        p.strokeWeight(3);
        for (let v of datiAttuali) {
            p.point(v.x, v.y);
        }

        // 3. Calcola e disegna il "modello" (media e std dev dei dati attuali)
        let { mean, stdDev } = calcolaStatistiche(datiAttuali);
        p.noFill();
        p.stroke(255, 150);
        p.strokeWeight(2);
        // Disegna un'ellisse che rappresenta la deviazione standard
        p.ellipse(mean.x, mean.y, stdDev.x * 2, stdDev.y * 2);

        // 4. Disegna UI interna
        p.resetMatrix(); // Rimuovi translate
        p.fill(255);
        p.noStroke();
        p.textFont('Lato');
        p.textSize(14);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`Generazione: ${generazione}`, 15, 15);
        
        // Aggiorna testo slider
        testoSlider.html(sliderReale.value() + '%');
    };

    function prossimaGenerazione() {
        generazione++;
        
        // 1. Calcola il modello (media e std dev)
        let { mean, stdDev } = calcolaStatistiche(datiAttuali);
        
        let nuoviDati = [];
        let percReale = sliderReale.value();
        
        for (let i = 0; i < numPuntiTotali; i++) {
            if (p.random(100) < percReale) {
                // Campiona dalla "realtà"
                nuoviDati.push(p.random(datiReali));
            } else {
                // Campiona dal "modello" (che collassa)
                let x = p.randomGaussian(mean.x, stdDev.x);
                let y = p.randomGaussian(mean.y, stdDev.y);
                nuoviDati.push(p.createVector(x, y));
            }
        }
        
        datiAttuali = nuoviDati;
        p.redraw(); // Aggiorna il canvas
    }

    // Helper: Crea un cluster di N punti
    function creaCluster(n, centroX, centroY, stdDev) {
        let cluster = [];
        for (let i = 0; i < n; i++) {
            let x = p.randomGaussian(centroX, stdDev);
            let y = p.randomGaussian(centroY, stdDev);
            cluster.push(p.createVector(x, y));
        }
        return cluster;
    }

    // Helper: Calcola media e std dev
    function calcolaStatistiche(dati) {
        if (dati.length === 0) {
            return { mean: p.createVector(0, 0), stdDev: p.createVector(0, 0) };
        }

        // Calcola media
        let sumX = 0, sumY = 0;
        for (let v of dati) {
            sumX += v.x;
            sumY += v.y;
        }
        let mean = p.createVector(sumX / dati.length, sumY / dati.length);

        // Calcola deviazione standard
        let sumVarX = 0, sumVarY = 0;
        for (let v of dati) {
            sumVarX += (v.x - mean.x) * (v.x - mean.x);
            sumVarY += (v.y - mean.y) * (v.y - mean.y);
        }
        let stdDev = p.createVector(
            p.sqrt(sumVarX / dati.length) || 1, // Evita stdDev 0
            p.sqrt(sumVarY / dati.length) || 1
        );
        
        return { mean, stdDev };
    }

    p.windowResized = () => {
        p.resizeCanvas(canvasContainer.width, canvasContainer.height);
        p.redraw();
    };
};

new p5(sketchGMM, 'canvas-gmm');