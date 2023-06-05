//
// HDX Edge extremes search AV
//
// METAL Project
//
// Primary Author: Jim Teresco, initial implementation by Razie Fathi
//

// function to create the table entry for the leader for
// label-based comparisons for edges
function edgeLabelLeaderString(label, edgeNum) {
    
    return label + ':<br />#' + edgeNum +
        ' (length ' + graphEdges[edgeNum].label.length
	+ ') ' + graphEdges[edgeNum].label;
}

// function to create the table entry for the leader for
// edge-length-based comparisons for edges
function edgeLengthLeaderString(label, edgeNum) {
    
    return label + ': ' +
	length_in_current_units(edgeLengthInMiles(graphEdges[edgeNum])) +
	'<br />#' + edgeNum + ' ' + graphEdges[edgeNum].label + " " +
        waypoints[graphEdges[edgeNum].v1].label + ' <-> ' +
        waypoints[graphEdges[edgeNum].v2].label;
}

const hdxEdgeExtremesSearchAV = {

    // entries for list of AVs
    value: "esearch",
    name: "Edge Extremes Search",
    description: "Search for extreme values based on edge (connection) lengths and labels.",
    
    // no vertices, use edges
    useV: false,
    useE: true,

    // state variables for edge search
    // next to examine
    nextToCheck: 0,
    discarded: 0,
    foundNewLeader: false,
    // the categories for which we are finding our extremes,
    // with names for ids, labels to display, indicies of leader,
    // comparison function to determine if we have a new leader,
    // and visual settings for the display
    categories: [
        {
            name: "shortestLabel",
            label: "Shortest edge label",
            index: -1,
            
            newLeader: function() {
                return (graphEdges[hdxEdgeExtremesSearchAV.nextToCheck].label.length <
                        graphEdges[this.index].label.length);
            },
            leaderString: edgeLabelLeaderString,
            visualSettings: visualSettings.shortLabelLeader
        },
        
        {
            name: "longestLabel",
            label: "Longest edge label",
            index: -1,
            
            newLeader: function() {
                return (graphEdges[hdxEdgeExtremesSearchAV.nextToCheck].label.length >
                        graphEdges[this.index].label.length);
            },
            leaderString: edgeLabelLeaderString,
            visualSettings: visualSettings.longLabelLeader
        },

        {
            name: "shortestEdge",
            label: "Shortest edge length",
            index: -1,
            
            newLeader: function() {
                return (edgeLengthInMiles(graphEdges[hdxEdgeExtremesSearchAV.nextToCheck]) <
                        edgeLengthInMiles(graphEdges[this.index]));
            },
            leaderString: edgeLengthLeaderString,
            visualSettings: {
                color: "rgb(255, 130, 0)",
                textColor: "white",
                scale: 6,
                name: "shortEdgeLeader",
                value: 0,
                weight: 8,
                opacity: 0.6
            }
        },
        
        {
            name: "longestEdge",
            label: "Longest edge length",
            index: -1,
            
            newLeader: function() {
                return (edgeLengthInMiles(graphEdges[hdxEdgeExtremesSearchAV.nextToCheck]) >
                        edgeLengthInMiles(graphEdges[this.index]));
            },
            leaderString: edgeLengthLeaderString,
            visualSettings: {
                color: "rgb(164, 81, 255)",
                textColor: "white",
                scale: 6,
                name: "longEdgeLeader",
                value: 0,
                weight: 8,
                opacity: 0.6
            }
        }
    ],
    
        // the actions that make up this algorithm
    avActions: [
        {
            label: "START",
            comment: "initialize all leader indices to 0",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                for (let i = 0; i < thisAV.categories.length; i++) {
                    thisAV.categories[i].index = 0;
                }
                
                // highlight edge 0 as leader in all categories and current
                thisAV.nextToCheck = 0;
                thisAV.discarded = 0;
        
                hdxAVCP.update("undiscovered",
			       (graphEdges.length - thisAV.nextToCheck) +
			       " edges not yet visited");
                hdxAVCP.update("visiting", "Visiting: #" + thisAV.nextToCheck +
			       " " + graphEdges[thisAV.nextToCheck].label);
                hdxAVCP.update("discarded", thisAV.discarded +
			       " edges discarded");

                // show edge 0 as the leader in each category
                // on the map and in the table
                for (let i = 0; i < thisAV.categories.length; i++) {
                    updatePolylineAndTable(thisAV.categories[i].index,
                                         thisAV.categories[i].visualSettings, 
                                          false);
                    hdxAVCP.update(
                        thisAV.categories[i].name, 
                        thisAV.categories[i].leaderString(thisAV.categories[i].label,
                                                          thisAV.categories[i].index)
                    );
                }
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "forLoopTop";
            },
            logMessage: function(thisAV) {
                return "Initializing leaders to edge 0";
            }
        },
        {
            label: "forLoopTop",
            comment: "for loop to iterate over remaining edges",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                thisAV.nextToCheck++;
                if (thisAV.nextToCheck == graphEdges.length) {
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    // highlight nextToCheck as current edge
                    hdxAV.nextAction = "checkNextCategory";
                    thisAV.nextCategory = 0;
                    thisAV.foundNewLeader = false;
                    hdxAVCP.update("undiscovered",
				   (graphEdges.length - thisAV.nextToCheck) +
				   " edges not yet visited");
                    hdxAVCP.update("visiting", "Visiting: #" +
				   thisAV.nextToCheck + " " +
				   graphEdges[thisAV.nextToCheck].label);
                    updatePolylineAndTable(thisAV.nextToCheck,
                                           visualSettings.visiting,
                                           false);
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Top of main for loop over edges, check=" + thisAV.nextToCheck;
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.EDGE,
		    eindexvar: "check"
		},
		f: function(thisAV, edgenum, matchtype, textval, vnum) {
		    return isCBPEdgeMatch(thisAV.nextToCheck, edgenum,
					  matchtype, textval, vnum);
		}    
            }
        },
        {
            label: "checkNextCategory",
            comment: "check if current edge is a new category leader",
            code: function(thisAV) {
                highlightPseudocode(this.label+thisAV.nextCategory,
                                    thisAV.categories[thisAV.nextCategory].visualSettings);
                if (thisAV.categories[thisAV.nextCategory].newLeader()) {
                    hdxAV.nextAction = "updateNextCategory";
                }
                else {
                    thisAV.nextCategory++;
                    if (thisAV.nextCategory == thisAV.categories.length) {
                        hdxAV.nextAction = "forLoopBottom";
                    }
                    else {
                        hdxAV.nextAction = "checkNextCategory";
                    }
                }
            },
            logMessage: function(thisAV) {
                if (hdxAV.nextAction == "updateNextCategory") {
                    return "New " + thisAV.categories[thisAV.nextCategory].label + " leader";
                }
                else {
                    return "Check for new " + thisAV.categories[thisAV.nextCategory-1].label + " leader";
                }
            }
        },
        {
            label: "updateNextCategory",
            comment: "update new category leader",
            code: function(thisAV) {

                highlightPseudocode(this.label+thisAV.nextCategory,
                                    thisAV.categories[thisAV.nextCategory].visualSettings);
                // remember that we have a new leader so this doesn't
                // get discarded at the end of the loop
                thisAV.foundNewLeader = true;

                // if the old leader is still leading in some other category,
                // color it as such, and if not, discard
                const oldLeader = thisAV.categories[thisAV.nextCategory].index;
                let stillALeader = false;
                for (let i = 0; i < thisAV.categories.length; i++) {
                    if (i == thisAV.nextCategory) continue;
                    if (thisAV.categories[i].index == oldLeader) {
                        stillALeader = true;
                        updatePolylineAndTable(oldLeader,
                                             thisAV.categories[i].visualSettings, 
                                              false);
                        break;  // could lead in others, but pick the first
                    }
                }
                if (!stillALeader) {
                    updatePolylineAndTable(oldLeader, visualSettings.discarded,
                                 true);
                    thisAV.discarded++;
                    hdxAVCP.update("discarded", thisAV.discarded +
				   " vertices discarded");
                }
                    
                // update this category to indicate its new leader
                // but keep it shown as the edge being visited on the
                // map and in the table until the end of the iteration
                thisAV.categories[thisAV.nextCategory].index = thisAV.nextToCheck;
                hdxAVCP.update(
                    thisAV.categories[thisAV.nextCategory].name, 
                    thisAV.categories[thisAV.nextCategory].leaderString(
                        thisAV.categories[thisAV.nextCategory].label,
                        thisAV.categories[thisAV.nextCategory].index)
                );
                thisAV.nextCategory++;
                if (thisAV.nextCategory == thisAV.categories.length) {
                    hdxAV.nextAction = "forLoopBottom";
                }
                else {
                    hdxAV.nextAction = "checkNextCategory";
                }
            },
            logMessage: function(thisAV) {
                return thisAV.nextToCheck + " is new " + thisAV.categories[thisAV.nextCategory-1].label + " leader";
            }
        },
        {
            label: "forLoopBottom",
            comment: "end of for loop iteration",
            code: function(thisAV) {

                // if this edge is the leader in any category, show it,
                // otherwise it gets discarded
                if (thisAV.foundNewLeader) {
                    for (let i = 0; i < thisAV.categories.length; i++) {
                        if (thisAV.nextToCheck == thisAV.categories[i].index) {
                            updatePolylineAndTable(thisAV.categories[i].index,
                                                 thisAV.categories[i].visualSettings, 
                                                 false);
                            break;  // just use the first we find
                        }
                    }
                }
                else {
                    updatePolylineAndTable(thisAV.nextToCheck, visualSettings.discarded,
                         true);
                    thisAV.discarded++;
                    hdxAVCP.update("discarded", thisAV.discarded +
				   " edges discarded");

                }
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "forLoopTop";
            },
            logMessage: function(thisAV) {
                return "Update/discard on map and table";
            }
        },
        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {
                hdxAV.algStat.innerHTML =
                    "Done! Visited " + graphEdges.length + " edges.";
                hdxAVCP.update("undiscovered", "0 edges not yet visited");
                hdxAVCP.update("visiting", "");
                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }              
        }
    ],
        
    // required prepToStart function
    prepToStart() {

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += 'longestLabel &larr; 0<br />shortestLabel &larr; 0<br />longestEdge &larr; 0<br />shortestEdge &larr; 0</td></tr>';
        this.code += pcEntry(0,'for (checkIndex &larr; 1 to |E|-1)',"forLoopTop");
        this.code += pcEntry(1, 'if (len(e[checkIndex].label) > len(e[longestLabel].label)))', "checkNextCategory0");
        this.code += pcEntry(2, 'longestLabel &larr; checkIndex', "updateNextCategory0");
        this.code += pcEntry(1,'if (len(e[checkIndex].label) < len(e[shortestLabel].label)))', "checkNextCategory1");
        this.code += pcEntry(2, 'shortestLabel &larr; checkIndex', "updateNextCategory1");
        this.code += pcEntry(1,'if (e[checkIndex].len > e[longestEdge].len)', "checkNextCategory2");
        this.code += pcEntry(2, 'longestEdge &larr; checkIndex', "updateNextCategory2");
        this.code += pcEntry(1,'if (e[checkIndex].len < e[shortestEdge].len)', "checkNextCategory3");
        this.code += pcEntry(2, 'shortestEdge &larr; checkIndex', "updateNextCategory3");
    },
        
    // set up UI for the start of edge search
    setupUI() {

        hdxAV.algOptions.innerHTML = '';
	
        hdxAVCP.add("undiscovered", visualSettings.undiscovered);
        hdxAVCP.add("visiting", visualSettings.visiting);
        hdxAVCP.add("discarded", visualSettings.discarded);
        for (let i = 0; i < this.categories.length; i++) {
            hdxAVCP.add(this.categories[i].name,
                        this.categories[i].visualSettings);
        }
    },

    // clean up edge search UI
    cleanupUI() {

    },
    
    idOfAction(action) {
        if (action.label == "forLoopTop") {
            return action.label;
        }
        else {
	    return action.label + this.nextCategory;
        }
    }
};
