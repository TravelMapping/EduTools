//
// HDX Compute Partitioning Stats
//
// METAL Project
//
// Primary Authors: Michael Plekan
//

//this variable name is used to store the document containaing all the necessary fields, functions, and states for a given AV
//variable must be pushed to the this.avList in the hdxav.js file
//additionally, the file of this AV must be linked in the index.php file
var hdxComputePartStats = {
    //entries for list of avs
    value: 'Sample',

    //name here is what is shown in the drop down menu when selecting from different algorithms
    name: "Compute Stats",

    //description is what is shown after the user selects the algorithm in the drop down 
    //but before they press the visualise button
    description: "This description is used to decribe the algorithm to the user. Include note if something is broken",

    avActions : [
        {
            //label represents the current state in state machine you are accessing
            //if you want the psuedocode to highlight when 
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV){
                 hdxPart.partitionAnalysis();
                 hdxAV.iterationDone = true;
                hdxAV.nextAction = "cleanup";
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },
        {
            //all avs need a cleanup state from which things such as additional polylines and global variables are reset
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
    
    //prepToStart is a necessary function for everyAV and is called when you hit visualize but before you hit start
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        //this function determines if you are using vertices (first param), edges (second param), and color (this gives black)
        initWaypointsAndConnections(true, true, visualSettings.undiscovered);

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode"></td></tr>';
},
    //setup UI is called after you click the algorithm in algorithm selection but before you press the visualize button, required
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");        
        hdxAV.algOptions.innerHTML =colorHtml();
       
    },
    //cleanupUI is called when you select a new AV or map when after running an algorithm, required
    cleanupUI() {
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
                html = createInnerHTMLChoice("boolean","",
                                             "",
                                             "");
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
        return false;
    }
    //here add any additional functions you may need to access in your AV

}