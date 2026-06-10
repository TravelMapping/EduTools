//
// HDX Algorithm Visualization Get All Possible Traversals File
//
// METAL Project
//
// Primary Authors: (Insert names here)
//

// 
const hdxGAPTAV = {
    value: 'gapt',
    name: "Get All Possible Traversals",
    description: "This algorithm generates all of the possible traversals of a graph starting from a single point",

    // vertices, edges
    useV: true,
    useE: true,

	//Data structure used to simulate recursive calls
	callStack: null,
	
	// Array to contain all possible traversal, with each traversal being an array of Vertices
	traversals:[],
	
	// Array to contain all the the vertices that have already been used in the current graph traversal
	usedVertices:[],
	
	//Array to contain all of the vertices that have been discovered and can be added to the traversal
	availableVertices:[],
	
	//Tracks current loop count
	loopIteration:0,
	
    // loop variable that tracks which point is currently being operated upon
    nextToCheck: -1,

    // The avActions array defines all of the actions of the AV
    avActions : [
        {
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                //Initializes variables
                thisAV.traversals=[];
                thisAV.usedVertices=[];
                thisAV.usedVertices.push(document.getElementById("startPoint").value);
                updateMarkerAndTable(thisAV.usedVertices[0],
				     visualSettings.startVertex, 30, false);
                thisAV.availableVertices=[];
                thisAV.availableVertices=hdxGAPTAV.newAvailableVertices(thisAV.availableVertices, thisAV.usedVertices, getAdjacentPoints(thisAV.usedVertices[0]));
            	thisAV.callStack = [];
                thisAV.nextToCheck = -1;
            
                hdxAV.nextAction = "topOfFunction";
            },
            logMessage: function(thisAV) {
                return "Initializing";
            }
        },
        {
            label: "topOfFunction",
            comment: "setting next action to either baseCase or to enter into the loop",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
                if(thisAV.availableVertices.length==0){
                	hdxAV.nextAction = "baseCase";
                }else{
                	thisAV.loopIteration=-1;
                	hdxAV.nextAction = "topOfLoop";
                }
            },
            logMessage: function(thisAV) {
                return "setting nextAction to "+hdxAV.nextAction;
            }
        },
        {
            label: "topOfLoop",
            comment: "increments loop count, sets nextAction to recursion",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

				// increment loop count
				thisAV.loopIteration++;
				hdxAV.nextAction = "recursion";
            },
            logMessage: function(thisAV) {
                return "loop count: "+thisAV.loopIteration;
            }
        },
        {
            label: "recursion",
            comment: "simulates a recursive call, updates variables",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
				// updates usedVertices and availableVertices arrays, saves old contents
				let tmpAvails=hdxGAPTAV.newAvailableVertices(thisAV.availableVertices, thisAV.usedVertices, getAdjacentPoints(thisAV.availableVertices[thisAV.loopIteration]));
				let tmpUses=hdxGAPTAV.newTraversalWay(thisAV.usedVertices, thisAV.availableVertices[thisAV.loopIteration]);
				tmpAvails.splice(thisAV.loopIteration,1);
				let snapshot=[thisAV.usedVertices, thisAV.availableVertices, thisAV.loopIteration];
				thisAV.callStack.push(snapshot);
				thisAV.availableVertices=tmpAvails;
				thisAV.usedVertices=tmpUses;
				
				// updates map 
				for(i=1;i<thisAV.usedVertices.length-1;i++){
					updateMarkerAndTable(thisAV.usedVertices[i], visualSettings.discovered, 30, false);
				}
				updateMarkerAndTable(thisAV.usedVertices[thisAV.usedVertices.length-1], visualSettings.visiting, 30, false);
				hdxAV.nextAction = "topOfFunction";
            },
            logMessage: function(thisAV) {
                return "availableVertices: ["+thisAV.availableVertices+"] <br> usedVertices: ["+thisAV.usedVertices+"]";
            }
        },
        {
            label: "baseCase",
            comment: "a new traversal has been found",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
            
				// updates AVCP with new path found, incrementing count
				let newPath=document.createElement("tr");
				let traversalStr="";
				for(i=0;i<thisAV.usedVertices.length;i++){
					if(i==0){
						traversalStr = thisAV.usedVertices[0];
					}else{
						traversalStr += ", " + thisAV.usedVertices[i];
					}
				}
				newPath.innerHTML='<td style="background-color:white; color:black;"><center>'+traversalStr+'</center></td>';
				thisAV.traversals.push(thisAV.usedVertices);
				document.getElementById("found").innerText="Number of paths: "+thisAV.traversals.length;
				document.getElementById("foundEntries").appendChild(newPath);
				
                if(thisAV.callStack.length>0){
					hdxAV.nextAction = "collectArr";
				}else{
					hdxAV.nextAction = "cleanup"
				}
            },
            logMessage: function(thisAV) {
                return "new traversal: "+thisAV.traversals[thisAV.traversals.length-1];
            }
        },
        {
            label: "collectArr",
            comment: "simulates going back up a level in the recursion",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
				// restoring older version of availableVertices and usedVertices
				let snapshot=thisAV.callStack.pop();
				thisAV.usedVertices=snapshot[0];
				thisAV.availableVertices=snapshot[1];
				thisAV.loopIteration=snapshot[2];
				
				// update map
				for(i=0;i<waypoints.length;i++){
					updateMarkerAndTable(i,
				    	visualSettings.undiscovered, 30, false);
				}for(i=1;i<thisAV.usedVertices.length-1;i++){
					updateMarkerAndTable(thisAV.usedVertices[i],
				    	visualSettings.discovered, 30, false);
				}
				updateMarkerAndTable(thisAV.usedVertices[0],
				     visualSettings.startVertex, 30, false);
				updateMarkerAndTable(thisAV.usedVertices[thisAV.usedVertices.length-1],
				     visualSettings.visiting, 30, false);

				if(thisAV.loopIteration<thisAV.availableVertices.length-1){
					hdxAV.nextAction = "topOfLoop";
				}else{
					hdxAV.nextAction = "bottomOfFunction"
				}
            },
            logMessage: function(thisAV) {
                return "availableVertices: ["+thisAV.availableVertices+"] <br> usedVertices: ["+thisAV.usedVertices+"]";
            }
        },
        {
            label: "bottomOfFunction",
            comment: "sets nextAction",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

				if(thisAV.callStack.length>0){
					hdxAV.nextAction = "collectArr";
				}else{
					hdxAV.nextAction = "cleanup"
				}
            },
            logMessage: function(thisAV) {
                return "nextAction = "+hdxAV.nextAction;
            }
        },
        {
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                    
                    hdxAV.nextAction = "DONE";
                    hdxAV.iterationDone = true;
                    
                },
                logMessage: function(thisAV) {
                    return "Cleanup and finalize visualization";
                }
        }
    ],

    // prepToStart is a required function which is called when you hit
    // visualize but before you hit start
    // sets up pseudocode
    prepToStart() {
	
        // Build HTML for the pseudocode, which is an HTML table, with
        // each state being a different row.
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += 'usedVert[] &larr; startState </td></tr>'
        this.code += pcEntry(0, ["gapt(usedVerts[], availableVertices[])", "&emsp;traversals[][]"], "topOfFunction");
        this.code += pcEntry(1, ["if availableVertices.length = 0", "&emsp;return usedVerts[]"], "baseCase");
        this.code += pcEntry(1, "for each a in availableVertices do", "topOfLoop");
        this.code += pcEntry(2, "traversals[]+=gapt(usedVerts+a, availableVertices-a+a.availableVertices)", "recursion");
        this.code += pcEntry(1, "return traversals[][]", "bottomOfFunction")
    },
    // set up UI entries for getting all possible traversals
    setupUI() {

        let newAO=buildWaypointSelector("startPoint", "Start Vertex", 0) +
            "<br />";

        hdxAV.algOptions.innerHTML = newAO;

        // adds a section that gives the number of paths found and list the traversals
        hdxAVCP.add("found", visualSettings.discovered);
        const foundEntry = '<span id="found">Number of paths: 0</span>' +
            '<table id="foundEntries" style="width:100%;"></table>';
        hdxAVCP.update("found", foundEntry);
       
    },
    // remove any changes made
    cleanupUI() {
        // for example, remove all the polylines made by any global
        // bounding box
    },
    idOfAction(action) {
	
        return action.label;
    },
    
    // returns a new array of available vertices, adding adjacent vertices of the current
    // vertex with currently availableVertices not allowing vertices either in usedVertices
    // array or availableVertices
    newAvailableVertices(currAvails, usedVerts, candidateAvails){
    	let discards=[];
    	let newAvails=[];
    	for(i=0;i<currAvails.length;i++){
    		discards.push(currAvails[i]);
    		newAvails.push(currAvails[i]);
    	}
    	for(i=0;i<usedVerts.length;i++){
    		discards.push(usedVerts[i]);
    	}
    	for(i=0;i<candidateAvails.length;i++){
	    	let newAvail=true;
	    	for(x=0;x<discards.length;x++){
	    		if(candidateAvails[i]==discards[x]){
	    			newAvail=false;
	    			x=discards.length;
	    		}
	    	}
	    	if(newAvail){
	    		newAvails.push(candidateAvails[i]);
	    	}
    	}
    	return newAvails;
    },
    
    // returns a new array of traversed vertices including exiting list and the new point
    newTraversalWay(usedVertices, currentVertice){
    	let newTraversal=[]
    	for(i=0;i<usedVertices.length;i++){
    		newTraversal.push(usedVertices[i]);
    	}
    	newTraversal.push(currentVertice)
    	return newTraversal;
    }
}