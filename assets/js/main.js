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
});

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script
// src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat: 33.254521, lng: -97.152979},
    zoom: 13
  });

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

  this.directionsService.route(
      {
        origin: {'placeId': this.originPlaceId},
        destination: {'placeId': this.destinationPlaceId},
        travelMode: this.travelMode
      },
      function(response, status) {
        if (status === 'OK') {
          me.directionsDisplay.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      });
};
