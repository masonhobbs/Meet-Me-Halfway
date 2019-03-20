//JavaScript for fadeout of intial search buttons //
$(document).ready(function(){
  $("#submit-btn").click(function(){
    //I want Google default map controls to be hidden upon loading landing page
    $("#origin-landing").animate({left: '150%'}, 800);
    $("#destination-landing").animate({right: '150%'}, 800);
    $("#landing-page").fadeOut(1200);
    document.getElementById('origin-input').value = document.getElementById('origin-landing').value
    document.getElementById('destination-input').value = document.getElementById('destination-landing').value;
  });

  var map;
  var polyline = null;
  var info_window;
});

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat: 33.254521, lng: -97.152979},
    zoom: 13
  });
  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#FF0000',
    strokeWeight: 0
  });
  info_window = new google.maps.InfoWindow();

  new AutocompleteDirectionsHandler(map);
}

// Marker for halfway point
function create_marker(lat_lng, label, a_distance, b_distance) {
  var content = '<b>' + label + '</b>';
  var marker = new google.maps.Marker({
    position: lat_lng,
    map: map,
    title: label,
    zIndex: Math.round(lat_lng.lat()*-100000)<<5
  });
  marker.myname = label;
  google.maps.event.addListener(marker, 'click', function() {
        info_window.setContent(content
                                + '<br>' +marker.getPosition().toUrlValue(6)
                                + '<br>Distance from point A: ' + a_distance
                                + '<br>Distance from point B: ' + b_distance);
        info_window.open(map,marker);
  });

  return marker;
}

/**
 * @constructor
 */
function AutocompleteDirectionsHandler(map) {
  this.map = map;
  this.originPlaceId = null;
  this.destinationPlaceId = null;
  this.travelMode = 'DRIVING';
  this.directionsService = new google.maps.DirectionsService;
  this.directionsDisplay = new google.maps.DirectionsRenderer;
  this.directionsDisplay.setMap(map);

  var originInput = document.getElementById('origin-input'); //data field on home/map page
  var destinationInput = document.getElementById('destination-input'); //data field on home/map page
  var modeSelector = document.getElementById('mode-selector'); //buttons to choose between driving, walking, or transit
  var originLanding = document.getElementById('origin-landing'); //data field on landing page
  var destinationLanding = document.getElementById('destination-landing'); //data field on landing page

  var originAutocomplete = new google.maps.places.Autocomplete(originInput);
  // Specify just the place data fields that you need.
  originAutocomplete.setFields(['place_id']);

  var destinationAutocomplete =
      new google.maps.places.Autocomplete(destinationInput);
  // Specify just the place data fields that you need.
  destinationAutocomplete.setFields(['place_id']);

  var originLandingAutocomplete =
      new google.maps.places.Autocomplete(originLanding);
  // Specify just the place data fields that you need.
  originLandingAutocomplete.setFields(['place_id']);

  var destinationLandingAutocomplete =
      new google.maps.places.Autocomplete(destinationLanding);
  // Specify just the place data fields that you need.
  destinationLandingAutocomplete.setFields(['place_id']);

  this.setupClickListener('changemode-driving', 'DRIVING');
  this.setupClickListener('changemode-transit', 'TRANSIT');
  this.setupClickListener('changemode-walking', 'WALKING');

  this.setupPlaceChangedListener(originLandingAutocomplete, 'ORIG');
  this.setupPlaceChangedListener(destinationLandingAutocomplete, 'DEST');

  this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
  this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

//positioning of these features
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(
      destinationInput);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
}

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
AutocompleteDirectionsHandler.prototype.setupClickListener = function(
    id, mode) {
  var radioButton = document.getElementById(id);
  var me = this;

  radioButton.addEventListener('click', function() {
    me.travelMode = mode;
    me.route();
  });
};

AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(
    autocomplete, mode) {
  var me = this;
  autocomplete.bindTo('bounds', this.map);

  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();

    if (!place.place_id) {
      window.alert('Please select an option from the dropdown list.');
      return;
    }
    if (mode === 'ORIG') {
      me.originPlaceId = place.place_id;
    } else {
      me.destinationPlaceId = place.place_id;
    }
    me.route();
  });
};

AutocompleteDirectionsHandler.prototype.route = function() {
  if (!this.originPlaceId || !this.destinationPlaceId) {
    return;
  }
  var me = this;

  // Requests a route from origin to destination based off autocompleted addresses
  this.directionsService.route(
      {
        origin: {'placeId': this.originPlaceId},
        destination: {'placeId': this.destinationPlaceId},
        travelMode: this.travelMode
      },
      // Handle response back
      function(response, status) {
        if (status === 'OK') {
          me.directionsDisplay.setDirections(response);

          // For the route given, create a hidden line of it out of the response
          polyline.setPath([]);
          var bounds = new google.maps.LatLngBounds();
          start_location = new Object();
          end_location = new Object();
          var route = response.routes[0];

          var path = response.routes[0].overview_path;
          var legs = response.routes[0].legs;
          for (var i = 0; i < legs.length; i++) {
            if (i == 0) {
              start_location.latlng = legs[i].start_location;
              start_location.address = legs[i].start_address;
              marker = create_marker(legs[i].start_location,"Halfway point, distance wise",
                                      "x miles away from A", "x miles away from B");
            }
            end_location.latlng = legs[i].end_location;
            end_location.address = legs[i].end_address;
            var steps = legs[i].steps;
            for (var j = 0; j < steps.length; j++) {
              var nextSegment = steps[j].path;
              for (k=0;k<nextSegment.length;k++) {
                polyline.getPath().push(nextSegment[k]);
                bounds.extend(nextSegment[k]);
              }
            }
          }
          computeTotalDistance(response);

          var totalDist = 0;
          var totalTime = 0;
          function computeTotalDistance(result) {
            totalDist = 0;
            totalTime = 0;
            var myroute = result.routes[0];
            for (i = 0; i < myroute.legs.length; i++) {
              totalDist += myroute.legs[i].distance.value;
              totalTime += myroute.legs[i].duration.value;
            }
            putMarkerOnRoute(50);

            totalDist = totalDist / 1000;
          }

          function putMarkerOnRoute(percentage) {
            var distance = (percentage/100) * totalDist;
            var time = ((percentage/100) * totalTime/60).toFixed(2);
            if (!marker) {
              marker = create_marker(polyline.GetPointAtDistance(distance),"time: "+time,"marker");
            } else {
              marker.setPosition(polyline.GetPointAtDistance(distance));
              marker.setTitle("time:"+time);
            }
          }
        }
        else {
          window.alert('Directions request failed due to ' + status);
        }
      });
};
