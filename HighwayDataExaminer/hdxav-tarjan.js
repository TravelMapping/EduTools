//
// HDX Tarjan's Bridge Detection Algorithm
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

const hdxTarjanAV = {

    value: "tarjan",
    name: "Tarjan's Bridge Detection",
    description: "Tarjan's algorithm to find all bridges, which are the edges of the graph whose removal increases the number of connected components in the graph.",

    // vertices and edges
    useV: true,
    useE: true,

    // edge is currently checked for being a bridge
    nextToCheck: -1,

    // edge numbers of the edges found to be a bridge
    bridges: [],

    // used by the depthFirstTraversal function in order to find if
    // by removing an edge, there is still a way to get from one
    // endpoint to another using a different path
    visited: [],

    // similar to visited, but instead stores edges/connections
    visitedEdges: [],

    // details of the edge that is currently being checked for whether
    // or not it is a bridge (mainly to keep track of the label of the
    // edge)
    removedEdge: null, 

    // boolean used to indicate whether or not the current removedEdge
    // is actually a bridge, if so then go to the addBridge state
    isBridge: false,

    // stop dft once the other endpoint is found
    stopDFT: false,

    // v1 is the initial endpoint, and v2 is the endpoint we are
    // trying to find from v1 after the edge is removed
    v1: -1,
    v2: -1,
    
    avActions : [
        {
            label: "START",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.nextToCheck = -1;

                // how many more edges we need to check
                thisAV.numEUndiscovered = graphEdges.length;
                thisAV.bridges = [];
                thisAV.visited = new Array(waypoints.length).fill(false);
                thisAV.visitedEdges = new Array(graphEdges.length).fill(false);
                thisAV.v1 = -1;
                thisAV.v2 = -1;
                thisAV.stopDFT;

                // numBridges is incremented every time we find a new bridge
                thisAV.numBridges = 0;
            
                hdxAVCP.update("undiscovered", graphEdges.length +
			       " edges not yet visited");
                hdxAVCP.update("numBridges","Number of Bridges: " +
			       thisAV.numBridges);

                hdxAV.iterationDone = true;
                hdxAV.nextAction = "topForLoop";
            },
            logMessage: function(thisAV) {
                return "Doing some setup stuff";
            }
        },

        {
            label: "topForLoop",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

		// move on to the next edge
                thisAV.nextToCheck++;

                // edge is not a bridge until we determine it is
                thisAV.isBridge = false;

                if (thisAV.nextToCheck < graphEdges.length) {

                    // current edge being checked
                    thisAV.removedEdge = graphEdges[thisAV.nextToCheck];

                    // save the index that might be pushed the the
                    // bridges array so we can keep track of the
                    // bridges between iterations
                    thisAV.removedEdge.num = thisAV.nextToCheck;

                    hdxAV.nextAction = "removeEdge";
                    
                }
		else {
                    // no more edges to be checked, go to cleanup
                    hdxAV.nextAction = "cleanup";
                }
            
                hdxAV.iterationDone = true;
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.EDGE,
		    eindexvar: "e"
		},
		f: function(thisAV, edgenum, matchtype, textval, vnum) {
		    return isCBPEdgeMatch(thisAV.nextToCheck, edgenum,
					  matchtype, textval, vnum);
		}    
            },
            logMessage: function(thisAV) {
                return "Checking if edge #" + thisAV.nextToCheck +
		    " is a bridge";
            }
        },

        {
            label: "removeEdge",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAVCP.update("undiscovered",
			       (graphEdges.length - thisAV.nextToCheck - 1) +
			       " edges not yet visited");
                hdxAVCP.update("visiting","Removed Edge: #" +
			       thisAV.nextToCheck + " " +
			       thisAV.removedEdge.label);
		
                // highlight the current edge being checked
                updatePolylineAndTable(thisAV.nextToCheck,
				       visualSettings.visiting,
				       false);
		
                // vertex endpoints of the current edge being checked
                thisAV.v1 = thisAV.removedEdge.v1;
                thisAV.v2 = thisAV.removedEdge.v2;

                // highlight the endpoints of the removedEdge
                updateMarkerAndTable(thisAV.v1,visualSettings.v1,false);
                updateMarkerAndTable(thisAV.v2,visualSettings.v2,false);

                hdxAVCP.update("v1","v1: #" + thisAV.v1 + " " +
			       waypoints[thisAV.v1].label);
                hdxAVCP.update("v2","v2: #" + thisAV.v2 + " " +
			       waypoints[thisAV.v2].label);
                
                hdxAV.nextAction = "dft";
            },
            logMessage: function(thisAV) {
                return "Removing edge #" + thisAV.nextToCheck + " " +
		    graphEdges[thisAV.nextToCheck].label + " from graph";
            }
        },
        {
            label: "dft",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
                thisAV.stopDFT = false;

                // reset the arrays used by the depth first traversal
                thisAV.visited = new Array(waypoints.length).fill(false);
                thisAV.visitedEdges = new Array(graphEdges.length).fill(false);

                // if v2 is not found in visited after
                // depthFirstTraversal finishes execution, then we
                // know the current edge is a bridge
                thisAV.depthFirstTraversal(thisAV.v1);
                
                // highlight all the vertices and edges that were
                // visited by the depth first traversal
                for (let i = 0; i < thisAV.visited.length; i++) {
                    if (thisAV.visited[i] && i != thisAV.v1 && i != thisAV.v2) {
                        updateMarkerAndTable(i,visualSettings.spanningTree,
					     false);
                    }
                }
                for (let i = 0; i < thisAV.visitedEdges.length; i++) {
                    if (thisAV.visitedEdges[i] && i != thisAV.nextToCheck &&
			!thisAV.bridges.includes[i]) {
                        updatePolylineAndTable(i,visualSettings.spanningTree,
					       false);
                    }
                }
                hdxAV.nextAction = "checkContains";
            },
            logMessage: function(thisAV) {
                return "Performing depth-first traversal from vertex #" +
		    thisAV.v1 + " " + waypoints[thisAV.v1].label;
            }
        },

        {
            label: "checkContains",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
                // did the DFT find another path from v1 to v2?  if
                // not, we know that the removedEdge is a bridge
                if (!thisAV.visited[thisAV.v2]) {
                    thisAV.isBridge = true;
                    hdxAV.nextAction = "addBridge";

                }
		else {
                    hdxAV.nextAction = "addEdgeBack";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if v2 can be reached by v1 when " +
		    thisAV.removedEdge.label + " is removed";
            }
        },

        {
            label: "addBridge",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // highlight the bridge that was found
                updatePolylineAndTable(thisAV.nextToCheck,
                    visualSettings.searchFailed,
                    false);
            
                thisAV.numBridges++;
                hdxAVCP.update("numBridges","Number of Bridges: " +
			       thisAV.numBridges);

                // record the current removedEdge as a bridge so it
                // can be correctly highlighted future iterations
                thisAV.bridges.push(thisAV.removedEdge.num);                
            
                hdxAV.nextAction = "addEdgeBack";
            },
            logMessage: function(thisAV) {
                return "Edge #" + thisAV.nextToCheck + " " +
		    thisAV.removedEdge.label + " found to be bridge";
            }
        },

        {
            label: "addEdgeBack",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // revert highlighting from the dft

                if (!thisAV.isBridge) {
                    updatePolylineAndTable(thisAV.nextToCheck,
					   visualSettings.undiscovered, false);
                }

                for (let i = 0; i < thisAV.visitedEdges.length; i++) {
                    if (thisAV.visitedEdges[i]) {
                        updatePolylineAndTable(i,visualSettings.undiscovered,
					       false);
                    }
                }

                for (let i = 0; i < thisAV.bridges.length; i++) {
                    updatePolylineAndTable(thisAV.bridges[i],
					   visualSettings.searchFailed,false);
                }

                for (let i = 0; i < thisAV.visited.length; i++) {
                    if (thisAV.visited[i]) {
                        updateMarkerAndTable(i,visualSettings.undiscovered,false);
                    }
                }

                updateMarkerAndTable(thisAV.v1,visualSettings.undiscovered,
				     false);
                updateMarkerAndTable(thisAV.v2,visualSettings.undiscovered,
				     false);

                hdxAV.nextAction = "topForLoop";
            },
            logMessage: function(thisAV) {
                return "Adding edge #" + thisAV.nextToCheck + " " +
		    thisAV.removedEdge.label + " back into graph";
            }
        },
        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {
                // removes waypoints from the data table, not useful here
                document.getElementById("waypoints").style.display = "none";
		
                hdxAVCP.update("undiscovered", '');
                hdxAVCP.update("visiting", '');
                
                hdxAVCP.update("v1", '');
                hdxAVCP.update("v2", '');
		
                hdxAV.iterationDone = "true";
                hdxAV.nextAction = "DONE";
                
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],
    
    prepToStart() {

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += `bridges &larr; []<br />`;
        this.code += `visited &larr; []<br />`;
        this.code += `v1 &larr; -1<br />v2 &larr; -1<br />`;
        this.code += '</td></tr>' + pcEntry(0,"for each e in graph","topForLoop");

        this.code += '</td></tr>' + pcEntry(1,"e<sub>removed</sub> &larr; graph.remove(e)<br /> " +
        pcIndent(2) + "v1 &larr; e<sub>removed</sub>.v1<br />" + 
        pcIndent(2) + "v2 &larr; e<sub>removed</sub>.v2","removeEdge");

        this.code += '</td></tr>' + pcEntry(1,"visited &larr; graph.dft(v1)","dft");
        this.code += '</td></tr>' + pcEntry(1,"if (visited not contain v2)","checkContains")
        this.code += '</td></tr>' + pcEntry(2,"bridges.add(e<sub>removed</sub>)","addBridge");
        this.code += '</td></tr>' + pcEntry(1,"graph.add(e<sub>removed</sub>)","addEdgeBack");
	
    },
    
    setupUI() {

        hdxAV.algOptions.innerHTML = '';

        hdxAVCP.add("undiscovered", visualSettings.undiscovered); 
        hdxAVCP.add("visiting", visualSettings.visiting);
        hdxAVCP.add("v1", visualSettings.v1);
        hdxAVCP.add("v2", visualSettings.v2);
        hdxAVCP.add("numBridges", visualSettings.searchFailed);
    },
    cleanupUI() {

        // make sure that waypoints are shown in the datatable again
        document.getElementById("waypoints").style.display = "";
    },

    idOfAction(action) {
	
        return action.label;
    },

    // DFT algorithm, index of the start vertex is the parameter
    depthFirstTraversal(i) {

        if (!this.stopDFT) {
            // label the vertex as having been visited
            this.visited[i] = true;

            // edge to be considered and its vertex endpoints
            let connection;
            let dv1;
            let dv2;

            // loop over all edges in a vertex's edge adjacency list
            for (let j = 0; j < waypoints[i].edgeList.length; j++) {

                // getting num of edge in vertex i's edge list
                connection = waypoints[i].edgeList[j].edgeListIndex;
		
                // make sure that the current connection is not the edge
                // we are already checking to be a bridge
                if (this.nextToCheck != connection) {

                    dv1 = graphEdges[connection].v1;
                    dv2 = graphEdges[connection].v2;

                    // if the endpoint of the current connection is
                    // not the endpoint of the bridge we have been
                    // looking for then we continue the dft, if not
                    // then we set v2 as being visited. Not strictly
                    // necessary but boosts efficency.
                    if (dv2 != this.v2) {

                        // make sure that edge we are not calling dft
                        // on a vertex we have already visited
                        if (!this.visited[dv1] && dv2 == i) {
                            this.visitedEdges[connection] = true;
                            this.depthFirstTraversal(dv1)
                        }
			else if (!this.visited[dv2] && dv1 == i) {
                            this.visitedEdges[connection] = true;
                            this.depthFirstTraversal(dv2);
                        }
                    }
		    else {
                        // if the endpoint in the current connection
                        // is the endpoint of the edge we are checking
                        // is a bridge then we mark the end point as
                        // visited, and because it has been visited by
                        // another path, that means the edge is not a
                        // bridge, so we no longer have to call dft
                        this.stopDFT = true;
                        this.visited[this.v2] = true;
                    }
                }
            }
        }
    }
}
