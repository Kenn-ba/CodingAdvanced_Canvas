(function () {
    var canvas,
      ctx,
      circ,
      nodes,
      mouse,
      sensitivity,
      siblings_limit,
      density,
      nodes_qty,
      anchor_length,
      mouse_radius;
    
    // how close next node must be to activate connection (in px)
    // shorter distance == better connection (line width)
    sensitivity = 100;
    // note that siblings limit is not 'accurate' as the node can actually have more connections than this value that's because the node accepts sibling nodes with no regard to their current connections this is acceptable because potential fix would not result in significant visual difference
    // more siblings == bigger node
    siblings_limit = 10;
    // default node margin
    density = 50;
    // total number of nodes used (incremented after creation)
    nodes_qty = 0;
    // avoid nodes spreading
    anchor_length = 150;
    // highlight radius
    mouse_radius = 150;
    //Array van kleuren
    const kleuren = ["255, 0, 213","255,0,0","0, 255, 239","255,255,255","0,255,128","255,255,51"]; 
    
    const button = document.getElementById("myButton");
    button.addEventListener("click", function() {
      siblings_limit=10;
      sensitivity=100;
      density=50;
      anchor_length=150;
      mouse_radius=150;
    });

    let count = 0;
    document.addEventListener("click", function() {
      siblings_limit+=10;
      density+=10;
      sensitivity+=10;
      anchor_length+=10;
      mouse_radius+=10;
    });
      
    

    circ = 2 * Math.PI;
    nodes = [];
  
    canvas = document.querySelector("canvas");
    resizeWindow();
    mouse = {
      x: canvas.width / 2,
      y: canvas.height / 2
    };
    ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Ooops! Your browser does not support canvas :'(");
    }

    function colors(arr){
        const randomColor = Math.floor(Math.random() * arr.length);
        const item = arr[randomColor];
        return item;
    }
  
    function Node(x, y) {
      this.anchorX = x;
      this.anchorY = y;
      this.x = Math.random() * (x - (x - anchor_length)) + (x - anchor_length);
      this.y = Math.random() * (y - (y - anchor_length)) + (y - anchor_length);
      this.vx = Math.random() * 2 - 1;
      this.vy = Math.random() * 2 - 1;
      this.energy = Math.random() * 100;
      this.radius = Math.random();
      this.siblings = [];
      this.brightness = 0;
    }
  
    Node.prototype.drawNode = function () {
      var color = "rgba("+ colors(kleuren) + ", " + this.brightness + ")";
      ctx.beginPath();
      ctx.arc(
        this.x,
        this.y,
        2 * this.radius + (2 * this.siblings.length) / siblings_limit,
        0,
        circ
      );
      ctx.fillStyle = color;
      ctx.fill();
    };
  
    Node.prototype.drawConnections = function () {
      for (var i = 0; i < this.siblings.length; i++) {
        var color = "rgba("+ colors(kleuren) + ", " + this.brightness + ")";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.siblings[i].x, this.siblings[i].y);
        ctx.lineWidth = 1 - calcDistance(this, this.siblings[i]) / sensitivity;
        ctx.strokeStyle = color;
        ctx.stroke();
      }
    };
  
    Node.prototype.moveNode = function () {
      this.energy -= 2;
      if (this.energy < 1) {
        this.energy = Math.random() * 100;
        if (this.x - this.anchorX < -anchor_length) {
          this.vx = Math.random() * 2;
        } else if (this.x - this.anchorX > anchor_length) {
          this.vx = Math.random() * -2;
        } else {
          this.vx = Math.random() * 4 - 2;
        }
        if (this.y - this.anchorY < -anchor_length) {
          this.vy = Math.random() * 2;
        } else if (this.y - this.anchorY > anchor_length) {
          this.vy = Math.random() * -2;
        } else {
          this.vy = Math.random() * 4 - 2;
        }
      }
      this.x += (this.vx * this.energy) / 100;
      this.y += (this.vy * this.energy) / 100;
    };
  
    function initNodes() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes = [];
      for (var i = density; i < canvas.width; i += density) {
        for (var j = density; j < canvas.height; j += density) {
          nodes.push(new Node(i, j));
          nodes_qty++;
        }
      }
    }
  
    function calcDistance(node1, node2) {
      return Math.sqrt(
        Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
      );
    }
  
    function findSiblings() {
      var node1, node2, distance;
      for (var i = 0; i < nodes_qty; i++) {
        node1 = nodes[i];
        node1.siblings = [];
        for (var j = 0; j < nodes_qty; j++) {
          node2 = nodes[j];
          if (node1 !== node2) {
            distance = calcDistance(node1, node2);
            if (distance < sensitivity) {
              if (node1.siblings.length < siblings_limit) {
                node1.siblings.push(node2);
              } else {
                var node_sibling_distance = 0;
                var max_distance = 0;
                var s;
                for (var k = 0; k < siblings_limit; k++) {
                  node_sibling_distance = calcDistance(node1, node1.siblings[k]);
                  if (node_sibling_distance > max_distance) {
                    max_distance = node_sibling_distance;
                    s = k;
                  }
                }
                if (distance < max_distance) {
                  node1.siblings.splice(s, 1);
                  node1.siblings.push(node2);
                }
              }
            }
          }
        }
      }
    }
  
    function redrawScene() {
      resizeWindow();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      findSiblings();
      var i, node, distance;
      for (i = 0; i < nodes_qty; i++) {
        node = nodes[i];
        distance = calcDistance(
          {
            x: mouse.x,
            y: mouse.y
          },
          node
        );
        if (distance < mouse_radius) {
          node.brightness = 1 - distance / mouse_radius;
        } else {
          node.brightness = 0;
        }
      }
      for (i = 0; i < nodes_qty; i++) {
        node = nodes[i];
        if (node.brightness) {
          node.drawNode();
          node.drawConnections();
        }
        node.moveNode();
      }
      requestAnimationFrame(redrawScene);
    }
  
    function initHandlers() {
      document.addEventListener("resize", resizeWindow, false);
      canvas.addEventListener("mousemove", mousemoveHandler, false);
    }
  
    function resizeWindow() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  
    function mousemoveHandler(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
  
    initHandlers();
    initNodes();
    redrawScene();
  })();
  