;(function() {
  // With mega-props to Mary Rose Cook

  // Main game object - constructor, use with new
  // ----------------
  var Game = function() {
    var canvas = document.getElementById("soup");
    var screen = canvas.getContext('2d');
    var gameSize = { x: canvas.width, y: canvas.height };

    // Array to hold all the letters;
    this.bodies = [];
    
    // Add the letters
    this.bodies = this.bodies.concat(createLetters(this));

    // Add a mouse handler
    this.mouser = new Mouser(canvas);

    // make a reference to this for callbacks.
    var self = this;

    // Main game tick function.  Loops forever, running 60ish times a second.
    var tick = function() {
      
      // Update game state.
      self.update();
      
      // Draw game bodies.
      self.draw(screen, gameSize);
      
      // Queue up the next call to tick with the browser.
      requestAnimationFrame(tick);
    };
    // Start ticker
    tick();

  };

  Game.prototype  = {
    coefficientOfFriction: 0.037,
    // update() - runs main logic
    update: function() {
      var self = this;

      // returns true if b1 not colliding with any other bodies
      var notCollidingWithAnything = function(b1) {
        return self.bodies.filter(function(b2) {
            return colliding(b1, b2); 
        }).length === 0;
      };

      /* handle locations if items are colliding.
         
         collisions move obects in opposite direction (x and y) at speed of
         item1speed - item2speed.  This can be positive (keeps moving that direction)
         or negative (reverses direction)
        
         letters still colliding after handling speed/direction update above force one down one level (item moving slowest moves down)
      */
      var handleCollisions = function(bodies) {
        return bodies;
      };
      this.bodies = handleCollisions(this.bodies);

      // Call update on every body.
      for (var i = 0; i < this.bodies.length; i++) {
        this.bodies[i].update();
      }
    },
    // draw() - draws the game.
    draw: function(screen, gameSize) {
      // clear previous drawing
      screen.clearRect(0, 0, gameSize.x, gameSize.y);

      // Draw each body (rectangles for now, will be letters)
      for (var i = 0; i < this.bodies.length; i++) {
        drawRect(screen, this.bodies[i]);
      }
    },
    // addBody - adds a body to the bodies array.
    addBody: function(body) {
      this.bodies.push(body);
    }  
  };

  // Letters
  // --------

  // new Letter() - constructor
  var Letter = function(game, center) {
    this.speedUnit = 2;
    this.game = game;
    this.center = center;
    this.size = { x: 15, y: 15 };
    this.positionX = 0; // current x position
    this.positionY = 0; // current y position
    this.speedX = 0; // + values are right, - are left
    this.speedY = 0; // + values are down, - values are up
    this.level = 0; // 0 is the top level, -X values are below

  }

  Letter.prototype = {
    // **update()** updates the state of the Letter for a single tick.
    update: function() {
      // Move according to the current speedX and speedY
      this.center.x += this.speedX;
      this.center.y += this.speedY;

      // Decrease speed according to friction of the milk
      this.speedX = this.speedX > 0 ? this.speedX - (this.speedX * this.game.coefficientOfFriction) : 0;
      this.speedY = this.speedX > 0 ? this.speedY - (this.speedY * this.game.coefficientOfFriction) : 0;

      
      // Early stage:
      // Check whether the mouse is below the letter within 2 pixels
      // if so, call push up.
      var mouseState = this.game.mouser.mouseState;
      //console.log(mouseState);

      // Eventually:
      // $$$$ Check whether the mouse is near/on this letter, and is mousedown
      // If so, pushUp/Down/Left/Right accordingly
      // or add to the x/y speed in a radial logarithmic method
      // So if it's on center, don't add anything,  in fact, stop it.
      // If it's away from center, add with increasing coefficient
      // Until you reach the edge, if you're up to X points away from the edge
      // you're still pushing it, otherwise you're no longer pushing it.
      // !! But we have to check where the mouse was on the last tick
      // too because it matters not where the mosue is, but what direction
      // it is heading.  So if it's within range of the center
      // use that to calculate a radial to the center
      // of this letter, and then change the speed accordingly.
      // Whew!  Space invaders is easier.
    },
    pushUp: function() {
      this.speedY -= this.speedUnit;
      return this;
    },
    pushDown: function() {
      this.speedY += this.speedUnit;
      return this;
    },
    pushRight: function() {
      this.speedX += this.speedUnit;
      return this;
    },
    pushLeft: function() {
      this.speedX -= this.speedUnit;
      return this;
    }
  };

  // Creates letters
  var createLetters = function(game) {
    var letters = [];

    for (var i = 0; i < 24; i++) {
      // for now, put them in eight columns.
      var x = 30 + (i % 8) * 30;

      // for now put in three rows.
      var y = 30 + (i % 3) * 30;

      // Create letter.
      letters.push(new Letter(game, { x: x, y: y }));
    }
    return letters;
  };

  // Need some interactivity checker (keyboarder, mouse, etc.)

  // Mouse Handler
  // ---------------
  var Mouser = function(canvas) {
    // keeps track of mouse position and state
    this.mouseState = { x: 0, y: 0, mouseDown: false };

    this.getMousePos = function(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }

    self = this;

    // Mouse Events
    // -------------  
    // Mouse Position Tracker
    canvas.addEventListener('mousemove', function(evt) {
      var mousePos = getMousePos(canvas, evt);
      self.mouseState.x = mousePos.x;
      self.mouseState.y = mousePos.y;
    }, false);

    // Listen for button-down
    canvas.addEventListener('mousedown', function(evt) {
      self.mouseState.mouseDown = true;
    }, false);

    // Listen for button-up
    canvas.addEventListener('mouseup', function(evt) {
      self.mouseState.mouseDown = false;
    }, false);
  }

  // need "other fucnts"  colliding(),
  // Other functions
  // ---------------

  // **drawRect()** draws passed body as a rectangle to `screen`, the drawing context.
  var drawRect = function(screen, body) {
    screen.fillRect(
      body.center.x - body.size.x / 2, 
      body.center.y - body.size.y / 2,
      body.size.x, body.size.y
    );
  };

  // **colliding()** returns true if two passed bodies are colliding.
  // The approach is to test for five situations.  If any are true,
  // the bodies are definitely not colliding.  If none of them
  // are true, the bodies are colliding.
  // 1. b1 is the same body as b2.
  // 2. Right of `b1` is to the left of the left of `b2`.
  // 3. Bottom of `b1` is above the top of `b2`.
  // 4. Left of `b1` is to the right of the right of `b2`.
  // 5. Top of `b1` is below the bottom of `b2`.
  var colliding = function(b1, b2) {
    return !(
      b1 === b2 ||
        b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
        b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
        b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
        b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2
    );
  };

  // Start game
  // ----------

  // When the DOM is ready, create (and start) the game.
  window.addEventListener('load', function() {
    theGame = new Game();
  });

})();