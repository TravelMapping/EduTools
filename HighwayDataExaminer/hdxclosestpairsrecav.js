//
// HDX Recursive Divide and Conquer Closest Pairs AV
//
// METAL Project
//
// Primary Author: Jim Teresco, Alissa Ronca, Zac Goodsell
//

/* closest pairs of vertices, using a divide and conquer recursive approach
   as described in Levitin.
*/
var hdxClosestPairsRecAV = {

    // entries for list of AVs
    value: "dc-closestpairs",
    name: "Divide and Conquer Closest Pairs",
    description: "Search for the closest pair of vertices (waypoints) using recursive divide and conquer." +
	"<br />NOTE: This AV is a work in progress, and has known problems.",
    
    // state variables for closest pairs search
    minPoints: 3,
    maxRec: 0,
    startIndex: 0,
    endIndex: 0,
    closeToCenter: null,
    minHalvesSquared: 0,
    forLoopIndex: 0,
    whileLoopIndex: 0,
    lineCount: 0,

    // save a copy of the original waypoints array to restore
    // if we switch AVs
    originalWaypoints: waypoints.slice(),
    
    // vertices sorted by longitude
    WtoE: null,
    // vertices sorted by latitude
    NtoS: [],
    
    // used for shading
    northBound: 0,
    southBound: 0,

    // closest leader info
    closest: [-1, -1],
    d_closest: Number.MAX_VALUE,

    // polylines for leader and visiting
    lineClosest: null,
    lineVisiting: null,
    lineStack: null,

    visualSettings: {
        recursiveCall: {
            color: "green",
            textColor: "white",
            scale: 6,
            name: "recursiveCall",
            value: 0
        }
    },
    
    // the actions that make up this algorithm
    avActions: [
        {
            label: "START",
            comment: "Initialize closest pair variables",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                updateAVControlEntry("currentCall", "No calls yet");
                updateAVControlEntry("closeLeader", "no closest pair yet, dclosest = &infin;");
                updateAVControlEntry("totalChecked", "0");
                thisAV.lineCount = 0;

                thisAV.WtoE = waypoints;
                let presort = new HDXPresort();
                thisAV.WtoE = presort.sortedWaypoints;

                thisAV.Stack = new HDXLinear(hdxLinearTypes.STACK, "Stack");

                thisAV.savedArray = new HDXLinear(hdxLinearTypes.STACK,
                    "Stack");

                thisAV.recLevelArr = new HDXLinear(hdxLinearTypes.STACK,
                    "Stack");
                thisAV.lineStack = new HDXLinear(hdxLinearTypes.STACK,
                    "Stack");    

                thisAV.startIndex = 0;
                thisAV.recLevel = 0;
                thisAV.endIndex = waypoints.length;
                thisAV.closeToCenter = [];
                thisAV.minHalvesSquared = 0;
                thisAV.forLoopIndex = 0;
                thisAV.whileLoopIndex = 0;
                thisAV.minDist = [9999,0,0]
                thisAV.minSq = 0;
                thisAV.setMin = false;
                thisAV.currentLine;

		// after the initial call to ClosestPair (via the execution
		// of the recursiveCallTop action) completes, the AV
		// should proceed to the cleanup state.
                thisAV.Stack.add("cleanup");
		
                thisAV.globali = 0;
                thisAV.globalk = 0;
                thisAV.finalDraw = false;
                thisAV.oldRightStart = waypoints.length;
                thisAV.bounds = null;

                // find latitudes of the northernmost and southernmost points
                thisAV.southBound = waypoints[0].lat;
                thisAV.northBound = waypoints[0].lat;
                for (let i = 1; i < waypoints.length; i++) {
                    thisAV.southBound = Math.min(waypoints[i].lat,
						 thisAV.southBound);
                    thisAV.northBound = Math.max(waypoints[i].lat,
						 thisAV.northBound);
                }

                hdxAV.nextAction = "recursiveCallTop"
            },
            logMessage: function(thisAV) {
                return "Initializing";
            }
        },
        {
            label: "recursiveCallTop",
            comment: "Recursive function call",
            code: function(thisAV) {
                highlightPseudocode(this.label,
				    thisAV.visualSettings.recursiveCall);
		thisAV.updateCurrentCall();
                hdxAV.nextAction = "checkBaseCase";
            },
            logMessage: function(thisAV) {
                return "Recursive function call: Level " + thisAV.recLevel +
		    ": [" + thisAV.startIndex + "," + thisAV.endIndex + "]";
            }
        },
        {
            label: "checkBaseCase",
            comment: "Check recursive stopping conditions",
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

		// check for recursive stopping condition of either the
		// smallest subproblem (based on minPoints) or
		// current recursive level (based on maxRec)
                if ((thisAV.endIndex - thisAV.startIndex <= thisAV.minPoints) ||
		    (thisAV.maxRec > 0 && thisAV.recLevel == thisAV.maxRec)) {

                        hdxAV.nextAction = "returnBruteForceSolution";
                    }
                else {
                    hdxAV.nextAction = "callRecursionLeft";
                }
            },
            logMessage: function(thisAV) {
		if (thisAV.maxRec > 0) {
                    return "Check whether minimum problem size or recursive limit has been reached";
		}
		else {
                    return "Check whether minimum problem size has been reached";
		}
            }
        },
        {
            label: "returnBruteForceSolution",
            comment: "Return brute force Solution",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		
                if (thisAV.endIndex - thisAV.startIndex == 1) {
		    let v1 = thisAV.WtoE[thisAV.startIndex];
		    let v2 = thisAV.WtoE[thisAV.endIndex];
                    let minDistTest = convertToCurrentUnits(
			distanceInMiles(v1.lat, v1.lon, v2.lat, v2.lon));
                    if (minDistTest < thisAV.minDist[0]) {
                        thisAV.minDist = [minDistTest,
					  thisAV.WtoE[thisAV.startIndex],
					  thisAV.WtoE[thisAV.endIndex]];
                        updateAVControlEntry("closeLeader", "Closest: [" + 
					     thisAV.minDist[1].label + "," +
					     thisAV.minDist[2].label
					     + "], d: " +
					     thisAV.minDist[0].toFixed(3));
                    }
                }
                else {
                    for (let i = thisAV.startIndex; i < thisAV.endIndex - 1; i++) {
                        for (let j = i + 1; j < thisAV.endIndex; j++) {
			    let v1 = thisAV.WtoE[i];
			    let v2 = thisAV.WtoE[j];
			    let minDistTest = convertToCurrentUnits(
				distanceInMiles(v1.lat, v1.lon, v2.lat, v2.lon));
			    
                            if (minDistTest < thisAV.minDist[0]) {
                                thisAV.minDist = [minDistTest,
						  thisAV.WtoE[i],
						  thisAV.WtoE[j]];
                                updateAVControlEntry("closeLeader",
						     "Closest: [" + 
						     thisAV.minDist[1].label +
						     "," +
						     thisAV.minDist[2].label
						     + "], d: " +
						     thisAV.minDist[0].toFixed(3));
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

                thisAV.recLevel++;
                thisAV.recLevelArr.add(thisAV.recLevel);
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
                thisAV.recLevel = thisAV.recLevelArr.remove();
                thisAV.startIndex = nums[0];
                thisAV.endIndex = nums[1];
		thisAV.updateCurrentCall();
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
        this.lineVisiting.addTo(map);  
        this.lineCount ++; 
        return this.lineVisiting;
    },
    
    // function to remove the visiting polyline
    removeLineVisiting(l1) {

        l1.remove();
    },

    // functions to draw or update the polylines connecting the
    // current closest and furthest pairs
    updateLineClosest() {

        let closestLine = [];
        closestLine[0] = [waypoints[this.closest[0]].lat,
			  waypoints[this.closest[0]].lon];
        closestLine[1] = [waypoints[this.closest[1]].lat,
			  waypoints[this.closest[1]].lon];

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

    updateCurrentCall() {
	updateAVControlEntry("currentCall",
			     "Recursive Level " + this.recLevel +
			     ", " + (this.endIndex - this.startIndex + 1) +
			     " points, range: [" + this.startIndex + "," +
			     this.endIndex + "]");
    },
    
    // required prepToStart function
    // initialize a vertex closest pairs divide and conquer search
    prepToStart() {

        hdxAV.algStat.innerHTML = "Initializing";
        this.lineCount = 0;

        // show waypoints, hide connections
        initWaypointsAndConnections(true, false,
                                    visualSettings.undiscovered);

	this.minPoints = document.getElementById("minPoints").value;
	this.maxRec = document.getElementById("maxRec").value;
		 
	this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">call CPRec with points sorted &uarr; by longitude</td></tr>';
        this.code += pcEntry(0,'CPRec(WtoE)',"recursiveCallTop");
	let recLimitCode = "";
	if (this.maxRec > 0) {
	    recLimitCode = " or recDepth > " + this.maxRec;
	}
        this.code += pcEntry(1,'n &larr; WtoE.length<br />&nbsp;&nbsp;if (n <= ' +
			     this.minPoints + recLimitCode + ')',
			     "checkBaseCase");
        this.code += pcEntry(2,'return(brute force min distance)',
			     "returnBruteForceSolution");
        this.code += pcEntry(1,'else',"");
        this.code += pcEntry(2,'cp<sub>left</sub> &larr; CPRec(WtoE[0, (n/2)-1])',"callRecursionLeft");
        this.code += pcEntry(2,'cp<sub>right</sub> &larr; CPRec(WtoE[n/2, n-1])',"callRecursionRight");
        this.code += pcEntry(2,'cp<sub>lr</sub> &larr; min_d(cp<sub>left</sub>, cp<sub>right</sub>)',"setMinOfHalves");
        this.code += pcEntry(2,'mid &larr; WtoE[n/2].lon',"setMiddlePoint");
        this.code += pcEntry(2,'nearMid[] &larr; all pts with |lon − mid| < cp<sub>lr</sub>',"setPointsToCheck");
        this.code += pcEntry(2,'cpDistSq &larr; cp<sub>lr</sub>.d<sup>2</sup>',"squareMinOfHalves");
        this.code += pcEntry(2,'for i &larr; 0 to nearMid.length - 2 do',"forLoopTop");
        this.code += pcEntry(3,'k &larr; i + 1',"updateWhileLoopIndex");
        this.code += pcEntry(3,'while (k <= nearMid.length - 1 and (nearMid[k].lat - nearMid[i].lat)<sup>2</sup> < cpDistSq)',"whileLoopTop");
        this.code += pcEntry(4,'cpDistSq &larr; min(distSq(nearMid[k],nearMid[i], cpDistSq)',"updateMinPairFound");
        this.code += pcEntry(4,'k &larr; k + 1',"incrementWhileLoopIndex");
        this.code += pcEntry(2,'return sqrt(cpDistSq)',"return");
    },

    // set up UI entries for closest pairs divide and conquer
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;

        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");
        let newAO = 'Brute force problem size limit ' +
	    '<input type="number" id="minPoints" min="3" max="' +
	    (waypoints.length - 1)/2 + '" value="3"><br />';
        newAO += 'Recursion level limit (0 for none)' +
	    '<input type="number" id="maxRec" min="0" max="' +
	    (waypoints.length - 1)/2 + '" value="0"><br />';
        hdxAV.algOptions.innerHTML = newAO;
        addEntryToAVControlPanel("currentCall", this.visualSettings.recursiveCall);
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
        return HDXHasCommonConditionalBreakpoints(name);
    }
};
    
