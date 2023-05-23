//
// HDX Brute Force Traveling Salesman AV
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

var hdxBFTravelingSalesmanAV = {
    //entries for list of avs
    value: 'bftsp',

    name: "Brute Force Traveling Salesman",

    description: "Find the shortest path visiting each location by trying all permutations. NOTE: Only use on small graphs, 10 vertices and less",

    // the polyline for the current permutation/path being checked
    currPoly: null,

    // the polyline of the shortest path found so far
    shortPoly: null,

    // the polylines of the shortest path with each edge transformed
    // into a different color
    finalPoly: [],

    // the array of indices of the shortest permutation
    shortestPath: null,

    // number of paths visited so far
    pathCount: -1,

    avActions : [
        {
            label: "START",
            comment: "creates bounding box and initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		
                // gets the staring vertex selected by the user as an integer
                thisAV.startPoint = Number(document.getElementById("startPoint").value);
		
                // we want to highlight the starting vertex
                updateMarkerAndTable(thisAV.startPoint,
				     visualSettings.startVertex, 30, false);

                thisAV.pathCount = -1;

                thisAV.currDistance = 0;
                thisAV.minDistance = Number.MAX_SAFE_INTEGER;

                // stores the list point
                thisAV.currPath = null;
                thisAV.shortestPath = null;

                thisAV.currPoly = null;
                thisAV.shortPoly = null;
                thisAV.finalPoly = [];
                thisAV.currCoords = [];

                thisAV.currEdgeDistances = [];
                thisAV.shortestEdgeDistances = [];

                // used to store the numbers of all vertices that is
                // not the start vertex. This is because we always
                // start and end at the same vertex, as such doing it
                // this way, we only have to traverse (n-1)!
                // permutations/paths
                thisAV.permutation = [];
                for (let i = 0; i < waypoints.length;i++) {
                    if (i != thisAV.startPoint) thisAV.permutation.push(i);
                }

                // constructing our permutation generator/iterator
                thisAV.permutationGenerator = HDXTSPpermute(thisAV.permutation);

                // calculate the number of paths we need to traverse
                // (n-1)! where n is the number of vertices in the
                // graph
                thisAV.pathsRemaining = HDXfactorial(thisAV.permutation.length);

                updateAVControlEntry("undiscovered",thisAV.pathsRemaining +
				     " paths not yet visited");
            
                hdxAV.nextAction = "topForLoop";
            },
            logMessage: function(thisAV) {
                return "Constructing permutation generator";
            }
        },
        {
            label: "topForLoop",
            comment: "check if we can generate another permutation path",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		
                thisAV.pathCount++;
                thisAV.pathsRemaining--;

                // this generates the next permutation to check as an
                // array of integers, corresponding to the num of all
                // vertices that are not the starting point.
                thisAV.currPath = thisAV.permutationGenerator.next();
                if (!thisAV.currPath.done) {
		    
                    // add the start vertex to the start and end of
                    // the current permutation as we start and end at
                    // the same place
                    thisAV.currPath.value.push(thisAV.startPoint);
                    thisAV.currPath.value.splice(0,0,thisAV.startPoint);

                    updateAVControlEntry("undiscovered",
					 thisAV.pathsRemaining +
					 ' paths not yet visited');
                    
                    hdxAV.nextAction = 'findSum';
                }
		else {
                    hdxAV.nextAction = 'cleanup';
                }
            
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Top of loop for paths, checking path " + thisAV.pathCount;
            }
        },

        {
            label: 'findSum',
            comment: 'we calculate the sum of the path then check if it is less than the minimum',
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                if (thisAV.currPoly != null) thisAV.currPoly.remove();
                
                thisAV.currCoords = [];

                // jumped is a boolean used to check if the current
                // path is already longer than the shortest path if so
                // then we break out of the loop. This is mostly used
                // as an efficiency bonus, but also used to determine
                // whether or not we set a new minimum or go back to
                // the topForLoop state
                let jumped = false;

                // endpoints of the edge whose length we are finding
                let v1;
                let v2;

                // used to track the length of the path so far, both
                // as a total, and the individual lengths of each edge
                thisAV.currDistance = 0;
                thisAV.currEdgeDistances = [];

                // loop over each vertex in the permutation
                for (let index = 0; index < thisAV.currPath.value.length - 1;
		     index++) {
                    v1 = waypoints[thisAV.currPath.value[index]];
                    v2 = waypoints[thisAV.currPath.value[index+1]];
                    thisAV.currCoords.push([v1.lat,v1.lon]);
                    
                    // calculate distance of the current edge
                    let currEdgeDist = distanceInMiles(v1.lat,v1.lon,
                        v2.lat,v2.lon);
                    
                    // add distance of current edge to total and push
                    // it onto the distances array
                    thisAV.currDistance += currEdgeDist;
                    thisAV.currEdgeDistances.push(currEdgeDist);

                    if (thisAV.currDistance > thisAV.minDistance) {
                        jumped = true;
                        break;
                    }
                }

                // here we push each vertex onto an array to be later
                // used to create the polyline of the current path
                thisAV.currCoords.push([v2.lat,v2.lon]);
                
                // constructs the polyline using the array of points
                // we just created
                thisAV.currPoly = 
                    L.polyline(thisAV.currCoords, {
                        color: visualSettings.discovered.color,
                        opacity: 0.7,
                        weight: 3
                    });

                // add the polyline to the map
                thisAV.currPoly.addTo(map);

                updateAVControlEntry("currSum","Distance of Current Path: " +
				     thisAV.currDistance.toFixed(3) + " miles");
                if (jumped) {
                    hdxAV.nextAction = "topForLoop";
                }
		else{
                    // if we never had to break out of the loop at any
                    // point for the current path being too large that
                    // means the current path is the shortest one so
                    // far
                    hdxAV.nextAction = "setMin";
                }
                
            },
            logMessage: function(thisAV) {
                return "Calculate distance of path " + thisAV.pathCount;
            }
        },
        {
            label: 'setMin',
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // if we are setting a new minimum path, then we must
                // remove the previous minimum path from the map
                if (thisAV.shortPoly != null) {
                    thisAV.shortPoly.remove();
                }

                // remember the new min distance
                thisAV.minDistance = thisAV.currDistance;

                // copy over the current path and the distances of
                // each edge in the path into the shortest path arrays
                thisAV.shortestPath = [];
                thisAV.shortestEdgeDistances = [];
                for (let i = 0; i < thisAV.currPath.value.length; i++) {
                    thisAV.shortestPath.push(thisAV.currPath.value[i]);
                    thisAV.shortestEdgeDistances.push(thisAV.currEdgeDistances[i]);
                }

                // reconstructing the shortest path polyline and
                // adding it to the map
                thisAV.shortPoly = null;

                thisAV.shortPoly = L.polyline(thisAV.currCoords, {
                    color: visualSettings.spanningTree.color,
                    opacity: 0.7,
                    weight: 4
                });
                
                thisAV.shortPoly.addTo(map);

                updateAVControlEntry("minSum","Distance of Shortest Path: "
				     + thisAV.minDistance.toFixed(3) +
				     " miles");

                hdxAV.nextAction = 'topForLoop';
            },
            
            logMessage: function(thisAV) {
                return 'Setting path ' + thisAV.pathCount + 'as shortest';
            }
        },

        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {
                    
                    updateAVControlEntry("minSum","Distance of Shortest Path: " + thisAV.minDistance.toFixed(3) + " miles");
                    updateAVControlEntry('undiscovered','');
                    updateAVControlEntry("currSum","");

                    // rainbow constructor, used to make pattern so
                    // that users can better see the path in which the
                    thisAV.rainbowGradiant = new Rainbow();

                    // the gradient is calculated based on a range, as
                    // such we make the range as long as the number of
                    // vertices
                    thisAV.rainbowGradiant.setNumberRange(0,waypoints.length);
                    // this gradient is basically a rainbow, however
                    // it has a darker yellow and purple as they don't
                    // contrast well on white background
                thisAV.rainbowGradiant.setSpectrum('ff0000','ffc000',
						   '00ff00','00ffff',
						   '0000ff','c700ff');

                // adding num variable to waypoints so that we can
                // keep track of vertex numbers when printing out the
                // table
                for (let i = 0; i < waypoints.length; i++) {
                    waypoints[i].num = i;
                    
                }
		
                // get the list of points/coordinates from the
                // shortest path polyline
                thisAV.currCoords = thisAV.shortPoly.getLatLngs();
		
                // here we use the coordinates of the shortest path in
                // order to make each edge a different color of the
                // rainbow
                for (let i = 0; i < waypoints.length; i++) {
                    let newcolor = {
                        color: "#" + thisAV.rainbowGradiant.colorAt(
                            i),
                        textColor: "white",
                        scale: 7,
                        name: "color",
                        value: 0,
                        opacity: 1
                    }
                    updateMarkerAndTable(waypoints[thisAV.shortestPath[i]].num,
					 newcolor, 30, false);
                    let visitingLine = [];
                    visitingLine.push(thisAV.currCoords[i])
                    visitingLine.push(thisAV.currCoords[i+1]);
                    thisAV.finalPoly.push(
                        L.polyline(visitingLine, {
                            color: newcolor.color,
                            opacity: 0.7,
                            weight: 5
                        })
                    );
                }
		
                // add all the polylines to the map
                for (let i = 0; i < thisAV.finalPoly.length; i++) {
                    thisAV.finalPoly[i].addTo(map);
                }  
		
                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
		
                // remove all the current and shortest poly as we now
                // have the final rainbow poly
                thisAV.currPoly.remove();
                thisAV.currPoly = null;
                thisAV.shortPoly.remove();
                thisAV.shortPoly = null;
                
                // create the data table
                let table = '<table class="gratable"><thead>' +
                    '<tr style="text-align:center"><th>#</th><th>Label</th><th>Distance</th></tr></thead><tbody>';
		
                // add rows to the data table for each edge in the shortest path
                for (let i = 0; i < thisAV.shortestPath.length - 1;i++) {
                    table += thisAV.genTableRow(i);
                }
                table += '</tbody></table>';
		
                updateAVControlEntry("minPath",table);
                
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],
    
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        
        // we use only vertices for this algorithm
        initWaypointsAndConnections(true, false, visualSettings.undiscovered);
	
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';

        // pseudocode for the start state
        this.code += `d<sub>current</sub> &larr; 0 <br />`;
        this.code += `d<sub>min</sub> &larr; &infin;<br />`
        this.code += `path<sub>shortest</sub> &larr; null<br />`;

        // pseudocode for the top of the for loop
        this.code += '</td></tr>' +
            pcEntry(0,'for each path',"topForLoop");
        this.code += '</td></tr>' +
            pcEntry(1,'d<sub>current</sub> &larr; distance(path)<br />' +
                pcIndent(2) + 'if (d<sub>current</sub> < d<sub>min</sub>)',"findSum");
        this.code += '</td></tr>' +
            pcEntry(2,'d<sub>min</sub> &larr; d<sub>current</sub><br />' + pcIndent(4) + 'path<sub>shortest</sub> &larr; path','setMin');
	
    },

    // setup UI is called after you click the algorithm in algorithm
    // selection but before you press the visualize button, required
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        let newAO = buildWaypointSelector("startPoint", "Start Vertex", 0);

        hdxAV.algOptions.innerHTML = newAO;

	// QS parameter
	HDXQSClear(this);
	HDXQSRegisterAndSetNumber(this, "startPoint", "startPoint", 0,
				  waypoints.length - 1);

	// AVCP entries
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting);
        addEntryToAVControlPanel("currSum",visualSettings.discovered);
        addEntryToAVControlPanel("minSum",visualSettings.spanningTree);
        addEntryToAVControlPanel("minPath",visualSettings.spanningTree);
    },

    cleanupUI() {
        // we need to make sure we remove any and all polylines that
        // could be made throughout
        if (this.currPoly != null) {
            this.currPoly.remove();
        }
        if (this.shortPoly != null) {
            this.shortPoly.remove();
        }

        for (let i = 0; i < this.finalPoly.length; i++) {
            this.finalPoly[i].remove();
        }
        this.finalPoly = [];
        this.currPoly = null;
        this.shortPoly = null;

    },

    // this is necessary for HDXAV to access the code inside our state
    // machine, required
    idOfAction(action) {
	
        return action.label;
    },

    // add rows to an html table this is used to construct the table
    // at the end
    genTableRow(i) {

        return '<tr><td>' + waypoints[this.shortestPath[i]].num + ' &rarr; ' + waypoints[this.shortestPath[i+1]].num + '</td><td>' + waypoints[this.shortestPath[i]].label +
            '</td><td>' + this.shortestEdgeDistances[i].toFixed(3) + 
            '</td></tr>';
    }    
}

// Permutation generator, such that every time permute.next() is
// called, you are guarenteed a unique permutation is visited.  This
// generator has the noticable downside that given lengths of edges
// are the same going forwards as backwards then this generator is
// going to make us iterate over twice as many permutations, and the
// latter half is not simply the former but with all permutations in
// reverse.  It currently does the job but if someone else can find a
// better generator that would be great.
function* HDXTSPpermute(permutation) {
    var length = permutation.length,
        c = Array(length).fill(0),
        i = 1, k, p;
    
    yield permutation.slice();
    while (i < length) {
	if (c[i] < i) {
            k = i % 2 && c[i];
            p = permutation[i];
            permutation[i] = permutation[k];
            permutation[k] = p;
            ++c[i];
            i = 1;
            yield permutation.slice();
	}
	else {
            c[i] = 0;
            ++i;
	}
    }
}

function HDXfactorial(n) {
    let k = 1;
    for (let i = 1; i <= n; i++) {
        k *= i;
    }
    return k;
}
