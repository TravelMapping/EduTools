//
// HDX Compute Partitioning Stats
//
// METAL Project
//
// Primary Authors: Michael Plekan
//

const hdxComputePartStats = {
    // entries for list of avs
    value: 'partstats',

    name: "Compute Partition Stats",

    description: "Compute partition quality stats.  Partitioned data must be loaded or calculated before using this AV.",

    avActions : [
        {
            label: "START",
            comment: "Adding stats to page",
            code: function(thisAV) {
                // checking that we have partitioned data
                if (hdxPart.parts == null ||
		    hdxPart.parts.length == 0 ||
		    hdxPart.parts.length != hdxPart.numParts) {
		    alert("Error: Partition data not found, load or compute partitons first.");
		    console.error("Error: Partition data not found");
		}
                else {
                 // Calculating stats
                    hdxPart.partitionAnalysis();
                    
                    // Adding table and coloring points(the work is
                    // done in hdxPart.styling())
                    addEntryToAVControlPanel("stats",
					     visualSettings.pseudocodeDefault);
                    updateAVControlEntry("stats", hdxPart.styling());
                }
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "cleanup";
            },
            logMessage: function(thisAV) {
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
    
    // prepToStart is a necessary function for everyAV and is called
    // when you hit visualize but before you hit start
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";

	// show both vertices and edges
        initWaypointsAndConnections(true, true, visualSettings.undiscovered);

        this.code =''; //'<table class="pseudocode"><tr id="START"
		       //class="pseudocode"><td class="pseudocode">';
    },
    
    setupUI() {
        // sets up HTML for options
        const algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");        
        hdxAV.algOptions.innerHTML = hdxPart.colorHtml();
    },

    cleanupUI() {
    },
    
    idOfAction(action) {
        return action.label;
    }
}
