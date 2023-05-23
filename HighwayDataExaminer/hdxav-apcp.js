//
// HDX All Pairs Closest Points AV
//
// METAL Project
//
// Primary Authors: Mark Verra
// Version: Summer 2022
//
//

const hdxAPClosestPointAV = {
    // entries for list of AVs
    value: "apcp",
    name: "All Points Closest Point",
    description: "Search for the closest other vertex (waypoint) to each vertex.",

    // This variable stores the array of corresponding indices for
    // which vertices are closest to which other vertices.  For
    // example, if the closest vertex to vertex #0 is vertex #10, then
    // closestVertices[0] will be set to "10".
    closestVertices: Array(waypoints.length).fill(0),

    // The variable "v" is the index of the vertex we are currently
    // checking in the inner loop.  The variable "vClosest" stores the
    // index of the vertex which is closest to the vertex we are
    // currently checking using the outLoop variable, or the outer
    // loop's index.
    v: 0,
    vClosest: -1,
    
    // The variable "d" is the current distance between the two
    // vertices we are in the process of checking.  The variable
    // "dClosest" is the distance between the two closest points we
    // have found so far during each traversal through the array of
    // vertices.
    d: 0,
    dClosest: Number.MAX_SAFE_INTEGER,
    
    // vert1 stores the waypoint object at index outLoop.  vert2
    // stores the waypoint object at index inLoop.
    vert1: null,
    vert2: null,

    // Outer Loop index variable
    outLoop: -1,
    
    // Inner Loop index variable
    inLoop: -1,

    // This variable stores the polylines that will be drawn showing
    // all of the points/vertices closest point on the map.
    highlightPoly: [],

    // This variable stores a reference to the polyline we are drawing
    // between the two current vertices being visited.
    currentPoly: null,

    // This variable stores a reference to the polyline representing
    // the closest pair of vertices found so far during each iteration
    // of the outer loop.
    leaderPoly: null,

    // This variable stores the string used for displaying vertex
    // pairs discovered thus far and uses it to update on of the AV
    // Control Entries on the control panel.
    discoveredPairs: null,

    avActions: [
        {
            label: "START",
            comment: "Initialize all points closest point variables",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.nextAction = "v1ForLoopTop";
                thisAV.outLoop = -1;
                thisAV.inLoop = -1;
                
                thisAV.v = 0;
                thisAV.vClosest = -1;
    
                thisAV.d = 0;
                thisAV.dClosest = Number.MAX_SAFE_INTEGER;

                thisAV.discoveredPairs = null;

                thisAV.leaderExists = false;

                thisAV.discoveredPairs = '<table class="pathTable">' + 
                '<thead><tr style="text-align:center" id="pathHeaders">' +
                '<th>From</th><th>To</th><th>Distance</th></tr></thead><tbody>';
                updateAVControlEntry("closestPairs", thisAV.discoveredPairs + '</tbody></table>');
                hdxAV.iterationDone = true;
                
            },
            logMessage: function (thisAV) {
                return "Initialize points array and other variables"
            }
        },

        {
            label: "v1ForLoopTop",
            comment: "Start of for-loop which traverses array of vertices",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.outLoop++;
                updateAVControlEntry("v1Visiting", "v<sub>1</sub>: " + thisAV.outLoop);
                
                if (thisAV.outLoop < waypoints.length) {
		    hdxAV.nextAction = "resetClosest";
		}
                else {
		    hdxAV.nextAction = "cleanup";
		}
                thisAV.inLoop = -1;
            },
            logMessage: function (thisAV) {
                return "Start of iteration #" + thisAV.outLoop + " of first for-loop";
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.VERTEX,
		    label: "Stop at v<sub>1</sub> ="
		},
		f: function(thisAV, val) {
		    return thisAV.outLoop == val;
		}		
            }
        },

        {
            label: "resetClosest",
            comment: "Reset v<sub>closest</sub> and d<sub>closest</sub> to their default values",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.nextAction = "v2ForLoopTop";
                thisAV.vClosest = -1;
                thisAV.dClosest = Number.MAX_SAFE_INTEGER;
            },
            logMessage: function (thisAV) {
                return "Reset variables to default state for new iteration";
            }
        },

        {
            label: "v2ForLoopTop",
            comment: "Looping through array of vertices to determine which vertex" +
             " from the first loop pairs with second loop vertex",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.inLoop++;
                
                updateAVControlEntry("v2Visiting", "v<sub>2</sub>: " + thisAV.inLoop);
                
                if (thisAV.inLoop < waypoints.length) {
                    thisAV.v = thisAV.inLoop
                    thisAV.vert1 = waypoints[thisAV.outLoop];
                    thisAV.vert2 = waypoints[thisAV.inLoop];
                    updateAVControlEntry("checkingDistance", "Distance: " + thisAV.d.toFixed(3));
                    updateMarkerAndTable(thisAV.outLoop, visualSettings.v1, 30, false);
                    updateMarkerAndTable(thisAV.inLoop, visualSettings.v2, 30, false);
                    thisAV.currentPoly = L.polyline([[thisAV.vert1.lat, thisAV.vert1.lon], [thisAV.vert2.lat, thisAV.vert2.lon]],
                        {
                            color: visualSettings.visiting.color,
                            opacity: 0.6,
                            weight: 4
                        });
                    thisAV.currentPoly.addTo(map);
                    
                    hdxAV.nextAction = "checkEquals";
                }
		else if (thisAV.inLoop >= waypoints.length) {
		    hdxAV.nextAction = "setPair";
		}
		else {
		    hdxAV.nextAction = "setPair";
		}
                hdxAV.iterationDone = true;
            },
            logMessage: function (thisAV) {
                return "Start of iteration #" + thisAV.inLoop + " of second for-loop";
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.VERTEX,
		    label: "Stop at v<sub>2</sub> ="
		},
		f: function(thisAV, val) {
		    return thisAV.inLoop == val;
		}		
            }
        },

        {
            label: "checkEquals",
            comment: "Check that we are not visiting the same vertex in both for loops",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.d = convertToCurrentUnits(
                           distanceInMiles(waypoints[thisAV.outLoop].lat,
                                           waypoints[thisAV.outLoop].lon,
                                           waypoints[thisAV.inLoop].lat,
                                           waypoints[thisAV.inLoop].lon));
                if (thisAV.outLoop != thisAV.inLoop) {
                    hdxAV.nextAction = "ifClosest";
                }
		else if (!thisAV.inLoop < waypoints.length) {
                    hdxAV.nextAction = "v2ForLoopTop"
                }
		else {
                    hdxAV.nextAction = "v2ForLoopTop";
                }
                
            },
            logMessage: function (thisAV) {
                return "Checking that outer loop index does not equal inner loop index";
            }
        },

        {
            label: "ifClosest",
            comment: "Set distance var equal to the distance between v<sub>1</sub> and v<sub>2</sub>, then check" +
            " to see if this new distance should become the smallest distance between the two vertices.",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                // CASE 1: We have found a new leader, go to the setClosest state.
                if (thisAV.d < thisAV.dClosest) {
                    thisAV.dClosest = thisAV.d;
                    hdxAV.nextAction = "setClosest";
                
                // CASE 2: The current vertex we are checking
                // shouldn't become the new leader, discard it as a
                // candidate for leader.
                }
		else {
                    thisAV.currentPoly.remove();
                    
                    updateMarkerAndTable(thisAV.v, visualSettings.discarded, 5, false);
                    hdxAV.nextAction = "v2ForLoopTop";
                    hdxAV.iterationDone = true;
                }
            },
            logMessage: function (thisAV) {
                return "Setting d equal to the distance between vertex #" + thisAV.outLoop + " and vertex #" + thisAV.inLoop;
            }
        },

        {
            label: "setClosest",
            comment: "Set vertex outLoop's closest vertex to the closest vertex found so far, and set " +
            "and set the closest distance found so far to the distance between vertex outLoop and inLoop",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                // CASE 1: We do not have a leader yet in terms of a
                // vertex that is closest to vertex # thisAV.outLoop
                if (thisAV.vClosest == -1) {
                    thisAV.currentPoly.remove();

                    // This passes a reference to the Polyline to the leaderPoly variable, and sets the style to "leader" style.
                    thisAV.leaderPoly = thisAV.currentPoly;
                    thisAV.leaderPoly.setStyle({
                        color: visualSettings.leader.color,
                        opacity: 0.6,
                        weight: 4
                    }); 
                    thisAV.leaderPoly.addTo(map);
                    thisAV.currentPoly = null;
                    updateAVControlEntry("closeLeader", "Closest: [" + thisAV.outLoop + ", " + thisAV.inLoop + "], " 
                    + "d<sub>closest</sub>: " + thisAV.dClosest.toFixed(3));
                    
                // CASE 2: We already have a leader, however, we have
                // found a new leader in the previous state
                // "ifClosest"
                }
		else {
                    updateMarkerAndTable(thisAV.vClosest, visualSettings.discarded, 5, false);
		    
                    updateMarkerAndTable(thisAV.v, visualSettings.leader, 5, false);

                    thisAV.currentPoly.remove();
                    thisAV.leaderPoly.remove();

                    thisAV.leaderPoly = thisAV.currentPoly;
                    thisAV.leaderPoly.setStyle({
                        color: visualSettings.leader.color,
                        opacity: 0.6,
                        weight: 4
                    })

                    thisAV.leaderPoly.addTo(map);
                    thisAV.currentPoly = null;

                    updateMarkerAndTable(thisAV.vClosest, visualSettings.discarded, 5, false);
                    updateMarkerAndTable(thisAV.inLoop, visualSettings.leader, 5, false);
                    
                    updateAVControlEntry("closeLeader", "Closest: [" + thisAV.outLoop + ", " + thisAV.inLoop + "], " 
                    + "d<sub>closest</sub>: " + thisAV.dClosest.toFixed(3));
                }
                thisAV.vClosest = thisAV.inLoop;
                thisAV.closestVertices[thisAV.outLoop] = thisAV.inLoop;
                thisAV.dClosest = thisAV.d;
                hdxAV.nextAction = "v2ForLoopTop";
                
            },
            logMessage: function (thisAV) {
                return "Setting v<sub>closest</sub> equal to vertex #" + thisAV.inLoop + " and " +
                "setting d<sub>closest</sub> equal to d";
            }
        },

        {
            label: "setPair",
            comment: "Set index of closest array to index of closest vertex",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.discovered)
                thisAV.closestVertices[thisAV.outLoop] = thisAV.vClosest;
                
                thisAV.discoveredPairs += '<tr><td>v<sub>1</sub>: ' + thisAV.outLoop + '</td><td>v<sub>2</sub>: ' +
                 thisAV.vClosest + '</td><td>' + thisAV.dClosest.toFixed(3) + '</td>';
                
                updateAVControlEntry("closestPairs", thisAV.discoveredPairs + '</tbody></table>');
                for (let i = 0; i < waypoints.length; i++)
                {
                    updateMarkerAndTable(i, visualSettings.undiscovered, 0, false);
                }

                thisAV.highlightPoly.push(thisAV.leaderPoly);
                hdxAV.nextAction = "v1ForLoopTop";
                
            },
            logMessage: function (thisAV) {
                return "Set closest[" + thisAV.outLoop + "] to vertex #" + thisAV.inLoop + " to denote " +
                "that the closest vertex to vertex #" + thisAV.outLoop + " is vertex #" + thisAV.inLoop;
            }
        },

        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function (thisAV) {
                
                for (let i = 0; i < thisAV.highlightPoly.length; i++) {
                    updateMarkerAndTable(i, visualSettings.leader, 0, false);
                    thisAV.highlightPoly[i].addTo(map);
                }

                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
            },
            logMessage: function (thisAV) {
                return "Cleanup and finalize visualization"
            }
        }
    ],

    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        
        // we want only vertices for this algorithm
        initWaypointsAndConnections(true, false, visualSettings.undiscovered);

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';

        //pseudocode for the start state
        this.code += `closestVertex &larr; []`;
    
        //pseudocode for the top of the for loop
        this.code += '</td></tr>' +
            pcEntry(0, 'for (v<sub>1</sub> &larr; 0 to |V| - 1)',"v1ForLoopTop");
        this.code += '</td></tr>' +
            pcEntry(1, 'v<sub>closest</sub> &larr; -1<br />' + pcIndent(2) +
            'd<sub>closest</sub> &larr; &infin;<br />', "resetClosest");
        this.code += '</td></tr>' +
            pcEntry(1, 'for (v2 &larr; 0 to |V| - 1)', "v2ForLoopTop");
        this.code += '</td></tr>' +
            pcEntry(2, 'if (v<sub>1</sub> &ne; v<sub>2</sub>)', "checkEquals");
        this.code += '</td></tr>' +
            pcEntry(3, 'd &larr; dist(v<sub>1</sub>, v<sub>2</sub>)<br />' +
            pcIndent(6) + 'if(d < d<sub>closest</sub>)<br />', "ifClosest");
        this.code += '</td></tr>' +
            pcEntry(4, 'v<sub>closest</sub> &larr; v<sub>2</sub> <br />' +
            pcIndent(8) + 'd<sub>closest</sub> &larr; d<br />', "setClosest");
        this.code += '</td></tr>' +
            pcEntry(1, 'closestVertex[v<sub>1</sub>] &larr; v<sub>closest</sub', "setPair");
    },
    
    setupUI() {
	const algDescription = document.getElementById("algDescription");
	algDescription.innerHTML = this.description;
	hdxAV.algStat.style.display = "";
	hdxAV.algStat.innerHTML = "Setting up";
	hdxAV.logMessageArr = [];
	hdxAV.logMessageArr.push("Setting up");
	
	addEntryToAVControlPanel("v1Visiting", visualSettings.v1);
	addEntryToAVControlPanel("v2Visiting", visualSettings.v2);
	addEntryToAVControlPanel("checkingDistance", visualSettings.visiting);
	addEntryToAVControlPanel("closeLeader", visualSettings.leader);
	addEntryToAVControlPanel("closestPairs", visualSettings.discovered);    
    },
    
    cleanupUI() {
	//remove all the polylines made
	for (let i = 0; i < this.highlightPoly.length; i++) {
            this.highlightPoly[i].remove();
	}
	this.highlightPoly = [];
    },

    idOfAction(action) {
	
	return action.label;
    }
};
