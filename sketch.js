// Blob
let points = []; // Array to store blob vertex points
let amount = 1000; // Number of blob points
let blobSize = 600; // Size of the blob
let showDots = false; // Variable to manage dot visibility

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
let currentMode = "attract"; // Current mode for brush interaction ("attract" or "repulse")
let touchRadius = 100; // Size of the tool
let touchForce = 20; // Force of interaction
let smoothing = 1; // Smoothing factor for blob
let explosionForce = 800;

//Mutation
let shouldMutate = true;
let velocities = [];
let mutationSpeed = 50;
let noiseScale = 1;
let smoothingEnabled = true;
let amplitude = 1;
let frequency = 0.001;

// UI
let showUI = true;
let sliders = {};
let buttons = {};
let textOpacity = 255; // Text opacity
let showUi = true; // Flag to show or hide the UI
let guiTextColor = '#bababa';
let uiColor = '#666666';
let sliderPos = 30;
let sliderDist = 45;
let sliderLabelDist = 20;
let buttonPos = 320;
let uiDist = 40;
let currentWidth, currentHeight;


// Video
//let cwidth = currentWidth;
//let cheight = currentHeight;
let button;
let encoder;
const frate = 25 // frame rate;
const numFrames = 500 // num of frames to record;
let recording = false;
let recordedFrames = 0;
let count = 0;
let frameSkip = 1; // Adjust this value to control frame skipping
let frameCounter = 0;

