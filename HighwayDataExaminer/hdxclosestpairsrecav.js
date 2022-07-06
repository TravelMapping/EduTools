//
// HDX Recursive Divide and Conquer Closest Pairs AV
//
// METAL Project
//
// Primary Author: Jim Teresco, Alissa Ronca, Zac Goodsell
//

/* closest/farthest pairs of vertices, just brute force for now */
var hdxClosestPairsRecAV = {

    // entries for list of AVs
    value: "closestpairs-recursive",
    name: "Vertex Closest Pairs Recursive",
    description: "Search for the closest pair of vertices (waypoints) using recursive divide and conquer." +
    "<br />NOTE: This algorithm visualization has known bugs. Refresh webpage for consistent results.",
    
    // state variables for closest pairs search
    minPoints: 3,
    recursiveIndex: 0,
   // Stack: null,
    startIndex: 0,
    endIndex: 0,
    minLeft: 0,
    minRight: 0,
    midLineLong: 0,
    closeToCenter: null,
    minHalvesSquared: 0,
    forLoopIndex: 0,
    whileLoopIndex: 0,
    returnValue: 0,
    lineCount: 0,

    originalWaypoints: waypoints.slice(),
    //vertices sorted by longitude
    WtoE: null,
    //vertices sorted by latitude
    NtoS: [],
    
    //used for shading
    northBound: 0,
    southBound: 0,

    // computed distance between v1 and v2
    d_this: 0,

    // leader info
    closest: [-1, -1],
    d_closest: Number.MAX_VALUE,
    farthest: [-1, -1],
    d_farthest: 0,

    // polylines for leaders and visiting
    lineClosest: null,
    lineFarthest: null,
    lineVisiting: null,
    lineStack: null,
    
    // the actions that make up this algorithm
    avActions: [
        {
            label: "START",
            comment: "Initialize closest pair variables",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                updateAVControlEntry("closeLeader", "no leader yet, dclosest = &infin;");
                updateAVControlEntry("totalChecked", "no checks done yet");
                //thisAV.minPoints =
                  //  document.getElementById("minPoints").value;
                  thisAV.lineCount = 0;

                thisAV.WtoE = waypoints;
                let presort = new HDXPresort();
                thisAV.WtoE = presort.sortedWaypoints;

                thisAV.Stack = new HDXLinear(hdxLinearTypes.STACK,
                    "Stack");

                thisAV.savedArray = new HDXLinear(hdxLinearTypes.STACK,
                    "Stack");

                thisAV.rec_level_arr = new HDXLinear(hdxLinearTypes.STACK,
                    "Stack");
                thisAV.lineStack = new HDXLinear(hdxLinearTypes.STACK,
                    "Stack");    

                //this.StoN = new Array(waypoints);
                //thisAV.Stack = [];
                //thisAV.savedArray = new Array();
                thisAV.startIndex = 0;
                //thisAV.rec_level_arr= [];
                thisAV.rec_levelL = 0;
                thisAV.rec_levelR= 0;
                thisAV.endIndex = waypoints.length ;
                thisAV.minLeft = 0;
                thisAV.minRight = 0;
                thisAV.midLineLong = 0;
                thisAV.closeToCenter = [];
                thisAV.minHalvesSquared = 0;
                thisAV.forLoopIndex = 0;
                thisAV.whileLoopIndex = 0;
                thisAV.returnValue = 0;
                thisAV.minDist = [9999,0,0]
                thisAV.minSq = 0;
                thisAV.setMin = false;
                thisAV.currentLine;
                setMiddlePoint.southBound = waypoints[0].lat;
                thisAV.northBound = waypoints[0].lat;
                thisAV.Stack.add("cleanup");
                thisAV.globali = 0;
                thisAV.globalk = 0;
                thisAV.finalDraw = false;
                thisAV.oldRightStart = waypoints.length;
                thisAV.bounds = null;

                for (let i = 1; i < waypoints.length; i++) {
                    // keep track of northmost and southmost points
                    thisAV.southBound = Math.min(waypoints[i].lat, thisAV.southBound);
                    thisAV.northBound = Math.max(waypoints[i].lat, thisAV.northBound);
                }

                
                hdxAV.nextAction = "recursiveCallTop"
            },
            logMessage: function(thisAV) {
                return "Initializing closest pair variables";
            }
        },
        {
            label: "recursiveCallTop",
            comment: "Call recursion",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                //thisAV.Stack.add([thisAV.startIndex, thisAV.endIndex]);
                hdxAV.nextAction = "checkBaseCase"
            },
            logMessage: function(thisAV) {
                return "Call recursion";
            }
        },
        {
            label: "checkBaseCase",
            comment: "Check if base case is reached",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                for (let i = 0  ; i < thisAV.WtoE.length; i++) {
                    updateMarkerAndTable(waypoints.indexOf(thisAV.WtoE[i]),
                        visualSettings.discarded,
                        40, false);
                }
                for (let i = thisAV.startIndex  ; i < thisAV.WtoE.length; i++) {
                    updateMarkerAndTable(waypoints.indexOf(thisAV.WtoE[i]),
                        visualSettings.spanningTree,
                        40, false);
                }
                for (let i = thisAV.startIndex; i < thisAV.endIndex; i++) {
                    updateMarkerAndTable(waypoints.indexOf(thisAV.WtoE[i]),
                        visualSettings.visiting,
                        40, false);
                }

                if (thisAV.setMin) {
                    updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[1]),
                        visualSettings.discovered,
                        40, false);
                    updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[2]),
                        visualSettings.discovered,
                        40, false);
                }
                if (thisAV.endIndex - thisAV.startIndex <= 3 ||
		    thisAV.rec_levelL == thisAV.minPoints) {

                        hdxAV.nextAction = "returnBruteForceSolution";
                    }
                else {
                    hdxAV.nextAction = "callRecursionLeft";
                }
            },
            logMessage: function(thisAV) {
                return "Check whether minimum number of points has been reached";
            }
        },
        {
            label: "returnBruteForceSolution",
            comment: "Return brute force Solution",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		
                if (thisAV.endIndex - thisAV.startIndex == 1) {
                    let minDistTest = thisAV.computeDistance(thisAV.WtoE[thisAV.startIndex], thisAV.WtoE[thisAV.endIndex]);
		    
                    if (minDistTest < thisAV.minDist[0]) {
                        thisAV.minDist = [minDistTest, thisAV.WtoE[thisAV.startIndex], thisAV.WtoE[thisAV.endIndex]];
                        updateAVControlEntry("closeLeader", "Closest: [" + 
					     thisAV.minDist[1].label + "," + thisAV.minDist[2].label
					     + "], d: " + length_in_current_units(thisAV.minDist[0]));
                    }
                }
                else {
                    for (let i = thisAV.startIndex; i < thisAV.endIndex - 1; i++) {
                        for (let j = i + 1; j < thisAV.endIndex; j++) {
                            let minDistTest = thisAV.computeDistance(thisAV.WtoE[i], thisAV.WtoE[j]);
			    
                            if (minDistTest < thisAV.minDist[0]) {
                                thisAV.minDist = [minDistTest, thisAV.WtoE[i], thisAV.WtoE[j]];
                                updateAVControlEntry("closeLeader", "Closest: [" + 
						     thisAV.minDist[1].label + "," + thisAV.minDist[2].label
						     + "], d: " + length_in_current_units(thisAV.minDist[0]));
                            }
                        }
                    }
                }
		
                hdxAV.nextAction = thisAV.Stack.remove();
            },
            logMessage: function(thisAV) {
                return "Return brute force solution for this section";
            }
        },
        {
            label: "callRecursionLeft",
            comment: "Call recursion on left half of points",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                              
               
                thisAV.oldRightStart = thisAV.startIndex + 
                        ((thisAV.endIndex-thisAV.startIndex)/2);
                thisAV.Stack.add("callRecursionRight");
                thisAV.savedArray.add([Math.ceil(thisAV.startIndex +
                    ((thisAV.endIndex-thisAV.startIndex)/2)) ,thisAV.endIndex]);
                                  
                thisAV.WtoE = thisAV.WtoE.slice(0,thisAV.WtoE.length);

                thisAV.endIndex = Math.ceil(thisAV.startIndex + ((thisAV.endIndex-thisAV.startIndex)/2));

                thisAV.rec_levelL++;
                thisAV.rec_level_arr.add(thisAV.rec_levelL);
                hdxAV.nextAction = "recursiveCallTop"
            },
            logMessage: function(thisAV) {
                return "Call recursion on left half of points";
            }
        },
        {
            label: "callRecursionRight",
            comment: "Call recursion on right half of points",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                nums = thisAV.savedArray.remove();
                thisAV.rec_levelL = thisAV.rec_level_arr.remove();
                thisAV.startIndex = nums[0];
                thisAV.endIndex = nums[1];
                thisAV.Stack.add("setMinOfHalves");
                hdxAV.nextAction = "recursiveCallTop"
            },
            logMessage: function(thisAV) {
                return "Call recursion on right half of points";
            }
        },
        {
            label: "setMinOfHalves",
            comment: "Find smaller of minimum distances from the two halves",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
               
                if (thisAV.finalDraw) {
                    thisAV.skipExtra = true;                
                    thisAV.startIndex = Math.ceil(thisAV.WtoE.length/2);
                }
                if (thisAV.WtoE.length - thisAV.startIndex <= 3) {
                    thisAV.finalDraw = true;
                }
                for (let i = 0  ; i < thisAV.endIndex; i++) {
                    updateMarkerAndTable(waypoints.indexOf(thisAV.WtoE[i]),
                        visualSettings.discarded,
                        40, false);
                }

                updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[1]),
                        visualSettings.discovered,
                        40, false);
                updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[2]),
                        visualSettings.discovered,
                        40, false);
                
                thisAV.setMin = true;
                
                thisAV.currentLine = thisAV.drawLineMap(waypoints[waypoints.indexOf(thisAV.WtoE[thisAV.startIndex - 1])].lon,
                waypoints[waypoints.indexOf(thisAV.WtoE[thisAV.startIndex])].lon);

                //DRAW YELLOW LINE
                thisAV.lineStack.add(thisAV.currentLine);

                // hdxAV.nextAction = "recursiveCallTop";
                hdxAV.nextAction = "setMiddlePoint"
            },
            logMessage: function(thisAV) {
                return "Find smaller of minimum distances from the two halves";
            }
        },
        {
            label: "setMiddlePoint",
            comment: "Find longitude of middle point",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.currentLine = thisAV.lineStack.remove();
                thisAV.removeLineVisiting(thisAV.currentLine);
                
                thisAV.leftDot = 0;
                thisAV.rightDot = 0;
                thisAV.leftDot = ((parseFloat(waypoints[waypoints.indexOf(thisAV.WtoE[thisAV.startIndex - 1])].lon) +
                parseFloat(waypoints[waypoints.indexOf(thisAV.WtoE[thisAV.startIndex])].lon))/2) 
                + parseFloat(thisAV.minDist);
                thisAV.currentLine = thisAV.drawLineMap(thisAV.leftDot,thisAV.leftDot);
                thisAV.lineStack.add(thisAV.currentLine);
                thisAV.rightDot = thisAV.leftDot - (2 * parseFloat(thisAV.minDist));
                thisAV.currentLine = thisAV.drawLineMap(thisAV.rightDot,thisAV.rightDot);
                thisAV.lineStack.add(thisAV.currentLine);

                hdxAV.nextAction = "setPointsToCheck"
            },
            logMessage: function(thisAV) {
                return "Get longitude of middle point that divides map in half";
            }
        },
        {
            label: "setPointsToCheck",
            comment: "Find points closer to middle line than min distance",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                //sort by latitude
                thisAV.NtoS = [];
                for (i = 0; i < thisAV.WtoE.length-1; i++) {
                    if ((parseFloat(thisAV.WtoE[i].lon) > thisAV.rightDot) &&
			parseFloat(thisAV.WtoE[i].lon) < thisAV.leftDot) {
                        thisAV.NtoS.push(thisAV.WtoE[i]);
                    }
                    updateAVControlEntry("totalChecked", "Total Points in Area - " +
					 thisAV.NtoS.length +
					 ", Total Points Checked - 0");
                    thisAV.checkedCounter = 0;
                    for (let i = 0; i < thisAV.NtoS.length - 1; i++) {
                        updateMarkerAndTable(waypoints.indexOf(thisAV.NtoS[i]),
                            visualSettings.visiting,
                            40, false);
                    }
                updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[1]),
                        visualSettings.discovered,
                        40, false);
                updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[2]),
                        visualSettings.discovered,
                        40, false);
                }
                hdxAV.nextAction = "squareMinOfHalves"
            },
            logMessage: function(thisAV) {
                return "Find points closer to middle line than min distance";
            }
        },
        {
            label: "squareMinOfHalves",
            comment: "Square min of halves",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.minSq = thisAV.minDist[0] * thisAV.minDist[0];
                hdxAV.nextAction = "forLoopTop"
                thisAV.globali = 0;
            },
            logMessage: function(thisAV) {
                return "Square min found from halves";
            }
        },
        {
            label: "forLoopTop",
            comment: "Loop through vertices in closeToCenter",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.NtoS.sort((a,b) => (a.lat > b.lat) ? -1: 1);
                if (thisAV.globali <= thisAV.NtoS.length - 2) {
                    hdxAV.nextAction = "updateWhileLoopIndex"
                    if (thisAV.bounds != null) {
			thisAV.drawRec.remove();
			thisAV.bounds = null; 
                    }
                    thisAV.bounds = [[thisAV.NtoS[thisAV.globali].lat,thisAV.leftDot],
				     [thisAV.NtoS[thisAV.globali].lat - thisAV.minDist[0],thisAV.rightDot]]
                    
                    thisAV.drawRec = L.rectangle(thisAV.bounds, {color: "red", weight: 5}).addTo(map);
		}
                else {
                    hdxAV.nextAction = "return";
                }
            },
            logMessage: function(thisAV) {
                return "Loop through vertices in closeToCenter";
            }
        },
        {
            label: "updateWhileLoopIndex",
            comment: "Set index for while loop",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.globalk = thisAV.globali + 1;
                thisAV.currentLine = null;
                hdxAV.nextAction = "whileLoopTop"
            },
            logMessage: function(thisAV) {
                return "Set index for while loop";
            }
        },
        {
            label: "whileLoopTop",
            comment: "Loop through points to check if closer than min distance",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                //add checking for too far
                if (thisAV.currentLine != null) {
                    thisAV.removeLineVisiting(thisAV.currentLine);
                    thisAV.currentLine = null;
                }
                thisAV.checkedCounter++;
                updateAVControlEntry("totalChecked", "Points in Area - " +
				     thisAV.NtoS.length + ", Points Checked - " +
				     thisAV.checkedCounter);

                if (thisAV.globalk < thisAV.NtoS.length-1 && 
                    (Math.pow(thisAV.NtoS[thisAV.globalk].lat -
			      thisAV.NtoS[thisAV.globali].lat, 2) < thisAV.minSq)) {
		    hdxAV.nextAction = "updateMinPairFound"
		    thisAV.currentLine = thisAV.drawLineVisiting(thisAV.NtoS[thisAV.globali], thisAV.NtoS[thisAV.globalk]);
                }
                else {
                    hdxAV.nextAction = "forLoopTop"
                    thisAV.globali += 1;
                }
            },
            logMessage: function(thisAV) {
                return "Loop through points to check if closer than min distance";
            }
        },
        {
            label: "updateMinPairFound",
            comment: "Update new minimum distance found",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                if ((Math.pow(thisAV.NtoS[thisAV.globali].lat -
			      thisAV.NtoS[thisAV.globalk].lat, 2) +
		     Math.pow(thisAV.NtoS[thisAV.globali].lon -
			      thisAV.NtoS[thisAV.globalk].lon, 2)) < thisAV.minSq ) {
                    thisAV.minSq = Math.pow(thisAV.NtoS[thisAV.globali].lat -
					    thisAV.NtoS[thisAV.globalk].lat, 2) +
			Math.pow(thisAV.NtoS[thisAV.globali].lon -
				 thisAV.NtoS[thisAV.globalk].lon, 2); 
                    thisAV.minDist = [Math.sqrt(thisAV.minSq),
				      thisAV.NtoS[thisAV.globali],
				      thisAV.NtoS[thisAV.globalk] ];
                    updateAVControlEntry("closeLeader", "Closest: [" + 
					 thisAV.minDist[1].label + "," +
					 thisAV.minDist[2].label
					 + "], d: " +
					 length_in_current_units(thisAV.minDist[0]));
                    for (let i = 0; i < thisAV.WtoE.length; i++) {
                        updateMarkerAndTable(waypoints.indexOf(thisAV.WtoE[i]),
                            visualSettings.discarded,
                            40, false);
                    }
                    for (let i = 0; i < thisAV.NtoS.length - 1; i++) {
                        updateMarkerAndTable(waypoints.indexOf(thisAV.NtoS[i]),
					     visualSettings.visiting,
					     40, false);
                    }
                    updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[1]),
					 visualSettings.discovered,
					 40, false);
                    updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[2]),
					 visualSettings.discovered,
					 40, false);
                }
                hdxAV.nextAction = "incrementWhileLoopIndex"
            },
            logMessage: function(thisAV) {
                return "Update new minimum distance found between points";
            }
        },
        {
            label: "incrementWhileLoopIndex",
            comment: "Increment while loop index",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.globalk += 1;
                hdxAV.nextAction = "whileLoopTop"
            },
            logMessage: function(thisAV) {
                return "Increment while loop index";
            }
        },
        {
            label: "return",
            comment: "Return min distance between points",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.currentLine = thisAV.lineStack.remove();
                thisAV.removeLineVisiting(thisAV.currentLine);
                thisAV.currentLine = thisAV.lineStack.remove();
                thisAV.removeLineVisiting(thisAV.currentLine);
                updateAVControlEntry("savedCheck", "Total Checks Saved: " +
				     (thisAV.NtoS.length*thisAV.NtoS.length) +
				     "(Brute Force) - " + thisAV.checkedCounter + " = " +
				     ((thisAV.NtoS.length*thisAV.NtoS.length) -
				      thisAV.checkedCounter));
                for (let i = 0; i < thisAV.WtoE.length; i++) {
                    updateMarkerAndTable(waypoints.indexOf(thisAV.WtoE[i]),
                        visualSettings.discarded,
                        40, false);
                }
                updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[1]),
				     visualSettings.discovered,
				     40, false);
                updateMarkerAndTable(waypoints.indexOf(thisAV.minDist[2]),
				     visualSettings.discovered,
				     40, false);
		
                if (thisAV.bounds != null) {
                    thisAV.drawRec.remove();
                    thisAV.bounds = null; 
                 }
                if (thisAV.Stack.length == 0 || thisAV.skipExtra) {
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    hdxAV.nextAction = thisAV.Stack.remove();
                }
            },
            logMessage: function(thisAV) {
                return "Return minimum distance between closest pairs";
            }
        },
        {
            label: "computeDistance",
            comment: "compute distance of current candidate pair",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);       
                thisAV.d_this = convertToCurrentUnits(
		    distanceInMiles(waypoints[thisAV.v1].lat,
                                    waypoints[thisAV.v1].lon,
                                    waypoints[thisAV.v2].lat,
                                    waypoints[thisAV.v2].lon));
                updateAVControlEntry("checkingDistance", "Distance: " +
				     length_in_current_units(thisAV.d_this));
                hdxAV.nextAction = "checkCloseLeader";

            },
            logMessage: function(thisAV) {
                return "Compute distance " + thisAV.d_this.toFixed(3) +
		    " between v<sub>1</sub>=" + thisAV.v1 + " and v<sub>2</sub>=" +
		    thisAV.v2;
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
                return "Done!";
            }
        }
    ],

    // function to draw the polyline connecting the current 
    // candidate pair of vertices
    drawLineVisiting(v1, v2) {

        let visitingLine = [];
        visitingLine[0] = [v1.lat, v1.lon];
        visitingLine[1] = [v2.lat, v2.lon];
        this.lineVisiting = L.polyline(visitingLine, {
            color: "gold",
            opacity: 0.6,
            weight: 4
        });
        this.lineVisiting.addTo(map);   
        return this.lineVisiting
    },
    
    drawLineMap(v1,v2) {
	
        let visitingLine = [];
        let lonLine = (parseFloat(v2.lon) + parseFloat(v1.lon)) / 2;
        visitingLine[0] = [90, v1];
        visitingLine[1] = [-90, v2];
	
        if (this.lineCount % 3 == 0) {
            this.lineVisiting = L.polyline(visitingLine, {
		color: visualSettings.visiting.color,
		opacity: 0.6,
		weight: 4
            });
	}
	else {
            this.lineVisiting = L.polyline(visitingLine, {
		color: visualSettings.discovered.color,
		opacity: 0.6,
		weight: 4
            });
	}
        //thisAV.lineStack.add(this.lineVisiting);
        this.lineVisiting.addTo(map);  
        this.lineCount ++; 
        return this.lineVisiting;
    },
    
    computeDistance(v1, v2) {
        return Math.sqrt(Math.pow(v1.lat - v2.lat, 2) + Math.pow(v1.lon - v2.lon, 2));
    },
    
    // function to remove the visiting polyline
    removeLineVisiting(l1) {

        l1.remove();
    },

    // functions to draw or update the polylines connecting the
    // current closest and furthest pairs
    updateLineClosest() {

        let closestLine = [];
        closestLine[0] = [waypoints[this.closest[0]].lat, waypoints[this.closest[0]].lon];
        closestLine[1] = [waypoints[this.closest[1]].lat, waypoints[this.closest[1]].lon];

        if (this.lineClosest == null) {
            this.lineClosest = L.polyline(closestLine, {
                color: visualSettings.leader.color,
                opacity: 0.6,
                weight: 4
            });
            this.lineClosest.addTo(map);        
        }
        else {
            this.lineClosest.setLatLngs(closestLine);
        }
    },
    updateLineFarthest() {

        let farthestLine = [];
        farthestLine[0] = [waypoints[this.farthest[0]].lat,
			   waypoints[this.farthest[0]].lon];
        farthestLine[1] = [waypoints[this.farthest[1]].lat,
			   waypoints[this.farthest[1]].lon];

        if (this.lineFarthest == null) {
            this.lineFarthest = L.polyline(farthestLine, {
                color: visualSettings.leader2.color,
                opacity: 0.6,
                weight: 4
            });
            this.lineFarthest.addTo(map);       
        }
        else {
            this.lineFarthest.setLatLngs(farthestLine);
        }
    },

    // required prepToStart function
    // initialize a vertex closest/farthest pairs search
    prepToStart() {

        hdxAV.algStat.innerHTML = "Initializing";
        this.lineCount = 0;

        //reorder waypoints
        let presort = new HDXPresort();
        this.originalWaypoints = waypoints.slice();
        this.waypoints = presort.sortedWaypoints;
        hdxClosestPairsRecAV.WtoE = this.waypoints;
        //updateMap();

        // show waypoints, hide connections
        initWaypointsAndConnections(true, false,
                                    visualSettings.undiscovered);

        this.Stack = new HDXLinear(hdxLinearTypes.STACK,
            "Stack");this.Stack = new HDXLinear(hdxLinearTypes.STACK,
            "Stack");

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">WtoE[] &larr; vertices sorted by longitude</td></tr>';
        this.code += pcEntry(0,'ClosestPair(WtoE) //length = n',"recursiveCallTop");
        this.code += pcEntry(1,'if (WtoE.length <= 3 || recursiveDepth == userLimit)',"checkBaseCase");
        this.code += pcEntry(2,'return brute force min distance',"returnBruteForceSolution");
        this.code += pcEntry(1,'else',"");
        this.code += pcEntry(2,'min<sub>left</sub> &larr; ClosestPair(WtoE[0, (n/2)-1])',"callRecursionLeft");
        this.code += pcEntry(2,'min<sub>right</sub> &larr; ClosestPair(WtoE[n/2, n-1])',"callRecursionRight");
        this.code += pcEntry(2,'min<sub>halves</sub> &larr; min(min<sub>left</sub>, min<sub>right</sub>)',"setMinOfHalves");
        this.code += pcEntry(2,'mid &larr; WtoE[n/2].long',"setMiddlePoint");
        this.code += pcEntry(2,'closeToCenter[] &larr; all points which |longitude − mid| < min<sub>halves</sub>',"setPointsToCheck");
        this.code += pcEntry(2,'minSq &larr; min<sub>halves</sub><sup>2</sup>',"squareMinOfHalves");
        this.code += pcEntry(2,'for i &larr; 0 to closeToCenter.length - 2 do',"forLoopTop");
        this.code += pcEntry(3,'k &larr; i + 1',"updateWhileLoopIndex");
        this.code += pcEntry(3,'while (k <= closeToCenter.length - 1 and (closeToCenter[k].lat - closeToCenter[i].lat)<sup>2</sup> < minSq)',"whileLoopTop");
        this.code += pcEntry(4,'minSq &larr; min((closeToCenter[k].long - closeToCenter[i].long)<sup>2</sup> + (closeToCenter[k].lat - closeToCenter[i].lat)<sup>2</sup>, minSq)',"updateMinPairFound");
        this.code += pcEntry(4,'k &larr; k + 1',"incrementWhileLoopIndex");
        this.code += pcEntry(2,'return sqrt(minSq)',"return");
    },

    // set up UI entries for closest/farthest pairs
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;

        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");
        let newAO = 'Number of points to stop on <input type="number" id="minPoints" min="3" max="' 
        + (waypoints.length - 1)/2 + '" value="3">';
        hdxAV.algOptions.innerHTML = newAO;
        addEntryToAVControlPanel("closeLeader", visualSettings.leader);
        addEntryToAVControlPanel("totalChecked", visualSettings.visiting);
        addEntryToAVControlPanel("savedCheck", visualSettings.undiscovered);
    },

    // remove UI modifications made for vertex closest pairs
    cleanupUI() {
        waypoints = this.originalWaypoints;
        //updateMap();

	// clean up any polylines
	if (this.lineVisiting != null) {
	    this.lineVisiting.remove();
	}
	if (this.lineClosest != null) {
	    this.lineClosest.remove();
	}
	if (this.lineFarthest != null) {
	    this.lineFarthest.remove();
	}
	while (this.lineStack != null && !this.lineStack.isEmpty()) {
	    // remove from stack, returned result remove from map
	    this.lineStack.remove().remove();
	}
    },
    
    idOfAction(action) {
        return action.label;
    },
    
    // set the conditional breakpoints for this AV
    setConditionalBreakpoints(name) {

	// since this AV has none of its own conditional breakpoints
	// at this time, we just return the common ones
        return HDXCommonConditionalBreakpoints(name);
    },

    hasConditionalBreakpoints(name) {

	// same, only has a conditional breakpoint at name if it's a common one
        return HDXHasCommonConditonalBreakpoints(name);
    }
};
    
