

let shapes = []; // Each item: { points: [{x,y},...], velocities: [{vx,vy},...] }
let importedShapes = null; // store for reload/reset


// Blob
let points = []; // Array to store blob vertex points
let amount = 2000; // Number of blob points
let blobSize = 500; // Size of the blob
let showDots = false; // Dot visibility
let spiky = true;
let bpm = 30;  // Set BPM (Unused)
let framesPerBeat;


// Blob Style
let dotSize = 1;
let dotColor = 'white';
let bgColor;
let fillColor;
let fillMode = 'filled'; // Fill mode ("filled", "outline")
let strokeW = 2;
let cursorStrokeW;
let cursorColor = 'red';
let edgeColor = 'black';

// Modifier
let currentMode = "attract";
let touchRadius = 100;
let touchForce = 10;
let smoothing = 1;
let explosionForce = 400;


//Mutation
let shouldMutate = true;
let prevShouldMutate = null;
let smoothingEnabled = true;
let velocities = [];
let mutationSpeed = 10;
let noiseScale = 0.25;
let amplitude = 1;
let frequency = 10;
let reactionDistance = 5; // "Tension"


// SVG Import tracking
let importedSVGPoints = null; // Store original imported SVG points
let importedSVGVelocities = null; // Store velocities for imported SVG

// UI and globals
let canvas;
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

let label; // Global label reference for Amount slider (complexity)
let appliedScale = 1;


// Video

let isResized = false;
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

