g//
// HDX Welsh-Powell Graph Coloring Algorithm AV
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

var hdxGraphColoringAV = {
    value: "coloring",
    
    name: "Welsh-Powell Graph Coloring",
    
    description: "Greedy algorithm that provides a polynomial time approximation of the graph coloring problem. Although answers are unlikely to be minimal, no vertex will have the same color as any of its neighbors.",
    
    sortedV: [],
    
    // the next vertex index being checked
    nextToCheck: -1,
    currVertex: -1,

    // visualSetting that contains the color value
    color: null,
    countOfColor: [],

    avActions : [
        {
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.currColor = 0;
                thisAV.color = null;

                thisAV.nextToCheck = -1;

                // track whether or not our neighbors have the color
                // we are currently using
                thisAV.sharesColor = false;

                // current vertex (derived from sortedV and thisAV.nextToCheck)
                thisAV.currVertex = -1;

                // count of each color used when the algorithm is finished
                thisAV.countOfColor = [];
            
                // setting up rainbow
                thisAV.rainbowGradiant = new Rainbow();
                thisAV.rainbowGradiant.setNumberRange(0,360);
                thisAV.rainbowGradiant.setSpectrum('ff0000','ffa000',
						   '00ff00','00ffff',
						   '0000ff','c700ff');
                
                // sort the waypoints from highest degree to lowest
                // degree
                for (let i = 0; i < waypoints.length; i++) {
                    thisAV.sortedV[i] = i;
                    waypoints[i].color = -1;
                    waypoints[i].num = i;
                }

                // sorts the vertices by the degree of each waypoint
                thisAV.sortedV.sort(thisAV.compareDegree);

                updateAVControlEntry("undiscovered","Colorless Vertices: " +
				     thisAV.sortedV.length);

                hdxAV.iterationDone = true;
                hdxAV.nextAction = "topWhileLoop";
            },
            logMessage: function(thisAV) {
                return "Initializing each vertex as colorless.";
            }
        },
        {
            label: "topWhileLoop",
            code: function(thisAV) {

                highlightPseudocode(this.label, visualSettings.visiting);
            
                // create the color, using the golden ratio algorithm
                // 223 is 360 * 1/phi
                thisAV.color = {
                    color:"#" + thisAV.rainbowGradiant.colorAt((thisAV.currColor * 223) % 360),
                    textColor: "white",
                    scale: 6,
                    weight: 5,
                    name: "color",
                    value: 0,
                    opacity: 0.8	    
                }

                thisAV.nextToCheck = 0;
                
                if (thisAV.sortedV.length > 0) {
                    updateAVControlEntry("totalColors","Number of Colors: " +
					 (thisAV.currColor + 1));
                    thisAV.countOfColor.push(0);
                    hdxAV.nextAction = "innerWhileLoop";
                }
		else {
                    hdxAV.nextAction = "cleanup";
                }
            },
            logMessage: function(thisAV) {
                return "Looping over remaining vertices with color #" +
		    (thisAV.currColor + 1) + " Hex: " + thisAV.color.color;
            }
        },
        {
            label: "innerWhileLoop",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		
                if (thisAV.nextToCheck < thisAV.sortedV.length) {
                    thisAV.sharesColor = false;
                    // index of the vertex that we are currently checking
                    thisAV.currVertex = thisAV.sortedV[thisAV.nextToCheck];

                    updateMarkerAndTable(thisAV.currVertex,
					 visualSettings.visiting,false);
                    updateAVControlEntry("visiting","Visiting: #" +
					 thisAV.currVertex + " " +
					 waypoints[thisAV.currVertex].label);

                    hdxAV.nextAction = "neighborCheck";
                }
		else {
                    hdxAV.nextAction = "incrementColor";
                }
    
            },
            logMessage: function(thisAV) {
                return "Visiting vertex #" + thisAV.currVertex + " " +
		    waypoints[thisAV.currVertex].label;
            }
        },
        {
            label: "neighborCheck",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		
                let v1;
                let v2;
                for (let i = 0; i < waypoints[thisAV.currVertex].edgeList.length;
		     i++) {
                    updatePolylineAndTable(waypoints[thisAV.currVertex].edgeList[i].edgeListIndex,
					   thisAV.color,false);
                }

                for (let i = 0; i < waypoints[thisAV.currVertex].edgeList.length;
		     i++) {
                    
                    v1 = waypoints[thisAV.currVertex].edgeList[i].v1;
                    v2 = waypoints[thisAV.currVertex].edgeList[i].v2;

                    if (v1 == thisAV.currVertex) {
                        if (waypoints[v2].color == thisAV.currColor) {
                            thisAV.sharesColor = true;
                            break;
                        }
                    }
		    else{
                        if (waypoints[v1].color == thisAV.currColor) {
                            thisAV.sharesColor = true;
                            break;
                        }
                    }
                }

                if (thisAV.sharesColor) {
                    hdxAV.nextAction = "incrementI";
                }
		else {
                    hdxAV.nextAction = 'setColor';
                }
            },
            logMessage: function(thisAV) {
                return "Checking if any of vertex #" + thisAV.currVertex +
		    "'s neighbors are color #" + (thisAV.currColor + 1);
            }
        },

        {
            label: "setColor",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                for (let i = 0; i < waypoints[thisAV.currVertex].edgeList.length;
		     i++) {
                    updatePolylineAndTable(waypoints[thisAV.currVertex].edgeList[i].edgeListIndex,
					   visualSettings.undiscovered,false);
                }
    
                waypoints[thisAV.currVertex].color = thisAV.currColor;
                updateMarkerAndTable(thisAV.currVertex, thisAV.color, false);

                // set the color in the waypoints array
                waypoints[thisAV.currVertex].color = thisAV.currColor;
                // delete the recently colored point from the sorted array
                thisAV.sortedV.splice(thisAV.nextToCheck,1);

                // increment the currColor's count in countOfColor array
                thisAV.countOfColor[thisAV.currColor]++;

                updateAVControlEntry("undiscovered","Colorless Vertices: " +
				     thisAV.sortedV.length);

                hdxAV.nextAction = "innerWhileLoop";
    
            },
            logMessage: function(thisAV) {
                return "Setting vertex #" + thisAV.currVertex + " to color #" +
		    (thisAV.currColor + 1) + " and removing it from sortedV";
            }
        },

        {
            label: "incrementI",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                for (let i = 0; i < waypoints[thisAV.currVertex].edgeList.length;
		     i++) {
                    updatePolylineAndTable(waypoints[thisAV.currVertex].edgeList[i].edgeListIndex,
					   visualSettings.undiscovered,false);
                }
    
                updateMarkerAndTable(thisAV.sortedV[thisAV.nextToCheck],
				     visualSettings.undiscovered,false);
                thisAV.nextToCheck++;
                hdxAV.nextAction = "innerWhileLoop";
            },
            logMessage: function(thisAV) {
                return "Checking the next vertex in sortedV";
            }
        },
        
        {
            label: "incrementColor",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
    
                thisAV.currColor++;
                hdxAV.nextAction = "topWhileLoop";
    
            },
            logMessage: function(thisAV) {
                return "Increasing the value of color to" + thisAV.currColor;
            }
        },
        
        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {                    

                updateAVControlEntry("undiscovered","");
                updateAVControlEntry("visiting","");

                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;

                // creating data table
                let table = '<table class="gratable"; style="width:100%; text-align:center;><thead>' +
                '<tr style="text-align:center"><th>Color</th><th>Vertices</th></tr></thead><tbody>';

                let color;
                // adding rows to the data table for each color used
                for (let i = 0; i < thisAV.countOfColor.length; i++) {
                    color = '#' + thisAV.rainbowGradiant.colorAt((i * 223) % 360);
                    table += '<tr id="color' + i + '" custom-title = "Color' +i+'" onmouseover = "hdxGraphColoringAV.hoverC('+i+')" onmouseout = "hdxGraphColoringAV.hoverEndC('+i+')">';
                    table += '<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>' + (i) + 
                    '<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>' + thisAV.countOfColor[i] + '</td></tr>'
                }
                table += '</tbody></table>';

                updateAVControlEntry("table", table);
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
        this.code += `color &larr; 0</br>`
        this.code += `sortedV[] &larr; sort(V,degree)</br>`
        this.code += `for i &larr 0 to |sortedV|</br>`
        this.code += pcIndent(2) + `sortedV[i].color &larr; -1 //colorless</br>`
        this.code += pcEntry(0,"while(sortedV is not empty)</br>" +
            pcIndent(2) + "i &larr; 0","topWhileLoop");
        this.code += pcEntry(1,"while(i < |sortedV|)","innerWhileLoop");
        this.code += pcEntry(2,"if (sortedV[i].neighbors not contain color)","neighborCheck");
        this.code += pcEntry(3,"sortedV[i].color &larr; color</br>" + 
            pcIndent(6) + "sortedV[i].remove()","setColor");
        this.code += pcEntry(2,"else","");
        this.code += pcEntry(3,"i++","incrementI");
        this.code += pcEntry(1,"color++","incrementColor");
     },

    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        hdxAV.algOptions.innerHTML = "";

        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting);
        addEntryToAVControlPanel("totalColors",visualSettings.highlightBounding);
        addEntryToAVControlPanel("table",visualSettings.spanningTree);
        
    },
    cleanupUI() {

    },

    idOfAction(action) {
	
        return action.label;
    },
    
    // note this is currently not working
    setConditionalBreakpoints(name) {
        let max = waypoints.length-1;
        let temp = HDXCommonConditionalBreakpoints(name);
        if (temp != "No innerHTML") {
            return temp;
        }
        return "No innerHTML";
    },
    // note this is currently not working
    hasConditionalBreakpoints(name) {
        let answer = HDXHasCommonConditionalBreakpoints(name);
        if (answer) {
            return true;
        }
        return false;
    },
    
    // comparator for the sorting function to sort waypoints by degree
    compareDegree(a,b) {
        return waypoints[b].edgeList.length - waypoints[a].edgeList.length;
    },
    
    hoverC(p) {
        for (var w = 0; w < waypoints.length; w++) {
            if (waypoints[w].color == p) {
		updateMarkerAndTable(waypoints[w].num, {
		    color: "#" + this.rainbowGradiant.colorAt((p * 223) % 360),
		    scale: 8,
		    opacity: 1,
		    textColor: "white"
		} , 31, false); 
            }
        }
    },
  
    hoverEndC(p) {
        for (var w = 0; w < waypoints.length; w++) {
            if (waypoints[w].color == p) {
		updateMarkerAndTable(waypoints[w].num, {
		    color: "#" + this.rainbowGradiant.colorAt((p * 223) % 360),
		    scale: 5,
		    opacity: 0.8,
		    textColor: "white"
		}, 30, false); 
            }    
        }
    }
}
