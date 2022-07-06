//
// HDX Graph Traversal and Spanning Tree algorithm AVs
//
// Currently includes BFS, DFS, RFS, Dijkstra's algorithm, Prim's algorithm
//
// METAL Project
//
// Primary Author: Jim Teresco with contributions from many others
//

/* common functionality for graph traversals, Dijkstra's, and Prim's
   algorithms, which serves as a prototype for the actual selectable
   and executable AV objects defined below */

// an object used to track entries in the LDV (see below) and
// the table of places found
//
// vIndex is the vertex we are going to
// val is a number used as the priority for Dijkstra's (as a
//    cumulative distance) or Prim's (as an edge length) or
//    a sequence number for graph traversals (informational)
// connection is the edge number traversed to get there, and
//    is -1 for the "dummy" entry that starts a spanning
//    tree or graph traversal
// the source vertex is determined from the connection
function LDVEntry(vIndex, val, connection) {
    
    this.vIndex = vIndex;
    this.val = val;
    this.connection = connection;
    // compute the other vertex of the endpoint as we'll need
    // it in a couple places
    this.fromVIndex = -1;
    if (connection != -1) {
        if (graphEdges[connection].v1 == vIndex) {
            this.fromVIndex = graphEdges[connection].v2;
        }
        else {
            this.fromVIndex = graphEdges[connection].v1;
        }
    }   
    return this;
}

// function to display an LDVEntry object in HTML suitible for
// HDXLinear, set as the HDXLinear's elementHTMLCallback for
// traversal and spanning tree algorithms
// required function to display an LDV entry
function displayLDVItem(item, ldv) {
    
    let edgeLabel = "START";
    let edgeLabelFull = "START";
    let showFrom = "(none)";
    let showFromFull = "(none)";
    if (item.connection != -1) {
        edgeLabelFull = graphEdges[item.connection].label;
        edgeLabel = shortLabel(edgeLabelFull, ldv.maxLabelLength);
        showFrom = item.fromVIndex;
        showFromFull = "#" + item.fromVIndex + ":" +
            waypoints[item.fromVIndex].label;
    }
    return '<span custom-title="Edge #' + item.connection + " " + showFromFull +
        "&rarr; #" + item.vIndex + ":" + waypoints[item.vIndex].label +
        ", label: " + edgeLabelFull + ", value: " +
        item.val.toFixed(ldv.valPrecision) +
        '">' + showFrom + "&rarr;" + item.vIndex + "<br />" +
        edgeLabel + "<br />" + item.val.toFixed(ldv.valPrecision) +
        "</span>";
};


