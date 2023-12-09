// Color scheme
let bgColor; // Background color
let fillColor; // Fill color
let fillMode; // Fill mode ("filled" or "outline")
let strokeW; // Stroke weight (outline thickness)
let cursorStrokeW = 3; // Stroke weight for the cursor
let cursorColor = 'red';

// UI
let textOpacity = 255; // Text opacity
let showUi = true; // Flag to show or hide the UI
let guiTextColor = 'white';

// Blob
let points = []; // Array to store blob vertex points
let amount; // Number of blob points
let blobSize; // Size of the blob

// Modifier
let currentMode = "attract"; // Current mode for brush interaction ("attract" or "repulse")
let brushSize; // Size of the brush
let speed; // Speed of brush interaction
let smoothing; // Smoothing factor for blob

function setup() {
  frameRate(30);
  createCanvas(windowWidth, windowHeight);
  noCursor();
  
  // Initialize colors
  bgColor = color(0); // Set background color to black
  fillColor = color(255); // Set fill color to white
  fill(255); // Set default fill color
  fillMode = "filled"; // Default fill mode
  strokeW = 1; // Default stroke weight (outline thickness)

  // Initialize blob parameters
  amount = 20000; // Number of blob points
  blobSize = 300; // Size of the blob

  // Initialize brush parameters
  brushSize = 40; // Size of the brush
  speed = 0.75; // Speed of brush interaction
  smoothing = 0.0001; // Smoothing factor for blob

  // Blob vertex array generation
  for (let i = 0; i < amount; i++) {
    let angle = map(i, 0, amount / 10, 0, PI);
    let x = blobSize * cos(angle);
    let y = blobSize * sin(angle);
    points.push({ x: x, y: y });
  }
}

function draw() {
  translate(width / 2, height / 2);
  background(bgColor);
  strokeWeight(strokeW);

  // Fill mode check
  if (fillMode === "filled") {
    fill(fillColor);
    stroke(fillColor);
  } else {
    fill(bgColor);
    stroke(fillColor);
  }

  // Blob smoothing
  for (let i = 0; i < points.length; i++) {
    let prev = points[(i - 1 + points.length) % points.length];
    let curr = points[i];
    let next = points[(i + 1) % points.length];

    // Smoothing calculation
    let smoothedX = (prev.x + smoothing * curr.x + next.x) / (2 + smoothing);
    let smoothedY = (prev.y + smoothing * curr.y + next.y) / (2 + smoothing);

    curr.x = smoothedX;
    curr.y = smoothedY;
  }

  // Blob drawing
  beginShape();
  for (let i = 0; i < points.length; i++) {
    vertex(points[i].x, points[i].y);
  }
  endShape(CLOSE);

  // Brush
  if (mouseIsPressed === true) {
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
  noFill();
  stroke(cursorColor);
  strokeWeight(cursorStrokeW);
  circle(mouseX - width / 2, mouseY - height / 2, brushSize * 2); // Outer cursor

  if (mouseIsPressed === true) {
    fill(cursorColor);
    stroke(cursorColor);
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
      "UGLYPH 0.42\n09/12/23\n\n1–5 brush force\n[ / ] brush size\n- / + stroke width\nA attract / repulse\nF fill mode\nI invert / b&w\nX explode\nP save PNG\nG save GIF\nS save SVG (new!)\n? recolor (new!)\n\nR reload\n",
      10,
      10
    );
  }
}

function keyPressed() {
  switch (keyCode) {
    case 72: // 'H'
      toggleTextVisibility();
      break;
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
    case 82: // 'R'
      reloadWindow();
      break;
    case 221: // ']'
      adjustBrushSize(10);
      break;
    case 219: // '['
      if (brushSize > 10) adjustBrushSize(-10);
      break;
    case 189: // '-'
      if (strokeW > 1) adjustStrokeWidth(-2);
      break;
    case 187: // '+'
      adjustStrokeWidth(2);
      break;
    case 80: // 'P'
      savePNG();
      break;
    case 70: // 'F'
      toggleFillMode();
      break;
    case 73: // 'I'
      invertColors();
      break;
    case 88: // 'X'
      explode();
      break;
    case 71: // 'G'
      saveGif('uglyph.gif', 3);
      break;
    case 83: // 'S'
      copyAndSaveSVG();
      break;
    case 191: // '/'
    case 191: // '?'
      recolorBlobAndBackground();
      break;
  }
}

// Clear key control functions
function toggleTextVisibility() {
  textOpacity = (textOpacity === 0) ? 255 : 0;
}

function toggleAttractionRepulsion() {
  currentMode = (currentMode === 'repulse') ? 'attract' : 'repulse';
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
  fillMode = (fillMode === "outline") ? "filled" : "outline";
}

function invertColors() {
  bgColor = (bgColor === 'white') ? 'black' : 'white';
  fillColor = (fillColor === 'black') ? 'white' : 'black';
  guiTextColor = (guiTextColor === 'black') ? 'white' : 'black';
  cursorColor = 'red'
}

// Function to recolor the blob and background to random colors
function recolorBlobAndBackground() {
  // Random background color
  bgColor = color(random(255), random(255), random(255));

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
    points[i].x += random(-blobSize, blobSize);
    points[i].y += random(-blobSize, blobSize);
    points[i].x += (centerX - points[i].x) * 0.1 * speed;
    points[i].y += (centerY - points[i].y) * 0.1 * speed;
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
  path.setAttribute('fill', fillColor.toString());
  svg.appendChild(path);

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

// Function to toggle the visibility of the text GUI
function toggleTextGUI() {
  showUi = !showUi;
}
