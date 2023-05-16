//
// HDX Min/Max Degree Search AV
//
// METAL Project
// highly adapted from hdxvertexextremesav.js 
//

var hdxDegreeAV = {

    // entries for list of AVs
    value: "degree",
    name: "Vertex Min/Max Degree Search",
    description: "Search for minimum and maximum degree vertices (waypoints) in the graph.",

    // state variables for vertex degree search
    nextToCheck: 0, //for loop counter
    discarded: 0,
    foundNewLeader: false,
    
    // the categories for which we are finding our degrees,
    // with names for ids, labels to display, indicies of leader,
    // comparison function to determine if we have a new leader,
    // visual settings for the display, and a function to determine
    // if the category is among those currently chosen to include
    categories: [
        {
            name: "min",
            label: "Min degree",
            index: -1,
            tiedWith: [],
            
            newLeader: function() {
                return (parseFloat(waypoints[hdxDegreeAV.nextToCheck].edgeList.length) <
                        parseFloat(waypoints[this.index].edgeList.length));
            },

            tiedForLead: function() {
                return (parseFloat(waypoints[hdxDegreeAV.nextToCheck].edgeList.length) ==
                        parseFloat(waypoints[this.index].edgeList.length));
            },


            visualSettings: {
                color: "rgb(255, 130, 0)",
                textColor: "white",
                scale: 6,
                name: "minDegree",
                value: 0
            },

            include: function(thisAV) {
                return true;
            }
        },

        {
            name: "max",
            label: "Max degree",
            index: -1,
            tiedWith: [],
            
            newLeader: function() {
                return (parseFloat(waypoints[hdxDegreeAV.nextToCheck].edgeList.length) >
                        parseFloat(waypoints[this.index].edgeList.length));
            },

            tiedForLead: function() {
                return (parseFloat(waypoints[hdxDegreeAV.nextToCheck].edgeList.length) ==
                        parseFloat(waypoints[this.index].edgeList.length));
            },


            visualSettings: {
                color: "rgb(164, 81, 255)",
                textColor: "white",
                scale: 6,
                name: "maxDegree",
                value: 0
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
                for (var i = 0; i < thisAV.categories.length; i++) {
                    thisAV.categories[i].index = 0;
                    thisAV.categories[i].tiedWith = [];
                }
                
                // highlight vertex 0 as leader in all categories and current
                thisAV.nextToCheck = 0;
                thisAV.discarded = 0;

                updateAVControlEntry("undiscovered", waypoints.length +
				     " vertices not yet visited");
                updateAVControlEntry("visiting",
				     "Setting #0 " + waypoints[0].label + " as initial leader in each category");
                updateAVControlEntry("discarded", "0 vertices discarded");

		// show incident edges of 0 as being visited
		for (let i = 0; i < waypoints[0].edgeList.length; i++) {
		    updatePolylineAndTable(waypoints[0].edgeList[i].edgeListIndex,
					   visualSettings.discovered, false);
		}
                // show marker 0 as the leader in each category
                // on the map and in the table
                for (let i = 0; i < thisAV.categories.length; i++) {
                    updateMarkerAndTable(0,
                                         thisAV.categories[i].visualSettings, 
                                         40, false);
                    updateAVControlEntry(
                        thisAV.categories[i].name,
                        thisAV.categories[i].label + " = " +
			    waypoints[0].edgeList.length + " at "
			    + waypoints[0].label
		    );
                }
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "forLoopTop";
            },
            logMessage: function(thisAV) {
                return "Initializing min and max to vertex 0";
            }
        },
        {
            label: "forLoopTop",
            comment: "for loop to iterate over remaining vertices",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		// unhiglight incident edges of previous
		for (let i = 0; i < waypoints[thisAV.nextToCheck].edgeList.length; i++) {
		    updatePolylineAndTable(waypoints[thisAV.nextToCheck].edgeList[i].edgeListIndex,
					   visualSettings.discarded, false);
		}
                thisAV.nextToCheck++;
                if (thisAV.nextToCheck == waypoints.length) {
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    // highlight nextToCheck as current vertex
                    hdxAV.nextAction = "checkNextCategory";
                    thisAV.nextCategory = 0;
                    thisAV.foundNewLeader = false;
                    updateMarkerAndTable(thisAV.nextToCheck, visualSettings.visiting,
                                         30, false);
                    updateAVControlEntry("undiscovered", (waypoints.length - thisAV.nextToCheck) + " vertices not yet visited");
                    updateAVControlEntry("visiting", "Visiting: #" + thisAV.nextToCheck + " " + waypoints[thisAV.nextToCheck].label);
		    // higlight incident edges of vertex to be checked
		    for (let i = 0; i < waypoints[thisAV.nextToCheck].edgeList.length; i++) {
			updatePolylineAndTable(waypoints[thisAV.nextToCheck].edgeList[i].edgeListIndex,
					       visualSettings.discovered, false);
		    }
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Top of main for loop over vertices, check=" + thisAV.nextToCheck;
            },
            currentVariable: function(thisAV, whatToDo) {
                return (thisAV.nextToCheck+1);
            }
        },
        {
            label: "checkNextCategory",
            comment: "check if current vertex is a new category leader",
            code: function(thisAV) {
                highlightPseudocode(this.label+thisAV.nextCategory,
                                    thisAV.categories[thisAV.nextCategory].visualSettings);
                thisAV.checkedCategory = thisAV.nextCategory;
                if (thisAV.categories[thisAV.nextCategory].newLeader()) {
                    hdxAV.nextAction = "updateNextCategory";
                }
                else {
                    hdxAV.nextAction = "checkTieCategory";
                }
            },
            logMessage: function(thisAV) {
                return "Check for new " + thisAV.categories[thisAV.nextCategory].label + " leader";
            },
            currentVariable: function(thisAV, whatToDo) {
                return thisAV.categories[thisAV.nextCategory].newLeader();
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
                let oldLeaders = thisAV.categories[thisAV.nextCategory].tiedWith.concat([ thisAV.categories[thisAV.nextCategory].index ]);
                
                // this is a loop to check all old leaders
                // not just the first when checking ties
                for (var oldLIndex = 0; oldLIndex < oldLeaders.length; oldLIndex++) {
                    let oldLeader = oldLeaders[oldLIndex];
                    let stillALeader = false;
                    for (var i = 0; i < thisAV.categories.length; i++) {
                        if (i == thisAV.nextCategory) continue;
                        if ((thisAV.categories[i].index == oldLeader) ||
                            thisAV.categories[i].tiedWith.includes(oldLeader)) {
                            stillALeader = true;
                            updateMarkerAndTable(oldLeader,
                                                 thisAV.categories[i].visualSettings, 
                                                 40, false);
                            break;  // could lead in others, but pick the first
                        }
                    }
                    if (!stillALeader) {
                        updateMarkerAndTable(oldLeader, visualSettings.discarded,
                                             20, true);
                        thisAV.discarded++;
                        updateAVControlEntry("discarded", thisAV.discarded + " vertices discarded");
                    }
                }

                // remove all old "tied" values
                thisAV.categories[thisAV.nextCategory].tiedWith = [];
                
                // update this category to indicate its new leader
                // but keep it shown as the vertex being visited on the
                // map and in the table until the end of the iteration
                thisAV.categories[thisAV.nextCategory].index = thisAV.nextToCheck;
                
                ans = ' <span custom-title=';
                for (let j = 0; j < thisAV.categories[thisAV.nextCategory].tiedWith.length; j++) {
                
                    ans += "\n" + thisAV.categories[thisAV.nextCategory].tiedWith[j] ;
                           
                }  
                          
                ans += '>' + thisAV.categories[thisAV.nextCategory].label +
		    ' = ' + waypoints[thisAV.nextToCheck].edgeList.length +
		    ' at ' + waypoints[thisAV.nextToCheck].label + '</span>';
                updateAVControlEntry(
                    thisAV.categories[thisAV.nextCategory].name,
                    ans
                );
                // advance category, skipping if necessary
                thisAV.nextCategory++;
                
                if (thisAV.nextCategory == thisAV.categories.length) {
                    hdxAV.nextAction = "forLoopBottom";
                }
                else {
                    hdxAV.nextAction = "checkNextCategory";
                }
            },
            logMessage: function(thisAV) {
                return "New " + thisAV.categories[thisAV.checkedCategory].label + " leader";
            }
        },

        {
            label: "checkTieCategory",
            comment: "check for tie in a category lead",
            code: function(thisAV) {
                highlightPseudocode(this.label+thisAV.nextCategory,
                                    thisAV.categories[thisAV.nextCategory].visualSettings);
                if (thisAV.categories[thisAV.nextCategory].tiedForLead()) {
                    hdxAV.nextAction = "updateTieCategory";
                }
                else {
                    // advance category, skipping if necessary
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
                return "Check for tie in " + thisAV.categories[thisAV.checkedCategory].label;
            },
            currentVariable: function(thisAV, whatToDo) {
                return thisAV.categories[thisAV.nextCategory].tiedForLead();
            }
        },
        {
            label: "updateTieCategory",
            comment: "update tied category leader",
            code: function(thisAV) {

                highlightPseudocode(this.label+thisAV.nextCategory,
                                    thisAV.categories[thisAV.nextCategory].visualSettings);
                // remember that we have a new leader so this doesn't
                // get discarded at the end of the loop
                thisAV.foundNewLeader = true;

                // add to list of values tied for the lead
                thisAV.categories[thisAV.nextCategory].tiedWith.push(thisAV.nextToCheck);

                ans = ' <span custom-title="Tied with:';
                for (let j = 0;
		     j < thisAV.categories[thisAV.nextCategory].tiedWith.length;
		     j++) {                
                    ans += '<br>' + waypoints[thisAV.categories[thisAV.nextCategory].tiedWith[j]].label;
                }  
                
                ans += '">' + thisAV.categories[thisAV.nextCategory].label +
		    ' = ' + waypoints[thisAV.nextToCheck].edgeList.length +
		    " at " + waypoints[thisAV.nextToCheck].label +
                    ", tied with " 
                    +  thisAV.categories[thisAV.nextCategory].tiedWith.length;
                if (thisAV.categories[thisAV.nextCategory].tiedWith.length != 1) {
                    ans +=  " others."+ '</span>';
                }
                else {
                    ans +=  " other."+ '</span>';
                }
		
                updateAVControlEntry(
                    thisAV.categories[thisAV.nextCategory].name, 
                    ans
                );
                // advance category, skipping if necessary
                
                    thisAV.nextCategory++;                
                if (thisAV.nextCategory == thisAV.categories.length) {
                    hdxAV.nextAction = "forLoopBottom";
                }
                else {
                    hdxAV.nextAction = "checkNextCategory";
                }
            },
            logMessage: function(thisAV) {
                return "New tie for " + thisAV.categories[thisAV.checkedCategory].label + " degree";
            }
        },

        {
            label: "forLoopBottom",
            comment: "end of for loop iteration",
            code: function(thisAV) {

                // if this waypoint is the leader in any category, show it,
                // otherwise it gets discarded
                if (thisAV.foundNewLeader) {
                    for (var i = 0; i < thisAV.categories.length; i++) {
                        if ((thisAV.nextToCheck == thisAV.categories[i].index) ||
                            thisAV.categories[i].tiedWith.includes(thisAV.nextToCheck)) {
                            updateMarkerAndTable(thisAV.nextToCheck,
                                                 thisAV.categories[i].visualSettings, 
                                                 40, false);
                            break;  // just use the first we find
                        }
                    }
                }
                else {
                    updateMarkerAndTable(thisAV.nextToCheck, visualSettings.discarded,
                                         20, true);
                    thisAV.discarded++;
                    updateAVControlEntry("discarded", thisAV.discarded + " vertices discarded");

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
                    "Done! Visited " + markers.length + " waypoints.";
                updateAVControlEntry("undiscovered", "0 vertices not yet visited");
                updateAVControlEntry("visiting", "");
                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],

    // required prepToStart function
    // initialize a vertex-based search
    prepToStart() {

        hdxAV.algStat.innerHTML = "Initializing";

        // show waypoints and connections
        initWaypointsAndConnections(true, true,
                                    visualSettings.undiscovered);

	// we want connections shown, but not to be too prominent,
	// to color them with the discarded style
	for (let i = 0; i < connections.length; i++) {
	    updatePolylineAndTable(i, visualSettings.discarded, false);
	}

        // start the search by initializing with the value at pos 0
        updateMarkerAndTable(0, visualSettings.visiting, 40, false);

        // build pseudocode based on options selected
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';        
        this.code += `
        min &larr; 0, 
        max &larr; 0,<br />
        ` ;
        
        this.code += '</td></tr>' +
            pcEntry(0, "for (check &larr; 1 to |V|-1)", "forLoopTop", "forLoopTop");
	
        // min
        this.code += pcEntry(1, "if (v[check].degree < v[min].degree)",
                             "checkNextCategory0");
        this.code += pcEntry(2, ("min &larr; check"), "updateNextCategory0");
	
        this.code += pcEntry(1, "else if (v[check].degree = v[min].degree)",
                             "checkTieCategory0");
        this.code += pcEntry(2, "min.add(check)", "updateTieCategory0");
	
        // max
        this.code += pcEntry(1, "if (v[check].degree > v[max].degree)",
                             "checkNextCategory1");
        this.code += pcEntry(2, ("max &larr; check"), "updateNextCategory1");
        this.code += pcEntry(1, "else if (v[check].degree = v[max].degree)",
                             "checkTieCategory1");
        this.code += pcEntry(2, "max.add(check)", "updateTieCategory1");
        this.code += "</table>";
        
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered);
        addEntryToAVControlPanel("visiting", visualSettings.visiting);
        addEntryToAVControlPanel("discarded", visualSettings.discarded);
        for (var i = 0; i < this.categories.length; i++) {
                addEntryToAVControlPanel(this.categories[i].name,
                                         this.categories[i].visualSettings);
        }
    },

    // set up UI for the start of this algorithm
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;

        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");
        hdxAV.algOptions.innerHTML = ``;
    },

    cleanupUI() {

    },
    
    idOfAction(action) {
        if (action.label == "forLoopTop") {
            return action.label;
        }
        else {
	    return action.label + this.nextCategory;
        }
    },
    
    setConditionalBreakpoints(name) {
        let max = waypoints.length-1;
        let temp = HDXCommonConditionalBreakpoints(name);
        
        let isThere = name.search(/\d/);
        name = (isThere != -1) ? name.substring(0,isThere) : name;
        
        if (temp != "No innerHTML") {
            return temp;
        }
        else {
            switch (name) {
            case "checkNextCategory":
            case "checkTieCategory":
                html = createInnerHTMLChoice("boolean", "checkCategories2","True",
					     "False");
                return html;
            }
        }
        return "No innerHTML";
    },

    hasConditionalBreakpoints(name) {
        
        let isThere = name.search(/\d/);
        name = (isThere != -1) ? name.substring(0,isThere) : name;
    
        let answer = HDXHasCommonConditionalBreakpoints(name);
        if (answer) {
            return true;
        }
        else {
            switch (name) {
            case "checkNextCategory":
            case "checkTieCategory":
                return true;
            }
        }
        return false;
    },

    // no QS parameters for this one at this time
    avParamsQS() {

	return "";
    }    
};
