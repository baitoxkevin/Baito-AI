import { logger } from '../../lib/logger';

// @ts-ignore
function n(e) {
  // @ts-ignore
  this.init(e || {});
}
n.prototype = {
  // @ts-ignore
  init: function (e) {
    // @ts-ignore
    this.phase = e.phase || 0;
    // @ts-ignore
    this.offset = e.offset || 0;
    // @ts-ignore
    this.frequency = e.frequency || 0.001;
    // @ts-ignore
    this.amplitude = e.amplitude || 1;
  },
  update: function () {
    return (
      // @ts-ignore
      (this.phase += this.frequency),
      // @ts-ignore
      (e = this.offset + Math.sin(this.phase) * this.amplitude)
    );
  },
  value: function () {
    return e;
  },
};

// @ts-ignore
function Line(e) {
  // @ts-ignore
  this.init(e || {});
}

Line.prototype = {
  // @ts-ignore
  init: function (e) {
    // @ts-ignore
    this.spring = e.spring + 0.1 * Math.random() - 0.05;
    // @ts-ignore
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    // @ts-ignore
    this.nodes = [];
    for (var t, n = 0; n < E.size; n++) {
      t = new Node();
      // @ts-ignore
      t.x = pos.x;
      // @ts-ignore
      t.y = pos.y;
      // @ts-ignore
      this.nodes.push(t);
    }
  },
  update: function () {
    // @ts-ignore
    let e = this.spring,
      // @ts-ignore
      t = this.nodes[0];
    // @ts-ignore
    t.vx += (pos.x - t.x) * e;
    // @ts-ignore
    t.vy += (pos.y - t.y) * e;
    // @ts-ignore
    for (var n, i = 0, a = this.nodes.length; i < a; i++)
      // @ts-ignore
      (t = this.nodes[i]),
        0 < i &&
          // @ts-ignore
          ((n = this.nodes[i - 1]),
          (t.vx += (n.x - t.x) * e),
          (t.vy += (n.y - t.y) * e),
          (t.vx += n.vx * E.dampening),
          (t.vy += n.vy * E.dampening)),
        // @ts-ignore
        (t.vx *= this.friction),
        // @ts-ignore
        (t.vy *= this.friction),
        (t.x += t.vx),
        (t.y += t.vy),
        (e *= E.tension);
  },
  draw: function () {
    let e,
      t,
      // @ts-ignore
      n = this.nodes[0].x,
      // @ts-ignore
      i = this.nodes[0].y;
    // @ts-ignore
    ctx.beginPath();
    // @ts-ignore
    ctx.moveTo(n, i);
    // @ts-ignore
    for (var a = 1, o = this.nodes.length - 2; a < o; a++) {
      // @ts-ignore
      e = this.nodes[a];
      // @ts-ignore
      t = this.nodes[a + 1];
      n = 0.5 * (e.x + t.x);
      i = 0.5 * (e.y + t.y);
      // @ts-ignore
      ctx.quadraticCurveTo(e.x, e.y, n, i);
    }
    // @ts-ignore
    e = this.nodes[a];
    // @ts-ignore
    t = this.nodes[a + 1];
    // @ts-ignore
    ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
    // @ts-ignore
    ctx.stroke();
    // @ts-ignore
    ctx.closePath();
  },
};

// @ts-ignore
function onMousemove(e) {
  function o() {
    lines = [];
    for (let e = 0; e < E.trails; e++)
      lines.push(new Line({ spring: 0.45 + (e / E.trails) * 0.025 }));
  }
  // @ts-ignore
  function c(e) {
    e.touches
      ? // @ts-ignore
        ((pos.x = e.touches[0].pageX), (pos.y = e.touches[0].pageY))
      : // @ts-ignore
        ((pos.x = e.clientX), (pos.y = e.clientY)),
      e.preventDefault();
  }
  // @ts-ignore
  function l(e) {
    // @ts-ignore
    1 == e.touches.length &&
      ((pos.x = e.touches[0].pageX), (pos.y = e.touches[0].pageY));
  }
  document.removeEventListener("mousemove", onMousemove),
    document.removeEventListener("touchstart", onMousemove),
    document.addEventListener("mousemove", c),
    document.addEventListener("touchmove", c),
    document.addEventListener("touchstart", l),
    c(e),
    o(),
    render();
}

function render() {
  // logger.debug("Render frame called");
  if (!ctx || !ctx.running) {
    // logger.debug("Canvas not running, { data: stopping animation" });
    return;
  }
  
  try {
    // Clear canvas
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Set drawing styles
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "hsla(" + Math.round(f.update()) + ",100%,50%,0.025)";
    ctx.lineWidth = 10;
    
    // Update and draw all lines
    for (let t = 0; t < E.trails; t++) {
      if (lines[t]) {
        lines[t].update();
        lines[t].draw();
      }
    }
    
    // Increment frame counter
    ctx.frame++;
    
    // Continue animation loop
    requestAnimationFrame(render);
  } catch (error) {
    logger.error("Error in render function:", error);
  }
}

function resizeCanvas() {
  if (!ctx) return;
  // @ts-ignore
  if (ctx.canvas) {
    // @ts-ignore
    ctx.canvas.width = window.innerWidth - 20;
    // @ts-ignore
    ctx.canvas.height = window.innerHeight;
  }
}