function initEncoder() {
  HME.createH264MP4Encoder().then(enc => {
    encoder = enc;
    encoder.outputFilename = 'uglyph';
    encoder.width = canvas.width;
    encoder.height = canvas.height;
    encoder.frameRate = 30;
    encoder.kbps = 80000; // Video quality
    encoder.groupOfPictures = 10; // Lower for fast actions
    encoder.initialize();
  });
}
function resetEncoder() {
  if (encoder) {
    encoder.delete(); // Properly delete the existing encoder before re-initializing
  }
  initEncoder();
}
function createUI() {
  if (showUI === true) {
    let uiContainer = select('#ui-container');

    // Label 1
    let label1 = createP(`
      <span class="label-left">UGLYPH v1.0</span>
       `);
    // <span class="label-right" style="color: red;"><a href="http://www.instagram.com/sevavar" target="_blank">⬥</a>
    label1.class('label-container');
    label1.parent(uiContainer);

    // Section 0: IMPORT
    let section6 = createP('IMPORT');

    section6.class('sectionName');
    section6.parent(uiContainer);


    // Import Text
    let importText = createP('Drag any .svg file to the canvas!');
    importText.class('text');
    importText.parent(uiContainer);



    // Section 1: GENERATION
    let section1 = createP('GENERATION');
    section1.class('sectionName');
    section1.parent(uiContainer);





    // Vertices Label
label4 = createP(`
  <span class="label-left">Complexity</span>
  <span class="label-right">${amount}</span>
`);
label4.class('label-container');
label4.parent(uiContainer);

// Vertices Slider
sliders.amount = createSlider(100, 10000, amount);
sliders.amount.class('slider');
sliders.amount.input(() => {
  const newAmount = sliders.amount.value();
  label4.html(`
    <span class="label-left">Complexity</span>
    <span class="label-right">${newAmount}</span>
  `);
  // call centralized resampler
  resampleTotal(newAmount);
});
sliders.amount.parent(uiContainer);

    // Size Label
    let label7 = createP(`
  <span class="label-left">Size</span>
  <span class="label-right">${blobSize}</span>
`);
    label7.class('label-container');
    label7.parent(uiContainer);

    // Size Slider
    sliders.size = createSlider(0, 1000, blobSize);
    sliders.size.class('slider');
     sliders.size.input(() => {
      let oldSize = blobSize;
      blobSize = sliders.size.value();
      label7.html(`
    <span class="label-left">Size</span>
    <span class="label-right">${blobSize}</span>
  `);
      if (oldSize > 0) {
        let scaleFactor = blobSize / oldSize;
        // Apply scaling to every shape (not only the first)
        for (let s = 0; s < shapes.length; s++) {
          const shp = shapes[s];
          for (let i = 0; i < shp.points.length; i++) {
            shp.points[i].x *= scaleFactor;
            shp.points[i].y *= scaleFactor;
          }
        }
        // accumulate the applied scale so reload can re-apply it
        appliedScale *= scaleFactor;

        // keep UI refs in sync
        if (shapes.length > 0) {
          points = shapes[0].points;
          velocities = shapes[0].velocities;
          amount = points.length;
        }
      }
    });
    sliders.size.parent(uiContainer);

    // Section 2: MUTATION
    let section2 = createP('MUTATION');
    section2.class('sectionName');
    section2.parent(uiContainer);

    // Mutation Button
    buttons.mutation = createButton(`
      <span class="left-align">■</span>
      <span class="center-align">Stop</span>
      <span class="right-align">M</span>
    `);
    buttons.mutation.class('button');
    buttons.mutation.mousePressed(toggleMutation);
    buttons.mutation.parent(uiContainer);

    // Freeze Button
    buttons.freeze = createButton(`
      <span class="left-align">⏸</span>
      <span class="center-align">Pause</span>
      <span class="right-align">Space</span>
    `);
    buttons.freeze.class('button');
    buttons.freeze.mousePressed(toggleSmoothing);
    buttons.freeze.parent(uiContainer);

    // Reset Button
    buttons.reset = createButton(`
      <span class="left-align">↻</span>
      <span class="center-align">Reset</span>
      <span class="right-align">Esc</span>
    `);
    buttons.reset.class('button');
    buttons.reset.mousePressed(reloadWindow);
    buttons.reset.parent(uiContainer);

    // Mutation Intensity (former Speed) Label
    let label6 = createP(`
  <span class="label-left">Intensity</span>
  <span class="label-right">${mutationSpeed}</span>
`);
    label6.class('label-container');
    label6.parent(uiContainer);

    // Mutation Intensity (former Speed) Slider
    sliders.mutationSpeed = createSlider(0, 50, mutationSpeed);
    sliders.mutationSpeed.class('slider');
    sliders.mutationSpeed.input(() => {
      mutationSpeed = sliders.mutationSpeed.value();
      label6.html(`
    <span class="label-left">Intensity</span>
    <span class="label-right">${mutationSpeed}</span>
  `);

      // Update velocities for every shape
      for (let s = 0; s < shapes.length; s++) {
        const shp = shapes[s];
        // Ensure velocity array matches points length
        if (!shp.velocities || shp.velocities.length !== shp.points.length) {
          shp.velocities = shp.points.map(() => ({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) }));
        } else {
          for (let i = 0; i < shp.velocities.length; i++) {
            shp.velocities[i].vx = random(-mutationSpeed, mutationSpeed);
            shp.velocities[i].vy = random(-mutationSpeed, mutationSpeed);
          }
        }
      }

      // keep UI alias in sync
      if (shapes.length > 0) {
        velocities = shapes[0].velocities;
      }
    });
    sliders.mutationSpeed.parent(uiContainer);


    let label9 = createP(`
      <span class="label-left"> Collisions</span>
      <span class="label-right">${reactionDistance}</span>
    `);
    label9.class('label-container');
    label9.parent(uiContainer);

    sliders.reactionDistance = createSlider(0, 10, reactionDistance);
    sliders.reactionDistance.class('slider');

    // Update label and value when the slider is moved
    sliders.reactionDistance.input(() => {
      reactionDistance = sliders.reactionDistance.value();

      // Update the label with the new value of reactionDistance
      label9.html(`
        <span class="label-left">Collisions</span>
        <span class="label-right">${reactionDistance}</span>
      `);

    });
    sliders.reactionDistance.parent(uiContainer);

    // Section 3: INTERACTION
    let section3 = createP('INTERACTION');
    section3.class('sectionName');
    section3.parent(uiContainer);

    let buttonContainer1 = createDiv();
    buttonContainer1.class('button-container'); // Add the flex container class
    buttonContainer1.parent(uiContainer); // Assuming uiContainer is your main container

    // Attract Button
    buttons.attractButton = createButton(`
      <span class="center-align">>•< Attract</span>
    `);
    buttons.attractButton.class('mediumbutton');
    buttons.attractButton.mousePressed(() => setBrushMode('attract'));
    buttons.attractButton.parent(buttonContainer1);

    // Repulse Button
    buttons.repulseButton = createButton(`
      <span class="center-align"><•> Repulse</span>
    `);
    buttons.repulseButton.class('mediumbutton');
    buttons.repulseButton.mousePressed(() => setBrushMode('repulse'));
    buttons.repulseButton.parent(buttonContainer1);

    buttons.explode = createButton(`
      <span class="left-align">✱</span>
      <span class="center-align">Explode</span>
      <span class="right-align">X</span>`);

    buttons.explode.class('button');
    buttons.explode.mousePressed(explode);
    buttons.explode.parent(uiContainer);


    let label2 = createP(`
        <span class="label-left">Click Radius</span>
        <span class="label-right">${touchRadius}</span>
      `);
    label2.class('text label-container');
    label2.parent(uiContainer);

    sliders.touchRadius = createSlider(10, 200, touchRadius);
    sliders.touchRadius.class('slider');

    // Update label and value when the slider is moved
    sliders.touchRadius.input(() => {
      touchRadius = sliders.touchRadius.value();

      // Update the label with the new value of reactionDistance
      label2.html(`
          <span class="label-left">Click Radius</span>
          <span class="label-right">${touchRadius}</span>
        `);

    });

    sliders.touchRadius.parent(uiContainer);

    elementY += sliderDist;

    let label5 = createP(`
        <span class="label-left">Click Force</span>
        <span class="label-right">${touchForce}</span>
      `);
    label5.class('text label-container');
    label5.parent(uiContainer);

    sliders.touchForce = createSlider(20, 200, touchForce);
    sliders.touchForce.class('slider');

    // Update label and value when the slider is moved
    sliders.touchForce.input(() => {
      touchForce = sliders.touchForce.value();

      // Update the label with the new value of CursorForce
      label5.html(`
          <span class="label-left">Click Force</span>
          <span class="label-right">${touchForce}</span>
        `);

    });

    sliders.touchForce.parent(uiContainer);


    // Explosion Force Label
    let label8 = createP(`
      <span class="label-left">Explosion Force</span>
      <span class="label-right">${explosionForce}</span>
    `);
    label8.class('text label-container');
    label8.parent(uiContainer);

    // Explosion Force Slider
    sliders.explosionForce = createSlider(1, 400, explosionForce);
    sliders.explosionForce.class('slider');
    sliders.explosionForce.input(() => {
      explosionForce = sliders.explosionForce.value();
      label8.html(`
        <span class="label-left">Explosion Force</span>
        <span class="label-right">${explosionForce}</span>
      `);
    });
    sliders.explosionForce.parent(uiContainer);

    // Section 4: APPEARANCE
    let section4 = createP('APPEARANCE');
    section4.class('sectionName');
    section4.parent(uiContainer);

    // Switch Style Button
    buttons.switchStyle = createButton(`
      <span class="left-align">✧</span>
      <span class="center-align">Fill Style</span>
      <span class="right-align">F</span>
    `);
    buttons.switchStyle.class('button');
    buttons.switchStyle.mousePressed(toggleFillMode);
    buttons.switchStyle.parent(uiContainer);

    // Show Vertices Button
    buttons.spikes = createButton(`
      <span class="left-align">⁙</span>
      <span class="center-align">Hide Vertices</span>
      <span class="right-align">H</span>
    `);
    buttons.spikes.class('button');
    buttons.spikes.mousePressed(toggleDots);
    buttons.spikes.parent(uiContainer);

    // Randomize Colors Button
    buttons.recolor = createButton(`
      <span class="left-align">?</span>
      <span class="center-align">Randomize Colors</span>
      <span class="right-align">R</span>
    `);
    buttons.recolor.class('button');
    buttons.recolor.mousePressed(recolor);
    buttons.recolor.parent(uiContainer);

    // Invert Colors Button
    buttons.invertColors = createButton(`
      <span class="left-align">☯</span>
      <span class="center-align">Black & White</span>
      <span class="right-align">I</span>
    `);
    buttons.invertColors.class('button');
    buttons.invertColors.mousePressed(invertColors);
    buttons.invertColors.parent(uiContainer);

    let label3 = createP(`
      <span class="label-left">Thickness</span>
      <span class="label-right">${strokeW}</span>
    `);
    label3.class('label-container');
    label3.parent(uiContainer);

    sliders.strokeW = createSlider(1, 200, strokeW);
    sliders.strokeW.class('slider');
    sliders.strokeW.input(() => {
      strokeW = sliders.strokeW.value();
      label3.html(`
        <span class="label-left">Thickness</span>
        <span class="label-right">${strokeW}</span>
      `);
    });
    sliders.strokeW.parent(uiContainer);





    // Section 5: EXPORT
    let section5 = createP('EXPORT');
    section5.class('sectionName');
    section5.parent(uiContainer);

    let buttonContainer2 = createDiv();
    buttonContainer2.class('button-container'); // Add the flex container class
    buttonContainer2.parent(uiContainer); // Assuming uiContainer is your main container

    // PNG Button
    buttons.sPNG = createButton(`
      <span class="center-align">.png</span>
    `);
    buttons.sPNG.class('smallbutton');
    buttons.sPNG.mousePressed(savePNG);
    buttons.sPNG.parent(buttonContainer2);

    // SVG Button
    buttons.sSVG = createButton(`
      <span class="center-align">.svg</span>
    `);
    buttons.sSVG.class('smallbutton');
    buttons.sSVG.mousePressed(copyAndSaveSVG);
    buttons.sSVG.parent(buttonContainer2);

    // GIF Button
    buttons.sGIF = createButton(`
      <span class="center-align">.gif</span>
    `);
    buttons.sGIF.class('smallbutton');
    buttons.sGIF.mousePressed(recordGIF);
    buttons.sGIF.parent(buttonContainer2);

    // MP4 Button
    buttons.sMP4 = createButton(`
      <span class="center-align">.mp4</span>
    `);
    buttons.sMP4.class('smallbutton');
    buttons.sMP4.mousePressed(() => recording = true);
    buttons.sMP4.parent(buttonContainer2);



    // // Section 5: EXPORT
    // let credits = createP('CREDITS');
    // credits.class('sectionName');
    // credits.parent(uiContainer);


    // let creditsText = createP('BY <a href="http://www.instagram.com/sevavar" target="_blank">SEVA VARFOLOMEEV</a> / <a href="http://www.retry.studio" target="_blank">RETRY</a>');
    // creditsText.class('footer');
    // creditsText.parent(uiContainer);

  }
}
function setup() {

  createUI();

  canvasContainer = select('#canvas-container');
  // measure UI width using DOM (safe even before p5 element reports size)
  const uiEl = document.getElementById('ui-container');
  const uiWidth = uiEl ? uiEl.getBoundingClientRect().width : 0;
  const availableWidth = Math.max(100, windowWidth - uiWidth);
  const availableHeight = windowHeight; // Full height of the window

  // Create canvas with dynamic size and store globally for encoder usage
  canvas = createCanvas(availableWidth, availableHeight);
  canvas.parent(canvasContainer);
  canvas.drop(handleFileDrop); // Allow SVG file to be dropped on canvas
  frameRate(30);
  
  currentWidth = availableWidth;
  currentHeight = availableHeight;
  fillMode = "filled"; // Default fill mode
  showUI = true;
  //generateShape();
  importDefaultSVG();
  initEncoder();
  recolor();


  // Initial call to set the right button states based on the default mode
  if (buttons.attractButton && buttons.repulseButton) {
    updateButtonStates(); // Call this only after buttons are created
  }
}
function generateShape() {
  // Generate a single default blob as the primary shape (keeps UI compatibility)
  const pts = [];
  const vels = [];
  for (let i = 0; i < amount; i++) {
    let x = currentWidth / 2;
    let y = currentHeight / 2;
    let angle = map(i, 0, amount, 0, TWO_PI);
    let radius = (blobSize) * noise(noiseScale * i);
    // center relative coordinates
    x = radius * cos(angle);
    y = radius * sin(angle);
    pts.push({ x: x, y: y });
    vels.push({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) });
  }

  shapes = [{ points: pts, velocities: vels, fillMode: fillMode }];

  // Keep compatibility references for UI and other code that expects points/velocities
  points = shapes[0].points;
  velocities = shapes[0].velocities;
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

  const uiEl = document.getElementById('ui-container');
  const uiWidth = uiEl ? uiEl.getBoundingClientRect().width : 0;
  const availableWidth = Math.max(100, windowWidth - uiWidth);
  const availableHeight = windowHeight; // Full height of the window
  resizeCanvas(availableWidth, availableHeight);
  isResized = true;
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
      toggleDots();
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
      event.preventDefault(); // This prevents scrolling
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
    fillMode = "outline";
    // } else {
    //   fillMode = "outline";
  }

  // Ensure all existing shapes follow the global fillMode
  for (let s = 0; s < shapes.length; s++) {
    shapes[s].fillMode = fillMode;
  }
}
function toggleAttractionRepulsion() {
  currentMode = (currentMode === 'repulse') ? 'attract' : 'repulse';
}
function explode() {
  // apply explosion to every shape's points
  for (let s = 0; s < shapes.length; s++) {
    const shape = shapes[s];
    for (let i = 0; i < shape.points.length; i++) {
      shape.points[i].x += random(-explosionForce, explosionForce);
      shape.points[i].y += random(-explosionForce, explosionForce);
    }
  }
  // keep UI refs in sync
  if (shapes.length > 0) {
    points = shapes[0].points;
    velocities = shapes[0].velocities;
    amount = points.length;
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
  // Build an SVG that contains one path per shape (keeps original relative positions)
  const svgNS = 'http://www.w3.org/2000/svg';
  let svg = document.createElementNS(svgNS, 'svg');
  let svgWidth = windowWidth;
  let svgHeight = windowHeight;
  svg.setAttribute('width', svgWidth);
  svg.setAttribute('height', svgHeight);
  svg.setAttribute('xmlns', svgNS);

  function colorToString(c) {
    return `rgb(${red(c)},${green(c)},${blue(c)})`;
  }

  // background
  let backgroundRect = document.createElementNS(svgNS, 'rect');
  backgroundRect.setAttribute('width', '100%');
  backgroundRect.setAttribute('height', '100%');
  backgroundRect.setAttribute('fill', colorToString(bgColor));
  svg.appendChild(backgroundRect);

  // For each shape, create a path (or circles for worm)
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  for (let s = 0; s < shapes.length; s++) {
    const shp = shapes[s];
    if (!shp || shp.points.length === 0) continue;

    const mode = shp.fillMode || fillMode;

    let path = document.createElementNS(svgNS, 'path');
    let d = shp.points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x + centerX} ${pt.y + centerY}`).join(' ');
    d += ' Z';
    path.setAttribute('d', d);

    if (mode === "filled") {
      path.setAttribute('fill', colorToString(fillColor));
      path.setAttribute('stroke', 'none');
    } else if (mode === "outline") {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', colorToString(fillColor));
      path.setAttribute('stroke-width', strokeW);
    } else if (mode === "filled") {
      path.setAttribute('fill', colorToString(fillColor));
      path.setAttribute('stroke', 'none');
    }
    svg.appendChild(path);

    if (showDots === true) {
      for (let i = 0; i < shp.points.length; i++) {
        let pt = shp.points[i];
        let circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', pt.x + centerX);
        circle.setAttribute('cy', pt.y + centerY);
        circle.setAttribute('r', 1);
        circle.setAttribute('fill', colorToString(fillColor));
        circle.setAttribute('stroke', colorToString(edgeColor));
        circle.setAttribute('stroke-width', 2);
        svg.appendChild(circle);
      }
    }
  }

  let svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
  saveBlob(svgBlob, createFileName('uglyph', 'svg'));
}
function recordGIF() {
  saveGif('uglyph.gif', gifDuration, { units: 'frames', notificationDuration: 1, notificationID: 'customProgressBar' });

}
function saveBlob(blob, fileName) {
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}
function createFileName(prefix, extension) {
  let now = new Date();
  let datePart = `${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}`;
  let timePart = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  return `${prefix}_${datePart}${timePart}.${extension}`;
}
function reloadWindow() {
  if (importedShapes && importedShapes.length > 0) {
    // restore imported shapes (deep copy), including contours but DO NOT override current global fillMode
    shapes = importedShapes.map(s => ({
      points: s.points.map(p => ({ x: p.x, y: p.y })),
      velocities: s.velocities ? s.velocities.map(v => ({ vx: v.vx, vy: v.vy })) : null,
      contours: s.contours ? s.contours.map(c => ({ offset: c.offset, length: c.length, direction: c.direction })) : null,
      // preserve current global fillMode instead of using saved per-shape value
      fillMode: fillMode
    }));

    // ensure velocities exist and match points length
    for (let shp of shapes) {
      if (!shp.velocities || shp.velocities.length !== shp.points.length) {
        shp.velocities = shp.points.map(() => ({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) }));
      }
    }

    // re-apply cumulative user scale so reload preserves Size state
    if (appliedScale !== 1) {
      for (let s = 0; s < shapes.length; s++) {
        const shp = shapes[s];
        for (let i = 0; i < shp.points.length; i++) {
          shp.points[i].x *= appliedScale;
          shp.points[i].y *= appliedScale;
        }
      }
    }
  } else {
    generateShape();
  }

  // Keep compatibility aliases for UI & code using points/velocities
  if (shapes.length > 0) {
    points = shapes[0].points;
    velocities = shapes[0].velocities;
    amount = shapes.reduce((sum, s) => sum + s.points.length, 0);
    if (sliders && sliders.amount) {
      sliders.amount.value(amount);
      if (label4) label4.html(`
        <span class="label-left">Complexity</span>
        <span class="label-right">${amount}</span>
      `);
      resampleTotal(amount);
    }
  }
}
function toggleDots() {
  showDots = (showDots === true) ? false : true;
}
function draw() {


  // Sync some UI state labels (existing code left intact)
  if (shouldMutate !== prevShouldMutate) {
    buttons.mutation.html(`
      <span class="left-align">${shouldMutate ? '■' : '▶'}</span>
      <span class="center-align">${shouldMutate ? 'Stop' : 'Start'}</span>
      <span class="right-align">M</span>`);
    prevShouldMutate = shouldMutate;
  }
  if (smoothingEnabled === true) {
    buttons.freeze.html(`
    <span class="left-align">⏸</span>
    <span class="center-align">Freeze</span>
    <span class="right-align">Space</span>`);
  } else {
    buttons.freeze.html(` 
    <span class="left-align">⏸</span>
    <span class="center-align">Freezed</span>
    <span class="right-align">Space</span>`);
  }
  if (showDots === false) {
    buttons.spikes.html(`
    <span class="left-align">⁙</span>
    <span class="center-align">Show Vertices</span>
    <span class="right-align">H</span>`);
  } else {
    buttons.spikes.html(`
  <span class="left-align">⁙</span>
  <span class="center-align">Hide Vertices</span>
  <span class="right-align">H</span> `)
  }

  translate(width / 2, height / 2);
  background(bgColor);
  strokeWeight(strokeW);

  if (fillMode === "filled") {
    fill(fillColor);
    stroke(fillColor);
  } else if (fillMode === "outline") {
    noFill();
    stroke(fillColor);
  }

  // Run mutation (which updates shapes)
   if (smoothingEnabled) {
    mutation();

    // per-shape smoothing: operate per-contour (contours are independent closed rings)
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      if (!shp || !shp.points || shp.points.length < 3) continue;

      // helper: smooth a consecutive range [offset, offset+len)
      function smoothRange(offset, len) {
        if (len < 3) return;
        const temp = new Array(len);
        for (let i = 0; i < len; i++) {
          const prev = shp.points[offset + ((i - 1 + len) % len)];
          const curr = shp.points[offset + i];
          const next = shp.points[offset + ((i + 1) % len)];
          const smX = (prev.x + smoothing * curr.x + next.x) / (2 + 1 * smoothing);
          const smY = (prev.y + smoothing * curr.y + next.y) / (2 + 1 * smoothing);
          temp[i] = { x: smX, y: smY };
        }
        for (let i = 0; i < len; i++) {
          shp.points[offset + i].x = temp[i].x;
          shp.points[offset + i].y = temp[i].y;
        }
      }

      if (shp.contours && shp.contours.length > 0) {
        for (let c = 0; c < shp.contours.length; c++) {
          const ct = shp.contours[c];
          smoothRange(ct.offset, ct.length);
        }
      } else {
        smoothRange(0, shp.points.length);
      }
    }
  }

  // Draw each shape separately (outline / filled)
      // Draw each shape separately (outline / filled)
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      if (!shp || shp.points.length === 0) continue;

      const mode = shp.fillMode || fillMode;

      // set fill/stroke per-shape (but push/pop to avoid leaking)
      push();
      if (mode === "filled") {
        fill(fillColor);
        stroke(fillColor);
      } else if (mode === "outline") {
        noFill();
        stroke(fillColor);
      }

      // If shape has contours metadata, render using beginContour for holes
      if (shp.contours && shp.contours.length > 0) {
        // outer contour is first element; additional contours are holes
        beginShape();
        // outer
        const outer = shp.contours[0];
        for (let i = 0; i < outer.length; i++) {
          const pt = shp.points[outer.offset + i];
          vertex(pt.x, pt.y);
        }
        // inner holes
        for (let ci = 1; ci < shp.contours.length; ci++) {
          const c = shp.contours[ci];
          beginContour();
          for (let i = 0; i < c.length; i++) {
            const pt = shp.points[c.offset + i];
            vertex(pt.x, pt.y);
          }
          endContour();
        }
        endShape(CLOSE);
      } else {
        // legacy single-ring shapes (use previous smoothing/spiky behavior)
        if (!spiky) {
          beginShape();
          for (let i = 0; i < shp.points.length; i++) {
            curveVertex(shp.points[i].x, shp.points[i].y);
          }
          curveVertex(shp.points[0].x, shp.points[0].y);
          curveVertex(shp.points[1 % shp.points.length].x, shp.points[1 % shp.points.length].y);
          endShape(CLOSE);
        } else {
          beginShape();
          for (let i = 0; i < shp.points.length; i++) {
            vertex(shp.points[i].x, shp.points[i].y);
          }
          endShape(CLOSE);
        }
      }

      

      // outline/filled per-vertex dots (toggleable)
      if (showDots === true) {
        push();
        noStroke();
        fill(edgeColor);
        for (let i = 0; i < shp.points.length; i++) {
          ellipse(shp.points[i].x, shp.points[i].y, 3, 3);
        }
        pop();
      }

      pop();
    }

  // Mouse interaction: apply attract/repulse to all shapes' points
  if (mouseIsPressed === true) {
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      for (let i = 0; i < shp.points.length; i++) {
        let d = dist(mouseX - width / 2, mouseY - height / 2, shp.points[i].x, shp.points[i].y);
        let direction = currentMode === "attract" ? 1 : -1;
        if (d < touchRadius) {
          shp.points[i].x += (mouseX - width / 2 - shp.points[i].x) * 0.01 * touchForce * direction;
          shp.points[i].y += (mouseY - height / 2 - shp.points[i].y) * 0.01 * touchForce * direction;
        }
      }
    }
  }

  // Draw cursor preview
  fill(255, 255, 255, 255);
  noStroke();
  fill(100, 100, 100, 75);
  circle(mouseX - width / 2, mouseY - height / 2, touchRadius * 2);
  if (mouseIsPressed === true) {
    fill(guiTextColor);
    circle(mouseX - width / 2, mouseY - height / 2, touchRadius / 1.6);
  }

  // theme toggles
  if (bgColor === 'white') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  }

  // recording handling (existing code kept)
  if (recording) {
    console.log('recording');
    recordVideo();
  }

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

    resetEncoder(); // reinitialize encoder
  }
}
function createSpatialGrid(points, cellSize) {
  const grid = new Map();

  for (let i = 0; i < points.length; i++) {
    const cellX = Math.floor(points[i].x / cellSize);
    const cellY = Math.floor(points[i].y / cellSize);
    const key = `${cellX},${cellY}`;

    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key).push(i);
  }

  return grid;
}
function getNearbyCells(x, y, cellSize) {
  const cellX = Math.floor(x / cellSize);
  const cellY = Math.floor(y / cellSize);
  const nearby = [];

  // Check current cell and 8 surrounding cells
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      nearby.push(`${cellX + dx},${cellY + dy}`);
    }
  }

  return nearby;
}

function mutation() {
  if (!shouldMutate) return;

  // Flatten all shapes into lists for easy collision checks
  const flatPoints = [];
  const flatVel = [];
  const mapping = []; // flat index -> { s, contourIndex, localIndex, contourLength, globalIndex }

  for (let s = 0; s < shapes.length; s++) {
    const shp = shapes[s];
    if (!shp || !shp.points) continue;

    if (shp.contours && shp.contours.length > 0) {
      for (let ci = 0; ci < shp.contours.length; ci++) {
        const c = shp.contours[ci];
        const off = c.offset;
        const len = c.length;
        for (let li = 0; li < len; li++) {
          const gi = off + li;
          flatPoints.push({ x: shp.points[gi].x, y: shp.points[gi].y });
          // guard for missing velocities
          const v = (shp.velocities && shp.velocities[gi]) ? shp.velocities[gi] : { vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) };
          flatVel.push({ vx: v.vx, vy: v.vy });
          mapping.push({ s, contourIndex: ci, localIndex: li, contourLength: len, globalIndex: gi });
        }
      }
    } else {
      const len = shp.points.length;
      for (let li = 0; li < len; li++) {
        flatPoints.push({ x: shp.points[li].x, y: shp.points[li].y });
        const v = (shp.velocities && shp.velocities[li]) ? shp.velocities[li] : { vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) };
        flatVel.push({ vx: v.vx, vy: v.vy });
        mapping.push({ s, contourIndex: 0, localIndex: li, contourLength: len, globalIndex: li });
      }
    }
  }

  // Move all flat points by their velocities
  for (let k = 0; k < flatPoints.length; k++) {
    flatPoints[k].x += 0.2 * flatVel[k].vx;
    flatPoints[k].y += 0.2 * flatVel[k].vy;
  }

  // spatial grid (use same helpers)
  const cellSize = Math.max(reactionDistance * 2, 10); 
  const grid = new Map();
  for (let k = 0; k < flatPoints.length; k++) {
    const cellX = Math.floor(flatPoints[k].x / cellSize);
    const cellY = Math.floor(flatPoints[k].y / cellSize);
    const key = `${cellX},${cellY}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(k);
  }

  const checked = new Set();
  for (let k = 0; k < flatPoints.length; k++) {
    const p = flatPoints[k];
    const cellX = Math.floor(p.x / cellSize);
    const cellY = Math.floor(p.y / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const list = grid.get(key);
        if (!list) continue;
        for (const j of list) {
          if (j <= k) continue; // avoid double-check & self

          const a = mapping[k];
          const b = mapping[j];

          // if same shape and same contour, skip very near neighbors in that closed ring (including wrap)
          if (a.s === b.s && a.contourIndex === b.contourIndex) {
            const localDiff = Math.abs(a.localIndex - b.localIndex);
            const len = a.contourLength;
            if (localDiff < 5) continue;
            if (localDiff > len - 5) continue;
          }

          const pairKey = `${Math.min(k, j)}-${Math.max(k, j)}`;
          if (checked.has(pairKey)) continue;
          checked.add(pairKey);

          const dxp = flatPoints[k].x - flatPoints[j].x;
          const dyp = flatPoints[k].y - flatPoints[j].y;
          const distSq = dxp * dxp + dyp * dyp;
          const reactionDistSq = reactionDistance * reactionDistance;

          if (distSq < reactionDistSq && distSq > 0) {
            const distance = sqrt(distSq);
            // reverse velocities
            flatVel[k].vx *= -1;
            flatVel[k].vy *= -1;
            flatVel[j].vx *= -1;
            flatVel[j].vy *= -1;

            // push apart
            const overlap = reactionDistance - distance;
            const pushX = (dxp / distance) * overlap * 0.5;
            const pushY = (dyp / distance) * overlap * 0.5;

            flatPoints[k].x += pushX;
            flatPoints[k].y += pushY;
            flatPoints[j].x -= pushX;
            flatPoints[j].y -= pushY;
          }
        }
      }
    }
  }

  // Keep points inside canvas & write back to shapes
  for (let k = 0; k < flatPoints.length; k++) {
    const mp = mapping[k];
    const shp = shapes[mp.s];
    // boundaries in centered coords
    if (flatPoints[k].x < -width / 2 + (strokeW / 2)) {
      flatPoints[k].x = -width / 2 + (strokeW / 2);
      flatVel[k].vx *= -1;
    }
    if (flatPoints[k].x > width / 2 - (strokeW / 2)) {
      flatPoints[k].x = width / 2 - (strokeW / 2);
      flatVel[k].vx *= -1;
    }
    if (flatPoints[k].y < -height / 2 + (strokeW / 2)) {
      flatPoints[k].y = -height / 2 + (strokeW / 2);
      flatVel[k].vy *= -1;
    }
    if (flatPoints[k].y > height / 2 - (strokeW / 2)) {
      flatPoints[k].y = height / 2 - (strokeW / 2);
      flatVel[k].vy *= -1;
    }

    // write back using globalIndex (original concatenated indexing)
    const gi = mp.globalIndex;
    shp.points[gi].x = flatPoints[k].x;
    shp.points[gi].y = flatPoints[k].y;
    if (!shp.velocities) shp.velocities = [];
    shp.velocities[gi] = shp.velocities[gi] || { vx: 0, vy: 0 };
    shp.velocities[gi].vx = flatVel[k].vx;
    shp.velocities[gi].vy = flatVel[k].vy;
  }

  // Keep UI refs in sync (primary shape)
  if (shapes.length > 0) {
    points = shapes[0].points;
    velocities = shapes[0].velocities;
    // amount should reflect total vertices across all shapes
    amount = shapes.reduce((sum, s) => sum + (s.points ? s.points.length : 0), 0);
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
    if (svgData.startsWith('data:image/svg+xml;base64,')) {
      const base64Data = svgData.split(',')[1];
      svgData = atob(base64Data);
    }
    svgData = decodeHTMLEntities(svgData).trim();

    let parser = new DOMParser();
    let svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
    if (svgDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('Error parsing SVG:', svgDoc.getElementsByTagName('parsererror')[0].textContent);
      return;
    }

    let pathElements = svgDoc.querySelectorAll('path');
    if (pathElements.length > 0) {
      // Determine desired total vertices for this import (use UI slider if present)
      const targetTotal = (typeof sliders !== 'undefined' && sliders.amount) ? sliders.amount.value() : amount;

      // First: compute each path's geometric length so we can distribute vertices proportionally
      const pathLengths = [];
      let totalPathLength = 0;
      const svgNS = "http://www.w3.org/2000/svg";
      // create a hidden temporary svg for length calculation
      const tmpSvg = document.createElementNS(svgNS, "svg");
      tmpSvg.setAttribute("width", 1);
      tmpSvg.setAttribute("height", 1);
      tmpSvg.style.position = "absolute";
      tmpSvg.style.left = "-9999px";
      tmpSvg.style.top = "-9999px";
      document.body.appendChild(tmpSvg);

      pathElements.forEach(pe => {
        try {
          const pathData = pe.getAttribute('d') || '';
          const p = document.createElementNS(svgNS, "path");
          p.setAttribute('d', pathData);
          tmpSvg.appendChild(p);
          const L = p.getTotalLength ? p.getTotalLength() : 0;
          const safeL = (L > 0) ? L : 0;
          pathLengths.push(safeL);
          totalPathLength += safeL;
          tmpSvg.removeChild(p);
        } catch (err) {
          pathLengths.push(0);
        }
      });
      // cleanup tmp svg
      tmpSvg.remove();

      // fallback when all lengths are zero: distribute by original path point-count (or equally)
      const MIN_PER_PATH = 3;
      const counts = [];
      if (totalPathLength > 0) {
        // distribute proportionally to length
        let floatCounts = Array.from(pathLengths, L => (L / totalPathLength) * targetTotal);
        // round and enforce minimum
        let rounded = floatCounts.map(fc => Math.max(MIN_PER_PATH, Math.round(fc)));
        // correct rounding to exact targetTotal
        let sum = rounded.reduce((a, b) => a + b, 0);
        let i = 0;
        while (sum < targetTotal) { rounded[i % rounded.length]++; sum++; i++; }
        i = 0;
        while (sum > targetTotal) { if (rounded[i % rounded.length] > MIN_PER_PATH) { rounded[i % rounded.length]--; sum--; } i++; if (i > rounded.length * 5) break; }
        // if still mismatch, brute-force adjust
        i = 0;
        while (sum > targetTotal) { rounded[i % rounded.length]--; sum--; i++; }
        counts.push(...rounded);
      } else {
        // equal (or based on existing point-count)
        // attempt to use existing path point counts from 'd' sampling fallback: equal split
        let base = Math.max(MIN_PER_PATH, Math.floor(targetTotal / pathElements.length));
        counts.length = 0;
        for (let i = 0; i < pathElements.length; i++) counts.push(base);
        // fix remainder
        let sum = counts.reduce((a, b) => a + b, 0);
        let idx = 0;
        while (sum < targetTotal) { counts[idx++ % counts.length]++; sum++; }
        while (sum > targetTotal) { for (let j = 0; j < counts.length && sum > targetTotal; j++) { if (counts[j] > MIN_PER_PATH) { counts[j]--; sum--; } } if (sum > targetTotal) { counts[0] -= (sum - targetTotal); sum = targetTotal; } }
      }

      // Now sample each path using the computed counts, but split path data into subpaths
      const allShapes = [];
      // helper: split path 'd' into subpath strings starting with M/m
      function splitSubpaths(d) {
        if (!d) return [];
        const matches = d.match(/([Mm][^Mm]*)/g);
        return matches || [];
      }

      for (let p = 0; p < pathElements.length; p++) {
        const pathElement = pathElements[p];
        const d = pathElement.getAttribute('d');
        if (!d) continue;

        // split into subpaths
        const subpaths = splitSubpaths(d);
        if (subpaths.length === 0) continue;

        // measure each subpath length to distribute per-subpath points
        const subpathLengths = [];
        let subTotal = 0;
        // create temporary container
        const tmpSvg = document.createElementNS(svgNS, "svg");
        tmpSvg.style.position = "absolute";
        tmpSvg.style.left = "-9999px";
        tmpSvg.style.top = "-9999px";
        document.body.appendChild(tmpSvg);

        for (let si = 0; si < subpaths.length; si++) {
          try {
            const pEl = document.createElementNS(svgNS, "path");
            pEl.setAttribute('d', subpaths[si]);
            tmpSvg.appendChild(pEl);
            const L = pEl.getTotalLength ? pEl.getTotalLength() : 0;
            const safeL = (L > 0) ? L : 0;
            subpathLengths.push(safeL);
            subTotal += safeL;
            tmpSvg.removeChild(pEl);
          } catch (err) {
            subpathLengths.push(0);
          }
        }
        document.body.removeChild(tmpSvg);

        // compute per-subpath counts proportionally to their lengths (or equal if zero)
        const perPathCount = Math.max(MIN_PER_PATH, counts[p] || MIN_PER_PATH);
        const subCounts = [];
        if (subTotal > 0) {
          let floatCounts = subpathLengths.map(L => (L / subTotal) * perPathCount);
          let rounded = floatCounts.map(fc => Math.max(3, Math.round(fc)));
          let ssum = rounded.reduce((a,b) => a+b, 0);
          let ii = 0;
          while (ssum < perPathCount) { rounded[ii % rounded.length]++; ssum++; ii++; }
          ii = 0;
          while (ssum > perPathCount) { rounded[ii % rounded.length] = Math.max(3, rounded[ii % rounded.length] - 1); ssum--; ii++; if (ii > rounded.length * 5) break; }
          for (let r of rounded) subCounts.push(r);
        } else {
          // equal split
          const base = Math.max(3, Math.floor(perPathCount / subpaths.length));
          for (let si = 0; si < subpaths.length; si++) subCounts.push(base);
          // distribute remainder
          let ssum = subCounts.reduce((a,b) => a+b, 0);
          let idx = 0;
          while (ssum < perPathCount) { subCounts[idx % subCounts.length]++; ssum++; idx++; }
        }

        // sample each subpath and concatenate into one shape keeping contour offsets
        let flatPts = [];
        let flatVels = [];
        const contours = [];
        let offset = 0;
        for (let si = 0; si < subpaths.length; si++) {
          const subd = subpaths[si];
          const targetPts = Math.max(3, subCounts[si] || MIN_PER_PATH);
          const sampled = parseSVGPath(subd, targetPts);
          if (!sampled || sampled.length === 0) continue;
          // compute signed area to capture original direction (positive/negative)
          const area = polygonArea(sampled);
          const dir = area >= 0 ? 1 : -1;
          // append sampled points (preserve order exactly as sampled)
          for (let q = 0; q < sampled.length; q++) {
            flatPts.push({ x: sampled[q].x, y: sampled[q].y });
            flatVels.push({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) });
          }
          // store contour with direction
          contours.push({ offset: offset, length: sampled.length, direction: dir });
          offset += sampled.length;
        }

        if (flatPts.length > 0) {
          allShapes.push({ points: flatPts, velocities: flatVels, contours: contours });
        }
      }

      if (allShapes.length === 0) {
        console.warn('No usable points extracted from SVG');
        return;
      }

      // Normalize & center allShapes together (preserve relative positions)
      const flatAll = allShapes.flatMap(s => s.points);
      const minX = Math.min(...flatAll.map(pt => pt.x));
      const maxX = Math.max(...flatAll.map(pt => pt.x));
      const minY = Math.min(...flatAll.map(pt => pt.y));
      const maxY = Math.max(...flatAll.map(pt => pt.y));
      const svgW = maxX - minX;
      const svgH = maxY - minY;
      const maxDim = Math.max(svgW, svgH);
      if (!(maxDim > 0)) {
        console.warn("Invalid SVG bounds after sampling");
        return;
      }
      const targetSize = 0.85   * Math.min(width, height);
      const scale = targetSize / maxDim;
      const centerOffsetX = (minX + maxX) / 2;
      const centerOffsetY = (minY + maxY) / 2;

      // build final shapes array (apply scaling/centering)
       shapes = allShapes.map(s => {
        const pts = s.points.map(p => ({ x: (p.x - centerOffsetX) * scale, y: (p.y - centerOffsetY) * scale }));
        const vels = s.velocities.map(() => ({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) }));
        return { points: pts, velocities: vels, contours: s.contours, fillMode: fillMode };
      });

      // apply cumulative user scale so imported shapes preserve user's Size slider state
      if (appliedScale !== 1) {
        for (let s = 0; s < shapes.length; s++) {
          const shp = shapes[s];
          for (let i = 0; i < shp.points.length; i++) {
            shp.points[i].x *= appliedScale;
            shp.points[i].y *= appliedScale;
          }
        }
      }

      // store imported shapes for reload (include contours & fillMode)
       importedShapes = shapes.map(s => ({
        points: s.points.map(p => ({ x: p.x, y: p.y })),
        velocities: s.velocities.map(v => ({ vx: v.vx, vy: v.vy })),
        contours: s.contours ? s.contours.map(c => ({ offset: c.offset, length: c.length, direction: c.direction })) : null,
        fillMode: s.fillMode
      }));

      // Keep compatibility references and make amount equal total vertices across all shapes
      points = shapes[0].points;
      velocities = shapes[0].velocities;
      amount = shapes.reduce((sum, s) => sum + s.points.length, 0);

      console.log("Imported shapes:", shapes.length, "total points:", amount);
    } else {
      console.log('No path elements found in the SVG');
    }
  }
}

