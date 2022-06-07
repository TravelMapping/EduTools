//
// HDX Brute Force Traveling Salesman AV
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

var hdxBFTravelingSalesmanAV = {
    //entries for list of avs
    value: 'bf Traveling Salesman',

    name: "Brute Force Traveling Salesman",

    description: "This description is used to decribe the algorithm to the user. NOTE: Only use on small graphs, 10 vertices and less",

    currPoly: null,

    shortPoly: null,
    finalPoly: [],

    shortestPath: null,

    currDistances: null,
    shortestDistances: null,

    nextToCheck: -1,
    avActions : [
        {
            label: "START",
            comment: "creates bounding box and initializes fields",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                //gets the staring vertex selected by the user as an integer
                thisAV.startVertex = Number(document.getElementById("startVertex").value);


                //we want to highlight the starting vertex
                updateMarkerAndTable(thisAV.startVertex, visualSettings.startVertex, 30, false);

                thisAV.nextToCheck = -1;

                thisAV.currDistance = 0;
                thisAV.minDistance = Number.MAX_SAFE_INTEGER;

                //stores the list point
                thisAV.currPath = null;
                thisAV.shortestPath = null;

                //stores the poly lines for the current path
                thisAV.currPoly = null;
                //stores the poly lines for the shortest path
                thisAV.shortPoly = null;
                //stores the poly lines at the end
                thisAV.finalPoly = [];

                //this stores the vertices for the current polyline
                thisAV.currCoords = [];

                thisAV.currEdgeDistances = [];
                thisAV.shortestEdgeDistances = [];

                //this is to generate all the possible permutations of the path
                thisAV.permutation = [];
                for(let i = 0; i < waypoints.length;i++){
                    if(i != thisAV.startVertex) thisAV.permutation.push(i);
                }

                thisAV.permutationGenerator = permute(thisAV.permutation);

                thisAV.pathsRemaining = factorial(thisAV.permutation.length);

                updateAVControlEntry("undiscovered",thisAV.pathsRemaining + " paths not yet visited");
            
                hdxAV.nextAction = "topForLoop";
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Constructing permutation generator";
            }
        },
        {
            label: "topForLoop",
            comment: "check if we can generate another permutation path",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.nextToCheck++;
                thisAV.pathsRemaining--;

                //this generates the next permutation to check
                thisAV.currPath = thisAV.permutationGenerator.next();
                if(!thisAV.currPath.done){

                    thisAV.currPath.value.push(thisAV.startVertex);
                    thisAV.currPath.value.splice(0,0,thisAV.startVertex);

                    updateAVControlEntry("undiscovered", thisAV.pathsRemaining + ' paths not yet visited');
                    
                    hdxAV.nextAction = 'findSum';
                } else {
                    hdxAV.nextAction = 'cleanup';
                }
            
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV){
                return "Top of loop for paths, checking path " + thisAV.nextToCheck;
            }
        },

        {
            label: 'findSum',
            comment: 'we calculate the sum of the path then check if it is less than the minimum',
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                if(thisAV.currPoly != null) thisAV.currPoly.remove();
                
                thisAV.currCoords = [];

                let jumped = false;
                let v1;
                let v2;
                thisAV.currDistance = 0;
                thisAV.currEdgeDistances = [];
                //thisAV.currEdgeDistances.push(0);
                for(let index = 0; index < thisAV.currPath.value.length - 1; index++){
                    v1 = waypoints[thisAV.currPath.value[index]];
                    v2 = waypoints[thisAV.currPath.value[index+1]];
                    thisAV.currCoords.push([v1.lat,v1.lon]);
                    
                    let currEdgeDist = distanceInMiles(v1.lat,v1.lon,
                        v2.lat,v2.lon);
                    thisAV.currDistance += currEdgeDist;
                    thisAV.currEdgeDistances.push(currEdgeDist);

                    if(thisAV.currDistance > thisAV.minDistance){
                        jumped = true;
                        break;
                    }
                }
                thisAV.currCoords.push([v2.lat,v2.lon]);
                
                thisAV.currPoly = 
                    L.polyline(thisAV.currCoords, {
                        color: visualSettings.discovered.color,
                        opacity: 0.7,
                        weight: 3
                    });

                thisAV.currPoly.addTo(map);

                updateAVControlEntry("currSum","Distance of Current Path: " + thisAV.currDistance.toFixed(3) + " miles");
                if(jumped){
                    hdxAV.nextAction = "topForLoop";

                }else{
                    hdxAV.nextAction = "setMin";
                }
                
            },
            logMessage: function(thisAV){
                return "Calculate distance of path " + thisAV.nextToCheck;
            }
        },
        {
            label: 'setMin',
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                
                if(thisAV.shortPoly != null){
                    thisAV.shortPoly.remove();
                }

                thisAV.minDistance = thisAV.currDistance;

                thisAV.shortestPath = [];
                thisAV.shortestEdgeDistances = [];
                for(let i = 0; i < thisAV.currPath.value.length; i++){
                    thisAV.shortestPath.push(thisAV.currPath.value[i]);
                    thisAV.shortestEdgeDistances.push(thisAV.currEdgeDistances[i]);
                }

                
                
                thisAV.shortPoly = null;

                thisAV.shortPoly = L.polyline(thisAV.currCoords, {
                    color: visualSettings.spanningTree.color,
                    opacity: 0.7,
                    weight: 4
                });
                
                thisAV.shortPoly.addTo(map);


                updateAVControlEntry("minSum","Distance of Shortest Path: " + thisAV.minDistance.toFixed(3) + " miles");

                hdxAV.nextAction = 'topForLoop';
            },
            
            logMessage: function(thisAV){
                return 'Setting path ' + thisAV.nextToCheck + 'as shortest';
            }
        },

        {
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                    

                    updateAVControlEntry("currSum","");

                     //make rainbow for final scr
                     thisAV.rainbowGradiant = new Rainbow();
                    thisAV.rainbowGradiant.setNumberRange(0,waypoints.length);
                    thisAV.rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');

                    for(var i = 0; i < waypoints.length; i++){
                        waypoints[i].num = i;
                        
                    }

                    thisAV.currCoords = thisAV.shortPoly.getLatLngs();

                    for(var i = 0; i < waypoints.length; i++){
                        let newcolor = {
                            color: "#" + thisAV.rainbowGradiant.colorAt(
                                i),
                                textColor: "white",
                                scale: 7,
                                name: "color",
                                value: 0,
                                opacity: 1
                            }
                            updateMarkerAndTable(waypoints[thisAV.shortestPath[i]].num, newcolor, 30, false);
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
                    for(var i = 0; i < thisAV.finalPoly.length; i++){
                        thisAV.finalPoly[i].addTo(map);
                    }  


                    hdxAV.nextAction = "DONE";
                    hdxAV.iterationDone = true;

                    /*here is a loop where we remove all the polylines from the map
                        note this is not the same as popping the polylines
                        */
                
                    thisAV.currPoly.remove();
                    thisAV.currPoly = null;
                    thisAV.shortPoly.remove();
                    thisAV.shortPoly = null;
                    

                    //creating data table
                    let table = '<table class="gratable"><thead>' +
                    '<tr style="text-align:center"><th>#</th><th>Label</th><th>Distance</th></tr></thead><tbody>';

                    for(let i = 0; i < thisAV.shortestPath.length - 1;i++){
                        table += thisAV.hullTableRow(i);
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
        
        //we want only vertices for this algorithm
        initWaypointsAndConnections(true, false, visualSettings.undiscovered);

        

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';

        //pseudocode for the start state
        this.code += `currDistance &larr; 0 <br />`;
        this.code += `minDistance &larr; &infin;<br />`
        this.code += `shortestPath &larr; null<br />`;

        //pseudocode for the top of the for loop
        this.code += '</td></tr>' +
            pcEntry(0,'for each path',"topForLoop");
        this.code += '</td></tr>' +
            pcEntry(1,'sum &larr; distance(path)<br />' +
                pcIndent(2) + 'if(currDistance < minDistance)',"findSum");
        this.code += '</td></tr>' +
            pcEntry(2,'minDistance &larr; currDistance<br />' + pcIndent(4) + 'shortestPath &larr; path','setMin');

},
    //setup UI is called after you click the algorithm in algorithm selection but before you press the visualize button, required
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        let newAO = 'Start Vertex <input type="number" id="startVertex" min="0" max="' 
        + (waypoints.length - 1) + '" value="0">';

        hdxAV.algOptions.innerHTML = newAO;

        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting);
        addEntryToAVControlPanel("currSum",visualSettings.discovered);
        addEntryToAVControlPanel("minSum",visualSettings.spanningTree);
        addEntryToAVControlPanel("minPath",visualSettings.spanningTree);
    },

    cleanupUI() {
        if(this.currPoly != null){
            this.currPoly.remove();
        }
        if(this.shortPoly != null){
            this.shortPoly.remove();
        }

        for(let i = 0; i < this.finalPoly.length; i++){
            this.finalPoly[i].remove();
        }
        this.finalPoly = [];
        this.currPoly = null;
        this.shortPoly = null;

    },

    //this is necessary for HDXAV to access the code inside our state machine, required
    idOfAction(action) {
	
        return action.label;
    },

    //this code is copied from the hdxbfchav.js file for adding rows to an html table
    hullTableRow(i) {

        return '<tr><td>' + waypoints[this.shortestPath[i]].num + ' &rarr; ' + waypoints[this.shortestPath[i+1]].num + '</td><td>' + waypoints[this.shortestPath[i]].label +
            '</td><td>' + this.shortestEdgeDistances[i].toFixed(3) + 
            '</td></tr>';
    },

    //note this is currently not working
    setConditionalBreakpoints(name) {
        let max = waypoints.length-1;
        let temp = HDXCommonConditionalBreakpoints(name);
        if (temp != "No innerHTML") {
            return temp;
        }
        switch (name) {
            case "isLeaf":
                html = createInnerHTMLChoice("boolean","isLeaf",
                                             "current quadtree is a leaf",
                                             "current quadtree is not a leaf");
                return html;
                
            }
        return "No innerHTML";
    },
    //note this is currently not working
    hasConditionalBreakpoints(name){
        let answer = HDXHasCommonConditonalBreakpoints(name);
        if (answer) {
            return true;
        }
        switch (name) {
            case "isLeaf":
                return true;
        }
        return false;
    }
}

//permutation generator
function* permute(permutation) {
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
      } else {
        c[i] = 0;
        ++i;
      }
    }
  }
  
function factorial(n){
    let k = 1;
    for(let i = 1; i <= n; i++){
        k *= i;
    }
    return k;
}