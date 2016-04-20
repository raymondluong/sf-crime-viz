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