//
// HDX Brute-force extreme vertex pairs (closest/furthest) AV
//
// METAL Project
//
// Primary Author: Jim Teresco
//

/* closest/farthest pairs of vertices, just brute force for now */
const hdxVertexPairsAV = {

    // entries for list of AVs
    value: "vpairs",
    name: "Vertex Closest/Farthest Pairs",
    description: "Search for the closest and/or farthest pair of vertices (waypoints).",

    // vertices, no edges
    useV: true,
    useE: false,
    
    // state variables for closest pairs search
    // loop indices
    v1: 0,
    v2: 0,

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
    keepAllLines: false,
    v1Lines: [],
    allLines: [],

    // what are we computing?
    findClosest: true,
    findFurthest: false,
    
    // visual settings specific to closest/farthest pairs
    // NOTE: these match BFCH and should probably be given
    // common names and moved to hdxAV.visualSettings
    visualSettings: {
        v1: {
            color: "#1b6eff",
            textColor: "white",
            scale: 6,
            name: "v1",
            value: 0
        },
        v2: {
            color: "rgb(255, 60, 60)",
            textColor: "white",
            scale: 6,
            name: "v2",
            value: 0
        },
        discardedv2: {
            color: "green",
            textColor: "black",
            scale: 2,
            name: "discardedv2",
            value: 0
        }
    },
    
    // the actions that make up this algorithm
    avActions: [
        {
            label: "START",
            comment: "initialize closest pair variables",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		if (thisAV.findClosest) {
                    hdxAVCP.update("closeLeader",
				   "no leader yet, d<sub>closest</sub> = &infin;");
		}
		else {
		    hdxAVCP.update("closeLeader", "");
		}
		
		if (thisAV.findFarthest) {
                    hdxAVCP.update("farLeader",
				   "no leader yet, d<sub>farthest</sub> = 0");
		}
		else {
		    hdxAVCP.update("farLeader", "");
		}

                hdxAV.iterationDone = true;
                thisAV.v1 = -1;  // will increment to 0
                thisAV.d_closest = Number.MAX_VALUE;
                thisAV.d_farthest = 0;
                hdxAV.nextAction = "v1forLoopTop";
            },
            logMessage: function(thisAV) {
                return "Initializing closest pair variables";
            }
        },
        {
            label: "v1forLoopTop",
            comment: "outer for loop to visit all pairs of points",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.v1);
                thisAV.v1++;
                if (thisAV.v1 == waypoints.length-1) {
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    hdxAV.nextAction = "v2forLoopTop";
                    thisAV.v2 = thisAV.v1;  // will increment to +1
                    updateMarkerAndTable(thisAV.v1, thisAV.visualSettings.v1,
                                         30, false);
                    hdxAVCP.update("v1visiting", "v<sub>1</sub>: #" +
				   thisAV.v1 + " " +
				   waypoints[thisAV.v1].label);
                    // all subsequent vertices will be looped over and should
                    // go back to undiscovered for now
                    for (let i = thisAV.v1+1; i < waypoints.length; i++) {
                        updateMarkerAndTable(i, visualSettings.undiscovered,
                                             20, false);
                    }
                }
            },
            logMessage: function(thisAV) {
                return "Next v<sub>1</sub>=" + thisAV.v1;
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.VERTEX,
		    vindexvar: "v<sub>1</sub>"
		},
		f: function(thisAV, matchvnum, matchtype, textval) {
		    return isCBPVertexMatch(thisAV.v1,
					    matchvnum, matchtype, textval);
		}		
	    }
        },
        {
            label: "v2forLoopTop",
            comment: "inner for loop to visit all pairs of points",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.v2);
                thisAV.v2++;
                if (thisAV.v2 == waypoints.length) {
                    hdxAV.nextAction = "v1forLoopBottom";
                }
                else {
                    hdxAV.nextAction = "computeDistance";
                    updateMarkerAndTable(thisAV.v2, thisAV.visualSettings.v2,
                                         30, false);
                    hdxAVCP.update("v2visiting", "v<sub>2</sub>: #" +
				   thisAV.v2 + " " +
				   waypoints[thisAV.v2].label);
                    hdxAVCP.update("checkingDistance", "Distance: ");
                    thisAV.drawLineVisiting();
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                if (hdxAV.traceActions) {
                    return "Next v<sub>2</sub>=" + thisAV.v2;
                }
                return "Checking v<sub>1</sub>=" + thisAV.v1 +
                    "and v<sub>2</sub>=" + thisAV.v2;
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.VERTEX,
		    vindexvar: "v<sub>2</sub>"
		},
		f: function(thisAV, matchvnum, matchtype, textval) {
		    return isCBPVertexMatch(thisAV.v2,
					    matchvnum, matchtype, textval);
		}		
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
                hdxAVCP.update("checkingDistance", "Distance: " +
			       thisAV.d_this.toFixed(3));
		if (thisAV.findClosest) {
                    hdxAV.nextAction = "checkCloseLeader";
		}
		else {
		    hdxAV.nextAction = "checkFarLeader";
		}
            },
            logMessage: function(thisAV) {
                return "Compute distance " + thisAV.d_this.toFixed(3) + " between v<sub>1</sub>=" + thisAV.v1 + " and v<sub>2</sub>=" + thisAV.v2;
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.FLOAT,
		    checkvar: "d"
		},
		f: function(thisAV, matchtype, matchval) {
		    return isCBPFloatMatch(thisAV.d_this,
					   matchtype, matchval);
		}		
	    }
        },
        {
            label: "checkCloseLeader",
            comment: "check if current candidate pair is the new closest pair",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);       
                if (thisAV.d_this < thisAV.d_closest) {
                    hdxAV.nextAction = "newCloseLeader";
                }
                else {
		    if (thisAV.findFarthest) {
			hdxAV.nextAction = "checkFarLeader";
		    }
		    else {
			hdxAV.nextAction = "v2forLoopBottom";
		    }
                }
            },
            logMessage: function(thisAV) {
                return "Check if [" + thisAV.v1 + "," + thisAV.v2 + "] is the new closest pair";
            },
            currentVariable: function(thisAV) {
                return (thisAV.d_this < thisAV.d_closest);
            }
        },
        {
            label: "newCloseLeader",
            comment: "update new closest pair",
            code: function(thisAV) {

                highlightPseudocode(this.label, visualSettings.leader);

                // if we had previous leaders, they're no longer leaders
                if (thisAV.closest[0] != -1) {
                    // old v1 leader is now either going to be leader again
                    // below or is now discarded, so mark as discarded
                    updateMarkerAndTable(thisAV.closest[0],
                                         visualSettings.discarded, 15, true);

                    // old v2 leader is either discarded if it's less than
                    // or equal to v1, unvisited on this inner iteration
                    // otherwise
                    if (thisAV.closest[1] <= thisAV.v1) {
                        updateMarkerAndTable(thisAV.closest[1],
                                             visualSettings.discarded, 15,
                                             true);
                    }
                    else {
                        updateMarkerAndTable(thisAV.closest[1],
                                             thisAV.visualSettings.discardedv2,
                                             15, false);
                    }
                }
                // remember the current pair as the closest
                thisAV.closest = [ thisAV.v1, thisAV.v2 ];
                thisAV.d_closest = thisAV.d_this;

                hdxAVCP.update("closeLeader", "Closest: [" + 
                               thisAV.v1 + "," + thisAV.v2 +
			       "], d<sub>closest</sub>: " +
			       thisAV.d_closest.toFixed(3));
                updateMarkerAndTable(thisAV.v1, visualSettings.leader,
                                     40, false);
                updateMarkerAndTable(thisAV.v2, visualSettings.leader,
                                     40, false);
                thisAV.updateLineClosest();
		if (thisAV.findFarthest) {
                    hdxAV.nextAction = "checkFarLeader";
		}
		else {
		    hdxAV.nextAction = "v2forLoopBottom";
		}
            },
            logMessage: function(thisAV) {
                return "[" + thisAV.v1 + "," + thisAV.v2 + "] new closest pair with d<sub>closest</sub>=" + thisAV.d_closest.toFixed(3);
            }
        },
        {
            label: "checkFarLeader",
            comment: "check if current candidate pair is the new farthest pair",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);       
                if (thisAV.d_this > thisAV.d_farthest) {
                    hdxAV.nextAction = "newFarLeader";
                }
                else {
                    hdxAV.nextAction = "v2forLoopBottom";
                }
            },
            logMessage: function(thisAV) {
                return "Check if [" + thisAV.v1 + "," + thisAV.v2 + "] is the new farthest pair";
            },
            currentVariable: function(thisAV) {
                return (thisAV.d_this > thisAV.d_farthest);
            }
        },
        {
            label: "newFarLeader",
            comment: "update new farthest pair",
            code: function(thisAV) {

                highlightPseudocode(this.label, visualSettings.leader2);

                // if we had previous leaders, they're no longer leaders
                if (thisAV.farthest[0] != -1) {
                    // old v1 leader is now either going to be leader again
                    // below or is now discarded, so mark as discarded
                    updateMarkerAndTable(thisAV.farthest[0],
                                         visualSettings.discarded, 15, true);

                    // old v2 leader is either discarded if it's less than
                    // or equal to v1, unvisited on this inner iteration
                    // otherwise
                    if (thisAV.farthest[1] <= thisAV.v1) {
                        updateMarkerAndTable(thisAV.farthest[1],
                                             visualSettings.discarded, 15,
                                             true);
                    }
                    else {
                        updateMarkerAndTable(thisAV.farthest[1],
                                             thisAV.visualSettings.discardedv2,
                                             15, false);
                    }
                }
                // remember the current pair as the farthest
                thisAV.farthest = [ thisAV.v1, thisAV.v2 ];
                thisAV.d_farthest = thisAV.d_this;

                hdxAVCP.update("farLeader", "Farthest: [" + 
                               thisAV.v1 + "," + thisAV.v2 +
			       "], d<sub>farthest</sub>: " +
			       thisAV.d_farthest.toFixed(3));
                updateMarkerAndTable(thisAV.v1, visualSettings.leader2,
                                     40, false);
                updateMarkerAndTable(thisAV.v2, visualSettings.leader2,
                                     40, false);
                thisAV.updateLineFarthest();
                hdxAV.nextAction = "v2forLoopBottom";
            },
            logMessage: function(thisAV) {
                return "[" + thisAV.v1 + "," + thisAV.v2 + "] new farthest pair with d<sub>farthest</sub>=" + thisAV.d_farthest.toFixed(3);
            }
        },
        {
            label: "v2forLoopBottom",
            comment: "end of outer for loop iteration",
            code: function(thisAV) {

                // undisplay the visiting segment
                thisAV.removeLineVisiting();
                
                // if the current v2 isn't part of the current closest pair
                // or current farthest pair, discard it
                if (thisAV.v2 == thisAV.closest[0] ||
                    thisAV.v2 == thisAV.closest[1]) {
                    updateMarkerAndTable(thisAV.v2,
                                         visualSettings.leader,
                                         40, false);
                }
                else if (thisAV.v2 == thisAV.farthest[0] ||
                         thisAV.v2 == thisAV.farthest[1]) {
                    updateMarkerAndTable(thisAV.v2,
                                         visualSettings.leader2,
                                         40, false);
                }
                else {
                    updateMarkerAndTable(thisAV.v2,
                                         thisAV.visualSettings.discardedv2,
                                         15, false);
                }
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "v2forLoopTop";
            },
            logMessage: function(thisAV) {
                // since this is an iterationDone action, we give a
                // different log message with more info
                if (hdxAV.traceActions) {
                    return "Done processing v<sub>2</sub>=" + thisAV.v2;
                }
                let leaderOrNot;
		const isNewClose = thisAV.closest[0] == thisAV.v1 &&
                    thisAV.closest[1] == thisAV.v2;
		const isNewFar = thisAV.farthest[0] == thisAV.v1 &&
                    thisAV.farthest[1] == thisAV.v2;
                if (isNewClose) {
		    if (isNewFar) {
			leaderOrNot = "New closest and farthest leader";
		    }
		    else {
			leaderOrNot = "New closest leader";
		    }
                }
		else if (isNewFar) {
		    leaderOrNot = "New farthest leader";
		}
                else {
                    leaderOrNot = "Discarding";
                }
                return leaderOrNot + ": distance " + thisAV.d_this.toFixed(3) +
		    " between v<sub>1</sub>=" + thisAV.v1 +
		    " and v<sub>2</sub>=" + thisAV.v2;
            }
        },
        {
            label: "v1forLoopBottom",
            comment: "end of outer for loop iteration",
            code: function(thisAV) {

                // if the current v1 isn't part of the current closest pair
                // or current farthest pair, we discard it
                if (thisAV.v1 == thisAV.closest[0] ||
                    thisAV.v1 == thisAV.closest[1]) {
                    updateMarkerAndTable(thisAV.v1,
                                         visualSettings.leader,
                                         40, false);
                }
                else if (thisAV.v1 == thisAV.farthest[0] ||
                         thisAV.v1 == thisAV.farthest[1]) {
                    updateMarkerAndTable(thisAV.v1,
                                         visualSettings.leader2,
                                         40, false);
                }
                else {
                    updateMarkerAndTable(thisAV.v1,
                                         thisAV.visualSettings.discardedv2,
                                         15, false);
                }
		// if we are keeping all lines, they get thinner and more
		// transparent when a v1 loop ends
		if (thisAV.keepAllLines) {
		    thisAV.movev1Lines();
		}
                hdxAV.nextAction = "v1forLoopTop";
            },
            logMessage: function(thisAV) {
                return "Done processing v<sub>1</sub>=" + thisAV.v1;
            }
        },
        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {

                // if the last vertex is not one of the closest pair or one
                // of the closest pair, we need to discard it
                if (waypoints.length - 1 != thisAV.closest[0] &&
                    waypoints.length - 1 != thisAV.closest[1] &&
                    waypoints.length - 1 != thisAV.farthest[0] &&
                    waypoints.length - 1 != thisAV.farthest[1]) {
                    updateMarkerAndTable(waypoints.length - 1,
                                         visualSettings.discarded, 15, true);
                }
                
                hdxAVCP.update("v1visiting", "");
                hdxAVCP.update("v2visiting", "");
                hdxAVCP.update("checkingDistance", "");
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
    drawLineVisiting() {

        const visitingLine = [];
        visitingLine[0] = [waypoints[this.v1].lat, waypoints[this.v1].lon];
        visitingLine[1] = [waypoints[this.v2].lat, waypoints[this.v2].lon];
        this.lineVisiting = L.polyline(visitingLine, {
            color: visualSettings.visiting.color,
            opacity: 0.6,
            weight: 4
        });
        this.lineVisiting.addTo(map);
	if (this.keepAllLines) {
	    this.v1Lines.push(this.lineVisiting);
	}
	
    },
    
    // function to remove the visiting polyline
    removeLineVisiting() {

	if (this.keepAllLines) {
	    this.lineVisiting.setStyle( {
		//color: visualSettings.discarded.color,
		opacity: 0.2,
		weight: 2
	    });
	}
	else {
            this.lineVisiting.remove();
	}	
    },

    // we are done with a v1, make its lines thinner and more
    // transparent, and move them into the allLines list
    movev1Lines() {

	while (this.v1Lines.length > 0) {
	    const line = this.v1Lines.pop();
	    line.setStyle( {
		color: visualSettings.discarded.color,
		opacity: 0.1,
		weight: 2
	    });
	    this.allLines.push(line);
	}
    },
    
    // functions to draw or update the polylines connecting the
    // current closest and furthest pairs
    updateLineClosest() {

        const closestLine = [];
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

        const farthestLine = [];
        farthestLine[0] = [waypoints[this.farthest[0]].lat, waypoints[this.farthest[0]].lon];
        farthestLine[1] = [waypoints[this.farthest[1]].lat, waypoints[this.farthest[1]].lon];

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

	// determine what we are computing
	const opt = document.getElementById("closeAndOrFar").value;
	this.findClosest = (opt == "closest" || opt == "both");
	this.findFarthest = (opt == "farthest" || opt == "both");

	this.keepAllLines = document.getElementById("keepLines").checked;
	
        // show waypoints, hide connections
        initWaypointsAndConnections(true, false,
                                    visualSettings.undiscovered);
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
	if (this.findClosest) {
	    this.code += 'closest &larr; null<br />d<sub>closest</sub> &larr; &infin;';
	}
	if (this.findClosest && this.findFarthest) {
	    this.code += '<br />';
	}
	if (this.findFarthest) {
	    this.code += 'farthest &larr; null<br />d<sub>farthest</sub> &larr; 0';
	}
	this.code += '</td></tr>';
        this.code += pcEntry(0,'for (v<sub>1</sub> &larr; 0 to |V|-2)',"v1forLoopTop");
        this.code += pcEntry(1, 'for (v<sub>2</sub> &larr; v1+1 to |V|-1)', "v2forLoopTop");
        this.code += pcEntry(2, 'd &larr; dist(v<sub>1</sub>,v<sub>2</sub>)', "computeDistance");
	if (this.findClosest) {
            this.code += pcEntry(2, 'if (d < d<sub>closest</sub>)', "checkCloseLeader");
            this.code += pcEntry(3, 'closest &larr; [v<sub>1</sub>,v<sub>2</sub>]<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;d<sub>closest</sub> &larr; d', "newCloseLeader");
	}
	if (this.findFarthest) {
            this.code += pcEntry(2, 'if (d > d<sub>farthest</sub>)', "checkFarLeader");
            this.code += pcEntry(3, 'farthest &larr; [v<sub>1</sub>,v<sub>2</sub>]<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;d<sub>farthest</sub> &larr; d', "newFarLeader");
	}
    },

    // set up UI entries for closest/farthest pairs
    setupUI() {

        hdxAV.algOptions.innerHTML = `
Compute: <select id="closeAndOrFar">
<option value="closest" selected>Closest Pair Only</option>
<option value="farthest">Farthest Pair Only</option>
<option value="both">Both Closest and Farthest Pair</option>
</select>
<br />
<input id="keepLines" type="checkbox" /> Keep all distance lines
`;

	// QS parameters
	HDXQSClear(this);
	HDXQSRegisterAndSetSelectList(this, "closeAndOrFar", "closeAndOrFar");
	HDXQSRegisterAndSetCheckbox(this, "keepLines", "keepLines");

	// AVCP entries
        hdxAVCP.add("v1visiting", this.visualSettings.v1);
        hdxAVCP.add("v2visiting", this.visualSettings.v2);
        hdxAVCP.add("checkingDistance", visualSettings.visiting);
        hdxAVCP.add("closeLeader", visualSettings.leader);
        hdxAVCP.add("farLeader", visualSettings.leader2);
    },
        
        
    // remove UI modifications made for vertex closest/farthest pairs
    cleanupUI() {

        if (this.lineClosest != null) {
            this.lineClosest.remove();
        }
        if (this.lineFarthest != null) {
            this.lineFarthest.remove();
        }

	for (let i = 0; i < this.v1Lines.length; i++) {
	    this.v1Lines[i].remove();
	}
	for (let i = 0; i < this.allLines.length; i++) {
	    this.allLines[i].remove();
	}
    },
    
    idOfAction(action) {
        return action.label;
    }
};
