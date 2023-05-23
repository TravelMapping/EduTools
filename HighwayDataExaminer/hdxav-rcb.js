//
// HDX Algorithm Visualization of Recursive Coordinate Bisection Partitioner
//
// METAL Project
//
// Primary Authors: Michael Plekan
//

const hdxPartitionerAV = {
    value: 'rcb',
    name: "Recursive Coordinate Bisection Partitioner",
    description: "This algorithm partitions the vertices of a graph using the geometric recursive coordinate bisection algorithm.  Note: the number of partitions must be a power of 2.",

    partitionStart: [],
    partitionEnd: [],
    waypointParts: [],
    callStack: [],
    numPartitions: 4,
    curNumParts: 1,

    // the frame at the top of the stack at any given time
    fp: null,
    
    median: -1,
    partitionSection: null,

    coloring: -1,
    highlightPoly: [],
    highlightRect: [],
    visualSettings: {
	parentPartition: {
            color: "#F0F",
            textColor: "white",
            scale: 4,
            weight: 0.5,
            name: "parentPartition",
            value: 0
	},
	
	childPartitionBlue: {
            color: "#00F",
            textColor: "white",
            scale: 4,
            weight: 0.5,
            name: "childPartitionBlue",
            value: 0
	},
	
	childPartitionRed: {
            color: "#F00",
            textColor: "white",
            scale: 4,
            weight: 0.5,
            name: "childPartitionRed",
            value: 0
	}
    },

    avActions : [
        {
            label: "START",
            comment: "creates bounding box and initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                for (let x = 0; x < waypoints.length; x++) {
                       thisAV.waypointParts[x] = x;
                } 

                thisAV.partitionSection = thisAV.waypointParts;
                thisAV.highlightBoundingBox();
                thisAV.numPartitions =
		    Math.pow(2,document.getElementById('parts').value);
                thisAV.coloring =
		    document.getElementById('ColoringMethod').value;
		
                thisAV.partitionStart = Array(thisAV.numPartitions).fill(0);
                thisAV.partitionEnd = Array(thisAV.numPartitions).fill(0);

		// set up initial recursive step
                thisAV.callStack.push({
		    currentPart: 0,
		    lowerBound: 0,
		    upperBound: waypoints.length-1,
		    partsLeft: thisAV.numPartitions,
		    maxLat: thisAV.maxlat,
		    maxLon: thisAV.maxlon,
		    minLat: thisAV.minlat,
		    minLon: thisAV.minlon
		});
                hdxAV.nextAction = "methodCall";
                addEntryToAVControlPanel("cut", visualSettings.pseudocodeDefault);

            },
            logMessage: function(thisAV) {
                return "Doing some setup stuff";
            }
        },
        { 
            label: "methodCall",
            comment: "Start a recursive call",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                // setting polyline colors
                for (let i = 0; i < thisAV.highlightPoly.length; i++) {
                     thisAV.highlightPoly[i].setStyle(visualSettings.undiscovered);
                }
                // coloring points dark gray
                if (thisAV.coloring == "Waypoints") {
                   for (let i = 0; i<waypoints.length; i++) {
                       updateMarkerAndTable(thisAV.waypointParts[i],visualSettings.undiscovered, 31, false);
                   }
                }
                // get the frame pointer for the recursive call we are
                // starting
                thisAV.fp = thisAV.callStack.pop();
                
               // removing old overlays
               if (thisAV.coloring == "Overlays") {
                    for (let i = 0; i < thisAV.highlightRect.length; i++) {
                         thisAV.highlightRect[i].remove();
                    }

                  thisAV.highlightRect.pop();
                  thisAV.highlightRect.pop();
               }
		
                hdxAV.nextAction = "cutSort";
            },
            
            logMessage: function(thisAV) {
                return "Calling the Method";
            }
        },
	{ 
            label: "cutSort",
	    comment: "Finds the Cutting Axis, Median, and sorts",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                // get the subarray needed for the current partition
                // being split
                thisAV.partitionSection =
		    thisAV.waypointParts.slice(thisAV.fp.lowerBound,
					       thisAV.fp.upperBound+1); 

                // coloring
                if (thisAV.coloring == "Waypoints") {
                    for (let i = thisAV.partitionStart[thisAV.fp.currentPart];
			 i <= thisAV.partitionEnd[thisAV.fp.currentPart];
			 i++) {
                        updateMarkerAndTable(thisAV.waypointParts[i],
					     thisAV.visualSettings.parentPartition, 31, false);
                   }
                }
                
                // finding extremes
                thisAV.extremes();
		
                // coloring
                if (thisAV.coloring == "Overlays") {
                    thisAV.highlightRect.push(L.rectangle(
			[[thisAV.fp.minLat, thisAV.fp.minLon],
			 [thisAV.fp.maxLat, thisAV.fp.maxLon]],
			thisAV.visualSettings.parentPartition) );
                    for (let i = 0; i < thisAV.highlightRect.length; i++) {
			thisAV.highlightRect[i].addTo(map);
                    }
		}
                // determine which axis to cut by computing the width
		// of the latitude and longitude ranges
		thisAV.fp.cutLon =
		    distanceInMiles(0, thisAV.minlon,
				    0 ,thisAV.maxlon) >
		    distanceInMiles(thisAV.minlat, 0,
				    thisAV.maxlat, 0);
		
		// sort along the orthogonal axis
                if (thisAV.fp.cutLon) {
		    thisAV.partitionSection.sort(function(a, b) {
			return waypoints[a].lon - waypoints[b].lon;
		    });
		}
                else {
		    thisAV.partitionSection.sort(function(a, b) {
			return waypoints[a].lat - waypoints[b].lat
		    });
		}
               
                let i2=0
                // updating the overall array with the new sorted
                // array for the partition being worked on
                for (let i = thisAV.fp.lowerBound;
		     i < thisAV.fp.lowerBound + thisAV.partitionSection.length;
		     i++) {
                    thisAV.waypointParts[i] = thisAV.partitionSection[i2];
                    i2++;
                }
                hdxAV.nextAction = "setParts";
            },
            
            logMessage: function(thisAV) {
                return "Finding the Cutting Axis and sorting. Then finding the Median";
            }
        },
	{ 
            label: "setParts",
            comment: "Sets the Partitions based on mid point",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                const mid = Math.trunc(thisAV.partitionSection.length/2) +
		    thisAV.fp.lowerBound;                

                // setting the partitions based on cutting axis
                if (thisAV.partitionSection.length % 2 == 0) {
                    thisAV.partitionStart[
			(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)
		    ] = mid;
                    thisAV.partitionEnd[
			(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)
		    ] = thisAV.fp.upperBound;
                 
                    thisAV.partitionStart[thisAV.fp.currentPart] =
			thisAV.fp.lowerBound;
                    thisAV.partitionEnd[thisAV.fp.currentPart] = mid-1;
                    if (thisAV.fp.cutLon) {
			thisAV.median =
			    (waypoints[thisAV.waypointParts[mid]].lon +
			     waypoints[thisAV.waypointParts[mid-1]].lon)/2;
		    }
                    else {
			thisAV.median =
			    (waypoints[thisAV.waypointParts[mid]].lat +
			     waypoints[thisAV.waypointParts[mid-1]].lat)/2;
		    }
                }
                else {
                    thisAV.partitionStart[(thisAV.fp.currentPart +
					   thisAV.fp.partsLeft/2)] = mid+1;
                    thisAV.partitionEnd[(thisAV.fp.currentPart +
					 thisAV.fp.partsLeft/2)] =
			thisAV.fp.upperBound;
                
                    thisAV.partitionStart[thisAV.fp.currentPart] = thisAV.fp.lowerBound;
                    thisAV.partitionEnd[thisAV.fp.currentPart] = mid;
 
                    if (thisAV.fp.cutLon) {
			thisAV.median =
			    (waypoints[thisAV.waypointParts[mid]].lon +
			     waypoints[thisAV.waypointParts[mid+1]].lon)/2;
		    }
                    else {
			thisAV.median =
			    (waypoints[thisAV.waypointParts[mid]].lat +
			     waypoints[thisAV.waypointParts[mid+1]].lat)/2;
		    }
		}
                thisAV.curNumParts++;
                //coloring
                if (thisAV.coloring == "Overlays") {
                    for (let i = 0; i < thisAV.highlightRect.length; i++) {
                        thisAV.highlightRect[i].remove();
                    }

                   thisAV.highlightRect.pop();
                }

                if (thisAV.fp.cutLon) {
                    thisAV.highlightPoly.push(
			L.polyline([
			    [thisAV.fp.maxLat,thisAV.median],
			    [thisAV.fp.minLat,thisAV.median]],
				   visualSettings.visiting)
                    );
                    updateAVControlEntry("cut", "Cutting on " +
					 thisAV.median + " Longitude");

                   if (thisAV.coloring == "Overlays") {
                       thisAV.highlightRect.push(
			   L.rectangle([[thisAV.fp.minLat, thisAV.median],
					[thisAV.fp.maxLat, thisAV.fp.maxLon]],
				       thisAV.visualSettings.childPartitionRed));
                       thisAV.highlightRect.push(
			   L.rectangle([[thisAV.fp.minLat, thisAV.fp.minLon],
					[thisAV.fp.maxLat, thisAV.median]],
				       thisAV.visualSettings.childPartitionBlue));
                   }
		}
		else {
                    thisAV.highlightPoly.push(
			L.polyline([[thisAV.median,thisAV.fp.maxLon],
				    [thisAV.median,thisAV.fp.minLon]],
				   visualSettings.visiting)
                    );
                    updateAVControlEntry("cut", "Cutting on " +
					 thisAV.median + " Latitude");

                  if (thisAV.coloring == "Overlays") {
                      thisAV.highlightRect.push(
			  L.rectangle([[thisAV.median, thisAV.fp.minLon],
				       [thisAV.fp.maxLat, thisAV.fp.maxLon]],
				      thisAV.visualSettings.childPartitionRed)
		      );
                      thisAV.highlightRect.push(
			  L.rectangle([[thisAV.fp.minLat, thisAV.fp.minLon],
				       [thisAV.median, thisAV.fp.maxLon]],
				      thisAV.visualSettings.childPartitionBlue)
		      );
                  }
		}
                // drawing lines
		for (let i = 0; i < thisAV.highlightPoly.length; i++) {
                    thisAV.highlightPoly[i].addTo(map);
                }
		
		// coloring
		if (thisAV.coloring == "Overlays") {
                    for (let i = 0; i < thisAV.highlightRect.length; i++) {
			thisAV.highlightRect[i].addTo(map);
                    }
		}
		if (thisAV.coloring == "Waypoints") {
                    for (let i = thisAV.partitionStart[thisAV.fp.currentPart];
			 i <= thisAV.partitionEnd[thisAV.fp.currentPart];
			 i++) {
			updateMarkerAndTable(thisAV.waypointParts[i],
					     thisAV.visualSettings.childPartitionBlue , 31, false);
                    }
		    
                    for (let i = thisAV.partitionStart[(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)];
			 i <= thisAV.partitionEnd[(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)];i++) {
			updateMarkerAndTable(thisAV.waypointParts[i],
					     thisAV.visualSettings.childPartitionRed , 31, false);
                    }
		}
		
		
		if (document.getElementById("calcOnFly").checked) {
		    hdxAV.nextAction = "calcOnfly";
		}
		else {
		    hdxAV.nextAction = "base";
		}
            },
            
            logMessage: function(thisAV) {
                return "Setting Partitions";
            }
        },
	{
            label: "calcOnfly",
            comment: "calculations for current partitioning",
            code: function(thisAV) {
                // filling 2d array with necessary data for hdxPart
                hdxPart.numParts = thisAV.curNumParts;
                hdxPart.parts = new Array(hdxPart.numParts);
                let partnum = 0;
                for (let p = 0; p < thisAV.numPartitions; p++) {
                    if (thisAV.partitionStart[p] != 0 ||
			thisAV.partitionEnd[p] != 0) {
                        hdxPart.parts[partnum]=new Array();
                        for (let i = thisAV.partitionStart[p];
			     i <= thisAV.partitionEnd[p]; i++) {
                            hdxPart.parts[partnum].push(thisAV.waypointParts[i]);
                        }
                        partnum++;
                    }
                }
		
                //coloring
                for (let i = 0; i < graphEdges.length; i++) {
		    updatePolylineAndTable(i,visualSettings.undiscovered, false);
		}
		
                // adding data table
                hdxPart.partitionAnalysis();
                removeEntryFromAVControlPanel("stats");
                addEntryToAVControlPanel("stats", visualSettings.pseudocodeDefault);
                updateAVControlEntry("stats", hdxPart.styling());
		
                hdxAV.nextAction = "base";                    
            },
            logMessage: function(thisAV) {
                return "calculating stats for current partitioning";
            }
        },
	
	{ 
            label: "base",
            comment: "Checks whether the base case has been hit",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.iterationDone = true;
                
                // checking to see if the base case is hit and if
                // there is anything left on the call stack
                if (thisAV.fp.partsLeft > 2) {
		    hdxAV.nextAction = "recursiveCall";
		}
                else {
		    hdxAV.nextAction = "end";
		}
            },
            
            logMessage: function(thisAV) {
                return "Checking whether the base case is hit";
            }
        },
	{ 
            label: "recursiveCall",
            comment: "Calls the method recursively",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
		// push our two recursive calls onto the stack according to
		// the orientation of the next cut
                if (thisAV.fp.cutLon) {
                    thisAV.callStack.push({
			currentPart: (thisAV.fp.currentPart+thisAV.fp.partsLeft/2), 
			lowerBound: thisAV.partitionStart[(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)], 
			upperBound: thisAV.partitionEnd[(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)], 
			partsLeft: thisAV.fp.partsLeft/2, 
			maxLat: thisAV.fp.maxLat,
			maxLon: thisAV.fp.maxLon,
			minLat: thisAV.fp.minLat, 
			minLon: thisAV.median
		    });
                    thisAV.callStack.push({
			currentPart: thisAV.fp.currentPart, 
			lowerBound: thisAV.partitionStart[thisAV.fp.currentPart], 
			upperBound: thisAV.partitionEnd[thisAV.fp.currentPart], 
			partsLeft: thisAV.fp.partsLeft/2,
			maxLat: thisAV.fp.maxLat, 
			maxLon: thisAV.median, 
			minLat: thisAV.fp.minLat,
			minLon: thisAV.fp.minLon
		    });
		} 
		else {
                    thisAV.callStack.push({
			currentPart: (thisAV.fp.currentPart+thisAV.fp.partsLeft/2), 
			lowerBound: thisAV.partitionStart[(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)], 
			upperBound: thisAV.partitionEnd[(thisAV.fp.currentPart+thisAV.fp.partsLeft/2)], 
			partsLeft: thisAV.fp.partsLeft/2, 
			maxLat: thisAV.fp.maxLat,
			maxLon: thisAV.fp.maxLon,
			minLat: thisAV.median, 
			minLon: thisAV.fp.minLon
		    });
                    thisAV.callStack.push({
			currentPart: thisAV.fp.currentPart, 
			lowerBound: thisAV.partitionStart[thisAV.fp.currentPart], 
			upperBound: thisAV.partitionEnd[thisAV.fp.currentPart], 
			partsLeft: thisAV.fp.partsLeft/2,
			maxLat: thisAV.median, 
			maxLon: thisAV.fp.maxLon, 
			minLat: thisAV.fp.minLat,
			minLon: thisAV.fp.minLon
		    }); 
		}
                hdxAV.nextAction = "methodCall";
            },
            
            logMessage: function(thisAV) {
                return "Calling the Method recursively";
            }
        },
	{ 
	    label: "end",
            comment: "Ends the recursion on this Partition",
	    code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
                //determine if call stack is empty
                if (thisAV.callStack.length == 0) {
		    hdxAV.nextAction = "calculating";
		}
                else {
		    hdxAV.nextAction = "methodCall";
		}
            },
            
            logMessage: function(thisAV) {
                return "Ending the recursion this Partition";
            }
        },
        
        {
            label: "calculating",
            comment: "calculations at the end of the visualization",
            code: function(thisAV) {
                // filling 2d array with nessacary data for hdxPart
                hdxPart.numParts = thisAV.curNumParts;
                hdxPart.parts = new Array(hdxPart.numParts);
                for (let p = 0; p < hdxPart.numParts; p++) {
                    hdxPart.parts[p] = new Array();
                    for (let i = thisAV.partitionStart[p];
			 i <= thisAV.partitionEnd[p]; i++) {
                        hdxPart.parts[p].push(thisAV.waypointParts[i]);
                    }
                }
                // coloring
                for (let i = 0; i < graphEdges.length;i++) {
		    updatePolylineAndTable(i,visualSettings.undiscovered, false);
		}
                // cleaning up graph for final coloring
                for (let i = 0; i < thisAV.highlightRect.length; i++) {
                    thisAV.highlightRect[i].remove();
                }
                thisAV.highlightRect=[];
                for (let i = 0; i < thisAV.highlightPoly.length; i++) {
                    thisAV.highlightPoly[i].setStyle(visualSettings.undiscovered);
                }
                // adding data table
                hdxPart.partitionAnalysis();
                removeEntryFromAVControlPanel("cut");
                addEntryToAVControlPanel("stats", visualSettings.pseudocodeDefault);
                updateAVControlEntry("stats", hdxPart.styling());
		
                hdxAV.nextAction = "cleanup";                    
            },
            logMessage: function(thisAV) {
                return "calculating";
            }
        },
	
	{
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {
                map.setZoom(map.getZoom());
                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
                
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],
    
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        initWaypointsAndConnections(true, true, visualSettings.undiscovered);
        for (let i = 0; i < graphEdges.length; i++) {
	    updatePolylineAndTable(i,{
		color: "#000",
		scale: 0,
		opacity: 0,
		textColor: "white"
	    }, false);
	}
        
        // building pseudocode HTML
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += '</td></tr>' + pcEntry(0,'Partition()','methodCall');
        this.code += '</td></tr>'+ pcEntry(1,'findCuttingAxis()<br/>'+pcIndent(2)+'sort(cuttingAxis)<br/>'+pcIndent(2)+'findMid','cutSort');
        this.code += '</td></tr>' + pcEntry(1,'setPartitions','setParts');
        this.code += '</td></tr>' + pcEntry(1,'if(number of Partitions > 2)','base');
        this.code += '</td></tr>' + pcEntry(2,'Partition(newPartion)<br/>'+pcIndent(4)+'Partition(newPartion2)','recursiveCall');
        this.code += '</td></tr>' + pcEntry(1,'else<br/>'+pcIndent(4)+'//do nothing','end');


    },
    
    setupUI() {
        const algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        // building HTML options
        let newAO = '<br />Number of Recursive Levels: 2<sup><sup><input type="number" id="parts" style="height: 20px; max-width: 30px; font-size: 12px;" onchange="hdxPartitionerAV.rcbCallback()"min="1" max="' + (Math.trunc(Math.log2(waypoints.length))) + '" value="2"></sup></sup><span id="rcbnumParts">='+this.numPartitions+'</span>';
        newAO += `<br/>Coloring Method: <select id="ColoringMethod">
        <option value="Overlays">Overlays</option>
        <option value="Waypoints">Waypoints</option>
        </select>`;
        newAO += '<br/><input id="calcOnFly" type="checkbox"> Show Partition data while running';
        newAO += `<br/>`+hdxPart.colorHtml();
        hdxAV.algOptions.innerHTML = newAO;
         
	// QS parameters
	HDXQSClear(this);
	HDXQSRegisterAndSetNumber(this, "levels", "parts", 1,
				  Math.trunc(Math.log2(waypoints.length)));
	HDXQSRegisterAndSetSelectList(this, "overlay", "ColoringMethod");
	HDXQSRegisterAndSetCheckbox(this, "onfly", "calcOnFly");

        // AVCP entries
        addEntryToAVControlPanel ("undiscovered", visualSettings.undiscovered);
        addEntryToAVControlPanel ("visiting",visualSettings.visiting);
    },

    // cleans up lines and overlays
    cleanupUI() {
        //remove all the polylines made by any global bounding box
        for (let i = 0; i < this.highlightPoly.length; i++) {
            this.highlightPoly[i].remove();
        }
        this.highlightPoly = [];
        for (let i = 0; i < this.highlightRect.length; i++) {
            this.highlightRect[i].remove();
        }
        this.highlightRect=[];	
    },

    idOfAction(action) {
	
        return action.label;
    },
    
    rcbCallback() {
        this.numPartitions =
	    Math.pow(2,document.getElementById('parts').value);
        document.getElementById('rcbnumParts').innerHTML =
	    '<span id="rcbnumParts">='+this.numPartitions+'</span>';
    },

    // set min/max latitudes and longitudes for the current partition
    // section
    extremes() {
       this.maxlat = waypoints[this.partitionSection[0]].lat;
       this.minlat = waypoints[this.partitionSection[0]].lat;
       this.maxlon = waypoints[this.partitionSection[0]].lon;
       this.minlon = waypoints[this.partitionSection[0]].lon;
       for (i of this.partitionSection) {
           if (waypoints[i].lat > this.maxlat) {
	       this.maxlat = waypoints[i].lat;
	   }
           else if (waypoints[i].lat < this.minlat) {
	       this.minlat = waypoints[i].lat;
	   }
           if (waypoints[i].lon > this.maxlon) {
	       this.maxlon = waypoints[i].lon;
	   }
           else if (waypoints[i].lon < this.minlon) {
	       this.minlon = waypoints[i].lon;
	   }
        }
    },
    highlightBoundingBox() {
        this.extremes();
        const nEnds = [[this.maxlat,this.minlon],[this.maxlat,this.maxlon]];
        const sEnds = [[this.minlat,this.minlon],[this.minlat,this.maxlon]];
	const eEnds = [[this.maxlat,this.maxlon],[this.minlat,this.maxlon]];
        const wEnds = [[this.maxlat,this.minlon],[this.minlat,this.minlon]];
	
        this.highlightPoly.push(
            L.polyline(nEnds, visualSettings.undiscovered)
        );
        this.highlightPoly.push(
            L.polyline(sEnds, visualSettings.undiscovered)
        );
        this.highlightPoly.push(
            L.polyline(eEnds, visualSettings.undiscovered)
        );
        this.highlightPoly.push(
            L.polyline(wEnds, visualSettings.undiscovered) 
        );
	
        for (let i = 0; i < this.highlightPoly.length; i++) {
            this.highlightPoly[i].addTo(map);
        }
    }
}