var hdxTraversalsSpanningAVCommon = {

    //keeps track of LDV length
    counter: 0,

    // entries for value, name, description, code will be in
    // AV-specific objects

    // algorithm-specific options to show in the algorithm options
    // control panel should be set by any algorithm that needs them
    // in this variable
    extraAlgOptions: "",
    
    // does the algorithm support finding all components?  if so,
    // the specific AV instance should set this variable to true
    supportFindAllComponents: false,
    
    // The header for the table of found places
    foundTableHeader: "MISSING",
    
    // if an entry in the table should have a column for an edge
    // length (as in Prim's) or cumulative distance (as in Dijkstra's)
    // this should be set to the column header
    distEntry: "",

    // list of vertices discovered but not yet added to the spanning
    // tree/forest being constructed
    //
    // it is a stack for DFS, a queue for BFS, a list that randomly
    // returns values for RFS, a PQ for Dijkstra's or Prim's.
    //
    // elements here are objects with fields vIndex for the index of
    // this vertex and connection for the Polyline connection followed
    // to get here (so it can be colored appropriately when the
    // element comes out)
    // this is the "list of discovered vertices" or "LDV"
    ldv: null,

    // arrays of booleans to indicate if we've added/discovered
    // vertices and edges
    // should these just be attached to the Waypoint and GraphEdge objects?
    // advantage of separate arrays is no additional cleanup needed
    addedV: [],
    discoveredV: [],
    discoveredE: [],

    // are we finding a path to end, all in a component, or all components?
    stoppingCondition: "StopAtEnd",

    // why did we stop?  Used in the cleanup action.
    stoppedBecause: "StillRunning",

    // when finding all, track the lists of vertices and edges that are
    // forming the current spanning tree
    componentVList: [],
    componentEList: [],

    // starting and ending vertices for the search, as specified by the UI
    startingVertex: -1,
    endingVertex: -1,
    
    // where to start the search for an unadded vertex that will be
    // the starting vertex for the next component
    startUnaddedVSearch: 0,

    // last place to come out of the LDV, currently "visiting"
    visiting: null,

    // neighbors to loop over when a new vertex is added to the tree
    // and the one being visited
    neighborsToLoop: [],
    nextNeighbor: -1,
    
    // some additional stats to maintain and display
    numVSpanningTree: 0,
    numESpanningTree: 0,
    numVUndiscovered: 0,
    numEUndiscovered: 0,
    numEDiscardedOnDiscovery: 0,
    numEDiscardedOnRemoval: 0,
    componentNum: 0,
    totalTreeCost: 0,

    // when finding a path from start to end, we need a list of tree
    // edges to traverse to find the path
    treeEdges: [],

    // color items specific to graph traversals/spanning trees
    visualSettings: {
        addedEarlier: {
            color: "orange",
            textColor: "black",
            scale: 4,
            name: "addedEarlier",
            value: 0
        },
        completedComponent: {
            color: "black",
            textColor: "white",
            scale: 3,
            name: "completedComponent",
            value: 0,
            weight: 3,
            opacity: 0.6
        },
        foundPath: {
            color: "rgb(255, 91, 184)",
            textColor: "white",
            scale: 4,
            name: "foundPath",
            weight: 4,
            opacity: 0.6
        }
    },

    // list of colors to fill in for completed components
    componentColors: [
        "darkCyan",
        "darkOrchid",
        "crimson",
        "sienna",
        "violet",
        "yellowGreen",
        "aqua",
        "dodgerblue",
        "lawngreen",
        "lime",
        "firebrick",
        "indianred",
        "indigo",
        "goldenrod"
    ],

    // actions to define the behavior of the common traversals
    // and spanning tree algorithms
    avActions: [
        {
            label: "START",
            comment: "initialize algorithm",
            code: function(thisAV) {

                highlightPseudocode(this.label, visualSettings.visiting);

                // initialize our added/discovered arrays
                thisAV.addedV = new Array(waypoints.length).fill(false);
                thisAV.discoveredV = new Array(waypoints.length).fill(false);
                thisAV.discoveredE = new Array(connections.length).fill(false);
                
                thisAV.numVSpanningTree = 0;
                thisAV.numESpanningTree = 0;
                thisAV.numVUndiscovered = waypoints.length;
                thisAV.numEUndiscovered = connections.length;
                thisAV.numEDiscardedOnDiscovery = 0;
                thisAV.numEDiscardedOnRemoval = 0;
                thisAV.componentNum = 0;
                thisAV.totalTreeCost = 0,

                // for the search for starting vertices for multiple
                // component traversals
                thisAV.startUnaddedVSearch = 0;
                
                // vertex index to start the traversal
                thisAV.startingVertex =
                    document.getElementById("startPoint").value;
                // if going to an end vertex, get that as well
                if (thisAV.stoppingCondition == "StopAtEnd") {
                    thisAV.endingVertex =
                        document.getElementById("endPoint").value;
                }

                // show end vertex
                if (thisAV.stoppingCondition == "StopAtEnd") {
                    updateMarkerAndTable(thisAV.endingVertex,
                                         visualSettings.endVertex,
                                         4, false);
                }
                
                // start vertex is "discovered"
                thisAV.discoveredV[thisAV.startingVertex] = true;
                thisAV.numVUndiscovered--;
                
                // mark as discovered, will be redrawn as starting vertex
                // color in nextStep
                updateMarkerAndTable(thisAV.startingVertex,
                                     visualSettings.discovered, 10, false);
                
                // add null edge to start vertex to LDV
                thisAV.ldv.add(new LDVEntry(thisAV.startingVertex, 0, -1));
                
                thisAV.updateControlEntries();
                
                if (thisAV.stoppingCondition == "StopAtEnd") {
                    hdxAV.nextAction = "checkEndAdded";
                }
                else if (thisAV.stoppingCondition == "FindReachable") {
                    hdxAV.nextAction = "checkComponentDone";
                }
                else {
                    thisAV.allComponentsDone = false;
                    hdxAV.nextAction = "checkAllComponentsDone";
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Initializing";
            }
        },
        {
            // this action happens only when finding all components
            label: "checkAllComponentsDone",
            comment: "Check if more components remain to be found",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                if (thisAV.allComponentsDone) {
                    thisAV.stoppedBecause = "FoundAllComponents";
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    hdxAV.nextAction = "checkComponentDone";
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Checking if all components have been found";
            }
        },
        {
            label: "checkComponentDone",
            comment: "Check if the current component is completely added",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // if the LDV is empty, we either need to move
                // on to set up for a new component (if finding
                // all) or are completely done if traversing
                // only the component containing the starting
                // vertex
                if (thisAV.ldv.isEmpty()) {
                    if (thisAV.stoppingCondition == "FindAll") {
                        hdxAV.nextAction = "finalizeComponent";
                    }
                    else {
                        thisAV.stoppedBecause = "FoundComponent";
                        hdxAV.nextAction = "cleanup";
                    }
                }
                else {
                    hdxAV.nextAction = "getPlaceFromLDV";
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Check if the " + thisAV.ldv.displayName + " is empty";
            }
        },
        {
            // this is the top of the main loop when looking for a
            // path to a specific end vertex
            label: "checkEndAdded",
            comment: "Check if we have added the end vertex",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                // check if end is visited, if so, cleanup, otherwise,
                // check that there are more values in the LDV to see
                // if we can continue
                if (thisAV.addedV[thisAV.endingVertex]) {
                    thisAV.stoppedBecause = "FoundPath";
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    hdxAV.nextAction = "checkLDVEmpty";
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Check if the end vertex has been added.";
            }
        },
        {
            label: "checkLDVEmpty",
            comment: "Check if the LDV is empty (in which case no path exists)",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // if empty, go to LDVEmpty to report failure,
                // otherwise carry on
                if (thisAV.ldv.isEmpty()) {
                    hdxAV.nextAction = "LDVEmpty";
                }
                else {
                    hdxAV.nextAction = "getPlaceFromLDV";
                }
            },
            logMessage: function(thisAV) {
                return "Check if the " + thisAV.ldv.displayName + " is empty";
            }
        },
        {
            label: "LDVEmpty",
            comment: "LDV is empty, no path exists",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.searchFailed);

                thisAV.stoppedBecause = "SearchFailed";
                hdxAV.nextAction = "cleanup";
            },
            logMessage: function(thisAV) {
                return "The " + thisAV.ldv.displayName +
                    " is empty, no path to end vertex exists.";
            }
        },
        {
            label: "getPlaceFromLDV",
            comment: "Get a place from the LDV",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // get next place from the LDV
                thisAV.visiting = thisAV.ldv.remove();
                updateAVControlEntry("visiting", "Visiting " +
                                     thisAV.formatLDVEntry(thisAV.visiting));
                // show on map as visiting color
                updateMarkerAndTable(thisAV.visiting.vIndex,
                                     visualSettings.visiting,
                                     10, false);
                if (thisAV.visiting.connection != -1) {
                    updatePolylineAndTable(thisAV.visiting.connection,
                                           visualSettings.visiting,
                                           false);
                }
                
                hdxAV.nextAction = "checkAdded";
            },
            logMessage: function(thisAV) {
                return "Removed " +
                    thisAV.formatLDVEntry(thisAV.visiting) + " from " +
                    thisAV.ldv.displayName;
            },
            currentVariable: function(thisAV, whatToDo) {
		if (thisAV.visiting == null) {
		    // we haven't yet removed any value from the LDV, so
		    // it would not be a break
		    return "-1 -1";
		}
                return thisAV.visiting.fromVIndex + " " + thisAV.visiting.vIndex;
            }
        },
        {
            label: "checkAdded",
            comment: "Check if the place being visited was previously added",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                if (thisAV.addedV[thisAV.visiting.vIndex]) {
                    // already in the tree, discard "on removal"
                    hdxAV.nextAction = "wasAdded";
                }
                else {
                    hdxAV.nextAction = "wasNotAdded";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if #" + thisAV.visiting.vIndex +
                    " was previously added";
            },
            currentVariable: function(thisAV, whatToDo) {
                return thisAV.addedV[thisAV.visiting.vIndex];
            }
        },
        {
            label: "wasAdded",
            comment: "Place being visited already added, so discard",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.discarded);

                thisAV.numEDiscardedOnRemoval++;

                // check if this vertex is still in the LDV, will be
                // discarded or added later
                if (thisAV.visiting.vIndex == thisAV.startingVertex) {
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         visualSettings.startVertex,
                                         4, false);
                }
                else if (thisAV.visiting.vIndex == thisAV.endingVertex) {
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         visualSettings.endVertex,
                                         4, false);
                }
                else if (thisAV.ldv.containsFieldMatching("vIndex", thisAV.visiting.vIndex)) {
                    // not there anymore, indicated this as
                    // visitedEarlier, and will be discarded or marked
                    // as discoveredEarlier on the next iteration
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         thisAV.visualSettings.addedEarlier,
                                         4, false);
                }
                else {
                    // still to be seen again, so mark is as discovered on
                    // removal
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         visualSettings.discarded,
                                         5, false);
                }
            
                
                // in either case here, the edge that got us here is not
                // part of the ultimate spanning tree, so it should be the
                // "discardedOnRemoval" color
                if (thisAV.visiting.connection != -1) {
                    updatePolylineAndTable(thisAV.visiting.connection,
                                           visualSettings.discarded,
                                           false);
                    
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         visualSettings.discarded,
                                         5, false);
                }

                thisAV.updateControlEntries();

                // continue at the top of the appropriate loop
                if (thisAV.stoppingCondition == "StopAtEnd") {
                    hdxAV.nextAction = "checkEndAdded";
                }
                else {
                    hdxAV.nextAction = "checkComponentDone";
                }
            },
            logMessage: function(thisAV) {
                return "Discarding " +
                    thisAV.formatLDVEntry(thisAV.visiting) + " on removal";
            }
        },
        {
            label: "wasNotAdded",
            comment: "Found path to new place, so add it to tree",
            code: function(thisAV) {
                highlightPseudocode(this.label,
                                    visualSettings.spanningTree);

                thisAV.addedV[thisAV.visiting.vIndex] = true;
                if (thisAV.visiting.vIndex == thisAV.startingVertex) {
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         visualSettings.startVertex,
                                         4, false);
                }
                else if (thisAV.visiting.vIndex == thisAV.endingVertex) {
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         visualSettings.endVertex,
                                         4, false);
                }
                else {
                    updateMarkerAndTable(thisAV.visiting.vIndex,
                                         visualSettings.spanningTree,
                                         10, false);
                }
                // was just discovered, now part of spanning tree
                thisAV.componentVList.push(thisAV.visiting.vIndex);
                thisAV.numVSpanningTree++;
            
                // we used the edge to get here, so let's mark it as such
                if (thisAV.visiting.connection != -1) {
                    thisAV.numESpanningTree++;
                    thisAV.totalTreeCost +=
                        convertToCurrentUnits(edgeLengthInMiles(graphEdges[thisAV.visiting.connection]));
                    thisAV.componentEList.push(thisAV.visiting.connection);
                    updatePolylineAndTable(thisAV.visiting.connection,
                                           visualSettings.spanningTree,
                                           false);
                }

                thisAV.addLDVEntryToFoundTable(thisAV.visiting,
                                               thisAV.ldv.maxLabelLength,
                                               thisAV.ldv.valPrecision,
                                               thisAV.numESpanningTree);

                // if we're finding a path from a start to an end, update
                // our array of tree edges to trace back through to find
                // paths
                if (thisAV.stoppingCondition == "StopAtEnd") {
                    thisAV.treeEdges.push(thisAV.visiting);
                }
                
                thisAV.updateControlEntries();
                hdxAV.nextAction = "checkNeighborsLoopTop";
            },
            logMessage: function(thisAV) {
                return "Adding " + thisAV.formatLDVEntry(thisAV.visiting) + " to tree";
            },
            currentVariable: function(thisAV, whatToDo) {
                //graphEdges[thisAV.visiting.connection] <- gives edge #
                //thisAV.visiting.vIndex <- vertex start
                if (whatToDo == "wasNotAdded1")
                {
                    return thisAV.visiting.connection;
                }
                else if (whatToDo == "wasNotAdded2") {
                    return thisAV.visiting.vIndex;
                }
                else{
                    console.log("Error Happened: wasNotAdded.currentVariable()");
                        return "Error happened";
                }
            }
        },
        {
            label: "checkNeighborsLoopTop",
            comment: "Top of loop over edges from vertex just added",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // build list of neighbors to visit
                let neighbors = getAdjacentPoints(thisAV.visiting.vIndex);
                for (var i = 0; i < neighbors.length; i++) {
                    let connection = waypoints[thisAV.visiting.vIndex].edgeList[i].edgeListIndex;
                    // add to list of neighbors unless it's where we just
                    // came from
                    if (connection != thisAV.visiting.connection) {
                        thisAV.neighborsToLoop.push({
                            to: neighbors[i],
                            via: connection
                        });
                    }
                }

                // either go into the loop or jump over it if
                // there are no neighbors
                if (thisAV.neighborsToLoop.length > 0) {
                    hdxAV.nextAction = "checkNeighborsLoopIf";
                }
                else if (thisAV.stoppingCondition == "StopAtEnd") {
                    hdxAV.nextAction = "checkEndAdded";
                }
                else {
                    hdxAV.nextAction = "checkComponentDone";
                }
            },
            logMessage: function(thisAV) {
                if (thisAV.neighborsToLoop.length > 0) {
                    return "Looping over " + thisAV.neighborsToLoop.length +
                        " neighbors";
                }
                else {
                    return "No neighbors to loop over";
                }
            }
        },
        {
            label: "checkNeighborsLoopIf",
            comment: "Check the next neighbor of an added vertex",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // grab the next neighbor and check if it's in the
                // tree already
                thisAV.nextNeighbor = thisAV.neighborsToLoop.pop();

                if (thisAV.addedV[thisAV.nextNeighbor.to]) {
                    hdxAV.nextAction = "checkNeighborsLoopIfTrue";
                }
                else {
                    hdxAV.nextAction = "checkNeighborsLoopIfFalse";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if #" + thisAV.nextNeighbor.to +
                    " is in the tree";
            }
        },
        {
            label: "checkNeighborsLoopIfTrue",
            comment: "Neighbor already visited, discard on discovery",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.discardedOnDiscovery);
                thisAV.numEDiscardedOnDiscovery++;
                if (!thisAV.discoveredE[thisAV.nextNeighbor.via]) {
                        thisAV.numEUndiscovered--;
                        thisAV.discoveredE[thisAV.nextNeighbor.via] = true;
                    }
                    updatePolylineAndTable(thisAV.nextNeighbor.via,
                                           visualSettings.discardedOnDiscovery,
                                           false);

                thisAV.updateControlEntries();
                
                // either go back to the top of the loop or jump over it if
                // there are no more neighbors
                if (thisAV.neighborsToLoop.length > 0) {
                    hdxAV.nextAction = "checkNeighborsLoopIf";
                }
                else if (thisAV.stoppingCondition == "StopAtEnd") {
                    hdxAV.nextAction = "checkEndAdded";
                }
                else {
                    hdxAV.nextAction = "checkComponentDone";
                }
            },
            logMessage: function(thisAV) {
                return "#" + thisAV.nextNeighbor.to + " via " +
                    graphEdges[thisAV.nextNeighbor.via].label +
                    " already visited, discarding on discovery";
            }
        },
        {
            label: "checkNeighborsLoopIfFalse",
            comment: "Neighbor not yet visited, add to LDV",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.discovered);

                // not been here, we've discovered somewhere new
                // possibly discovered a new vertex and
                // definitely discovered a new edge
                if (!thisAV.discoveredV[thisAV.nextNeighbor.to]) {
                        thisAV.numVUndiscovered--;
                        thisAV.discoveredV[thisAV.nextNeighbor.to] = true;
                }
                thisAV.numEUndiscovered--;
                thisAV.discoveredE[thisAV.nextNeighbor.via] = true;
                thisAV.ldv.add(new LDVEntry(thisAV.nextNeighbor.to,
                                            thisAV.valForLDVEntry(thisAV.visiting, thisAV.nextNeighbor),
                                            thisAV.nextNeighbor.via));

                // keep ending vertex color if it's the end
                if (thisAV.endingVertex == thisAV.nextNeighbor.to) {
                    updateMarkerAndTable(thisAV.nextNeighbor.to,
                                         visualSettings.endVertex,
                                         4, false);
                }
                else {
                    updateMarkerAndTable(thisAV.nextNeighbor.to,
                                         visualSettings.discovered,
                                         5, false);
                }
                // also color the edge we followed to get to this
                // neighbor as the same color to indicate it's a candidate
                // edge followed to find a current discovered but
                // unvisited vertex
                if (thisAV.nextNeighbor.via != -1) {
                    updatePolylineAndTable(thisAV.nextNeighbor.via,
                                           visualSettings.discovered,
                                           false);
                }
                else {
                    console.log("Unexpected -1 connection");
                }
                
                thisAV.updateControlEntries();

                // either go back to the top of the loop or jump over it if
                // there are no more neighbors
                if (thisAV.neighborsToLoop.length > 0) {
                    hdxAV.nextAction = "checkNeighborsLoopIf";
                }
                else if (thisAV.stoppingCondition == "StopAtEnd") {
                    hdxAV.nextAction = "checkEndAdded";
                }
                else {
                    hdxAV.nextAction = "checkComponentDone";
                }
            },
            logMessage: function(thisAV) {
                return "#" + thisAV.nextNeighbor.to + " via " +
                    graphEdges[thisAV.nextNeighbor.via].label +
                    " added to " + thisAV.ldv.displayName;
            },
            currentVariable: function(thisAV, whatToDo) {
                return thisAV.nextNeighbor.to + " " + thisAV.nextNeighbor.via;
            }
        },
        {
            label: "finalizeComponent",
            comment: "Finalize completed component",
            code: function(thisAV) {

                // we'll be using the "completedComponent"  visualSettings
                // object to highlight the component, just need to set its
                // color to the one for the component number first

                let vs = {
                    textColor: "white",
                    scale: 3,
                    name: "completedComponent" + thisAV.componentNum,
                    value: 0,
                    weight: 3,
                    opacity: 0.6
                };
                
                if (thisAV.componentNum < thisAV.componentColors.length) {
                    vs.color = thisAV.componentColors[thisAV.componentNum];
                }
                else {
                    // out of pre-defined colors, so generate a random one
                    // credit https://www.paulirish.com/2009/random-hex-color-code-snippets/
                    vs.color = '#'+Math.floor(Math.random()*16777215).toString(16);
                }

                highlightPseudocode(this.label, vs);

                // color all vertices and edges in this complete component color
                for (var i = 0; i < thisAV.componentVList.length; i++) {
                    updateMarkerAndTable(thisAV.componentVList[i], vs, false);
                }
                for (var i = 0; i < thisAV.componentEList.length; i++) {
                    updatePolylineAndTable(thisAV.componentEList[i], vs, false);
                }
                
                hdxAV.nextAction = "checkAnyUnadded";
            },
            logMessage: function(thisAV) {
                return "Finalized component " + thisAV.componentNum + " with " +
                    thisAV.componentVList.length + " vertices, " +
                    thisAV.componentEList.length + " edges.";
                    
            }
        },
        {
            label: "checkAnyUnadded",
            comment: "Check if there are more vertices not yet in the forest",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                if (waypoints.length != thisAV.numVSpanningTree) {
                    hdxAV.nextAction = "startNewComponent";
                }
                else {
                    hdxAV.nextAction = "doneToTrue";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if all vertices have been added to a tree";
            }
        },
        {
            label: "startNewComponent",
            comment: "Start work on the next connected component",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // clear components
                thisAV.componentVList = [];
                thisAV.componentEList = [];

                // increment to next component
                thisAV.componentNum++;

                // select a starting vertex for the next component
                while (thisAV.addedV[thisAV.startUnaddedVSearch]) {
                    thisAV.startUnaddedVSearch++;
                }

                // start up new component at this vertex
                thisAV.discoveredV[thisAV.startUnaddedVSearch] = true;
                thisAV.numVUndiscovered--;
                
                updateMarkerAndTable(thisAV.startUnaddedVSearch,
                                     visualSettings.discovered, 10, false);
                
                thisAV.ldv.add(new LDVEntry(thisAV.startUnaddedVSearch, 0, -1));

                thisAV.updateControlEntries();

                hdxAV.iterationDone = true;
                hdxAV.nextAction = "checkAllComponentsDone";
            },
            logMessage: function(thisAV) {
                return "Starting component " + thisAV.componentNum +
                    " with vertex " + thisAV.startUnaddedVSearch;
            }
        },
        {
            label: "doneToTrue",
            comment: "All vertices added, so no more components",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.allComponentsDone = true;
                hdxAV.nextAction = "checkAllComponentsDone";
            },
            logMessage: function(thisAV) {
                return "All components found, setting done flag to true";
            }
        },
        {
            label: "cleanup",
            comment: "Clean up and finalize visualization",
            code: function(thisAV) {
                
                // if we found a path start to end, we replace the
                // full table of found places with just the path found
                if (thisAV.stoppedBecause == "FoundPath") {
                    // build the path we have found from end to start, showing
                    // each on the map and in the tables
                    let place = thisAV.endingVertex;
                    let plIndex = thisAV.treeEdges.length - 1;
                    let hops = 0;
                    let distance = 0.0;
                    // work our way back up the table from vertex to vertex
                    // along the path from the end back to the start
                    while (place != thisAV.startingVertex) {
                        let treeEdge = thisAV.treeEdges[plIndex];
                        while (place != treeEdge.vIndex) {
                            // hide line, it's not part of the path
                            if (place != thisAV.endingVertex) {
                                let tr = document.getElementById("foundPaths" + plIndex);
                                if (tr != null) {
                                    tr.style.display = "none";
                                }
                            }
                            plIndex--;
                            treeEdge = thisAV.treeEdges[plIndex];
                        }

                        hops++;
                        distance += convertToCurrentUnits(edgeLengthInMiles(graphEdges[treeEdge.connection]));
                        // we are at the next place on the path, update vertex
                        updateMarkerAndTable(place,
                                             thisAV.visualSettings.foundPath,
                                             5, false);
                        // and update edge to get here
                        updatePolylineAndTable(treeEdge.connection,
                                               thisAV.visualSettings.foundPath,
                                               false);
                        
                        // update place to the previous in the path
                        plIndex--;
                        place = treeEdge.fromVIndex;
                    }
                    updateAVControlVisualSettings("found",
                                                  thisAV.visualSettings.foundPath);
                    document.getElementById("foundEntriesCount").innerHTML = "";
                    thisAV.foundLabel.innerHTML = "Path found, distance " +
                        parseFloat(distance).toFixed(3) + " with " +
                        hops + " hops:";
                }
                
                else {
                    document.getElementById("totalTreeCost").innerHTML =
                        "Total cost: " + 
                        thisAV.totalTreeCost.toFixed(3);
                }
                
                updateAVControlEntry("visiting", "");
                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                if (thisAV.stoppedBecause == "SearchFailed") {
                    return "No path found from #" + thisAV.startingVertex +
                        " " + waypoints[thisAV.startingVertex].label + " to #" +
                        thisAV.endingVertex + " " +
                        waypoints[thisAV.endingVertex].label;
                }
                else if (thisAV.stoppedBecause == "FoundPath") {
                    return "Found path from #" + thisAV.startingVertex +
                        " " + waypoints[thisAV.startingVertex].label + " to #" +
                        thisAV.endingVertex + " " +
                        waypoints[thisAV.endingVertex].label;
                }
                else if (thisAV.stoppedBecause == "FoundComponent") {
                    return "Found all paths from #" + thisAV.startingVertex +
                        " " + waypoints[thisAV.startingVertex].label;
                }
                else if (thisAV.stoppedBecause == "FoundAllComponents") {
                    if (thisAV.componentNum == 0) {
                        return "Found 1 component";
                    }
                    return "Found all " + (thisAV.componentNum+1) +
                        " components";
                }
                else {
                    return "There should be no other reasons for stopping...";
                }
            }
        }
    ],

    updateControlEntries() {
        updateAVControlEntry("undiscovered", "Undiscovered: " +
                             this.numVUndiscovered + " V, " +
                             this.numEUndiscovered + " E");
        let label;
        let componentCount = "";
        if (this.stoppingCondition == "FindAll") {
            label = "Spanning Forest: ";
            componentCount = ", " + (this.componentNum+1) + " component";
            if (this.componentNum > 0) {
                componentCount += "s";
            }
        }
        else {
            label = "Spanning Tree: "
        }
        updateAVControlEntry("currentSpanningTree", label +
                             this.numVSpanningTree + " V, " +
                             this.numESpanningTree + " E" + componentCount);
        updateAVControlEntry("discardedOnDiscovery", "Discarded on discovery: " +
                             this.numEDiscardedOnDiscovery + " E");
        updateAVControlEntry("discardedOnRemoval", "Discarded on removal: " +
                             this.numEDiscardedOnRemoval + " E");
    },

    // format an LDV entry for addition to the found table
    addLDVEntryToFoundTable(item, maxLabelLength, precision, count) {

        let newtr = document.createElement("tr");
        let edgeLabel;
        let fullEdgeLabel;
        let fromLabel;
        let fullFromLabel;
        let vLabel = shortLabel(waypoints[item.vIndex].label, 10);
        if (item.connection == -1) {
            edgeLabel = "(START)";
            fullEdgeLabel = "(START)";
            fromLabel = "";
            fullFrom = "";
        }
        else {
            fullEdgeLabel = graphEdges[item.connection].label;
            edgeLabel = shortLabel(fullEdgeLabel, 10);
            fromLabel = shortLabel(waypoints[item.fromVIndex].label, 10);
            fullFrom = "From #" + item.fromVIndex + ":" +
                waypoints[item.fromVIndex].label;
        }

        // mouseover title
        newtr.setAttribute("custom-title",
                           "Path to #" + item.vIndex + ":" +
                           waypoints[item.vIndex].label + ", " +
                           this.distEntry + ": " +
                           item.val.toFixed(precision) + ", " + fullFrom +
                           ", via " + fullEdgeLabel);

        // id to show shortest paths later
        newtr.setAttribute("id", "foundPaths" + count);
        
        // actual table row to display
        newtr.innerHTML = 
            '<td>' + vLabel + '</td>' +
            '<td>' + item.val.toFixed(precision) + '</td>' +
            '<td>' + fromLabel + '</td>' +
            '<td>' + edgeLabel + '</td>';
        
        this.foundTBody.appendChild(newtr);
        document.getElementById("foundEntriesCount").innerHTML =
            this.numESpanningTree;      
    },

    // format an LDV entry for display in a log message
    formatLDVEntry(item) {

        let vIndex = item.vIndex;
        let edgeLabel;
        if (item.connection == -1) {
            edgeLabel = ", the starting vertex";
        }
        else {
            edgeLabel = " found via " +
                graphEdges[item.connection].label;
        }
        return "#" + vIndex + " " + waypoints[vIndex].label + edgeLabel;
    },
    
    // required prepToStart function, here do things common to all
    // traversals/spanning algorithms
    prepToStart() {

        hdxAV.algStat.innerHTML = "Initializing";

        // show waypoints, show connections
        initWaypointsAndConnections(true, true,
                                    visualSettings.undiscovered);

        // each algorithm will be required to provide a function
        // to create its LDV
        this.ldv = this.createLDV();

        // set the comparator if there is one (for priority queue LDVs)
        if (this.hasOwnProperty("comparator")) {
            this.ldv.setComparator(this.comparator);
        }

        // add LDV to display element and set its callback to
        // display an individual entry
        // note that this means each algorithm must provide a function
        // named displayLDVItem that takes an LDV entry as its
        // parameter
        this.ldv.setDisplay(getAVControlEntryDocumentElement("discovered"),
                            displayLDVItem);

        // update stopping condition
        let selector = document.getElementById("stoppingCondition");
        this.stoppingCondition =
            selector.options[selector.selectedIndex].value;
        
        // pseudocode will depend on specific options chosen, so set up
        // the code field based on the options in use
        this.setupCode();
    },

    // set up common UI components for traversals/spanning trees
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");
        let newAO =
            buildWaypointSelector("startPoint", "Start Vertex", 0) +
            "<br />" +
            buildWaypointSelector("endPoint", "End Vertex", 1) + `
<br />
<select id="stoppingCondition" onchange="stoppingConditionChanged();">
<option value="StopAtEnd" selected>Stop When End Vertex Reached</option>
<option value="FindReachable">Find All Vertices Reachable from Start</option>
`;
        if (this.supportFindAllComponents) {
            newAO += '<option value="FindAll">Find All Connected Components</option>';
        }
        newAO += '</select>';
        hdxAV.algOptions.innerHTML = newAO + this.extraAlgOptions;
        addEntryToAVControlPanel("visiting", visualSettings.visiting);
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered);
        addEntryToAVControlPanel("discovered", visualSettings.discovered);
        addEntryToAVControlPanel("currentSpanningTree", visualSettings.spanningTree);
        addEntryToAVControlPanel("discardedOnDiscovery", visualSettings.discardedOnDiscovery);
        addEntryToAVControlPanel("discardedOnRemoval", visualSettings.discarded);
        addEntryToAVControlPanel("found", visualSettings.spanningTree);
        let foundEntry = '<span id="foundEntriesCount">0</span>' +
            ' <span id="foundTableLabel">' +
            this.foundTableHeader + '</span><br />' +
            '<span id="totalTreeCost"></span>' +
            '<table class="pathTable"><thead>' +
            '<tr style="text-align:center" id="pathHeaders"><th>Place</th>';
        if (this.distEntry != "") {
            foundEntry += '<th>' + this.distEntry + '</th>';
        }
        foundEntry += '<th>Arrive From</th><th>Via</th></tr>' +
            '</thead><tbody id="foundEntries"></tbody></table>';
        updateAVControlEntry("found", foundEntry);
        this.foundTBody = document.getElementById("foundEntries");
        this.foundLabel = document.getElementById("foundTableLabel");
    },

    // clean up common UI components
    cleanupUI() {

    },
    
    idOfAction(action) {
	
        return action.label;
    },
    
    setConditionalBreakpoints(name) {
	
        let max = waypoints.length-1;
        let temp = HDXCommonConditionalBreakpoints(name);
        if (temp != "No innerHTML") {
            return temp;
        }
        else {
            switch(name) {
            case "getPlaceFromLDV":
            case "checkNeighborsLoopIfFalse":
                html = buildWaypointSelector2("generic3",
					      "Please select the vertex of the LDV <br \>(either starting or to) to stop at: ");
                return html;
            case "wasNotAdded":
                html = buildWaypointSelector2("wasNotAdded1",
					      "Please select the vertex of the connection <br \> to stop at: ");
                html += '<br \>';
                html += buildWaypointSelector2("wasNotAdded2",
					       "Please select the starting vertex <br \> to stop at: ");
                return html;
            case "checkAdded":
                html = createInnerHTMLChoice("boolean","checkAddedCV","Tree contains vertex",
					     "Vertex is missing from tree");
                return html;
		
            }
        }
        return "No innerHTML";
    },
    
    hasConditionalBreakpoints(name) {

        let answer = HDXHasCommonConditionalBreakpoints(name);
        if (answer) {
            return true;
        }
        else {
            switch (name) {
            case "wasNotAdded":    
            case "getPlaceFromLDV":
            case "checkNeighborsLoopIfFalse":
            case "checkNeighborsLoopIf":
            case "checkAdded":
                return true;
            }
        }
        return false;
    }
    
};

