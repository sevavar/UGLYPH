// Blob
let points = []; // Array to store blob vertex points
let amount = 2000; // Number of blob points
let blobSize = 300; // Size of the blob
let showDots = true; // Variable to manage dot visibility

// Blob Style
let dotSize = 1;
let dotColor = 'white';
let bgColor; // Background color
let fillColor; // Fill color
let fillMode; // Fill mode ("filled", "outline", "worm")
let strokeW; // Stroke weight (outline thickness)
let cursorStrokeW; // Stroke weight for the cursor
let cursorColor = 'red';
let edgeColor = 'black';

// Modifier
let currentMode = "repulse"; // Current mode for brush interaction ("attract" or "repulse")
let brushSize = 100; // Size of the brush
let speed = 10; // Speed of brush interaction
let smoothing = 1; // Smoothing factor for blob
let explosionForce = 100;

//Mutation
let velocities = [];
let mutationSpeed = 20;
let noiseScale = 0.000001;
let smoothingEnabled = true;
let amplitude = 0.1;
let frequency = 0.001;

// UI
let sliders = {};
let buttons = {};
let textOpacity = 255; // Text opacity
let showUi = true; // Flag to show or hide the UI
let guiTextColor = '#bababa';
let uiColor = '#666666';
let NextButtonPosY = 320;
let uiDist = 45;
let currentWidth, currentHeight;



// Video
//let cwidth = currentWidth;
//let cheight = currentHeight;
let button;
let encoder;
const frate = 25 // frame rate;
const numFrames = 250 // num of frames to record;
let recording = false;
let recordedFrames = 0;
let count = 0;
let frameSkip = 1; // Adjust this value to control frame skipping
let frameCounter = 0;

