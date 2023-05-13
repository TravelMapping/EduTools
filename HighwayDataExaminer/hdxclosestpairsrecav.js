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

// construct an object to be placed on the recursive stack to store
// parameters and variables related to the current recursive call
function HDXCPRecCallFrame(startIndex, endIndex, recLevel, nextAction) {
    
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.recLevel = recLevel;
    this.nextAction = nextAction;
    return this;    
}

var hdxClosestPairsRecAV = {

    // entries for list of AVs
    value: "dc-closestpairs",
    name: "Divide and Conquer Closest Pairs",
    description: "Search for the closest pair of vertices (waypoints) using recursive divide and conquer, following the algorithm in Levitin.",
    
    // global state variables for closest pairs search
    minPoints: 3,
    maxRec: 0,
    overlays: false,

    // many other variables will end up on the recursive stack, which
    // will contain instances of objects constructed by the CallFrame
    // constructor below
    recStack: null,
    // the frame at the top of the stack at any given time
    fp: null,
    // the frame most recently popped from the stack for
    // caller to get result and other info
    retval: null,

    // vertices sorted by longitude
    WtoE: null,
    // vertices sorted by latitude
    NtoS: [],

    // various stats ("dcomps" are distance comparisons in various cases)
    recCallCount: 0,
    bfCases: 0,
    bfDComps: 0,
    halvesDComps: 0,
    overlapDComps: 0,
    overlapTotalPoints: 0,
    overlapLeaders: 0,
    
    // AV-specific visual settings
    visualSettings: {
        bruteForce: {
            color: "red",
            textColor: "white",
            scale: 6,
            name: "bruteForce",
            value: 0
        },
        recursiveCall: {
            color: "darkgreen",
            textColor: "white",
            scale: 6,
            name: "recursiveCall",
            value: 0
        },
        recursiveLeft: {
            color: "pink",
            textColor: "black",
            scale: 6,
            name: "recursiveLeft",
            value: 0
        },
        recursiveRight: {
            color: "pink",
            textColor: "black",
            scale: 6,
            name: "recursiveRight",
            value: 0
        },
        dComps: {
            color: "purple",
            textColor: "white",
            scale: 6,
            name: "dComps",
            value: 0
        },
        overlapPoints: {
            color: "darkRed",
            textColor: "white",
            scale: 6,
            name: "overlapPoints",
            value: 0
        },
	obscure: {
            color: "black",
            scale: 4,
            weight: 0.5,
	    fillOpacity: 0.1,
            name: "obscure",
            value: 0
	}
    },
    
    // the actions that make up this algorithm
    avActions: [
        {
            label: "START",
            comment: "Set up initial recursive call on the entire set of points",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// create the recursive call stack
		thisAV.recStack = [];

		// sort the waypoints array west to east
		let sorter = new HDXWaypointsSorter();
		thisAV.WtoE = sorter.sortWaypoints();
		
                updateAVControlEntry("currentCall", "No calls yet");
                updateAVControlEntry("dComps", "No distance comparisons yet");
		updateAVControlEntry("overlaps", "No overlap points yet");
		updateAVControlEntry("overlapLeaders", "No leaders found in overlap points yet");

		thisAV.fp = new HDXCPRecCallFrame(
		    0, // start index
		    waypoints.length - 1, // end index
		    1, // level 1 of recursion
		    "cleanup" // action to continue after call complete3
		);
		thisAV.recStack.push(thisAV.fp);

		// variable initializations
                thisAV.globali = 0;
                thisAV.globalk = 0;
		thisAV.recCallCount = 0;
		thisAV.bfCases = 0;
		thisAV.bfDComps = 0;
		thisAV.halvesDComps = 0;
		thisAV.overlapDComps = 0;
		thisAV.overlapTotalPoints = 0;
		thisAV.overlapLeaders = 0;

                hdxAV.nextAction = "recursiveCallTop";
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

		thisAV.recCallCount++;
		
		thisAV.updateCallStack();
		thisAV.colorWtoERange(thisAV.fp.startIndex,
				      thisAV.fp.endIndex,
				      thisAV.visualSettings.recursiveCall);

		if (thisAV.overlays) {
		    // rectangles to obscure parts of the world not involved
		    // in this recursive call
		    let westLon = thisAV.WtoE[thisAV.fp.startIndex].lon;
		    let eastLon = thisAV.WtoE[thisAV.fp.endIndex].lon;
		    thisAV.fp.westBox = L.rectangle(
			[[-88, -179], [88, westLon]],
			thisAV.visualSettings.obscure
		    );
		    thisAV.fp.eastBox = L.rectangle(
			[[-88, 179], [88, eastLon]],
			thisAV.visualSettings.obscure
		    );
		    thisAV.fp.westBox.addTo(map);
		    thisAV.fp.eastBox.addTo(map);
		}
		
                hdxAV.nextAction = "checkBaseCase";
            },
            logMessage: function(thisAV) {
                return "Recursive function call: Level " + thisAV.fp.recLevel +
		    ": [" + thisAV.fp.startIndex + "," +
		    thisAV.fp.endIndex + "]";
            }
        },
        {
            label: "checkBaseCase",
            comment: "Check recursive stopping conditions",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// check for recursive stopping condition of either the
		// smallest subproblem (based on minPoints) or
		// current recursive level (based on maxRec)
                if ((thisAV.fp.endIndex - thisAV.fp.startIndex <= thisAV.minPoints) ||
		    (thisAV.maxRec > 0 && thisAV.fp.recLevel == thisAV.maxRec)) {
		    thisAV.colorWtoERange(thisAV.fp.startIndex,
					  thisAV.fp.endIndex,
					  thisAV.visualSettings.bruteForce);
                    hdxAV.nextAction = "returnBruteForceSolution";
                }
                else {
		    // we will do recursion, find midpoint index
		    thisAV.fp.firstRight =
			Math.ceil(thisAV.fp.startIndex + 
				  ((thisAV.fp.endIndex-
				    thisAV.fp.startIndex)/2));
		    // draw dividing line for this recursive call
		    let lineCoords = [];
		    let lineLon = thisAV.WtoE[thisAV.fp.firstRight].lon;
		    lineCoords[0] = [88, lineLon];
		    lineCoords[1] = [-88, lineLon];
		    thisAV.fp.recLine = L.polyline(lineCoords, {
			color: "green",
			opacity: 0.5,
			weight: 3
		    });
		    thisAV.fp.recLine.addTo(map);

		    // go to left recursion
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
            comment: "Compute and return base case solution",
            code: function(thisAV) {
                highlightPseudocode(this.label,
				    thisAV.visualSettings.bruteForce);

		thisAV.bfCases++;
		
		// brute force search among all pairs in this subrange
		thisAV.fp.minDist = Number.MAX_VALUE;
                for (let i = thisAV.fp.startIndex;
		     i <= thisAV.fp.endIndex - 1; i++) {
                    for (let j = i + 1; j <= thisAV.fp.endIndex; j++) {
			let v1 = thisAV.WtoE[i];
			let v2 = thisAV.WtoE[j];
			let minDistTest = convertToCurrentUnits(
			    distanceInMiles(v1.lat, v1.lon, v2.lat, v2.lon));
			
			thisAV.bfDComps++;
                        if (minDistTest < thisAV.fp.minDist) {
                            thisAV.fp.minDist = minDistTest;
			    thisAV.fp.minv1 = thisAV.WtoE[i];
			    thisAV.fp.minv2 = thisAV.WtoE[j];
                        }
                    }
		}

		// update display of distance comparisons
		thisAV.updateDComps();
		
		// update range to discarded status
		thisAV.colorWtoERange(thisAV.fp.startIndex,
				      thisAV.fp.endIndex,
				      visualSettings.discarded);

		// update winner on map and table
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv1),
				     visualSettings.leader, 40, false);
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv2),
				     visualSettings.leader, 40, false);

		// draw connecting line
		thisAV.fp.minLine = L.polyline(
		    [thisAV.fp.minv1, thisAV.fp.minv2], {
			color: visualSettings.leader.color,
			opacity: 0.6,
			weight: 4
		    });
		thisAV.fp.minLine.addTo(map);

		// prep to go back to where this recursive call returns
                hdxAV.nextAction = thisAV.fp.nextAction;

		// pop the call stack
		thisAV.retval = thisAV.recStack.pop();
		if (thisAV.recStack.length > 0) {
		    thisAV.fp = thisAV.recStack[thisAV.recStack.length - 1];
		}
		else {
		    thisAV.fp = null;
		}
		thisAV.updateCallStack();
            },
            logMessage: function(thisAV) {
                return "Base case solution for this section: [" + 
		    thisAV.retval.minv1.label + "," +
		    thisAV.retval.minv2.label + "], d: " +
		    thisAV.retval.minDist.toFixed(3);
            }
        },
        {
            label: "callRecursionLeft",
            comment: "Recursive call on left half of points",
            code: function(thisAV) {
                highlightPseudocode(this.label,
				    thisAV.visualSettings.recursiveLeft);

		// color for the left half
		thisAV.colorWtoERange(thisAV.fp.startIndex,
				      thisAV.fp.firstRight - 1,
				      thisAV.visualSettings.recursiveLeft);
		
		// set up call frame for the left half recursive call
		let newfp = new HDXCPRecCallFrame(
		    thisAV.fp.startIndex, thisAV.fp.firstRight - 1,
		    thisAV.fp.recLevel + 1, "callRecursionRight"
		);
		thisAV.recStack.push(newfp);
		thisAV.fp = newfp;

		// continue at the start of the recursive function
                hdxAV.nextAction = "recursiveCallTop";
            },
            logMessage: function(thisAV) {
                return "Recursive call on left half of points";
            }
        },
        {
            label: "callRecursionRight",
            comment: "Recursive call on right half of points",
            code: function(thisAV) {
                highlightPseudocode(this.label,
				    thisAV.visualSettings.recursiveRight);

		// we have just returned from a recursive call on the left
		// and results are in the call frame pointed at by
		// thisAV.retval, save this in our own "leftResult"
		thisAV.fp.leftResult = thisAV.retval;

		if (thisAV.overlays) {
		    // remove the overlays from the returned call
		    thisAV.retval.eastBox.remove();
		    thisAV.retval.westBox.remove();
		}

		let rightStart = Math.ceil(thisAV.fp.startIndex + 
					((thisAV.fp.endIndex-
					  thisAV.fp.startIndex)/2)) + 1;
		let rightEnd = thisAV.fp.endIndex;
		
		// color for the right half
		thisAV.colorWtoERange(thisAV.fp.firstRight, thisAV.fp.endIndex,
				      thisAV.visualSettings.recursiveRight);
		
		// set up call frame for the right half recursive call
		let newfp = new HDXCPRecCallFrame(
		    thisAV.fp.firstRight, thisAV.fp.endIndex,
		    thisAV.fp.recLevel + 1, "setMinOfHalves"
		);
		thisAV.recStack.push(newfp);
		thisAV.fp = newfp;
		
		thisAV.updateCallStack();

                hdxAV.nextAction = "recursiveCallTop";
            },
            logMessage: function(thisAV) {
                return "Recursive call on right half of points";
            }
        },
        {
            label: "setMinOfHalves",
            comment: "Find smaller of minimum distances from the two halves",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
               
		// we have just returned from a recursive call on the left
		// and results are in the call frame pointed at by
		// thisAV.retval, save this in our own "rightresult"
		thisAV.fp.rightResult = thisAV.retval;

		if (thisAV.overlays) {
		    // remove the overlays from the returned call
		    thisAV.retval.eastBox.remove();
		    thisAV.retval.westBox.remove();
		}

		// which was smaller?
		if (thisAV.fp.leftResult.minDist <
		    thisAV.fp.rightResult.minDist) {
		    thisAV.fp.minDist = thisAV.fp.leftResult.minDist;
		    thisAV.fp.minv1 = thisAV.fp.leftResult.minv1;
		    thisAV.fp.minv2 = thisAV.fp.leftResult.minv2;
		    // save closer min, remove other
		    thisAV.fp.minLine = thisAV.fp.leftResult.minLine;
		    thisAV.fp.rightResult.minLine.remove();
		    updateMarkerAndTable(
			waypoints.indexOf(thisAV.fp.rightResult.minv1),
			visualSettings.discarded, 40, false);
		    updateMarkerAndTable(
			waypoints.indexOf(thisAV.fp.rightResult.minv2),
			visualSettings.discarded, 40, false);
		}
		else {
		    thisAV.fp.minDist = thisAV.fp.rightResult.minDist;
		    thisAV.fp.minv1 = thisAV.fp.rightResult.minv1;
		    thisAV.fp.minv2 = thisAV.fp.rightResult.minv2;
		    // save closer min, remove other
		    thisAV.fp.minLine = thisAV.fp.rightResult.minLine;
		    thisAV.fp.leftResult.minLine.remove();
		    updateMarkerAndTable(
			waypoints.indexOf(thisAV.fp.leftResult.minv1),
			visualSettings.discarded, 40, false);
		    updateMarkerAndTable(
			waypoints.indexOf(thisAV.fp.leftResult.minv2),
			visualSettings.discarded, 40, false);
		}

		// count this distance comparison
		thisAV.halvesDComps++;
		thisAV.updateDComps();

		thisAV.updateCallStack();

                hdxAV.nextAction = "findOverlapCandidates";
            },
            logMessage: function(thisAV) {
                return "Closer pair of two subproblems: [" + 
		    thisAV.fp.minv1.label + "," +
		    thisAV.fp.minv2.label + "], d: " +
		    thisAV.fp.minDist.toFixed(3);
            }
        },
	{
	    label: "findOverlapCandidates",
	    comment: "Find candidate overlap points",
	    code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		let midLon = thisAV.WtoE[thisAV.fp.firstRight].lon;
		// note: degrees are not miles, so in order to find
		// (actually approximate based on the latitude of
		// the firstRight point) how much longitude west and
		// east of this for which points should be considered
		let degRange =
		    changeInLongitude(thisAV.WtoE[thisAV.fp.firstRight].lat,
				      thisAV.fp.minDist);
		// save these for use below and again on bounding box
		// for candidate overlap points that need to be considered
		thisAV.fp.minLon = midLon - degRange;
		thisAV.fp.maxLon = midLon + degRange;

		// build the list of points within the strip
		// that will be considered as possible closest
		// pairs that overlap the two halves
                thisAV.NtoS = [];
		for (let i = thisAV.fp.startIndex;
		     i < thisAV.fp.endIndex; i++) {
		    if (thisAV.WtoE[i].lon > thisAV.fp.minLon &&
			thisAV.WtoE[i].lon < thisAV.fp.maxLon) {
			thisAV.NtoS.push(thisAV.WtoE[i]);
		    }
		}
		// sort them by latitude
                thisAV.NtoS.sort((a,b) => (a.lat > b.lat) ? -1: 1);

		// highlight the candidate points
		for (let i = 0; i < thisAV.NtoS.length; i++) {
		    updateMarkerAndTable(waypoints.indexOf(thisAV.NtoS[i]),
					 thisAV.visualSettings.overlapPoints,
					 40, false);
		}

		// draw the west and east bounds
		let westCoords = [];
		westCoords[0] = [88, thisAV.fp.minLon];
		westCoords[1] = [-88, thisAV.fp.minLon];
		thisAV.fp.westLine = L.polyline(westCoords, {
		    color: thisAV.visualSettings.overlapPoints.color,
		    opacity: 0.5,
		    weight: 3
		});
		thisAV.fp.westLine.addTo(map);
		let eastCoords = [];
		eastCoords[0] = [88, thisAV.fp.maxLon];
		eastCoords[1] = [-88, thisAV.fp.maxLon];
		thisAV.fp.eastLine = L.polyline(eastCoords, {
		    color: thisAV.visualSettings.overlapPoints.color,
		    opacity: 0.5,
		    weight: 3
		});
		thisAV.fp.eastLine.addTo(map);

		thisAV.overlapTotalPoints += thisAV.NtoS.length;
		updateAVControlEntry("overlaps",
				     "Overlap points, total: " +
				     thisAV.overlapTotalPoints +
				     ", current: " + thisAV.NtoS.length);
		
		// set up the loop index for the for loop
		thisAV.globali = 0;
		
                hdxAV.nextAction = "forLoopTop";
	    },
            logMessage: function(thisAV) {
                return "Found " + thisAV.NtoS.length +
		    " candidate overlap points";
            }
	},
        {
            label: "forLoopTop",
            comment: "Next candidate point in the overlap region",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// save the search window latitude size for boxes
		thisAV.fp.latDiff = changeInLatitude(thisAV.fp.minDist);

                if (thisAV.globali <= thisAV.NtoS.length - 2) {
		    // highlight current point at globali
		    updateMarkerAndTable(
			waypoints.indexOf(thisAV.NtoS[thisAV.globali]),
			visualSettings.startVertex, 40, false);

		    // bounding box for the points that need to
		    // considered for this iteration
		    let bounds = [
			[thisAV.NtoS[thisAV.globali].lat, thisAV.fp.minLon],
			[thisAV.NtoS[thisAV.globali].lat, thisAV.fp.maxLon],
			[thisAV.NtoS[thisAV.globali].lat - thisAV.fp.latDiff,
			 thisAV.fp.maxLon],
			[thisAV.NtoS[thisAV.globali].lat - thisAV.fp.latDiff,
			 thisAV.fp.minLon]
		    ];
		    if (thisAV.fp.hasOwnProperty("candidateBox")) {
			thisAV.fp.candidateBox.setBounds(bounds);
		    }
		    else {
			thisAV.fp.candidateBox = L.rectangle(
			    bounds,
			    {
				color: "red",
				weight: 0.5,
				scale: 4
			    });
			thisAV.fp.candidateBox.addTo(map);
		    }
                    hdxAV.nextAction = "updateWhileLoopIndex";
		}
                else {
                    hdxAV.nextAction = "return";
                }
            },
            logMessage: function(thisAV) {
                return "Next candidate point in the overlap region";
            }
        },
        {
            label: "updateWhileLoopIndex",
            comment: "Set initial index for while loop",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.globalk = thisAV.globali + 1;

                hdxAV.nextAction = "whileLoopTop";
            },
            logMessage: function(thisAV) {
                return "Set initial index for while loop";
            }
        },
        {
            label: "whileLoopTop",
            comment: "Check while loop stopping conditions",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// check while loop conditions
		if (thisAV.globalk == thisAV.NtoS.length) {
		    // we are beyond the last k for this i
		    // so increment i and go back to the top
		    // of the for loop
		    thisAV.globali += 1;
		    // unhighlight vi
		    updateMarkerAndTable(waypoints.indexOf(thisAV.fp.vi),
					 thisAV.visualSettings.overlapPoints,
					 40, false);
		    hdxAV.nextAction = "forLoopTop";
		}
		else {
		    // save these points in the call frame to simplify
		    // code here and in subsequent actions
		    thisAV.fp.vi = thisAV.NtoS[thisAV.globali];
		    thisAV.fp.vk = thisAV.NtoS[thisAV.globalk];
		    if (Math.abs(thisAV.fp.vi.lat - thisAV.fp.vk.lat)
			>= thisAV.fp.latDiff) {
			// large change in latitude, no need to keep checking
			thisAV.globali += 1;
			// unhighlight vi
			updateMarkerAndTable(
			    waypoints.indexOf(thisAV.fp.vi),
			    thisAV.visualSettings.overlapPoints, 40, false);
			hdxAV.nextAction = "forLoopTop";
		    }
		    else {
			// we do need to check this pair
			// highlight current point at globalk
			updateMarkerAndTable(waypoints.indexOf(thisAV.fp.vk),
			    visualSettings.endVertex, 40, false);
			hdxAV.nextAction = "checkNextPair";
		    }
		}
            },
            logMessage: function(thisAV) {
                return "Check while loop stopping conditions";
            }
	},
        {
            label: "checkNextPair",
            comment: "Check if this pair in overlap is a new closest pair",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		let newd = convertToCurrentUnits(
		    distanceInMiles(thisAV.fp.vi.lat, thisAV.fp.vi.lon,
				    thisAV.fp.vk.lat, thisAV.fp.vk.lon));

		thisAV.overlapDComps++;
		thisAV.updateDComps();

                if (newd < thisAV.fp.minDist) {
		    hdxAV.nextAction = "updateMinPairFound";
		}
		else {
                    hdxAV.nextAction = "incrementWhileLoopIndex";
		}
            },
            logMessage: function(thisAV) {
                return "Check if this pair in overlap is a new closest pair";
            }
        },
        {
            label: "updateMinPairFound",
            comment: "Save new minimum distance found",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// discard old pair
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv1),
				     visualSettings.discarded,
				     40, false);
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv2),
				     visualSettings.discarded,
				     40, false);
		
		thisAV.fp.minDist = convertToCurrentUnits(
		    distanceInMiles(thisAV.fp.vi.lat, thisAV.fp.vi.lon,
				    thisAV.fp.vk.lat, thisAV.fp.vk.lon));
		thisAV.fp.minv1 = thisAV.fp.vi;
		thisAV.fp.minv2 = thisAV.fp.vk;

		// highlight new closest pair
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv1),
				     visualSettings.leader,
				     40, false);
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv2),
				     visualSettings.leader,
				     40, false);
		// update connecting line between
		let array = []
		array[0] = [thisAV.fp.vi.lat, thisAV.fp.vi.lon];
		array[1] = [thisAV.fp.vk.lat, thisAV.fp.vk.lon];
		thisAV.fp.minLine.setLatLngs(array);

		thisAV.overlapLeaders++;
		updateAVControlEntry("overlapLeaders",
				     "Leaders found among overlaps: " +
				     thisAV.overlapLeaders);
		
		// display updated closest pair on the call stack
		thisAV.updateCallStack();
                hdxAV.nextAction = "incrementWhileLoopIndex";
            },
            logMessage: function(thisAV) {
                return "New closest pair in overlap: [" + 
		    thisAV.fp.minv1.label + "," +
		    thisAV.fp.minv2.label + "], d: " +
		    thisAV.fp.minDist.toFixed(3);
            }
        },
        {
            label: "incrementWhileLoopIndex",
            comment: "Increment while loop index",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// unhighlight vi
		updateMarkerAndTable(
		    waypoints.indexOf(thisAV.fp.vk),
		    thisAV.visualSettings.overlapPoints, 40, false);
		
                thisAV.globalk += 1;
                hdxAV.nextAction = "whileLoopTop";
            },
            logMessage: function(thisAV) {
                return "Increment while loop index";
            }
        },
        {
            label: "return",
            comment: "Return closest pair for this recursive call",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		if (thisAV.fp.hasOwnProperty("candidateBox")) {
		    thisAV.fp.candidateBox.remove();
		}

		// update overlaps AVCP entry to remove the current
		// overlap count
		updateAVControlEntry("overlaps",
				     "Overlap points, total: " +
				     thisAV.overlapTotalPoints);

		// update colors
		// everything in the range is discarded except the
		// final subproblem closest pair, and the connecting
		// line segment should already be set correctly
		for (let i = thisAV.fp.startIndex;
		     i <= thisAV.fp.endIndex; i++) {
		    if ((thisAV.WtoE[i] != thisAV.fp.minv1) &&
			(thisAV.WtoE[i] != thisAV.fp.minv2)) {
			updateMarkerAndTable(
			    waypoints.indexOf(thisAV.WtoE[i]),
			    visualSettings.discarded, 40, false);
		    }
		    else {
			updateMarkerAndTable(
			    waypoints.indexOf(thisAV.WtoE[i]),
			    visualSettings.leader, 40, false);
		    }
		}
		
		// remove the recursive subproblem dividing line from the map
		// and west and east bound lines
		thisAV.fp.recLine.remove();
		thisAV.fp.westLine.remove();
		thisAV.fp.eastLine.remove();
		
		// prep to go back to where this recursive call returns
                hdxAV.nextAction = thisAV.fp.nextAction;

		// pop the call stack
		thisAV.retval = thisAV.recStack.pop();
		if (thisAV.recStack.length > 0) {
		    thisAV.fp = thisAV.recStack[thisAV.recStack.length - 1];
		}
		else {
		    thisAV.fp = null;
		}
		
            },
            logMessage: function(thisAV) {
                return "Closest pair for this recursive call: [" + 
		    thisAV.retval.minv1.label + "," +
		    thisAV.retval.minv2.label + "], d: " +
		    thisAV.retval.minDist.toFixed(3);
            }
        },
        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {

		if (thisAV.overlays) {
		    // remove the overlays from the returned call
		    thisAV.retval.eastBox.remove();
		    thisAV.retval.westBox.remove();
		}

                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Done!";
            }
        }
    ],
    
    // update description of the call stack in the currentCall AVCP entry
    updateCallStack() {
	let t = "Total recursive calls: " + this.recCallCount +
	    ", " + this.bfCases + " base cases<br />";
	for (let i = 0; i < this.recStack.length; i++) {
	    let f = this.recStack[i];
	    let entry = "Level " + f.recLevel;
	    if (i == 0) {
		entry += " (initial)";
	    }
	    else if (this.recStack[i-1].hasOwnProperty("leftResult")) {
		entry += " (right)";
	    }
	    else {
		entry += " (left)";
	    }
	    entry += " " + (f.endIndex - f.startIndex + 1) +
		" points, range: [" + f.startIndex + "," + f.endIndex + "]";

	    // if we have a min so far, use it
	    if (f.hasOwnProperty("minv1")) {
		entry += "<br />&nbsp;&nbsp;" +
		    spanWithVS(
			"Closest: [" + 
			    f.minv1.label + "," +
			    f.minv2.label + "], d: " +
			    f.minDist.toFixed(3),
			visualSettings.leader);
	    }
	    else {
		// maybe we have subproblem results
		if (f.hasOwnProperty("leftResult")) {
		    entry += "<br />&nbsp;&nbsp;" +
			spanWithVS(
			    "Left Closest: [" + 
				f.leftResult.minv1.label + "," +
				f.leftResult.minv2.label + "], d: " +
				f.leftResult.minDist.toFixed(3),
			    visualSettings.leader);
		}
		
		if (f.hasOwnProperty("rightResult")) {
		    entry += "<br />&nbsp;&nbsp;" +
			spanWithVS(
			    "Right Closest: [" + 
				f.rightResult.minv1.label + "," +
				f.rightResult.minv2.label + "], d: " +
				f.rightResult.minDist.toFixed(3),
			    visualSettings.leader);
		}
	    }
	    
	    t = entry + "<br />" + t;
	}
	updateAVControlEntry("currentCall", t);
    },

    // update the colors of waypoints in the given range of the WtoE array,
    // based on the given visualSettings
    colorWtoERange(start, end, vs) {

        for (let i = start; i <= end; i++) {
            updateMarkerAndTable(waypoints.indexOf(this.WtoE[i]),
				 vs, 40, false);
        }
    },

    // update the distance comparisons counts in their "dComps" AVCP entry
    updateDComps() {
	let s = "Distance comparisons: " +
	    (this.bfDComps + this.halvesDComps + this.overlapDComps) +
	    "<br />";
	s += "&nbsp;&nbsp;Base cases: " + this.bfDComps + "</br>";
	s += "&nbsp;&nbsp;Compare left/right leaders: " + this.halvesDComps + "</br>";
	s += "&nbsp;&nbsp;Overlap regions: " + this.overlapDComps + "</br>";
	updateAVControlEntry("dComps", s);
    },
    
    // required prepToStart function
    // initialize a vertex closest pairs divide and conquer search
    prepToStart() {

        hdxAV.algStat.innerHTML = "Initializing";

        // show waypoints, hide connections
        initWaypointsAndConnections(true, false,
                                    visualSettings.undiscovered);

	this.minPoints = document.getElementById("minPoints").value;
	this.maxRec = document.getElementById("maxRec").value;
	this.overlays = document.getElementById("overlays").checked;
		 
	this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">call CPRec with points sorted &uarr; by longitude</td></tr>';
        this.code += pcEntry(0,'CPRec(WtoE)',"recursiveCallTop");
	let recLimitCode = "";
	if (this.maxRec > 0) {
	    recLimitCode = " or recDepth &gt; " + this.maxRec;
	}
        this.code += pcEntry(1,['n &larr; WtoE.length',
				'if (n &leq; ' + this.minPoints +
				recLimitCode + ')'],
			     "checkBaseCase");
        this.code += pcEntry(2,'return(brute force cp)',
			     "returnBruteForceSolution");
        this.code += pcEntry(1,'else',"");
        this.code += pcEntry(2,'cp<sub>left</sub> &larr; CPRec(WtoE[0, (n/2)-1])',"callRecursionLeft");
        this.code += pcEntry(2,'cp<sub>right</sub> &larr; CPRec(WtoE[n/2, n-1])',"callRecursionRight");
        this.code += pcEntry(2,'cp &larr; min_d(cp<sub>left</sub>, cp<sub>right</sub>)',"setMinOfHalves");
        this.code += pcEntry(2,'mid &larr; WtoE[n/2].lon<br />&nbsp;&nbsp;&nbsp;&nbsp;nearMid[] &larr; all pts with |lon − mid| < cp',"findOverlapCandidates");
        this.code += pcEntry(2,'for i &larr; 0 to nearMid.length - 2 do',"forLoopTop");
        this.code += pcEntry(3,'k &larr; i + 1',"updateWhileLoopIndex");
        this.code += pcEntry(3,['while (k &leq; nearMid.length - 1 and',
				'(nearMid[k].lat - nearMid[i].lat) &lt; cp)'],
			     "whileLoopTop");
        this.code += pcEntry(4,['d &larr; dist(nearMid[i],nearMid[k])','if d &lt; cp'],"checkNextPair");
        this.code += pcEntry(5,'cp &larr; d',"updateMinPairFound");
        this.code += pcEntry(4,'k &larr; k + 1',"incrementWhileLoopIndex");
        this.code += pcEntry(2,'return cp',"return");
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
	newAO += '<input id="overlays" type="checkbox" checked /> Show recursion level overlays'
        hdxAV.algOptions.innerHTML = newAO;

	// honor QS parameters
	if (HDXQSIsSpecified("minPoints")) {
	    let minPoints = parseFloat(HDXQSValue("minPoints"));
	    if ((minPoints >= 3) && (minPoints <= (waypoints.length - 1)/2)) {
		document.getElementById("minPoints").value = minPoints;
	    }
	    else {
		console.log("minPoints QS parameter " +
			    HDXQSValue("minPoints") + " invalid");
	    }
	}

	if (HDXQSIsSpecified("maxRec")) {
	    let maxRec = parseFloat(HDXQSValue("maxRec"));
	    if ((maxRec >= 0) && (maxRec <= (waypoints.length - 1)/2)) {
		document.getElementById("maxRec").value = maxRec;
	    }
	    else {
		console.log("maxRec QS parameter " +
			    HDXQSValue("maxRec") + " invalid");
	    }
	}

	if (HDXQSIsSpecified("overlays")) {
	    let overlays = HDXQSValue("overlays");
	    if (overlays == "true") {
		document.getElementById("overlays").checked = true;
	    }
	    else if (overlays == "false") {
		document.getElementById("overlays").checked = false;
	    }
	    else {
		console.log("overlays QS parameter " +
			    HDXQSValue("overlays") + " invalid");
	    }
	}

	// AV control panel entries
        addEntryToAVControlPanel("dComps", this.visualSettings.dComps);
        addEntryToAVControlPanel("overlaps",
				 this.visualSettings.overlapPoints);
        addEntryToAVControlPanel("overlapLeaders",
				 this.visualSettings.overlapPoints);

	// this one grows and shrinks so should be last to avoid
	// lots of bouncing up and down of others
        addEntryToAVControlPanel("currentCall", this.visualSettings.recursiveCall);
    },

    // remove UI modifications made for vertex closest pairs
    cleanupUI() {

	// clean up any rectangles and polylines still in existence
	
	// properties to check
	let overlays = [ "westLine", "eastLine", "recLine", "minLine",
			 "candidateBox", "eastBox", "westBox" ];

	// if there is anything on the recursive stack, look for and
	// remove the map objects
	for (let i = 0; i < this.recStack.length; i++) {
	    let fp = this.recStack[i];
	    for (let j = 0; j < overlays.length; j++) {
		if (fp.hasOwnProperty(overlays[j])) {
		    fp[overlays[j]].remove();
		}
	    }
	}

	// if we ran to completion, or stopped between when a call frame
	// was popped and it was finished being processed, there could
	// be others in the retval call frame
	for (let j = 0; j < overlays.length; j++) {
	    if (this.retval.hasOwnProperty(overlays[j])) {
		this.retval[overlays[j]].remove();
	    }
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
    },

    // our current AV parameters as QS parameters
    avParamsQS() {

	return "&minPoints=" + document.getElementById("minPoints").value +
	    "&maxRec=" + document.getElementById("maxRec").value +
	    "&overlays=" + document.getElementById("overlays").checked;
    }
};
