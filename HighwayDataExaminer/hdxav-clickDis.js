//
// HDX Algorithm Visualization Template File
//
// METAL Project
//
// Primary Authors: Gregory Drapeau
//

// 
const hdxClickDisAV = {
    value: 'clickDis',
    name: "Distance from Click",
    description: "This algorithm will show the user the distance of points from the spot at which they click in the map.",

    // vertices, no edges
    useV: true,
    useE: false,

	// User configured settings
	findVertices: null,
	lat: null,
	lon: null,
	maxDistance: null,
	minVertices: null,
	
	// Map features
	marker: null,
	circle: null,
	
	// Graph information
	computedDistances: [],
	//[vertex, distance(miles)]
	closestMarker: [-1, 24901],
	furthestMarker: [-1, 0],
	
	currentDistance: null,
	vertexStatus: true,
	
    // loop variable that tracks which point is currently being operated upon
    nextToCheck: -1,

    // The avActions array defines all of the actions of the AV
    avActions : [
        {
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.nextToCheck = -1;

                // User configurations
                thisAV.numVUndiscovered = waypoints.length,
                
                thisAV.vertexStatus = true;
                
                thisAV.computedDistances = [];
                
                thisAV.closestMarker = [-1, 24901];
                thisAV.furthestMarker = [-1, 0];

                hdxAV.nextAction = "topOfLoop";
            },
            logMessage: function(thisAV) {
                return "Initializing";
            }
        },
        {
                label: "topOfLoop",
                comment: "Top of loop handles incrementing count and where to go next",
                code: function(thisAV) {
                	// Setting old vertex to new color
                	if(thisAV.closestMarker[0]!=-1){
                		updateMarkerAndTable(thisAV.closestMarker[0], visualSettings.v1, 30, false);
                	}
                	if(thisAV.furthestMarker[0]!=-1){
                		updateMarkerAndTable(thisAV.furthestMarker[0], visualSettings.v2, 30, false);
                    }
                	if(!thisAV.vertexStatus){
                		updateMarkerAndTable(thisAV.nextToCheck, visualSettings.discarded, 30, false);
                	}
                	thisAV.vertexStatus = false;
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    // On new point
                    thisAV.nextToCheck++;
                    if(thisAV.nextToCheck<thisAV.numVUndiscovered){
                    	updateMarkerAndTable(thisAV.nextToCheck, visualSettings.discovered, 30, false);
                    }
                    
                    if(thisAV.nextToCheck<thisAV.numVUndiscovered){
                    	hdxAV.nextAction = "distCalc";
                    }else{
                    	hdxAV.nextAction = "cleanup";
                    }
                    hdxAV.iterationDone = true;
                    
                },
                logMessage: function(thisAV) {
                    return "Vertex number: "+thisAV.nextToCheck+"<br> nextAction: "+hdxAV.nextAction;
                }
        },
        {
                label: "distCalc",
                comment: "Calculates current distance in miles",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                	
                	// Calculating distance from click point to current vertex
                	thisAV.currentDistance=exactDistanceInMiles(thisAV.lat, thisAV.lon, waypoints[thisAV.nextToCheck].lat, waypoints[thisAV.nextToCheck].lon);
                    
                    if(thisAV.findVertices=="SLDistance"){
                    	hdxAV.nextAction = "checkSmallest";
                    }else if(thisAV.findVertices=="givenDistance"){
                    	hdxAV.nextAction = "inRadiusCheck";
                    }else if(thisAV.findVertices=="givenVertices"){
                    	hdxAV.nextAction = "nDistances";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "Distance: "+thisAV.currentDistance;
                }
        },
        {
                label: "checkSmallest",
                comment: "Checking if it is the closest point",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    if(thisAV.currentDistance<thisAV.closestMarker[1]){
                    	hdxAV.nextAction = "setSmallest";
                    }else{
                    	hdxAV.nextAction = "checkFurthest";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "nextAction: "+hdxAV.nextAction;
                }
        },
        {
                label: "setSmallest",
                comment: "Setting new shortest distance",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.v1);
                    
                    // Changing old closest to a different color
                    if(thisAV.closestMarker[0]!=-1){
                    	updateMarkerAndTable(thisAV.closestMarker[0], visualSettings.discarded, 30, false);
                    }
                    // Saving closest vertex
                    thisAV.closestMarker=[thisAV.nextToCheck, thisAV.currentDistance]
                    hdxAV.nextAction = "checkFurthest";
                    thisAV.vertexStatus=true;
                    // Update AVCP
                    document.getElementById("closestPoint").innerHTML="<tr><td style='background-color: rgb(30, 179, 238);'>#"+
                    thisAV.closestMarker[0]+" "+waypoints[thisAV.closestMarker[0]].label+" distance: "+thisAV.closestMarker[1].toFixed(3)+"</td></tr>";
                    // Update on map
                    updateMarkerAndTable(thisAV.closestMarker[0], visualSettings.v1, 30, false);
                    
                },
                logMessage: function(thisAV) {
                    return "The closest vertex has now been set to "+waypoints[thisAV.nextToCheck].label;
                }
        },
        {
                label: "checkFurthest",
                comment: "Checking if it is the furthest point",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    if(thisAV.currentDistance>thisAV.furthestMarker[1]){
                    	hdxAV.nextAction = "setFurthest";
                    }else{
                    	hdxAV.nextAction = "topOfLoop";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "nextAction: "+hdxAV.nextAction;
                }
        },
        {
                label: "setFurthest",
                comment: "Setting new furthest distance",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.v2);
                    
                    // Changing old furthest to a different color
                    if(thisAV.furthestMarker[0]!=-1){
                    	updateMarkerAndTable(thisAV.furthestMarker[0], visualSettings.discarded, 30, false);
                    }
                    // Saving furthest vertex
                    thisAV.furthestMarker=[thisAV.nextToCheck, thisAV.currentDistance];
                    hdxAV.nextAction = "topOfLoop";
                    thisAV.vertexStatus=true;
                    // Update AVCP 
                    document.getElementById("furthestPoint").innerHTML="<tr><td style='background-color: rgb(255, 60, 60);'>#"+
                    thisAV.furthestMarker[0]+" "+waypoints[thisAV.furthestMarker[0]].label+" distance: "+thisAV.furthestMarker[1].toFixed(3)+"</td></tr>";
                    // Update on map
                    updateMarkerAndTable(thisAV.furthestMarker[0], visualSettings.v2, 30, false);
                    
                },
                logMessage: function(thisAV) {
                    return "The furthest vertex has now been set to "+waypoints[thisAV.nextToCheck].label;
                }
        },
        {
                label: "inRadiusCheck",
                comment: "Checking to see if the current vertex is within prescribed area",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    if(thisAV.currentDistance<thisAV.maxDistance){
                    	hdxAV.nextAction = "inRadius";
                    }else{
                    	hdxAV.nextAction = "topOfLoop";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "nextAction: "+hdxAV.nextAction;
                }
        },
        {
                label: "inRadius",
                comment: "Adding to data structure",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    // Save vertex in data structure
                    thisAV.computedDistances.push([thisAV.nextToCheck, thisAV.currentDistance]);
                    hdxAV.nextAction = "topOfLoop";
                    thisAV.vertexStatus=true;
                    // Update AVCP
                    document.getElementById("pointCount").innerText="Number of points: "+thisAV.computedDistances.length;
                    const pointEntry = document.createElement("tr");
                    pointEntry.setAttribute("onmouseover", "updateMarkerAndTable("+thisAV.nextToCheck+", visualSettings.mismatchFound, 30, false)");
                    pointEntry.setAttribute("onmouseout", "updateMarkerAndTable("+thisAV.nextToCheck+", visualSettings.v1, 30, false)");
                    pointEntry.innerHTML = "<td>#"+thisAV.nextToCheck+" "+waypoints[thisAV.nextToCheck].label+"</td><td>"+thisAV.currentDistance.toFixed(3)+"</td>";
                    document.getElementById("pointEntries").appendChild(pointEntry);
                    // Update on map
                    updateMarkerAndTable(thisAV.nextToCheck, visualSettings.v1, 30, false);
                    
                },
                logMessage: function(thisAV) {
                    return "Data structure size: "+thisAV.computedDistances.length;
                }
        },
        {
                label: "nDistances",
                comment: "Adding point to the given vertices data structure if appropriate",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    thisAV.vertexStatus=true;
                    let i=0;
                    while(i<thisAV.computedDistances.length && thisAV.currentDistance>thisAV.computedDistances[i][1]){
                    	i++;
                    }
                    thisAV.computedDistances.splice(i, 0, [thisAV.nextToCheck, thisAV.currentDistance])
                    hdxAV.nextAction = "topOfLoop";
                    if(thisAV.computedDistances.length>thisAV.minVertices){
                    	updateMarkerAndTable(thisAV.computedDistances[thisAV.computedDistances.length-1][0], visualSettings.discarded, 30, false);
                    	thisAV.computedDistances.pop();
                    }
                    
                    if(thisAV.circle!=null){
                    	thisAV.circle.remove();
                    }
                    document.getElementById("distance").innerHTML="Minimum distance: "+thisAV.computedDistances[thisAV.computedDistances.length-1][1].toFixed(3);
                    let pointEntries="<tr><td>Vertex</td><td>Distance</td></tr>";
                    for(let i=0;i<thisAV.computedDistances.length;i++){
                    	pointEntries+="<tr onmouseover='updateMarkerAndTable("+thisAV.computedDistances[i][0]+", visualSettings.mismatchFound, 30, false)' onmouseout='updateMarkerAndTable("+thisAV.computedDistances[i][0]+", visualSettings.v1, 30, false)'><td>#"+thisAV.computedDistances[i][0]+" "+waypoints[thisAV.computedDistances[i][0]].label+"</td><td>"+thisAV.computedDistances[i][1].toFixed(3)+"</td></tr>";
                    	updateMarkerAndTable(thisAV.computedDistances[i][0], visualSettings.v1, 30, false);
                    }
                    document.getElementById("pointEntries").innerHTML=pointEntries;
                    thisAV.circle=L.circle([thisAV.lat, thisAV.lon], {
						color: 'red',
						fillColor: '#f03',
						fillOpacity: 0.5,
						radius: thisAV.computedDistances[thisAV.computedDistances.length-1][1]*1609.34
					}).addTo(map);
                    
                },
                logMessage: function(thisAV) {
                	return "Furthest point in the data structure has a distance of "+thisAV.computedDistances[thisAV.computedDistances.length-1][1];
                }
        },
        {
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                    
                    hdxAV.nextAction = "DONE";
                    hdxAV.iterationDone = true;
                    
                },
                logMessage: function(thisAV) {
                    return "Cleanup and finalize visualization";
                }
        }
    ],
    
    // prepToStart is a required function which is called when you hit
    // visualize but before you hit start
    // Adds elements to the map, sets up AVCP and Pseudo code
    prepToStart() {
		// Setting user configurations
        this.findVertices=document.getElementById("findVertices").value;
		this.lat=document.getElementById("centerLat").value;
		this.lon=document.getElementById("centerLon").value;
		this.maxDistance=document.getElementById("maxDistance").value;
		this.minVertices=document.getElementById("minVertices").value;

		// Adding map elements
		this.marker=L.marker([this.lat, this.lon]).addTo(map);
			if(this.findVertices=="givenDistance"){
				this.circle=L.circle([this.lat, this.lon], {
					color: 'red',
					fillColor: '#f03',
					fillOpacity: 0.5,
					radius: this.maxDistance*1609.34
				}).addTo(map);
			}
	
		// AV Pseudo Code
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        if(this.findVertices=="SLDistance"){
        	this.code += 'referencePoint<br>v<sub>closest</sub> &larr; -1<br>d<sub>closest</sub> &larr; &infin;<br>v<sub>furthest</sub> &larr; -1<br>d<sub>furthest</sub> &larr; 0</td></tr>';
        }else if(this.findVertices=="givenDistance"){
        	this.code += 'referencePoint<br>maxDistance &larr; '+this.maxDistance+'<br>closePoints &larr; []</td></tr>';
        }else if(this.findVertices=="givenVertices"){
        	this.code += 'referencePoint<br>computedDistances &larr; []<br>minVertices &larr; '+this.minVertices+'</td></tr>';
        }
        this.code += pcEntry(0, "for (v &larr; to |V|-1)", "topOfLoop");
        this.code += pcEntry(1, "d &larr; dist(referencePoint, v)", "distCalc");
        if(this.findVertices=="SLDistance"){
        	this.code += pcEntry(1, "if d < d<sub>closest</sub>", "checkSmallest");
        	this.code += pcEntry(2, ["d<sub>closest</sub> &larr; d", "v<sub>closest</sub> &larr; v"], "setSmallest");
        	this.code += pcEntry(1, "else if d > d<sub>furthest</sub>", "checkFurthest");
        	this.code += pcEntry(2, ["d<sub>furthest</sub> &larr; d", "v<sub>furthest</sub> &larr; v"], "setFurthest");
        }else if(this.findVertices=="givenDistance"){
        	this.code += pcEntry(1, "if d < maxDistance", "inRadiusCheck");
        	this.code += pcEntry(2, "closePoints.push(v)", "inRadius");
        }else if(this.findVertices=="givenVertices"){
        	this.code += pcEntry(1, "computedDistances.push(v,d)", "nDistances");
        }
        
        // AVCP layout
        let points;
        if(this.findVertices=="SLDistance"){
        	points = '<span>Closest point:</span>' +
            '<table id="closestPoint" style="width:100%;"></table>'+
            '<br><span>Furthest point:</span>' +
            '<table id="furthestPoint" style="width:100%;"></table>';
        }else if(this.findVertices=="givenDistance"){
        	points = '<span id="pointCount">Number of points: 0</span>' +
            '<table id="pointEntries" style="width:100%;"><tr><td>Vertex</td>' +
            '<td>Distance</td></tr></table>';
        }else if(this.findVertices=="givenVertices"){
        	points = '<span id="distance">Minimum distance: &infin;</span>' +
            '<table id="pointEntries" style="width:100%;"><tr><td>Vertex</td>' +
            '<td>Distance</td></tr></table>';
        }
        hdxAVCP.update("distanceInfo", points);
    },
    // setupUI sets up what options are available for the user to select before running the AV and the adds an element to the AVCP
    setupUI() {

        let newAO;
        newAO = `<label for="findVertices">Choose how you wish the algorithm to work</label>
        <select id="findVertices" onchange="hdxClickDisAV.refinementChanged();">
        <option value="SLDistance">Shortest & Longest Distance</option>
        <option value="givenDistance">All points within a given Distance</option>
        <option value="givenVertices">Find the Distance needed to find N points</option>
        </select>`;
        newAO += `<br><label for="centerLat">Latitude: </label><input id="centerLat" min="-90" max="90"><br>
        <label for="centerLon">Longitude: </label><input id="centerLon" min="-180" max="180">`;
        newAO += `<div id="givenD" style="display:none;"><label for="maxDistance">Find the number of vertices within: </label>
        <input type="number" min="0" id="maxDistance"></div>`;
        newAO += `<div id="givenV" style="display:none;"><label for="minVertices">Minimum vertices to find: </label>
        <input type="number" min="1" max="`+waypoints.length+`" step="1" id="minVertices"></div>`;

        hdxAV.algOptions.innerHTML = newAO;
        map.on('click', function (e) {
    		document.getElementById("centerLat").value = e.latlng.lat;
    		document.getElementById("centerLon").value = e.latlng.lng;
		});
		
        // Add AV options to the QS
        HDXQSClear(this);
        HDXQSRegisterAndSetSelectList(this, "findVertices", "findVertices");
        HDXQSRegisterAndSetNumber(this, "lat", "centerLat", -90, 90);
        HDXQSRegisterAndSetNumber(this, "lon", "centerLon", -180, 180);
        HDXQSRegisterAndSetNumber(this, "maxDistance", "maxDistance", 0, 24901);
        HDXQSRegisterAndSetNumber(this, "minVertices", "minVertices", 1, waypoints.length);

        // Add element to AVCP
        hdxAVCP.add("distanceInfo", visualSettings.discovered);
       
    },
    // removing map changes
    cleanupUI() {
        this.marker.remove();
        if(this.findVertices!="SLDistance"){
        	this.circle.remove();
        }
    },
    idOfAction(action) {
	
        return action.label;
    },
    
    // adapted from hdxav-ordering.js to change options available to the user when appropriate
	refinementChanged() {
    	const selectionOptions = document.getElementById("findVertices");
    	const gDistance = document.getElementById("givenD");
    	const gVertices = document.getElementById("givenV");
    	if (selectionOptions.value=="givenDistance") {
    	    gDistance.style.display = "";
    	    gVertices.style.display = "none";
    	    gVertices.value="";
    	}else if (selectionOptions.value=="givenVertices"){
    	    gDistance.style.display = "none";
    	    gVertices.style.display = "";
    	    gDistance.value="";
    	}else{
    		gDistance.style.display = "none";
    	    gVertices.style.display = "none";
    	    gVertices.value="";
    	    gDistance.value="";
    	}
	}
}