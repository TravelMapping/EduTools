//
// HDX Twice-Around-the-Tree Traveling Salesman Approximation AV
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

const hdxTwiceAroundTreeAV = {

    value: 'tsptwice',
    name: "Twice-Around-the-Tree TSP Approximation",
    description: "This algorithm provides an polynomial time approximation of the traveling salesman problem, where using a minimum spanning tree and depth-first-search, the approximate distance is guaranteed to be less than twice the actual solution",

    // use vertices, no edges
    useV: true,
    useE: false,

    edgePoly: [],

    // current vertex being operated upon
    nextToCheck: -1,

    // index of the waypoint that is selected by the user to be the
    // start of every path
    startPoint: 0,

    // adjacency matrix for all vertices, for example graph[0][1] will
    // give you the distance from vertex 0 to 1
    graph: null,

    // the permutation/path and the polyline corresponding to that
    // path
    finalPath: [],
    finalPoly: [],

    // polylines for the edges of the complete graph and its spanning
    // tree
    edgePoly: [],

    // length of the path so far
    currDistance: 0,

    // html which is printed into the AV control entry
    table: null,

    avActions : [
        {
            label: "START",
            comment: "generate complete graph of all points",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.startPoint = Number(document.getElementById("startPoint").value);
                thisAV.nextToCheck = -1;

                thisAV.currSum = 0;
                thisAV.currDistance = 0;

                // create the complete graph and plots all the edges
                // on the map

                // develop the list of vertices and the 2D array that
                // will store our polylines
                const arr = [];
                thisAV.edgePoly = new Array(waypoints.length);
                for (let i = 0; i < waypoints.length; i++) {
                    arr.push(i);
                    waypoints[i].num = i;
                    thisAV.edgePoly[i] = new Array(waypoints.length);
                    for (let j = 0; j < waypoints.length; j++) {
                        thisAV.edgePoly[i][j] = null;
                    }
                }

                // construct all the edges of the complete graph and
                // add them to the map
                for (let i = 0; i < waypoints.length; i++) {
                    for (let j = i + 1; j < waypoints.length; j++) {
			const currCoords = [[waypoints[i].lat, waypoints[i].lon],
					    [waypoints[j].lat,waypoints[j].lon]];
                        const currEdge = L.polyline(currCoords, {
                            color: visualSettings.discovered.color,
                            opacity: 0.6,
                            weight: 2
                        });

                        thisAV.edgePoly[i][j] = currEdge; 
                        thisAV.edgePoly[j][i] = currEdge;
                        currEdge.addTo(map);
                    }
                }

                // the rainbow color generator
                thisAV.rainbowGradiant = new Rainbow();
                thisAV.rainbowGradiant.setNumberRange(0,waypoints.length);
                thisAV.rainbowGradiant.setSpectrum('ff0000','ffc000',
						   '00ff00','00ffff',
						   '0000ff','c700ff');

                hdxAVCP.update("undiscovered",waypoints.length +
			       " vertices not yet visited");

                // next we generate the complete graph behind the
                // scenes for us to perform the mst and dft algorithms
                thisAV.graph = new completeGraph(arr);

                hdxAV.iterationDone = true;
                hdxAV.nextAction = "minSpanTree";
            },
            logMessage: function(thisAV) {
                return "Generating complete graph";
            }
        },
        {
            label: "minSpanTree",
            comment: "generate generate minimum spanning tree of the complete graph",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // Perform Prim's algorithm on our complete graph so
                // that we can perform our approximation on the
                // computed minimum spanning tree
                thisAV.graph.prims(true,thisAV.startPoint);
                for (let i = 0; i < thisAV.graph.v.length; i++) {
                    for (let j = i + 1; j < thisAV.graph.v.length; j++) {
                        if (!thisAV.graph.validEdge[i][j]) {
                            thisAV.edgePoly[i][j].remove();
                            thisAV.edgePoly[i][j] = null;
                            thisAV.edgePoly[j][i] = null;
                        }
			else {
                            // if the graph says the edge is valid,
                            // then change i
                            thisAV.edgePoly[i][j].setStyle({
				color: visualSettings.spanningTree.color,
                                opacity: 0.8,
                                weight: 4});
                        }
                    }
                }
            
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "dft";
            },
            logMessage: function(thisAV) {
                return "Generating minimum spanning tree on complete graph";
            }
        },

        {
            label: "dft",
            comment: "perform depth-first traversal on the minimum spaning tree",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // Perform a depth-first traversal on the spanning to
                // get our initial path.  Currently there is nothing
                // that visualizes this, but that can be changed in
                // the future
                thisAV.graph.dft(thisAV.startPoint, thisAV.graph.visited);

                // Add the startPoint to the end in order to complete
                // the path
                thisAV.graph.path.push(thisAV.startPoint);
                hdxAV.iterationDone = true;

                thisAV.finalPath = thisAV.graph.path;
                hdxAV.nextAction = "topForLoop";

                // Create the top of the table which will be added to
                // in the loop below
                thisAV.table = '<table class="gratable"><thead>' +
                    '<tr style="text-align:center"><th>#</th><th>Label</th><th>Distance</th></tr></thead><tbody>';
            },
            logMessage: function(thisAV) {
                return "Performing a depth-first traversal on minimum spanning tree starting from waypoint #" + thisAV.startPoint;
            }
        },

        {
            label: "topForLoop",
            comment: "loop over each vertex in the initial path",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.nextToCheck++;

                hdxAV.iterationDone = true;

                // if we have checked every point in the path then we
                // are done
                if (thisAV.nextToCheck < thisAV.finalPath.length - 1 ) {

                    thisAV.currColor = {
                        color: "#" + thisAV.rainbowGradiant.colorAt(
                            thisAV.nextToCheck),
                            textColor: "white",
                            scale: 6,
                            name: "color",
                            value: 0,
                            opacity: 0.8
                    };

                    // if we still need to check additional points
                    // highlight it
                    updateMarkerAndTable(thisAV.finalPath[thisAV.nextToCheck],
					 visualSettings.v1,
					 30, false);

                    hdxAVCP.update("v1","from: #" +
				   thisAV.finalPath[thisAV.nextToCheck] + " " +
				   waypoints[thisAV.finalPath[thisAV.nextToCheck]].label);
                    
                    // This condition does not check the last point
                    // because we need to highlight both v1 and v2, so
                    // if we don't account for the last point we will
                    // get an out of bounds error
                    if (thisAV.nextToCheck < thisAV.finalPath.length - 2) {
			updateMarkerAndTable(thisAV.finalPath[thisAV.nextToCheck + 1],
					     visualSettings.v2,
					     30,false);
                        hdxAVCP.update("v2","to: #" +
				       thisAV.finalPath[thisAV.nextToCheck + 1] +
				       " " +
				       waypoints[thisAV.finalPath[thisAV.nextToCheck + 1]].label);
                    }
		    else {
                        hdxAVCP.update("v2","to: #" +
				       thisAV.finalPath[0] + " " +
				       waypoints[thisAV.finalPath[0]].label);
                    }
                    hdxAV.nextAction = "addToPath";
                }
		else {
                    hdxAV.nextAction = 'cleanup';
                }
                
                hdxAVCP.update("undiscovered",
			       (waypoints.length - thisAV.nextToCheck) +
			       " vertices not yet visited");
            },
            logMessage: function(thisAV) {
                return "Iterating over the sorted array of vertices produced by depth-first traversal";
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.VERTEX,
		    vindexvar: "v"
		},
		f: function(thisAV, matchvnum, matchtype, textval) {
		    return isCBPVertexMatch(thisAV.finalPath[thisAV.nextToCheck],
					    matchvnum, matchtype, textval);
		}		
            }
        },
        {
            label: "addToPath",
            comment: "if vertex is not contained in final path, add it",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // Get the coordinates of the endpoints of the edge we
                // are about to add
		const currCoords = [];
                currCoords[0] =
		    [waypoints[thisAV.finalPath[thisAV.nextToCheck]].lat,
		     waypoints[thisAV.finalPath[thisAV.nextToCheck]].lon];
		
                currCoords[1] =
		    [waypoints[thisAV.finalPath[thisAV.nextToCheck + 1]].lat,
		     waypoints[thisAV.finalPath[thisAV.nextToCheck + 1]].lon];
		
                // Construct the polyline for an edge used for the
                // final path
                const currEdge = L.polyline(currCoords, {
		    //currColor comes from above generated by the
		    //rainbowGradiant
                    color: thisAV.currColor.color, 
                    opacity: 0.6,
                    weight: 5
                });

                // add to array to be removed later, adding polyline
                // to map
                thisAV.finalPoly.push(currEdge);
                currEdge.addTo(map);

                updateMarkerAndTable(thisAV.finalPath[thisAV.nextToCheck],
				     thisAV.currColor, 30, false);

                //calculating the distance of the current edge and then adding it to the total
                thisAV.currDistance =
		    distanceInMiles(currCoords[0][0],currCoords[0][1],
				    currCoords[1][0],currCoords[1][1]);
                hdxAVCP.update("currSum","Distance of Path: " +
			       thisAV.currSum.toFixed(3) + " miles");
                
                thisAV.currSum += thisAV.currDistance;
                
                hdxAV.nextAction = "topForLoop";

                // add edge to AV table
                thisAV.table += thisAV.edgeTableRow()

                hdxAVCP.update('minPath',thisAV.table + '</tbody></table>');
            },
            logMessage: function(thisAV) {
                return "Adding edge between vertex #" +
		    thisAV.finalPath[thisAV.nextToCheck] + " and vertex #"
                    + thisAV.finalPath[thisAV.nextToCheck + 1];
            }
        },

        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {

                hdxAVCP.update("currSum", "Distance of Path: " +
			       thisAV.currSum.toFixed(3) + " miles");
                hdxAVCP.update('v1', '');
                hdxAVCP.update('v2', '');
                hdxAVCP.update('undiscovered', '');

                // cleanup
                for (let i = 0; i < waypoints.length; i++) {
                    for (let j = 0; j < waypoints.length; j++) {
                        if (thisAV.edgePoly[i][j] != null) {
                            thisAV.edgePoly[i][j].remove();
                        }
                    }
                }
		
		hdxAV.nextAction = "DONE";
		hdxAV.iterationDone = true;
                
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],
    
    prepToStart() {

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += `k<sub>n</sub> &larr; completeGraph(v[]) <br />`;
        this.code += '</td></tr>' + pcEntry(0,'mst &larr; minSpanTree(k<sub>n</sub>)','minSpanTree');
        this.code += '</td></tr>'+ pcEntry(0,'path<sub>initial</sub> &larr; dft(mst) <br />path<sub>final</sub> &larr; []','dft');
        this.code += '</td></tr>' + pcEntry(0,'for each v in path<sub>initial</sub>','topForLoop');
        this.code += '</td></tr>' + pcEntry(4,'path<sub>final</sub>.add(v)','addToPath');
    },
    
    setupUI() {

        let newAO = buildWaypointSelector("startPoint", "Start Vertex", 0);

        hdxAV.algOptions.innerHTML = newAO;

	// QS parameter
	HDXQSClear(this);
	HDXQSRegisterAndSetNumber(this, "startPoint", "startPoint", 0,
				  waypoints.length - 1);

	// AVCP entries
        hdxAVCP.add("undiscovered", visualSettings.undiscovered); 
        hdxAVCP.add("v1", visualSettings.v1);
        hdxAVCP.add('v2', visualSettings.v2);
        hdxAVCP.add("currSum", visualSettings.discovered);
        hdxAVCP.add("minPath", visualSettings.spanningTree);
    },

    cleanupUI() {

        for (let i = 0; i < waypoints.length; i++) {
            if (this.edgePoly[i] != null) {
		for (let j = 0; j < waypoints.length; j++) {
                    if (this.edgePoly[i][j] != null) {
                        this.edgePoly[i][j].remove();
                    }
		}
            }
        }
        for (let i = 0; i < this.finalPoly.length; i++) {
            this.finalPoly[i].remove();
        }
    },
    
    idOfAction(action) {
	
        return action.label;
    },

    edgeTableRow() {

        return '<tr><td>' + this.finalPath[this.nextToCheck]+ ' &rarr; ' +
	    this.finalPath[this.nextToCheck + 1] + '</td><td>' +
	    waypoints[this.finalPath[this.nextToCheck]].label +
            '</td><td>' + this.currDistance.toFixed(3) + '</td></tr>';
    }
}