// event handler when stopping condition option selector changes
function stoppingConditionChanged() {

    let selector = document.getElementById("stoppingCondition");
    let endSelector = document.getElementById("endPoint");
    endSelector.disabled =
        selector.options[selector.selectedIndex].value != "StopAtEnd";
}

/* graph traversals based on hdxTraversalsSpanningAVCommon */

var hdxGraphTraversalsAV = Object.create(hdxTraversalsSpanningAVCommon);

// entries for the list of AVs
hdxGraphTraversalsAV.value = "traversals";
hdxGraphTraversalsAV.name = "Graph Traversals/Connected Components";
hdxGraphTraversalsAV.description = "Perform graph traversal using breadth-first, depth-first, or random-first traversals, with the option of iterating to find all connected components of the graph.";
hdxGraphTraversalsAV.foundTableHeader = "Edges in Spanning Tree/Forest";

// extra selector for traversal disciplines
hdxGraphTraversalsAV.extraAlgOptions = `<br />
Order: <select id="traversalDiscipline">
<option value="BFS">Breadth First</option>
<option value="DFS">Depth First</option>
<option value="RFS">Random</option>
</select>`;

hdxGraphTraversalsAV.distEntry = "Hops";

// required function to create an appropriate list of discovered vertices
hdxGraphTraversalsAV.createLDV = function() {
    
    let d = document.getElementById("traversalDiscipline");
    this.traversalDiscipline = d.options[d.selectedIndex].value;
    let ldv;
    if (this.traversalDiscipline == "BFS") {
        ldv = new HDXLinear(hdxLinearTypes.QUEUE,
                            "BFS Discovered Queue");
    }
    else if (this.traversalDiscipline == "DFS") {
        ldv = new HDXLinear(hdxLinearTypes.STACK,
                            "DFS Discovered Stack");
    }
    else {
        ldv= new HDXLinear(hdxLinearTypes.RANDOM,
                           "RFS Discovered List");
    }
    ldv.valPrecision = 0;  // whole numbers here
    return ldv;
};

