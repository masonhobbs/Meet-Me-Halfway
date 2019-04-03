/* Main file for initializing the Google Maps API - variables/services etc. */

// Store all Google Maps API variables here; creates global scope for them
$(document).ready(function(){
  $("#submit-btn").click(function(){
    //I want Google default map controls to be hidden upon loading landing page
    $("#origin-landing").animate({left: '150%'}, 800);
    $("#destination-landing").animate({right: '150%'}, 800);
    $("#landing-page").fadeOut(1200);
    document.getElementById('origin-input').value = document.getElementById('origin-landing').value
    document.getElementById('destination-input').value = document.getElementById('destination-landing').value;
  });

  /* Maps service variables */
  var map;
  var info_window;
  var geocoder;
  var places;

  /* Utility variables to use with maps */
  var polyline = null; // For routing out the path for halfway point marker
  var halfway_marker; // Storing halfway point marker
  var radius_handler; // Var for controlling radius extender on finding safe meeting places
  var safe_places_display; // HTML div containing where to put the list of safe places

});

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat: 33.254521, lng: -97.152979},
    zoom: 13
  });
  // Invisible route marker; don't need to see path for going from source to end address...
  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#FF0000',
    strokeWeight: 0
  });
  info_window = new google.maps.InfoWindow();
  geocoder = new google.maps.Geocoder();
  places = new google.maps.places.PlacesService(map);
  new AutocompleteDirectionsHandler(map);
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
  this.directionsDisplay = new google.maps.DirectionsRenderer({polylineOptions: polyline}); // Initialize directions with an inivisible polyline; don't need to see route from A->B
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
          // Find and mark halfway point (halfway_finder.js)
          calculate_halfway_point(response);
          // Look for meeting places with the specified criteria and starting default radius of 2 miles; 2 miles = 3218 meters (safe_place_finder.js)
          radius_handler = find_meeting_places(3218, 'police station');
        }
        else {
          window.alert('Directions request failed due to ' + status);
        }
      });
};
