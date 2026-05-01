
let version = "UGLYPH v1.1"

let shapes = []; // Each item: { points: [{x,y},...], velocities: [{vx,vy},...] }
let importedShapes = null; // store for reload/reset


// Blob
let points = []; // Array to store blob vertex points
let amount = 4000; // Number of blob points
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
let strokeColor; // Separate stroke color for "dual" fill mode
const _fillModes = ['filled', 'outline', 'dual'];
let fillMode = _fillModes[Math.floor(Math.random() * _fillModes.length)];
let strokeW = Math.floor(Math.random() * 30) + 1; // 1–30
let cursorStrokeW;
let cursorColor = 'red';
let showGrid = true;
let edgeColor = 'black';

// Modifier
let currentMode = "attract";
let touchRadius = 50;
let touchForce = 10;
let smoothing = 1;
let explosionForce = 20;
let explodeVels = []; // per-shape, per-point outward velocities for gradual explosion


//Mutation
let shouldMutate = true;
let smoothingEnabled = true;
let velocities = [];
let mutationSpeed = 7;
let noiseScale = 0.25;
let amplitude = 1;
let frequency = 10;
let collisionDistance = 5;


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


let header; // Global label reference for header with recording status
let vertexLabel; // Global label reference for vertex count slider
let textInput; // Global reference for text input field
let appliedScale = 1;


// Video

let isResized = false;
let button;
let encoder;
const frate = 60 // frame rate;
let numFrames = 150; // num of frames to record (adjustable via UI)
let recording = false;
let recordedFrames = 0;
let count = 0;
let frameSkip = 1; // Adjust this value to control frame skipping
let frameCounter = 0;

//  GIF
let recordingGif = false;
let gifStartFrame = 0;
let gifRendering = false;

// PNG export
let savingPNG = false;

// Recording status states
let showDoneMessage = false;
let doneMessageStartFrame = 0;

function initEncoder() {
  return HME.createH264MP4Encoder().then(enc => {
    encoder = enc;
    encoder.outputFilename = 'uglyph.mp4';
    // Ensure dimensions are multiples of 2 (required by H264 encoder)
    encoder.width = Math.floor(width / 2) * 2;  // Round down to nearest even number
    encoder.height = Math.floor(height / 2) * 2; // Round down to nearest even number
    encoder.frameRate = frate;
    encoder.kbps = 80000; // Video quality
    encoder.groupOfPictures = 10; // Lower for fast actions
    encoder.initialize();
    console.log('Encoder initialized:', encoder.width, 'x', encoder.height);
    return encoder;
  });
}
function resetEncoder() {
  if (encoder) {
    try {
      encoder.finalize(); // Always finalize before deleting
    } catch (err) {
      // Ignore finalize errors if encoder wasn't used
    }
    encoder.delete();
  }
  return initEncoder();
}

function startMP4Recording() {
  console.log('Starting MP4 recording, reinitializing encoder with current canvas size...');
  recordedFrames = 0;
  
  // Clean up existing encoder properly
  if (encoder) {
    try {
      encoder.finalize(); // Finalize before deleting
    } catch (err) {
      // Ignore finalize errors if encoder wasn't used
    }
    encoder.delete();
  }
  
  // Get actual pixel dimensions (accounts for pixel density)
  const density = pixelDensity();
  const actualWidth = width * density;
  const actualHeight = height * density;
  
  // Ensure dimensions are multiples of 2 (required by H264 encoder)
  const evenWidth = Math.floor(actualWidth / 2) * 2;
  const evenHeight = Math.floor(actualHeight / 2) * 2;
  
  HME.createH264MP4Encoder().then(enc => {
    encoder = enc;
    encoder.outputFilename = 'uglyph.mp4';
    encoder.width = evenWidth;
    encoder.height = evenHeight;
    encoder.frameRate = frate;
    encoder.kbps = 80000;
    encoder.groupOfPictures = 10;
    encoder.initialize();
    console.log('Encoder ready for recording:', encoder.width, 'x', encoder.height, `(density: ${density})`);
    
    // Start recording only after encoder is initialized
    recording = true;
  }).catch(err => {
    console.error('Failed to initialize encoder:', err);
  });
}

function recordVideo() {
  if (!encoder) {
    console.warn('Encoder not ready yet');
    recording = false;
    return;
  }
  
  // Get actual pixel dimensions
  const density = pixelDensity();
  const actualWidth = width * density;
  const actualHeight = height * density;
  
  // Use the same even dimensions as encoder (round down to nearest even number)
  const evenWidth = Math.floor(actualWidth / 2) * 2;
  const evenHeight = Math.floor(actualHeight / 2) * 2;
  
  // Verify dimensions match
  if (encoder.width !== evenWidth || encoder.height !== evenHeight) {
    console.error(`Dimension mismatch! Encoder: ${encoder.width}x${encoder.height}, Expected: ${evenWidth}x${evenHeight} (density: ${density})`);
    recording = false;
    return;
  }
  
  // Capture current canvas frame at even pixel resolution
  const ctx = canvas.elt.getContext('2d');
  const imageData = ctx.getImageData(0, 0, evenWidth, evenHeight);
  
  // Add frame to encoder
  encoder.addFrameRgba(imageData.data);
  recordedFrames++;
  
  console.log(`Recording frame ${recordedFrames}/${numFrames}`);
}
let fillModeKnob = null; // global ref so toggleFillMode() can sync the knob
let knobs = {};          // all knob references for external sync

function makeKnob(parent, label, config) {
  // config.continuous: { min, max, value, onChange }
  // config.discrete:   { modes: [], index, onChange }
  const wrapper = createDiv();
  wrapper.class('knob-wrapper');
  wrapper.parent(parent);

  const dial = createDiv('<div class="knob-indicator"></div>');
  dial.class('knob-dial');
  dial.parent(wrapper);

  const lbl = createDiv(label);
  lbl.class('knob-label');
  lbl.parent(wrapper);

  const valEl = createDiv('');
  valEl.class('knob-val');
  valEl.parent(wrapper);

  function angle() {
    if (config.continuous) {
      const { min, max, value } = config.continuous;
      return -135 + ((value - min) / (max - min)) * 270;
    }
    const { modes, index } = config.discrete;
    return -135 + (index / (modes.length - 1)) * 270;
  }

  function display() {
    return config.continuous
      ? Math.round(config.continuous.value)
      : config.discrete.modes[config.discrete.index];
  }

  function sync() {
    dial.elt.style.transform = `rotate(${angle()}deg)`;
    valEl.html(display());
  }
  sync();

  let dragging = false, startY, startVal;

  dial.elt.addEventListener('mousedown', e => {
    dragging = true;
    startY = e.clientY;
    startVal = config.continuous ? config.continuous.value : config.discrete.index;
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dy = startY - e.clientY;
    if (config.continuous) {
      const { min, max, onChange } = config.continuous;
      config.continuous.value = Math.max(min, Math.min(max, startVal + (dy / 100) * (max - min)));
      if (onChange) onChange(config.continuous.value);
    } else {
      const { modes, onChange } = config.discrete;
      const ni = Math.max(0, Math.min(modes.length - 1, startVal - Math.round(dy / 40)));
      if (ni !== config.discrete.index) {
        config.discrete.index = ni;
        if (onChange) onChange(ni);
      }
    }
    sync();
  });

  document.addEventListener('mouseup', () => { dragging = false; });

  return { dial, sync, config };
}