// function to determine the next "val" field for a new LDV entry
// in this case, 1 more than the old, so the values indicate the
// number of hops from the start
//
// first parameter is the LDV entry being visited at this point,
// second parameter is the destination vertex and edge traversed
// to get from the vertex being visited
hdxGraphTraversalsAV.valForLDVEntry = function(oldEntry, nextNeighbor) {

    return oldEntry.val + 1;
}

// helper function to help build pseudocode
hdxGraphTraversalsAV.mainLoopBody = function(indent) {

    return pcEntry(indent+1, "(to,via) &larr; d." +
                   this.ldv.removeOperation() + "()", "getPlaceFromLDV") +
        pcEntry(indent+1, "if tree.contains(to)", "checkAdded") +
        pcEntry(indent+2, "discard (to,via) // on removal", "wasAdded") +
        pcEntry(indent+1, "else", "") +
        pcEntry(indent+2, "tree.add(to,via)", "wasNotAdded") +
        pcEntry(indent+2, "for each e = (to,v) // neighbors",
                "checkNeighborsLoopTop") +
        pcEntry(indent+3, "if tree.contains(v)", "checkNeighborsLoopIf") +
        pcEntry(indent+4, "discard (v,e) // on discovery",
                "checkNeighborsLoopIfTrue") +
        pcEntry(indent+3, "else", "") +
        pcEntry(indent+4, "d." + this.ldv.addOperation() + "(v,e)", 
                "checkNeighborsLoopIfFalse");

};