function preload() {
    HME.createH264MP4Encoder().then(enc => {
        encoder = enc;
        encoder.outputFilename = 'test';

        // Maximum width for downscaling
        const maxWidth = 1080;

        // Get the dimensions of the canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calculate the new dimensions while maintaining aspect ratio
        let newWidth = canvasWidth;
        let newHeight = canvasHeight;

        if (canvasWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = (canvasHeight / canvasWidth) * newWidth;
        }

        encoder.width = newWidth;
        encoder.height = newHeight;
        encoder.frameRate = frate;
        encoder.kbps = 20000; // video quality
        encoder.groupOfPictures = 5; // lower if you have fast actions.
        encoder.initialize();
    });
}
function setup() {
  frameRate(60);
  createCanvas(windowWidth, windowHeight);
  currentWidth = windowWidth;
  currentHeight = windowHeight;
  strokeW = random (1,180)
  amount = random (100,2000)
  noCursor();
  generateShape();
  fillMode = "filled"; // Default fill mode
  // Blob vertex array generation

  recolor();
  createUI();
  
  
}
function createUI() {
  
  
  let label1 = createP ('UGLYPH<br>v0.7a 03/8/24');
  label1.position(10, -5);
  label1.class('text');
  
  let label2 = createP (`
    <span class="left-align">Cursor&nbsp;Radius</span>
    <span class="right-align"></span>
  `);
  label2.position(10, 50);
  label2.class('text');

  sliders.brushSize = createSlider(10, 200, brushSize);
  sliders.brushSize.position(10, 80);
  sliders.brushSize.class('slider');
  sliders.brushSize.input(() => brushSize = sliders.brushSize.value());
  
  
  let label5 = createP ('Cursor Strength');
  label5.position(10, 100);
  label5.class('text');

  sliders.speed = createSlider(5, 30, speed);
  sliders.speed.position(10, 130);
  sliders.speed.class('slider');
  sliders.speed.input(() => speed = sliders.speed.value());
  
  let label3 = createP ('Shape Thickness');
  label3.position(10, 150);
  label3.class('text');

  sliders.strokeW = createSlider(1, 200, strokeW);
  sliders.strokeW.position(10, 180);
  sliders.strokeW.class('slider');
  sliders.strokeW.input(() => strokeW = sliders.strokeW.value());
  
  let label4 = createP ('Shape Complexity');
  label4.position(10, 200);
  label4.class('text');

  sliders.amount = createSlider(100, 2000, amount);
  sliders.amount.position(10, 230);
  sliders.amount.class('slider');
  sliders.amount.input(() => {
    amount = sliders.amount.value();
    generateShape();
  });
  
  
    let label6 = createP ('Mutation Speed');
  label6.position(10, 250);
  label6.class('text');

  sliders.mutationSpeed = createSlider(10, 20, mutationSpeed);
  sliders.mutationSpeed.position(10, 280);
  sliders.mutationSpeed.class('slider');
  sliders.mutationSpeed.input(() => {
    mutationSpeed = sliders.mutationSpeed.value();
    generateShape();
  });
  

  buttons.pause = createButton(
                                 `
    <span class="left-align">⏯</span>
    <span class="center-align">Pause/Play</span>
    <span class="right-align">M</span>
  `);
  buttons.pause.position(10,  NextButtonPosY);
  buttons.pause.class('button');
  buttons.pause.mousePressed(toggleSmoothing);
  NextButtonPosY += uiDist+3;
  
  buttons.changeMode = createButton(`
    <span class="left-align">✎</span>
    <span class="center-align">Change&nbsp;Style</span>
    <span class="right-align">F</span>`);
  
  buttons.changeMode.position(10, NextButtonPosY);
  buttons.changeMode.class('button');
  buttons.changeMode.mousePressed(toggleFillMode);
  NextButtonPosY += uiDist;
  
  buttons.brushMode = createButton(`
    <span class="left-align">±</span>
    <span class="center-align">Push/Pull</span>
    <span class="right-align">A</span>`);
  
  buttons.brushMode.position(10, NextButtonPosY);
  buttons.brushMode.class('button');
  buttons.brushMode.mousePressed(toggleAttractionRepulsion);
  NextButtonPosY += uiDist;
  
  buttons.explode = createButton(`
    <span class="left-align">✶</span>
    <span class="center-align">Explode</span>
    <span class="right-align">X</span>`);
  
  buttons.explode.position(10, NextButtonPosY);
  buttons.explode.class('button');
  buttons.explode.mousePressed(explode);
  NextButtonPosY += uiDist;
  
  buttons.recolor = createButton(`
    <span class="left-align">⛬</span>
    <span class="center-align">Recolor</span>
    <span class="right-align">R</span>`);
  
  buttons.recolor.position(10, NextButtonPosY);
  buttons.recolor.class('button');
  buttons.recolor.mousePressed(recolor);
  NextButtonPosY += uiDist;

  buttons.invertColors = createButton(`
    <span class="left-align">◐</span>
    <span class="center-align">Black&nbsp;&&nbsp;White</span>
    <span class="right-align">I</span>`);
  
  buttons.invertColors.position(10, NextButtonPosY);
  buttons.invertColors.class('button');
  buttons.invertColors.mousePressed(invertColors);
  NextButtonPosY += uiDist;
  
  
  buttons.sPNG = createButton(`
    <span class="left-align">⭳</span>
    <span class="center-align">Save&nbsp;PNG</span>
    <span class="right-align">P</span>`);
  
  buttons.sPNG.position(10,  NextButtonPosY);
  buttons.sPNG.class('button');
  buttons.sPNG.mousePressed(savePNG);
  NextButtonPosY += uiDist;
  
  buttons.sSVG = createButton(`
    <span class="left-align">⭳</span>
    <span class="center-align">Save&nbsp;SVG</span>
    <span class="right-align">S</span>`);
  buttons.sSVG.position(10,  NextButtonPosY);
  buttons.sSVG.class('button');
  buttons.sSVG.mousePressed(copyAndSaveSVG);
  NextButtonPosY += uiDist;
  
  buttons.sGIF = createButton(`
    <span class="left-align">⭳</span>
    <span class="center-align">Save&nbsp;GIF</span>
    <span class="right-align">G</span>`);
  buttons.sGIF.position(10,  NextButtonPosY);
  buttons.sGIF.class('button');
  buttons.sGIF.mousePressed(recordGIF);
  NextButtonPosY += uiDist;
  
  buttons.sMP4 = createButton(`
    <span class="left-align">⭳</span>
    <span class="center-align">Save&nbsp;MP4</span>
    <span class="right-align">V</span>`);
  buttons.sMP4.position(10,  NextButtonPosY);
  buttons.sMP4.class('button');
  buttons.sMP4.mousePressed(() => recording = true)
  NextButtonPosY += uiDist;
  
  
  buttons.reload = createButton(`
    <span class="left-align">⭯</span>
    <span class="center-align">Reload</span>
    <span class="right-align">Esc</span>`);
  buttons.reload.position(10,  NextButtonPosY);
  buttons.reload.class('button');
  buttons.reload.mousePressed(reloadWindow);
  NextButtonPosY += uiDist;

}

