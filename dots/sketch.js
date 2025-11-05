let nodes = [];
let numNodes = 200;
let modelRadius = 150;
let modelTension = 0;
let tensionThreshold = 500;

let canvasContainer;

class Node {
  constructor(type) {
    this.type = type;
    this.pos = p5.Vector.random2D().mult(random(modelRadius));
    this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));

    if (this.type === 'riformatore') {
      this.color = color(0, 255, 255);
    } else {
      this.color = color(255, 255, 0, 200);
    }
  }

  update() {
    this.pos.add(this.vel);
    this.vel.rotate(random(-15, 15));

    let distFromCenter = this.pos.mag();

    if (this.type === 'perfezionatore') {
      if (distFromCenter > modelRadius) {
        this.pos = this.pos.normalize().mult(modelRadius);
        this.vel.mult(-1);
        modelTension += 0.5;
        modelRadius += 0.01;
      }
    }
    
    if (this.type === 'riformatore') {
      if (distFromCenter > modelRadius && modelTension >= tensionThreshold) {
        modelRadius = distFromCenter;
        modelTension = 0;
        flashNewModelBorder(modelRadius);
      }
    }
  }

  draw() {
    noStroke();
    fill(this.color);
    circle(this.pos.x, this.pos.y, 6);
  }
}

function setup() {
  canvasContainer = document.querySelector('main');
  let w = canvasContainer.clientWidth;
  let h = canvasContainer.clientHeight;
  createCanvas(w, h);
  
  angleMode(DEGREES);

  let minDim = min(w, h);
  
  modelRadius = map(minDim, 300, 800, 100, 200);
  modelRadius = constrain(modelRadius, 100, 250);
  
  numNodes = int(map(minDim, 300, 800, 100, 200));
  numNodes = constrain(numNodes, 80, 200);

  tensionThreshold = numNodes * 2.5;
  
  nodes.push(new Node('riformatore'));
  
  for (let i = 0; i < numNodes - 1; i++) {
    if (random(1) < 0.02) {
      nodes.push(new Node('riformatore'));
    } else {
      nodes.push(new Node('perfezionatore'));
    }
  }
}

function draw() {
  background(17, 17, 17, 50);
  drawUI();
  translate(width / 2, height / 2);

  noFill();
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  circle(0, 0, modelRadius * 2);

  for (let node of nodes) {
    node.update();
    node.draw();
  }
}

function windowResized() {
  if (canvasContainer) {
    let w = canvasContainer.clientWidth;
    let h = canvasContainer.clientHeight;
    resizeCanvas(w, h);
  }
}

function drawUI() {
  let tensionPercent = modelTension / tensionThreshold;
  let barWidth = map(tensionPercent, 0, 1, 0, width - 40);
  barWidth = constrain(barWidth, 0, width - 40);

  noStroke();
  fill(50);
  rect(20, 20, width - 40, 15, 5);
  
  fill(255, 0, 0);
  rect(20, 20, barWidth, 15, 5);

  fill(200);
  textSize(14);
  textAlign(LEFT, TOP);
  text("TENSIONE DEL MODELLO", 22, 40);
}

function flashNewModelBorder(radius) {
  stroke(255, 255, 0, 200);
  strokeWeight(10);
  noFill();
  circle(0, 0, radius * 2);
}
