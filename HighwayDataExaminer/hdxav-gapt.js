//Use of Call stack to simulate a recursive algorithm. (usedVertices, availableVertices, loopIteration)

//
// HDX Algorithm Visualization Get All Possible Traversals File
//
// METAL Project
//
// Primary Authors: (Insert names here)
//

// This global variable refers to the object containaing all the
// necessary fields, functions, and states for a given AV.  This
// variable must be pushed to the this.avList in the hdxav.js file,
// and the file of this AV must be included in the index.php file
const hdxGAPTAV = {
    value: 'gapt',
    name: "Get All Possible Traversals",
    description: "This algorithm generates all of the possible traversals of a graph starting from a single point",

    // vertices, edges
    useV: true,
    useE: true,

	callStack: null,
	visiting: 0,
	
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

                thisAV.traversals=[];
                thisAV.usedVertices=[];
                thisAV.usedVertices.push(document.getElementById("startPoint").value);
                thisAV.availableVertices=[];
                thisAV.availableVertices=hdxGAPTAV.newAvailableVertices(thisAV.availableVertices, thisAV.usedVertices, getAdjacentPoints(thisAV.usedVertices[0]));
            	thisAV.callStack = [];
                // Note that the fields of the AV's object must be
                // accessed through "thisAV" rather than "this"
                thisAV.nextToCheck = -1;
            
                // each action must set the nextAction field to the
                // label of the next action to be performed
                hdxAV.nextAction = "topOfFunction";
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "Doing some setup stuff";
            }
        },
        {
            label: "topOfFunction",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
                if(thisAV.availableVertices.length==0){
                	hdxAV.nextAction = "baseCase";
                }else{
                	thisAV.loopIteration=-1;
                	hdxAV.nextAction = "topOfLoop";
                }
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "";
            }
        },
        {
            label: "topOfLoop",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

				thisAV.loopIteration++;
				hdxAV.nextAction = "recursion";
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "";
            }
        },
        {
            label: "recursion",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
				let tmpAvails=hdxGAPTAV.newAvailableVertices(thisAV.availableVertices, thisAV.usedVertices, getAdjacentPoints(thisAV.availableVertices[thisAV.loopIteration]));
				let tmpUses=hdxGAPTAV.newTraversalWay(thisAV.usedVertices, thisAV.availableVertices[thisAV.loopIteration]);
				tmpAvails.splice(thisAV.loopIteration,1);
				let snapshot=[thisAV.usedVertices, thisAV.availableVertices, thisAV.loopIteration];
				thisAV.callStack.push(snapshot);
				thisAV.availableVertices=tmpAvails;
				thisAV.usedVertices=tmpUses;
				hdxAV.nextAction = "topOfFunction";
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "";
            }
        },
        {
            label: "baseCase",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
            
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
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "";
            }
        },
        {
            label: "collectArr",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
				let snapshot=thisAV.callStack.pop();
				thisAV.usedVertices=snapshot[0];
				thisAV.availableVertices=snapshot[1];
				thisAV.loopIteration=snapshot[2];
				if(thisAV.loopIteration<thisAV.availableVertices.length-1){
					hdxAV.nextAction = "topOfLoop";
				}else{
					hdxAV.nextAction = "bottomOfFunction"
				}
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "";
            }
        },
        {
            label: "bottomOfFunction",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

				if(thisAV.callStack.length>0){
					hdxAV.nextAction = "collectArr";
				}else{
					hdxAV.nextAction = "cleanup"
				}
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "";
            }
        },
        {
            //global variables are reset
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
    prepToStart() {
	
        // Build HTML for the pseudocode, which is an HTML table, with
        // each state being a different row.
	
        // Each row must be labeled the same EXACT name as the label
        // in the state machine.
	
	// see existing AVs for examples of how this is built
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += 'usedVert[] &larr; startState </td></tr>'
        this.code += pcEntry(0, ["gapt(usedVerts[], availableVertices[])", "&emsp;traversals[][]"], "topOfFunction");
        this.code += pcEntry(1, ["if availableVertices.length = 0", "&emsp;return usedVerts[]"], "baseCase");
        this.code += pcEntry(1, "for each a in availableVertices do", "topOfLoop");
        this.code += pcEntry(2, "traversals[]+=gapt(usedVerts+a, availableVertices-a+a.availableVertices)", "recursion");
        this.code += pcEntry(1, "return traversals[][]", "bottomOfFunction")
    },
    // setupUI is a required function that is called after you click
    // the algorithm in algorithm selection but before you press the
    // visualize button
    setupUI() {

        let newAO=buildWaypointSelector("startPoint", "Start Vertex", 0) +
            "<br />";

        hdxAV.algOptions.innerHTML = newAO;

        // Insert entries into the AV control panel to display data
        // structures and variables as the AV is executing
        hdxAVCP.add("found", visualSettings.discovered);
        const foundEntry = '<span id="found">Number of paths: 0</span>' +
            '<table id="foundEntries" style="width:100%;"></table>';
        hdxAVCP.update("found", foundEntry);
       
    },
    // cleanupUI is a required function, called when you select a new
    // AV or map when after running an algorithm
    cleanupUI() {
        // for example, remove all the polylines made by any global
        // bounding box
    },

    // required function that is most often just what is shown here,
    // but see examples like vsearch for cases where this is not the
    // case (actions that are shared by multiple lines of code)
    idOfAction(action) {
	
        return action.label;
    },
    
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
    newTraversalWay(usedVertices, currentVertice){
    	let newTraversal=[]
    	for(i=0;i<usedVertices.length;i++){
    		newTraversal.push(usedVertices[i]);
    	}
    	newTraversal.push(currentVertice)
    	return newTraversal;
    }
}
