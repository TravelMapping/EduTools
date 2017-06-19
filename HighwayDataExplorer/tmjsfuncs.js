//
// CHM Data Viewer-related Javascript functions
//
// Load and view data files related to Clinched Highway Mapping (CHM)
// related academic data sets.
//
// Renamed as tmjsfuncs.js as part of the Travel Mapping project
//
// Author: Jim Teresco, Siena College, The College of Saint Rose
//
// Code developed based on examples from
// http://cmap.m-plex.com/tools/wptedit/wptedit.html
// http://www.alecjacobson.com/weblog/?p=1645
//
// Modification History:
//
// 2011-06-20 JDT  Initial implementation
// 2011-06-21 JDT  Added .gra support and checkbox for hidden marker display
// 2011-06-23 JDT  Added .nmp file support (near-miss points)
// 2011-08-23 JDT  Added .pth file support (path)
// 2011-08-31 JDT  Added tabular graph data display
// 2013-08-14 JDT  Completed conversion to Google Maps API V3
// 2013-08-15 JDT  Added custom icon for intersections
// 2013-12-08 JDT  Fixed to handle DOS-style CRLF in uploaded files
// 2013-12-25 JDT  Click on GRA, PTH point label in table recenters map
// 2014-11-17 JDT  Added .wpl file support (waypoint list)
// 2015-06-10 JDT  Adapted for reading from database entries using PHP
// 2015-06-14 JDT  Clinched segment support
// 2015-06-17 JDT  All highways in region support
// 2015-08-19 JDT  Fixed a few bugs with infowindows
// 2016-05-25 JDT  Consolidated some changes from copies of chmviewerfunc3.js
// 2016-06-27 JDT  Removed code not needed by TM
//

// global variable to hold the map, which will be assigned a google.maps.Map reference
var map;
// array of waypoints displayed
var waypoints = new Array();
// array of waypoint indices where route changes for region mapping
var newRouteIndices = new Array();
// tiers of each route included
var routeTier = new Array();
// color code for each route included
var routeColor = new Array();
// system for each route included
var routeSystem = new Array();
// the markers at those waypoints
var markers = new Array();
// the info displayed when markers are clicked
var markerinfo = new Array();
// array of google.maps.LatLng representing the waypoint coordinates
var polypoints = new Array();
// array of connections on map as google.maps.Polyline overlays
var connections = new Array();
// array of graph edges (for graph data, used by HDX, which imports this code)
var graphEdges = new Array();
// array of segments and clinched for "clinched by traveler" mapping
var segments = new Array();
var clinched = new Array();
// boolean to say if we're doing this
var mapClinched = false;
// traveler name for clinched
var traveler;
// boolean to determine if graph edges should be generated automatically
var genEdges = false;
// boolean to determine if graph edges are in vertex adjacency lists
var usingAdjacencyLists = false;
// boolean to indicate if a simulation in progress is paused
var pause = false;

var red = 255;
var green = 0;
var blue = 0;
var piecenum = 1;

var rred = 255;
var rgrn = 245;
var rblu = 245;

var gred = 245;
var ggrn = 255;
var gblu = 245;


// array of objects that define color codes from names in the DB
var colorCodes = new Array();
colorCodes[0] = {
    name: "blue",
    unclinched: "rgb(100,100,255)",
    clinched: "rgb(0,0,255)"
};
colorCodes[1] = {
    name: "brown",
    unclinched: "rgb(153,152,102)",
    clinched: "rgb(153,102,0)"
};
colorCodes[2] = {
    name: "red",
    unclinched: "rgb(255,100,100)",
    clinched: "rgb(255,0,0)"
};
colorCodes[3] = {
    name: "yellow",
    unclinched: "rgb(255,255,128)",
    clinched: "rgb(225,225,0)"
};
colorCodes[4] = {
    name: "teal",
    unclinched: "rgb(100,200,200)",
    clinched: "rgb(0,200,200)"
};
colorCodes[5] = {
    name: "green",
    unclinched: "rgb(100,255,100)",
    clinched: "rgb(0,255,0)"
};
colorCodes[6] = {
    name: "magenta",
    unclinched: "rgb(255,100,255)",
    clinched: "rgb(255,0,255)"
};

// array of custom color codes to be pulled from query string parameter "colors="
var customColorCodes = new Array();

// algorithm visualization color settings and other parameters
var visualSettings = {
    // first, some used by many algorithms
    undiscovered: {
        color: "#202020",
        textColor: "#e0e0e0",
        scale: 2
    },
    visiting: {
        color: "yellow",
        textColor: "black",
        scale: 6
    },
    leader: {
        color: "red",
        textColor: "white",
        scale: 6
    },
    discarded: {
        color: "#a0a0a0",
        textColor: "black",
        scale: 2
    },
    // specific to vertex search
    northLeader: {
        color: "#8b0000",
        textColor: "white",
        scale: 6
    },
    southLeader: {
        color: "#ee0000",
        textColor: "white",
        scale: 6
    },
    eastLeader: {
        color: "#000080",
        textColor: "white",
        scale: 6
    },
    westLeader: {
        color: "#551A8B",
        textColor: "white",
        scale: 6
    },
    shortLabelLeader: {
        color: "#654321",
        textColor: "white",
        scale: 6
    },
    longLabelLeader: {
        color: "#006400",
        textColor: "white",
        scale: 6
    },
    // specific to graph traversals
    startVertex: {
        color: "purple",
        textColor: "white",
        scale: 6
    },
    discoveredEarlier: {
        color: "red",
        textColor: "white",
        scale: 4
    },
    visitedEarlier: {
        color: "orange",
        textColor: "black",
        scale: 4
    },
    spanningTree: {
        color: "#0000a0",
        textColor: "white",
        scale: 2
    },
    discovered: {
        color: "#00a000",
        textColor: "white",
        scale: 4
       },
	hoverV: {
		color: "#a0036b",
		textColor: "white",
		scale: 6
	},
    hullK: {
        color: "#41f4c4",
        textColor: "black",
        scale: 3
    },
    hullI: {
        color: "#0000aa",
        textColor: "black",
        scale: 6
    }
};

//allows the user to click on the table to select a vertex to start at

function vertexSelect(vertex){
	if(endOrStart == true){
		var startVertex = document.querySelector("#startPoint");
		startVertex.value = vertex;
		endOrStart = false;
	}
}

function vertexSelectEnd(vertex){
	if(endOrStart1 == true){
		var endVertex = document.querySelector("#endPoint");
		endVertex.value = vertex;
		endOrStart1 = false;
	}
}

var endOrStart;
var endOrStart1;
function startPointInput(){
	endOrStart = true;
}

function endPointInput(){
	endOrStart1 = true;
}

function hoverV (i, bool){
	if ((bool && pause) || !bool){
		vicon = markers[i].getIcon();
		vertexSelect(i);
		vertexSelectEnd(i);
		vcolor = getObj("waypoint"+i).style.backgroundColor;
		vtext = getObj("waypoint"+i).style.color;
		updateMarkerAndTable(i, visualSettings.hoverV, 0, false);
	}
}

function hoverEndV (i, bool){
	if ((bool && pause) || !bool){
		markers[i].setIcon(vicon);
		getObj("waypoint"+i).style.backgroundColor = vcolor;
		getObj("waypoint"+i).style.color = vtext;
		if($("#l"+i).length > 0)
			getObj("l"+i).style.backgroundColor = vcolor;
		if($("#di"+i).length > 0){
			getObj("di"+i).style.backgroundColor = vcolor;
			getObj("di"+i).style.color = vtext;
		}
	}
}

function hoverE (i){
	ecolor = getObj("connection"+i).style.backgroundColor;
	etext = getObj("connection"+i).style.color;
	getObj("connection"+i).style.color = visualSettings.hoverV.textColor;
	getObj("connection"+i).style.backgroundColor = visualSettings.hoverV.color;
	edge = connections[i].get("strokeColor");
	edgew = connections[i].get("strokeOpacity");
	connections[i].setOptions({
        strokeColor: visualSettings.hoverV.color,
		strokeOpacity: 0.7
    });
}

function hoverEndE(i){
	connections[i].setOptions({
        strokeColor: edge,
		strokeOpacity: edgew
    });
	getObj("connection"+i).style.color = etext;
	getObj("connection"+i).style.backgroundColor = ecolor;
}

var vcolor, vtext, vicon;
var ecolor, etext, edge, edgew;

var infowindow = new google.maps.InfoWindow();

// some map options, from http://cmap.m-plex.com/hb/maptypes.js by Timothy Reichard

