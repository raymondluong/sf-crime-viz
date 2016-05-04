(function() {

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
    .attr('height', height)
    .attr('id', 'viz-svg');

  var vizRect = document.getElementById('viz-svg').getBoundingClientRect();

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
  // default values
  var filters = {
    radiusA: 1,
    radiusB: 1,
    locationA: [-122.458220811697, 37.7633123961354],
    locationB: [-122.43355503388, 37.783240028248],
    categories: [],
    resolutions: [],
    timeFrom: '00:00',
    timeTo: '23:59'
  };
  var allData = [];
  var visibleData = [];
  var pxPerMile = 72;

  // Fetch data
  d3.json('data/scpd_incidents.json', function(error, data) {
    if (error) return console.error(error);
    data = data.data.slice(0); // temporary to make developing faster    
    addPinsToDOM();
    initializeEventListeners();
    allData = data;
    visibleData = allData.filter(filterData);
    visualize();
  });

  function updateVisibleData() {
    svg.selectAll('.circle').data(visibleData).remove();
    visibleData = allData.filter(filterData);
    visualize();
  }

  // Add event listeners to each filter
  function initializeEventListeners() {

    // Radius A filter
    var radiusA = document.getElementById('radius-a');
    var radiusACircle = document.getElementById('radius-a-circle')
    radiusA.addEventListener('input', function() {
      // console.log('radius a new value is ' + this.value);
      filters.radiusA = radiusA.value;
      radiusACircle.setAttribute('r', radiusA.value * pxPerMile);
      updateVisibleData();
    });

    // Radius B filter
    var radiusB = document.getElementById('radius-b');
    var radiusBCircle = document.getElementById('radius-b-circle')
    radiusB.addEventListener('input', function() {
      // console.log('radius b new value is ' + this.value);
      filters.radiusB = radiusB.value;
      radiusBCircle.setAttribute('r', radiusB.value * pxPerMile);
      updateVisibleData();
    });

    // Multi select settings for category filter
    $('#select-category').multiSelect({
      selectionHeader: 'Viewing',
      selectableHeader: 'All',
      afterSelect: function(value){
        value.forEach(function(item) {
          filters.categories.push(item);
        });
        // console.log(filters.categories);
        updateVisibleData();
      },
      afterDeselect: function(value){
        filters.categories.splice(filters.categories.indexOf(value[0]), 1);
        // console.log(filters.categories);
        updateVisibleData();
      }
    });

    $('#select-category-all').click(function() {
      $('#select-category').multiSelect('select_all');
    });

    $('#select-category-none').click(function() {
      filters.categories = [];
      $('#select-category').multiSelect('deselect_all');
    });

    $('#select-category').multiSelect('select_all');

    // Multi select settings for resolution filter
    $('#select-resolution').multiSelect({
      selectionHeader: 'Viewing',
      selectableHeader: 'All',
      afterSelect: function(value){
        value.forEach(function(item) {
          filters.resolutions.push(item);
        });
        // console.log(filters.resolutions);
        updateVisibleData();
      },
      afterDeselect: function(value){
        filters.resolutions.splice(filters.resolutions.indexOf(value[0]), 1);
        // console.log(filters.resolutions);
        updateVisibleData();
      }
    });

    $('#select-resolution-all').click(function() {
      $('#select-resolution').multiSelect('select_all');
    });

    $('#select-resolution-none').click(function() {
      filters.resolutions = [];
      $('#select-resolution').multiSelect('deselect_all');
    });

    $('#select-resolution').multiSelect('select_all');
    // filters.resolutions = filters.resolutions.slice(1);

    // Time filter
    var timeFrom = document.getElementById('time-from');
    timeFrom.addEventListener('input', function() {
      filters.timeFrom = timeFrom.value;
    });

    var timeTo = document.getElementById('time-to');
    timeTo.addEventListener('input', function() {
      filters.timeTo = timeTo.value;
    })

    var submitButton = document.getElementById('submit-time');
    submitButton.addEventListener('click', updateVisibleData);
  }

  function filterData(d) {
    function filterTime(d) {
      return (filters.timeFrom < d.Time && d.Time < filters.timeTo);
    }

    function filterCategory(d) {
      return filters.categories.includes(d.Category);
    }

    function filterResolution(d) {
      return filters.resolutions.includes(d.Resolution);
    }

    function filterDistance(d) {
      if ((d3.geo.distance(filters.locationA, d.Location) * 3959) < filters.radiusA) {
        if ((d3.geo.distance(filters.locationB, d.Location) * 3959) < filters.radiusB) {
          return true;
        }
      }
      return false;
    }

    return (filterTime(d) && filterCategory(d) && filterResolution(d) && filterDistance(d));
  }

  function visualize() {

    var dataPoints = svg.selectAll('.circle')
    .data(visibleData);

    dataPoints.enter()
      .append('circle')
      .attr('cx', function(d) { 
        return projection(d.Location)[0]; 
      })
      .attr('cy', function(d) {
        return projection(d.Location)[1];
      })
      .attr('r', '2px')
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

    dataPoints.exit().remove();
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
  var pinAData = []; // pin A start location
  var pinBData = [{Location: [-122.43355503388, 37.783240028248], name: 'B'}]; // pin B start location
  var pinData = [
    {
      Location: [-122.458220811697, 37.7633123961354],
      name: 'A',
      image: 'img/pin-a.png',
      radius: 1 * pxPerMile,
      xy: projection([-122.458220811697, 37.7633123961354])
    },
    {
      Location: [-122.43355503388, 37.783240028248], 
      name: 'B',
      image: 'img/pin-b.png',
      radius: 1 * pxPerMile,
      xy: projection([-122.43355503388, 37.783240028248])
    }
  ];
  var pinSize = 40;
  var pinA, pinB, radiusA, radiusB;


  //Define drag behavior
  var pinDrag = d3.behavior.drag()
      .origin(function(d) { return d; })
      .on('dragstart', pinDragStart)
      .on('drag', pinDragDuring);
      
  function pinDragStart() {
    d3.event.sourceEvent.stopPropagation();
  }

  function pinDragDuring(d, i) {

    pinData[i].xy[0] += d3.event.dx;
    pinData[i].xy[1] += d3.event.dy;
    pinData[i].Location = projection.invert(pinData[i].xy);
    if (i === 0) {
      filters.locationA = pinData[i].Location;
    } else {
      filters.locationB = pinData[i].Location;
    }
    // console.log(pinData[i].Location);

    d3.select(this)
    .attr('transform', function() {
      return 'translate(' + [pinData[i].xy] + ')';
    });

    updateVisibleData();
  }

  // Setup map pins
  function addPinsToDOM() {

    var pinContainers = svg.selectAll('.pin-container')
      .data(pinData);

    var pinGroups = pinContainers.enter()
      .append('g')
      .attr('class', 'pin-group')
      .attr('transform', function(d, i) {
        return 'translate(' + [pinData[i].xy] + ')';
      })
      .call(pinDrag);

    var pinRadii = pinGroups.append('circle')
      .attr('r', pxPerMile)
      .attr('class', 'radius')
      .attr('id', function(d) {
        if (d.name === 'A') {
          return 'radius-a-circle';
        } else {
          return 'radius-b-circle';
        }
      });

    var pinImages = pinGroups.append('image')
      .attr('width', pinSize)
      .attr('height', pinSize)
      .attr('class', 'pin')
      .attr('id', function(d) {
        if (d.name === 'A') {
          return 'pin-a';
        } else {
          return 'pin-b';
        }
      })
      .attr('xlink:href', function(d) {
        return d.image;
      })
      .attr('x', function(d, i) {
        return - pinSize / 2;
      })
      .attr('y', function(d, i) {
        return - pinSize / 2;
      });

    pinA = document.getElementById('pin-a');
    pinB = document.getElementById('pin-b');
    radiusA = document.getElementById('radius-a-circle');
    radiusB = document.getElementById('radius-b-circle');
  }

})();