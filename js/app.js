'use strict';

//make the map a global variable
var map;

// Set up the ViewModel
var ViewModel = function() {
    
  var self = this;
  
  this.lunchSpotList = ko.observableArray([]);
  
  // Search term is blank by default
  this.searchTerm = ko.observable('');

  // load initial map
  map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 37.766555, lng: -121.963462},
      zoom: 14
  });

	//create a marker to indicate where they currently are on the map
	var marker = new google.maps.Marker({
		position: {lat: 37.766555, lng: -121.963462},
		title:"You are here!",
		icon: "images/att logo.jpg"
	});
	
	marker.setMap(map);

  // Build the list of restaurants
  lunchSpots.forEach(function(lunchSpotItem) {
      self.lunchSpotList.push( new LunchSpot(lunchSpotItem) );
  });

  //Set up the function to filter the list based on user input  
  this.filteredLunchSpotList = ko.computed( function() {
		var filter = self.searchTerm().toLowerCase();
		if (!filter) {
			self.lunchSpotList().forEach(function(lunchSpotItem){
				lunchSpotItem.visible(true);
			});
			return self.lunchSpotList();
		} else {
			return ko.utils.arrayFilter(self.lunchSpotList(), function(lunchSpotItem) {
				var string = lunchSpotItem.name.toLowerCase();
        var result = (string.search(filter) >= 0);
        lunchSpotItem.visible(result);
				return result;
        self.marker.visible(false);
			});
		}
	}, self);
};

var LunchSpot = function(data) {

  var self = this;
  
  // Set all the properties as knockout observables
  this.name = data.name;
  this.lat = data.lat;
  this.lng = data.lng;
  this.address = data.address;
  this.url = data.url;
  this.menuUrl = data.menuUrl;
  this.comments = data.comments;
  this.menuString = data.menuString;
  
  this.visible = ko.observable(true);

  //Get additional business info by calling foursquare API
  var clientId = 'KLLNTY1ABC42WPEWQSBCAYHQZBCI1KXDK1CTRWMWC4NDFDQO';
  var clientSecret = 'COPZSGGSJGCXLUMWLK35HU5P1EYMYJNV4ZSLAPLALTEP3UEU';

  var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.lng + '&client_id=' + clientId + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;

  $.getJSON(foursquareURL).done(function(data) {
    var results = data.response.venues[0];
    self.url = results.url;
    self.address = results.location.formattedAddress[0];
    //not all places on foursquare have a menu, so if not, I'm indicating that in the info window
    if (typeof results.menu === 'undefined'){
      console.log("no menu exists");
      self.menuString = 'No menu exists';
    } else {
      self.menuUrl = results.menu.url;
      //this code isn't pretty, but I'm creating the entire a tag/href string to be passed to the info window only if the menu exists
      var menuStringA = '<a target = "_blank" href=';
      var menuStringB = '>';
      var menuStringC = '</a>';
      var menuStringFull = menuStringA + self.menuUrl +  menuStringB + 'menu' + menuStringC;
      self.menuString = menuStringFull; 
    }
    }).fail(function() {
       console.log("Call to foursquare API failed");
       self.url = "no data retrieved";
       self.menuUrl = "no data retrieved";
       self.address = "no data retrieved";
       self.menuUrl = "no data retrieved";
    });

  this.infoWindow = new google.maps.InfoWindow({content: self.contentString});

  //set the marker which will appear on the map
  this.marker = new google.maps.Marker({
      position: new google.maps.LatLng(data.lat, data.lng),
      map: map,
      title: data.name
  });

  this.showMarker = ko.computed(function() {
    if(this.visible() === true) {
      this.marker.setMap(map);
    } else {
      this.marker.setMap(null);
    }
    return true;
  }, this);

  this.marker.addListener('click', function(){
    self.contentString = '<div><div class="info-window-title"><b>' + data.name + '</b></div>' + '</br>' +
      '<div class="4S-Title">' + 'Info from foursquare.com' + '</div>' + '</br>' + 
      '<div class="4S-Data"><ul><li class="4S-Data">' + 'address: ' + self.address + '</li>' + '</br>' +
      '<li class="4S-Data">' + self.menuString + '</li>' + '</br>' +
      '<li class="4S-Data">' + 'URL: ' + '<a href="' + self.url + '" target="_blank">' + self.url + '</a></li></ul></div>' + '</br>' +
      '<div class="content-comments">' + 'Local comments: ' + self.comments + '</div></div>';
  
    self.infoWindow.setContent(self.contentString);

    self.infoWindow.open(map, this);

    //animate the marker when they click on it
    self.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
        self.marker.setAnimation(null);
    }, 2100);

    //if they click somewhere else on the map, close the info window
    //map.addListener("click", function(){
    //  self.infoWindow.close();
    //});
  });
  
  //this function is bound to the html when they click on an item in the list
  this.bounce = function(place) {
    google.maps.event.trigger(self.marker, 'click');
  };

  //if they click somewhere else on the map, close the info window
    map.addListener("click", function(){
      self.infoWindow.close();
    });
};

// Kick everything off!
function launchApp() {
  console.log("launching app");
	ko.applyBindings(new ViewModel());
}


function errorHandling() {
  alert("There was a problem loading google maps. Please try again later");
}
