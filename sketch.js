// Blob
let points = []; // Array to store blob vertex points
let amount = 1000; // Number of blob points
let blobSize = 500; // Size of the blob
let hideDots = true; // Variable to manage dot visibility
let spiky = false;
let bpm = 30;  // Set your BPM here
let framesPerBeat;


// Blob Style
let dotSize = 1;
let dotColor = 'white';
let bgColor; // Background color
let fillColor; // Fill color
let fillMode; // Fill mode ("filled", "outline", "worm")
let strokeW = 1; // Stroke weight (outline thickness)
let cursorStrokeW; // Stroke weight for the cursor
let cursorColor = 'red';
let edgeColor = 'black';

// Modifier
let currentMode = "attract"; // Current mode for brush interaction ("attract" or "repulse")
let touchRadius = 100; // Size of the tool
let touchForce = 10; // Force of interaction
let smoothing = 1; // Smoothing factor for blob
let explosionForce = 400;


//Mutation
let shouldMutate = true;
let prevShouldMutate = null;
let smoothingEnabled = true;
let velocities = [];
let mutationSpeed = 20;
let noiseScale = 0.025;
let amplitude = 1;
let frequency = 10;
let reactionDistance = 2;

// UI

let uiContainer;
let canvasContainer;
let showUI = true;
let sliders = {};
let buttons = {};
let elementY = 30;
let sliderLabelDist = 15;
let sliderDist = 40;
let buttonDist = 35;
let currentWidth, currentHeight;


// Video

let button;
let encoder;
const frate = 30 // frame rate;
const numFrames = 300 // num of frames to record;
let recording = false;
let recordedFrames = 0;
let count = 0;
let frameSkip = 1; // Adjust this value to control frame skipping
let frameCounter = 0;


//  GIF
let gifDuration = 100;

function preload() {
    HME.createH264MP4Encoder().then(enc => {
        encoder = enc;
        encoder.outputFilename = 'uglyph';

        // Maximum width for downscaling

        // Get the dimensions of the canvas
        var canvasWidth = canvas.width;
        var canvasHeight = canvas.height;

      
        encoder.width = canvasWidth;
        encoder.height = canvasHeight;
        encoder.frameRate = frate;
        encoder.kbps = 80000; // video quality
        encoder.groupOfPictures = 10; // lower if you have fast actions.
        encoder.initialize();
    });
}


