//
// HDX Algorithm Visualization Template File
//
// METAL Project
//
// Primary Authors: (Insert names here)
//

// This global variable refers to the object containaing all the
// necessary fields, functions, and states for a given AV.  This
// variable must be pushed to the this.avList in the hdxav.js file,
// and the file of this AV must be included in the index.php file
const hdxClickDisAV = {
    // short name for list of avs, will be used for the av= QS parameter value
    value: 'clickDis',

    // Name as shown in the drop down menu when selecting from
    // different algorithms
    name: "Distance from Click",

    // Description as shown after the user selects the algorithm in
    //the drop down but before they press the "visualize" button
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
            // label represents the current state in state machine
	    // the initial state must be labeled as "START"
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // Note that the fields of the AV's object must be
                // accessed through "thisAV" rather than "this"
                thisAV.nextToCheck = -1;

                //this is typically used to track progress or how many
                //times to loop through the algorithm
                thisAV.numVUndiscovered = waypoints.length,
                
                thisAV.vertexStatus = true;
                
                thisAV.computedDistances = [];
                
                thisAV.closestMarker = [-1, 24901];
                thisAV.furthestMarker = [-1, 0];
            
                // each action must set the nextAction field to the
                // label of the next action to be performed
                hdxAV.nextAction = "topOfLoop";
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "Doing some setup stuff";
            }
        },
        {
                label: "topOfLoop",
                comment: "",
                code: function(thisAV) {
                	if(!thisAV.vertexStatus){
                		updateMarkerAndTable(thisAV.nextToCheck, visualSettings.discarded, 30, false);
                	}
                	thisAV.vertexStatus = false;
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    thisAV.nextToCheck++;
                    if(thisAV.nextToCheck<thisAV.numVUndiscovered){
                    	updateMarkerAndTable(thisAV.nextToCheck, visualSettings.discovered, 30, false);
                    }
                    
                    if(thisAV.nextToCheck<thisAV.numVUndiscovered){
                    	hdxAV.nextAction = "distCalc";
                    }else{
                    	if(thisAV.findVertices=="givenVertices"){
                    		document.getElementById("distance").innerHTML="Minimum distance: "+thisAV.computedDistances[thisAV.minVertices-1][1];
                    		const pointEntries=document.createElement("tbody");
                    		for(let i=0;i<thisAV.minVertices;i++){
                    			pointEntries.innerHTML+="<tr><td>"+thisAV.computedDistances[i][0]+" "+waypoints[thisAV.computedDistances[i][0]].label+"</td><td>"+thisAV.computedDistances[i][1]+"</td></tr>";
                    			updateMarkerAndTable(thisAV.computedDistances[i][0], visualSettings.v1, 30, false);
                    		}
                    		document.getElementById("pointEntries").appendChild(pointEntries);
                    		thisAV.circle=L.circle([thisAV.lat, thisAV.lon], {
								color: 'red',
								fillColor: '#f03',
								fillOpacity: 0.5,
								radius: thisAV.computedDistances[thisAV.minVertices-1][1]*1609.34
							}).addTo(map);
                    		
                    	}
                    	hdxAV.nextAction = "cleanup";
                    }
                    hdxAV.iterationDone = true;
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "distCalc",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                	thisAV.currentDistance=distanceInMiles(thisAV.lat, thisAV.lon, waypoints[thisAV.nextToCheck].lat, waypoints[thisAV.nextToCheck].lon);
                    
                    if(thisAV.findVertices=="SLDistance"){
                    	hdxAV.nextAction = "checkSmallest";
                    }else if(thisAV.findVertices=="givenDistance"){
                    	hdxAV.nextAction = "inRadiusCheck";
                    }else if(thisAV.findVertices=="givenVertices"){
                    	hdxAV.nextAction = "nDistances";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "checkSmallest",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    if(thisAV.currentDistance<thisAV.closestMarker[1]){
                    	hdxAV.nextAction = "setSmallest";
                    }else{
                    	hdxAV.nextAction = "checkFurthest";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "setSmallest",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    if(thisAV.closestMarker[0]!=-1){
                    	updateMarkerAndTable(thisAV.closestMarker[0], visualSettings.discarded, 30, false);
                    }
                    thisAV.closestMarker=[thisAV.nextToCheck, thisAV.currentDistance]
                    hdxAV.nextAction = "checkFurthest";
                    thisAV.vertexStatus=true;
                    document.getElementById("closestPoint").innerHTML="<tr><td>"+
                    thisAV.closestMarker[0]+" "+waypoints[thisAV.closestMarker[0]].label+"</td></tr>";
                    updateMarkerAndTable(thisAV.nextToCheck, visualSettings.v1, 30, false);
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "checkFurthest",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    if(thisAV.currentDistance>thisAV.furthestMarker[1]){
                    	hdxAV.nextAction = "setFurthest";
                    }else{
                    	hdxAV.nextAction = "topOfLoop";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "setFurthest",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    if(thisAV.furthestMarker[0]!=-1){
                    	updateMarkerAndTable(thisAV.furthestMarker[0], visualSettings.discarded, 30, false);
                    }
                    thisAV.furthestMarker=[thisAV.nextToCheck, thisAV.currentDistance];
                    hdxAV.nextAction = "topOfLoop";
                    thisAV.vertexStatus=true;
                    document.getElementById("furthestPoint").innerHTML="<tr><td>"+
                    thisAV.furthestMarker[0]+" "+waypoints[thisAV.furthestMarker[0]].label+"</td></tr>";
                    updateMarkerAndTable(thisAV.nextToCheck, visualSettings.v2, 30, false);
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "inRadiusCheck",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    if(thisAV.currentDistance<thisAV.maxDistance){
                    	hdxAV.nextAction = "inRadius";
                    }else{
                    	hdxAV.nextAction = "topOfLoop";
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "inRadius",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    thisAV.computedDistances.push([thisAV.nextToCheck, thisAV.currentDistance]);
                    hdxAV.nextAction = "topOfLoop";
                    thisAV.vertexStatus=true;
                    document.getElementById("pointCount").innerText="Number of points: "+thisAV.computedDistances.length;
                    const pointEntry = document.createElement("tr");
                    pointEntry.innerHTML = "<td>"+thisAV.nextToCheck+" "+waypoints[thisAV.nextToCheck].label+"</td><td>"+thisAV.currentDistance+"</td>";
                    document.getElementById("pointEntries").appendChild(pointEntry);
                    updateMarkerAndTable(thisAV.nextToCheck, visualSettings.v1, 30, false);
                    
                },
                logMessage: function(thisAV) {
                    return "";
                }
        },
        {
                label: "nDistances",
                comment: "",
                code: function(thisAV) {
                	highlightPseudocode(this.label, visualSettings.visiting);
                    
                    let i=0;
                    while(i<thisAV.computedDistances.length && thisAV.currentDistance>thisAV.computedDistances[i][1]){
                    	i++;
                    }
                    thisAV.computedDistances.splice(i, 0, [thisAV.nextToCheck, thisAV.currentDistance])
                    hdxAV.nextAction = "topOfLoop";
                    
                },
                logMessage: function(thisAV) {
                    return "";
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
        	this.code += pcEntry(2, "d<sub>closest</sub> &larr; d<br>&emsp;&emsp;&emsp;&emsp;v<sub>closest</sub> &larr; v", "setSmallest");
        	this.code += pcEntry(1, "else if d > d<sub>furthest</sub>", "checkFurthest");
        	this.code += pcEntry(2, "d<sub>furthest</sub> &larr; d<br>&emsp;&emsp;&emsp;&emsp;v<sub>furthest</sub> &larr; v", "setFurthest");
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
            '<span>Furthest point:</span>' +
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
    // setupUI is a required function that is called after you click
    // the algorithm in algorithm selection but before you press the
    // visualize button
    setupUI() {

        let newAO;
        newAO = `<label for="findVertices">Choose how you wish the algorithm to work</label>
        <select id="findVertices" onchange="hdxClickDisAV.refinementChanged();">
        <option value="SLDistance">Shortest & Longest Distance</option>
        <option value="givenDistance">All points within a given Distance</option>
        <option value="givenVertices">Find the Distance needed to find N points</option>
        </select>`;
        newAO += `<br><label for="centerLat">Latitude: </label><input id="centerLat" min="-90" max="90">
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
		
        HDXQSClear(this);
        HDXQSRegisterAndSetSelectList(this, "findVertices", "findVertices");
        HDXQSRegisterAndSetNumber(this, "lat", "centerLat", -90, 90);
        HDXQSRegisterAndSetNumber(this, "lon", "centerLon", -180, 180);
        HDXQSRegisterAndSetNumber(this, "maxDistance", "maxDistance", 0, 24901);
        HDXQSRegisterAndSetNumber(this, "minVertices", "minVertices", 1, waypoints.length);

        // Insert entries into the AV control panel to display data
        // structures and variables as the AV is executing
        hdxAVCP.add("distanceInfo", visualSettings.discovered);
       
    },
    // cleanupUI is a required function, called when you select a new
    // AV or map when after running an algorithm
    cleanupUI() {
        // for example, remove all the polylines made by any global
        // bounding box
        this.marker.remove();
        this.circle.remove();
    },

    // required function that is most often just what is shown here,
    // but see examples like vsearch for cases where this is not the
    // case (actions that are shared by multiple lines of code)
    idOfAction(action) {
	
        return action.label;
    },
    
    // any additional AV-specific functions may be added to the AV's
    // object here
    //adapted from hdxav-ordering.js
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