function decodeHTMLEntities(str) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str; // Using innerHTML will decode the entities
  return textarea.value;
}
function parseSVGPath(pathData, targetPoints = amount) {
  if (!pathData) return [];

  try {
    // Create an SVG path element in the DOM (not visible)
    const svgNS = "http://www.w3.org/2000/svg";
    const tmpSvg = document.createElementNS(svgNS, "svg");
    tmpSvg.setAttribute("width", 1);
    tmpSvg.setAttribute("height", 1);
    tmpSvg.style.position = "absolute";
    tmpSvg.style.left = "-9999px";
    tmpSvg.style.top = "-9999px";
    document.body.appendChild(tmpSvg);

    const pathEl = document.createElementNS(svgNS, "path");
    pathEl.setAttribute("d", pathData);
    tmpSvg.appendChild(pathEl);

    // getTotalLength / getPointAtLength are very reliable
    const total = pathEl.getTotalLength();
    if (!(total > 0)) {
      // cleanup
      tmpSvg.remove();
      return [];
    }

    const pts = [];
    // sample uniformly along length
    for (let i = 0; i < targetPoints; i++) {
      const L = (i / targetPoints) * total;
      const p = pathEl.getPointAtLength(L);
      pts.push({ x: p.x, y: p.y });
    }

    // cleanup
    tmpSvg.remove();
    return pts;
  } catch (err) {
    console.error("parseSVGPath error:", err);
    return [];
  }
}
function getPointAtLength(points, length, totalLength) {
  let distSoFar = 0;
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const segLen = dist(p1.x, p1.y, p2.x, p2.y);
    if (distSoFar + segLen >= length) {
      const ratio = (length - distSoFar) / segLen;
      return {
        x: lerp(p1.x, p2.x, ratio),
        y: lerp(p1.y, p2.y, ratio),
      };
    }
    distSoFar += segLen;
  }
  return points[points.length - 1];
}
function getPathLength(ctx, path, segments = 1000) {
  let prev = null;
  let len = 0;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = getPointAtLength(ctx, path, t, segments);
    if (prev) len += dist(pt.x, pt.y, prev.x, prev.y);
    prev = pt;
  }
  return len;
}
function getPointAtLength(ctx, path, len, segments = 1000) {
  // Approximate by sampling along a normalized t parameter
  const bounds = path.getBounds?.() || { x: 0, y: 0, width: 1, height: 1 }; // fallback if no .getBounds
  const box = [bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height];
  const step = 1 / segments;
  let total = 0;
  let prev = null;
  for (let i = 0; i <= 1; i += step) {
    const pt = pointOnPath(ctx, path, i, box);
    if (prev) total += dist(pt.x, pt.y, prev.x, prev.y);
    if (total >= len) return pt;
    prev = pt;
  }
  return prev;
}
function pointOnPath(ctx, path, t, box) {
  // simple bounding-based approximation (replaceable by proper path sampling lib)
  const { x, y, width, height } = {
    x: lerp(box[0], box[2], t),
    y: lerp(box[1], box[3], t),
    width: box[2] - box[0],
    height: box[3] - box[1],
  };
  return { x, y };
}