// @ts-ignore
var ctx,
  // @ts-ignore
  f,
  e = 0,
  pos = {},
  // @ts-ignore
  lines = [],
  E = {
    debug: true,
    friction: 0.5,
    trails: 80,
    size: 50,
    dampening: 0.025,
    tension: 0.99,
  };
function Node() {
  this.x = 0;
  this.y = 0;
  this.vy = 0;
  this.vx = 0;
}

// Add TypeScript interface for window
declare global {
  interface Window {
    canvasCleanup?: () => void;
  }
}

// Track global animation state
let globalAnimationId: number | null = null;
let globalIsRunning = false;

export const renderCanvas = function () {
  // logger.debug("Rendering canvas - function called");
  
  // Stop any existing animation
  if (globalAnimationId !== null) {
    // logger.debug("Canceling existing animation frame:", { data: globalAnimationId });
    cancelAnimationFrame(globalAnimationId);
    globalAnimationId = null;
  }
  
  // Set new running state
  globalIsRunning = true;
  
  // Local animation ID for this instance
  let animationFrameId: number | null = null;
  let isRunning = true;
  
  // Clean up any existing canvas animations first
  if (ctx) {
    // logger.debug("Cleaning up existing canvas");
    ctx.running = false;
    
    // Remove existing event listeners to prevent duplicates
    document.removeEventListener("mousemove", onMousemove);
    document.removeEventListener("touchstart", onMousemove);
    document.body.removeEventListener("orientationchange", resizeCanvas);
    window.removeEventListener("resize", resizeCanvas);
  }
  
  // Get or create canvas element
  const canvasElement = document.getElementById("canvas");
  if (!canvasElement) {
    // logger.debug("Canvas element not found, { data: creating it" });
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "canvas";
    newCanvas.width = window.innerWidth;
    newCanvas.height = window.innerHeight;
    newCanvas.style.position = "fixed";
    newCanvas.style.top = "0";
    newCanvas.style.left = "0";
    newCanvas.style.pointerEvents = "none";
    newCanvas.style.zIndex = "50"; // Make sure this matches the z-index in App.tsx
    document.body.appendChild(newCanvas);
    ctx = newCanvas.getContext("2d");
  } else {
    // logger.debug("Canvas element found, { data: getting context" });
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    ctx = canvasElement.getContext("2d");
  }
  
  if (!ctx) {
    logger.error("Could not get canvas context");
    return () => {}; // Return empty cleanup function
  }
  
  // logger.debug("Starting canvas animation");
  ctx.running = true;
  ctx.frame = 1;
  
  // Initialize oscillator
  f = new n({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });
  
  // Initialize lines
  lines = [];
  for (let i = 0; i < E.trails; i++) {
    lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
  }
  
  // Set initial mouse position to center of screen
  pos.x = window.innerWidth / 2;
  pos.y = window.innerHeight / 2;
  
  // Custom render function that captures animation frame ID
  const renderLoop = () => {
    if (!isRunning || !ctx) return;
    
    try {
      // Only log every 60 frames to reduce console spam
      if (ctx.frame % 60 === 0) {
        // logger.debug(`Canvas animation running - frame: ${ctx.frame}`);
      }
      
      // Clear canvas
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Set drawing styles
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "hsla(" + Math.round(f.update()) + ",100%,50%,0.025)";
      ctx.lineWidth = 10;
      
      // Update and draw all lines
      for (let t = 0; t < E.trails; t++) {
        if (lines[t]) {
          lines[t].update();
          lines[t].draw();
        }
      }
      
      // Increment frame counter
      ctx.frame++;
      
      // Continue animation loop (only if still running)
      if (isRunning) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    } catch (error) {
      logger.error("Error in render function:", error);
      isRunning = false;
    }
  };
  
  // Add event listeners
  document.addEventListener("mousemove", onMousemove);
  document.addEventListener("touchstart", onMousemove);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
  
  // Ensure canvas size is correct
  resizeCanvas();
  
  // Start the animation
  // logger.debug("Starting render loop");
  animationFrameId = requestAnimationFrame(renderLoop);
  
  // Store the animation ID globally
  globalAnimationId = animationFrameId;
  
  // Return cleanup function
  return function cleanup() {
    // logger.debug("Cleaning up canvas animation");
    
    // Stop animation
    isRunning = false;
    globalIsRunning = false;
    
    // Cancel animation frame
    if (animationFrameId !== null) {
      // logger.debug("Canceling animation frame:", { data: animationFrameId });
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    if (globalAnimationId !== null) {
      // logger.debug("Canceling global animation frame:", { data: globalAnimationId });
      cancelAnimationFrame(globalAnimationId);
      globalAnimationId = null;
    }
    
    // Remove event listeners
    document.removeEventListener("mousemove", onMousemove);
    document.removeEventListener("touchstart", onMousemove);
    document.body.removeEventListener("orientationchange", resizeCanvas);
    window.removeEventListener("resize", resizeCanvas);
    
    // Clear canvas if it exists
    if (ctx && ctx.canvas) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    // Reset context
    ctx = null;
    
    // logger.debug("Canvas cleanup complete");
  };
};