var MapnikOptions = {
    alt: "Show Mapnik road map tiles from OpenStreetMap.org",
    getTileUrl: getMapnikTileURL,
    maxZoom: 18,
    minZoom: 0,
    name: "Mapnik",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function getMapnikTileURL(point, zoom) {
    return 'http://tile.openstreetmap.org/' + zoom + '/' + point.x + '/' + point.y + '.png';
}

var OpenStreetMapDEOptions = {
    alt: "Show OpenStreetMapDE road map tiles from OpenStreetMap.org",
    getTileUrl: getOpenStreetMapDEURL,
    maxZoom: 18,
    minZoom: 0,
    name: "DE",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function getOpenStreetMapDEURL(point, zoom) {
    return 'http://tile.openstreetmap.de/tiles/osmde/' + zoom + '/' + point.x + '/' + point.y + '.png';
}

var EsriOptions = {
    alt: "Show Esri road map tiles from OpenStreetMap.org",
    getTileUrl: EsriURL,
    maxZoom: 18,
    minZoom: 0,
    name: "Esri",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function EsriURL(point, zoom) {
    return 'http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/' + zoom + '/' + point.y + '/' + point.x;
}

var OpenStreetMapDEOptions = {
    alt: "Show OpenStreetMapDE road map tiles from OpenStreetMap.org",
    getTileUrl: getOpenStreetMapDEURL,
    maxZoom: 18,
    minZoom: 0,
    name: "DE",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function getOpenStreetMapDEURL(point, zoom) {
    return 'http://tile.openstreetmap.de/tiles/osmde/' + zoom + '/' + point.x + '/' + point.y + '.png';
}

//HERE map tiles
var HEREOptions = {
    alt: "Show wego HERE road map tiles from https://wego.here.com",
    getTileUrl: HEREURL,
    maxZoom: 18,
    minZoom: 0,
    name: "HERE",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function HEREURL(point, zoom) {
    return 'https://1.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day/' + zoom + '/' + point.x + '/' + point.y + '/256/png8?app_id=VX6plk5zCW0wzrNcN64O&app_code=LcZFksQAhfg7rvZvcZ1lqw';
}

var MQOpenMapOptions = {
    alt: "Show Mapquest Open Map road map tiles based on OpenStreetMap.org data",
    getTileUrl: getMQOpenMapTileURL,
    maxZoom: 18,
    minZoom: 0,
    name: "MQOpenMap",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function getMQOpenMapTileURL(point, zoom) {
    var subdomain = Math.floor(Math.random() * (4 - 1 + 1)) + 1; // Request tile from random subdomain.
    return 'http://otile' + subdomain + '.mqcdn.com/tiles/1.0.0/map/' + zoom + '/' + point.x + '/' + point.y + '.jpg';
    //return 'http://cmap.m-plex.com/hb/ymaptile.php?t=m&s=mq&x=' + point.x + '&y=' + point.y + '&z=' + zoom;
}

var MQOpenSatOptions = {
    alt: "Show Mapquest Open Map satellite imagery tiles based on OpenStreetMap.org data",
    getTileUrl: getMQOpenSatTileURL,
    maxZoom: 18,
    minZoom: 0,
    name: "MQOpenSat",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function getMQOpenSatTileURL(point, zoom) {
    var subdomain = Math.floor(Math.random() * (4 - 1 + 1)) + 1; // Request tile from random subdomain.
    return 'http://otile' + subdomain + '.mqcdn.com/tiles/1.0.0/sat/' + zoom + '/' + point.x + '/' + point.y + '.jpg';
    //return 'http://cmap.m-plex.com/hb/ymaptile.php?t=s&s=mq&x=' + point.x + '&y=' + point.y + '&z=' + zoom;
}

var BlankOptions = {
    alt: "Show a blank background",
    getTileUrl: getBlankURL,
    maxZoom: 18,
    minZoom: 0,
    name: "Blank",
    opacity: 1,
    tileSize: new google.maps.Size(256, 256)
};

function getBlankURL() {
    return '/empty.gif';
}

var intersectionimage = {
    url: 'Intersection.png',
    // This marker is 16x16
    size: new google.maps.Size(16, 16),
    // The origin for this image is 0,0.
    origin: new google.maps.Point(0, 0),
    // The anchor for this image is the center of the intersection
    anchor: new google.maps.Point(8, 8)
};

// loadmap constructs and sets up the initial map
function loadmap() {
    //if (document.getElementById("bingCheck").checked == false) {
    //document.getElementById("bingCheck").checked = false;
    var typeMQOpenMap = new google.maps.ImageMapType(MQOpenMapOptions);
    var typeMQOpenSat = new google.maps.ImageMapType(MQOpenSatOptions);
    var typeMapnik = new google.maps.ImageMapType(MapnikOptions);
    var typeBlank = new google.maps.ImageMapType(BlankOptions);
    var typeOpenStreetMapDE = new google.maps.ImageMapType(OpenStreetMapDEOptions);
    var typeEsri = new google.maps.ImageMapType(EsriOptions);
    var typeHERE = new google.maps.ImageMapType(HEREOptions);

    var maptypelist = ['Mapnik', google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN, 'Blank', 'DE', 'Esri', 'HERE'];
    var maptypecontroloptions = {
        mapTypeIds: maptypelist,
        position: google.maps.TOP_RIGHT,
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    };
    //var mapopt = {center: new google.maps.LatLng(42.664529, -73.786470), zoom: 12, mapTypeId: 'Mapnik', mapTypeControl: true, mapTypeControlOptions: maptypecontroloptions, streetViewControl: true, disableDefaultUI: true, panControl: true, zoomControl: true, scaleControl: true, overviewMapControl: true, keyboardShortcuts: true, disableDoubleClickZoom: false};
    // OLD coordinates are Albertus Hall room 400-2 at The College of Saint Rose
    //var mapopt = {center: new google.maps.LatLng(42.664529, -73.786470), zoom: 16, mapTypeControl: true, mapTypeControlOptions: maptypecontroloptions};

    // coordinates are Roger Bacon 321 at Siena College
    var mapopt = {
        center: new google.maps.LatLng(42.719450, -73.752063),
        zoom: 16,
        mapTypeControl: true,
        mapTypeControlOptions: maptypecontroloptions
    };

    map = new google.maps.Map(document.getElementById("map"), mapopt);

    map.mapTypes.set('MQOpenMap', typeMQOpenMap);
    map.mapTypes.set('MQOpenSat', typeMQOpenSat);
    map.mapTypes.set('Mapnik', typeMapnik);
    map.mapTypes.set('Blank', typeBlank);
    map.mapTypes.set('DE', typeOpenStreetMapDE);
    map.mapTypes.set('Esri', typeEsri);
    map.mapTypes.set('HERE', typeHERE);
    //}
}

// construct a new Waypoint object (based on similar function by Tim Reichard)
// now supporting edge adjacency lists
function Waypoint(label, lat, lon, elabel, edgeList) {
    this.label = label;
    this.lat = parseFloat(lat).toFixed(6);
    this.lon = parseFloat(lon).toFixed(6);
    this.visible = true;
    if (label.indexOf("+") >= 0) {
        this.visible = false;
    }
    this.elabel = elabel;
    this.edgeList = edgeList;
    return this;
}

// update the map to the current set of waypoints and connections
function updateMap() {
    // remove any existing google.maps.Polyline connections shown
    for (var i = 0; i < connections.length; i++) {
        connections[i].setMap(null);
    }
    connections = new Array();

    var minlat = 999;
    var maxlat = -999;
    var minlon = 999;
    var maxlon = -999;

    polypoints = new Array();
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }

    var showHidden = false;
    if (document.getElementById('showHidden') != null) {
        showHidden = document.getElementById('showHidden').checked;
    }
    var showMarkers = true;
    if (document.getElementById('showMarkers') != null) {
        showMarkers = document.getElementById('showMarkers').checked;
    }

    markers = new Array();
    markerinfo = new Array();
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < waypoints.length; i++) {
        minlat = Math.min(minlat, waypoints[i].lat);
        maxlat = Math.max(maxlat, waypoints[i].lat);
        minlon = Math.min(minlon, waypoints[i].lon);
        maxlon = Math.max(maxlon, waypoints[i].lon);

        polypoints[i] = new google.maps.LatLng(waypoints[i].lat, waypoints[i].lon);

        markerinfo[i] = MarkerInfo(i, waypoints[i]);
        markers[i] = new google.maps.Marker({
            position: polypoints[i],
            //map: map,
            optimized: false, // attempt to deal with zIndex
            title: waypoints[i].label,
            icon: intersectionimage
        });
        if (showMarkers && (showHidden || waypoints[i].visible)) {
            AddMarker(markers[i], markerinfo[i], i);
        }
        bounds.extend(polypoints[i]);
    }

    var midlat = (minlat + maxlat) / 2;
    var midlon = (minlon + maxlon) / 2;

    var nsdist = Mileage(minlat, midlon, maxlat, midlon);
    var ewdist = Mileage(midlat, minlon, midlat, maxlon);
    var maxdist = Math.max(nsdist, ewdist);

    //var zoom = 17 - (12 + Math.floor(Math.log(maxdist/800)/Math.log(2.0)));
    //zoom = Math.max(zoom, 0);
    //zoom = Math.min(zoom, 17);
    //map.setZoom(zoom);
    map.fitBounds(bounds);

    // if this is a graph in HDX, we draw edges as connections,
    // otherwise we may be connecting waypoints in order to plot a
    // path
    if (graphEdges.length > 0) {
        for (var i = 0; i < graphEdges.length; i++) {
            var numPoints;
            if (graphEdges[i].via == null) {
                numPoints = 2;
            } else {
                numPoints = graphEdges[i].via.length / 2 + 2;
            }
            var edgePoints = new Array(numPoints);
            var v1 = graphEdges[i].v1;
            var v2 = graphEdges[i].v2;
            //	    DBG.write("Adding edge " + i + " from " + v1 + "(" + waypoints[v1].lat + "," + waypoints[v1].lon + ") to " + v2 + "(" + waypoints[v2].lat + "," + waypoints[v2].lon + ")");
            edgePoints[0] = new google.maps.LatLng(waypoints[v1].lat, waypoints[v1].lon);
            nextPoint = 1;
            if (graphEdges[i].via != null) {
                for (var j = 0; j < graphEdges[i].via.length; j += 2) {
                    edgePoints[nextPoint] = new google.maps.LatLng(graphEdges[i].via[j], graphEdges[i].via[j + 1]);
                    nextPoint++;
                }
            }
            edgePoints[nextPoint] = new google.maps.LatLng(waypoints[v2].lat, waypoints[v2].lon);
            connections[i] = new google.maps.Polyline({
                path: edgePoints,
                strokeColor: "#0000FF",
                strokeWeight: 10,
                strokeOpacity: 0.4,
                map: map
            });

            // if we have adjacency lists, let's also remember our Polyline
            // in the GraphEdge
            for (var edgeNum = 0; edgeNum < waypoints[v1].edgeList.length; edgeNum++) {
                var thisEdge = waypoints[v1].edgeList[edgeNum];
                if ((thisEdge.v1 == v2) || (thisEdge.v2 == v2)) {
                    thisEdge.connection = connections[i];
                    break;
                }
            }
        }
        google.maps.event.clearListeners(map, 'zoom_changed');
        google.maps.event.addListener(map, 'zoom_changed', zoomChange);
        zoomChange();
    } else if (usingAdjacencyLists) {
        var edgeNum = 0;
        for (var i = 0; i < waypoints.length; i++) {
            for (var j = 0; j < waypoints[i].edgeList.length; j++) {
                var thisEdge = waypoints[i].edgeList[j];
                // avoid double plot by only plotting those with v1 as i
                if (thisEdge.v1 == i) {
                    var numPoints;
                    if (thisEdge.via == null) {
                        numPoints = 2;
                    } else {
                        numPoints = thisEdge.via.length / 2 + 2;
                    }
                    var edgePoints = new Array(numPoints);
                    edgePoints[0] = new google.maps.LatLng(waypoints[thisEdge.v1].lat, waypoints[thisEdge.v1].lon);
                    nextPoint = 1;
                    if (thisEdge.via != null) {
                        for (var p = 0; p < thisEdge.via.length; p += 2) {
                            edgePoints[nextPoint] = new google.maps.LatLng(thisEdge.via[p], thisEdge.via[p + 1]);
                            nextPoint++;
                        }
                    }
                    edgePoints[nextPoint] = new google.maps.LatLng(waypoints[thisEdge.v2].lat, waypoints[thisEdge.v2].lon);
                    // count the commas, which tell us how many
                    // concurrent routes are represented, as they will
                    // be comma-separated, then use that to choose a
                    // color to indicate the number of routes
                    // following the edge
                    concurrent = thisEdge.label.split(",").length;
                    color = "";
                    switch (concurrent) {
                        case 1:
                            color = "#0000FF";
                            break;
                        case 2:
                            color = "#00FF00";
                            break;
                        case 3:
                            color = "#FF00FF";
                            break;
                        case 4:
                            color = "#FFFF00";
                            break;
                        default:
                            color = "#FF0000";
                            break;
                    }
                    connections[edgeNum] = new google.maps.Polyline({
                        path: edgePoints,
                        strokeColor: color,
                        strokeWeight: 10,
                        strokeOpacity: 0.4,
                        map: map
                    });
                    edgeNum++;
                }
            }
        }

        google.maps.event.clearListeners(map, 'zoom_changed');
        google.maps.event.addListener(map, 'zoom_changed', zoomChange);
        zoomChange();
    }
    // connecting waypoints in order to plot a path
    else if (mapClinched) {
        // clinched vs unclinched segments mapped with different colors
        var nextClinchedCheck = 0;
        var totalMiles = 0.0;
        var clinchedMiles = 0.0;
        var level = map.getZoom();
        var weight = 2;
        if (newRouteIndices.length > 0) {
            // if newRouteIndices is not empty, we're plotting multiple routes
            //DBG.write("Multiple clinched routes!");
            var nextSegment = 0;
            for (var route = 0; route < newRouteIndices.length; route++) {
                var start = newRouteIndices[route];
                var end;
                if (route == newRouteIndices.length - 1) {
                    end = waypoints.length - 1;
                } else {
                    end = newRouteIndices[route + 1] - 1;
                }
                //DBG.write("route = " + route + ", start = " + start + ", end = " + end);
                // support for clinch colors from systems.csv
                var unclinchedColor = "rgb(200,200,200)"; //"#cccccc";
                var clinchedColor = "rgb(255,128,128)"; //"#ff8080";
                for (var c = 0; c < colorCodes.length; c++) {
                    if (colorCodes[c].name == routeColor[route]) {
                        unclinchedColor = colorCodes[c].unclinched;
                        clinchedColor = colorCodes[c].clinched;
                    }
                }
                // override with tier or system colors given in query string if they match
                for (var c = 0; c < customColorCodes.length; c++) {
                    if (customColorCodes[c].name == ("tier" + routeTier[route])) {
                        unclinchedColor = customColorCodes[c].unclinched;
                        clinchedColor = customColorCodes[c].clinched;
                    }
                    if (customColorCodes[c].name == routeSystem[route]) {
                        unclinchedColor = customColorCodes[c].unclinched;
                        clinchedColor = customColorCodes[c].clinched;
                    }
                }
                for (var i = start; i < end; i++) {
                    var zIndex = 10 - routeTier[route];
                    var edgePoints = new Array(2);
                    edgePoints[0] = new google.maps.LatLng(waypoints[i].lat, waypoints[i].lon);
                    edgePoints[1] = new google.maps.LatLng(waypoints[i + 1].lat, waypoints[i + 1].lon);
                    var segmentLength = Mileage(waypoints[i].lat,
                        waypoints[i].lon,
                        waypoints[i + 1].lat,
                        waypoints[i + 1].lon);
                    totalMiles += segmentLength;
                    //DBG.write("i = " + i);
                    var color = unclinchedColor;
                    var opacity = 0.3;
                    if (segments[nextSegment] == clinched[nextClinchedCheck]) {
                        //DBG.write("Clinched!");
                        color = clinchedColor;
                        zIndex = zIndex + 10;
                        nextClinchedCheck++;
                        clinchedMiles += segmentLength;
                        opacity = 0.85;
                    }
                    connections[nextSegment] = new google.maps.Polyline({
                        path: edgePoints,
                        strokeColor: color,
                        strokeWeight: weight,
                        strokeOpacity: opacity,
                        zIndex: zIndex,
                        map: map
                    });
                    nextSegment++;
                }
            }
            // set up listener for changes to zoom level and adjust strokeWeight in response
            //DBG.write("Setting up zoom_changed");
            google.maps.event.clearListeners(map, 'zoom_changed');
            google.maps.event.addListener(map, 'zoom_changed', zoomChange);
            //	    google.maps.event.addListener(map, 'zoom_changed', function() {
            //		var level = map.getZoom();
            //		var weight = Math.floor(level);
            //		DBG.write("Zoom level " + level + ", weight = " + weight);
            //		for (var i=0; i<connections.length; i++) {
            //		    connections[i].setOptions({strokeWeight: weight});
            //		}
            //	    });
        } else {
            // single route
            for (var i = 0; i < segments.length; i++) {
                var edgePoints = new Array(2);
                edgePoints[0] = new google.maps.LatLng(waypoints[i].lat, waypoints[i].lon);
                edgePoints[1] = new google.maps.LatLng(waypoints[i + 1].lat, waypoints[i + 1].lon);
                var segmentLength = Mileage(waypoints[i].lat,
                    waypoints[i].lon,
                    waypoints[i + 1].lat,
                    waypoints[i + 1].lon);
                totalMiles += segmentLength;
                var color = "#cccccc";
                if (segments[i] == clinched[nextClinchedCheck]) {
                    color = "#ff8080";
                    nextClinchedCheck++;
                    clinchedMiles += segmentLength;
                }
                connections[i] = new google.maps.Polyline({
                    path: edgePoints,
                    strokeColor: color,
                    strokeWeight: 10,
                    strokeOpacity: 0.75,
                    map: map
                });
            }
        }
        if (document.getElementById('controlboxinfo') != null) {
            document.getElementById('controlboxinfo').innerHTML = ""; //clinchedMiles.toFixed(2) + " of " + totalMiles.toFixed(2) + " miles (" + (clinchedMiles/totalMiles*100).toFixed(1) + "%) clinched by " + traveler + ".";
        }
    } else if (genEdges) {
        connections[0] = new google.maps.Polyline({
            path: polypoints,
            strokeColor: "#0000FF",
            strokeWeight: 10,
            strokeOpacity: 0.75,
            map: map
        });
        //map.addOverlay(connections[0]);
    }
    // don't think this should not be needed, but an attempt to get
    // hidden waypoints to be hidden when first created
    showHiddenClicked();
}

function zoomChange() {

    var level = map.getZoom();
    var newWeight;
    if (level < 9) newWeight = 2;
    else if (level < 12) newWeight = 6;
    else if (level < 15) newWeight = 10;
    else newWeight = 16;
    //DBG.write("zoomChange: Zoom level " + level + ", newWeight = " + newWeight);
    for (var i = 0; i < connections.length; i++) {
        //connections[i].setMap(null);
        connections[i].setOptions({
            strokeWeight: newWeight
        });
    }
}

function AddMarker(marker, markerinfo, i) {

    marker.setMap(map);
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(markerinfo);
        infowindow.open(map, marker);
		vertexSelect(i);
		vertexSelectEnd(i);
    });
}

function LabelClick(i) {
    map.panTo(new google.maps.LatLng(waypoints[i].lat, waypoints[i].lon));
    //infowindow.setContent(info);
    infowindow.setContent(markerinfo[i]);
    infowindow.open(map, markers[i]);
}

function MarkerInfo(i, wpt) {
    return '<p style="line-height:160%;"><span style="font-size:24pt;">' + wpt.label + '</span><br><b>Waypoint ' + (i) + '<\/b><br><b>Coords.:<\/b> ' + wpt.lat + '&deg;, ' + wpt.lon + '&deg;<\/p>';

}

// compute distance in miles between two lat/lon points
function Mileage(lat1, lon1, lat2, lon2) {
    if (lat1 == lat2 && lon1 == lon2)
        return 0.;

    var rad = 3963.;
    var deg2rad = Math.PI / 180.;
    var ang = Math.cos(lat1 * deg2rad) * Math.cos(lat2 * deg2rad) * Math.cos((lon1 - lon2) * deg2rad) + Math.sin(lat1 * deg2rad) * Math.sin(lat2 * deg2rad);
    return Math.acos(ang) * 1.02112 * rad;
}

// compute distance in feet between two lat/lon points
function Feet(lat1, lon1, lat2, lon2) {
    if (lat1 == lat2 && lon1 == lon2)
        return 0.;

    var rad = 3963.;
    var deg2rad = Math.PI / 180.;
    var ang = Math.cos(lat1 * deg2rad) * Math.cos(lat2 * deg2rad) * Math.cos((lon1 - lon2) * deg2rad) + Math.sin(lat1 * deg2rad) * Math.sin(lat2 * deg2rad);
    return Math.acos(ang) * 1.02112 * rad * 5280;
}

// callback for when the showHidden checkbox is clicked
function showHiddenClicked() {

    var showHidden = false;
    if (document.getElementById('showHidden') != null) {
        showHidden = document.getElementById('showHidden').checked;
    }
    //DBG.write("showHiddenClicked: showHidden is " + showHidden);
    if (showHidden) {
        // add in the hidden markers
        for (var i = 0; i < waypoints.length; i++) {
            if (!waypoints[i].visible) {
                AddMarker(markers[i], markerinfo[i], i);
            }
        }
    } else {
        // hide the ones that should no longer be visible
        for (var i = 0; i < waypoints.length; i++) {
            if (!waypoints[i].visible) {
                markers[i].setMap(null);
            }
        }
    }
}

// callback for when the hideMarkers checkbox is clicked
function showMarkersClicked() {

    var showThem = document.getElementById('showMarkers').checked;
    if (showThem) {
        for (var i = 0; i < waypoints.length; i++) {
            if (waypoints[i].visible) {
                AddMarker(markers[i], markerinfo[i], i);
            }
        }
    } else {
        for (var i = 0; i < waypoints.length; i++) {
            markers[i].setMap(null);
        }
    }
}

function redirect(url) {
    var win = window.open(url);
    win.focus();
}

// default delay 50 should match the selected option in the speedChanger
// and delay should be used for the amount of time in the future to use
// for setTimeout calls
var delay = 50;

function speedChanged() {
    var speedChanger = document.getElementById("speedChanger");
    delay = speedChanger.options[speedChanger.selectedIndex].value;
}


// pause button callback, simply sets pause to true, other functions
// deal with this as appropriate
function pauseSimulation() {

    pause = true;
}

// function to set the waypoint color, scale, and table entry
// using an entry passed in from the visualSettings
// optionally hide also by setting display to none
function updateMarkerAndTable(waypointNum, vs, zIndex, hideTableLine) {

    markers[waypointNum].setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: vs.scale,
        fillColor: vs.color,
        strokeColor: vs.color
    });
    markers[waypointNum].setZIndex(google.maps.Marker.MAX_ZINDEX + zIndex);
	var row = getObj("waypoint"+waypointNum);
    row.style.backgroundColor = vs.color;
    row.style.color = vs.textColor;
	if($("#l"+waypointNum).length > 0)
		getObj("l"+waypointNum).style.backgroundColor = vs.color;
	if($("#di"+waypointNum).length > 0){
		getObj("di"+waypointNum).style.backgroundColor = vs.color;
		getObj("di"+waypointNum).style.color = vs.textColor;
	}
    if (hideTableLine) 
        row.style.display = "none";
	if (vs.color == "#0000a0"){
		var clone = row.cloneNode(true);
		clone.className = "blueRow";
		row.parentNode.appendChild(clone);
		row.parentNode.removeChild(row);		
	}
	if (vs.color == "#00a000"){
		var clone = row.cloneNode(true);
		row.parentNode.insertBefore(clone, row.parentNode.childNodes[1]);
		row.parentNode.removeChild(row);		
	}
}

// function to create the table entry for the leader for extreme points
function extremePointLeaderString(waypointNum, vs) {

    return '<span style="color:' +
        vs.textColor + '; background-color:' +
        vs.color + '"> #' + waypointNum +
        ' (' + waypoints[waypointNum].lat + ',' +
        waypoints[waypointNum].lon +
        ') ' + waypoints[waypointNum].label + '</span>';
}

// function to create the table entry for the leader for label-based
// comparisons
function labelLeaderString(waypointNum, vs) {

    return '<span style="color:' +
        vs.textColor + '; background-color:' +
        vs.color + '"> #' + waypointNum +
        ' (length ' + waypoints[waypointNum].label.length + ') ' +
        waypoints[waypointNum].label + '</span>';
}


// some variables to support our vertex search with timers
var nextToCheck;
var northIndex = -1;
var southIndex = -1;
var eastIndex = -1;
var westIndex = -1;
var shortIndex = -1;
var longIndex = -1;

// initialize a vertex-based search, called by the start button callback
function startVertexSearch() {

    // if we are paused and the start button is pressed, we "unpause"
    if (pause) {
        pause = false;
        continueVertexSearch();
        return;
    }

    var statusLine = document.getElementById("status");
    // statusLine.innerHTML = "Preparing for Extreme Point Search Visualization";
    // in the future, make sure we have appropriate data in the system
    // before executing anything here

    // start by showing all existing markers, even hidden
    for (var i = 0; i < waypoints.length; i++) {
        markers[i].setMap(map);
        updateMarkerAndTable(i, visualSettings.undiscovered, 0, false);
    }
    // we don't need edges here, so we remove those
    for (var i = 0; i < connections.length; i++) {
        connections[i].setMap(null);
    }
    //we don't need connections table here, so we remove those
    getObj("connection").style.display = "none";

    // this doesn't really make sense for this search...
    // var startingPoint = document.getElementById("startPoint").value;


    // start the search by initializing with the value at pos 0
    updateMarkerAndTable(0, visualSettings.visiting, 40, false);

    nextToCheck = 0;
	
	var algorithmsTable = document.getElementById('AlgorithmsTable');
	var algorithmsTbody = algorithmsTable.children[1];
	var infoBox;
	var infoBoxtr;
	var infoid = "";
	for (var i = 1; i<7; i++){
		infoBox = document.createElement('td');
		infoBoxtr= document.createElement('tr');
		infoid = "info"+i;
		infoBox.setAttribute('id',infoid);
		infoBoxtr.appendChild(infoBox);
		algorithmsTbody.appendChild(infoBoxtr);
	}
	

    // enable pause button
    //document.getElementById("pauseRestart").disabled = false;
    setTimeout(continueVertexSearch, delay);
}


// do an iteration of vertex-based search
function continueVertexSearch() {

    // if the simulation is paused, we can do nothing, as this function
    // will be called again when we restart
    if (pause) {
        return;
    }

    // keep track of points that were leaders but got beaten to be
    // colored grey if they are no longer a leader in any category
    var defeated = [];

    // first we finish the previous point to see if it's a new winner,
    // and if necessary downgrade anyone who was beaten by this one

    // special case of first checked
    if (nextToCheck == 0) {
        // this was our first check, so this point wins all to start
        northIndex = 0;
        southIndex = 0;
        eastIndex = 0;
        westIndex = 0;
        shortIndex = 0;
        longIndex = 0;
        foundNewLeader = true;
    }
    // we have to do real work to see if we have new winners
    else {
        // keep track of whether this point is a new leader
        var foundNewLeader = false;

        // check north
        if (parseFloat(waypoints[nextToCheck].lat) > parseFloat(waypoints[northIndex].lat)) {
            foundNewLeader = true;
            defeated.push(northIndex);
            northIndex = nextToCheck;
        }
        // check south
        if (parseFloat(waypoints[nextToCheck].lat) < parseFloat(waypoints[southIndex].lat)) {
            foundNewLeader = true;
            defeated.push(southIndex);
            southIndex = nextToCheck;
        }
        // check east

        if (parseFloat(waypoints[nextToCheck].lon) > parseFloat(waypoints[eastIndex].lon)) {
            foundNewLeader = true;
            defeated.push(eastIndex);
            eastIndex = nextToCheck;
        }
        // check west
        if (parseFloat(waypoints[nextToCheck].lon) < parseFloat(waypoints[westIndex].lon)) {
            foundNewLeader = true;
            defeated.push(westIndex);
            westIndex = nextToCheck;
        }

        // check label lengths
        if (waypoints[nextToCheck].label.length < waypoints[shortIndex].label.length) {
            foundNewLeader = true;
            defeated.push(shortIndex);
            shortIndex = nextToCheck;
        }

        if (waypoints[nextToCheck].label.length > waypoints[longIndex].label.length) {
            foundNewLeader = true;
            defeated.push(longIndex);
            longIndex = nextToCheck;
        }

    }

    // any point that was a leader but is no longer gets discarded,
    while (defeated.length > 0) {
        var toCheck = defeated.pop();
        if (toCheck != northIndex &&
            toCheck != southIndex &&
            toCheck != eastIndex &&
            toCheck != westIndex &&
            toCheck != longIndex &&
            toCheck != shortIndex) {

            updateMarkerAndTable(toCheck, visualSettings.discarded,
                20, true);
        }
    }

    // the leader in each category is now highlighted in the tables and
    // on the map

    // TODO: handle better the situations where the same vertex
    // becomes the leader in multiple categories, as right now
    // it just gets colored with the last in this list
    if (foundNewLeader) {
	
	// this work will often be redundant but it's probably easier
	// than trying to avoid it
	
	// north
	updateMarkerAndTable(northIndex, visualSettings.northLeader, 
			     40, false);
	infoBox = document.getElementById('info1');
	infoBox.innerHTML = 'North extreme:<br />' +
	    extremePointLeaderString(northIndex, visualSettings.northLeader);
	
	// south
	updateMarkerAndTable(southIndex, visualSettings.southLeader,
			     40, false);
	infoBox = document.getElementById('info2');
	infoBox.innerHTML = "South extreme:<br />" +
	    extremePointLeaderString(southIndex, visualSettings.southLeader);
	
	// east
	updateMarkerAndTable(eastIndex, visualSettings.eastLeader,
			     40, false);
        infoBox = document.getElementById('info3');
        infoBox.innerHTML = "East extreme:<br />" +
            extremePointLeaderString(eastIndex, visualSettings.eastLeader);

        // west
        updateMarkerAndTable(westIndex, visualSettings.westLeader,
            40, false);
        infoBox = document.getElementById('info4');
        infoBox.innerHTML = "West extreme:<br />" +
            extremePointLeaderString(westIndex, visualSettings.westLeader);

        // shortest
        updateMarkerAndTable(shortIndex, visualSettings.shortLabelLeader,
            40, false);
        infoBox = document.getElementById('info5');
        infoBox.innerHTML = "Shortest vertex label:<br />" +
            labelLeaderString(shortIndex, visualSettings.shortLabelLeader);

        // longest
        updateMarkerAndTable(longIndex, visualSettings.longLabelLeader,
            40, false);
        infoBox = document.getElementById('info6');
        infoBox.innerHTML = "Longest vertex label:<br />" +
            labelLeaderString(longIndex, visualSettings.longLabelLeader);
    } else {
        // we didn't have a new leader, just discard this one
        updateMarkerAndTable(nextToCheck, visualSettings.discarded,
            20, true);
    }

    document.getElementById('algorithmStatus').innerHTML =
        'Visiting: <span style="color:' + visualSettings.visiting.textColor +
        '; background-color:' + visualSettings.visiting.color + '"> ' +
        nextToCheck + '</span>, ' + (markers.length - nextToCheck - 1) +
        ' remaining';

    // prepare for next iteration
    nextToCheck++;
    if (nextToCheck < markers.length) {
        updateMarkerAndTable(nextToCheck, visualSettings.visiting,
            30, false);
        
        setTimeout(continueVertexSearch, delay);
    } else {
        document.getElementById('algorithmStatus').innerHTML =
            "Done! Visited " + markers.length + " waypoints.";
    }
}

// **********************************************************************
// EDGE SEARCH CODE
// **********************************************************************

var minDistance = 9999999;
var maxDistance = -999999;
var edgeMin = null;
var edgeMax = null;
var currentEdgeIndex = 0;
var shortestELabel;
var longestELabel;

function startEdgeSearch() {

    if (pause) {
        pause = false;
        continueEdgeSearch();
        return;
    }

    var statusLine = document.getElementById("status");
    // statusLine.innerHTML = "Preparing for Extreme Edge Search Visualization";
    // we don't need edges here, so we remove those
    for (var i = 0; i < connections.length; i++) {
        connections[i].setMap(null);
    }
    //we don't need waypoints table here, so we remove those
    getObj("waypoints").style.display = "none";
	var algorithmsTable = document.getElementById('AlgorithmsTable');
	var algorithmsTbody = algorithmsTable.children[1];
	var infoid = "info1";
	var infoBox = document.createElement('td');
	var infoBoxtr= document.createElement('tr');
	infoBox.setAttribute('id',infoid);
	infoBoxtr.appendChild(infoBox);
	algorithmsTbody.appendChild(infoBoxtr);
    // document.getElementById('algorithmStatus').innerHTML = 'Checking: <span style="color:yellow">0</span>';
    setTimeout(continueEdgeSearch, delay);

}

function continueEdgeSearch() {
    if (pause) {
        return;
    }

    if(currentEdgeIndex== graphEdges.length){
	var maxEdgePoints = new Array(2);
	maxEdgePoints [0] = new google.maps.LatLng( waypoints[edgeMax.v1].lat, waypoints[edgeMax.v1].lon);
	maxEdgePoints [1] = new google.maps.LatLng( waypoints[edgeMax.v2].lat, waypoints[edgeMax.v2].lon);
	new google.maps.Polyline({path: maxEdgePoints, strokeColor: '#0000FF', strokeWeight: 10, strokeOpacity: 1, map: map});
	var firstNode = Math.min(edgeMax.v1, edgeMax.v2);
	var secondNode = Math.max(edgeMax.v1, edgeMax.v2);
	document.getElementsByClassName('v_' + firstNode + '_' + secondNode)[0].style.backgroundColor = "blue";
	var minEdgePoints = new Array(2);
	minEdgePoints [0] = new google.maps.LatLng( waypoints[edgeMin.v1].lat, waypoints[edgeMin.v1].lon);
	minEdgePoints [1] = new google.maps.LatLng( waypoints[edgeMin.v2].lat, waypoints[edgeMin.v2].lon);
	new google.maps.Polyline({path: minEdgePoints, strokeColor: '#FF0000', strokeWeight: 20, strokeOpacity: 1, map: map});
	var firstNode = Math.min(edgeMin.v1, edgeMin.v2);
	var secondNode = Math.max(edgeMin.v1, edgeMin.v2);
	document.getElementsByClassName('v_' + firstNode + '_' + secondNode)[0].style.backgroundColor = "red";
	document.getElementById('info1').innerHTML = "Shortest Edge label: " + shortestELabel + "<br> Longest Edge label: " + longestELabel +	"<br><span style = 'background-color:red'>Shortest Edge: " + edgeMin.label+ ": "  + Math.round(minDistance*100)/100 + " feet </span><br><span style = 'background-color:blue'>  Longest Edge: " + edgeMax.label + ": " + Math.round(maxDistance*100)/100 + " feet</span>";
	return;
    }	
    var edge = graphEdges[currentEdgeIndex];
    var distance = Feet(waypoints[edge.v1].lat, waypoints[edge.v1].lon,
        waypoints[edge.v2].lat, waypoints[edge.v2].lon);

    if (distance < minDistance) {
        minDistance = distance;
        edgeMin = edge;
    }

    if (distance > maxDistance) {
        maxDistance = distance;
        edgeMax = edge;
    }

    if (shortestELabel === undefined || shortestELabel.length > edge.label.length) {
        shortestELabel = edge.label;
    }

    if (longestELabel === undefined || longestELabel.length < edge.label.length) {
        longestELabel = edge.label;
    }
	
	document.getElementById('info1').innerHTML = "Shortest Edge label: " + shortestELabel + "<br> Longest Edge label: " + longestELabel +	"<br><span style = 'background-color:red'>Shortest Edge: " + edgeMin.label+ ": "  + Math.round(minDistance*100)/100 + " feet </span><br><span style = 'background-color:blue'>  Longest Edge: " + edgeMax.label + ": " + Math.round(maxDistance*100)/100 + " feet</span>";

    var initEdgePoints = new Array(2);
    initEdgePoints[0] = new google.maps.LatLng(waypoints[edge.v1].lat, waypoints[edge.v1].lon);
    initEdgePoints[1] = new google.maps.LatLng(waypoints[edge.v2].lat, waypoints[edge.v2].lon);
    new google.maps.Polyline({
        path: initEdgePoints,
        strokeColor: '#FFFF00',
        strokeWeight: 10,
        strokeOpacity: 1,
        map: map
    });
    var firstNode = Math.min(edge.v1, edge.v2);
    var secondNode = Math.max(edge.v1, edge.v2);
    document.getElementsByClassName('v_' + firstNode + '_' + secondNode)[0].style.backgroundColor = "grey";
    currentEdgeIndex += 1;
    setTimeout(continueEdgeSearch, delay);
}

// ********************************************************************
// graph traversals
// ********************************************************************

// this first variable is the stack for DFS, queue for BFS, could be other
//  for future enhancements
// elements here are objects with fields vIndex for the index of this vertex
// and connection is the Polyline connection followed to get here (so it
// can be colored appropriately when the element comes out)
var discoveredVertices = [];

// what will we call this structure?
var discoveredVerticesName;

// array of booleans to indicate if we've visited each vertex
var visitedVertices = [];

// vertex visited on the previous iteration to be updated
var lastVisitedVertex;

// where did we start?
var startingVertex;

var endingVertex;
// what is our traversal discipline, i.e., is discoveredVertices to be
// treated as a stack, queue, or something else
// values are currently "BFS" or "DFS" or "RFS"
var traversalDiscipline;

// initial vertex color coding and zindex offsets for graph traversals:
// start vertex: green/10
// undiscovered: white/0
// in discovered list and not visited: purple/5
// in discovered list but already visited: blue/5
// not in discovered list but already visited: grey/1
// just removed from discovered list and visiting: yellow/10
// just removed from discovered list but already visited: orange/10

// initial edge color coding for graph traversals:
// undiscovered edge: white
// edge leading to a vertex in the discovered list: purple
// edge that is part of the spanning tree: red
// edge that was discovered but ended up not in spanning tree: grey

// initialize graph traversal process
function startGraphTraversal(discipline) {

    traversalDiscipline = discipline;
    if (discipline == "BFS") {
        discoveredVerticesName = "Queue";
    } else if (discipline == "DFS") {
        discoveredVerticesName = "Stack";
    } else if (discipline == "RFS") {
        discoveredVerticesName = "List";
    }

    // if we are paused
    if (pause) {
        pause = false;
        continueGraphTraversal();
        return;
    }

    getObj("connection").style.display = "none";

    // initialize our visited array
    visited = new Array(waypoints.length).fill(false);

    // replace all markers with white circles
    for (var i = 0; i < markers.length; i++) {
        updateMarkerAndTable(i, visualSettings.undiscovered, 0, false);
    }

    // color all edges white also
    for (var i = 0; i < connections.length; i++) {
        connections[i].setOptions({
            strokeColor: visualSettings.undiscovered.color,
            strokeOpacity: 0.6
        });
    }

    // vertex index to start the traversal
    startingVertex = document.getElementById("startPoint").value;

    // initialize the process with this value
    discoveredVertices.push({
        vIndex: startingVertex,
        connection: null
    });
    numVisited++;

    updateMarkerAndTable(startingVertex, visualSettings.startVertex, 10, false);

    // nothing to update this first time
    lastVisitedVertex = -1;
    setTimeout(continueGraphTraversal, delay);
}

// function to see if a vertex with the given index is in discoveredVertices
function discoveredVerticesContainsVertex(vIndex) {

    for (var i = 0; i < discoveredVertices.length; i++) {
        if (discoveredVertices[i].vIndex == vIndex) {
            return true;
        }
    }
    return false;
}

// function to process one vertex from the discoveredVertices in the
// graph traversal process
var numVisited = 0;
var numVisitedComingOut = 0;
var numAlreadyVisited = 0;
function continueGraphTraversal() {
    
    // if we're paused, do nothing for now
    if (pause) {
        return;
    }

    // maybe we have a last visited vertex to update
    if (lastVisitedVertex != -1) {
        if (lastVisitedVertex == startingVertex) {
            // always leave the starting vertex colored appropriately
            // and in the table
            updateMarkerAndTable(startingVertex, visualSettings.startVertex,
                10, false);
        } else if (!discoveredVerticesContainsVertex(lastVisitedVertex)) {
            // not in the list, this vertex gets marked as in the spanning tree
            updateMarkerAndTable(lastVisitedVertex, visualSettings.spanningTree,
                1, false);
        } else {
            // still in the list, color with the "discoveredEarlier"  style
            updateMarkerAndTable(lastVisitedVertex, visualSettings.discoveredEarlier,
                5, false);
        }
    }
    // maybe we're done
    if (discoveredVertices.length == 0) {
        //console.log("Done!");
        return;
    }

    // select the next vertex to visit and remove it from the
    // discoveredVertices list
    var nextToVisit;
    if (traversalDiscipline == "BFS") {
        nextToVisit = discoveredVertices.shift();
        numVisitedComingOut++;
    } else if (traversalDiscipline == "DFS") {
        nextToVisit = discoveredVertices.pop();
        numVisitedComingOut++;
    } else if (traversalDiscipline == "RFS") {
        var index = Math.floor(Math.random() * discoveredVertices.length);
        nextToVisit = discoveredVertices[index];
        discoveredVertices.splice(index, 1);
        numVisitedComingOut++;
    }

    lastVisitedVertex = nextToVisit.vIndex;
    var vIndex = nextToVisit.vIndex;
    numVisited++;
    // now decide what to do with this vertex -- depends on whether it
    // had been previously visited
    if (visited[vIndex]) {
        numAlreadyVisited++;
        // we've been here before, but is it still in the list?
        if (discoveredVerticesContainsVertex(vIndex)) {
            // not there anymore, indicated this as visitedEarlier, and
            // will be discarded or marked as discoveredEarlier on the
            // next iteration
            updateMarkerAndTable(vIndex, visualSettings.visitedEarlier,
                4, false);
        } else {
            // still to be seen again, so mark is as discoveredEarlier
            updateMarkerAndTable(vIndex, visualSettings.discoveredEarlier,
                5, false);
        }

        // in either case here, the edge that got us here is not
        // part of the ultimate spanning tree, so it should be the
        // "discoveredEarlier" color
        if (nextToVisit.connection != null) {
            nextToVisit.connection.setOptions({
                strokeColor: visualSettings.discoveredEarlier.color
            });
        }
    }
    // visiting for the first time
    else {

        visited[vIndex] = true;
        updateMarkerAndTable(vIndex, visualSettings.visiting,
            10, false);

        // we used the edge to get here, so let's mark it as such
        if (nextToVisit.connection != null) {
            nextToVisit.connection.setOptions({
                strokeColor: visualSettings.spanningTree.color
            });
        }

        // discover any new neighbors
        var neighbors = getAdjacentPoints(vIndex);
        for (var i = 0; i < neighbors.length; i++) {
            if (!visited[neighbors[i]]) {
                var connection = waypoints[vIndex].edgeList[i].connection;
                discoveredVertices.push({
                    vIndex: neighbors[i],
                    connection: connection
                });
                updateMarkerAndTable(neighbors[i], { color: "rgb("+gred+","+ggrn+","+gblu+")",
        textColor: "black",
        scale: 4},
                    5, false);
					if (gblu >=10){
						gred-=10;
						gblu-=10;
					}
					else
						ggrn-=10;

                // also color the edge we followed to get to this
                // neighbor as the same color to indicate it's a candidate
                // edge followed to find a current discovered but
                // unvisited vertex
                if (connection != null) {
                    connection.setOptions({
                        strokeColor: visualSettings.discovered.color
                    });
                } else {
                    console.log("Unexpected null connection, vIndex=" + vIndex + ", i=" + i);
                }
            }
        }
    }

	shiftColors();
    // update view of our list
    //printList(queue);
   /* document.getElementById('algorithmStatus').innerHTML = discoveredVerticesName + " (size: " + discoveredVertices.length + ") " + listToVIndexString(discoveredVertices);
    setTimeout(continueGraphTraversal, delay);*/
     var newDS = makeTable();
	 if(newDS!=null)
		 getObj("algorithmStatus").appendChild(newDS);
    setTimeout(continueGraphTraversal, delay);

}

function startConnectedPieces(vert, visitarr) {
	
		discoveredVerticesName = "Queue";

    // if we are paused
    if (pause) {
        pause = false;
        continueConnectedPieces();
        return;
    }
	
	var piecesTD = "";

    getObj("connection").style.display = "none";

    // initialize our visited array, define start vertex, recolor if necessary
	if(vert == -1){
		var piecesTR = document.createElement("tr");
		piecesTD = document.createElement("td");
		piecesTR.appendChild(piecesTD);
		piecesTD.setAttribute("id","piecesTD");
		$("#AlgorithmsTable > tbody").append(piecesTR);
		piecesTD = getObj("piecesTD");
		visited = new Array(waypoints.length).fill(false);
		startingVertex = document.getElementById("startPoint").value;
		 // replace all markers with white circles
		for (var i = 0; i < markers.length; i++) {
			updateMarkerAndTable(i, visualSettings.undiscovered, 0, false);
		}

    // color all edges white also
		for (var i = 0; i < connections.length; i++) {
			connections[i].setOptions({
				strokeColor: visualSettings.undiscovered.color,
				strokeOpacity: 0.6
			});
		}	
	}
	else{
		piecesTD = getObj("piecesTD");
		visited = visitarr;
		startingVertex = vert;
	}
	
	piecesTD.innerHTML = "Currently traversing component #"+ piecenum;
	piecesTD.style.backgroundColor = "rgb("+red+","+green+","+blue+")";
	
	
    // initialize the process with this value
    discoveredVertices.push({
        vIndex: startingVertex,
        connection: null
    });

    updateMarkerAndTable(startingVertex, visualSettings.startVertex, 10, false);

    // nothing to update this first time
    lastVisitedVertex = -1;
    setTimeout(function(){continueConnectedPieces()}, delay);
}

function continueConnectedPieces() {
	
    // if we're paused, do nothing for now
    if (pause) {
        return;
    }

    // maybe we have a last visited vertex to update
    if (lastVisitedVertex != -1) {
       if (!discoveredVerticesContainsVertex(lastVisitedVertex)) {
            // not in the list, this vertex gets marked as in the spanning tree
            updateMarkerAndTable(lastVisitedVertex, { color: "rgb("+red+","+green+","+blue+")",
        textColor: "black",
        scale: 2},
                1, false);
        } else {
            // still in the list, color with the "discoveredEarlier"  style
            updateMarkerAndTable(lastVisitedVertex, visualSettings.discoveredEarlier,
                5, false);
        }
    }
	
	var vleft = false;
	var index = -1;
	for(var i=0; i<visited.length; i++){
		if(!visited[i]){
			vleft = true;
			index = i;
		}
	}
	
    // maybe we're done
    if (discoveredVertices.length == 0 && !vleft) {
        getObj("piecesTD").innerHTML = "Done! Map contains "+piecenum+" unconnected pieces";
		getObj("piecesTD").style.backgroundColor = "#ffffff";
        return;
    }
	
	if (discoveredVertices.length == 0 && vleft) {
		if (green <= 220 && blue <=220)
			green = green+35;
		else if (red >= 35 && green > 220)
			red-=35;	
		else if (blue <= 220 && red <= 220)
			blue += 35;	
		else if (blue > 220 && green >=35)
			green -=35;
		else if (red <= 220 && green <= 220)
			red += 35;		
		piecenum++;
        startConnectedPieces(index, visited);
		return;
    }

    // select the next vertex to visit and remove it from the
    // discoveredVertices list
   
    var nextToVisit = discoveredVertices.shift();
    

    lastVisitedVertex = nextToVisit.vIndex;
    var vIndex = nextToVisit.vIndex;

    // now decide what to do with this vertex -- depends on whether it
    // had been previously visited
    if (visited[vIndex]) {

        // we've been here before, but is it still in the list?
        if (discoveredVerticesContainsVertex(vIndex)) {
            // not there anymore, indicated this as visitedEarlier, and
            // will be discarded or marked as discoveredEarlier on the
            // next iteration
            updateMarkerAndTable(vIndex, visualSettings.visitedEarlier,
                4, false);
        } else {
            // still to be seen again, so mark is as discoveredEarlier
            updateMarkerAndTable(vIndex, visualSettings.discoveredEarlier,
                5, false);
        }

        // in either case here, the edge that got us here is not
        // part of the ultimate spanning tree, so it should be the
        // "discoveredEarlier" color
        if (nextToVisit.connection != null) {
            nextToVisit.connection.setOptions({
                strokeColor: visualSettings.discoveredEarlier.color
            });
        }
    }
    // visiting for the first time
    else {

        visited[vIndex] = true;
        updateMarkerAndTable(vIndex, visualSettings.visiting,
            10, false);

        // we used the edge to get here, so let's mark it as such
        if (nextToVisit.connection != null) {
            nextToVisit.connection.setOptions({
                strokeColor: "rgb("+red+","+green+","+blue+")"
            });
        }

        // discover any new neighbors
        var neighbors = getAdjacentPoints(vIndex);
        for (var i = 0; i < neighbors.length; i++) {
            if (!visited[neighbors[i]]) {
                var connection = waypoints[vIndex].edgeList[i].connection;
                discoveredVertices.push({
                    vIndex: neighbors[i],
                    connection: connection
                });
                updateMarkerAndTable(neighbors[i], visualSettings.discovered,
                    5, false);

                // also color the edge we followed to get to this
                // neighbor as the same color to indicate it's a candidate
                // edge followed to find a current discovered but
                // unvisited vertex
                if (connection != null) {
                    connection.setOptions({
                        strokeColor: visualSettings.discovered.color
                    });
                } else {
                    console.log("Unexpected null connection, vIndex=" + vIndex + ", i=" + i);
                }
            }
        }
    }

    // update view of our list
    //printList(queue);
   /* document.getElementById('algorithmStatus').innerHTML = discoveredVerticesName + " (size: " + discoveredVertices.length + ") " + listToVIndexString(discoveredVertices);
    setTimeout(continueGraphTraversal, delay);*/
     var newDS = makeTable();
	 if(newDS!=null)
		 getObj("algorithmStatus").appendChild(newDS);
    setTimeout(function(){continueConnectedPieces()}, delay);

}

function startDijkstra() {
	
    // if we are paused
    if (pause) {
        pause = false;
        continueDijkstra();
        return;
    }
	else{
		getObj("connection").style.display = "none";
		getObj("waypoints").style.display = "none";
		
		var dijkstraTable = document.createElement("table");
		dijkstraTable.id = "dijtable";
		dijkstraTable.className = "gratable";
		var dijthead = document.createElement("thead");
				
		var topRow = document.createElement("tr");
		
		var th = document.createElement("th");
		th.innerHTML = "#";
		topRow.appendChild(th);
		
		th = document.createElement("th");
		th.innerHTML = "Distance(mi)";
		topRow.appendChild(th);
		
		th = document.createElement("th");
		th.innerHTML = "Name";
		topRow.appendChild(th);
		
		th = document.createElement("th");
		th.innerHTML = "Previous edge";
		topRow.appendChild(th);
		
		dijthead.appendChild(topRow);
		dijkstraTable.appendChild(dijthead);
		var dijtbody = document.createElement("tbody");
		dijtbody.id = "dijtbody";
		dijkstraTable.appendChild(dijtbody);
		
		getObj("waypoints").parentNode.parentNode.appendChild(dijkstraTable);	
	}
	discoveredVerticesName = "PQueue";

    // initialize our visited array
    visited = new Array(waypoints.length).fill(false);

    // replace all markers with white circles
    for (var i = 0; i < markers.length; i++) {
        updateMarkerAndTable(i, visualSettings.undiscovered, 0, false);
    }

    // color all edges white also
    for (var i = 0; i < connections.length; i++) {
        connections[i].setOptions({
            strokeColor: visualSettings.undiscovered.color,
            strokeOpacity: 0.6
        });
    }

    // vertex index to start the traversal
    startingVertex = document.getElementById("startPoint").value;
	endingVertex = document.getElementById("endPoint").value;
	

    // initialize the process with this value
    discoveredVertices.push({
        vIndex: startingVertex,
        connection: null,
		dist: 0,
		edge: null
    });
    numVisited++;

    updateMarkerAndTable(startingVertex, visualSettings.startVertex, 10, false);

    // nothing to update this first time
    lastVisitedVertex = -1;
    setTimeout(continueDijkstra, delay);
}

function comparePQ(a, b){
	return a.dist-b.dist;
}

function continueDijkstra() {
    // if we're paused, do nothing for now
    if (pause) {
        return;
    }

    // maybe we have a last visited vertex to update
    if (lastVisitedVertex != -1) {
        if (lastVisitedVertex == startingVertex) {
            // always leave the starting vertex colored appropriately
            // and in the table
            updateMarkerAndTable(startingVertex, visualSettings.startVertex,
                10, false);
        } else if (!discoveredVerticesContainsVertex(lastVisitedVertex)) {
            // not in the list, this vertex gets marked as in the spanning tree
            updateMarkerAndTable(lastVisitedVertex, visualSettings.spanningTree,
                1, false);
        } else {
            // still in the list, color with the "discoveredEarlier"  style
            updateMarkerAndTable(lastVisitedVertex, visualSettings.discoveredEarlier,
                5, false);
        }
    }
    // maybe we're done
    if (discoveredVertices.length == 0 || (visited[endingVertex] && startingVertex != endingVertex)) {
		createDataTable("#dijtable");
        //console.log("Done!");
        return;
    }

    // select the next vertex to visit and remove it from the
    // discoveredVertices list
    var nextToVisit = discoveredVertices.shift();
    numVisitedComingOut++;
	
	var tr = document.createElement("tr");
	tr.id = "di"+nextToVisit.vIndex;
	tr.setAttribute("onclick", "LabelClick("+nextToVisit.vIndex+")");
	tr.setAttribute("onmouseover", "hoverV("+nextToVisit.vIndex+", false)");
	tr.setAttribute("onmouseout", "hoverEndV("+nextToVisit.vIndex+", false)");
	var td = document.createElement("td");
	td.innerHTML = nextToVisit.vIndex;
	tr.appendChild(td);	
	td = document.createElement("td");
	td.innerHTML = Math.round(nextToVisit.dist*1000)/1000;
	tr.appendChild(td);
	td = document.createElement("td");
	td.innerHTML = waypoints[nextToVisit.vIndex].label;
	tr.appendChild(td);
	td = document.createElement("td");
	//td.setAttribute("onmouseover", "hoverE("+nextToVisit.connection+")");
	//td.setAttribute("onmouseout", "hoverEndE("+nextToVisit.connection+")");
	if(nextToVisit.edge!=null)
		td.innerHTML = "("+nextToVisit.edge.v1+")"+waypoints[nextToVisit.edge.v1].label+"<br>"+"("+nextToVisit.edge.v2+")"+waypoints[nextToVisit.edge.v2].label;
	else
		td.innerHTML = "null";
	tr.appendChild(td);
	
	getObj("dijtbody").appendChild(tr);

    lastVisitedVertex = nextToVisit.vIndex;
    var vIndex = nextToVisit.vIndex;
    numVisited++;
    // now decide what to do with this vertex -- depends on whether it
    // had been previously visited
    if (visited[vIndex]) {
        numAlreadyVisited++;
        // we've been here before, but is it still in the list?
        if (discoveredVerticesContainsVertex(vIndex)) {
            // not there anymore, indicated this as visitedEarlier, and
            // will be discarded or marked as discoveredEarlier on the
            // next iteration
            updateMarkerAndTable(vIndex, visualSettings.visitedEarlier,
                4, false);
        } else {
            // still to be seen again, so mark is as discoveredEarlier
            updateMarkerAndTable(vIndex, visualSettings.discoveredEarlier,
                5, false);
        }

        // in either case here, the edge that got us here is not
        // part of the ultimate spanning tree, so it should be the
        // "discoveredEarlier" color
        if (nextToVisit.connection != null) {
            nextToVisit.connection.setOptions({
                strokeColor: visualSettings.discoveredEarlier.color
            });
        }
    }
    // visiting for the first time
    else {
        visited[vIndex] = true;
        updateMarkerAndTable(vIndex, visualSettings.visiting,
            10, false);

        // we used the edge to get here, so let's mark it as such
        if (nextToVisit.connection != null) {
            nextToVisit.connection.setOptions({
                strokeColor: visualSettings.spanningTree.color
            });
        }

        // discover any new neighbors
        var neighbors = getAdjacentPoints(vIndex);
        for (var i = 0; i < neighbors.length; i++) {
            if (!visited[neighbors[i]]) {
                var connection = waypoints[vIndex].edgeList[i].connection;
                discoveredVertices.push({
                    vIndex: neighbors[i],
                    connection: connection,
					dist: Mileage(waypoints[vIndex].lat, waypoints[vIndex].lon, waypoints[neighbors[i]].lat, waypoints[neighbors[i]].lon)+nextToVisit.dist,
					edge: waypoints[vIndex].edgeList[i]
                });
                updateMarkerAndTable(neighbors[i], { color: "rgb("+gred+","+ggrn+","+gblu+")",
        textColor: "black",
        scale: 4},
                    5, false);
					if (gblu >=10){
						gred-=10;
						gblu-=10;
					}
					else
						ggrn-=10;

                // also color the edge we followed to get to this
                // neighbor as the same color to indicate it's a candidate
                // edge followed to find a current discovered but
                // unvisited vertex
                if (connection != null) {
                    connection.setOptions({
                        strokeColor: visualSettings.discovered.color
                    });
                } else {
                    console.log("Unexpected null connection, vIndex=" + vIndex + ", i=" + i);
                }
            }
        }
    }
	discoveredVertices.sort(comparePQ);
	shiftColors();

    // update view of our list
    //printList(queue);
   /* document.getElementById('algorithmStatus').innerHTML = discoveredVerticesName + " (size: " + discoveredVertices.length + ") " + listToVIndexString(discoveredVertices);
    setTimeout(continueGraphTraversal, delay);*/
	     var newDS = makeTable();
	 if(newDS!=null)
		 getObj("algorithmStatus").appendChild(newDS);

    setTimeout(continueDijkstra, delay);

}

function shiftColors(){
	var r = 245;
	var g = 255;
	var b = 245;
	var inc;
	if (discoveredVertices.length <= 6)
		inc = 70;
	else if (discoveredVertices.length <=10)
		inc = 45;
	else if (discoveredVertices.length <= 24)
		inc = 20;
	else if (discoveredVertices.length <= 49)
		inc = 10;
	else
		inc = 9;
	//works until 83 vertices in DS, then repeats cyan
	for (var i=0; i<discoveredVertices.length; i++){
		updateMarkerAndTable(discoveredVertices[i].vIndex, { color: "rgb("+r+","+g+","+b+")",
        textColor: "black",
        scale: 4},
        5, false);
		if (r>=inc && b>=inc && g>=inc){
			r-=inc;
			b-=inc;			
		}
		else if (g>=inc && b<inc && r<inc)
			g-=inc;
		else{
			b+=inc;
			g+=inc;
		}
	}
	if(discoveredVertices.length>0){
	var colors = getObj("waypoint"+discoveredVertices[discoveredVertices.length-1].vIndex).style.backgroundColor.split(",");
	console.log(colors[0].substring(4, colors[0].length));
	gred = parseInt(colors[0].substring(4, colors[0].length).trim());
	console.log(colors[1].trim());
	ggrn = parseInt(colors[1].trim());
	console.log(colors[2].substring(0, colors[2].length-1).trim());
	gblu = parseInt(colors[2].substring(0, colors[2].length-1).trim());
	if(gred>=inc){
			gred-=inc;
	gblu-=inc;}
		else
			ggrn-=inc;
	}
}

function getAdjacentPoints(pointIndex) {
    var resultArray = [];
    var edgeList = waypoints[pointIndex].edgeList;
    for (var i = 0; i < edgeList.length; i++) {
        var adjacentIndex;
        if (edgeList[i].v1 == pointIndex) {
            adjacentIndex = edgeList[i].v2;
        } else {
            adjacentIndex = edgeList[i].v1;
        }
        resultArray.push(adjacentIndex);
    }

    return resultArray;
}

function printList(items) {
    if (items.length == 0) {
        console.log("[]");
    } else {
        var line = `[`;
        for (var i = 0; i < items.length; i++) {
            if (i == items.length - 1) {
                line += items[i];
            } else {
                line += items[i] + `, `;
            }

        }
        line += `]`;
        console.log(line);
    }

}

function listToVIndexString(items) {
    if (items.length == 0) {
        return "[]";
    } else {
        var line = `[`;
        for (var i = 0; i < items.length; i++) {
            if (i == items.length - 1) {
                line += items[i].vIndex;
            } else {
                line += items[i].vIndex + `, `;
            }

        }
        line += ` ]`;
        return line;
    }

}

//New Convex Hull 
function addToHull(temp1, temp2){
    hull[0] = temp1;
    hull[1] = temp2;
}


//Compute Squared Distance 
function squaredDistance(o1, o2) {
	var dx, dy;
	dx = o1.lon - o2.lon;
	dy = o1.lat - o2.lat;
	return dx * dx + dy * dy;
}

/**
    Check if this point is directly in between the two given
    points.  Note: the assumption is that they are colinear.

    @param o1 one of the points
    @param o2 the other point
    @return whether this point is between the two given points
    */

function isBetween(o1, o2, o3) {
	var sqDisto1o2 = squaredDistance(o1, o2);
	alert("isBetween" + (squaredDistance(o3, o2) < sqDisto1o2) &&
		(squaredDistance(o3, o2) < sqDisto1o2));
	return (squaredDistance(o3, o2) < sqDisto1o2) &&
		(squaredDistance(o3, o2) < sqDisto1o2);
}

var hull = [];

var hullI = 0;
var hullJ = 0;
//var k = 0;
var hull = [];

var convexLineHull = [];

var visitingLine = [];

function showConvexLines(lineHull) {
	for (var i = 0; i < lineHull.length; i++) {
		connections[i].setMap(null);
		connections[i] = new google.maps.Polyline({
			map: map,
			path: lineHull,
			strokeColor: '#aa0000',
			strokeOpacity: 0.6,
			strokeWeight: 4
		});
	}
}

var currentSegment;

function visitingLineHull(lineHull) {
	//for (var i = 0; i < lineHull.length; i++) {
	//currentSegment.setMap(null);
	currentSegment = new google.maps.Polyline({
		map: map,
		path: lineHull,
		strokeColor: '#0000aa',
		strokeOpacity: 0.6,
		strokeWeight: 4
	});
	//}
}

var point1;
var point2;

var a;
var b;
var c;

var lookingForPositive;
var foundProblem;
var firstTestPoint;

function bruteForceConvexHull() {
	if(pause){
		pause = false;
		innerLoopConvexHull();
		return;
	}
	for (var outerLoop = 0; outerLoop < connections.length; outerLoop++) {
		connections[outerLoop].setMap(null);
	}
	hullJ = 1;
	hullI = 0;
	setTimeout(innerLoopConvexHull, delay);
}

function innerLoopConvexHull() {
	
	if(pause)
		return;
	
	point1 = waypoints[hullI];
	point2 = waypoints[hullJ];

	//higlight the points being considered
	//updateMarkerAndTable(i, visualSettings.leader, 30, false);
	updateMarkerAndTable(hullJ, visualSettings.visiting, 30, false);

	// from here, we need to see if all other points are
	// on the same side of the line connecting point1 and point2
	a = point2.lat - point1.lat;
	b = point1.lon - point2.lon;
	c = point1.lon * point2.lat - point1.lat * point2.lon;
	// now check all other points to see if they're on the
	// same side -- stop as soon as we find they're not
	lookingForPositive = false;
	foundProblem = false;
	firstTestPoint = true;

	visitingLine[0] = new google.maps.LatLng(point1.lat, point1.lon);
	visitingLine[1] = new google.maps.LatLng(point2.lat, point2.lon);
	visitingLineHull(visitingLine);

	setTimeout(innerLoop2, delay);
}

function innerLoop2() {
	
	if(pause)
		return;
	
	for (var k = 0; k < waypoints.length; k++) {

		var point3 = waypoints[k];

		if (point1 === point3 || point2 === point3) {
			continue;
		}
		updateMarkerAndTable(k, visualSettings.hullK, 30, false);
		var checkVal = a * point3.lon + b * point3.lat - c;

		if (checkVal === 0) {
			if (isBetween(point1, point2, point3)) {
				continue;
			} else {
				foundProblem = true;
				break;
			}
		}
		if (firstTestPoint) {
			lookingForPositive = (checkVal > 0);
			firstTestPoint = false;
		} else {
			if ((lookingForPositive && (checkVal < 0) ||
					(!lookingForPositive && (checkVal > 0)))) {
				// segment not on hull, jump out of innermost loop
				foundProblem = true;
				break;
				//possibly end 3rd for loop here
			}
		}
	}

	currentSegment.setMap(null);
	if (!foundProblem) {

		// purple line showing convex hull
		hull[0] = new google.maps.LatLng(point1.lat, point1.lon);
		hull[1] = new google.maps.LatLng(point2.lat, point2.lon);
		polyline = new google.maps.Polyline({
			map: map,
			path: hull,
			strokeColor: '#cc00ff',
			strokeOpacity: 0.6,
			strokeWeight: 6
		});
		updateMarkerAndTable(hullI, visualSettings.startVertex, 30, false);
		updateMarkerAndTable(hullJ, visualSettings.startVertex, 30, false);
	} else {
		updateMarkerAndTable(hullJ, visualSettings.discarded, 30, false);
	}
	hullJ++;
	if (hullJ == waypoints.length) {
		updateMarkerAndTable(hullI, visualSettings.discarded, 30, false);
		hullI++;
		hullJ = hullI + 1;
	}

	if (hullI < waypoints.length - 1) {
		updateMarkerAndTable(hullI, visualSettings.hullI, 30, false);
		setTimeout(innerLoopConvexHull, delay);
	} else {

	}

}

//Compute Squared Distance 
function squaredDistance(o1,o2) {
        var dx, dy;
        dx = o1.lon-o2.lon;
        dy = o1.lat-o2.lat;
        return dx*dx + dy*dy;
}

=======
//New Convex Hull 
function addToHull(temp1, temp2){
    hull[0] = temp1;
    hull[1] = temp2;
}

//Compute Squared Distance 
function squaredDistance(o1, o2) {
	var dx, dy;
	dx = o1.lon - o2.lon;
	dy = o1.lat - o2.lat;
	return dx * dx + dy * dy;
}

/**
    Check if this point is directly in between the two given
    points.  Note: the assumption is that they are colinear.

    @param o1 one of the points
    @param o2 the other point
    @return whether this point is between the two given points
    */

function isBetween(o1, o2, o3) {
	var sqDisto1o2 = squaredDistance(o1, o2);
	alert("isBetween" + (squaredDistance(o3, o2) < sqDisto1o2) &&
		(squaredDistance(o3, o2) < sqDisto1o2));
	return (squaredDistance(o3, o2) < sqDisto1o2) &&
		(squaredDistance(o3, o2) < sqDisto1o2);
}

var hull = [];

var hullI = 0;
var hullJ = 0;
//var k = 0;
var hull = [];

var convexLineHull = [];

var visitingLine = [];

function showConvexLines(lineHull) {
	for (var i = 0; i < lineHull.length; i++) {
		connections[i].setMap(null);
		connections[i] = new google.maps.Polyline({
			map: map,
			path: lineHull,
			strokeColor: '#aa0000',
			strokeOpacity: 0.6,
			strokeWeight: 4
		});
	}
}

var currentSegment;

function visitingLineHull(lineHull) {
	//for (var i = 0; i < lineHull.length; i++) {
	//currentSegment.setMap(null);
	currentSegment = new google.maps.Polyline({
		map: map,
		path: lineHull,
		strokeColor: '#0000aa',
		strokeOpacity: 0.6,
		strokeWeight: 4
	});
	//}
}

var point1;
var point2;

var a;
var b;
var c;

var lookingForPositive;
var foundProblem;
var firstTestPoint;

function bruteForceConvexHull() {
	for (var outerLoop = 0; outerLoop < connections.length; outerLoop++) {
		connections[outerLoop].setMap(null);
	}
	hullJ = 1;
	hullI = 0;
	setTimeout(innerLoopConvexHull, delay);
}

function innerLoopConvexHull() {
	point1 = waypoints[hullI];
	point2 = waypoints[hullJ];

	//higlight the points being considered
	//updateMarkerAndTable(i, visualSettings.leader, 30, false);
	updateMarkerAndTable(hullJ, visualSettings.visiting, 30, false);

	// from here, we need to see if all other points are
	// on the same side of the line connecting point1 and point2
	a = point2.lat - point1.lat;
	b = point1.lon - point2.lon;
	c = point1.lon * point2.lat - point1.lat * point2.lon;
	// now check all other points to see if they're on the
	// same side -- stop as soon as we find they're not
	lookingForPositive = false;
	foundProblem = false;
	firstTestPoint = true;

	visitingLine[0] = new google.maps.LatLng(point1.lat, point1.lon);
	visitingLine[1] = new google.maps.LatLng(point2.lat, point2.lon);
	visitingLineHull(visitingLine);

	setTimeout(innerLoop2, delay);
}

function innerLoop2() {
	for (var k = 0; k < waypoints.length; k++) {

		var point3 = waypoints[k];

		if (point1 === point3 || point2 === point3) {
			continue;
		}
		updateMarkerAndTable(k, visualSettings.hullK, 30, false);
		var checkVal = a * point3.lon + b * point3.lat - c;

		if (checkVal === 0) {
			if (isBetween(point1, point2, point3)) {
				continue;
			} else {
				foundProblem = true;
				break;
			}
		}
		if (firstTestPoint) {
			lookingForPositive = (checkVal > 0);
			firstTestPoint = false;
		} else {
			if ((lookingForPositive && (checkVal < 0) ||
					(!lookingForPositive && (checkVal > 0)))) {
				// segment not on hull, jump out of innermost loop
				foundProblem = true;
				break;
				//possibly end 3rd for loop here
			}
		}
	}

	currentSegment.setMap(null);
	if (!foundProblem) {

		// purple line showing convex hull
		hull[0] = new google.maps.LatLng(point1.lat, point1.lon);
		hull[1] = new google.maps.LatLng(point2.lat, point2.lon);
		polyline = new google.maps.Polyline({
			map: map,
			path: hull,
			strokeColor: '#cc00ff',
			strokeOpacity: 0.6,
			strokeWeight: 6
		});
		updateMarkerAndTable(hullI, visualSettings.startVertex, 30, false);
		updateMarkerAndTable(hullJ, visualSettings.startVertex, 30, false);
	} else {
		updateMarkerAndTable(hullJ, visualSettings.discarded, 30, false);
	}
	hullJ++;
	if (hullJ == waypoints.length) {
		updateMarkerAndTable(hullI, visualSettings.discarded, 30, false);
		hullI++;
		hullJ = hullI + 1;
	}

	if (hullI < waypoints.length - 1) {
		updateMarkerAndTable(hullI, visualSettings.hullI, 30, false);
		setTimeout(innerLoopConvexHull, delay);
	} else {

	}

}

//Compute Squared Distance 
function squaredDistance(o1,o2) {
        var dx, dy;
        dx = o1.lon-o2.lon;
        dy = o1.lat-o2.lat;
        return dx*dx + dy*dy;
}

/**
    Check if this point is directly in between the two given
    points.  Note: the assumption is that they are colinear.

    @param o1 one of the points
    @param o2 the other point
    @return whether this point is between the two given points
    */

function isBetween(o1, o2, o3) {
        var sqDisto1o2 = squaredDistance(o1,o2);
        alert("isBetween" + (squaredDistance(o3,o2) < sqDisto1o2) &&
        (squaredDistance(o3,o2) < sqDisto1o2));
        return (squaredDistance(o3,o2) < sqDisto1o2) &&
        (squaredDistance(o3,o2) < sqDisto1o2);
    }




function getObj(elementID) {
    return document.getElementById(elementID);
}


// JS debug window by Mike Maddox from
// http://javascript-today.blogspot.com/2008/07/how-about-quick-debug-output-window.html
var DBG = {
    write: function (txt) {
        if (!window.dbgwnd) {
            window.dbgwnd = window.open("", "debug", "status=0,toolbar=0,location=0,menubar=0,directories=0,resizable=0,scrollbars=1,width=600,height=250");
            window.dbgwnd.document.write('<html><head></head><body style="background-color:black"><div id="main" style="color:green;font-size:12px;font-family:Courier New;"></div></body></html>');
        }
        var x = window.dbgwnd.document.getElementById("main");
        this.line = (this.line == null) ? 1 : this.line += 1;
        txt = this.line + ': ' + txt;
        if (x.innerHTML == "") {
            x.innerHTML = txt;
        } else {
            x.innerHTML = txt + "<br/>" + x.innerHTML;
        }
    }
}

//Creates the TOSLabels for the different map tiles and appends them to a div which is returned
function TOSLabel(){
	var menubar = document.querySelector(".menubar");
	
	var label = document.createElement("a");
	label.setAttribute("id", "ReferenceLink");
	label.setAttribute("href", "http://tm.teresco.org/credits.php");
	label.innerHTML = "Credits and Sources";
	
	menubar.appendChild(label);
}

var createTable = false;
var showAll = false;
var numVisitedString = document.createTextNode("Number of Visited Vertices: " + numVisited);
var numVisitedComingOutString = document.createTextNode("Number of Vertices Visited Coming out: " + numVisitedComingOut);
var numAlreadyVisitedString = document.createTextNode("Number of Vertices already Visited: " + numAlreadyVisited);
var nameAndSize = document.createTextNode(discoveredVerticesName + " Size: " + discoveredVertices.length);
function makeTable(){ 
    var size = discoveredVertices.length-1;
    if(createTable){
        var tableBody = dsTbody(size);
        var oldtableBody = document.getElementById("tablebody");
        oldtableBody.innerHTML = tableBody.innerHTML;
		if (size >9 && !showAll)
			collapseElements("collapseDataStructure");
    }
        else{
            createTable = true;
            
            var div = document.createElement("div");
            div.setAttribute("id", "makeTable");
            
            div.appendChild(numVisitedString);
            div.appendChild(document.createElement("br"));
            div.appendChild(numVisitedComingOutString);
            div.appendChild(document.createElement("br"));
            div.appendChild(numAlreadyVisitedString);
            div.appendChild(document.createElement("br"));
            div.appendChild(nameAndSize);
			
			var buttondiv = document.createElement("div");
			buttondiv.id = "collapseDataStructurebtn";
			buttondiv.style.display = "none";
			var btn = document.createElement("input");
			btn.type = "button";
			btn.addEventListener("click", undoCollapse);
			btn.addEventListener("click", function(){showAll = true;});
			btn.value = "Expand";
			buttondiv.appendChild(btn);
			div.appendChild(buttondiv);
			buttondiv = document.createElement("div");
			buttondiv.className = "collapseDataStructure";
			buttondiv.style.display = "none";
			btn = document.createElement("input");
			btn.addEventListener("click", function(){collapseElements("collapseDataStructure");
			showAll = false;});
			btn.value = "Collapse";
			btn.type = "button";
			buttondiv.appendChild(btn);
			div.appendChild(buttondiv);
            
            var table = document.createElement("table");
            table.setAttribute("id", "table");
            var tableBody = document.createElement("tbody");
            tableBody.setAttribute("id","tablebody");
            
            if(discoveredVerticesName == "Stack"){
                for (var i = discoveredVertices.length-1; i >= 0 ; i--) {
                    var row = document.createElement("tr");
                    row.setAttribute("id", "l" + i);
                    row.innerHTML = discoveredVertices[i].vIndex;
                    tableBody.appendChild(row);
                    }   
            }
            
            else if(discoveredVerticesName == "Queue"){
                for (var i = 0; i <= size ; i++) {
                    var row = document.createElement("td");
                    row.setAttribute("id", "l" + i);
                    row.innerHTML = discoveredVertices[i].vIndex;
                    tableBody.appendChild(row);
                }
            }
        }
            table.appendChild(tableBody);
            table.setAttribute("border", "2");
            div.appendChild(table);
        }
    return div;        
}

