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

    // many other variables will end up on the recursive stack, which
    // will contain instances of objects constructed by the CallFrame
    // constructor below
    recStack: null,
    // the frame at the top of the stack at any given time
    fp: null,
    // the frame most recently popped from the stack for
    // caller to get result and other info
    retval: null,

    closeToCenter: null,
    lineCount: 0,

    // vertices sorted by longitude
    WtoE: null,
    // vertices sorted by latitude
    NtoS: [],
    
    // used for shading
    northBound: 0,
    southBound: 0,

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
            color: "green",
            textColor: "white",
            scale: 6,
            name: "recursiveCall",
            value: 0
        },
        recursiveLeft: {
            color: "DarkGreen",
            textColor: "white",
            scale: 6,
            name: "recursiveLeft",
            value: 0
        },
        recursiveRight: {
            color: "YellowGreen",
            textColor: "white",
            scale: 6,
            name: "recursiveRight",
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
                updateAVControlEntry("closeLeader", "no closest pair yet, dclosest = &infin;");
                updateAVControlEntry("totalChecked", "0");
                thisAV.lineCount = 0;

		thisAV.fp = new HDXCPRecCallFrame(
		    0, // start index
		    waypoints.length - 1, // end index
		    1, // level 1 of recursion
		    "cleanup" // action to continue after call complete3
		);
		console.log("Pushing fp with cleanup");
		thisAV.recStack.push(thisAV.fp);

                thisAV.closeToCenter = [];
                thisAV.minHalvesSquared = 0;
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

		thisAV.updateCallStack();
		thisAV.colorWtoERange(thisAV.fp.startIndex,
				      thisAV.fp.endIndex,
				      thisAV.visualSettings.recursiveCall);

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

		// brute force search among all pairs in this subrange
		thisAV.fp.minDist = Number.MAX_VALUE;
                for (let i = thisAV.fp.startIndex;
		     i <= thisAV.fp.endIndex - 1; i++) {
                    for (let j = i + 1; j <= thisAV.fp.endIndex; j++) {
			let v1 = thisAV.WtoE[i];
			let v2 = thisAV.WtoE[j];
			let minDistTest = convertToCurrentUnits(
			    distanceInMiles(v1.lat, v1.lon, v2.lat, v2.lon));
			
                        if (minDistTest < thisAV.fp.minDist) {
                            thisAV.fp.minDist = minDistTest;
			    thisAV.fp.minv1 = thisAV.WtoE[i];
			    thisAV.fp.minv2 = thisAV.WtoE[j];
                        }
                    }
		}

		// update range to discarded status
		thisAV.colorWtoERange(thisAV.fp.startIndex,
				      thisAV.fp.endIndex,
				      visualSettings.discarded);

		console.log("index of minv1 = " + waypoints.indexOf(thisAV.fp.minv1) + ", index of minv2 = " + waypoints.indexOf(thisAV.fp.minv2));
		// update winner on map and table
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv1),
				     visualSettings.leader, 40, false);
		updateMarkerAndTable(waypoints.indexOf(thisAV.fp.minv2),
				     visualSettings.leader, 40, false);

		// TODO: draw connecting line?

                updateAVControlEntry("closeLeader", "Closest: [" + 
				     thisAV.fp.minv1.label + "," +
				     thisAV.fp.minv2.label
				     + "], d: " +
				     thisAV.fp.minDist.toFixed(3));

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
		console.log("Pushing fp with callRecursionRight");
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
		console.log("Pushing fp with setMinOfHalves");
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
		// thisAV.retval, save this in our own "leftresult"
		thisAV.fp.rightResult = thisAV.retval;

		// which was smaller?
		if (thisAV.fp.leftResult.minDist <
		    thisAV.fp.rightResult.minDist) {
		    thisAV.fp.minDist = thisAV.fp.leftResult.minDist;
		    thisAV.fp.minv1 = thisAV.fp.leftResult.minv1;
		    thisAV.fp.minv2 = thisAV.fp.leftResult.minv2;
		}
		else {
		    thisAV.fp.minDist = thisAV.fp.rightResult.minDist;
		    thisAV.fp.minv1 = thisAV.fp.rightResult.minv1;
		    thisAV.fp.minv2 = thisAV.fp.rightResult.minv2;
		}

		// update winner on map and table
		// TODO: draw connecting line?
                updateAVControlEntry("closeLeader", "Closest: [" + 
				     thisAV.fp.minv1.label + "," +
				     thisAV.fp.minv2.label
				     + "], d: " +
				     thisAV.fp.minDist.toFixed(3));
		
                //thisAV.currentLine = thisAV.drawLineMap(waypoints[waypoints.indexOf(thisAV.WtoE[thisAV.startIndex - 1])].lon,
                //waypoints[waypoints.indexOf(thisAV.WtoE[thisAV.startIndex])].lon);

                //DRAW YELLOW LINE
                //thisAV.lineStack.add(thisAV.currentLine);

                hdxAV.nextAction = "findOverlapCandidates";
            },
            logMessage: function(thisAV) {
                return "Find smaller of minimum distances from the two halves";
            }
        },
	{
	    label: "findOverlapCandidates",
	    comment: "Find candidate overlap points",
	    code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		let midIndex = Math.ceil(
		    thisAV.fp.startIndex + 
			(thisAV.fp.endIndex-thisAV.fp.startIndex)/2);
		let midLon = thisAV.WtoE[midIndex].lon;
		let minLon = midLon - thisAV.fp.minDist;
		let maxLon = midLon + thisAV.fp.minDist;

		// build the list of points within the strip
		// that will be considered as possible closest
		// pairs that overlap the two halves
                thisAV.NtoS = [];
		for (let i = thisAV.fp.startIndex;
		     i < thisAV.fp.endIndex; i++) {
		    if (thisAV.WtoE[i].lon > minLon &&
			thisAV.WtoE[i].lon < maxLon) {
			thisAV.NtoS.push(thisAV.WtoE[i]);
		    }
		}
		// sort them by latitude
                thisAV.NtoS.sort((a,b) => (a.lat > b.lat) ? -1: 1);

		// TODO: highlight the candidate points

		// set up the loop index for the for loop
		thisAV.globali = 0;
		
                hdxAV.nextAction = "forLoopTop";
	    },
            logMessage: function(thisAV) {
                return "Find candidate overlap points";
            }
	},
        {
            label: "forLoopTop",
            comment: "Next candidate point in the overlap region",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// TODO: highlight current point at globali?
                if (thisAV.globali <= thisAV.NtoS.length - 2) {
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
		if (thisAV.globalK == thisAV.NtoS.length) {
		    // we are beyond the last k for this i
		    // so increment i and go back to the top
		    // of the for loop
		    thisAV.globali += 1;
		    hdxAV.nextAction = "forLoopTop";
		}
		else {
		    // save these points in the call frame to simplify
		    // code here and in subsequent actions
		    thisAV.fp.vi = thisAV.NtoS[thisAV.globali];
		    thisAV.fp.vk = thisAV.NtoS[thisAV.globalk];
		    if ((thisAV.fp.vk.lat -thisAV.fp.vi.lat)
			>= thisAV.fp.minDist) {
			// large change in latitude, no need to keep checking
			thisAV.globali += 1;
			hdxAV.nextAction = "forLoopTop";
		    }
		    else {
			// we do need to check this pair
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

		let newdsq = Math.pow(thisAV.fp.vi.lat - thisAV.fp.vk.lat, 2) +
		    Math.pow(thisAV.fp.vi.lon - thisAV.fp.vk.lon, 2);
                if (newdsq < thisAV.fp.minDist) {
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

		thisAV.fp.minDist = Math.sqrt(
		    Math.pow(thisAV.fp.vi.lat - thisAV.fp.vk.lat, 2) +
			Math.pow(thisAV.fp.vi.lon - thisAV.fp.vk.lon, 2));
		thisAV.fp.minv1 = thisAV.fp.vi;
		thisAV.fp.minv2 = thisAV.fp.vk;

                hdxAV.nextAction = "incrementWhileLoopIndex";
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

		// TODO: update colors

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
                return "Return closest pair for this recursive call";
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
			     "Recursive Level " + this.fp.recLevel + ", " +
			     (this.fp.endIndex - this.fp.startIndex + 1) +
			     " points, range: [" + this.fp.startIndex + "," +
			     this.fp.endIndex + "]");
    },

    // update description of the call stack in the currentCall AVCP entry
    updateCallStack() {
	let t = "";
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
        hdxAV.algOptions.innerHTML = newAO;
        addEntryToAVControlPanel("currentCall", this.visualSettings.recursiveCall);
        addEntryToAVControlPanel("closeLeader", visualSettings.leader);
        addEntryToAVControlPanel("totalChecked", visualSettings.visiting);
        addEntryToAVControlPanel("savedCheck", visualSettings.undiscovered);
    },

    // remove UI modifications made for vertex closest pairs
    cleanupUI() {
        //waypoints = this.originalWaypoints;
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
    