function updateColorSquares() {
  if (!fillColor) return;
  const r = Math.round(red(fillColor)), g = Math.round(green(fillColor)), b = Math.round(blue(fillColor));
  const c = `rgb(${r},${g},${b})`;
  if (buttons.recolor) buttons.recolor.elt.style.background = c;
  if (buttons.invertColors) {
    const bgDark = red(bgColor) < 128;
    buttons.invertColors.elt.style.background = bgDark
      ? `linear-gradient(135deg, #fff 50%, #000 50%)`
      : `linear-gradient(135deg, #000 50%, #fff 50%)`;
  }
}

function updateToggleSquares() {
  if (buttons.dots) buttons.dots.elt.classList.toggle('active', showDots);
  if (buttons.grid) buttons.grid.elt.classList.toggle('active', showGrid);
}

function createCollapsableSection(parent, title, isOpen) {
  let sectionHeader = createDiv(
    `<span class="section-title">${title}</span><span class="section-arrow">${isOpen ? '▾' : '▸'}</span>`
  );
  sectionHeader.class('sectionName sectionToggle');
  sectionHeader.parent(parent);

  let content = createDiv();
  content.class('section-content');
  if (!isOpen) content.addClass('collapsed');
  content.parent(parent);

  sectionHeader.mousePressed(() => {
    const isCollapsed = content.elt.classList.contains('collapsed');
    if (isCollapsed) {
      content.removeClass('collapsed');
      sectionHeader.elt.querySelector('.section-arrow').textContent = '▾';
    } else {
      content.addClass('collapsed');
      sectionHeader.elt.querySelector('.section-arrow').textContent = '▸';
    }
  });

  return content;
}