function generateShape() {
  points = [];
  velocities = [];
  for (let i = 0; i < amount; i++) {
    let x = windowWidth / 2;
    let y = windowHeight / 2;
    let angle = map(i, 0, amount, 0, TWO_PI);
    let radius = (blobSize) * noise(noiseScale * i);
    x = windowWidth / 2 + radius * cos(angle) - 0.5 * width;
    y = windowHeight / 2 + radius * sin(angle) - 0.5 * height;
    points.push({ x: x, y: y });
    velocities.push({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) });
  }
}
function setBrushSpeed(speedValue) {
  speed = speedValue;
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

function windowResized() {
  currentWidth = windowWidth;
  currentHeight = windowHeight;
  resizeCanvas(currentWidth, currentHeight);
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
      if (strokeW > 2.5) adjustStrokeWidth(-2.5);
      break;
    case 187: // '+'
      adjustStrokeWidth(2.5);
      break;
    case 80: // 'P'
      savePNG();
      break;
    case 68: // 'D'
     //toggleDots();
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
      recordGIF(); break;
    case 83: // 'S'
      copyAndSaveSVG();
      break;
      case 86: //'V'
      recording = true;
      break;
    case 87: // 'W'
      showDots = !showDots;
      break;
    case 82: // 'R'
      recolor();
      break;
    case 27: // 'Esc'
      reloadWindow();
      break;
  }
}
function toggleSmoothing() {
  smoothingEnabled = !smoothingEnabled;
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
function toggleAttractionRepulsion() {
  currentMode = (currentMode === 'repulse') ? 'attract' : 'repulse';
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
function recolor() {
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
function invertColors() {
  guiTextColor = (fillColor === 'white') ? 'grey' : 'white';
  bgColor = (bgColor === 'black') ? 'white' : 'black';
  fillColor = (fillColor === 'white') ? 'black' : 'white';
  cursorColor = 'red';
}
function savePNG() {
  save(createFileName('uglyph', 'png'));
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

  // Convert color to RGB string
  function colorToString(c) {
    return `rgb(${red(c)},${green(c)},${blue(c)})`;
  }

  // Add background rectangle
  let backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  backgroundRect.setAttribute('width', '100%');
  backgroundRect.setAttribute('height', '100%');
  backgroundRect.setAttribute('fill', colorToString(bgColor));
  svg.appendChild(backgroundRect);

  // Draw the copied shape in the SVG, centered
  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let d = copiedPoints.map(point => `L${point.x + centerX} ${point.y + centerY}`).join(' ');
  path.setAttribute('d', `M${copiedPoints[0].x + centerX} ${copiedPoints[0].y + centerY} ${d} Z`);

  if (fillMode === "filled") {
    path.setAttribute('fill', colorToString(fillColor));
    path.setAttribute('stroke', 'none');
  } else if (fillMode === "outline") {
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', colorToString(fillColor));
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
      circle.setAttribute('fill', colorToString(fillColor));
      circle.setAttribute('stroke', colorToString(edgeColor));
      circle.setAttribute('stroke-width', 1);
      svg.appendChild(circle);
    }
  }
  
  
    if (fillMode === "outline") {
    for (let i = 0; i < copiedPoints.length; i++) {
      let distanceToStart = i;
      let distanceToEnd = copiedPoints.length - 1 - i;
      let ellipseSize = Math.min(Math.min(distanceToStart + 1, distanceToEnd + 1), strokeW);

      let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', copiedPoints[i].x + centerX);
      circle.setAttribute('cy', copiedPoints[i].y + centerY);
      circle.setAttribute('r', 1);
      circle.setAttribute('fill', colorToString(fillColor));
      circle.setAttribute('stroke', colorToString(edgeColor));
      circle.setAttribute('stroke-width', 2);
      svg.appendChild(circle);
    }
  }

  // Save the SVG file
  let svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
  saveBlob(svgBlob, createFileName('uglyph', 'svg'));
}
function recordGIF() {
  saveGif('uglyph.gif', 2,{ notificationDuration: 1 });
}
function recordVideo() {
    // Get the dimensions of the canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Maximum width for downscaling
    const maxWidth = 1080;

    // Calculate the new dimensions while maintaining aspect ratio
    let newWidth = canvasWidth;
    let newHeight = canvasHeight;

    if (canvasWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = (canvasHeight / canvasWidth) * newWidth;
    }

    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    // Save the current transformation state
    drawingContext.save();

    // Clear the temporary canvas
    tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the current canvas onto the temporary canvas with scaling
    tempContext.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, newWidth, newHeight);

    // Capture the resized image data from the temporary canvas
    let imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    encoder.addFrameRgba(imageData.data);

    // Restore the previous transformation state
    drawingContext.restore();

    recordedFrames++;
}
function saveBlob(blob, fileName) {
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}
function createFileName(prefix, extension){
  let now = new Date();
  let datePart = `${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}`;
  let timePart = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  return `${prefix}_${datePart}${timePart}.${extension}`;
}
function reloadWindow() {
  window.location.reload();
}

function toggleDots() {
  dotsEnabled = (dotsEnabled === 'true') ? 'false' : 'true';
}

function draw() {
  translate(width / 2, height / 2);
  background(bgColor);
  strokeWeight(strokeW);
  stroke(fillColor);

  if (fillMode === "filled") {
    fill(fillColor);
    noStroke();
  }
  else if (fillMode === "outline") {
    noFill();
    stroke(fillColor);
  }
  else if (fillMode === "worm") {
    noFill();
    noStroke();
  }

  if (smoothingEnabled) {
    mutation();
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

  // Blob outline smoothing
  beginShape();
  for (let i = 0; i < points.length; i++) {
    curveVertex(points[i].x, points[i].y);
  }
  // Close the shape by connecting the last point to the first
  curveVertex(points[0].x, points[0].y);
  curveVertex(points[1].x, points[1].y);
  endShape(CLOSE);


  if (fillMode === "worm") {
    strokeWeight(2);
    fill(fillColor);
    stroke(edgeColor);
    for (let i = 0; i < points.length; i++) {
      // Calculate the size of the ellipse based on its position in the array
      let distanceToStart = i; // Distance from the current point to the start of the shape
      let distanceToEnd = points.length - 1 - i; // Distance from the current point to the end of the shape
      let ellipseSize = min(min(distanceToStart + 1, distanceToEnd + 1), strokeW*2);
      ellipse(points[i].x, points[i].y, ellipseSize, ellipseSize);
    }
    
  }
  if (fillMode === "outline") {
    // Draw dots at each point
    strokeWeight(2);
    fill(fillColor);
    stroke(edgeColor);
    for (let i = 0; i < points.length; i++) {
      // Calculate the size of the ellipse based on its position in the array
      let distanceToStart = i; // Distance from the current point to the start of the shape
      let distanceToEnd = points.length - 1 - i; // Distance from the current point to the end of the shape
      let ellipseSize = min(min(distanceToStart + 1, distanceToEnd + 1), 2);
      ellipse(points[i].x, points[i].y, ellipseSize, ellipseSize);
    }
    
  }

  if (mouseIsPressed === false) {
    // Vertex attraction or repulsion
    for (let i = 0; i < points.length; i++) {
      let d = dist(mouseX - width / 2, mouseY - height / 2, points[i].x, points[i].y);
      let direction = currentMode === "attract" ? 1 : -1;

      if (d < brushSize) {
        points[i].x += (mouseX - width / 2 - points[i].x) * 0.01*speed * direction;
        points[i].y += (mouseY - height / 2 - points[i].y) * 0.01*speed * direction;
      }
    }
  }  // Brush
  

 
  fill(255, 255, 255, 255);
  noStroke();
  circle(mouseX - width / 2, mouseY - height / 2, 5); // Inner dot
  fill(100, 100, 100, 75);
  circle(mouseX - width / 2, mouseY - height / 2, brushSize * 2); // Outer cursor


  if (mouseIsPressed === true) {
    fill(guiTextColor);
    circle(mouseX - width / 2, mouseY - height / 2, brushSize / 1.6); // Active cursor
  }
  if (bgColor === 'white') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } // Switch black / white text
  else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  }
  
  
  if (recording) {
    console.log('recording');
    recordVideo();
}

// Finalize encoding and export as mp4
if (recordedFrames === numFrames) {
    recording = false;
    recordedFrames = 0;
    console.log('recording stopped');

    encoder.finalize();
    const uint8Array = encoder.FS.readFile(encoder.outputFilename);
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([uint8Array], { type: 'video/mp4' }));
    anchor.download = encoder.outputFilename;
    anchor.click();
    encoder.delete();

    preload(); // reinitialize encoder
}


}
function mutation() {
  for (let i = 0; i < points.length; i++) {
    points[i].x += velocities[i].vx;
    points[i].y += velocities[i].vy;

    // Check for collisions and change direction
    for (let j = 0; j < points.length; j++) {
      if (i != j) {
        let dx = points[i].x - points[j].x;
        let dy = points[i].y - points[j].y;
        let distance = sqrt(dx * dx + dy * dy);
        if (distance < 10) { // Adjust collision distance as needed
          velocities[i].vx *= -1;
          velocities[i].vy *= -1;
          velocities[j].vx *= -1;
          velocities[j].vy *= -1;
        }
      }
    }

    // Keep points within canvas bounds
    if (points[i].x < -width/2 || points[i].x > width/2) {
      velocities[i].vx *= -1;
    }
    if (points[i].y < -height/2 || points[i].y > height/2) {
      velocities[i].vy *= -1;
    }
  }
}
