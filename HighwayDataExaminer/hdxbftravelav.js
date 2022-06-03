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

    highlightPoly: [],

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

                thisAV.currPath = null;

                thisAV.shortestPath = null;


            
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
                thisAV.currPath = thisAV.permutationGenerator.next();
                if(!thisAV.currPath.done){

                    thisAV.currPath.value.push(thisAV.startVertex);
                    thisAV.currPath.value.splice(0,0,thisAV.startVertex);

                    updateAVControlEntry("undiscovered", thisAV.pathsRemaining + ' paths not yet visited');
                    
                    hdxAV.nextAction = 'findSum';
                } else {
                    hdxAV.nextAction = 'cleanup';
                }
            
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

                let jumped = false;
                let v1;
                let v2;
                thisAV.currDistance = 0;
                for(let index = 0; index < thisAV.currPath.value.length - 1; index++){
                    v1 = waypoints[thisAV.currPath.value[index]];
                    v2 = waypoints[thisAV.currPath.value[index+1]];
                    thisAV.currDistance += distanceInMiles(v1.lat,v1.lon,
                        v2.lat,v2.lon);

                    if(thisAV.currDistance > thisAV.minDistance){
                        jumped = true;
                        break;
                    }
                }

                updateAVControlEntry("currSum","Distance of Current Path: " + thisAV.currDistance.toFixed(2) + " miles");
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
                
                thisAV.minDistance = thisAV.currDistance;
                thisAV.shortestPath = thisAV.currPath;

                updateAVControlEntry("minSum","Distance of Shortest Path: " + thisAV.minDistance.toFixed(2) + " miles");

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
                    


                    hdxAV.nextAction = "DONE";
                    hdxAV.iterationDone = true;

                    /*here is a loop where we remove all the polylines from the map
                        note this is not the same as popping the polylines
                        */
                    for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                        thisAV.highlightPoly[i].remove();
                    }
                    
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
            pcEntry(0,'for each path)',"topForLoop");
        this.code += '</td></tr>' +
            pcEntry(1,'sum &larr; distance(path)<br />' +
                pcIndent(2) + 'if(currDistance < minDistance)',"checkSum");
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

        let newAO = 'Start Vertex <input type="number" id="startVertex" min="2" max="' 
        + (waypoints.length - 1) + '" value="0">';

        hdxAV.algOptions.innerHTML = newAO;

        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting);
        addEntryToAVControlPanel("currSum",visualSettings.discovered);
        addEntryToAVControlPanel("minSum",visualSettings.spanningTree);
    },

    cleanupUI() {
        for(var i = 0; i < this.highlightPoly.length; i++){
            this.highlightPoly[i].remove();
        }
        this.highlightPoly = [];

    },

    //this is necessary for HDXAV to access the code inside our state machine, required
    idOfAction(action) {
	
        return action.label;
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


/*this in the object for the permutation constructor. Basically you start with a list of points, and each next() returns 
the next permutation in heap's algorithm
*/
function permutationGenerator(start,numVertices){
    this.start = start;
    this.n = numVertices - 1;
    this.maxPermutation = Math.factorial(numVertices - 1);
    this.count = 0;
    this.positionCode = 0;

    //contains waypoints objects
    this.currentPath = [];
    this.returnPath = [];
    
    this.hasNext = function(){
        return this.count != this.maxPermutation;
    }

    this.next = function(){
        this.count++;
        return this.get();
    }

    this.remove = function(){
        this.count++;
    }

    this.get = function(){
        if(this.hasNext()){
            if(this.count == 0){
                this.returnPath.push(this.start);
                //this is using the spread operator which allows me to concatenate the list to the end
                this.returnPath.push(...currentPath);
                this.returnPath.push(this.start);

                return this.returnPath;
            } else {
                this.positionCode = count;
                for(let position = this.n; position > 0; position--){
                    this.returnPath = [];
                    let selected = this.positionCode / Math.factorial(position - 1);
                    this.returnPath.push(currentPath[selected]);
                    this.positionCode %= Math.factorial(position-1)
                    this.returnPath.push(...currentPath.slice(0,selected));
                    this.returnPath.push(...currentPath.slice(selected,n));
                    this.currentPath = this.returnPath;
                }

                this.returnPath.splice(0,0,this.start);
                this.returnPath.push(this.start);
                return this.returnPath;

            }
        }
    }
}

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