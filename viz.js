// Set up size
var width = 600,
height = width;

// Set up projection that map is using
var projection = d3.geo.mercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([width / 2, height / 2]);

// Add an svg element to the DOM
var svg = d3.select('#viz-container').append('svg')
  .attr('width', width)
  .attr('height', height);

// Add svg map at correct size, assumes map is saved in a subdirectory called 'data'
svg.append('image')
  .attr('width', width)
  .attr('height', height)
  .attr('xlink:href', 'sf-map.svg');

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

// Drag behavior
function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("circle--drag", true);
}

function dragged(d) {
  d3.select(this)
  .attr('cx', function(d) {
    return d3.event.sourceEvent.offsetX;
  })
  .attr('cy', function(d) {
    return d3.event.sourceEvent.offsetY;
  });
}

function dragended(d) {
  d3.select(this).classed("circle--drag", false);
}

// Load data 
var data;
d3.json('scpd_incidents.json', function(error, data) {
  if (error) return console.error(error);
  console.log(data);
  visualize(data);
});

function visualize(data) {
  var filteredData = data.data.slice(0, 10);
  svg.selectAll('circle')
    .data(filteredData).enter()
    .append('circle')
    .attr('cx', function(d) { 
      return projection(d.Location)[0]; 
    })
    .attr('cy', function(d) {
      return projection(d.Location)[1];
    })
    .attr('r', '5px')
    .attr('class', 'circle')  
    .call(drag)
}

