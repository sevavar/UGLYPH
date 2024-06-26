// Color scheme
let dotSize = 3;
let dotColor = 'white';
let bgColor; // Background color
let fillColor; // Fill color
let fillMode; // Fill mode ("filled", "outline", "worm")
let strokeW = 50; // Stroke weight (outline thickness)
let cursorStrokeW; // Stroke weight for the cursor
let cursorColor = 'red';
let edgeColor = 'black';

// UI
let textOpacity = 255; // Text opacity
let showUi = true; // Flag to show or hide the UI
let guiTextColor = '#bababa';

// Blob
let points = []; // Array to store blob vertex points
let amount = 2000; // Number of blob points
let blobSize = 600; // Size of the blob
let noiseScale = 0.02;
let smoothingEnabled = true;
let amplitude = 2;
let frequency = 0.05;
let explosionForce = 400;
let showDots = true; // Variable to manage dot visibility

// Modifier
let currentMode = "attract"; // Current mode for brush interaction ("attract" or "repulse")
let brushSize = 100; // Size of the brush
let speed; // Speed of brush interaction
let smoothing = 1; // Smoothing factor for blob


function setup() {
  frameRate(60);
  createCanvas(windowWidth, windowHeight);
  generateShape();
  noCursor();

  // Initialize colors
  bgColor = color(255); // Set background color to white
  fillColor = color(0); // Set fill color to black
  fill(255); // Set default fill color
  fillMode = "worm"; // Default fill mode

  // Initialize blob parameters

  // Initialize brush parameters
  speed = 0.05; // Speed of brush interaction
  // Blob vertex array generation

  recolorBlobAndBackground();
}

function draw() {

  translate(width / 2, height / 2);
  background(bgColor);
  strokeWeight(strokeW);
  stroke(fillColor);

  if (fillMode === "filled") {
    fill(fillColor);
    noStroke();
  } else if (fillMode === "outline") {
    noFill();
    stroke(fillColor);
  } else if (fillMode === "worm") {
    noFill();
    noStroke();
  }

  if (smoothingEnabled) {
    // Blob smoothing with vibration using Perlin noise
    for (let i = 0; i < points.length; i++) {
      let prev = points[(i - 1 + points.length) % points.length];
      let curr = points[i];
      let next = points[(i + 1) % points.length];

      // Smoothing calculation with added vibration using Perlin noise
      let smoothedX = (prev.x + smoothing * curr.x + next.x) / 3 + map(noise(i * 0.1, frameCount * 0.01), 0, 1, -0.1 * amplitude, 0.1 * amplitude);
      let smoothedY = (prev.y + smoothing * curr.y + next.y) / 3 + map(noise(i * 0.1, frameCount * 0.01), 0, 1, -0.1 * amplitude, 0.1 * amplitude);

      curr.x = smoothedX;
      curr.y = smoothedY;
    }
  }

  // Blob drawing
  beginShape();
  for (let i = 0; i < points.length; i++) {
    vertex(points[i].x, points[i].y);
  }
  endShape(CLOSE);

  if (fillMode === "worm") {
    // Draw dots at each point
    strokeWeight(2);
    fill(fillColor);
    stroke(edgeColor);
    for (let i = 0; i < points.length; i++) {
      // Calculate the size of the ellipse based on its position in the array
      let distanceToStart = i; // Distance from the current point to the start of the shape
      let distanceToEnd = points.length - 1 - i; // Distance from the current point to the end of the shape
      let ellipseSize = min(min(distanceToStart + 1, distanceToEnd + 1), strokeW);
      ellipse(points[i].x, points[i].y, ellipseSize, ellipseSize);
    }
  
  }

  // Brush
  if (mouseIsPressed === false) {
    // Vertex attraction or repulsion
    for (let i = 0; i < points.length; i++) {
      let d = dist(mouseX - width / 2, mouseY - height / 2, points[i].x, points[i].y);
      let direction = currentMode === "attract" ? 1 : -1;

      if (d < brushSize) {
        points[i].x += (mouseX - width / 2 - points[i].x) * speed * direction;
        points[i].y += (mouseY - height / 2 - points[i].y) * speed * direction;
      }
    }
  }

  // Brush cursor overlay
  fill(100, 100, 100, 50);
  noStroke();
  circle(mouseX - width / 2, mouseY - height / 2, brushSize * 2); // Outer cursor

  if (mouseIsPressed === true) {
    fill(guiTextColor);
    circle(mouseX - width / 2, mouseY - height / 2, brushSize / 1.6); // Active cursor
  }

  // UI
  if (showUi) {
    strokeWeight(0);
    textSize(16);
    textAlign(LEFT, TOP);
    translate(-width / 2, -height / 2);
    fill(guiTextColor);

    // GUI Text
    text(
      "UGLYPH\nv0.6 26/06/24\n\nEsc Restart\n\[ / ] Brush Size \n- / + Stroke Width\nA Attract / Repulse\nF Fill mode\nI Invert / b&w\nX Explode\nP Save PNG\nG Save GIF\nS Save SVG\nR Recolor\nH Hide UI\nM Stop",
      10,
      10
    );
  }
}

