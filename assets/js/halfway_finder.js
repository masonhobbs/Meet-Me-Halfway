/* halfway_finder.js: for handling all things relating to the halfway point */


// For the route given, create a hidden line of it out of the response, use that to find halfway location
function calculate_halfway_point(response) {
  polyline.setPath([]);
  var bounds = new google.maps.LatLngBounds();
  start_location = new Object();
  end_location = new Object();
  var route = response.routes[0];

  // Draw out the path
  var path = response.routes[0].overview_path;
  var legs = response.routes[0].legs;
  for (var i = 0; i < legs.length; i++) {
    if (i == 0) {
      start_location.latlng = legs[i].start_location;
      start_location.address = legs[i].start_address;
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

  // Find total distance and time along path
  var totalDist = 0;
  var totalTime = 0;
  for (i = 0; i < route.legs.length; i++) {
    totalDist += route.legs[i].distance.value;
    totalTime += route.legs[i].duration.value;
  }

  // Places the marker's position to the halfway point
  putMarkerOnRoute(50);

  function putMarkerOnRoute(percentage) {
    var distance = (percentage/100) * totalDist;
    var display_dist = (0.25 * (totalDist / 1000)).toFixed(2);
    var time = ((percentage/100) * totalTime/60).toFixed(2);
    create_halfway_marker(polyline.GetPointAtDistance(distance) ,"Halfway point, distance wise", display_dist + " miles", display_dist + " miles");
  }
}

// Create a visual marker for halfway point
function create_halfway_marker(lat_lng, label, a_distance, b_distance) {
  var content = '<b>' + label + '</b>';
  halfway_marker = new google.maps.Marker({
    position: lat_lng,
    map: map,
    title: label,
    zIndex: Math.round(lat_lng.lat()*-100000)<<5,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10.0,
      fillColor: "#28ba39",
      fillOpacity: 1.0,
      strokeWeight: 1.0
    }
  });
  halfway_marker.myname = label;

  all_markers.push(halfway_marker);
  
  // Display halfway point info when marker is clicked
  google.maps.event.addListener(halfway_marker, 'click', function() {
    // Convert GPS coords to address
    geocoder.geocode({'location': halfway_marker.getPosition()}, function(results, status) {
      if(status == 'OK') {
        var converted_address = results[0].formatted_address;
        info_window.setContent(content
          + '<br>' + converted_address
          + '<br>Distance from point A: ' + a_distance
          + '<br>Distance from point B: ' + b_distance);
          info_window.open(map,halfway_marker);

          console.log(halfway_marker.getPosition());
        }
        else {
          alert("Error displaying marker information");
        }
      });
    });
}
