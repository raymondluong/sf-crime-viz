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

// Tooltip
var div = d3.select('body').append('div') 
    .attr('class', 'tooltip')       
    .style('opacity', 0);


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
  addPinsToDOM(); // Add pins after data points so they appear on top (z-index doesn't affect svg)
});

// Get unique categories and districts from data
function processRawData(data) {
  data.forEach(function(item) {
    // Need quotes to preserve uniquess and get around jQuery data attribute

    // Only push unique categories
    if (!categories.includes('\"' + item.Category + '\"')) {
      categories.push('\"' + item.Category + '\"');
    }

    // Only push unique resolutions
    if (!resolutions.includes('\"' + item.Resolution + '\"')) {
      resolutions.push('\"' + item.Resolution + '\"');
    }
  });
}

// Add each unique category to multi select form, then render multi select
function preloadDataToDOM() {
  var categoriesFilter = document.getElementById('select-category');
  categories.forEach(function(category) {
    categoriesFilter.innerHTML += '<option value=' + category + '>' + category.replace(/"/g, '') + '</option>';
  });

  var resolutionsFilter = document.getElementById('select-resolution');
  resolutions.forEach(function(resolution) {
    resolutionsFilter.innerHTML += '<option value=' + resolution + '>' + resolution.replace(/"/g, '') + '</option>';
  });

  // Initialize event listeners only after data has been loaded
  initializeEventListeners();
}

// Add event listeners to each filter
function initializeEventListeners() {

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
    .attr('class', 'circle')
    .on('mouseover', function(d) {   
      div.transition()    
        .duration(400)    
        .style('opacity', 0.9);    
      div.html(createTooltip(d))  
        .style('left', (d3.event.pageX) + 'px')   
        .style('top', (d3.event.pageY) + 'px');  
    })          
    .on('mouseout', function() {   
      div.transition()    
        .duration(400)
        .style('opacity', 0);
    }); 
}

function createTooltip(point) {
  var html = '';
  html += '<h1>' + toProperCase(point.Description) + '</h1>';
  html += '<br>Category: ' + toProperCase(point.Category);
  html += '<br>Resolution: ' + toProperCase(point.Resolution);
  html += '<br>Date: ' + toDateObject(point.Date).toDateString();
  html += '<br>Time: ' + point.Time;
  return html;
}

// Convert a string to proper capitalization
// Source: http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
function toProperCase(string) {
  return string.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Custom function to convert date in format YYYY-MM-DDT00:00:00 to string
// Passing in the date string from the data set into the Date constructor was off by one day due to time zone
function toDateObject(datestring) {
  var year = datestring.slice(0, 4);
  var month = parseInt(datestring.slice(5, 7)) - 1;
  var day = datestring.slice(8, 10);
  return new Date(year, month, day);
}

/* ============ MAP PINS ============ */
var pinA = [{Location: [-122.433701, 37.767683]}]; // pin A start location
var pinB = [{Location: [-122.423701, 37.767683]}]; // pin B start location
var pinSize = 40;

//Define drag behavior
var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on('dragstart', dragstarted)
    .on('drag', dragged)
    .on('dragend', dragended);

function dragstarted() {
  d3.event.sourceEvent.stopPropagation();
}

function dragged() {
  d3.select(this)
  .attr('transform', function() {
    var lat = d3.event.sourceEvent.offsetX - pinSize / 2;
    var long = d3.event.sourceEvent.offsetY - pinSize / 2;
    return 'translate(' + [lat, long] + ')';
  });
}

function dragended() {
  console.log('update filter');
}

// Setup map pins
function addPinsToDOM() {
  svg.selectAll('pin')
    .data(pinA).enter()
    .append('image')
    .attr('width', pinSize)
    .attr('height', pinSize)
    .attr('class', 'pin')
    .attr('xlink:href', 'img/pin-a.png')
    .attr('transform', function(d) {
      return 'translate(' + projection(d.Location) + ')';
    })
    .call(drag);

  svg.selectAll('pin')
    .data(pinB).enter()
    .append('image')
    .attr('width', pinSize)
    .attr('height', pinSize)
    .attr('class', 'pin')
    .attr('xlink:href', 'img/pin-b.png')
    .attr('transform', function(d) {
      return 'translate(' + projection(d.Location) + ')';
    })
    .call(drag);
}