function keyPressed() {
  switch (keyCode) {
    case 65: // 'A'
      toggleAttractionRepulsion();
      break;
    case 49: // '1'
    case 50: // '2'
    case 51: // '3'
    case 52: // '4'
    case 53: // '5'
      setBrushSpeed((keyCode - 48) / 10);
      break;
    case 221: // ']'
      adjustBrushSize(10);
      break;
    case 219: // '['
      if (brushSize > 10) adjustBrushSize(-10);
      break;
    case 189: // '-'
      if (strokeW > 1) adjustStrokeWidth(-10);
      break;
    case 187: // '+'
      adjustStrokeWidth(10);
      break;
    case 80: // 'P'
      savePNG();
      break;
    case 68: // 'D'
     // toggleDots();
     // print(dotsEnabled);
      break;
    case 70: // 'F'
      toggleFillMode();
      break;
    case 72: // 'H'
      toggleTextGUI();
      break;
    case 73: // 'I'
      invertColors(); break;
    case 77: // 'M'
      toggleSmoothing();
      break;
    case 88: // 'X'
      explode(); break;
    case 71: // 'G'
      saveGif('uglyph.gif', 2); break;
    case 83: // 'S'
      copyAndSaveSVG();
      break;
    case 87: // 'W'
      showDots = !showDots;
      break;
    case 82: // 'R'
      recolorBlobAndBackground();
      break;
    case 27: // 'Esc'
      reloadWindow();
      break;
  }
}

function generateShape() {
  for (let i = 0; i < amount; i++) {
    let x = windowWidth / 2;
    let y = windowHeight / 2;
    let angle = map(i, 0, amount, 0, TWO_PI);
    let radius = (blobSize) * noise(noiseScale * i); // Adjust noise scale for irregularity
    x = windowWidth / 2 + radius * cos(angle) - 0.5 * width;
    y = windowHeight / 2 + radius * sin(angle) - 0.5 * height;
    points.push({ x: x, y: y });
  }
}

function toggleSmoothing() {
  smoothingEnabled = !smoothingEnabled;
}

function toggleAttractionRepulsion() {
  currentMode = (currentMode === 'repulse') ? 'attract' : 'repulse';
}

function toggleDots() {
  dotsEnabled = (dotsEnabled === 'true') ? 'false' : 'true';
}

function setBrushSpeed(speedValue) {
  speed = speedValue;
}

function reloadWindow() {
  window.location.reload();
}

function adjustBrushSize(amount) {
  brushSize += amount;
  if (brushSize <= 1) {
    brushSize = 10;
  }
}

function adjustStrokeWidth(amount) {
  strokeW += amount;
  if (strokeW < 1) {
    strokeW = 1;
  }
}

function savePNG() {
  save(createFileName('uglyph', 'png'));
}

function toggleFillMode() {
  if (fillMode === "outline") {
    fillMode = "filled";
  } else if (fillMode === "filled") {
    fillMode = "worm";
  } else {
    fillMode = "outline";
  }
}

