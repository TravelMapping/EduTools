//
// HDX Tarjan's Bridge Detection Algorithm
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

var hdxSimpleBridgeAV = {
    value: "Simple Bridge Detection",

    name: "Simple Bridge Detection",

    description: "Naïve algorithm that finds all bridges, an edge of a graph whose removal increases the number of connected components in the graph.",

    //loop variable that tracks which edge is currently being for being a bridge
    nextToCheck: -1,

    //this array stores integers, refering to the number of the edges found to be a bridge
    bridges: [],

    //this array is used by the depthFirstTraversal function in order to find if by removing an edge, there is still a way to get
    //from one endpoint to another using a different path
    visited: [],

    //this array is similar to visited, but instead stores edges/connections
    visitedEdges: [],

    //this stores the details of the edge that is currently being checked for whether or not it is a bridge
    //mostly used to keep track of the label of the edge
    removedEdge: null, 

    //boolean used to indicate whether or not the current removedEdge is actually a bridge, if so then go to the addBridge state
    isBridge: false,

    //this variable is used to stop dft once the other endpoint is found
    stopDFT: false,

    //vertex variables, v1 is the initial endpoint, and v2 is the endpoint we are trying to find from v1 after the edge is removed
    v1: -1,
    v2: -1,
    

    avActions : [
        {
            label: "START",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);


                thisAV.nextToCheck = -1;

                //used to track how many more edges we need to check
                thisAV.numEUndiscovered = graphEdges.length;
                thisAV.bridges = [];
                thisAV.visited = new Array(waypoints.length).fill(false);
                thisAV.visitedEdges = new Array(graphEdges.length).fill(false);
                thisAV.v1 = -1;
                thisAV.v2 = -1;
                thisAV.stopDFT;

                //numBridges is incremented every time we find a new bridge
                thisAV.numBridges = 0;

            
                updateAVControlEntry("undiscovered", graphEdges.length + " edges not yet visited");
                updateAVControlEntry("numBridges","Number of Bridges: " + thisAV.numBridges);

                hdxAV.iterationDone = true;

                hdxAV.nextAction = "topForLoop";
            },
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },

        {
            label: "topForLoop",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                //loop variable
                thisAV.nextToCheck++;

                //we by default set isBridge to be false, so when it is flagged as true, on then we will enter the isBridge state
                thisAV.isBridge = false;

                //loop condiditon, makes sure we check every single edge
                if(thisAV.nextToCheck < graphEdges.length){

                    //here we set removedEdge to the current edge being checked
                    thisAV.removedEdge = graphEdges[thisAV.nextToCheck];

                    //this line is important as this number is later pushed the the bridges array
                    //so we can keep track of the bridges between iterations 
                    thisAV.removedEdge.num = thisAV.nextToCheck;

                    hdxAV.nextAction = "removeEdge";

                    
                } else {
                    //if there are no more edges to be checked, then go to cleanup
                    hdxAV.nextAction = "cleanup";
                }
            
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV){
                return "Checking if edge #" + thisAV.nextToCheck + " is a bridge";
            }
        },

        {
            label: "removeEdge",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                updateAVControlEntry("undiscovered",(graphEdges.length - thisAV.nextToCheck - 1) + " edges not yet visited");
                updateAVControlEntry("visiting","Removed Edge: #" + thisAV.nextToCheck + " " + thisAV.removedEdge.label);

                //here we highlight the current edge being checked
                updatePolylineAndTable(thisAV.nextToCheck,
                    visualSettings.visiting,
                    false);
            
                //setting the v1 and v2 variables to the endpoints of the current edge being checked
                thisAV.v1 = thisAV.removedEdge.v1;
                thisAV.v2 = thisAV.removedEdge.v2;

                //highlights the endpoints of the removedEdge
                updateMarkerAndTable(thisAV.v1,visualSettings.v1,false);
                updateMarkerAndTable(thisAV.v2,visualSettings.v2,false);

                updateAVControlEntry("v1","v1: #" + thisAV.v1 + " " + waypoints[thisAV.v1].label);
                updateAVControlEntry("v2","v2: #" + thisAV.v2 + " " + waypoints[thisAV.v2].label);
                
                hdxAV.nextAction = "dft";
            },
            logMessage: function(thisAV){
                return "Removing edge #" + thisAV.nextToCheck + " " + graphEdges[thisAV.nextToCheck].label + " from graph";
            }
        },
        {
            label: "dft",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                
                //make sure to reset stopDFT so that the DFT does not break
                thisAV.stopDFT = false;
                //here we reset the arrays used by the depth first traversal so that each iteration is independent of each other
                thisAV.visited = new Array(waypoints.length).fill(false);
                thisAV.visitedEdges = new Array(graphEdges.length).fill(false);

                //here we call the depthFirstTraversal on the initial endpoint, hoping that we visit v2 along the way
                //if v2 is not found in visited after depthFirstTraversal finishes execution, then we know the current edge is a bridge
                thisAV.depthFirstTraversal(thisAV.v1);
                
                //here we highlight all the vertices and edges that were visited by the depth first traversal
                for(let i = 0; i < thisAV.visited.length; i++){
                    if(thisAV.visited[i] && i != thisAV.v1 && i != thisAV.v2){
                        updateMarkerAndTable(i,visualSettings.spanningTree,false);
                    }
                }
                for(let i = 0; i < thisAV.visitedEdges.length; i++){
                    if(thisAV.visitedEdges[i] && i != thisAV.nextToCheck && !thisAV.bridges.includes[i]){
                        updatePolylineAndTable(i,visualSettings.spanningTree,false);
                    }
                }
                hdxAV.nextAction = "checkContains";
            },
            logMessage: function(thisAV){
                return "Performing depth-first traversal from vertex #" + thisAV.v1 + " " + waypoints[thisAV.v1].label;
            }
        },

        {
            label: "checkContains",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                
                //if we do not find the other endpoint of the current edge, even after being removed, that means there is no other path
                //as such we know that the removedEdge is a bridge
                if(!thisAV.visited[thisAV.v2]){
                    thisAV.isBridge = true;
                    hdxAV.nextAction = "addBridge";

                } else {
                    hdxAV.nextAction = "addEdgeBack";
                }
            },
            logMessage: function(thisAV){
                return "Checking if v2 can be reached by v1 when " +  thisAV.removedEdge.label + " is removed";
            }
        },

        {
            label: "addBridge",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                //here we highlight the bridge as of making this the red color
                updatePolylineAndTable(thisAV.nextToCheck,
                    visualSettings.searchFailed,
                    false);
            
                //increment the number of bridges found
                thisAV.numBridges++;

                //records the current removedEdge as a bridge so it can be correctly highlighted future iterations
                thisAV.bridges.push(thisAV.removedEdge.num);
                updateAVControlEntry("numBridges","Number of Bridges: " + thisAV.numBridges);

                
            
                hdxAV.nextAction = "addEdgeBack";
            },
            logMessage: function(thisAV){
                return "Edge #" + thisAV.nextToCheck + " " + thisAV.removedEdge.label + " found to be bridge";
            }
        },


        {
            label: "addEdgeBack",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                //here is a bunch of reverting of highlights we did from the dft

                if(!thisAV.isBridge){
                    updatePolylineAndTable(thisAV.nextToCheck, visualSettings.undiscovered, false);
                }

                for(let i = 0; i < thisAV.visitedEdges.length; i++){
                    if(thisAV.visitedEdges[i]){
                        updatePolylineAndTable(i,visualSettings.undiscovered,false);
                    }
                }

                for(let i = 0; i < thisAV.bridges.length; i++){
                    updatePolylineAndTable(thisAV.bridges[i],visualSettings.searchFailed,false);
                }
                ///*
                for(let i = 0; i < thisAV.visited.length; i++){
                    if(thisAV.visited[i]){
                        updateMarkerAndTable(i,visualSettings.undiscovered,false);
                    }
                }
            
                //*/

                updateMarkerAndTable(thisAV.v1,visualSettings.undiscovered,false);
                updateMarkerAndTable(thisAV.v2,visualSettings.undiscovered,false);

                hdxAV.nextAction = "topForLoop";
            },
            logMessage: function(thisAV){
                return "Adding edge #" + thisAV.nextToCheck + " " + thisAV.removedEdge.label + " back into graph";
            }
        },
        {
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                    //this removes waypoints from the data table, we do this because waypoints are not particularly interesting information
                    document.getElementById("waypoints").style.display = "none";

                    //make sure to reset all control entries, other than that, there is no polylines to account for
                    updateAVControlEntry("undiscovered",'');
                    updateAVControlEntry("visiting",'');
                    
                    updateAVControlEntry("v1",'');
                    updateAVControlEntry("v2",'');

                    hdxAV.iterationDone = "true";
                    hdxAV.nextAction = "DONE";
                    
                },
                logMessage: function(thisAV) {
                    return "Cleanup and finalize visualization";
                }
        }
    ],
    
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        initWaypointsAndConnections(true, true, visualSettings.undiscovered);

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += `bridges &larr; []<br />`;
        this.code += `visited &larr; []<br />`;
        this.code += `v1 &larr; -1<br />v2 &larr; -1<br />`;
        this.code += '</td></tr>' + pcEntry(0,"for each e in graph","topForLoop");

        this.code += '</td></tr>' + pcEntry(1,"e<sub>removed</sub> &larr; graph.remove(e)<br /> " +
        pcIndent(2) + "v1 &larr; e<sub>removed</sub>.v1<br />" + 
        pcIndent(2) + "v2 &larr; e<sub>removed</sub>.v2","removeEdge");

        this.code += '</td></tr>' + pcEntry(1,"visited &larr; graph.dft(v1)","dft");
        this.code += '</td></tr>' + pcEntry(1,"if(visited not contain v2)","checkContains")
        this.code += '</td></tr>' + pcEntry(2,"bridges.add(e<sub>removed</sub>)","addBridge");
        this.code += '</td></tr>' + pcEntry(1,"graph.add(e<sub>removed</sub>)","addEdgeBack");

},
    //setup UI is called after you click the algorithm in algorithm selection but before you press the visualize button, required
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        hdxAV.algOptions.innerHTML = '';

        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting);
        addEntryToAVControlPanel("v1",visualSettings.v1);
        addEntryToAVControlPanel("v2",visualSettings.v2);
        addEntryToAVControlPanel("numBridges",visualSettings.searchFailed);

       
    },
    //cleanupUI is called when you select a new AV or map when after running an algorithm, required
    cleanupUI() {
        //here we make sure that waypoints are shown in the datatable again
        document.getElementById("waypoints").style.display = "";
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
        
        return "No innerHTML";
    },
    //note this is currently not working
    hasConditionalBreakpoints(name){
        let answer = HDXHasCommonConditionalBreakpoints(name);
        if (answer) {
            return true;
        }
        return false;
    },

    //this is the dft algorithm that is used, it takes a the num of a vertex as input
    depthFirstTraversal(i){

        if(!this.stopDFT){
            //labelling the vertex as having been visited
            this.visited[i] = true;

            //this variable holds the num of the edge that is going to be travelled along, this is done
            let connection = null;

            //these variables hold the endpoints of the edge we are going to be traversing over
            let dv1;
            let dv2;

            //loop over all edges in a vertex's edge list
            for(let j = 0; j < waypoints[i].edgeList.length; j++){

                //getting num of edge in vertex i's edge list
                connection = waypoints[i].edgeList[j].edgeListIndex;

                //make sure that the current connection is the edge we are already checking to be a bridge
                if(this.nextToCheck != connection){

                    //setting endpoints
                    dv1 = graphEdges[connection].v1;
                    dv2 = graphEdges[connection].v2;

                    //if the endpoint of the current connection is not the endpoint of the bridge we have been looking for
                    //then we continue the dft, if not then we set v2 as being visited. Not strictly necessary but boosts efficency.
                    if(dv2 != this.v2){

                        //these 2 if statements are used to make sure that edge we are not calling dft
                        //on a vertex we have already visited
                        if(!this.visited[dv1] && dv2 == i){
                            this.visitedEdges[connection] = true;
                            this.depthFirstTraversal(dv1)
                        } else if (!this.visited[dv2] && dv1 == i){
                            this.visitedEdges[connection] = true;
                            this.depthFirstTraversal(dv2);
                        }
                    } else {
                        //if the endpoint in the current connection is the endpoint of the edge we are checking is a bridge
                        //then we mark the end point as visited, and because it has been visited by another path, that means
                        //the edge is not a bridge, so we no longer have to call dft
                        this.stopDFT = true;
                        this.visited[this.v2] = true;
                    }
                }
            }
        }
    }

}