// this object is used to create the complete graph with all vertices
// in the graph. vertices is an array of integers
function completeGraph(vertices) {
    this.v = vertices;
    this.e = new Array(this.v.length);
    this.path = [];
    this.inMST = new Array(this.v.length);
    this.validEdge = new Array(this.v.length);
    this.visited = new Array(this.v.length);
    // loop to create double array, adjacency matrix
    for (let i = 0; i < this.v.length; i++) {
        this.e[i] = new Array(this.v.length);
        this.validEdge[i] = new Array(this.v.length); 
        this.visited[i] = false;
    }
    
    for (let i = 0; i <this.v.length; i++) {
        for (let j = 0; j < this.v.length; j++) {
            this.e[i][j] = distanceInMiles(waypoints[i].lat,waypoints[i].lon,
					   waypoints[j].lat,waypoints[j].lon);
            this.validEdge[i][j] = false;
        }
    }

    // startPoint is a number, visited is an array of booleans, path
    // is an array holding the sequence
    this.dft = function(startPoint) {
        this.path.push(startPoint);
        this.visited[startPoint] = true;
        for (let i = 0; i < this.v.length; i++) {
            if ((!this.visited[i]) &&
		(this.e[startPoint][i] > 1E-14 &&
		 this.e[startPoint][i] < Number.MAX_SAFE_INTEGER)) {
                this.dft(i);
            }
        }
    }
    
    // if prune is true, then remove non-valid edges from adjacency
    // matrix
    this.prims = function(prune,startPoint) {
        for (let i = 0; i < this.inMST.length; i++) {
            this.inMST[i] = false;
        }

        this.inMST[startPoint] = true;
        let edgeCount = -1;
        let minCost = 0;
        let a;
        let b;
        let min;
        while (edgeCount < this.v.length - 2) {
            min = Number.MAX_SAFE_INTEGER;
            
            for (let i = 0; i < this.v.length; i++) {
                for (let j = i + 1; j < this.v.length; j++) {            
                    if (this.e[i][j] < min && this.e[i][j] > 1E-14) {
                        if (this.isValidEdge(i, j, this.inMST)) {
                            min = this.e[i][j];
                            a = i;
                            b = j;
                        }
                    }
                }
            }

            if (a != -1 && b != -1) { 
                edgeCount++;
                minCost += min;
                
                this.validEdge[a][b] = true;
                this.validEdge[b][a] = true;
                this.inMST[b] = true;
                this.inMST[a] = true;
            }
        }
        if (prune) this.prune();
    }

    this.prune = function() {

        for (let i = 0; i < this.v.length; i++) {
            for (let j = i; j < this.v.length; j++) {
                if (!this.validEdge[i][j]) {
                    this.e[i][j] = 0
                    this.e[j][i] = 0;
                }
            }
        }
    }

    // inMST is an array stored by the complete graph
    this.isValidEdge = function(u, v, inMST) {
        if (u == v)
            return false;
        if (inMST[u] == false && inMST[v] == false)
            return false;
        else if (inMST[u] == true && inMST[v] == true)
            return false;
        return true;
    }
}
