//
// HDX All Pairs Closest Points AV
//
// METAL Project
//
// Primary Authors: Mark Verra
// Version: Summer 2022
//
//

var hdxAPClosestPtsAV = {
    // entries for list of AVs
    value: "APClosestPts",
    name: "All Points Closest Pairs",
    description: "Search for the closest pair of vertices (waypoints).",

    // ***Most of my code and comments here will be based on my understanding of OOP from CS-225 in Java, 
    // please feel free to correct any misconceptions or incorrect assumptions I have made!***

    // points is the array of waypoint objects that are read from a TMG file
    // points: [],
    //numVertices: waypoints.length,

    // closest is the array of indexes which correspond to the closest points in the "points" array.
    closestVertices: Array(waypoints.length).fill(0),

    // the distance between the two closest points in the array of points.
    globalMinD: -1,

    v: 0,
    vClosest: -1,
    
    d: 0,
    dClosest: Number.MAX_SAFE_INTEGER,
    

    vert1: null,
    vert2: null,

    // Loop index variables
    outLoop: -1,
    inLoop: -1,

    boundingPoly: [],

    highlightPoly: [],

    currentPoly: null,

    leaderPoly: null,

    //leaderExists: false,


    avActions: [
        {
            label: "START",
            comment: "Initialize all points closest pairs variables",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.nextAction = "v1ForLoopTop";
                thisAV.outLoop = -1;
                thisAV.inLoop = -1;
                
                thisAV.v = 0;
                thisAV.vClosest = -1;
    
                thisAV.d = 0;
                thisAV.dClosest = Number.MAX_SAFE_INTEGER;

                thisAV.leaderExists = false;
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
                if(thisAV.outLoop < waypoints.length) hdxAV.nextAction = "resetClosest";
                else hdxAV.nextAction = "cleanup"
                thisAV.inLoop = -1;
            },
            logMessage: function (thisAV) {
                return "Start of iteration #" + thisAV.outLoop + " of first for-loop";
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
                console.log(thisAV.inLoop);
                //console.log();
                if(thisAV.inLoop < waypoints.length - 1) {
                    thisAV.v = thisAV.inLoop
                    thisAV.vert1 = waypoints[thisAV.outLoop];
                    thisAV.vert2 = waypoints[thisAV.inLoop];
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
                } else if (thisAV.inLoop >= waypoints.length) { hdxAV.nextAction = "setPair";
                } else { hdxAV.nextAction = "setPair"; }
                hdxAV.iterationDone = true;
            },
            logMessage: function (thisAV) {
                return "Start of iteration #" + thisAV.inLoop + " of second for-loop";
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
                if(thisAV.outLoop != thisAV.inLoop) {
                    hdxAV.nextAction = "ifClosest";
                } else if(!thisAV.inLoop < waypoints.length) {
                    hdxAV.nextAction = "v2ForLoopTop"
                } else {
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
                if(thisAV.d < thisAV.dClosest) hdxAV.nextAction = "setClosest";
                
                // CASE 2: The current vertex we are checking shouldn't become the new leader, discard it as a candidate for leader.
                else 
                {
                    // Removes the current Polyline between vert1 and vert2 from the map
                    thisAV.currentPoly.remove();
                    
                    // Updates the icon for vert2 to discarded status.
                    updateMarkerAndTable(thisAV.v, visualSettings.discarded, 5, false);
                    //updateMarkerAndTable(thisAV.d, visualSettings.discarded, 5, false);
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
                // CASE 1: We do not have a leader yet in terms of a vertex that is closest to vertex #thisAV.outLoop
                if(thisAV.vClosest == -1) {
                    // This removes the polyline between the vertices we're currently visiting
                    thisAV.currentPoly.remove();
                    //updateMarkerAndTable(thisAV.inLoop, visualSettings.leader, 5, false);

                    // This passes a reference to the Polyline to the leaderPoly variable, and sets the style to "leader" style.
                    thisAV.leaderPoly = thisAV.currentPoly;
                    thisAV.leaderPoly.setStyle({
                        color: visualSettings.leader.color,
                        opacity: 0.6,
                        weight: 4
                    });
                    // Adds the leader polyline to the map 
                    thisAV.leaderPoly.addTo(map);
                    thisAV.currentPoly = null;
                    
                // CASE 2: We already have a leader, however, we have found a new leader in the previous state "ifClosest"    
                } else {
                    // Sets the old leading vertex's icon to a hollow green circle rather than a big red one.
                    updateMarkerAndTable(thisAV.vClosest, visualSettings.discarded, 5, false);

                    // Sets the current leading vertex icon to a orange circle (leader style)
                    updateMarkerAndTable(thisAV.v, visualSettings.leader, 5, false);

                    // Remove the current and old(er) leader Polyline(s) from the map.
                    thisAV.currentPoly.remove();
                    thisAV.leaderPoly.remove();

                    // Pass the reference to the current existing Polyline object to the leaderPoly variable,
                    // and set the Polyline object's style attributes to the leader attributes.
                    thisAV.leaderPoly = thisAV.currentPoly;
                    thisAV.leaderPoly.setStyle({
                        color: visualSettings.leader.color,
                        opacity: 0.6,
                        weight: 4
                    })

                    // Add the newly leader-styled Polyline to the map screen and set the currentPoly reference to null.
                    thisAV.leaderPoly.addTo(map);
                    thisAV.currentPoly = null;

                    // Update the map icons such that the old leader waypoint icon is hollow and green,
                    // and set the new leader icon to the orange leader style settings.
                    updateMarkerAndTable(thisAV.vClosest, visualSettings.discarded, 5, false);
                    updateMarkerAndTable(thisAV.inLoop, visualSettings.leader, 5, false);
                    
                    //thisAV.LeaderPoly = thisAV.currentPoly;
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
                for(var i = 0; i < waypoints.length; i++)
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
                for(var i = 0; i < thisAV.closestVertices.length; i++)
                {
                    //thisAV.highlightPoly.push(L.polyline([[waypoints[i].lat, waypoints[i].lon], [waypoints[thisAV.closestVertices[i]].lat,
                    //waypoints[thisAV.closestVertices[i]].lon]],visualSettings.undiscovered));
                }
                
                for(var i = 0; i < thisAV.highlightPoly.length; i++){
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
        
        //we want only vertices for this algorithm
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
    var algDescription = document.getElementById("algDescription");
    algDescription.innerHTML = this.description;
    hdxAV.algStat.style.display = "";
    hdxAV.algStat.innerHTML = "Setting up";
    hdxAV.logMessageArr = [];
    hdxAV.logMessageArr.push("Setting up");


    //let newAO = 'Refinement Threshold <input type="number" id="refinement" min="2" max="' 
    //+ (waypoints.length) + '" value="3">';

    //newAO += `<br /><input id="squareBB" type="checkbox" name="Square Bounding Box"/>&nbsp;
    //Square Bounding Box<br />`;

    //hdxAV.algOptions.innerHTML = newAO;
    addEntryToAVControlPanel("v1visiting", visualSettings.v1);
    addEntryToAVControlPanel("v2visiting", visualSettings.v2);
    addEntryToAVControlPanel("checkingDistance", visualSettings.visiting);
    addEntryToAVControlPanel("closeLeader", visualSettings.leader);

    // ORIGINALS
    // addEntryToAVControlPanel("v1visiting", this.visualSettings.v1);
    // addEntryToAVControlPanel("v2visiting", this.visualSettings.v2);
    // addEntryToAVControlPanel("checkingDistance", visualSettings.visiting);
    // addEntryToAVControlPanel("closeLeader", visualSettings.leader);
   
},

cleanupUI() {
    //remove all the polylines made by the bounding box and the quadtree
    for (var i = 0; i < this.boundingPoly.length; i++) {
        this.boundingPoly[i].remove();
    }
    for(var i = 0; i < this.highlightPoly.length; i++){
        this.highlightPoly[i].remove();
    }
    this.boundingPoly = [];
    this.highlightPoly = [];
},

idOfAction(action) {
	
    return action.label;
},

//this was copied directly over from hdxorderingav.js with some slight modifications

setConditionalBreakpoints(name) {
    let max = waypoints.length-1;
    let temp = HDXCommonConditionalBreakpoints(name);
    if (temp != "No innerHTML") {
        return temp;
    }
    switch (name) {
        case "isLeaf":
            html = createInnerHTMLChoice("boolean","",
                                         "",
                                         "");
            return html;
            
        }
    return "No innerHTML";
}
};



function ClosestToAll() {
    this.closest = points.length;

}