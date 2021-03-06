/* safe_place_finder.js: for handling all things relating to finding safe meeting places */

// Make a request to query for safe meeting places
function find_meeting_places(radius) {
  var safe_places_filter = [];
  if($('#police-check').is(":checked"))
    safe_places_filter.push("police station");
  if($('#restaurants-check').is(":checked"))
    safe_places_filter.push("restaurant");
  if($('#schools-check').is(":checked"))
    safe_places_filter.push("school");
  if($('#hospitals-check').is(":checked"))
    safe_places_filter.push("hospital");

  for(var i = 0; i < safe_places_filter.length; i++) {
    var safe_finder_req = {
      location: halfway_marker.getPosition(),
      radius: radius,
      name: safe_places_filter[i]
    }
    console.log("Searching for: " + safe_finder_req.name);
    search_request(safe_finder_req);
  }
}

function search_request(place) {
  places.nearbySearch(place, callback);
  function callback(results, status) {
    // 0 meeting places found; try again with a larger radius
    if(status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
      place.radius = place.radius + 3218;
      places.nearbySearch(place, callback);
    }
    // Draw all safe meeting places found, as markers, and put the information in the display window
    else if(status == google.maps.places.PlacesServiceStatus.OK) {
      $(".check-places").remove();
      for(var i = 0; i < results.length; i++) {
        create_marker(results[i]);
        add_safe_place(results[i]);
      }
      console.log(place.name + " search done");
    }
  }
}


// Function for creating markers of the safe meeting places by the halfway point
function create_marker(place) {
  var gmarker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    animation: google.maps.Animation.DROP,
    icon: 'placeholder.png'
  });

  all_markers.push(gmarker);
  google.maps.event.addListener(gmarker, 'click', function() {
    geocoder.geocode({'location': gmarker.getPosition()}, function(results, status) {
      if(status == 'OK') {
        var converted_address = results[0].formatted_address;
        info_window.setContent(place.name + '<br>' + converted_address);
        info_window.open(map,gmarker);
      }
      else {
        alert("Error displaying marker information; please try again in a moment...");
      }
    });
  });
}

// Stores safe place names and addresses
function add_safe_place(place) {
  safe_places_display = document.getElementById('safe-places');
  geocoder.geocode({'location': place.geometry.location}, function(results, status) {
    if(status == 'OK') {
      var origin = document.getElementById('origin-input').value;
      var dest = document.getElementById('destination-input').value;
      var converted_address = results[0].formatted_address;

      // Do some input sanitizing. also: re'place', heh
      place.name = place.name.replace(/"/g, " ");

      safe_places_display.innerHTML += (('<li class="list-group-item d-flex flex-wrap" id="' + converted_address + '">'
      + '<p class="col-md-6">' + place.name + '</p>')
      + ('<button type="button" class="btn btn-primary col-md-6 align-self-center"' + 'onclick="view_route(' + "'" + converted_address + "'" + ')">View Route</button>')
      + ('<p class="col-md-6">' + converted_address + '</p>')
      + ('<button type="button" class="btn btn-success col-md-6 align-self-center"' + 'onclick="navigate_to(' + "'" + converted_address + "'" + ')">Directions</button>')
      + '<p class="col-md-6 time-display" id="' + (origin+converted_address+place.name)
      + '"></p><p class="col-md-6 time-display" id="' + (dest+converted_address+place.name)
      + '"></p>')

      var dist_from_origin = get_time_to_place(origin, converted_address, place.name);
      var dist_from_dest = get_time_to_place(dest, converted_address, place.name);

      safe_places_display.innerHTML += "</li>";
    }
    else if(status == 'OVER_QUERY_LIMIT'){
      // Wait some time and try again
      sleep(300).then(() => {
        add_safe_place(place);
      });
    }
    else {
      console.log("[" + status + "]Error finding a valid address for safe place: " + place.name);
    }
  });
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Returns time from a source address to another address
function get_time_to_place(start_address, address, name) {
  route_handler.directionsService.route({
    origin: start_address,
    destination: address,
    travelMode: route_handler.travelMode,
  }, function(response, status) {
      if(status === 'OK') {
        var route = response.routes[0];
        safe_places_display = document.getElementById(start_address+address+name);
        safe_places_display.innerHTML += (route.legs[0].duration.text + ' from ' + start_address);
      }
      else if(status == 'OVER_QUERY_LIMIT'){
        // Wait some time and try again
        sleep(300).then(() => {
          get_time_to_place(start_address, address, name);
        });
      }
  });
}