// graph traversals-specific psuedocode, note labels must match those
// expected by hdxTraversalsSpanningAVCommon avActions
hdxGraphTraversalsAV.setupCode = function() {

    let initializeCode = [ "d &larr; new " + this.ldv.displayName,
                           "d." + this.ldv.addOperation() + "(start,null)" ];
    if (this.stoppingCondition == "FindAll") {
        initializeCode.push("done &larr; false");
    }
    this.code = '<table class="pseudocode">' +
        pcEntry(0, initializeCode, "START");
    if (this.stoppingCondition == "StopAtEnd") {
        this.code +=
            pcEntry(0, "while not tree.contains(end)", "checkEndAdded") +
            pcEntry(1, "if d.isEmpty", "checkLDVEmpty") +
            pcEntry(2, "error: no path", "LDVEmpty") +
            this.mainLoopBody(0);
    }
    else if (this.stoppingCondition == "FindReachable") {
        this.code +=
            pcEntry(0, "while not d.isEmpty", "checkComponentDone") +
            this.mainLoopBody(0);

    }
    else { // this.stoppingCondition == "FindAll"
        this.code +=
            pcEntry(0, "while not done", "checkAllComponentsDone") +
            pcEntry(1, "while not d.isEmpty", "checkComponentDone") +
            this.mainLoopBody(1) +
            pcEntry(1, "// finalize component", "finalizeComponent") +
            pcEntry(1, "if &exist; any unadded vertices", "checkAnyUnadded") +
            pcEntry(2, [ "v &larr; any unadded vertex",
                         "d." + this.ldv.addOperation() + "(v,null)" ],
                    "startNewComponent") +
            pcEntry(1, "else", "") +
            pcEntry(2, "done &larr; true", "doneToTrue");
    }

    this.code += "</table>";
}