function invertColors() {
  guiTextColor = (fillColor === 'white') ? 'grey' : 'white';
  bgColor = (bgColor === 'black') ? 'white' : 'black';
  fillColor = (fillColor === 'white') ? 'black' : 'white';
  cursorColor = 'red';
}

// Function to recolor the blob and background to random colors
function recolorBlobAndBackground() {
  // Random background color
  bgColor = color(random(255), random(255), random(255));
  edgeColor = color(random(255), random(255), random(255));

  // Random fill color for the blob
  fillColor = color(random(255), random(255), random(255));
  // Random stroke color for the blob
  strokeColor = color(random(255), random(255), random(255));
  guiTextColor = 'white';
  cursorColor = 'white';
}

function explode() {
  let centerX = 0;
  let centerY = 0;

  for (let i = 0; i < points.length; i++) {
    points[i].x += random(-explosionForce, explosionForce);
    points[i].y += random(-explosionForce, explosionForce);
    //  points[i].x += (centerX - points[i].x) * 0.1 * speed;
    //  points[i].y += (centerY - points[i].y) * 0.1 * speed;
  }
}

function copyAndSaveSVG() {
  // Copy the shape
  let copiedPoints = [...points];

  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  let svgWidth = windowWidth;
  let svgHeight = windowHeight;
  svg.setAttribute('width', svgWidth);
  svg.setAttribute('height', svgHeight);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.style.display = 'normal';

  // Calculate the center coordinates
  let centerX = svgWidth / 2;
  let centerY = svgHeight / 2;

  // Add background rectangle
  let backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  backgroundRect.setAttribute('width', '100%');
  backgroundRect.setAttribute('height', '100%');
  backgroundRect.setAttribute('fill', bgColor.toString());
  svg.appendChild(backgroundRect);

  // Draw the copied shape in the SVG, centered
  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let d = copiedPoints.map(point => `L${point.x + centerX} ${point.y + centerY}`).join(' ');
  path.setAttribute('d', `M${copiedPoints[0].x + centerX} ${copiedPoints[0].y + centerY} ${d} Z`);

  if (fillMode === "filled") {
    path.setAttribute('fill', fillColor.toString());
    path.setAttribute('stroke', 'none');
  } else if (fillMode === "outline") {
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', fillColor.toString());
    path.setAttribute('stroke-width', strokeW);
  } else if (fillMode === "worm") {
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'none');
  }

  svg.appendChild(path);

  // Draw circles along the path if in "worm" mode
  if (fillMode === "worm") {
    for (let i = 0; i < copiedPoints.length; i++) {
      let distanceToStart = i;
      let distanceToEnd = copiedPoints.length - 1 - i;
      let ellipseSize = Math.min(Math.min(distanceToStart + 1, distanceToEnd + 1), strokeW);

      let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', copiedPoints[i].x + centerX);
      circle.setAttribute('cy', copiedPoints[i].y + centerY);
      circle.setAttribute('r', ellipseSize / 2);
      circle.setAttribute('fill', fillColor.toString());
      circle.setAttribute('stroke', edgeColor.toString());
      circle.setAttribute('stroke-width', 1);
      svg.appendChild(circle);
    }
  }

  // Save the SVG file
  let svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
  saveBlob(svgBlob, createFileName('uglyph', 'svg'));
}

// Helper function to save a Blob
function saveBlob(blob, fileName) {
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

// Function to create a filename with the specified format
function createFileName(prefix, extension) {
  let now = new Date();
  let datePart = `${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}`;
  let timePart = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  return `${prefix}_${datePart}${timePart}.${extension}`;
}



// Helper function to save a Blob
function saveBlob(blob, fileName) {
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

// Function to create a filename with the specified format
function createFileName(prefix, extension) {
  let now = new Date();
  let datePart = `${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}`;
  let timePart = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  return `${prefix}_${datePart}${timePart}.${extension}`;
}

// Function to toggle the visibility of the text GUI
function toggleTextGUI() {
  showUi = !showUi;
}
