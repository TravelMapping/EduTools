//
// HDX Algorithm Visualization Template File
//
// METAL Project
//
// Primary Authors: (Insert names here)
//

// This global variable refers to the object containaing all the
// necessary fields, functions, and states for a given AV.  This
// variable must be pushed to the this.avList in the hdxav.js file,
// and the file of this AV must be included in the index.php file
const hdxTemplateAV = {
    // short name for list of avs, will be used for the av= QS parameter value
    value: 'template',

    // Name as shown in the drop down menu when selecting from
    // different algorithms
    name: "Template",

    // Description as shown after the user selects the algorithm in
    //the drop down but before they press the "visualize" button
    description: "This description is used to decribe the algorithm to the user.",

    // Next, define AV-specific fields that are needed across multiple
    // actions and other AV-specific functions

    // Bwlow are some common examples

    // list of polylines, any line you manually insert onto the HDX to
    // aid the AV.  Often used in vertex only algorithms, these
    // polylines must be removed during cleanup
    highlightPoly: [],

    // loop variable that tracks which point is currently being operated upon
    nextToCheck: -1,

    // The avActions array defines all of the actions of the AV
    avActions : [
        {
            // label represents the current state in state machine
	    // the initial state must be labeled as "START"
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // Note that the fields of the AV's object must be
                // accessed through "thisAV" rather than "this"
                thisAV.nextToCheck = -1;

                //this is typically used to track progress or how many
                //times to loop through the algorithm
                thisAV.numVUndiscovered = waypoints.length,
            
                // each action must set the nextAction field to the
                // label of the next action to be performed
                hdxAV.nextAction = "topForLoop";
            },
            // define the message displayed above the pseudocode when
            // running at slow enough speeds
            logMessage: function(thisAV) {
                return "Doing some setup stuff";
            }
        },
        {
            // All AVs need a cleanup state from which things such as
            // additional polylines and global variables are reset
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                    
                    hdxAV.nextAction = "DONE";
                    hdxAV.iterationDone = true;

                    /* here is a sample loop where we remove all the
                        polylines from the map note this is not the
                        same as popping the polylines
                        */
                    for (let i = 0; i < thisAV.highlightPoly.length; i++) {
                        thisAV.highlightPoly[i].remove();
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "Cleanup and finalize visualization";
                }
        }
    ],
    
    // prepToStart is a required function which is called when you hit
    // visualize but before you hit start
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
	
        // this function determines if you are using vertices (first
        // param), edges (second param), and color (this gives black)
        initWaypointsAndConnections(true, false, visualSettings.undiscovered);

        // Build HTML for the pseudocode, which is an HTML table, with
        // each state being a different row.
	
        // Each row must be labeled the same EXACT name as the label
        // in the state machine.
	
	// see existing AVs for examples of how this is built
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
},
    // setupUI is a required function that is called after you click
    // the algorithm in algorithm selection but before you press the
    // visualize button
    setupUI() {
        const algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        let newAO;
        // Build HTML for AV options, which may consist of checkboxes,
        // scrolling number boxes, or a comboboxes, see existing AVs for
	// many examples

        hdxAV.algOptions.innerHTML = newAO;

        // Insert entries into the AV control panel to display data
        // structures and variables as the AV is executing
        hdxAVCP.add("undiscovered", visualSettings.undiscovered); 
        hdxAVCP.add("visiting", visualSettings.visiting)
       
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
    }
    
    // any additional AV-specific functions may be added to the AV's
    // object here
}