function createUI() {
  if (showUI == true) {
           
  let uiContainer = select('#ui-container');
     
  let label1 = createP ('UGLYPH v0.8');
  label1.position(10, 0);
  label1.class('text');
  label1.parent(uiContainer);
    
  // let labelInfo = createP ('Mutational Design Tool');
  // labelInfo.position(10, 15);
  // labelInfo.class('text');
  // labelInfo.parent(uiContainer);
  
  let section1 = createP ('GENERATION');
  section1.position(10, elementY);
  section1.class('sectionName');
  elementY += 20;
  section1.parent(uiContainer);  

// Create a label with left and right aligned text using flexbox
let label4 = createP(`
  <span class="label-left">Vertices</span>
  <span class="label-right">${amount}</span>
`);
label4.position(10, elementY);
label4.class('text label-container');
label4.parent(uiContainer);

// Create the amount slider
sliders.amount = createSlider(100, 2000, amount);
sliders.amount.position(10, elementY + sliderLabelDist);
sliders.amount.class('slider');
sliders.amount.input(() => {
  amount = sliders.amount.value();
  label4.html(`
    <span class="label-left">Vertices</span>
    <span class="label-right">${amount}</span>
  `); // Update the displayed amount
  generateShape();                       
});

elementY += sliderDist;
sliders.amount.parent(uiContainer);
    
let label7 = createP(`
  <span class="label-left">Size</span>
  <span class="label-right">${blobSize}</span>
`);
label7.position(10, elementY);
label7.class('text label-container');
label7.parent(uiContainer);

// Create the size slider
sliders.size = createSlider(0, 1000, blobSize);
sliders.size.position(10, elementY + sliderLabelDist);
sliders.size.class('slider');
sliders.size.input(() => {
  blobSize = sliders.size.value();
  label7.html(`
    <span class="label-left">Size</span>
    <span class="label-right">${blobSize}</span>
  `); // Update the displayed amount
  generateShape();                       
});

elementY += sliderDist;
sliders.amount.parent(uiContainer);
  
  elementY += 10;  
  let section2 = createP ('MUTATION');
  section2.position(10, elementY);
  section2.class('sectionName');
  elementY += 20;
  section2.parent(uiContainer);
    
    
    buttons.mutation = createButton(`
    <span class="left-align">■</span>
    <span class="center-align">Stop</span>
    <span class="right-align">M</span>`);
  buttons.mutation.position(10,elementY);
  buttons.mutation.class('button');
  buttons.mutation.mousePressed(toggleMutation);
  elementY += buttonDist;
  
  buttons.freeze = createButton(`
    <span class="left-align">❄</span>
    <span class="center-align">Freeze</span>
    <span class="right-align">Space</span>`);
  buttons.freeze.position(10,  elementY);
  buttons.freeze.class('button');
  buttons.freeze.mousePressed(toggleSmoothing);
  elementY += buttonDist;
  buttons.freeze.parent(uiContainer);
  buttons.reset = createButton(`
  <span class="left-align">↻</span>
  <span class="center-align">Reset</span>
  <span class="right-align">Esc</span>`);
  buttons.reset.position(10,  elementY);
  buttons.reset.class('button');
  buttons.reset.mousePressed(reloadWindow);
  elementY += buttonDist;
  buttons.reset.parent(uiContainer);
  elementY += 10;
 

  let label6 = createP(`
  <span class="label-left">Speed</span>
  <span class="label-right">${mutationSpeed}</span>
`);
label6.position(10, elementY);
label6.class('text label-container');
label6.parent(uiContainer);

// Create the speed slider

  sliders.mutationSpeed = createSlider(0, 50, mutationSpeed);
  sliders.mutationSpeed.position(10, elementY + sliderLabelDist);
  sliders.mutationSpeed.class('slider');
  sliders.mutationSpeed.input(() => {
    mutationSpeed = sliders.mutationSpeed.value();
    
  label6.html(`
    <span class="label-left">Speed</span>
    <span class="label-right">${mutationSpeed}</span>
  `); // Update the displayed amount
    generateShape();
  });
  elementY += sliderDist;
  sliders.mutationSpeed.parent(uiContainer);
    
    
let label9 = createP(`
  <span class="label-left">Tension</span>
  <span class="label-right">${reactionDistance}</span>
`);
label9.position(10, elementY);
label9.class('text label-container');
label9.parent(uiContainer);

sliders.reactionDistance = createSlider(0, 10, reactionDistance);
sliders.reactionDistance.position(10, elementY + sliderLabelDist);
sliders.reactionDistance.class('slider');

// Update label and value when the slider is moved
sliders.reactionDistance.input(() => {
  reactionDistance = sliders.reactionDistance.value();

  // Update the label with the new value of reactionDistance
  label9.html(`
    <span class="label-left">Tension</span>
    <span class="label-right">${reactionDistance}</span>
  `);

});

sliders.reactionDistance.parent(uiContainer);

elementY += sliderDist;
elementY += 10;
 
  let section3 = createP ('INTERACTION');
  section3.position(10, elementY);
  section3.class('sectionName');
  elementY += 20;
  section3.parent(uiContainer);

    
  // Create Attract button
buttons.attractButton = createButton(`
 <span class="center-align">>•< Attract</span>`);
buttons.attractButton.position(10, elementY);
buttons.attractButton.class('mediumbutton');
buttons.attractButton.mousePressed(() => setBrushMode('attract'));

    
// Create Repulse button
buttons.repulseButton = createButton(`
  
  <span class="center-align"><•> Repulse</span>
  `);
buttons.repulseButton.position(110, elementY);
buttons.repulseButton.class('mediumbutton');
buttons.repulseButton.mousePressed(() => setBrushMode('repulse'));

// Attach buttons to parent container
buttons.attractButton.parent(uiContainer);
buttons.repulseButton.parent(uiContainer);
    // Adjust positioning for the Repulse button
elementY += buttonDist; 

  buttons.explode = createButton(`
  <span class="left-align">✱</span>
  <span class="center-align">Explode</span>
  <span class="right-align">X</span>`);
  
  buttons.explode.position(10, elementY);
  buttons.explode.class('button');
  buttons.explode.mousePressed(explode);
  buttons.explode.parent(uiContainer);  
  elementY += buttonDist;
  elementY += 10;
    
  let label2 = createP(`
  <span class="label-left">Cursor Radius</span>
  <span class="label-right">${touchRadius}</span>
`);
label2.position(10, elementY);
label2.class('text label-container');
label2.parent(uiContainer);

sliders.touchRadius = createSlider(10, 200, touchRadius);
sliders.touchRadius.position(10, elementY + sliderLabelDist);
sliders.touchRadius.class('slider');

// Update label and value when the slider is moved
sliders.touchRadius.input(() => {
  touchRadius = sliders.touchRadius.value();

  // Update the label with the new value of reactionDistance
  label2.html(`
    <span class="label-left">Cursor Radius</span>
    <span class="label-right">${touchRadius}</span>
  `);

});

sliders.touchRadius.parent(uiContainer);

elementY += sliderDist;  
    
    let label5 = createP(`
  <span class="label-left">Cursor Force</span>
  <span class="label-right">${touchForce}</span>
`);
label5.position(10, elementY);
label5.class('text label-container');
label5.parent(uiContainer);

sliders.touchForce = createSlider(20, 200, touchForce);
sliders.touchForce.position(10, elementY + sliderLabelDist);
sliders.touchForce.class('slider');

// Update label and value when the slider is moved
sliders.touchForce.input(() => {
  touchForce = sliders.touchForce.value();

  // Update the label with the new value of CursorForce
  label5.html(`
    <span class="label-left">Cursor Force</span>
    <span class="label-right">${touchForce}</span>
  `);

});
    
  sliders.touchForce.parent(uiContainer);
  
  elementY += sliderDist; 
  
  let label8 = createP (`
  <span class="label-left">Explosion Force</span>
  <span class="label-right">${explosionForce}</span>
`);
  label8.position(10, elementY);
  label8.class('text label-container');
  label8.parent(uiContainer);

  sliders.explosionForce = createSlider(1, 400, explosionForce);
  sliders.explosionForce.position(10, elementY + sliderLabelDist);
  sliders.explosionForce.class('slider');
  sliders.explosionForce.input(() => {
    explosionForce = sliders.explosionForce.value();
     label8.html(`
    <span class="label-left">Explosion Force</span>
    <span class="label-right">${explosionForce}</span>
  `);
  });
  elementY += sliderDist;
  sliders.explosionForce.parent(uiContainer); 

  elementY += 10;  
  let section4 = createP ('APPEARANCE');
  section4.position(10, elementY);
  section4.class('sectionName');

  section4.parent(uiContainer);  
  elementY += 20;
    
    
    

    
//     let label9 = createP ('BPM');
//   label9.position(10, elementY);
//   label9.class('text');
//   label9.parent(uiContainer);

//   sliders.bpm = createSlider(10, 100, bpm);
//   sliders.bpm.position(10, elementY + sliderLabelDist);
//   sliders.bpm.class('slider');
//   sliders.bpm.input(() => {
//     bpm = sliders.bpm.value();
//   });
//   elementY += sliderDist;
//   sliders.blobSize.parent(uiContainer);  
    
    
    buttons.switchStyle = createButton(`
    <span class="left-align">✧</span>
    <span class="center-align">Switch Style</span>
    <span class="right-align">F</span>`);
  
  buttons.switchStyle.position(10, elementY);
  buttons.switchStyle.class('button');
  buttons.switchStyle.mousePressed(toggleFillMode);
  elementY += buttonDist;
  buttons.switchStyle.parent(uiContainer);
 
    
  buttons.spikes = createButton(`
    <span class="left-align">★</span>
    <span class="center-align">Show Spikes</span>
    <span class="right-align">B</span>`);
  
  buttons.spikes.position(10, elementY);
  buttons.spikes.class('button');
  buttons.spikes.mousePressed(toggleShapeType);
  elementY += buttonDist;
  buttons.spikes.parent(uiContainer);
  
  buttons.recolor = createButton(`
    <span class="left-align"> ? </span>
    <span class="center-align">Randomize Colors</span>
    <span class="right-align">R</span>`);
  
  buttons.recolor.position(10, elementY);
  buttons.recolor.class('button');
  buttons.recolor.mousePressed(recolor);
  elementY += buttonDist;
  buttons.recolor.parent(uiContainer);

  buttons.invertColors = createButton(`
    <span class="left-align">☯</span>
    <span class="center-align">Black & White</span>
    <span class="right-align">I</span>`);
  
  buttons.invertColors.position(10, elementY);
  buttons.invertColors.class('button');
  buttons.invertColors.mousePressed(invertColors);
  elementY += buttonDist;
  buttons.invertColors.parent(uiContainer);
  
     
  
  let label3 = createP (`
  <span class="label-left">Outline Stroke</span>
  <span class="label-right">${strokeW}</span>
`);
  elementY += 10;
  label3.position(10, elementY);
  label3.class('text label-container');
  label3.parent(uiContainer);    

  sliders.strokeW = createSlider(1, 200, strokeW);
  sliders.strokeW.position(10, elementY + sliderLabelDist);
  sliders.strokeW.class('slider');
  sliders.strokeW.input(() => {
  strokeW = sliders.strokeW.value();
  label3.html(`
    <span class="label-left">Outline Stroke</span>
    <span class="label-right">${strokeW}</span>
  `);
  elementY += sliderDist;
  sliders.strokeW.parent(uiContainer);
  });
  elementY += buttonDist;

  elementY += 20;  
  let section5 = createP ('EXPORT');
  section5.position(10, elementY);
  section5.class('sectionName');
  elementY += 20;
  section5.parent(uiContainer); 
  
  buttons.sPNG = createButton(`
    <span class="center-align">.png</span>
    `);
  
  buttons.sPNG.position(10, elementY);
  buttons.sPNG.class('smallbutton');
  buttons.sPNG.mousePressed(savePNG);
  buttons.sPNG.parent(uiContainer);
  
  buttons.sSVG = createButton(`
  <span class="center-align">.svg</span>
  `);
  buttons.sSVG.position(61,  elementY);
  buttons.sSVG.class('smallbutton');
  buttons.sSVG.mousePressed(copyAndSaveSVG);
  buttons.sSVG.parent(uiContainer);
  
  buttons.sGIF = createButton(`
    <span class="center-align">.gif</span>
  `);
  buttons.sGIF.position(112,  elementY);
  buttons.sGIF.class('smallbutton');
  buttons.sGIF.mousePressed(recordGIF);
  buttons.sGIF.parent(uiContainer);
  
  buttons.sMP4 = createButton(`
  <span class="center-align">.mp4</span>
`);
  buttons.sMP4.position(163,  elementY);
  buttons.sMP4.class('smallbutton');
  buttons.sMP4.mousePressed(() => recording = true)
  buttons.sMP4.parent(uiContainer);
elementY += buttonDist;

elementY += 20;  
let section6 = createP ('IMPORT');
section6.position(10, elementY);
section6.class('sectionName');
section6.parent(uiContainer); 
elementY += 20;

let importText = createP('Drag .svg UGLYPH to the canvas');
importText.position(10, elementY);
importText.class('text');
importText.parent(uiContainer);


}


  
//   let labelCredits = createP ('<a href = "https://www.instagram.com/uglyph.xyz" target="blank">@uglyph.xyz</a>');
//   labelCredits.position(10, buttonPos+50);
//   labelCredits.class('text');
//   labelCredits.parent(uiContainer);
  
//   let labelCredits2 = createP ('<a href = "https://www.instagram.com/sevavar" target="blank">@sevavar</a>');
//   labelCredits2.position(10, buttonPos+65);
//   labelCredits2.class('text');
//   labelCredits2.parent(uiContainer);


  
}
function setup() {

    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(windowWidth - 220, windowHeight);  // Adjust the width to exclude the UI column
    canvas.parent(canvasContainer);
    canvas.drop(handleFileDrop); // Allow SVG file to be dropped on canvas


    frameRate(60);
    framesPerBeat = (60 / bpm) * frameRate();  // Calculate frames per beat
    currentWidth = windowWidth;
    currentHeight = windowHeight;
    fillMode = "outline"; // Default fill mode
    recolor();
    showUI = true;
    createUI();
    generateShape();
    invertColors();
  

// Initial call to set the right button states based on the default mode
  if (buttons.attractButton && buttons.repulseButton) {
    updateButtonStates(); // Call this only after buttons are created
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
    x = windowWidth / 2 + radius * cos(angle) - 0.5 *(currentWidth);
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
  resizeCanvas(currentWidth-220, currentHeight);
}
function keyPressed() {
  switch (keyCode) {
    case 65: // 'A'
      toggleAttractionRepulsion();
      break;
      case 66: // 'B'
      toggleShapeType();
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
    //case 72: // 'H'
      //toggleTextGUI();
      //break;
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
    case 72: // 'H'
      hideDots = !hideDots;
      break;
       case 72: // 'H'
      //showUI = false;
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
  saveGif('uglyph.gif', gifDuration,{ units: 'frames', notificationDuration: 1, notificationID: 'customProgressBar' });
  
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
  generateShape();
  //window.reload();
  //window.location.reload();
}
function toggleDots() {
  dotsEnabled = (dotsEnabled === 'true') ? 'false' : 'true';
}
function draw(){
  
  
  
 // {
  // console.log(framesPerBeat);
  //     if (frameCount % (bpm) === 0) {
  //   explode();
  //       //console.log('Boom!');
  //       console.log(framesPerBeat);

  //}
     
  
  
   if (shouldMutate !== prevShouldMutate) {
    buttons.mutation.html(`
      <span class="left-align">${shouldMutate ? '■' : '▶'}</span>
      <span class="center-align">${shouldMutate ? 'Stop' : 'Start'}</span>
      <span class="right-align">M</span>`);
    
    prevShouldMutate = shouldMutate; // Update the previous state
  }
  
  if (smoothingEnabled === true) {
    buttons.freeze.html(`
    <span class="left-align">❄</span>
    <span class="center-align">Freeze</span>
    <span class="right-align">Space</span>
      
      `);
    
  }
  else {
    
    buttons.freeze.html(` 
    <span class="left-align">❄</span>
    <span class="center-align">Unfreeze</span>
    <span class="right-align">Space</span>
      `);
  }
  
  
  if (spiky === true){
    buttons.spikes.html(`
    <span class="left-align">★</span>
    <span class="center-align">Hide Spikes</span>
    <span class="right-align">B</span>
`);
  }
  else {
    buttons.spikes.html(`
  <span class="left-align">★</span>
  <span class="center-align">Show Spikes</span>
  <span class="right-align">B</span> `)
}
  
  translate(width / 2, height / 2);
  background(bgColor);
  strokeWeight(strokeW);
  stroke(fillColor);

  
  if (fillMode === "filled") {
    fill(fillColor);
    stroke(fillColor);
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
//     for (let i = 0; i < points.length; i++) {
//       let prev = points[(i - 1 + points.length) % points.length];
//       let curr = points[i];
//       let next = points[(i + 1) % points.length];

//       // Smoothing calculation with added vibration using Perlin noise
//       let smoothedX = (prev.x + smoothing * curr.x + next.x) / 3 + map(noise(i * 0.1, frameCount * 0.01), 0, 1, -0.1 * amplitude, 0.1 * amplitude);
//       let smoothedY = (prev.y + smoothing * curr.y + next.y) / 3 + map(noise(i * 0.1, frameCount * 0.01), 0, 1, -0.1 * amplitude, 0.1 * amplitude);

      
      
          for (let i = 0; i < points.length; i++) {
    let prev = points[(i - 1 + points.length) % points.length];
    let curr = points[i];
    let next = points[(i + 1) % points.length];

    let smoothedX = (prev.x + smoothing * curr.x + next.x) / (2 + 1 * smoothing);
    let smoothedY = (prev.y + smoothing * curr.y + next.y) / (2 + 1 * smoothing);

    curr.x = smoothedX;
    curr.y = smoothedY;
    }
    
  }

  // Blob outline smoothing
  beginShape();
  if (spiky == false) {
  for (let i = 0; i < points.length; i++) {
    curveVertex(points[i].x, points[i].y);
  }
  // Close the shape by connecting the last point to the first
 curveVertex(points[0].x, points[0].y);
 curveVertex(points[1].x, points[1].y);
  }
  else {
     beginShape();
  for (let i = 0; i < points.length; i++) {
    vertex(points[i].x, points[i].y);
  }
  }
  
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
  if (fillMode === "outline" || fillMode === "filled") {
    if (hideDots === false){
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

  if (mouseIsPressed === true) {
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
  

 
  fill(255, 255, 255, 255);
  noStroke();
  //circle(mouseX - width / 2, mouseY - height / 2, 5); // Inner dot
  fill(100, 100, 100, 75);
  circle(mouseX - width / 2, mouseY - height / 2,touchRadius * 2); // Outer cursor


  if (mouseIsPressed === true) {
    fill(guiTextColor);
    circle(mouseX - width / 2, mouseY - height / 2, touchRadius / 1.6); // Active cursor
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
        if (distance < reactionDistance) { // Adjust collision distance as needed
          velocities[i].vx *= -1;
          velocities[i].vy *= -1;
          velocities[j].vx *= -1;
          velocities[j].vy *= -1;
        }
      }
    }

    // Keep points within canvas bounds
    if (points[i].x < -width/2+(strokeW/2) || points[i].x > width/2-(strokeW/2)) {
      velocities[i].vx *= -1;
    }
    if (points[i].y < -height/2+(strokeW/2) || points[i].y > height/2-(strokeW/2)) {
      velocities[i].vy *= -1;
    }
  }
}
function toggleMutation() {
  shouldMutate = !shouldMutate; // Toggle the boolean flag
}
function toggleShapeType() {
spiky = !spiky;
}
function setBrushMode(mode) {
  currentMode = mode;
  updateButtonStates();
}
function updateButtonStates() {
  if (currentMode === 'attract') {
    buttons.attractButton.addClass('active');   // Add 'active' class to Attract button
    buttons.repulseButton.removeClass('active'); // Remove 'active' class from Repulse button
  } else if (currentMode === 'repulse') {
    buttons.repulseButton.addClass('active');   // Add 'active' class to Repulse button
    buttons.attractButton.removeClass('active'); // Remove 'active' class from Attract button
  }
}

function handleFileDrop(file) {
  if (file.type === 'image' && file.subtype === 'svg+xml') {
      let svgData = file.data;

      // Check if the data is base64 encoded
      if (svgData.startsWith('data:image/svg+xml;base64,')) {
          // Extract the base64 part and decode it
          const base64Data = svgData.split(',')[1];
          svgData = atob(base64Data); // Decode base64
      }

      // Now svgData should be a valid SVG string
      svgData = decodeHTMLEntities(svgData).trim(); // Decode any HTML entities

      let parser = new DOMParser();
      let svgDoc = parser.parseFromString(svgData, 'image/svg+xml');

      // Check for parsing errors
      if (svgDoc.getElementsByTagName('parsererror').length > 0) {
          const parserError = svgDoc.getElementsByTagName('parsererror')[0];
          console.error('Error parsing SVG:', parserError.textContent);
          console.error('SVG Document:', svgData); // Log the document for further inspection
          return;
      }

      let pathElement = svgDoc.querySelector('path'); // Get the first <path> element
      console.log('Parsed SVG Document:', svgDoc);

      if (pathElement) {
          let pathData = pathElement.getAttribute('d');
          console.log('Path data:', pathData);
          let svgPoints = parseSVGPath(pathData);
          console.log('Extracted points:', svgPoints);

          if (svgPoints.length > 0) {
              // Calculate dimensions of the SVG
              const svgWidth = parseFloat(svgDoc.documentElement.getAttribute('width')) || 100; // Fallback width
              const svgHeight = parseFloat(svgDoc.documentElement.getAttribute('height')) || 100; // Fallback height

              // Get canvas dimensions
              const canvasWidth = width; // p5 canvas width
              const canvasHeight = height; // p5 canvas height

              // Calculate scaling factor
              const scale = Math.min(canvasWidth / svgWidth, canvasHeight / svgHeight);

              // Calculate offsets to center the SVG
              const xOffset = (canvasWidth - (svgWidth * scale)) / 2 - canvasWidth/2;
              const yOffset = (canvasHeight - (svgHeight * scale)) / 2 - canvasHeight/2;

              // Transform points to be centered and scaled
              points = svgPoints.map(point => ({
                  x: xOffset + point.x * scale,
                  y: yOffset + point.y * scale
              }));

              // Create velocities
              velocities = points.map(() => ({
                  vx: random(-mutationSpeed, mutationSpeed),
                  vy: random(-mutationSpeed, mutationSpeed)
              }));

              console.log('Transformed SVG points and velocities set');
          }
      } else {
          console.log('No path element found in the SVG');
      }
  }
}


// Function to decode HTML-encoded strings
function decodeHTMLEntities(str) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str; // Using innerHTML will decode the entities
  return textarea.value;
}

// Convert SVG path data ("d" attribute) into an array of points
function parseSVGPath(pathData) {
  let commands = pathData.match(/[a-df-z][^a-df-z]*/ig);
  let pointsArray = [];
  let currentPoint = { x: 0, y: 0 };

  for (let command of commands) {
      let type = command[0];
      let values = command.slice(1).trim().split(/[\s,]+/).map(Number);

      switch (type) {
          case 'M':  // Move to
          case 'L':  // Line to
              currentPoint = { x: values[0], y: values[1] };
              pointsArray.push(currentPoint);
              break;
          case 'C':  // Bezier curve (Cubic)
              // For simplicity, we use the endpoint of the curve
              currentPoint = { x: values[4], y: values[5] };
              pointsArray.push(currentPoint);
              break;
          case 'Z':  // Close path (optional)
              if (pointsArray.length > 0) {
                  // Add the first point again to close the shape
                  pointsArray.push(pointsArray[0]);
              }
              break;
      }

      // Trim to first 2000 points
      if (pointsArray.length >= 3000) {
          break;
      }
  }

  return pointsArray;
}
