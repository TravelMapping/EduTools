//
// HDX Compute Partitioning Stats
//
// METAL Project
//
// Primary Authors: Michael Plekan
//

var hdxComputePartStats = {
    //entries for list of avs
    value: 'Compute Part Stats',

    //name here is what is shown in the drop down menu when selecting from different algorithms
    name: "Compute Partition Stats",

    description: "This computes the stats of the Partitioning being used<br/>NOTE: Only works if Partition data has been loaded or calculated",

    avActions : [
        {
            //label represents the current state in state machine you are accessing
            //if you want the psuedocode to highlight when 
            label: "START",
            comment: "Adding stats to page",
            code: function(thisAV){
                  //checking to see if the partittion data is there
                 if (hdxPart.parts==null || hdxPart.parts.length == 0 || hdxPart.parts.length != hdxPart.numParts) {alert("Error: Partition data not found."); console.error("Error: Partition data not found");}
                 else {
                 //Calculating stats
                 hdxPart.partitionAnalysis();
                 
                 //Adding table and coloring points(the work is done in hdxPart.styling())
                 addEntryToAVControlPanel("stats", visualSettings.pseudocodeDefault);
                 updateAVControlEntry("stats", hdxPart.styling());
                 }
                 hdxAV.iterationDone = true;
                hdxAV.nextAction = "cleanup";
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Adding stats to page";
            }
        },
        {
                label: "cleanup",
                comment: "cleanup",
                code: function(thisAV) {
                    hdxAV.nextAction = "DONE";
                    hdxAV.iterationDone = true;                    
                },
                logMessage: function(thisAV) {
                    return "Cleanup and finalize";
                }
        }
    ],
    
    //prepToStart is a necessary function for everyAV and is called when you hit visualize but before you hit start
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        //this function determines if you are using vertices (first param), edges (second param), and color (this gives black)
        initWaypointsAndConnections(true, true, visualSettings.undiscovered);

        this.code =''; //'<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
},
    //setup UI is called after you click the algorithm in algorithm selection but before you press the visualize button, required
    setupUI() {
        //sets up HTML for options
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");        
        hdxAV.algOptions.innerHTML =hdxPart.colorHtml();
       
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