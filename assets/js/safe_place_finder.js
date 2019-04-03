/* safe_place_finder.js: for handling all things relating to finding safe meeting places */


// Make a request to query for safe meeting places
function find_meeting_places(radius, search_term) {
  var safe_finder_req = {
    location: halfway_marker.getPosition(),
    radius: radius,
    name: search_term
  }
  places.nearbySearch(safe_finder_req, callback);

  // Extends the search radius by 2 miles; 2 miles = ~3218 meters
  function extend_radius(){
    console.log("extending radius..");
    safe_finder_req.radius = safe_finder_req.radius + 3218;
    console.log(safe_finder_req);
    places.nearbySearch(safe_finder_req, callback);
  }

  return {
    extend_radius: extend_radius
  };
}

// Callback to draw markers from safe meeting place query
function callback(results, status) {
  console.log(status);
  // 0 meeting places found; try again with a larger radius
  if(status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
    radius_handler.extend_radius();
  }
  // Draw all safe meeting places found, as markers, and put the information in the display window
  else if(status == google.maps.places.PlacesServiceStatus.OK) {
    for(var i = 0; i < results.length; i++) {
      create_marker(results[i]);
      add_safe_place(results[i]);
    }
  }
}

// Function for creating markers of the safe meeting places by the halfway point
function create_marker(place) {
  var gmarker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    animation: google.maps.Animation.DROP,
    icon: 'police-officer.png'
  });

  google.maps.event.addListener(gmarker, 'click', function() {
    geocoder.geocode({'location': gmarker.getPosition()}, function(results, status) {
      if(status == 'OK') {
        var converted_address = results[0].formatted_address;
        info_window.setContent(place.name + '<br>' + converted_address);
        info_window.open(map,gmarker);
      }
      else {
        alert("Error displaying marker information");
      }
    });
  });
}

// Stores safe place names and addresses
function add_safe_place(place) {
  safe_places_display = document.getElementById('safe-places');
  geocoder.geocode({'location': place.geometry.location}, function(results, status) {
    if(status == 'OK') {
      var converted_address = results[0].formatted_address;
      safe_places_display.innerHTML += (('<li class="list-group-item d-flex flex-wrap"><p class="col-md-8">' + place.name + '</p>')
                                      + ('<button type="button" class="btn btn-primary col-md-4">Directions</button>')
                                      + ('<p class="col-md-8">' + converted_address + '</p></li>'));
    }
    else {
      console.log("Error finding a valid address for safe place: " + place.name);
    }
  });
}
