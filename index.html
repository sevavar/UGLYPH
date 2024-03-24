let points = [];
let fillColor;
let bgColor;
let strokeColor;
//noStroke();
  
function setup() {
  createCanvas(windowWidth, windowHeight);
  bgColor = color(random(255), random(255), random(255));
  fillColor = color(random(255), random(255), random(255));
  strokeColor = color(random(255), random(255), random(255));
  

  
  for (let i = 0; i < 50000; i++) {
    let angle = map(i, 0, 3950, 0, TWO_PI);
    let x = 200 * cos(angle);
    let y = 200 * sin(angle);
    points.push({ x: x, y: y });
  }
}

function draw() {
      background(bgColor);
  translate(width / 2, height / 2);
 // strokeWeight(0);
stroke(strokeColor);
strokeWeight(3);
noStroke();
  fill(fillColor);

  // Move shape points towards the mouse cursor
  for (let i = 0; i < points.length; i++) {
    let d = dist(mouseX - width / 2, mouseY - height / 2, points[i].x, points[i].y);
    if (d < 50) {
      points[i].x += (mouseX - width / 2 - points[i].x) * 0.5;
      points[i].y += (mouseY - height / 2 - points[i].y) * 0.5;
    }
  }
  
  // Smooth out the points
  for (let i = 0; i < points.length; i++) {
    let prev = points[(i - 1 + points.length) % points.length];
    let curr = points[i];
    let next = points[(i + 1) % points.length];
    
    let smoothedX = (prev.x + 2 * curr.x + next.x) / 4;
    let smoothedY = (prev.y + 2 * curr.y + next.y) / 4;
    
    curr.x = smoothedX;
    curr.y = smoothedY;
  }

  // Draw the shape using beginShape and vertex functions
  beginShape();
  for (let i = 0; i < points.length; i++) {
    vertex(points[i].x, points[i].y);
  }
  
  // Shaking animation for the shape points
 // for (let i = 0; i < points.length; i++) {
  //  points[i].x += random(-2, 2);
  //  points[i].y += random(-2, 2);
 // }
  
  endShape(CLOSE);
}