function initDraggablePanel() {
  const panel = document.getElementById('ui-container');
  const dragHandle = panel ? panel.querySelector('.label-container') : null;
  if (!panel || !dragHandle) return;

  let isDragging = false;
  let dragStartX, dragStartY, panelStartX, panelStartY;

  dragHandle.addEventListener('mousedown', (e) => {
    if (e.target.closest('a')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = `${panelStartX + (e.clientX - dragStartX)}px`;
    panel.style.top  = `${panelStartY + (e.clientY - dragStartY)}px`;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });
}

function createUI() {
  if (showUI === true) {
    let uiContainer = select('#ui-container');

    // Label 1 - Header with recording status
    header = createP(`
      <span class="label-left">UGLYPH v1.0</span>
      <span class="label-right"><a href="https://retry.studio" target="_blank" rel="noopener"><img src="./assets/retry.svg" class="header-retry-icon"></a></span>
    `);
    header.class('label-container');
    header.parent(uiContainer);

    // Section 0: TYPE
    let section0 = createP('TYPE');

    section0.class('sectionName');
    section0.parent(uiContainer);

    // Type Text Input Field
    let textInputWrapper = createDiv();
    textInputWrapper.class('text-input-wrapper');
    textInputWrapper.parent(uiContainer);

    textInput = createInput('');
    textInput.attribute('placeholder', 'Your text here...');
    textInput.class('text-input');
    textInput.input(() => {
      const inputText = textInput.value();
      if (inputText.trim().length > 0) {
        pendingDefaultWord = null; // user is typing — cancel any pending default
        // Stop mutation when user is typing
        shouldMutate = false;
        smoothingEnabled = false;
        // Convert text to SVG and load it
        convertTextToSVG(inputText);
      } else {
        // Clear the canvas when input is empty
        shapes = [];
        points = [];
        velocities = [];
        amount = 0;
      }
    });
    textInput.parent(textInputWrapper);

    // Section 1: IMPORT (always visible)
    let section1Header = createP('OR IMPORT');
    section1Header.class('sectionName');
    section1Header.parent(uiContainer);
    let section1Content = createDiv();
    section1Content.class('section-content');
    section1Content.parent(uiContainer);

    // Upload SVG Button
    buttons.uploadSVG = createButton(`
      <span class="left-align">⬆</span>
      <span class="center-align">Upload SVG</span>
      <span class="right-align">⬆</span>
    `);
    buttons.uploadSVG.class('button');
    buttons.uploadSVG.mousePressed(() => {
      // Stop mutation when uploading new SVG
      shouldMutate = false;
      smoothingEnabled = false;
      
      // Create hidden file input (Safari requires it to be in DOM)
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = '.svg';
      input.style.display = 'none';
      document.body.appendChild(input);
      
      input.onchange = (e) => {
        let file = e.target.files[0];
        if (file) {
          let reader = new FileReader();
          reader.onload = (event) => {
            // Create p5.js-compatible file object
            const p5File = {
              type: 'image',
              subtype: 'svg+xml',
              data: event.target.result,
              name: file.name
            };
            handleFileDrop(p5File);
            // Clean up
            document.body.removeChild(input);
          };
          reader.onerror = () => {
            console.error('Error reading file');
            document.body.removeChild(input);
          };
          reader.readAsDataURL(file);
        } else {
          document.body.removeChild(input);
        }
      };
      
      // Trigger click
      input.click();
    });
    buttons.uploadSVG.parent(section1Content);

    // Section 2: MUTATION (collapsable, open by default)
    let section2Content = createCollapsableSection(uiContainer, 'MUTATION', true);

    // Button container for 3 square icon buttons
    let controlButtonsContainer = createDiv();
    controlButtonsContainer.class('icon-button-container');
    controlButtonsContainer.parent(section2Content);

    // Reload Button (Full Reset: stop mutation + freeze + reload)
    buttons.reload = createButton('<img src="assets/reload.svg" class="button-icon">');
    buttons.reload.class('icon-button');
    buttons.reload.mousePressed(() => {
      shouldMutate = false;
      smoothingEnabled = false;
      reloadWindow();
    });
    buttons.reload.parent(controlButtonsContainer);

    // Stop Button (Stop mutation only)
    buttons.stop = createButton('<img src="assets/stop.svg" class="button-icon">');
    buttons.stop.class('icon-button');
    buttons.stop.mousePressed(() => {
      shouldMutate = false;
      // Pause smoothing after 3 seconds
      setTimeout(() => {
        smoothingEnabled = false;
        // Update play/pause button icon
        buttons.playPause.html('<img src="assets/play.svg" class="button-icon">');
      }, 200);
    });
    buttons.stop.parent(controlButtonsContainer);

    // Play/Pause Toggle Button
    buttons.playPause = createButton(
      smoothingEnabled 
        ? '<img src="assets/pause.svg" class="button-icon">' 
        : '<img src="assets/play.svg" class="button-icon">'
    );
    buttons.playPause.class('icon-button');
    buttons.playPause.mousePressed(() => {
      smoothingEnabled = !smoothingEnabled;
      // When pressing play (enabling smoothing), also enable mutation
      if (smoothingEnabled) {
        shouldMutate = true;
      }
      buttons.playPause.html(
        smoothingEnabled 
          ? '<img src="assets/pause.svg" class="button-icon">' 
          : '<img src="assets/play.svg" class="button-icon">'
      );
    });
    buttons.playPause.parent(controlButtonsContainer);

    // Size slider
    const sizeSliderWrapper = createDiv('');
    sizeSliderWrapper.class('slider-wrapper');
    sizeSliderWrapper.parent(section2Content);

    const sizeLabel = createDiv(`
      <span class="label-left">Size</span>
      <span class="label-right">${blobSize}</span>
    `);
    sizeLabel.class('slider-label');
    sizeLabel.parent(sizeSliderWrapper);

    sliders.size = createSlider(0, 1000, blobSize);
    sliders.size.class('slider');
    sliders.size.input(() => {
      let oldSize = blobSize;
      blobSize = sliders.size.value();
      sizeLabel.html(`<span class="label-left">Size</span><span class="label-right">${blobSize}</span>`);
      if (oldSize > 0) {
        const sf = blobSize / oldSize;
        for (let s = 0; s < shapes.length; s++) {
          const shp = shapes[s];
          for (let i = 0; i < shp.points.length; i++) {
            shp.points[i].x *= sf; shp.points[i].y *= sf;
          }
        }
        appliedScale *= sf;
        if (shapes.length > 0) {
          points = shapes[0].points;
          velocities = shapes[0].velocities;
          amount = points.length;
        }
      }
    });
    sliders.size.parent(sizeSliderWrapper);

    // Mutation knob row: Vertices + Intensity + Collision
    const mutRow = createDiv();
    mutRow.class('appearance-knob-row');
    mutRow.parent(section2Content);

    knobs.amount = makeKnob(mutRow, 'VERTICES', {
      continuous: { min: 100, max: 10000, value: amount,
        onChange: (v) => { resampleTotal(Math.round(v)); }
      }
    });

    knobs.mutationSpeed = makeKnob(mutRow, 'INTENSITY', {
      continuous: { min: 0, max: 50, value: mutationSpeed,
        onChange: (v) => {
          mutationSpeed = Math.round(v);
          for (let s = 0; s < shapes.length; s++) {
            const shp = shapes[s];
            if (!shp.velocities || shp.velocities.length !== shp.points.length) {
              shp.velocities = shp.points.map(() => ({ vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) }));
            } else {
              for (let i = 0; i < shp.velocities.length; i++) {
                shp.velocities[i].vx = random(-mutationSpeed, mutationSpeed);
                shp.velocities[i].vy = random(-mutationSpeed, mutationSpeed);
              }
            }
          }
          if (shapes.length > 0) velocities = shapes[0].velocities;
        }
      }
    });

    knobs.collisionDistance = makeKnob(mutRow, 'COLLISION', {
      continuous: { min: 0, max: 15, value: collisionDistance,
        onChange: (v) => { collisionDistance = v; }
      }
    });

    // Section 3: INTERACTION (collapsable, open by default)
    let section3Content = createCollapsableSection(uiContainer, 'INTERACTION', true);

    let buttonContainer1 = createDiv();
    buttonContainer1.class('button-container');
    buttonContainer1.parent(section3Content);

     // Repulse Button
    buttons.repulseButton = createButton(`
      <span class="center-align"><•> Push</span>
    `);
    buttons.repulseButton.class('mediumbutton');
    buttons.repulseButton.mousePressed(() => setBrushMode('repulse'));
    buttons.repulseButton.parent(buttonContainer1);

    // Attract Button
    buttons.attractButton = createButton(`
      <span class="center-align">>•< Pull</span>
    `);
    buttons.attractButton.class('mediumbutton');
    buttons.attractButton.mousePressed(() => setBrushMode('attract'));
    buttons.attractButton.parent(buttonContainer1);

   

    buttons.explode = createButton(`
      <span class="left-align">✱</span>
      <span class="center-align">Explode</span>
      <span class="right-align">X</span>`);

    buttons.explode.class('button');
    buttons.explode.mousePressed(explode);
    buttons.explode.parent(section3Content);

    // Interaction knob row: Radius + Force + Explosion
    const intRow = createDiv();
    intRow.class('appearance-knob-row');
    intRow.parent(section3Content);

    knobs.touchRadius = makeKnob(intRow, 'RADIUS', {
      continuous: { min: 10, max: 200, value: touchRadius,
        onChange: (v) => { touchRadius = Math.round(v); }
      }
    });

    knobs.touchForce = makeKnob(intRow, 'FORCE', {
      continuous: { min: 20, max: 200, value: touchForce,
        onChange: (v) => { touchForce = Math.round(v); }
      }
    });

    knobs.explosionForce = makeKnob(intRow, 'EXPLODE', {
      continuous: { min: 1, max: 50, value: explosionForce,
        onChange: (v) => { explosionForce = Math.round(v); }
      }
    });

    // Section 4: APPEARANCE (collapsable, open by default)
    let section4Content = createCollapsableSection(uiContainer, 'APPEARANCE', true);

    // Appearance knob row: Fill Mode + Stroke Width
    const appRow = createDiv();
    appRow.class('appearance-knob-row');
    appRow.parent(section4Content);

    const fillModes = ['outline', 'filled', 'dual'];
    const fillKnob = makeKnob(appRow, 'FILL', {
      discrete: { modes: fillModes, index: Math.max(0, fillModes.indexOf(fillMode)),
        onChange: (i) => {
          fillMode = fillModes[i];
          for (let s = 0; s < shapes.length; s++) shapes[s].fillMode = fillMode;
        }
      }
    });
    fillModeKnob = fillKnob;
    buttons.switchStyle = fillKnob.dial;

    knobs.strokeW = makeKnob(appRow, 'STROKE', {
      continuous: { min: 1, max: 200, value: strokeW,
        onChange: (v) => { strokeW = Math.round(v); }
      }
    });

    // Row 2: Color squares — recolor | mono split
    let colorRow = createDiv();
    colorRow.class('appearance-square-row');
    colorRow.parent(section4Content);

    buttons.recolor = createDiv();
    buttons.recolor.class('app-square color-square');
    buttons.recolor.mousePressed(() => { recolor(); updateColorSquares(); });
    buttons.recolor.parent(colorRow);

    buttons.invertColors = createDiv();
    buttons.invertColors.class('app-square mono-square');
    buttons.invertColors.mousePressed(() => { invertColors(); updateColorSquares(); });
    buttons.invertColors.parent(colorRow);

    // Row 3: Toggle squares — dots | grid
    let toggleRow = createDiv();
    toggleRow.class('appearance-square-row');
    toggleRow.parent(section4Content);

    buttons.dots = createDiv('DOTS');
    buttons.dots.class('app-square toggle-square' + (showDots ? ' active' : ''));
    buttons.dots.mousePressed(() => { showDots = !showDots; updateToggleSquares(); });
    buttons.dots.parent(toggleRow);

    buttons.grid = createDiv('GRID');
    buttons.grid.class('app-square toggle-square' + (showGrid ? ' active' : ''));
    buttons.grid.mousePressed(() => { showGrid = !showGrid; updateToggleSquares(); });
    buttons.grid.parent(toggleRow);

    // Section 5: EXPORT (collapsable, closed by default)
    let section5Content = createCollapsableSection(uiContainer, 'EXPORT', true);

    // Frames slider
    const numFramesSliderWrapper = createDiv('');
    numFramesSliderWrapper.class('slider-wrapper');
    numFramesSliderWrapper.parent(section5Content);

    const numFramesLabel = createDiv(`
      <span class="label-left">Frames (GIF, MP4)</span>
      <span class="label-right">${numFrames}</span>
    `);
    numFramesLabel.class('slider-label');
    numFramesLabel.parent(numFramesSliderWrapper);

    sliders.numFrames = createSlider(50, 500, numFrames);
    sliders.numFrames.class('slider');
    sliders.numFrames.input(() => {
      numFrames = sliders.numFrames.value();
      numFramesLabel.html(`<span class="label-left">Frames (GIF, MP4)</span><span class="label-right">${numFrames}</span>`);
      gifDuration = numFrames;
    });
    sliders.numFrames.parent(numFramesSliderWrapper);

    // First row of export buttons
    let buttonContainer2Row1 = createDiv();
    buttonContainer2Row1.class('export-button-row');
    buttonContainer2Row1.parent(section5Content);

    // PNG Button
    buttons.sPNG = createButton(`
      <span class="center-align">PNG</span>
    `);
    buttons.sPNG.class('export-button');
    buttons.sPNG.mousePressed(savePNG);
    buttons.sPNG.parent(buttonContainer2Row1);

    // SVG Button
    buttons.sSVG = createButton(`
      <span class="center-align">SVG</span>
    `);
    buttons.sSVG.class('export-button');
    buttons.sSVG.mousePressed(copyAndSaveSVG);
    buttons.sSVG.parent(buttonContainer2Row1);

    // Second row of export buttons
    let buttonContainer2Row2 = createDiv();
    buttonContainer2Row2.class('export-button-row');
    buttonContainer2Row2.parent(section5Content);

    // GIF Button
    buttons.sGIF = createButton(`
      <span class="center-align">GIF</span>
    `);
    buttons.sGIF.class('export-button');
    buttons.sGIF.mousePressed(recordGIF);
    buttons.sGIF.parent(buttonContainer2Row2);

    // MP4 Button
    buttons.sMP4 = createButton(`
      <span class="center-align">MP4</span>
    `);
    buttons.sMP4.class('export-button');
    buttons.sMP4.mousePressed(startMP4Recording);
    buttons.sMP4.parent(buttonContainer2Row2);


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

  // Canvas fills full screen — UI panel floats above it
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(canvasContainer);
  canvas.drop(handleFileDrop); // Allow SVG file to be dropped on canvas
  frameRate(frate);

  currentWidth = windowWidth;
  currentHeight = windowHeight;
  showUI = true;
  //generateShape();
  importDefaultSVG();
  initEncoder();
  recolor();
  updateColorSquares();
  updateToggleSquares();
  initDraggablePanel();

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
  resizeCanvas(windowWidth, windowHeight);
  isResized = true;
}
function keyPressed() {
  // Don't process keyboard shortcuts when text input is focused
  if (document.activeElement && document.activeElement.classList.contains('text-input')) {
    return;
  }
  
  switch (keyCode) {
    case 65: // 'A'
      toggleAttractionRepulsion();
      // Update button states to show the newly active mode
      updateButtonStates();
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
      animateButtonClick(buttons.sPNG);
      break;
    case 68: // 'D'
      //toggleDots();
      // print(dotsEnabled);
      break;
    case 70: // 'F'
      toggleFillMode();
      animateButtonClick(buttons.switchStyle);
      break;
    //case 72: // 'H'
    //toggleTextGUI();
    //break;
    case 73: // 'I'
      invertColors();
      animateButtonClick(buttons.invertColors);
      break;
    case 77: // 'M'
      toggleMutation();
      animateButtonClick(buttons.stop);
      break;
    case 88: // 'X'
      explode();
      animateButtonClick(buttons.explode);
      break;
    case 71: // 'G'
      showGrid = !showGrid;
      updateToggleSquares();
      break;
    case 74: // 'J'
      recordGIF();
      animateButtonClick(buttons.sGIF);
      break;
    case 83: // 'S'
      copyAndSaveSVG();
      animateButtonClick(buttons.sSVG);
      break;
    case 86: //'V'
      recording = true;
      animateButtonClick(buttons.sMP4);
      break;
    case 72: // 'H'
      toggleDots();
      animateButtonClick(buttons.dots);
      break;
    case 72: // 'H'
      //showUI = false;
      break;
    case 82: // 'R'
      recolor();
      animateButtonClick(buttons.recolor);
      break;
    case 27: // 'Esc'
      reloadWindow();
      animateButtonClick(buttons.reload);
      break;
    case 32: // 'Space'
      toggleSmoothing();
      animateButtonClick(buttons.playPause);
      event.preventDefault(); // This prevents scrolling
      break;
  }
}

// Simulate button click animation when keyboard shortcut is pressed
function animateButtonClick(button) {
  if (!button) return;
  
  // Get the button element (it's a p5.Element, so access the DOM element)
  const btnElement = button.elt;
  
  // Store original styles
  const originalBg = btnElement.style.backgroundColor;
  const originalColor = btnElement.style.color;
  
  // Apply active state styles
  btnElement.style.backgroundColor = '#fff';
  btnElement.style.color = '#000';
  
  // Restore original styles after 100ms
  setTimeout(() => {
    btnElement.style.backgroundColor = originalBg;
    btnElement.style.color = originalColor;
  }, 100);
}
function toggleSmoothing() {
  smoothingEnabled = !smoothingEnabled;
}
function toggleFillMode() {
  if (fillMode === "filled") {
    fillMode = "outline";
  } else if (fillMode === "outline") {
    fillMode = "dual";
  } else {
    fillMode = "filled";
  }

  // Ensure all existing shapes follow the global fillMode
  for (let s = 0; s < shapes.length; s++) {
    shapes[s].fillMode = fillMode;
  }

  // Sync fill mode slider
  if (buttons.switchStyle && buttons.switchStyle.value) {
    buttons.switchStyle.value(['outline', 'filled', 'dual'].indexOf(fillMode));
  }
}
function toggleAttractionRepulsion() {
  currentMode = (currentMode === 'repulse') ? 'attract' : 'repulse';
}
function explode() {
  // Give every point a random velocity impulse; applied gradually each frame
  explodeVels = [];
  for (let s = 0; s < shapes.length; s++) {
    const shp = shapes[s];
    const shpVels = shp.points.map(() => ({
      vx: random(-explosionForce, explosionForce) * 0.5,
      vy: random(-explosionForce, explosionForce) * 0.5
    }));
    explodeVels.push(shpVels);
  }
  // keep UI refs in sync
  if (shapes.length > 0) {
    points = shapes[0].points;
    velocities = shapes[0].velocities;
    amount = points.length;
  }
}
function recolor() {
  // Helper: calculate perceived brightness (luminance) of a color
  function getBrightness(c) {
    const r = red(c) / 255;
    const g = green(c) / 255;
    const b = blue(c) / 255;
    // WCAG luminance formula
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Helper: generate random color and ensure minimum brightness difference
  function getRandomColorWithConstraint(otherColors, minDifference = 0.3) {
    let newColor;
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 20) {
      newColor = color(random(255), random(255), random(255));
      const newBrightness = getBrightness(newColor);
      
      // Check if this color differs enough from all existing colors
      valid = otherColors.every(otherColor => {
        const otherBrightness = getBrightness(otherColor);
        return Math.abs(newBrightness - otherBrightness) >= minDifference;
      });
      
      attempts++;
    }
    return newColor;
  }

  // Pick background color first
  bgColor = color(random(255), random(255), random(255));
  
  // Fill color must contrast with background (minimum 0.35 difference)
  fillColor = getRandomColorWithConstraint([bgColor], 0.35);
  
  // Stroke/edge color should differ from both background and fill
  edgeColor = getRandomColorWithConstraint([bgColor, fillColor], 0.3);

  // Dual-mode stroke color: contrasts with both bg and fill
  strokeColor = getRandomColorWithConstraint([bgColor, fillColor], 0.3);
  
  guiTextColor = 'white';
  cursorColor = 'white';
  updateColorSquares();
}
function invertColors() {
  const isBlackBg = red(bgColor) < 128;
  bgColor   = isBlackBg ? color(255) : color(0);
  fillColor = isBlackBg ? color(0)   : color(255);
  strokeColor = fillColor;
  edgeColor   = fillColor;
  updateColorSquares();
}
function savePNG() {
  savingPNG = true;
  redraw();
  save(createFileName('uglyph', 'png'));
  savingPNG = false;
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

    // Build the path data string (shared across all modes)
    let d = '';
    if (shp.contours && shp.contours.length > 0) {
      for (let ci = 0; ci < shp.contours.length; ci++) {
        const c = shp.contours[ci];
        const offset = c.offset;
        const len = c.length;
        for (let i = 0; i < len; i++) {
          const pt = shp.points[offset + i];
          const cmd = (i === 0) ? 'M' : 'L';
          d += `${cmd} ${pt.x + centerX} ${pt.y + centerY} `;
        }
        d += 'Z ';
      }
    } else {
      d = shp.points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x + centerX} ${pt.y + centerY}`).join(' ');
      d += ' Z';
    }

    if (mode === "dual") {
      // Stroke path (behind): stroke only, no fill
      let strokePath = document.createElementNS(svgNS, 'path');
      strokePath.setAttribute('d', d);
      strokePath.setAttribute('fill', 'none');
      strokePath.setAttribute('stroke', colorToString(strokeColor));
      strokePath.setAttribute('stroke-width', strokeW);
      svg.appendChild(strokePath);

      // Fill path (on top): fill only, no stroke
      let fillPath = document.createElementNS(svgNS, 'path');
      fillPath.setAttribute('d', d);
      fillPath.setAttribute('fill', colorToString(fillColor));
      fillPath.setAttribute('fill-rule', 'evenodd');
      fillPath.setAttribute('stroke', 'none');
      svg.appendChild(fillPath);
    } else {
      let path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);

      if (mode === "filled") {
        path.setAttribute('fill', colorToString(fillColor));
        path.setAttribute('fill-rule', 'evenodd');
        path.setAttribute('stroke', 'none');
      } else if (mode === "outline") {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', colorToString(fillColor));
        path.setAttribute('stroke-width', strokeW);
      }
      svg.appendChild(path);
    }

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
  console.log('Starting GIF recording...');
  recordingGif = true;
  gifRendering = false;
  showDoneMessage = false; // Clear any previous done message
  gifStartFrame = frameCount; // Track when GIF recording started
  
  saveGif('uglyph.gif', numFrames, { 
    units: 'frames',
    silent: true // Hide p5's default notifications
  }).then(() => {
    // This callback fires when GIF is completely done (after rendering)
    console.log('GIF save complete (callback fired), showing done message');
    recordingGif = false;
    gifRendering = false;
    // Cursor already restored when rendering started
    // Show "Done!" message
    showDoneMessage = true;
    doneMessageStartFrame = frameCount;
  }).catch(err => {
    console.error('GIF save error:', err);
    recordingGif = false;
    gifRendering = false;
  });
  
  // After recording frames are captured, show "Rendering..." during encoding
  // We'll detect this in draw() when frames reach numFrames
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
  // Restore original point positions from importedShapes snapshot and re-seed velocities
  if (importedShapes && importedShapes.length === shapes.length) {
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      const snap = importedShapes[s];
      // Restore positions
      for (let i = 0; i < Math.min(shp.points.length, snap.points.length); i++) {
        shp.points[i].x = snap.points[i].x;
        shp.points[i].y = snap.points[i].y;
      }
      // Re-seed velocities so play works after reset
      if (shp.velocities) {
        for (let i = 0; i < shp.velocities.length; i++) {
          shp.velocities[i].vx = random(-mutationSpeed, mutationSpeed);
          shp.velocities[i].vy = random(-mutationSpeed, mutationSpeed);
        }
      }
    }
  } else {
    // Fallback: re-seed velocities
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      if (shp.velocities) {
        for (let i = 0; i < shp.velocities.length; i++) {
          shp.velocities[i].vx = random(-mutationSpeed, mutationSpeed);
          shp.velocities[i].vy = random(-mutationSpeed, mutationSpeed);
        }
      }
    }
  }

  // Keep compatibility aliases for UI & code using points/velocities
  if (shapes.length > 0) {
    points = shapes[0].points;
    velocities = shapes[0].velocities;
    amount = shapes.reduce((sum, s) => sum + s.points.length, 0);
    if (knobs && knobs.amount) {
      knobs.amount.config.continuous.value = amount;
      knobs.amount.sync();
    }
  }
}
function toggleDots() {
  showDots = !showDots;
  updateToggleSquares();
}
function applyPanelCollision() {
  const panelEl = document.getElementById('ui-container');
  if (!panelEl || shapes.length === 0) return;

  const rect = panelEl.getBoundingClientRect();
  const cx = width / 2, cy = height / 2;
  const x1 = rect.left - cx,  y1 = rect.top - cy;
  const x2 = rect.right - cx, y2 = rect.bottom - cy;
  const margin = 20;

  for (let s = 0; s < shapes.length; s++) {
    const shp = shapes[s];
    const vels = shp.velocities;

    for (let i = 0; i < shp.points.length; i++) {
      const pt  = shp.points[i];
      const vel = vels && vels[i];

      // Broad-phase
      if (pt.x < x1 - margin || pt.x > x2 + margin) continue;
      if (pt.y < y1 - margin || pt.y > y2 + margin) continue;

      const inside = pt.x >= x1 && pt.x <= x2 && pt.y >= y1 && pt.y <= y2;

      if (inside) {
        // Hard push to nearest face + bounce velocity
        const dL = pt.x - x1, dR = x2 - pt.x, dT = pt.y - y1, dB = y2 - pt.y;
        const m = Math.min(dL, dR, dT, dB);
        if      (m === dL) { pt.x = x1 - 1; if (vel) vel.vx = -Math.abs(vel.vx); }
        else if (m === dR) { pt.x = x2 + 1; if (vel) vel.vx =  Math.abs(vel.vx); }
        else if (m === dT) { pt.y = y1 - 1; if (vel) vel.vy = -Math.abs(vel.vy); }
        else               { pt.y = y2 + 1; if (vel) vel.vy =  Math.abs(vel.vy); }
      } else {
        // Soft repulsion from the nearest point on the rect boundary
        const nearX = Math.max(x1, Math.min(x2, pt.x));
        const nearY = Math.max(y1, Math.min(y2, pt.y));
        const dx = pt.x - nearX, dy = pt.y - nearY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < margin && d > 0) {
          const strength = (1 - d / margin) * 2.5;
          const nx = dx / d, ny = dy / d;
          pt.x += nx * strength;
          pt.y += ny * strength;
          if (vel) { vel.vx += nx * strength * 0.3; vel.vy += ny * strength * 0.3; }
        }
      }
    }
  }
}

function draw() {

  // Update recording status in header (check in priority order)
  if (showDoneMessage) {
    // Show "Done!" for 90 frames (highest priority - overrides everything)
    if (frameCount - doneMessageStartFrame < 90) {
      header.html(`
        <span class="label-left">${version}</span>
        <span class="label-right" style="color: #00FF2F;">Done! <a href="https://retry.studio" target="_blank" rel="noopener"><img src="./assets/retry.svg" class="header-retry-icon"></a></span>
      `);
    } else {
      // Clear done message after 90 frames
      showDoneMessage = false;
      header.html(`
        <span class="label-left">${version}</span>
        <span class="label-right"><a href="https://retry.studio" target="_blank" rel="noopener"><img src="./assets/retry.svg" class="header-retry-icon"></a></span>
      `);
    }
  } else if (gifRendering && !showDoneMessage) {
    // GIF is rendering (only show if not done yet)
    header.html(`
      <span class="label-left">${version}</span>
      <span class="label-right" style="color: orange;">Rendering... <a href="https://retry.studio" target="_blank" rel="noopener"><img src="./assets/retry.svg" class="header-retry-icon"></a></span>
    `);
  } else if (recording || recordingGif) {
    let currentFrames;
    if (recording) {
      currentFrames = recordedFrames;
    } else {
      // For GIF, calculate frames since recording started
      currentFrames = Math.min(frameCount - gifStartFrame, numFrames);
      
      // When GIF reaches target frames, switch to rendering state
      if (currentFrames >= numFrames && recordingGif && !gifRendering) {
        gifRendering = true;
      }
    }
    header.html(`
      <span class="label-left">${version}</span>
      <span class="label-right" style="color: red;">${currentFrames} / ${numFrames} ● <a href="https://retry.studio" target="_blank" rel="noopener"><img src="./assets/retry.svg" class="header-retry-icon"></a></span>
    `);
  } else if (header) {
    header.html(`
      <span class="label-left">${version}</span>
      <span class="label-right"><a href="https://retry.studio" target="_blank" rel="noopener"><img src="./assets/retry.svg" class="header-retry-icon"></a></span>
    `);
  }

  // Sync play/pause button icon based on smoothingEnabled state
  if (buttons.playPause) {
    const currentIcon = smoothingEnabled ? 'pause' : 'play';
    const expectedHTML = `<img src="assets/${currentIcon}.svg" class="button-icon">`;
    if (buttons.playPause.html() !== expectedHTML) {
      buttons.playPause.html(expectedHTML);
    }
  }

  translate(width / 2, height / 2);
  background(bgColor);

  if (showGrid) {
    const step = 10;
    const invR = 255 - red(bgColor);
    const invG = 255 - green(bgColor);
    const invB = 255 - blue(bgColor);
    const gridColor = lerpColor(bgColor, color(invR, invG, invB), 0.35);
    const gridColorThick = color(invR, invG, invB);
    noFill();
    const cols = ceil(width / step) + 1;
    const rows = ceil(height / step) + 1;
    const startX = -floor(cols / 2) * step;
    const startY = -floor(rows / 2) * step;
    for (let i = 0; i <= cols; i++) {
      const x = startX + i * step;
      stroke(i % 10 === 0 ? gridColorThick : gridColor);
      strokeWeight(i % 10 === 0 ? 1 : 0.5);
      line(x, -height / 2, x, height / 2);
    }
    for (let j = 0; j <= rows; j++) {
      const y = startY + j * step;
      stroke(j % 10 === 0 ? gridColorThick : gridColor);
      strokeWeight(j % 10 === 0 ? 1 : 0.5);
      line(-width / 2, y, width / 2, y);
    }
  }

  strokeWeight(strokeW);

  if (fillMode === "filled") {
    fill(fillColor);
    stroke(fillColor);
  } else if (fillMode === "outline") {
    noFill();
    stroke(fillColor);
  } else if (fillMode === "dual") {
    fill(fillColor);
    stroke(strokeColor);
  }

  // Apply gradual explosion: move points outward and dampen velocity each frame
  if (explodeVels.length > 0) {
    let anyActive = false;
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      const sv = explodeVels[s];
      if (!sv) continue;
      for (let i = 0; i < shp.points.length; i++) {
        if (!sv[i]) continue;
        shp.points[i].x += sv[i].vx;
        shp.points[i].y += sv[i].vy;
        sv[i].vx *= 0.88;
        sv[i].vy *= 0.88;
        if (Math.abs(sv[i].vx) > 0.1 || Math.abs(sv[i].vy) > 0.1) anyActive = true;
      }
    }
    if (!anyActive) explodeVels = [];
  }

  // Run mutation (which updates shapes) - skip during GIF rendering
   if (smoothingEnabled && !gifRendering) {
    mutation();

    // per-shape smoothing: operate per-contour (contours are independent closed rings)
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      if (!shp || !shp.points || shp.points.length < 3) continue;

      // helper: smooth a consecutive range [offset, offset+len)
      function smoothRange(offset, len) {
        if (len < 3) return;
        if (len > _smoothTempX.length) {
          _smoothTempX = new Float32Array(len * 2);
          _smoothTempY = new Float32Array(len * 2);
        }
        const inv = 1 / (2 + smoothing);
        for (let i = 0; i < len; i++) {
          const prev = shp.points[offset + ((i - 1 + len) % len)];
          const curr = shp.points[offset + i];
          const next = shp.points[offset + ((i + 1) % len)];
          _smoothTempX[i] = (prev.x + smoothing * curr.x + next.x) * inv;
          _smoothTempY[i] = (prev.y + smoothing * curr.y + next.y) * inv;
        }
        for (let i = 0; i < len; i++) {
          shp.points[offset + i].x = _smoothTempX[i];
          shp.points[offset + i].y = _smoothTempY[i];
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

  applyPanelCollision();

  // Helper: draw just the geometry of a shape (no fill/stroke setup)
  function drawShapeGeometry(shp) {
    if (shp.contours && shp.contours.length > 0) {
      beginShape();
      const outer = shp.contours[0];
      for (let i = 0; i < outer.length; i++) {
        const pt = shp.points[outer.offset + i];
        vertex(pt.x, pt.y);
      }
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
  }

  // Draw each shape separately (outline / filled)
    for (let s = 0; s < shapes.length; s++) {
      const shp = shapes[s];
      if (!shp || shp.points.length === 0) continue;

      const mode = shp.fillMode || fillMode;

      if (mode === "dual") {
        // Pass 1: stroke only (behind)
        push();
        noFill();
        stroke(strokeColor);
        drawShapeGeometry(shp);
        pop();
        // Pass 2: fill only (on top, covers inner stroke)
        push();
        fill(fillColor);
        noStroke();
        drawShapeGeometry(shp);
        pop();
      } else {
        push();
        if (mode === "filled") {
          fill(fillColor);
          stroke(fillColor);
        } else if (mode === "outline") {
          noFill();
          stroke(fillColor);
        }
        drawShapeGeometry(shp);
        pop();
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
    }

  // Mouse interaction: apply attract/repulse to all shapes' points - skip during GIF rendering
  if (mouseIsPressed === true && !gifRendering) {
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

  // Draw cursor preview (hide during recording and PNG export)
  if (!recording && !recordingGif && !savingPNG) {
    fill(255, 255, 255, 255);
    noStroke();
    fill(100, 100, 100, 75);
    circle(mouseX - width / 2, mouseY - height / 2, touchRadius * 2);
    if (mouseIsPressed === true) {
      fill(guiTextColor);
      circle(mouseX - width / 2, mouseY - height / 2, touchRadius / 1.6);
    }
  }

  // Show/hide rendering overlay via HTML element
  const renderOverlay = document.getElementById('render-overlay');
  if (renderOverlay) {
    renderOverlay.style.display = gifRendering ? 'block' : 'none';
  }

  // Show/hide recording border on canvas container (only during recording, not rendering)
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    if ((recording || recordingGif) && !gifRendering) {
      canvasContainer.style.border = '5px solid red';
    } else {
      canvasContainer.style.border = 'none';
    }
  }

  // // theme toggles
  // if (bgColor === 'white') {
  //   document.body.classList.add('light-theme');
  //   document.body.classList.remove('dark-theme');
  // } else {
  //   document.body.classList.add('dark-theme');
  //   document.body.classList.remove('light-theme');
  // }

  // recording handling
  if (recording && recordedFrames < numFrames) {
    recordVideo();
  }

  if (recordedFrames >= numFrames && recording) {
    recording = false;
    console.log('Recording complete, finalizing...');

    try {
      encoder.finalize();
      const uint8Array = encoder.FS.readFile(encoder.outputFilename);
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(new Blob([uint8Array], { type: 'video/mp4' }));
      anchor.download = createFileName('uglyph', 'mp4');
      anchor.click();
      console.log('MP4 downloaded successfully');
      
      // Show "Done!" message for 90 frames
      showDoneMessage = true;
      doneMessageStartFrame = frameCount;
    } catch (err) {
      console.error('Error finalizing video:', err);
    } finally {
      recordedFrames = 0;
      resetEncoder(); // reinitialize encoder for next recording
    }
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

// Pre-allocated temp buffers for per-frame smoothing — avoids N object allocations per frame
let _smoothTempX = new Float32Array(16384);
let _smoothTempY = new Float32Array(16384);

// Pre-allocated typed arrays for mutation() — reused across frames to avoid per-frame GC pressure
let _mutFlatX  = new Float32Array(16384);
let _mutFlatY  = new Float32Array(16384);
let _mutFlatVX = new Float32Array(16384);
let _mutFlatVY = new Float32Array(16384);
let _mutMapS   = new Int32Array(16384);
let _mutMapGI  = new Int32Array(16384);
let _mutMapCI  = new Int32Array(16384);
let _mutMapLI  = new Int32Array(16384);
let _mutMapCL  = new Int32Array(16384);

function mutation() {
  if (!shouldMutate) return;

  // Count total points so we can grow typed arrays only when needed
  let totalPts = 0;
  for (let s = 0; s < shapes.length; s++) {
    if (shapes[s] && shapes[s].points) totalPts += shapes[s].points.length;
  }
  if (totalPts > _mutFlatX.length) {
    const cap = totalPts * 2;
    _mutFlatX  = new Float32Array(cap);
    _mutFlatY  = new Float32Array(cap);
    _mutFlatVX = new Float32Array(cap);
    _mutFlatVY = new Float32Array(cap);
    _mutMapS   = new Int32Array(cap);
    _mutMapGI  = new Int32Array(cap);
    _mutMapCI  = new Int32Array(cap);
    _mutMapLI  = new Int32Array(cap);
    _mutMapCL  = new Int32Array(cap);
  }

  // Fill typed arrays from shapes
  let n = 0;
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
          _mutFlatX[n] = shp.points[gi].x;
          _mutFlatY[n] = shp.points[gi].y;
          const v = (shp.velocities && shp.velocities[gi])
            ? shp.velocities[gi]
            : { vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) };
          _mutFlatVX[n] = v.vx;
          _mutFlatVY[n] = v.vy;
          _mutMapS[n]  = s;
          _mutMapGI[n] = gi;
          _mutMapCI[n] = ci;
          _mutMapLI[n] = li;
          _mutMapCL[n] = len;
          n++;
        }
      }
    } else {
      const len = shp.points.length;
      for (let li = 0; li < len; li++) {
        _mutFlatX[n] = shp.points[li].x;
        _mutFlatY[n] = shp.points[li].y;
        const v = (shp.velocities && shp.velocities[li])
          ? shp.velocities[li]
          : { vx: random(-mutationSpeed, mutationSpeed), vy: random(-mutationSpeed, mutationSpeed) };
        _mutFlatVX[n] = v.vx;
        _mutFlatVY[n] = v.vy;
        _mutMapS[n]  = s;
        _mutMapGI[n] = li;
        _mutMapCI[n] = 0;
        _mutMapLI[n] = li;
        _mutMapCL[n] = len;
        n++;
      }
    }
  }

  // Move all points by their velocities
  for (let k = 0; k < n; k++) {
    _mutFlatX[k] += 0.2 * _mutFlatVX[k];
    _mutFlatY[k] += 0.2 * _mutFlatVY[k];
  }

  // Build spatial grid — integer keys avoid per-frame string allocation
  const cellSize = Math.max(collisionDistance * 2, 10);
  // 50021 is prime and >> max expected |cellY| (~400 cells for an 8K canvas), guaranteeing unique keys
  const GRID_STRIDE = 50021;
  const grid = new Map();
  for (let k = 0; k < n; k++) {
    const cellX = Math.floor(_mutFlatX[k] / cellSize);
    const cellY = Math.floor(_mutFlatY[k] / cellSize);
    const key = cellX * GRID_STRIDE + cellY;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(k);
  }

  // Collision detection — each point lives in exactly one cell so j > k already
  // guarantees each pair is visited once; no separate checked-Set needed
  const reactionDistSq = collisionDistance * collisionDistance;
  for (let k = 0; k < n; k++) {
    const cellX = Math.floor(_mutFlatX[k] / cellSize);
    const cellY = Math.floor(_mutFlatY[k] / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const list = grid.get((cellX + dx) * GRID_STRIDE + (cellY + dy));
        if (!list) continue;
        for (const j of list) {
          if (j <= k) continue;

          // Skip very near neighbors within the same contour ring (including wrap)
          if (_mutMapS[k] === _mutMapS[j] && _mutMapCI[k] === _mutMapCI[j]) {
            const localDiff = Math.abs(_mutMapLI[k] - _mutMapLI[j]);
            const len = _mutMapCL[k];
            if (localDiff < 5 || localDiff > len - 5) continue;
          }

          const dxp = _mutFlatX[k] - _mutFlatX[j];
          const dyp = _mutFlatY[k] - _mutFlatY[j];
          const distSq = dxp * dxp + dyp * dyp;

          if (distSq < reactionDistSq && distSq > 0) {
            const distance = sqrt(distSq);
            _mutFlatVX[k] *= -1;
            _mutFlatVY[k] *= -1;
            _mutFlatVX[j] *= -1;
            _mutFlatVY[j] *= -1;

            const overlap = collisionDistance - distance;
            const pushX = (dxp / distance) * overlap * 0.5;
            const pushY = (dyp / distance) * overlap * 0.5;
            _mutFlatX[k] += pushX;
            _mutFlatY[k] += pushY;
            _mutFlatX[j] -= pushX;
            _mutFlatY[j] -= pushY;
          }
        }
      }
    }
  }

  // Boundary clamping and write-back to shapes
  const minX = -width  / 2 + strokeW / 2;
  const maxX =  width  / 2 - strokeW / 2;
  const minY = -height / 2 + strokeW / 2;
  const maxY =  height / 2 - strokeW / 2;
  for (let k = 0; k < n; k++) {
    if (_mutFlatX[k] < minX) { _mutFlatX[k] = minX; _mutFlatVX[k] *= -1; }
    if (_mutFlatX[k] > maxX) { _mutFlatX[k] = maxX; _mutFlatVX[k] *= -1; }
    if (_mutFlatY[k] < minY) { _mutFlatY[k] = minY; _mutFlatVY[k] *= -1; }
    if (_mutFlatY[k] > maxY) { _mutFlatY[k] = maxY; _mutFlatVY[k] *= -1; }

    const s  = _mutMapS[k];
    const gi = _mutMapGI[k];
    const shp = shapes[s];
    shp.points[gi].x = _mutFlatX[k];
    shp.points[gi].y = _mutFlatY[k];
    if (!shp.velocities) shp.velocities = [];
    if (!shp.velocities[gi]) shp.velocities[gi] = { vx: 0, vy: 0 };
    shp.velocities[gi].vx = _mutFlatVX[k];
    shp.velocities[gi].vy = _mutFlatVY[k];
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

// Load a font for text-to-path conversion
let textFont = null;
let fontLoaded = false;

// Default word list — pick one randomly on load
const defaultWords = [
  'ADAPT', 'BLOOM', 'GROW', 'EVOLVE',
  'INFECT', 'EXPAND', 'REPULSE', 'ATTRACT',
  'WARP', 'MORPH', 'EMERGE', 'ENLARGE', 'SPREAD',
  'SPAWN', 'EXPAND'
];
let pendingDefaultWord = defaultWords[Math.floor(Math.random() * defaultWords.length)];

// Try to load font on page load
if (typeof opentype !== 'undefined') {
  // Load local font file
  const fontUrl = './fonts/texgyreheros-bold.otf';

  console.log('Starting font load from:', fontUrl);

  opentype.load(fontUrl, function(err, font) {
    if (err) {
      console.error('Could not load local font:', err);
      fontLoaded = false;
    } else {
      textFont = font;
      fontLoaded = true;
      console.log('Local font loaded successfully');
      // If the default word is still pending (no user input yet), render it now
      if (pendingDefaultWord) {
        convertTextToSVG(pendingDefaultWord);
        pendingDefaultWord = null;
      }
    }
  });
} else {
  console.error('opentype.js library not found!');
}

function convertTextToSVG(text) {
  console.log('convertTextToSVG called with:', text);
  console.log('fontLoaded:', fontLoaded);
  
  // Check if opentype is available and font is loaded
  if (fontLoaded && textFont) {
    try {
      const fontSize = 120;
      const path = textFont.getPath(text, 0, fontSize, fontSize);
      const pathData = path.toPathData(2);
      
      console.log('Path data generated:', pathData.substring(0, 100) + '...');
      
      // Get bounding box
      const bbox = path.getBoundingBox();
      const padding = 20;
      const width = bbox.x2 - bbox.x1 + padding * 2;
      const height = bbox.y2 - bbox.y1 + padding * 2;
      
      // Create SVG with path
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      
      const pathElement = document.createElementNS(svgNS, "path");
      pathElement.setAttribute("d", pathData);
      pathElement.setAttribute("fill", "black");
      pathElement.setAttribute("transform", `translate(${-bbox.x1 + padding}, ${-bbox.y1 + padding})`);
      svg.appendChild(pathElement);
      
      // Convert to data URL and process as SVG
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgDataURL = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      
      console.log('Text converted to path successfully');
      
      const p5File = {
        type: 'image',
        subtype: 'svg+xml',
        data: svgDataURL,
        name: 'text.svg'
      };
      
      handleFileDrop(p5File);
      return;
      
    } catch (error) {
      console.error('Error converting text to path:', error);
    }
  }
  
  // Fallback to simple rectangle if font not loaded or error
  console.log('Using fallback rectangle');
  fallbackTextToRectangle(text);
}

function fallbackTextToRectangle(text) {
  // Fallback function (current rounded rectangle approach)
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');
  const fontSize = 120;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;
  
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  const padding = 20;
  const width = textWidth + padding * 2;
  const height = textHeight + padding * 2;
  
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  
  const path = document.createElementNS(svgNS, "path");
  const x = padding;
  const y = padding;
  const w = textWidth;
  const h = textHeight;
  
  const radius = 10;
  const pathData = `M ${x + radius} ${y} 
                     L ${x + w - radius} ${y} 
                     Q ${x + w} ${y} ${x + w} ${y + radius}
                     L ${x + w} ${y + h - radius}
                     Q ${x + w} ${y + h} ${x + w - radius} ${y + h}
                     L ${x + radius} ${y + h}
                     Q ${x} ${y + h} ${x} ${y + h - radius}
                     L ${x} ${y + radius}
                     Q ${x} ${y} ${x + radius} ${y}
                     Z`;
  
  path.setAttribute("d", pathData);
  path.setAttribute("fill", "black");
  svg.appendChild(path);
  
  const svgString = new XMLSerializer().serializeToString(svg);
  const svgDataURL = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  
  const p5File = {
    type: 'image',
    subtype: 'svg+xml',
    data: svgDataURL,
    name: 'text.svg'
  };
  
  handleFileDrop(p5File);
}

function traceBitmapToPath(imageData, width, height) {
  // This function is no longer needed but kept for compatibility
  return '';
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
      const targetTotal = (typeof knobs !== 'undefined' && knobs.amount) ? Math.round(knobs.amount.config.continuous.value) : amount;

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

      // Reset appliedScale for fresh imports (before applying scale)
      const isReload = (importedShapes !== null);
      if (!isReload) {
        appliedScale = 1;
      }
      
      // apply cumulative user scale so imported shapes preserve user's Size slider state
      // Only apply if we're reloading an existing import, not on fresh import
      if (appliedScale !== 1 && isReload) {
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

  // update importedShapes snapshot so reloadWindow restores to this vertex count
  if (importedShapes) {
    importedShapes = shapes.map(s => ({
      points: s.points.map(p => ({ x: p.x, y: p.y })),
      velocities: s.velocities.map(v => ({ vx: v.vx, vy: v.vy })),
      contours: s.contours ? s.contours.map(c => ({ offset: c.offset, length: c.length, direction: c.direction })) : null,
      fillMode: s.fillMode
    }));
  }

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
  // If font is already loaded, render the random word immediately
  if (fontLoaded && pendingDefaultWord) {
    convertTextToSVG(pendingDefaultWord);
    pendingDefaultWord = null;
  }
  // Otherwise the font-load callback will fire convertTextToSVG once ready
}