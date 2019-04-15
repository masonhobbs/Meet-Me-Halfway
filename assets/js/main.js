/* Main file for initializing the Google Maps API - variables/services etc. */

// Store all Google Maps API variables here; creates global scope for them
$(document).ready(function(){
  $("#submit-btn").click(function(){
    // For checking if user has selected at least one type of safe place
    var checkboxes = false;
    if($('#police-check').is(":checked"))
      checkboxes = true;
    if($('#restaurants-check').is(":checked"))
      checkboxes = true;
    if($('#schools-check').is(":checked"))
      checkboxes = true;
    if($('#hospitals-check').is(":checked"))
      checkboxes = true;

    if(!checkboxes)
      alert("Please check at least one type of safe place");

    // All criteria satisfied - move user along
    else {
      var test_route = route_handler.route();
      if(!test_route) {
        alert("Please select addresses from the autocomplete dropdown menu.");
      }
      else {
        //I want Google default map controls to be hidden upon loading landing page
        $("#origin-landing").animate({left: '150%'}, 800);
        $("#destination-landing").animate({right: '150%'}, 800);
        $("#landing-page").fadeOut(1200);
        document.getElementById('origin-input').value = document.getElementById('origin-landing').value
        document.getElementById('destination-input').value = document.getElementById('destination-landing').value;
      }

    }
  });

  /* Maps service variables */
  var map;
  var info_window;
  var geocoder;
  var places;
  var autocomplete_handle;

  /* Utility variables to use with maps */
  var polyline = null; // For routing out the path for halfway point marker
  var halfway_marker; // Storing halfway point marker
  var radius_handler; // Var for controlling radius extender on finding safe meeting places
  var safe_places_display; // HTML div containing where to put the list of safe places
  var all_markers;
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
  all_markers = [];
  route_handler = new AutocompleteDirectionsHandler(map);

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
      alert('Please select an option from the dropdown list.');
      return;
    }
    if (mode === 'ORIG') {
      me.originPlaceId = place.place_id;
    } else {
      me.destinationPlaceId = place.place_id;
    }
  //  me.route();
  });
};

AutocompleteDirectionsHandler.prototype.route = function() {
  if (!this.originPlaceId || !this.destinationPlaceId) {
    return false;
  }
  var me = this;
  var tolls = toll_answer();

  // Requests a route from origin to destination based off autocompleted addresses
  this.directionsService.route(
      {
        origin: {'placeId': this.originPlaceId},
        destination: {'placeId': this.destinationPlaceId},
        travelMode: this.travelMode,
        avoidTolls: tolls
      },
      // Handle response back
      function(response, status) {
        if (status === 'OK') {
          me.directionsDisplay.setDirections(response);
          // Find and mark halfway point (halfway_finder.js)
          calculate_halfway_point(response);
          // Look for meeting places with the specified criteria and starting default radius of 2 miles; 2 miles = 3218 meters (safe_place_finder.js)
          radius_handler = find_meeting_places(3218);
        }
        else {
          window.alert('Directions request failed due to ' + status);
        }
      });
  return true;

};

function view_route(address) {
  var origin = document.getElementById('origin-input').value;
  // returns the <li> object of the safe place being viewed right now
  var place_viewing = document.getElementById(address);
  $(place_viewing).css("background-color", "#b3d4fc");
  $(place_viewing).siblings().css("background-color", "white");
  var tolls = toll_answer();
  console.log(tolls);
  document.getElementById('destination-input').value = address;
  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#4288ce',
    strokeWeight: 5
  });

  // Clear any existing routes/markers
  route_handler.directionsDisplay.set('directions', null);
  route_handler.directionsDisplay = new google.maps.DirectionsRenderer({polylineOptions: polyline});
  route_handler.directionsDisplay.setMap(map);

  // Draw route from A -> chosen safe place
  route_handler.directionsService.route({
    origin: origin,
    destination: address,
    travelMode: route_handler.travelMode,
    avoidTolls: tolls
  }, function(response, status) {
      if(status === 'OK') {
        // Clear all markers
        for(var i = 0; i < all_markers.length; i++) {
          all_markers[i].setMap(null);
        }
        route_handler.directionsDisplay.setDirections(response);
        //idea: clear out safe places list, replaces with directions
        //document.getElementById('safe-places').innerHTML = '';
        //add directions here
      }
      else{
        console.log("failed");
      }
  });
}

function navigate_to(address) {
  var base_url = "https://www.google.com/maps/dir/";
  var start = replace_whitespace(document.getElementById('origin-input').value);
  var destination = replace_whitespace(address);

  var result = base_url + start + "/" + destination;
  window.open(result);
}

function replace_whitespace(input) {
  var output = "";
  for(var i = 0; i < input.length; i++) {
    if(input[i] == ' ')
      output += '+';
    else
      output += input[i];
  }
  return output;
}

function toll_answer(){
  if($('#avoid_toll').is(":checked")){
    return true;}
  else{
    return false;}
}

$('#avoid_toll').click(function() {
  var address = document.getElementById('destination-input').value;
  var place_viewing = document.getElementById(address);
  if($(place_viewing).css('background-color') == 'rgb(179, 212, 252)') {
   view_route(address);
  } else {
    window.alert('Please choose a route to view.');
    $('#avoid_toll').prop('checked', false);
  }
});
