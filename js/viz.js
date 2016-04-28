/* ============ INITIAL SETUP ============ */

// Set up size
var width = 750;
var height = width;

// Set up projection that map is using
var projection = d3.geo.mercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([width / 2, height / 2]);

// Add svg element to the DOM
var svg = d3.select('#viz-container').append('svg')
  .attr('width', width)
  .attr('height', height);

// Add svg map
svg.append('image')
  .attr('width', width)
  .attr('height', height)
  .attr('xlink:href', 'img/sf-map.svg');


/* ============ PROCESS DATA TO VISUALIZE ============ */
var categories = [];
var resolutions = [];
var filters = {
  radiusA: null,
  radiusB: null,
  categories: [],
  resolutions: [],
  timeStart: null,
  timeEnd: null
};

// Fetch data
d3.json('data/scpd_incidents.json', function(error, data) {
  if (error) return console.error(error);
  console.log(data);
  data = data.data.slice(0, 50); // temporary to make developing faster
  processRawData(data);
  preloadDataToDOM();
  visualize(data);
});

// Get unique categories and districts from data
function processRawData(data) {
  data.forEach(function(item) {
    // Need commas to preserve uniquess and get around jQuery data attribute

    // Only push unique categories
    if (!categories.includes("\"" + item.Category + "\"")) {
      categories.push("\"" + item.Category + "\"");
    }

    // Only push unique resolutions
    if (!resolutions.includes("\"" + item.Resolution + "\"")) {
      resolutions.push("\"" + item.Resolution + "\"");
    }
  });
}

// Add each unique category to multi select form, then render multi select
function preloadDataToDOM() {
  var categoriesFilter = document.getElementById('select-category');
  categories.forEach(function(category) {
    categoriesFilter.innerHTML += "<option value=" + category + ">" + category.replace(/"/g, '') + "</option>";
  });

  var resolutionsFilter = document.getElementById('select-resolution');
  resolutions.forEach(function(resolution) {
    resolutionsFilter.innerHTML += "<option value=" + resolution + ">" + resolution.replace(/"/g, '') + "</option>";
  });

  // Initialize event listeners only after data has been loaded
  initializeEventListeners();
}

// Add event listeners to each filter
function initializeEventListeners() {

  // TODO: map pin event listeners

  // Radius A filter
  var radiusA = document.getElementById('radius-a');
  radiusA.addEventListener('input', function() {
    // input fires the callback when the slider is dragged
    // change fires the callback once the mouse is released
    // keep this in mind later for performance
    console.log('radius a new value is ' + this.value);
    filters[radiusA] = radiusA.value;
  });

  // Radius B filter
  var radiusB = document.getElementById('radius-b');
  radiusB.addEventListener('input', function() {
    // see performance not from radius a
    console.log('radius b new value is ' + this.value);
    filters[radiusB] = radiusB.value;
  });

  // Multi select settings for category filter
  $('#select-category').multiSelect({
    selectionHeader: 'Filtering',
    selectableHeader: 'Selectable',
    afterSelect: function(value){
      console.log('added ' + value + ' to category multiselect');
      filters.categories.push(value[0]);
      console.log(filters.categories);
    },
    afterDeselect: function(value){
      console.log('removed ' + value + ' from category multiselect');
      filters.categories.splice(filters.categories.indexOf(value[0]), 1);
      console.log(filters.categories);
    }
  });

  // Multi select settings for resolution filter
  $('#select-resolution').multiSelect({
    selectionHeader: 'Filtering',
    selectableHeader: 'Selectable',
    afterSelect: function(value){
      console.log('added ' + value + 'to resolution multiselect');
      filters.resolutions.push(value[0]);
      console.log(filters.resolutions);
    },
    afterDeselect: function(value){
      console.log('removed ' + value + 'from resolution multiselect');
      filters.resolutions.splice(filters.categories.indexOf(value[0]), 1);
      console.log(filters.resolutions);
    }
  });

  // Time filter
  var timeFrom = document.getElementById('time-from');
  var timeTo = document.getElementById('time-to');
  var timeSubmit = document.getElementById('time-submit');
  timeSubmit.addEventListener('click', function() {
    console.log('time from: ' + timeFrom.value); // stored as 24 hr time, which makes filtering the data so much easier
    console.log('time to: ' + timeTo.value);
  });
}

function visualize(data) {
  var filteredData = data;
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
    .attr('class', 'circle'); 
    // .call(drag)
}

// Define drag behavior
// var drag = d3.behavior.drag()
//     .origin(function(d) { return d; })
//     .on('dragstart', dragstarted)
//     .on('drag', dragged)
//     .on('dragend', dragended);

// function dragstarted(d) {
//   d3.event.sourceEvent.stopPropagation();
//   d3.select(this).classed('circle--drag', true);
// }

// function dragged(d) {
//   d3.select(this)
//   .attr('cx', function(d) {
//     return d3.event.sourceEvent.offsetX;
//   })
//   .attr('cy', function(d) {
//     return d3.event.sourceEvent.offsetY;
//   });
// }

// function dragended(d) {
//   d3.select(this).classed('circle--drag', false);
// }