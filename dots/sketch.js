// --- Variabili Globali della Simulazione ---

let nodes = []; // Array per contenere tutti i "puntini"
let numNodes = 200; // Numero totale di ricercatori

let modelRadius = 150; // Il raggio del "Modello" (Paradigma) attuale
let modelTension = 0; // La "Tensione" accumulata nel modello
let tensionThreshold = 500; // Tensione massima prima che un salto sia possibile

// --- Classe per i Nodi (Puntini) ---

class Node {
  constructor(type) {
    this.type = type; // 'perfezionatore' o 'riformatore'
    
    // Tutti partono all'interno del modello
    this.pos = p5.Vector.random2D().mult(random(modelRadius));
    
    // Velocità di "pensiero" casuale
    this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));

    if (this.type === 'riformatore') {
      this.color = color(0, 255, 255); // Ciano per i Riformatori
    } else {
      this.color = color(255, 255, 0, 200); // Giallo per i Perfezionatori
    }
  }

  // Aggiorna la posizione e la logica
  update() {
    this.pos.add(this.vel);
    
    // Aggiunge un movimento erratico, come il pensiero
    this.vel.rotate(random(-15, 15));

    let distFromCenter = this.pos.mag();

    // --- Logica per i PERFEZIONATORI ---
    if (this.type === 'perfezionatore') {
      // Se colpiscono il bordo del Modello (un'anomalia)
      if (distFromCenter > modelRadius) {
        // 1. Rimbalzano, non possono uscire
        this.pos = this.pos.normalize().mult(modelRadius);
        this.vel.mult(-1); 
        
        // 2. Aumentano la "Tensione del Modello"
        modelTension += 0.5;
        
        // 3. Contribuiscono a una crescita *incrementale* lentissima
        modelRadius += 0.01;
      }
    }
    
    // --- Logica per i RIFORMATORI ---
    if (this.type === 'riformatore') {
      // Loro *possono* uscire dal modello.
      // Se sono fuori E la tensione è alta...
      if (distFromCenter > modelRadius && modelTension >= tensionThreshold) {
        
        // *** SALTO DI PARADIGMA! ***
        
        // 1. Il modello si espande fino alla loro posizione
        modelRadius = distFromCenter; 
        
        // 2. La tensione accumulata si scarica
        modelTension = 0;
        
        // 3. Feedback visivo: un "lampo" che mostra il nuovo bordo
        flashNewModelBorder(modelRadius);
      }
    }
  }

  // Disegna il nodo
  draw() {
    noStroke();
    fill(this.color);
    circle(this.pos.x, this.pos.y, 6);
  }
}

// --- Funzioni P5.js ---

function setup() {
  createCanvas(800, 800);
  
  // Crea i nodi
  
  // MODIFICA: Garantisce che almeno 1 Riformatore sia presente
  nodes.push(new Node('riformatore'));
  
  // Crea i restanti (numNodes - 1) nodi
  for (let i = 0; i < numNodes - 1; i++) {
    // Il 2% sono Riformatori, il 98% Perfezionatori
    if (random(1) < 0.02) {
      nodes.push(new Node('riformatore'));
    } else {
      nodes.push(new Node('perfezionatore'));
    }
  }
}

function draw() {
  // Sfondo nero con leggera trasparenza per l'effetto "scia"
  background(17, 17, 17, 50); 
  
  // Disegna gli elementi dell'interfaccia (fissi)
  drawUI();

  // Sposta l'origine (0,0) al centro del canvas
  // Tutto ciò che viene disegnato dopo sarà relativo al centro
  translate(width / 2, height / 2);

  // --- Disegna la Simulazione ---
  
  // 1. Disegna il "Modello" attuale (il cerchio)
  noFill();
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  circle(0, 0, modelRadius * 2);

  // 2. Aggiorna e disegna ogni nodo
  for (let node of nodes) {
    node.update();
    node.draw();
  }
}

// Disegna la barra della tensione
function drawUI() {
  // MODIFICA: Decommentato per mostrare la barra della tensione
  
  // Disegna la barra prima del 'translate' per fissarla in alto
  let tensionPercent = modelTension / tensionThreshold;
  let barWidth = map(tensionPercent, 0, 1, 0, width - 40);
  // Assicura che la barra non superi il massimo
  barWidth = constrain(barWidth, 0, width - 40);

  // Barra di sfondo
  noStroke();
  fill(50);
  rect(20, 20, width - 40, 15, 5);
  
  // Barra di tensione
  fill(255, 0, 0); // Rossa
  rect(20, 20, barWidth, 15, 5);

  // Testo
  fill(200);
  textSize(14);
  textAlign(LEFT, TOP);
  // Aggiunto padding al testo
  text("TENSIONE DEL MODELLO", 22, 40);
}

// Funzione helper per il "lampo" del cambio di paradigma
function flashNewModelBorder(radius) {
  stroke(255, 255, 0, 200); // Lampo giallo brillante
  strokeWeight(10);
  noFill();
  circle(0, 0, radius * 2);
}