// graph traversals allow the option to find all components
hdxGraphTraversalsAV.supportFindAllComponents = true;


/* Dijkstra's algorithm based on hdxTraversalsSpanningAVCommon */

var hdxDijkstraAV = Object.create(hdxTraversalsSpanningAVCommon);

// entries for the list of AVs
hdxDijkstraAV.value = "dijkstra";
hdxDijkstraAV.name = "Dijkstra's Algorithm";
hdxDijkstraAV.description = "Dijkstra's algorithm for single-source shortest paths.";
hdxDijkstraAV.foundTableHeader = "Shortest Paths Found So Far";
hdxDijkstraAV.distEntry = "Distance";

// required function to create an appropriate list of discovered vertices
hdxDijkstraAV.createLDV = function() {
    
    return new HDXLinear(hdxLinearTypes.PRIORITY_QUEUE,
                         "Priority Queue");
};

// comparator for priority queue
hdxDijkstraAV.comparator = function(a, b) {
    return a.val < b.val;
};

// function to determine the next "val" field for a new LDV entry
// in this case, the old cumulative distance plus the edge length
//
// first parameter is the LDV entry being visited at this point,
// second parameter is the destination vertex and edge traversed
// to get from the vertex being visited
hdxDijkstraAV.valForLDVEntry = function(oldEntry, nextNeighbor) {

    return oldEntry.val + convertToCurrentUnits(edgeLengthInMiles(graphEdges[nextNeighbor.via]));
};

