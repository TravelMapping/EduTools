//
// HDX Traversal Orderings AV
//
// METAL Project
//
// Primary Author: Luke Jennings
// Edited by: Michael Plekan
//

var hdxOrderingAV = {
    value: "ordering",
    name: "Traversal Orderings",
    description: "Visualize various 1D orderings of vertices (waypoints) in 2D space.",

    // used to track the num of the two verticies we are drawing an
    // edge between
    v1: 0,
    v2: 0,
    // used to help calculate the dimensions of the quadtree
    n: 0,
    s: 0,
    e: 0,
    w: 0,

    // default refinement threshold for the quadtree used by the
    //morton order deterimined with an i/o box before the av runs
    refinement: 2,

    supportRefinement: false,

    // loop variable that tracks which point is currently being added to graph
    nextToCheck: -1,
    // rainbow object that returns the color for the polylines
    rainbowGradiant: new Rainbow(),
    
    // used to keep track of all the polylines added to the map
    polyLines: [],
    // used for the polylines of the bounding box
    boundingPoly: [],

    // given that we are sorting the waypoints array, we want to store
    // the original waypoints array so that we can revert back to it
    // when we go to cleanup/cleanupUI
    originalWaypoints: [],
    numVUndiscovered: waypoints.length,

    // the easiest way to generate the orderings is creating a
    // quadtree containing all points in the graph, and then perform a
    // specialized traversal algorithm. If want to know more, go to
    // hdxquadtreeav.js
    quadtree: null,

    lengthEdges: 0,
    currentEdgeLength: 0,
    lengthOfEdges: [],

    avActions: [
        {
            label: "START",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.nextToCheck = -1;
                //this contains the edges for the traversal
                thisAV.polyLines = [];
                thisAV.boundingPoly = [];

                thisAV.originalWaypoints = waypoints.slice();
                thisAV.numVUndiscovered = waypoints.length,

                thisAV.lengthEdges = 0;
                thisAV.currentEdgeLength = 0;
                thisAV.longestEdgeLength = 0;
                thisAV.lengthOfEdges = [];


                updateAVControlEntry("undiscovered",thisAV.numVUndiscovered + " vertices not yet visited");

                thisAV.option = document.getElementById("traversalOrdering").value;
                thisAV.refinement = document.getElementById("refinement").value;
                thisAV.showBB = document.getElementById("boundingBox").checked;
                thisAV.extraEdge = document.getElementById("extraEdge").checked;

                if (thisAV.showBB) {
                    thisAV.generateBoundingBox();
                }
                hdxAV.nextAction = "topForLoop";
                switch (thisAV.option) {
                case "morton":
                    thisAV.findExtremePoints();
                    thisAV.quadtree = new Quadtree(thisAV.s,thisAV.n,thisAV.w,thisAV.e,thisAV.refinement);
                    for (var i = 0; i < waypoints.length; i++) {
                        waypoints[i].num = i;
                        thisAV.quadtree.add(waypoints[i]);
                    }
                    if (thisAV.showBB) {
                        thisAV.quadtree.mortonOrderPoly(thisAV.boundingPoly);
                        for (var i = 0; i < thisAV.boundingPoly.length; i++) {
                            thisAV.boundingPoly[i].addTo(map);
                        }
                    }
		    else {
                        thisAV.quadtree.mortonOrder();
                    }
                    break;
                case "hilbert":
                    thisAV.findExtremePoints();
                    thisAV.quadtree = new Quadtree(thisAV.s,thisAV.n,thisAV.w,thisAV.e,thisAV.refinement);
                    for (var i = 0; i < waypoints.length; i++) {
                        waypoints[i].num = i;
                        thisAV.quadtree.add(waypoints[i]);
                    }
                    if (thisAV.showBB) {
                        thisAV.quadtree.hilbertOrderPoly(0,thisAV.boundingPoly);
                        for (var i = 0; i < thisAV.boundingPoly.length; i++) {
                            thisAV.boundingPoly[i].addTo(map);
                        }
                    }
		    else {
                        thisAV.quadtree.hilbertOrder(0);
                    }
                    break;
                case "moore":
                    thisAV.findExtremePoints();
                    thisAV.quadtree = new Quadtree(thisAV.s,thisAV.n,thisAV.w,thisAV.e,thisAV.refinement);
                    for (var i = 0; i < waypoints.length; i++) {
                        waypoints[i].num = i;
                        thisAV.quadtree.add(waypoints[i]);
                    }
                    if (thisAV.showBB) {
                        thisAV.quadtree.mooreOrderPoly(thisAV.boundingPoly);
                        for (var i = 0; i < thisAV.boundingPoly.length; i++) {
                            thisAV.boundingPoly[i].addTo(map);
                        }
                    }
		    else {
                        thisAV.quadtree.mooreOrder();
                    }
                    break;
                case "grey":
                    thisAV.findExtremePoints();
                    thisAV.quadtree = new Quadtree(thisAV.s,thisAV.n,thisAV.w,thisAV.e,thisAV.refinement);
                    for (var i = 0; i < waypoints.length; i++) {
                        waypoints[i].num = i;
                        thisAV.quadtree.add(waypoints[i]);
                    }
                    if (thisAV.showBB) {
                        thisAV.quadtree.greyOrderPoly(0,thisAV.boundingPoly);
                        for (var i = 0; i < thisAV.boundingPoly.length; i++) {
                            thisAV.boundingPoly[i].addTo(map);
                        }
                    }
		    else {
                        thisAV.quadtree.greyOrder(0);
                    }
                    break;
		    
                default:
                    for (var i = 0; i < waypoints.length; i++) {
                        waypoints[i].num = i;
                    }
                    break;
                }
		
                switch (thisAV.option) {
                case "byLat":
                    waypoints.sort(function(a, b) {return a.lat - b.lat});
                    break;
                case "byLng":
                    waypoints.sort(function(a, b) {return a.lon - b.lon});
                    break;
                case "rand":
                    waypoints.sort(function(a, b) {return Math.random() * 2 - 1});
                    break;
                case "hilbert":
                case "moore":
                case "morton":
                case "grey":
                    waypoints.sort(function(a, b) {return a.value - b.value});   
                    break;
                case "default":
                    waypoints.sort(function(a,b) {return a.num - b.num});
                default:
                    break;
                };
		
                if (thisAV.extraEdge) {
                    waypoints.push(waypoints[0]);
                }

                thisAV.rainbowGradiant = new Rainbow();
                thisAV.rainbowGradiant.setNumberRange(0,waypoints.length);
                thisAV.rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');
            },
            logMessage: function(thisAV) {
                return "Sorting waypoints based on the selected ordering";
            }
        },

        {
            label: "topForLoop",
            comment: "",
            code: function(thisAV) {

                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.nextToCheck++;
                
                if (thisAV.nextToCheck < waypoints.length - 1) {
                    thisAV.v1 = waypoints[thisAV.nextToCheck].num;
                    thisAV.v2 = waypoints[thisAV.nextToCheck + 1].num;
                    updateMarkerAndTable(thisAV.v1, visualSettings.v1,
					 31, false);
                    updateMarkerAndTable(thisAV.v2, visualSettings.v2,
					 31, false);
		    
                    hdxAV.nextAction = "addEdge";
		    
                    thisAV.numVUndiscovered--;
                    updateAVControlEntry("undiscovered",thisAV.numVUndiscovered + " vertices not yet visited");
                    updateAVControlEntry("v1","from: #" + thisAV.v1 + " " + waypoints[thisAV.nextToCheck].label);
                    updateAVControlEntry("v2","to: #" + thisAV.v2 + " " + waypoints[thisAV.nextToCheck + 1].label);

                }
		else {
                    hdxAV.nextAction = "cleanup";
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Iterating over the sorted array of vertices";
            }
        },
	
        {
            label: "addEdge",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                let color = {
                    color: "#" + thisAV.rainbowGradiant.colorAt(
                        thisAV.nextToCheck),
                    textColor: "white",
                    scale: 6,
                    name: "color",
                    value: 0,
                    opacity: 0.8
                }
                updateMarkerAndTable(thisAV.v1, color, 30, false);
                updateMarkerAndTable(thisAV.v2, color, 30, false);
		
		
                thisAV.drawLineVisiting();
		
                updateAVControlEntry("totalLength","Total length of edges: " + thisAV.lengthEdges.toFixed(3) + " " + distanceUnits);
		
                if (thisAV.currentEdgeLength > thisAV.longestEdgeLength) {
                    thisAV.longestEdgeLength = thisAV.currentEdgeLength;
                    updateAVControlEntry("longestEdge","Longest edge added: " + thisAV.longestEdgeLength.toFixed(3) + " " + distanceUnits);
                }
		
                updateAVControlEntry("varianceLength","Standard deviation of edges: " + thisAV.calculateStdevOfEdges() + " " + distanceUnits);
                hdxAV.nextAction = "topForLoop"
		
            },
            logMessage: function(thisAV) {
                return "Adding edge between vertex #" + waypoints[thisAV.nextToCheck].num + " and vertex #"
                    + waypoints[thisAV.nextToCheck + 1].num;
            
            }
	},	    
        {
            label: "cleanup",
            description: "",
            code: function(thisAV) {
            // Partitioning
                if (document.getElementById("calcparts").checked == true) {
                    var parts = Number(document.getElementById("numOfParts").value);
                    hdxPart.parts = new Array(parts);
                    hdxPart.numParts = parts;
                    for (var p = 0; p < parts; p++) {
                        hdxPart.parts[p] = new Array();
                        let left = Math.trunc(waypoints.length%parts);
	                let inter = Math.trunc(waypoints.length/parts);
	                let strt = p*inter+Math.min(p,left);
	                let cnt = inter;
	                if (p<left) cnt++;
	                let end = strt+cnt;
                        for (var i= strt; i < end; i++) {
                            hdxPart.parts[p].push(waypoints[i].num);
                        }
                    }
                }
		
                waypoints = thisAV.originalWaypoints;
                hdxAV.algStat.innerHTML =
                    "Done! Visited " + waypoints.length + " waypoints.";
                hdxAV.nextAction = "DONE";
                updateAVControlEntry("undiscovered","0 vertices not yet visited");
                updateAVControlEntry("v1","");
                updateAVControlEntry("v2","");
		
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],

    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        initWaypointsAndConnections(true, false, visualSettings.undiscovered);

        // pseudocode
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += `g &larr; new Graph(V[], null)<br />`;
        this.code += `sortedV[] &larr; sort(V)`;

        this.code += '</td></tr>' +
            pcEntry(0,'for (check &larr; 0 to |sortedV| - 1)',"topForLoop");
        
        this.code += '</td></tr>' +
            pcEntry(1,'g.addEdge(sortedV[check], sortedV[check + 1])',"addEdge");
    },
    
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");
        // I'm going to need to learn how to make the AO change
        // depending on which ordering is selected

        let newAO = `Order: <select id="traversalOrdering" onchange="refinementChanged();">
        <option value="byLat">By Latitude</option>
        <option value="byLng">By Longitude</option>
        <option value="rand">Random</option>
        <option value="morton">Morton/Z Curve</option>
        <option value="hilbert">Hilbert Curve</option>
        <option value="moore">Moore Curve</option>
        <option value="grey">Grey Code</option>
        <option value="default">Default</option>

        <!--<option value="fixedGrey">Fixed Grey Curve</option>-->
        </select>`;
	
        newAO += '<br />Refinement Threshold<input type="number" id="refinement" min="2" max="' 
            + (waypoints.length) + '" value="2">';
	
        newAO += `<br /><input id="boundingBox" type="checkbox" name="Show Bounding Box"/>&nbsp;
        Show Bounding Box<br />`
	
        newAO +=
            `<br /><input id="extraEdge" type="checkbox" name="Draw Edge from Last to First"/>&nbsp;
        Draw Edge from Last to First<br />`
	
        // partitioning
        newAO += hdxPart.partHtml();
        hdxAV.algOptions.innerHTML = newAO;
	
	// QS parameters
	HDXQSClear(this);
	HDXQSRegisterAndSetSelectList(this, "curve", "traversalOrdering");
	HDXQSRegisterAndSetNumber(this, "refine", "refinement", 2,
				  waypoints.length);
	HDXQSRegisterAndSetCheckbox(this, "box", "boundingBox");
	HDXQSRegisterAndSetCheckbox(this, "connect", "extraEdge");
	HDXQSRegisterAndSetCheckbox(this, "calcparts", "calcparts");
	HDXQSRegisterAndSetNumber(this, "numparts", "numOfParts", 1,
				  waypoints.length);

	// AVCP entries
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("v1",visualSettings.v1);
        addEntryToAVControlPanel("v2", visualSettings.v2);
        addEntryToAVControlPanel("totalLength",visualSettings.discovered);
        addEntryToAVControlPanel("longestEdge",visualSettings.spanningTree);
        addEntryToAVControlPanel("varianceLength",visualSettings.averageCoord);

        let refSelector = document.getElementById("refinement");
        refSelector.disabled = true;
    },

    cleanupUI() {
        waypoints = this.originalWaypoints;
        for (var i = 0; i < this.polyLines.length; i++) {
            this.polyLines[i].remove();
        }
        for (var i = 0; i < this.boundingPoly.length; i++) {
            this.boundingPoly[i].remove();
        }
        this.polyLines = [];
        this.boundingPoly = [];
    },

    idOfAction(action) {
	
        return action.label;
    },

    // this was copied directly over from hdxextremepairsav with some
    // slight modifications
    drawLineVisiting() {

        let visitingLine = [];
        visitingLine[0] = [waypoints[this.nextToCheck].lat, waypoints[this.nextToCheck].lon];
        visitingLine[1] = [waypoints[this.nextToCheck + 1].lat, waypoints[this.nextToCheck + 1].lon];

        this.currentEdgeLength = convertToCurrentUnits(
		    distanceInMiles(waypoints[this.nextToCheck].lat,
                                    waypoints[this.nextToCheck].lon,
                                    waypoints[this.nextToCheck + 1].lat,
                                    waypoints[this.nextToCheck + 1].lon));
        this.lengthEdges += this.currentEdgeLength;
        this.lengthOfEdges.push(this.currentEdgeLength);

        updateAVControlEntry("totalLength","Total length of edges so far: " + this.lengthEdges.toFixed(2) + " mi");
        
        this.polyLines.push(
            L.polyline(visitingLine, {
		color: "#" + this.rainbowGradiant.colorAt(
		    this.nextToCheck),
		opacity: 0.6,
		weight: 4
            })
        );
        for (var i = 0; i < this.polyLines.length; i++) {
            this.polyLines[i].addTo(map);
        }  
    },

    // function calculate the the variance of the set of edge lengths and
    // then square roots it to get the standard deviation
    calculateStdevOfEdges() {
        let variance = 0;
        let mean = this.lengthEdges / (this.nextToCheck + 1);
        for (var i = 0; i < this.lengthOfEdges.length; i++) {
            variance += Math.pow(this.lengthOfEdges[i] - mean,2)
        }
        let popStdev = Math.sqrt(variance / (this.nextToCheck + 1));
        return popStdev.toFixed(3);
    },
    
    setConditionalBreakpoints(name) {
        return "No innerHTML";
    },
    
    hasConditionalBreakpoints(name) {
        return false;
    },
    
    findExtremePoints() {
        this.n = parseFloat(waypoints[0].lat);
        this.s = parseFloat(waypoints[0].lat);
        this.e = parseFloat(waypoints[0].lon);
        this.w = parseFloat(waypoints[0].lon);
        for (var i = 1; i < waypoints.length; i++) {
	    
            if (waypoints[i].lat > this.n) {
                this.n = parseFloat(waypoints[i].lat);
            }
	    else if (waypoints[i].lat < this.s) {
                this.s = parseFloat(waypoints[i].lat);
            }
            if (waypoints[i].lon > this.e) {
                this.e = parseFloat(waypoints[i].lon);
            }
	    else if (waypoints[i].lon < this.w) {
                this.w = parseFloat(waypoints[i].lon);
            }
        }
    },

    generateBoundingBox() {
        this.n = parseFloat(waypoints[0].lat);
        this.s = parseFloat(waypoints[0].lat);
        this.e = parseFloat(waypoints[0].lon);
        this.w = parseFloat(waypoints[0].lon);
        for (var i = 1; i < waypoints.length; i++) {

            if (waypoints[i].lat > this.n) {
                this.n = parseFloat(waypoints[i].lat);
            }
	    else if (waypoints[i].lat < this.s) {
                this.s = parseFloat(waypoints[i].lat);
            }
            if (waypoints[i].lon > this.e) {
                this.e = parseFloat(waypoints[i].lon);
            }
	    else if (waypoints[i].lon < this.w) {
                this.w = parseFloat(waypoints[i].lon);
            }
        }

        // creating the polylines for the bounding box
        let nEnds = [[this.n,this.w],[this.n,this.e]];
        let sEnds = [[this.s,this.w],[this.s,this.e]];
        let eEnds = [[this.n,this.e],[this.s,this.e]];
        let wEnds = [[this.n,this.w],[this.s,this.w]];
	
        this.boundingPoly.push(
            L.polyline(nEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        this.boundingPoly.push(
            L.polyline(sEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        this.boundingPoly.push(
            L.polyline(eEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        this.boundingPoly.push(
            L.polyline(wEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            }) 
        );
	
        for (var i = 0; i < 4; i++) {
            this.boundingPoly[i].addTo(map);
        }
    },
};

function refinementChanged() {

    let selector = document.getElementById("traversalOrdering");
    let refSelector = document.getElementById("refinement");
    switch (selector.options[selector.selectedIndex].value) {
        case "morton":
        case "hilbert":
        case "moore":
        case "grey":
            refSelector.disabled = false;
            break;
        default:
            refSelector.disabled = true;
            break;
    }        
};