function resampleClosed(origPoints, targetCount) {
  if (!origPoints || origPoints.length === 0) {
    return Array.from({ length: targetCount }, () => ({ x: 0, y: 0 }));
  }
  if (origPoints.length === 1) {
    return Array.from({ length: targetCount }, () => ({ x: origPoints[0].x, y: origPoints[0].y }));
  }

  // compute segment lengths and total perimeter
  const segLengths = [];
  let total = 0;
  for (let i = 0; i < origPoints.length; i++) {
    const a = origPoints[i];
    const b = origPoints[(i + 1) % origPoints.length];
    const L = dist(a.x, a.y, b.x, b.y);
    segLengths.push(L);
    total += L;
  }
  if (total <= 0) {
    // all points coincident
    return Array.from({ length: targetCount }, () => ({ x: origPoints[0].x, y: origPoints[0].y }));
  }

  // cumulative lengths for fast lookup
  const cum = [0];
  for (let i = 0; i < segLengths.length; i++) cum.push(cum[cum.length - 1] + segLengths[i]);

  const result = [];
  for (let k = 0; k < targetCount; k++) {
    const tlen = (k / targetCount) * total;
    // find segment index where tlen falls
    let segIndex = 0;
    while (segIndex < segLengths.length && cum[segIndex + 1] < tlen) segIndex++;
    const segStart = origPoints[segIndex];
    const segEnd = origPoints[(segIndex + 1) % origPoints.length];
    const segStartLen = cum[segIndex];
    const segL = segLengths[segIndex] || 1;
    const localT = (tlen - segStartLen) / segL;
    const x = lerp(segStart.x, segEnd.x, localT);
    const y = lerp(segStart.y, segEnd.y, localT);
    result.push({ x, y });
  }

  return result;
}

