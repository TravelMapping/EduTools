//
// HDX Recursive Depth First Search Algorithm AV
//
// METAL Project
//
// Primary Author: Jim Teresco, Alissa Ronca, Zac Goodsell
//

var hdxDFSRecAV = {

    // entries for list of AVs
    value: "recdfs",
    name: "Recursive Depth First Search",
    description: "Depth-first graph traversal by recursive depth-first searches from each vertex (waypoint).",
    
    // state variables for edge search
    discarded: 0,
    stack: null,
    callStack: null,
    // last place to come out of the call stack, currently "visiting"
    visiting: 0,
    connection: 0,
    prevVisiting: 0,
    prevConnection: 0,
    nextEdge: 0,
    nextVertex: 0,

    // when finding all, track the lists of vertices and edges that are
    // forming the current spanning tree
    componentVList: [],
    componentEList: [],

    // some additional stats to maintain and display
    numVSpanningTree: 0,
    numESpanningTree: 0,
    numVUndiscovered: 0,
    numEUndiscovered: 0,
    numEDiscardedOnRemoval: 0,
    totalTreeCost: 0,

    // the actions that make up this algorithm
    avActions: [
        {
            label: "START",
            comment: "Initializing variables",
            code: function(thisAV) {
                
                highlightPseudocode(this.label, visualSettings.visiting);
                
                thisAV.stack = [];
                // highlight edge 0 as leader in all categories and current
                thisAV.discarded = 0;
                thisAV.nextEdge = 0;
                thisAV.nextVertex = -1;
                thisAV.connection = -1;
                thisAV.backEdgesArr = [];
        
                thisAV.updateControlEntries();
                
                for (let j = 0; j < waypoints.length; j++) {
                    waypoints[j].hops = -1;
                    waypoints[j].prevVertex = -1;
                }
                
                // vertex index to start the traversal
                thisAV.startingVertex =
                    document.getElementById("startPoint").value;
                
                thisAV.visiting = thisAV.startingVertex;
                
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "recursiveCallTop";
            },
            logMessage: function(thisAV) {
                return "Initializing all variables";
            }
        },
        {
            label: "recursiveCallTop",
            comment: "Recursive call to dfs",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.callStack.add(thisAV.visiting);
               
                updateAVControlEntry("visiting", "Visiting vertex " + thisAV.visiting
                    + ": " + waypoints[thisAV.visiting].label);

                // show on map as visiting color            
                updateMarkerAndTable(thisAV.visiting,
                    visualSettings.visiting, 10, false);
                    
                    thisAV.numVUndiscovered--;
                    thisAV.numVSpanningTree++;
                    thisAV.componentVList.push(thisAV.visiting);
                if (thisAV.connection != -1) {
                    updatePolylineAndTable(thisAV.connection, 
					   visualSettings.visiting, false);
                    thisAV.numEUndiscovered--;
                    thisAV.numESpanningTree++;
                    thisAV.componentEList.push(thisAV.connection);
                }
                thisAV.updateControlEntries(); 
                thisAV.updateSpanningTreeTable();


                //recolor what was previously being visited as discovered
                if (thisAV.stack.length > 0) {
                    let prevRoute = thisAV.stack[thisAV.stack.length - 1];
                    updateMarkerAndTable(waypoints[thisAV.visiting].prevVertex,
					 visualSettings.discovered, 10, false);
                    if (prevRoute[1] != -1 ) {
                        updatePolylineAndTable(prevRoute[1], 
					       visualSettings.discovered, false);
                        updateMarkerAndTable(thisAV.startingVertex,
					     visualSettings.startVertex, 4, false);
                    }
                }
                    
                hdxAV.nextAction = "setHops";
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Recursive call to dfs on vertex #" + thisAV.visiting;
            }
        },
        {
            label: "setHops",
            comment: "Set vertex's number of hops to mark as discovered",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                //set number of hops to its parent vertex's number of hops + 1
                //if its the first point set hops to 0
                if (waypoints[thisAV.visiting].prevVertex == -1) {
                    waypoints[thisAV.visiting].hops = 0;
                }
                //set number of hops to its parent vertex's number of hops + 1
                else {
                    waypoints[thisAV.visiting].hops =
                        waypoints[waypoints[thisAV.visiting].prevVertex].hops + 1;
                }
                hdxAV.nextAction = "forLoopTop";
                thisAV.nextEdge = 0;
                
            },
            logMessage: function(thisAV) {
                return "Set vertex #" + thisAV.visiting + "'s hops to " +
                    waypoints[thisAV.visiting].hops + " to mark as discovered";
            }
        },
        {
            label: "forLoopTop",
            comment: "Loop through each vertex in V's adjacency list",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                //if for loop is done for this level of recursion               
                if (thisAV.nextEdge >= waypoints[thisAV.visiting].edgeList.length) {
                   
                    if (thisAV.stack.length != 0) {
                        let route = thisAV.stack.pop();
                        thisAV.nextEdge = route[0];
                        thisAV.connection = route[1];
                        thisAV.visiting = waypoints[thisAV.visiting].prevVertex;
                    }
                    hdxAV.nextAction = "return";
                }
                else {
                    //get the other vertex from the adjacency list 
                    thisAV.connection =
                        waypoints[thisAV.visiting].edgeList[thisAV.nextEdge].edgeListIndex;
                    thisAV.nextVertex = -1;
                    if (graphEdges[thisAV.connection].v1 == thisAV.visiting) {
                        thisAV.nextVertex = graphEdges[thisAV.connection].v2;
                    }
                    else if (graphEdges[thisAV.connection].v2 == thisAV.visiting) {
                        thisAV.nextVertex = graphEdges[thisAV.connection].v1;
                    }
                    // check nextVertex against all vertices already
                    // discovered, if discovered, skip and increment
                    // by one then go through the for loop again
                    hdxAV.nextAction = "checkUndiscovered";
                }
            },
            logMessage: function(thisAV) {
                return "Loop through each vertex in V's adjacency list";
            }
        },
        {
            label: "checkUndiscovered",
            comment: "Check if vertex has previously been discovered",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                if (waypoints[thisAV.nextVertex].hops == -1) {
                    waypoints[thisAV.nextVertex].prevVertex = thisAV.visiting;

                    hdxAV.nextAction = "callRecursion";
                }
                else {
                    thisAV.nextEdge++;                    
                    hdxAV.nextAction = "forLoopTop";
                    if (thisAV.stack.length != 0 &&
                        thisAV.stack[thisAV.stack.length - 1][1] != thisAV.connection
                        && !thisAV.backEdgesArr.includes(thisAV.connection) ) {
                        updatePolylineAndTable(thisAV.connection,
					       visualSettings.discarded, false);
                        thisAV.numEDiscardedOnRemoval++;
                        thisAV.numEUndiscovered--;
                        thisAV.updateControlEntries();     
                        thisAV.backEdgesArr.push(thisAV.connection)   
                    }
                }                
            },
            logMessage: function(thisAV) {
                return "Check if vertex #" + thisAV.nextVertex +
                    " has previously been discovered";
            }
        },
        {
            label: "callRecursion",
            comment: "Call recursion with new vertex",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.stack.push([thisAV.nextEdge, thisAV.connection]);
                thisAV.visiting = thisAV.nextVertex;
                hdxAV.nextAction = "recursiveCallTop"                
            },
            logMessage: function(thisAV) {
                return "Call recursion on vertex #" + thisAV.visiting;
            }
        },
        {
            label: "return",
            comment: "Return to previous level of recursion",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.callStack.remove();

                //color finished edges and vertices added to tree
                updateMarkerAndTable(graphEdges[thisAV.connection].v1,
				     visualSettings.spanningTree, 10, false);
                updateMarkerAndTable(graphEdges[thisAV.connection].v2,
				     visualSettings.spanningTree, 10, false);
                if (!thisAV.backEdgesArr.includes(thisAV.connection)) {
                    updatePolylineAndTable(thisAV.connection,
					   visualSettings.spanningTree, false);
                }

                //update color for new current vertex
                updateAVControlEntry("visiting", "Visiting vertex " + thisAV.visiting
				     + ": " + waypoints[thisAV.visiting].label);
                updateMarkerAndTable(thisAV.visiting,
				     visualSettings.visiting, 10, false);

                if (thisAV.stack.length == 0 &&
		    thisAV.nextEdge >= waypoints[thisAV.visiting].edgeList.length) {
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    thisAV.nextEdge++;
                    hdxAV.nextAction = "forLoopTop";
                }                
            },
            logMessage: function(thisAV) {
                return "Return from vertex #" + thisAV.visiting +
                    " to previous level of recursion";
            }
        },

        {
            label: "cleanup",
            comment: "Cleanup and updates at the end of the visualization",
            code: function (thisAV) {
                updateMarkerAndTable(thisAV.startingVertex,
				     visualSettings.startVertex, 4, false);
                hdxAV.algStat.innerHTML =
                    "Done! Visited " + graphEdges.length + " edges.";
                updateAVControlEntry("visiting", "");
                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],

    updateSpanningTreeTable() {

        let newtr = document.createElement("tr");
        let edgeLabel;
        let fullEdgeLabel;
        let fromLabel;
        let fullFromLabel;
        let vLabel = shortLabel(waypoints[this.visiting].label, 10);
        if (waypoints[this.visiting].prevVertex == -1) {
            edgeLabel = "(START)";
            fullEdgeLabel = "(START)";
            fullEdgeLabel = "(START)";
            currentHops = 0;
            fromLabel = "";
            fullFrom = "";
        }
        else {
            fullEdgeLabel = graphEdges[this.connection].label;
            edgeLabel = shortLabel(fullEdgeLabel, 10);
            fromLabel = shortLabel(waypoints[waypoints[this.visiting].prevVertex].label, 10);
            currentHops = waypoints[waypoints[this.visiting].prevVertex].hops + 1;
            fullFrom = "From #" + waypoints[this.visiting].prevVertex + ":" +
                 waypoints[waypoints[this.visiting].prevVertex].label;
        }

        // mouseover title
        newtr.setAttribute("custom-title",
                           "Path to #" + this.visiting + ":" +
                           waypoints[this.visiting].label + ", " + 
                           fullFrom + ", via " + fullEdgeLabel);
        
        // actual table row to display
        newtr.innerHTML = 
            '<td>' + vLabel + '</td>' +
            '<td>' + currentHops + '</td>' +
            '<td>' + fromLabel + '</td>' +
            '<td>' + edgeLabel + '</td>';
        
        this.foundTBody.appendChild(newtr);
        document.getElementById("foundEntriesCount").innerHTML =
            this.numESpanningTree;      
    },
    
    updateControlEntries() {
        updateAVControlEntry("undiscovered", "Undiscovered: " +
                             this.numEUndiscovered + " E, " +
                             this.numVUndiscovered + " V");
        updateAVControlEntry("currentSpanningTree", "Spanning Forest: " +
                             this.numESpanningTree + " E, " + this.numVSpanningTree + " V");
        updateAVControlEntry("discardedOnRemoval", "Back edges: " +
                             this.numEDiscardedOnRemoval + "");
    },

    // required prepToStart function
    prepToStart() {

        hdxAV.algStat.innerHTML = "Initializing";
        
        // hide waypoints, show connections
        initWaypointsAndConnections(true, true,
                                    visualSettings.undiscovered);
        
        this.discarded= 0;
        // last place to come out of the call stack, currently "visiting"
        this.visiting= null;

        // when finding all, track the lists of vertices and edges that are
        // forming the current spanning tree
        this.componentVList= [];
        this.componentEList= [];

        // some additional stats to maintain and display
        this.numVSpanningTree= 0;
        this.numESpanningTree= 0;
        this.numVUndiscovered= waypoints.length;
        this.numEUndiscovered= graphEdges.length;
        this.numEDiscardedOnRemoval= 0;
        this.totalTreeCost = 0;

        this.callStack = new HDXLinear(hdxLinearTypes.CALL_STACK,
            "Call Stack");
        if (this.hasOwnProperty("comparator")) {
            this.callStack.setComparator(this.comparator);
        }
        this.callStack.setDisplay(getAVControlEntryDocumentElement("discovered"),
            displayCallStackItem);

        // pseudocode
        this.code ='<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += 'initialize variables</td></tr>';
        this.code += pcEntry(0, "dfs(v)", "recursiveCallTop");
        this.code += pcEntry(1, "v.hops &larr; v.previousVertex.hops + 1", "setHops");
        this.code += pcEntry(1, "for each vertex w in V adjacent to v do", "forLoopTop");
        this.code += pcEntry(2, "if w.hops = 0", "checkUndiscovered");
        this.code += pcEntry(3, "dfs(w)", "callRecursion");
        this.code += pcEntry(1, "return", "return");
        this.code += "</table>";
    },
        
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;

        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");
        let newAO =
            buildWaypointSelector("startPoint", "Start Vertex", 0) +
            "<br />";
        hdxAV.algOptions.innerHTML = newAO;

	// QS parameter
	HDXQSClear(this);
	HDXQSRegisterAndSetNumber(this, "startPoint", "startPoint", 0,
				  waypoints.length - 1);

	// AVCP entries
        addEntryToAVControlPanel("visiting", visualSettings.visiting);
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered);
        addEntryToAVControlPanel("discovered", visualSettings.discovered);
        addEntryToAVControlPanel("currentSpanningTree", visualSettings.spanningTree);
        addEntryToAVControlPanel("discardedOnRemoval", visualSettings.discarded);
        addEntryToAVControlPanel("found", visualSettings.spanningTree);
        let foundEntry = '<span id="foundEntriesCount">0</span>' +
            ' <span id="foundTableLabel">Edges in Spanning Tree</span>' +
            '<br /><table class="pathTable"><thead>' +
            '<tr style="text-align:center"><th>Place</th>' +
            '<th>Hops</th>' +
            '<th>Arrive From</th>' +
            '<th>Via</th></tr>' +
            '</thead><tbody id="foundEntries"></tbody></table>';
        updateAVControlEntry("found", foundEntry);
        this.foundTBody = document.getElementById("foundEntries");
        this.foundLabel = document.getElementById("foundTableLabel");

    },

    cleanupUI() {

    }, 
    
    idOfAction(action) {
        return action.label;
    }        
};


function displayCallStackItem(item, callStack) {
    let vertexLabel = "";
    let vertexLabelFull = "";

    vertexLabelFull = waypoints[item].label;
    vertexLabel = shortLabel(vertexLabelFull, callStack.maxLabelLength);

    return '<span custom-title="Vertex #' + item + ":" +
        vertexLabelFull + '">' + "dfs (v = " + item + ": " + vertexLabel + ")" + "</span>";
};