// helper function to help build pseudocode
hdxDijkstraAV.mainLoopBody = function(indent) {

    return pcEntry(indent+1, "(to,via,d) &larr; pq." +
                   this.ldv.removeOperation() + "()", "getPlaceFromLDV") +
        pcEntry(indent+1, "if tree.contains(to)", "checkAdded") +
        pcEntry(indent+2, "discard (to,via) // on removal", "wasAdded") +
        pcEntry(indent+1, "else", "") +
        pcEntry(indent+2, "tree.add(to,via,d)", "wasNotAdded") +
        pcEntry(indent+2, "for each e=(to,v) // neighbors",
                "checkNeighborsLoopTop") +
        pcEntry(indent+3, "if tree.contains(v)", "checkNeighborsLoopIf") +
        pcEntry(indent+4, "discard (v,e) // on discovery",
                "checkNeighborsLoopIfTrue") +
        pcEntry(indent+3, "else", "") +
        pcEntry(indent+4, "pq." + this.ldv.addOperation() + "(v,e,d+len(e))", 
                "checkNeighborsLoopIfFalse");

};

// Dijkstra-specific psuedocode, note labels must match those
// expected by hdxTraversalsSpanningAVCommon avActions
hdxDijkstraAV.setupCode = function() {
    this.code = '<table class="pseudocode">' +
        pcEntry(0, ["pq &larr; new " + this.ldv.displayName,
                    "pq." + this.ldv.addOperation() + "(start,null,0)" ],
                "START");
    if (this.stoppingCondition == "StopAtEnd") {
        this.code +=
            pcEntry(0, "while not tree.contains(end)", "checkEndAdded") +
            pcEntry(1, "if pq.isEmpty", "checkLDVEmpty") +
            pcEntry(2, "error: no path", "LDVEmpty") +
            this.mainLoopBody(0);
    }
    else if (this.stoppingCondition == "FindReachable") {
        this.code +=
            pcEntry(0, "while not pq.isEmpty", "checkComponentDone") +
            this.mainLoopBody(0);

    }

    this.code += "</table>";
};