//Add gradient to points and corresponding table values 

function dsElement(type, num){
	var ele = document.createElement(type);
	ele.className = "";
	ele.setAttribute("onmouseover", "hoverV("+num+", true)");
	ele.setAttribute("onmouseout", "hoverEndV("+num+", true)");
	ele.setAttribute("onclick", "LabelClick("+num+")");
	ele.setAttribute("id", "l" + num);
	return ele;
}

function dsTbody(size){
    numVisitedString.nodeValue = "Number of Visited Vertices: " + numVisited;
    numVisitedComingOutString.nodeValue = "Number of Vertices Visited Coming out: " + numVisitedComingOut;
    numAlreadyVisitedString.nodeValue = "Number of Vertices already Visited: " + numAlreadyVisited;
    nameAndSize.nodeValue = discoveredVerticesName + " Size: " + discoveredVertices.length;
	var tableBody = document.createElement("tbody");
    if(discoveredVerticesName == "Stack"){
        for (var i = 0; i <= size ; i++) { 
			var point =  discoveredVertices[discoveredVertices.length-(1+i)].vIndex;
            var row = dsElement("tr", point);
			var col = document.createElement("td");
			col.innerHTML = point;
			row.appendChild(col);
			if (i > 9){
				row.className = "collapseDataStructure";
			}
            tableBody.appendChild(row);
        }
    }
    else if(discoveredVerticesName == "Queue" || discoveredVerticesName == "PQueue"){
		var row = document.createElement("tr");
        for (var i = 0; i <= size ; i++) { 				
            var col = dsElement("td", discoveredVertices[i].vIndex);
            if (i > 9){
				col.className = "collapseDataStructure";
			}
			if (discoveredVerticesName == "PQueue")
				col.innerHTML = discoveredVertices[i].vIndex + " dist: " + Math.round(discoveredVertices[i].dist*100)/100;
			else
				col.innerHTML = discoveredVertices[i].vIndex;
			row.appendChild(col);
            tableBody.appendChild(row);
        }
	}
	return tableBody;
}