function resampleTotal(newAmount) {
  // pause mutation while resampling to avoid points jittering / collapsing during sampling
  const prevShouldMutate = shouldMutate;
  shouldMutate = false;

  if (!shapes || shapes.length === 0) {
    generateShape();
  }

  const MIN_PER_SHAPE = 3;
  const MIN_PER_CONTOUR = 3;

  // lightweight smoothing helper: 3-point moving average (prev, curr, next)
  function smoothPointsSimple(pts) {
    const n = pts.length;
    if (n < 3) return pts.map(p => ({ x: p.x, y: p.y }));
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 1) % n];
      out[i] = { x: (prev.x + curr.x + next.x) / 3, y: (prev.y + curr.y + next.y) / 3 };
    }
    return out;
  }

  // compute per-shape perimeter (use contours if present), but base on smoothed geometry
  const shapePerims = shapes.map(shp => {
    if (shp.contours && shp.contours.length > 0) {
      let sum = 0;
      for (let c of shp.contours) {
        const offset = c.offset, len = c.length;
        const orig = shp.points.slice(offset, offset + len);
        const sm = smoothPointsSimple(orig);
        for (let i = 0; i < len; i++) {
          const a = sm[i];
          const b = sm[(i + 1) % len];
          sum += dist(a.x, a.y, b.x, b.y);
        }
      }
      return sum;
    } else {
      // treat full point ring as one contour
      const pts = shp.points;
      const sm = smoothPointsSimple(pts);
      let sum = 0;
      for (let i = 0; i < sm.length; i++) {
        const a = sm[i];
        const b = sm[(i + 1) % sm.length];
        sum += dist(a.x, a.y, b.x, b.y);
      }
      return sum;
    }
  });

  const totalPerim = shapePerims.reduce((a, b) => a + b, 0);
  const fallback = totalPerim <= 0;

  // compute float allocation per shape
  let floatCounts = shapes.map((shp, idx) => {
    if (fallback) {
      const totalPts = Math.max(1, shapes.reduce((s, sh) => s + sh.points.length, 0));
      return newAmount * (shp.points.length / totalPts);
    } else {
      return newAmount * (shapePerims[idx] / totalPerim);
    }
  });

  // round + enforce minimum
  let counts = floatCounts.map(fc => Math.max(MIN_PER_SHAPE, Math.round(fc)));
  // adjust to exact newAmount
  let sum = counts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (sum < newAmount) { counts[i % counts.length]++; sum++; i++; }
  i = 0;
  while (sum > newAmount) {
    if (counts[i % counts.length] > MIN_PER_SHAPE) { counts[i % counts.length]--; sum--; }
    i++;
    if (i > counts.length * 5) break;
  }
  // if still mismatched, brute adjust
  i = 0;
  while (sum > newAmount) { counts[i % counts.length]--; sum--; i++; }

  // resample each shape (preserving contours when present)
  for (let s = 0; s < shapes.length; s++) {
    const shp = shapes[s];
    const target = Math.max(MIN_PER_SHAPE, counts[s] || MIN_PER_SHAPE);

    if (shp.contours && shp.contours.length > 0) {
      // compute each contour perimeter using smoothed geometry
      const contourLens = shp.contours.map(c => {
        const orig = shp.points.slice(c.offset, c.offset + c.length);
        const sm = smoothPointsSimple(orig);
        let L = 0;
        for (let k = 0; k < sm.length; k++) {
          const a = sm[k];
          const b = sm[(k + 1) % sm.length];
          L += dist(a.x, a.y, b.x, b.y);
        }
        return L;
      });
      const totalContourLen = contourLens.reduce((a, b) => a + b, 0);
      const contourFallback = totalContourLen <= 0;

      // float allocation per contour
      let floatContourCounts = shp.contours.map((c, ci) => {
        if (contourFallback) {
          return target * (c.length / Math.max(1, shp.contours.reduce((acc, cc) => acc + cc.length, 0)));
        } else {
          return target * (contourLens[ci] / totalContourLen);
        }
      });

      // round + enforce minimum per contour
      let contourCounts = floatContourCounts.map(fc => Math.max(MIN_PER_CONTOUR, Math.round(fc)));
      let ssum = contourCounts.reduce((a, b) => a + b, 0);
      let ii = 0;
      while (ssum < target) { contourCounts[ii % contourCounts.length]++; ssum++; ii++; }
      ii = 0;
      while (ssum > target) {
        if (contourCounts[ii % contourCounts.length] > MIN_PER_CONTOUR) { contourCounts[ii % contourCounts.length]--; ssum--; }
        ii++;
        if (ii > contourCounts.length * 5) break;
      }
      ii = 0;
      while (ssum > target) { contourCounts[ii % contourCounts.length]--; ssum--; ii++; }

      // resample each contour using smoothed source and rebuild shape
      const newPoints = [];
      const newVels = [];
      const newContours = [];
      let offset = 0;
      for (let ci = 0; ci < shp.contours.length; ci++) {
        const c = shp.contours[ci];
        const orig = shp.points.slice(c.offset, c.offset + c.length);
        const smoothedOrig = smoothPointsSimple(orig);
        const targ = Math.max(MIN_PER_CONTOUR, contourCounts[ci] || MIN_PER_CONTOUR);
        const res = resampleClosed(smoothedOrig, targ);
        for (let rp of res) newPoints.push({ x: rp.x, y: rp.y });
        for (let k = 0; k < res.length; k++) newVels.push({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) });
        newContours.push({ offset: offset, length: res.length, direction: c.direction || 1 });
        offset += res.length;
      }
      shp.points = newPoints;
      shp.velocities = newVels;
      shp.contours = newContours;
    } else {
      // single-ring resample (use smoothed source to avoid collapsed segments)
      const smoothedSrc = smoothPointsSimple(shp.points);
      const res = resampleClosed(smoothedSrc, target);
      shp.points = res;
      shp.velocities = res.map(() => ({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) }));
      shp.contours = null;
    }
  }

  // sync primary refs and global amount (total vertices)
  points = shapes[0].points;
  velocities = shapes[0].velocities;
  amount = newAmount;

  // restore mutation state
  shouldMutate = prevShouldMutate;
}

function polygonArea(pts) {
  if (!pts || pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += (a.x * b.y - b.x * a.y);
  }
  return sum / 2; // signed area (positive/negative indicates winding)
}

async function importDefaultSVG() {
  try {
    const resp = await fetch('./uglyph.svg');
    if (!resp.ok) {
      console.warn('Default SVG not found (./uglyph.svg), generating shape');
      generateShape();
      return;
    }
    const svgText = await resp.text();
    // reuse existing handleFileDrop parser by emulating a dropped file object
    const file = { type: 'image', subtype: 'svg+xml', data: svgText };
    handleFileDrop(file);
  } catch (err) {
    console.warn('Error loading default SVG, generating shape', err);
    generateShape();
  }
}