/* Prim's algorithm based on hdxTraversalsSpanningAVCommon */

var hdxPrimAV = Object.create(hdxTraversalsSpanningAVCommon);

// entries for the list of AVs
hdxPrimAV.value = "prim";
hdxPrimAV.name = "Prim's Algorithm";
hdxPrimAV.description = "Prim's algorithm for minimum cost spanning trees.";
hdxPrimAV.foundTableHeader = "Edges in Spanning Tree/Forest";
hdxPrimAV.distEntry = "Length";

// required function to create an appropriate list of discovered vertices
hdxPrimAV.createLDV = function() {
    
    return new HDXLinear(hdxLinearTypes.PRIORITY_QUEUE,
                         "Priority Queue");
};

// comparator for priority queue
hdxPrimAV.comparator = function(a, b) {
    return a.val < b.val;
};

// function to determine the next "val" field for a new LDV entry
// in this case, the edge length
//
// first parameter is the LDV entry being visited at this point,
// second parameter is the destination vertex and edge traversed
// to get from the vertex being visited
hdxPrimAV.valForLDVEntry = function(oldEntry, nextNeighbor) {

    return convertToCurrentUnits(edgeLengthInMiles(graphEdges[nextNeighbor.via]));
}

// helper function to help build pseudocode
hdxPrimAV.mainLoopBody = function(indent) {

    return pcEntry(indent+1, "(to,via,d) &larr; pq." +
                   this.ldv.removeOperation() + "()", "getPlaceFromLDV") +
        pcEntry(indent+1, "if tree.contains(to)", "checkAdded") +
        pcEntry(indent+2, "discard (to,via) // on removal", "wasAdded") +
        pcEntry(indent+1, "else", "") +
        pcEntry(indent+2, "tree.add(to,via,d)", "wasNotAdded") +
        pcEntry(indent+2, "for each e=(to,v) // neighbors",
                "checkNeighborsLoopTop") +
        pcEntry(indent+3, "if tree.contains(v)", "checkNeighborsLoopIf") +
        pcEntry(indent+4, "discard (v,e) // on discovery",
                "checkNeighborsLoopIfTrue") +
        pcEntry(indent+3, "else", "") +
        pcEntry(indent+4, "pq." + this.ldv.addOperation() + "(v,e,len(e))", 
                "checkNeighborsLoopIfFalse");

};

// Prim's-specific psuedocode, note labels must match those
// expected by hdxTraversalsSpanningAVCommon avActions
hdxPrimAV.setupCode = function() {
    this.code = '<table class="pseudocode">' +
        pcEntry(0, ["pq &larr; new " + this.ldv.displayName,
                    "pq." + this.ldv.addOperation() + "(start,null,0)" ],
                "START");
    if (this.stoppingCondition == "StopAtEnd") {
        this.code +=
            pcEntry(0, "while not tree.contains(end)", "checkEndAdded") +
            pcEntry(1, "if pq.isEmpty", "checkLDVEmpty") +
            pcEntry(2, "error: no path", "LDVEmpty") +
            this.mainLoopBody(0);
    }
    else if (this.stoppingCondition == "FindReachable") {
        this.code +=
            pcEntry(0, "while not pq.isEmpty", "checkComponentDone") +
            this.mainLoopBody(0);

    }
    else { // this.stoppingCondition == "FindAll"
        this.code +=
            pcEntry(0, "while not done", "checkAllComponentsDone") +
            pcEntry(1, "while not pq.isEmpty", "checkComponentDone") +
            this.mainLoopBody(1) +
            pcEntry(1, "// finalize component", "finalizeComponent") +
            pcEntry(1, "if &exist; any unadded vertices", "checkAnyUnadded") +
            pcEntry(2, [ "v &larr; any unadded vertex",
                         "pq." + this.ldv.addOperation() + "(v,null)" ],
                    "startNewComponent") +
            pcEntry(1, "else", "") +
            pcEntry(2, "done &larr; true", "doneToTrue");
    }

    this.code += "</table>";
};

// Prim's allows the option to find all components
hdxPrimAV.supportFindAllComponents = true;