function preload() {
    HME.createH264MP4Encoder().then(enc => {
        encoder = enc;
        encoder.outputFilename = 'uglyph';

        // Maximum width for downscaling

        // Get the dimensions of the canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

      
        encoder.width = canvasWidth;
        encoder.height = canvasHeight;
        encoder.frameRate = frate;
        encoder.kbps = 80000; // video quality
        encoder.groupOfPictures = 10; // lower if you have fast actions.
        encoder.initialize();
    });
}
function setup() {
  
  frameRate(25);
  createCanvas(windowWidth, windowHeight);
  currentWidth = windowWidth;
  currentHeight = windowHeight;
  //strokeW = random (1,60);
  strokeW = 3;
 // amount = random (100,1000)
  amount = 1000;
  fillMode = "outline"; // Default fill mode
  recolor();
  showUI = true;
  createUI();
  //noCursor();
  generateShape();
  
}
function createUI() {
    if (showUI == true) {
    
  let label1 = createP ('UGLYPH v0.71a');
  label1.position(10, -5);
  label1.class('text');
  
  let label2 = createP ('Interaction Radius');
  label2.position(10, sliderPos);
  label2.class('text');

  sliders.touchRadius = createSlider(10, 200, touchRadius);
  sliders.touchRadius.position(10, sliderPos + sliderLabelDist);
  sliders.touchRadius.class('slider');
  sliders.touchRadius.input(() => touchRadius = sliders.touchRadius.value());
  sliderPos += sliderDist;
  
  
  let label5 = createP ('Interaction Force');
  label5.position(10, sliderPos);
  label5.class('text');

  sliders.force = createSlider(20, 200, touchForce);
  sliders.force.position(10, sliderPos + sliderLabelDist);
  sliders.force.class('slider');
  sliders.force.input(() => touchForce = sliders.force.value());
  sliderPos += sliderDist;
  
  let label3 = createP ('Outline');
  label3.position(10, sliderPos);
  label3.class('text');

  sliders.strokeW = createSlider(1, 200, strokeW);
  sliders.strokeW.position(10, sliderPos + sliderLabelDist);
  sliders.strokeW.class('slider');
  sliders.strokeW.input(() => strokeW = sliders.strokeW.value());
  sliderPos += sliderDist;
  
  let label4 = createP ('Complexity');
  label4.position(10, sliderPos);
  label4.class('text');

  sliders.amount = createSlider(100, 1000, amount);
  sliders.amount.position(10, sliderPos + sliderLabelDist);
  sliders.amount.class('slider');
  sliders.amount.input(() => { amount = sliders.amount.value();
                         
  generateShape();
                         
  });
  sliderPos += sliderDist;
  
  
  let label6 = createP ('Mutation Speed');
  label6.position(10, sliderPos);
  label6.class('text');

  sliders.mutationSpeed = createSlider(10, 20, mutationSpeed);
  sliders.mutationSpeed.position(10, sliderPos + sliderLabelDist);
  sliders.mutationSpeed.class('slider');
  sliders.mutationSpeed.input(() => {
    mutationSpeed = sliders.mutationSpeed.value();
    generateShape();
  });
  sliderPos += sliderDist;
  
  

 let label7 = createP ('Size');
  label7.position(10, sliderPos);
  label7.class('text');

  sliders.blobSize = createSlider(300, canvas.width/2, blobSize);
  sliders.blobSize.position(10, sliderPos + sliderLabelDist);
  sliders.blobSize.class('slider');
  sliders.blobSize.input(() => {
    blobSize = sliders.blobSize.value();
    generateShape();
  });
  sliderPos += sliderDist;
  
  
    buttons.restart = createButton(`
    <span class="left-align">↻</span>
    <span class="center-align">Restart</span>
    <span class="right-align">Esc</span>`);
  buttons.restart.position(10,  buttonPos);
  buttons.restart.class('button');
  buttons.restart.mousePressed(reloadWindow);
  buttonPos += uiDist;
  
  
  buttons.pause = createButton(
                                 `
    <span class="left-align">❄</span>
    <span class="center-align">Freeze</span>
    <span class="right-align">Space</span>
  `);
  buttons.pause.position(10,  buttonPos);
  buttons.pause.class('button');
  buttons.pause.mousePressed(toggleSmoothing);
  buttonPos += uiDist;

  buttons.mutation = createButton(`
    <span class="left-align">☣</span>
    <span class="center-align">Mutation</span>
    <span class="right-align">M</span>`);
  buttons.mutation.position(10,buttonPos);
  buttons.mutation.class('button');
  buttons.mutation.mousePressed(toggleMutation);
  buttonPos += uiDist;
  
  buttons.brushMode = createButton(`
    <span class="left-align">±</span>
    <span class="center-align">Attract/Repulse</span>
    <span class="right-align">A</span>`);
  
  buttons.brushMode.position(10, buttonPos);
  buttons.brushMode.class('button');
  buttons.brushMode.mousePressed(toggleAttractionRepulsion);
  buttonPos += uiDist;
  
  buttons.explode = createButton(`
    <span class="left-align">✱</span>
    <span class="center-align">Explode</span>
    <span class="right-align">X</span>`);
  
  buttons.explode.position(10, buttonPos);
  buttons.explode.class('button');
  buttons.explode.mousePressed(explode);
  buttonPos += uiDist;
  
    buttons.changeMode = createButton(`
    <span class="left-align">✧</span>
    <span class="center-align">Change&nbsp;Style</span>
    <span class="right-align">F</span>`);
  
  buttons.changeMode.position(10, buttonPos);
  buttons.changeMode.class('button');
  buttons.changeMode.mousePressed(toggleFillMode);
  buttonPos += uiDist;
  
  buttons.recolor = createButton(`
    <span class="left-align">⸭</span>
    <span class="center-align">Recolor</span>
    <span class="right-align">R</span>`);
  
  buttons.recolor.position(10, buttonPos);
  buttons.recolor.class('button');
  buttons.recolor.mousePressed(recolor);
  buttonPos += uiDist;

  buttons.invertColors = createButton(`
    <span class="left-align">☯</span>
    <span class="center-align">Black&nbsp;&&nbsp;White</span>
    <span class="right-align">I</span>`);
  
  buttons.invertColors.position(10, buttonPos);
  buttons.invertColors.class('button');
  buttons.invertColors.mousePressed(invertColors);
  buttonPos += uiDist;
  
  
  buttons.sPNG = createButton(`
    <span class="center-align">PNG</span>
    `);
  
  buttons.sPNG.position(10,  buttonPos);
  buttons.sPNG.class('smallbutton');
  buttons.sPNG.mousePressed(savePNG);
  
  buttons.sSVG = createButton(`
  <span class="center-align">SVG</span>
  `);
  buttons.sSVG.position(60,  buttonPos);
  buttons.sSVG.class('smallbutton');
  buttons.sSVG.mousePressed(copyAndSaveSVG);
  
  buttons.sGIF = createButton(`
    <span class="center-align">GIF</span>
  `);
  buttons.sGIF.position(110,  buttonPos);
  buttons.sGIF.class('smallbutton');
  buttons.sGIF.mousePressed(recordGIF);
  
  buttons.sMP4 = createButton(`
  <span class="center-align">MP4</span>
`);
  buttons.sMP4.position(160,  buttonPos);
  buttons.sMP4.class('smallbutton');
  buttons.sMP4.mousePressed(() => recording = true)
  
  

  


}

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
function setTouchForce(speedValue) {
  touchForce = speedValue;
}
function adjustTouchRadius(amount) {
  touchRadius += amount;
  if (touchRadius <= 1) {
    touchRadius = 10;
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
      adjustTouchForce((keyCode - 48) / 10);
      break;
    case 221: // ']'
      adjustTouchRadius(10);
      break;
    case 219: // '['
      if (touchRadius > 10) adjustTouchRadius(-10);
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
      toggleMutation();
      //toggleSmoothing();
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
       case 72: // 'H'
      showUI = false;
      break;
    case 82: // 'R'
      recolor();
      break;
    case 27: // 'Esc'
      reloadWindow();
      break;
      case 32: // 'Space'
      toggleSmoothing();
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
    //  points[i].x += (centerX - points[i].x) * 0.1 * touchForce;
    //  points[i].y += (centerY - points[i].y) * 0.1 * touchForce;
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
  saveGif('uglyph.gif', 10,{ notificationDuration: 1 });
}
function recordVideo() {
    // Get the dimensions of the canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Save the current transformation state
    drawingContext.save();

    // Capture the image data from the canvas directly
    let imageData = drawingContext.getImageData(0, 0, canvasWidth, canvasHeight);
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
    strokeWeight(1);
    fill(fillColor);
    stroke(edgeColor);
    for (let i = 0; i < points.length; i++) {
      // Calculate the size of the ellipse based on its position in the array
      let distanceToStart = i; // Distance from the current point to the start of the shape
      let distanceToEnd = points.length - 1 - i; // Distance from the current point to the end of the shape
      let ellipseSize = strokeW;
      ellipse(points[i].x, points[i].y, ellipseSize, ellipseSize);
    }
    
  }
  if (fillMode === "outline") {
    if (showDots == true){
    // Draw dots at each point
    strokeWeight(1);
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
    
  }

  if (mouseIsPressed === false) {
    // Vertex attraction or repulsion
    for (let i = 0; i < points.length; i++) {
      let d = dist(mouseX - width / 2, mouseY - height / 2, points[i].x, points[i].y);
      let direction = currentMode === "attract" ? 1 : -1;

      if (d < touchRadius) {
        points[i].x += (mouseX - width / 2 - points[i].x) * 0.01*touchForce * direction;
        points[i].y += (mouseY - height / 2 - points[i].y) * 0.01*touchForce * direction;
      }
    }
  }  // Brush
  

 
//   fill(255, 255, 255, 255);
//   noStroke();
//   circle(mouseX - width / 2, mouseY - height / 2, 5); // Inner dot
//   fill(100, 100, 100, 75);
//   circle(mouseX - width / 2, mouseY - height / 2,touchRadius * 2); // Outer cursor


//   if (mouseIsPressed === true) {
//     fill(guiTextColor);
//     circle(mouseX - width / 2, mouseY - height / 2, touchRadius / 1.6); // Active cursor
//   }
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
  if (!shouldMutate) return; // Skip mutation logic if toggled off

  for (let i = 0; i < points.length; i++) {
    points[i].x += 0.2*velocities[i].vx;
    points[i].y += 0.2*velocities[i].vy;

    // Check for collisions and change direction
    for (let j = 0; j < points.length; j++) {
      if (i != j) {
        let dx = points[i].x - points[j].x;
        let dy = points[i].y - points[j].y;
        let distance = sqrt(dx * dx + dy * dy);
        if (distance < 2) { // Adjust collision distance as needed
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
function toggleMutation() {
  shouldMutate = !shouldMutate; // Toggle the boolean flag
}
