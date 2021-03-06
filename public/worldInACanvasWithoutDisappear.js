
//Controls the two canvases. Decides when to add objects to them
var  Controller = function(heatData) {
  var self = this;
  self.item = 0;
  self.multiplier = 3;
  self.heatData = heatData;
  //static canvas doesn't get refreshed automatically. This one is used for the earth background.
  self.canvasStatic = new Canvas(false, $("#canvas1"), self.multiplier);
  //This one is used for the heat points
  self.canvasDynamic = new Canvas(true, $("#canvas2"), self.multiplier);

  // $("body").bind("getNewHeatPoints", $.proxy(self, "getHeatPoints"));

  self.getHeatPoints();
  // self.getWorld();
  $("body").bind("objRemoved", self.canvasStatic.drawObjsFromVars);
};

//Gets the world data points and draws them on the canvas.
Controller.prototype.getWorld = function() {
  var self = this;
  $.get("/pop.json", function(data) {
    for (var i=0; i+3<data.length; i+=3)
      //Adding the earth objects
      self.canvasStatic.addObj(new Circle(self.multiplier*(180 + data[i+1]),
                               self.multiplier*(90 - data[i]), 1, "rgba(0, 100, 200, 1)"));
    //refreshing the earth convas, just needs to do this once
    self.canvasStatic.refresh();
  });
};

//Get the heat points and draws them on the canvas.
Controller.prototype.getHeatPoints = function() {
  var self = this;
  //getting the data for the heat points
  $.get(self.heatData, function(data) {
    // data = data[2][1];
    setInterval(function() {
      var item = 3 * self.item++;
      if (item+3 > data.length) {
        //This is triggered when the data that was fetched has ended and new data is needed.
        // $("body").trigger("getNewHeatPoints");
        return;
      }
      var colorId = Math.min(data[item+2]*1000, 13);
      var color;
      if (colorId < 1)
        color = "blue";
      else if (colorId < 4)
        color = "green";
      else if (colorId < 13)
        color = "orange";
      else
        color = "red";
      //Adds a heat point
      self.canvasDynamic.addObj(new CircleDown
        (self.multiplier*(180 + data[item+1]),
         self.multiplier*(90 - data[item]), 7, color, 0.95));
    }, 1);

  });
}

//The canvas class
// - autoRefresh - whether the canvas should autorefresh itself
// - canvas - the canvas object
// - multiplier - the multiplier of the earth coordinates
var Canvas = function(autoRefresh, canvas, multiplier) {
  var self = this;
  this.canvas = canvas;
  this.multiplier = multiplier;
  this.width = 360*this.multiplier;
  this.height = 180*this.multiplier;
  this.canvas.attr("width", this.width);
  this.canvas.attr("height", this.height);
  this.ctx = this.canvas[0].getContext("2d");
  this.objs = [];
  this.removedObjs = [];

  if (!autoRefresh)
    return;

  setInterval(function() {
    self.refresh();
  }, 50);
};

Canvas.prototype.addObj = function(obj) {
  this.objs.push(obj);
}

Canvas.prototype.refresh = function() {
  this.clear();
  this.drawObjs();
};

Canvas.prototype.drawObjsFromVars = function(event, objs) {
  objs.forEach(function(value) {
    //ahem...
    value.draw(cont.canvasStatic.ctx);
  });
}

Canvas.prototype.drawObjs = function() {
  var self = this;
  var i = 0;
  var toBeRemoved = [];
  self.objs.forEach(function(value) {
    if (value.disappear)
      toBeRemoved.push(i);
    else
      value.draw(self.ctx);
    i++;
  });
  var removedItems = []
  toBeRemoved.forEach(function(value) {
    var removed = self.objs.splice(value, 1);
    removedItems.push(removed[0]);
  });
  if (removedItems.length > 0)
    $("body").trigger("objRemoved", [removedItems]);
};

Canvas.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};

var Circle = function(x, y, radius, style) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.style = style;
}

Circle.prototype.draw = function(ctx) {
  ctx.fillStyle = this.style;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
  ctx.closePath();
  ctx.fill();
}

//CircleDown is a circle which decreases in size as time goes by.
var CircleDown = function(x, y, radius, style, decreaseRate) {
  this.circle = new Circle(x, y, radius, style);
  this.disappear = false;
  this.decreaseRate = decreaseRate;
};

CircleDown.prototype.draw = function(ctx) {
  if (this.circle.radius < 2.5)
    this.disappear = true;
  else
    this.circle.radius *= this.decreaseRate;
  this.circle.draw(ctx);
};