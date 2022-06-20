//
// HDX Tarjan's Bridge Detection Algorithm
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

var hdxSimpleBridgeAV = {
    value: "Simple Bridge Detection Algorithm",

    name: "Simple Bridge Detection Algorithm",

    description: "Naïve algorithm that finds all bridges, an edge of a graph whose removal increases the number of connected components in the graph.",

    highlightPoly: [],

    //loop variable that tracks which point is currently being operated upon
    nextToCheck: -1,

    bridges: [],
    visited: [],
    visitedEdges: [],
    removedEdge: null, 
    isBridge: false,

    //vertex variables
    v1: -1,
    v2: -1,
    

    avActions : [
        {
            label: "START",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);


                thisAV.nextToCheck = -1;

                thisAV.numEUndiscovered = graphEdges.length;
                thisAV.bridges = [];
                thisAV.visited = new Array(waypoints.length).fill(false);
                thisAV.visitedEdges = new Array(graphEdges.length).fill(false);
                thisAV.v1 = -1;
                thisAV.v2 = -2;
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

                thisAV.nextToCheck++;
                thisAV.isBridge = false;

                if(thisAV.nextToCheck < graphEdges.length){
                    thisAV.removedEdge = graphEdges[thisAV.nextToCheck];
                    thisAV.removedEdge.num = thisAV.nextToCheck;

                    hdxAV.nextAction = "removeEdge";
                } else {
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

                updatePolylineAndTable(thisAV.nextToCheck,
                    visualSettings.visiting,
                    false);
            
                thisAV.v1 = thisAV.removedEdge.v1;
                thisAV.v2 = thisAV.removedEdge.v2;

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

                thisAV.visited = new Array(waypoints.length).fill(false);
                thisAV.visitedEdges = new Array(graphEdges.length).fill(false);
                thisAV.depthFirstTraversal(thisAV.v1);
                
                ///*
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
                //*/
            },
            logMessage: function(thisAV){
                return "Performing depth-first traversal from vertex #" + thisAV.v1 + " " + waypoints[thisAV.v1].label;
            }
        },

        {
            label: "checkContains",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                
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

                updatePolylineAndTable(thisAV.nextToCheck,
                    visualSettings.searchFailed,
                    false);
            

                thisAV.numBridges++;
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
        //remove all the polylines made by any global bounding box
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
        //let answer = HDXHasCommonConditonalBreakpoints(name);
        //if (answer) {
        //    return true;
        //}
        return false;
    },
    depthFirstTraversal(i){
        this.visited[i] = true;
        let connection = null;
        let dv1;
        let dv2;
        for(let j = 0; j < waypoints[i].edgeList.length; j++){
            connection = waypoints[i].edgeList[j].edgeListIndex;
            if(this.nextToCheck != connection){
                dv1 = graphEdges[connection].v1;
                dv2 = graphEdges[connection].v2;
                if(dv2 != this.v2){
                    if(!this.visited[dv1] && dv2 == i){
                        this.visitedEdges[connection] = true;
                        this.depthFirstTraversal(dv1)
                    } else if (!this.visited[dv2] && dv1 == i){
                        this.visitedEdges[connection] = true;
                        this.depthFirstTraversal(dv2);
                    }
                } else {
                    this.visited[this.v2] = true;
                }
            }
        }
    }

}
