//
// HDX Quadtree construction AV
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

const hdxQuadtreeAV = {

    // entries for list of AVs
    value: "quadtree",
    name: "Quadtree Construction",
    description: "Construct a quadtree by inserting vertices (waypoints) and refining into smaller quadtrees.",

    // vertices, no edges
    useV: true,
    useE: false,

    //this is used to help determine the universe of our quadtree
    n: 0,
    e: 0,
    w: 0,
    s: 0,
    
    // currentQuadtree is used to track which child of the quadtree we
    // are adding the waypoint to
    currentQuadtree: null,

    // baseQuadtree is used to return back to the original
    // universe-wide quadtree after we are fis
    baseQuadtree: null,

    // used to keep track of which point is being added, which is
    // important because points can be added into either, leaves
    // without refinement, leaves from refinement, or a parent
    currentVertex: null,

    // this is used to return to the specific location in the
    // pseudocode/state machine for recursive calls, notably add as
    // such there is no special function mechanism that allows this to
    // happen. All we are doing is pushing the state we are going to
    // next after a call is made
    callStack: [],

    // used to track the parents of quadtrees, primarily used
    // alongside the childThatContains calls
    qtStack: [],

    // loop variable that tracks which point is currently being added
    // to the base quadtree
    nextToCheck: -1,
    // # leaf quadrants so far
    numLeaves: 1,
    // depth of the quadtree
    maxDepth: 0,
    // default refinement threshold for the quadtree, deterimined with an i/o box before the av runs
    refinement: 3,
    // index for the refinement loop

    // the reason why this does not have to be saved on a stack is
    // because when we are adding points we do not care about previous
    // add calls other than to get us into the correct quadtree as
    // such, the only time we need to reset this variable is when
    // children are created
    refI: -1,
    
    // remaining waypoints to be added to the tree
    numVUndiscovered: waypoints.length,

    // list of polylines showing the universe bounds
    // and divisions representing quadtrees, updated by
    // directionalBoundingBox and addNewPolylines functions below
    boundingPoly: [],

    // list of polyline used to represent the universe of the current
    // quadtree, which is reset and changed whenever the current
    // quadtree is changed
    highlightPoly: [],

    avActions: [
        {
            label: "START",
            comment: "creates bounding box and initializes fields",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                // this gets the specific value for the refinement
                // threshold for the quadtree from the user in the
                // window before they press visualize
                thisAV.refinement = document.getElementById("refinement").value;
                thisAV.nextToCheck = -1;
                thisAV.numLeaves = 1;
                thisAV.maxDepth = 0;
                thisAV.callStack = [];
                thisAV.qtStack = [];
                thisAV.refI = -1; 

                thisAV.numVUndiscovered = waypoints.length;
                hdxAVCP.update("undiscovered", thisAV.numVUndiscovered +
			       " vertices not yet visited");

                // other stuff needs to go here but at least the
                // boundingBox should be generated from here
                thisAV.boundingPoly = [];
                thisAV.generateBoundingBox();

                thisAV.baseQuadtree = new Quadtree(thisAV.s,thisAV.n,thisAV.w,thisAV.e,thisAV.refinement);
                thisAV.currentQuadtree = thisAV.baseQuadtree;
                thisAV.currentVertex = null;

                hdxAV.iterationDone = true;
                hdxAV.nextAction = "topForLoop";
            },
            logMessage: function(thisAV) {
                return "Creating bounding box that contains all waypoints";
            }

        },

        {
            label: "topForLoop",
            comment: "main for loop that iterates over all waypoints to add each to the quadtree",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.currentQuadtree = thisAV.baseQuadtree;
                thisAV.qtStack = [];
                thisAV.nextToCheck++;
                
                if (thisAV.nextToCheck < waypoints.length) {
                    waypoints[thisAV.nextToCheck].num = thisAV.nextToCheck;
                    thisAV.currentVertex = waypoints[thisAV.nextToCheck];
                    updateMarkerAndTable(thisAV.nextToCheck,
					 visualSettings.visiting, 30, false);
                    hdxAVCP.update("visiting","Visiting: #" +
				   thisAV.currentVertex.num + " " +
				   thisAV.currentVertex.label);
                    thisAV.numVUndiscovered--;
                    hdxAVCP.update("undiscovered", thisAV.numVUndiscovered +
				   " vertices not yet visited");
                    hdxAVCP.update("numLeaves", "Number of leaf quadtrees: " +
				   thisAV.numLeaves);
                    hdxAVCP.update("maxDepth", "Depth of the quadtree: " +
				   thisAV.maxDepth);
                    thisAV.qtStack.push(thisAV.currentQuadtree);
                    thisAV.highlightBoundingBox();
                    hdxAV.nextAction = "topAddPoint";
                }
		else {
                    hdxAV.nextAction = "cleanup";
                }
            },
            logMessage: function(thisAV) {
                return "Top of main for loop over vertices, check=" + thisAV.nextToCheck;
            },
	    cbp: {
		type: hdxCBPTypes.VARIABLE,
		selector: {
		    type: hdxCBPSelectors.VERTEX,
		    label: "Stop at check ="
		},
		f: function(thisAV, matchvnum, matchtype, textval) {
		    return isCBPVertexMatch(thisAV.nextToCheck,
					    matchvnum, matchtype, textval);
		}		
            }
        },

        {
            label: "topAddPoint",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.callStack.push("topForLoop");
                hdxAV.nextAction = "bottomAddPoint";

            },
            logMessage: function(thisAV) {
                return "Adding vertex #" + thisAV.nextToCheck + ": " + waypoints[thisAV.nextToCheck].label + " to quadtree";
            }
        },

        {
            label: "bottomAddPoint",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.nextAction = "isLeaf";

            },
            logMessage: function(thisAV) {
                return "Calling method that adds vertex #"+ thisAV.nextToCheck + " to quadtree";
            }
        },

        {
            label: "isLeaf",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                if (thisAV.currentQuadtree.isLeaf()) {
                    hdxAV.nextAction = "pushPoint";
                }
		else {
                    hdxAV.nextAction = "notLeafFindChild";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if the current quadtree is a leaf";
            }
        },

        {
            label: "pushPoint",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                updateMarkerAndTable(thisAV.currentVertex.num,
				     visualSettings.spanningTree,30,false);

                thisAV.currentQuadtree.points.push(thisAV.currentVertex);
                hdxAV.nextAction = "ifRefine";

            },
            logMessage: function(thisAV) {
                return "Adding vertex #" + thisAV.nextToCheck + " to this quadtree's points array";
            }
        },

        {
            label: "ifRefine",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                if (thisAV.currentQuadtree.points.length < thisAV.refinement) {
                        
                    thisAV.currentQuadtree = thisAV.qtStack.pop();
                    thisAV.highlightBoundingBox();
                        
                    hdxAV.nextAction = thisAV.callStack.pop();
                }
		else {
                    for (let i = 0; i < thisAV.currentQuadtree.points.length; i++) {
                        updateMarkerAndTable(thisAV.currentQuadtree.points[i].num,visualSettings.discovered,
					     31,false);
                    }
                    hdxAV.nextAction = "makeChildren";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if quadtree leaf has more vertices than the refinement";
            }
        },

        {
            label: "makeChildren",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
                thisAV.refI = -1;
		// this calls a function of the quadtree object that
		// creates the quadtree children		
                thisAV.currentQuadtree.makeChildren();

                // this method call adds new polylines to the map to
                // represent the creation of new quadtree children and
                // that the refinement process has begun
                thisAV.addNewPolylines();
                thisAV.numLeaves += 3
                hdxAVCP.update("numLeaves", "Number of leaf quadtrees: " +
			       thisAV.numLeaves);
                if (thisAV.maxDepth < thisAV.qtStack.length) {
                    thisAV.maxDepth = thisAV.qtStack.length;
                    hdxAVCP.update("maxDepth","Depth of the quadtree: " +
				   thisAV.maxDepth);
                }

                //this will overwrite existing polylines
                for (let i = 0; i < thisAV.boundingPoly; i++) {
                    thisAV.boundingPoly[i].addTo(map);
                }
                hdxAV.nextAction = "topRefLoop";

            },
            logMessage: function(thisAV) {
                return "Making children for the current quadtree";
            }
        },

        {
            label: "topRefLoop",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);       
                
                thisAV.refI++;
                thisAV.currentVertex = thisAV.currentQuadtree.points[thisAV.refI];

                if (thisAV.qtStack.length > 1) {
                    thisAV.qtStack.pop();
                }

                hdxAV.iterationDone = true;
                if (thisAV.refI < thisAV.refinement) {
                    hdxAV.nextAction = "loopFindChild";
                    updateMarkerAndTable(thisAV.currentVertex.num,visualSettings.visiting,30,false);
                    hdxAVCP.update("visiting","Visiting: #" +
				   thisAV.currentVertex.num + " " +
				   thisAV.currentVertex.label);
                }
		else {
                    hdxAV.nextAction = "pointsNull";
                }
            },
            logMessage: function(thisAV) {
                return "Top of for loop over points array in the current quadtree";
            }
        },

        {
            label: "loopFindChild",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.callStack.push("loopChildAdd");
                
                hdxAV.nextAction = "bottomFindChild";
            },
            logMessage: function(thisAV) {
                return "Finding the which child vertex #" + thisAV.currentVertex.num + " belongs to";
            }
        },

        {
            label: "loopChildAdd",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.callStack.push("topRefLoop");
                hdxAV.nextAction = "bottomAddPoint";
            },
            logMessage: function(thisAV) {
                return "Adding vertex #" + thisAV.currentVertex.num + " to new child quadtree";
            }
        },

        {
            label: "pointsNull",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.refI = -1;
                thisAV.currentQuadtree.points = null;

                hdxAV.nextAction = "topForLoop";
            },
            logMessage: function(thisAV) {
                return "Setting the points array of the parent quadtree to null";
            }
        },

        {
            label: "notLeafFindChild",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.callStack.push("notLeafChildAdd");
                hdxAV.nextAction = "bottomFindChild";

            },
            logMessage: function(thisAV) {
                return "Finding the which child vertex #" + thisAV.currentVertex.num + " belongs to";
            }
        },

        {
            label: "notLeafChildAdd",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.callStack.push("topForLoop");
                hdxAV.nextAction = "bottomAddPoint";
            },
            logMessage: function(thisAV) {
                return "Finding the which child vertex #" + thisAV.currentVertex.num + " belongs to";
            }
        },

        {
            label: "bottomFindChild",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                hdxAV.nextAction = "findChildLat";

            },
            logMessage: function(thisAV) {
                return "Adding vertex #" + thisAV.currentVertex.num + " to child quadtree";;
            }
        },

        {
            label: "findChildLat",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                if (thisAV.currentVertex.lat < thisAV.currentQuadtree.midLat) {
                    hdxAV.nextAction = "topFindChildLng";
                }
		else {
                    hdxAV.nextAction = "bottomFindChildLng";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if vertex #" + thisAV.currentVertex.num + " is in the north or south of the quadtree"
            }
        },

        {
            label: "topFindChildLng",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                if (thisAV.currentVertex.lon < thisAV.currentQuadtree.midLng) {
                    hdxAV.nextAction = "returnSW";
                }
		else {
                    hdxAV.nextAction = "returnSE";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if vertex #" + thisAV.currentVertex.num + " is in the southwest or southeast of the quadtree";
            }
        },

        {
            label: "bottomFindChildLng",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                if (thisAV.currentVertex.lon < thisAV.currentQuadtree.midLng) {
                    hdxAV.nextAction = "returnNW";
                }
		else {
                    hdxAV.nextAction = "returnNE";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if vertex #" + thisAV.currentVertex.num + " is in the northwest or northeast of the quadtree";
            }
        },

        {
            label: "returnSW",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.qtStack.push(thisAV.currentQuadtree);
                // children should be made by this point, if not there
                // is a big problem
                thisAV.currentQuadtree = thisAV.currentQuadtree.sw;
                thisAV.highlightBoundingBox();
               
                hdxAV.nextAction = thisAV.callStack.pop();
            },
            logMessage: function(thisAV) {
                return "Returning that vertex #" + thisAV.currentVertex.num +  " is in the southwest of the quadtree";
            }
        },

        {
            label: "returnSE",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.qtStack.push(thisAV.currentQuadtree);

                thisAV.currentQuadtree = thisAV.currentQuadtree.se;
                thisAV.highlightBoundingBox();

                hdxAV.nextAction = thisAV.callStack.pop();
            },
            logMessage: function(thisAV) {
                return "Returning that vertex #" + thisAV.currentVertex.num +  " is in the southeast of the quadtree";;
            }
        },

        {
            label: "returnNW",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.qtStack.push(thisAV.currentQuadtree);
                
                thisAV.currentQuadtree = thisAV.currentQuadtree.nw;
                thisAV.highlightBoundingBox();
               
                hdxAV.nextAction = thisAV.callStack.pop();
            },
            logMessage: function(thisAV) {
                return "Returning that vertex #" + thisAV.currentVertex.num +  " is in the northwest of the quadtree";
            }
        },

        {
            label: "returnNE",
            comment: "",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.qtStack.push(thisAV.currentQuadtree);

                thisAV.currentQuadtree = thisAV.currentQuadtree.ne;
                thisAV.highlightBoundingBox();
              
                hdxAV.nextAction = thisAV.callStack.pop();
            },
            logMessage: function(thisAV) {
                return "Returning that vertex #" + thisAV.currentVertex.num +  " is in the northeast of the quadtree";
            }
        },

        {
            label: "cleanup",
            comment: "cleanup and updates at the end of the visualization",
            code: function(thisAV) {
                hdxAV.algStat.innerHTML =
                    "Done! Visited " + waypoints.length + " waypoints.";
                hdxAVCP.update("visiting", "");
                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
                for (let i = 0; i < thisAV.highlightPoly.length; i++) {
                    thisAV.highlightPoly[i].remove();
                }
            },
            logMessage: function(thisAV) {
                return "Cleanup and finalize visualization";
            }
        }
    ],
    
    prepToStart() {

        // pseudocode for the start state    
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += `qt &larr; new Quadtree(minLat,maxLat,minLng,maxLng,refinement)<br />`;
        this.code += `qt.points &larr; []<br />`
        this.code += `qt.nw, qt.ne, qt.sw, qt.se &larr; null<br />`;

        // pseudocode for the top loop
        this.code += '</td></tr>' +
            pcEntry(0,'for(check &larr; 0 to |V| - 1)',"topForLoop");
        this.code += '</td></tr>' +
            pcEntry(1,'qt.add(v[check])',"topAddPoint");

        // pseudocode for add function
        this.code += '</td></tr>' +
            pcEntry(0,'add(vertex)',"bottomAddPoint");
        this.code += '</td></tr>' +
            pcEntry(1,'if(qt.isLeaf())',"isLeaf");
        this.code += '</td></tr>' +
            pcEntry(2,'qt.points.push[vertex]',"pushPoint");
        this.code += '</td></tr>' +
            pcEntry(2,'if(qt.points.length >= refinement)',"ifRefine");
        this.code += '</td></tr>' +
            pcEntry(3,'midLat &larr; (maxLat + minLat) / 2<br />' +
                pcIndent(6) + 'midLng &larr; (maxLng + minLng) / 2<br />' +
                pcIndent(6) + 'qt.nw &larr; new Quadtree(midLat,maxLat,minLng,midLng,refinement)<br />' +
                pcIndent(6) + 'qt.ne &larr; new Quadtree(midLat,maxLat,midLng,maxLng,refinement)<br />' +
                pcIndent(6) + 'qt.sw &larr; new Quadtree(minLat,midLat minLng,midLng,refinement)<br />' +
                pcIndent(6) + 'qt.se &larr; new Quadtree(minLat,midLat,midLng,maxLng,refinement)',"makeChildren");
        this.code += '</td></tr>' +
            pcEntry(3,'for(i &larr; 0 to qt.points.length)',"topRefLoop");
        this.code += '</td></tr>' +
            pcEntry(4,'c &larr; childThatContains(qt.points[i])',"loopFindChild");
        this.code += '</td></tr>' +
            pcEntry(4,'c.add(qt.points[i])',"loopChildAdd");
        this.code += '</td></tr>' +
            pcEntry(3,'qt.points &larr; []',"pointsNull");
        this.code += '</td></tr>' + 
            pcEntry(1,'else',"");
        this.code += '</td></tr>' +
            pcEntry(2,'c &larr; childThatContains(qt.points[i])',"notLeafFindChild");
        this.code += '</td></tr>' +
            pcEntry(2,'c.add(vertex)',"notLeafChildAdd");

        // pseudocode for childThatContains
        this.code += '</td></tr>' +
            pcEntry(0,'childThatContains(vertex)',"bottomFindChild");
        this.code += '</td></tr>' +
            pcEntry(1,'if(vertex.lat < midLat)',"findChildLat");
        this.code += '</td></tr>' +
            pcEntry(2,'if(vertex.lng < midLng)',"topFindChildLng");
        this.code += '</td></tr>' +
            pcEntry(3,'return sw',"returnSW");
        this.code += '</td></tr>' + 
            pcEntry(2,'else',"");
        this.code += '</td></tr>' +
            pcEntry(3,'return se',"returnSE");
        this.code += '</td></tr>' +
            pcEntry(1,'else',"");
        this.code += '</td></tr>' +
            pcEntry(2,'if(vertex.lng < midLng)',"bottomFindChildLng");
        this.code += '</td></tr>' +
            pcEntry(3,'return nw',"returnNW");
        this.code += '</td></tr>' +
            pcEntry(2,'else',"");
        this.code += '</td></tr>' +
            pcEntry(3,'return ne',"returnNE");
    },

    setupUI() {

        let newAO = 'Refinement Threshold <input type="number" id="refinement" min="2" max="' 
        + (waypoints.length) + '" value="3">';

        newAO += `<br /><input id="squareBB" type="checkbox" name="Square Bounding Box"/>&nbsp;
        Square Bounding Box<br />`;

        hdxAV.algOptions.innerHTML = newAO;
	
	// QS parameters
	HDXQSClear(this);
	HDXQSRegisterAndSetNumber(this, "refinement", "refinement", 2,
				  waypoints.length);
	HDXQSRegisterAndSetCheckbox(this, "box", "squareBB");

	// AVCP entries
        hdxAVCP.add("undiscovered", visualSettings.undiscovered); 
        hdxAVCP.add("visiting", visualSettings.visiting)
        hdxAVCP.add("numLeaves", visualSettings.discovered);
        hdxAVCP.add("maxDepth", visualSettings.highlightBounding);
    },

    cleanupUI() {
        // remove all the polylines made by the bounding box and the quadtree
        for (let i = 0; i < this.boundingPoly.length; i++) {
            this.boundingPoly[i].remove();
        }
        for (let i = 0; i < this.highlightPoly.length; i++) {
            this.highlightPoly[i].remove();
        }
        this.boundingPoly = [];
        this.highlightPoly = [];
    },

    idOfAction(action) {
	
        return action.label;
    },
    // this function generates the bounding box that represents the
    // universe of the quadtree
    generateBoundingBox() {
        this.n = parseFloat(waypoints[0].lat);
        this.s = parseFloat(waypoints[0].lat);
        this.e = parseFloat(waypoints[0].lon);
        this.w = parseFloat(waypoints[0].lon);
        for (let i = 1; i < waypoints.length; i++) {

            if (waypoints[i].lat > this.n) {
                this.n = parseFloat(waypoints[i].lat);
            }
	    else if (waypoints[i].lat < this.s) {
                this.s = parseFloat(waypoints[i].lat);
            }
            if (waypoints[i].lon > this.e) {
                this.e = parseFloat(waypoints[i].lon);
            }
	    else if (waypoints[i].lon < this.w) {
                this.w = parseFloat(waypoints[i].lon);
            }
        }

        // creating the polylines for the bounding box
        
        // if square bounding box is not selected, then the quadtree
        // will be split as a rectangle
        let nEnds = [[this.n,this.w],[this.n,this.e]];
        let sEnds = [[this.s,this.w],[this.s,this.e]];
        let eEnds = [[this.n,this.e],[this.s,this.e]];
        let wEnds = [[this.n,this.w],[this.s,this.w]];
        
        if (document.getElementById("squareBB").checked) {
            const EW = distanceInMiles(nEnds[0][0],nEnds[0][1],nEnds[1][0],nEnds[1][1]);
            const NS = distanceInMiles(eEnds[0][0],eEnds[0][1],eEnds[1][0],eEnds[1][1]);
            let difference;
            //check if the difference between the east west is longer than the north south
            if (EW > NS) {
                difference = (EW - NS) / 69;
                this.n += difference / 2;
                this.s -= difference / 2;

            }
	    else {
                difference = (NS - EW) / (Math.cos(Math.abs(this.n - this.s) / 2) * 69);
                this.e += difference / 2;
                this.w -= difference / 2;
            }

            nEnds = [[this.n,this.w],[this.n,this.e]];
            sEnds = [[this.s,this.w],[this.s,this.e]];
            eEnds = [[this.n,this.e],[this.s,this.e]];
            wEnds = [[this.n,this.w],[this.s,this.w]];
        }
        this.boundingPoly.push(
            L.polyline(nEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        this.boundingPoly.push(
            L.polyline(sEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        this.boundingPoly.push(
            L.polyline(eEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        this.boundingPoly.push(
            L.polyline(wEnds, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            }) 
        );
	
        for (let i = 0; i < 4; i++) {
            this.boundingPoly[i].addTo(map);
        }
    },
    
    addNewPolylines() {
        const nsEdge = this.currentQuadtree.makeNSedge();
	const ewEdge = this.currentQuadtree.makeEWedge();
                
        this.boundingPoly.push(
            L.polyline(nsEdge, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        this.boundingPoly.push(
            L.polyline(ewEdge, {
                color: visualSettings.undiscovered.color,
                opacity: 0.7,
                weight: 3
            })
        );
        for (let i = 0; i < this.boundingPoly.length; i++) {
            this.boundingPoly[i].addTo(map);
        }
    },
    
    highlightBoundingBox() {
        for (let i = 0; i < this.highlightPoly.length; i++) {
            this.highlightPoly[i].remove();
        }
        this.highlightPoly = [];
	
        const n = this.currentQuadtree.maxLat;
        const s = this.currentQuadtree.minLat;
        const e = this.currentQuadtree.maxLng;
        const w = this.currentQuadtree.minLng;
	
        const nEnds = [[n,w],[n,e]];
        const sEnds = [[s,w],[s,e]];
        const eEnds = [[n,e],[s,e]];
        const wEnds = [[n,w],[s,w]];

        this.highlightPoly.push(
            L.polyline(nEnds, visualSettings.highlightBounding)
        );
        this.highlightPoly.push(
            L.polyline(sEnds, visualSettings.highlightBounding)
        );
        this.highlightPoly.push(
            L.polyline(eEnds, visualSettings.highlightBounding)
        );
        this.highlightPoly.push(
            L.polyline(wEnds, visualSettings.highlightBounding) 
        );

        for (let i = 0; i < this.highlightPoly.length; i++) {
            this.highlightPoly[i].addTo(map);
        }
    }    
};

let hdxQTk = 0;
// Quadtree object constructor
function Quadtree(minLat,maxLat,minLng,maxLng,refinement) {
    this.maxLat = maxLat;
    this.maxLng = maxLng;
    this.minLat = minLat;
    this.minLng = minLng;
    this.midLat = (maxLat + minLat) / 2;
    this.midLng = (maxLng + minLng) / 2;
    this.nw = null;
    this.ne = null;
    this.sw = null;
    this.se = null;    
    // determines the refinement factor of the quadtree
    this.refinement = refinement;

    // contains waypoint objects
    this.points = [];

    this.refineIfNeeded = function() {
        if (this.points.length == this.refinement) {
           this.makeChildren();

            for (let i = 0; i < this.points.length; i++) {
                this.childThatContains(this.points[i].lat,this.points[i].lon).add(this.points[i]);
            }
            this.points = [];
        }
    }
    this.makeChildren = function() {
        this.nw = new Quadtree(this.midLat, this.maxLat, this.minLng, this.midLng, this.refinement);
        this.ne = new Quadtree(this.midLat, this.maxLat, this.midLng, this.maxLng, this.refinement);
        this.sw = new Quadtree(this.minLat, this.midLat, this.minLng, this.midLng, this.refinement);
        this.se = new Quadtree(this.minLat, this.midLat, this.midLng, this.maxLng, this.refinement);
    }
    this.makeNSedge = function() {
        return [[this.minLat,this.midLng],[this.maxLat,this.midLng]];
    }
    this.makeEWedge = function() {
        return [[this.midLat,this.minLng],[this.midLat,this.maxLng]]
    }
    this.childThatContains = function(lat,lng) {
        if (lat < this.midLat) {
            if (lng < this.midLng) {
            return this.sw;
            }
            else {
            return this.se;
            }
        }
        else {
            if (lng < this.midLng) {
		return this.nw;
            }
            else {
		return this.ne;
            }
        }
    }
    this.get = function(lat,lng) {
        if (this.isLeaf()) {
            for (let i = 0; i < points.length; i++) {
                if (this.points[i].lat == lat && points[i].lon == lng) {
                    return this.points[i];
                }
            }
            return null;
        } 
        // if not a leaf return the quadtree that would contain this point
        return this.childThatContains(lat,lng).get(lat,lng);
    }
    this.isLeaf = function() {
        return this.se == null;
    }
    this.add = function(waypoint) {
        if (this.isLeaf()) {
            this.points.push(waypoint);
            this.refineIfNeeded();
        }
	else {
            this.childThatContains(waypoint.lat,waypoint.lon).add(waypoint);
        }
    }
    // this version takes an array parameter
    this.mortonOrderPoly = function(boundingPoly) {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {   
            const nsEdge = this.makeNSedge();
            const ewEdge = this.makeEWedge();
            
            boundingPoly.push(
                L.polyline(nsEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            );
            boundingPoly.push(
                L.polyline(ewEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            )
            this.nw.mortonOrderPoly(boundingPoly);
            this.ne.mortonOrderPoly(boundingPoly);
            this.sw.mortonOrderPoly(boundingPoly);
            this.se.mortonOrderPoly(boundingPoly);
        }
    }
    // this version does not require an array parameter
    this.mortonOrder = function() {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {
            this.nw.mortonOrder();
            this.ne.mortonOrder();
            this.sw.mortonOrder();
            this.se.mortonOrder();
        }
    }

    this.hilbertOrder = function(orientation) {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {
            switch (orientation) {
                //case 0 is equivalent to the orientation being a u
            case 0:
                this.nw.hilbertOrder(3);
                this.sw.hilbertOrder(0);
                this.se.hilbertOrder(0);
                this.ne.hilbertOrder(1);
                break;
                // case 1 is equivalent to the orientation being a c
            case 1:
                this.se.hilbertOrder(2);
                this.sw.hilbertOrder(1);
                this.nw.hilbertOrder(1);
                this.ne.hilbertOrder(0);
                
                break;
                // case 2 is equivalent to the orientation being ∩
            case 2:
                this.se.hilbertOrder(1);
                this.ne.hilbertOrder(2);
                this.nw.hilbertOrder(2);
                this.sw.hilbertOrder(3);
                break;
                // case 3 is equivalent to the orientation being ɔ
            case 3:
                this.nw.hilbertOrder(0);
                this.ne.hilbertOrder(3);
                this.se.hilbertOrder(3);
                this.sw.hilbertOrder(2);
                break;
                // case 4 is equivalent to the orientaiton being u but
                // the order is inverted
            case 4:
                this.ne.hilbertOrder(5);
                this.se.hilbertOrder(4);
                this.sw.hilbertOrder(4);
                this.nw.hilbertOrder(7);
                break;
                // case 5 is equivalent to the orientation being c but
                // the order is inverted
            case 5:
                this.ne.hilbertOrder(4);
                this.nw.hilbertOrder(5);
                this.sw.hilbertOrder(5);
                this.se.hilbertOrder(6);
                break;
                // case 6 is equivalent to the orientation being ∩ but
                // the order is inverted
            case 6:
                this.sw.hilbertOrder(7);
                this.nw.hilbertOrder(6);
                this.ne.hilbertOrder(6);
                this.se.hilbertOrder(5);
                break;
                // case 7 is equivalent to the orientation being ɔ but
                // the order is inverted
            case 7:
                this.sw.hilbertOrder(6);
                this.se.hilbertOrder(7);
                this.ne.hilbertOrder(7);
                this.nw.hilbertOrder(4);
                break;
            }
        }
    }
    
    this.hilbertOrderPoly = function(orientation,boundingPoly) {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {
            const nsEdge = this.makeNSedge();
            const ewEdge = this.makeEWedge();
            
            boundingPoly.push(
                L.polyline(nsEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            );
            boundingPoly.push(
                L.polyline(ewEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            )
            switch (orientation) {
                // case 0 is equivalent to the orientation being a u
            case 0:
                this.nw.hilbertOrderPoly(3,boundingPoly);
                this.sw.hilbertOrderPoly(0,boundingPoly);
                this.se.hilbertOrderPoly(0,boundingPoly);
                this.ne.hilbertOrderPoly(1,boundingPoly);
                break;
                // case 1 is equivalent to the orientation being a c
            case 1:
                this.se.hilbertOrderPoly(2,boundingPoly);
                this.sw.hilbertOrderPoly(1,boundingPoly);
                this.nw.hilbertOrderPoly(1,boundingPoly);
                this.ne.hilbertOrderPoly(0,boundingPoly);
                
                break;
                // case 2 is equivalent to the orientation being ∩
            case 2:
                this.se.hilbertOrderPoly(1,boundingPoly);
                this.ne.hilbertOrderPoly(2,boundingPoly);
                this.nw.hilbertOrderPoly(2,boundingPoly);
                this.sw.hilbertOrderPoly(3,boundingPoly);
                break;
                // case 3 is equivalent to the orientation being ɔ
            case 3:
                this.nw.hilbertOrderPoly(0,boundingPoly);
                this.ne.hilbertOrderPoly(3,boundingPoly);
                this.se.hilbertOrderPoly(3,boundingPoly);
                this.sw.hilbertOrderPoly(2,boundingPoly);
                break;
                // case 4 is equivalent to the orientaiton being u but
                // the order is inverted
            case 4:
                this.ne.hilbertOrderPoly(5,boundingPoly);
                this.se.hilbertOrderPoly(4,boundingPoly);
                this.sw.hilbertOrderPoly(4,boundingPoly);
                this.nw.hilbertOrderPoly(7,boundingPoly);
                break;
                // case 5 is equivalent to the orientation being c but
                // the order is inverted
            case 5:
                this.ne.hilbertOrderPoly(4,boundingPoly);
                this.nw.hilbertOrderPoly(5,boundingPoly);
                this.sw.hilbertOrderPoly(5,boundingPoly);
                this.se.hilbertOrderPoly(6,boundingPoly);
                break;
                // case 6 is equivalent to the orientation being ∩ but
                // the order is inverted
            case 6:
                this.sw.hilbertOrderPoly(7,boundingPoly);
                this.nw.hilbertOrderPoly(6,boundingPoly);
                this.ne.hilbertOrderPoly(6,boundingPoly);
                this.se.hilbertOrderPoly(5,boundingPoly);
                break;
                // case 7 is equivalent to the orientation being ɔ but
                // the order is inverted
            case 7:
                this.sw.hilbertOrderPoly(6,boundingPoly);
                this.se.hilbertOrderPoly(7,boundingPoly);
                this.ne.hilbertOrderPoly(7,boundingPoly);
                this.nw.hilbertOrderPoly(4,boundingPoly);
                break;
            }
        }
    }
    this.mooreOrder = function(orientation) {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {
            this.nw.hilbertOrder(5);
            this.sw.hilbertOrder(5);
            this.se.hilbertOrder(7);
            this.ne.hilbertOrder(7);
        }
    }
    this.mooreOrderPoly = function(boundingPoly) {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {
            const nsEdge = this.makeNSedge();
            const ewEdge = this.makeEWedge();
            
            boundingPoly.push(
                L.polyline(nsEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            );
            boundingPoly.push(
                L.polyline(ewEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            );
            this.nw.hilbertOrderPoly(5,boundingPoly);
            this.sw.hilbertOrderPoly(5,boundingPoly);
            this.se.hilbertOrderPoly(7,boundingPoly);
            this.ne.hilbertOrderPoly(7,boundingPoly);
        }
    }
    this.greyOrder = function(orientation) {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {
            switch(orientation) {
                // case 0 is equivalent to the orientation being a u
            case 0:
                this.nw.greyOrder(0);
                this.sw.greyOrder(1);
                this.se.greyOrder(1);
                this.ne.greyOrder(0);
                break;
                // case 1 is equivalent to the orientation being a ∩
            case 1:
                this.se.greyOrder(1);
                this.ne.greyOrder(0);
                this.nw.greyOrder(0);
                this.sw.greyOrder(1);
                break;
            }
        }
    }
    this.greyOrderPoly = function(orientation,boundingPoly) {
        if (this.isLeaf()) {
            for (let i = 0; i < this.points.length; i++) {
                if (this.points[i] != null) {
                    this.points[i].value = hdxQTk;
                    hdxQTk++;
                }
            }
        }
	else {
            const nsEdge = this.makeNSedge();
            const ewEdge = this.makeEWedge();
            
            boundingPoly.push(
                L.polyline(nsEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            );
            boundingPoly.push(
                L.polyline(ewEdge, {
                    color: visualSettings.undiscovered.color,
                    opacity: 0.7,
                    weight: 3
                })
            )
            switch (orientation) {
                // case 0 is equivalent to the orientation being a u
            case 0:
                this.nw.greyOrderPoly(0,boundingPoly);
                this.sw.greyOrderPoly(1,boundingPoly);
                this.se.greyOrderPoly(1,boundingPoly);
                this.ne.greyOrderPoly(0,boundingPoly);
                break;
                // case 1 is equivalent to the orientation being a ∩
            case 1:
                this.se.greyOrderPoly(1,boundingPoly);
                this.ne.greyOrderPoly(0,boundingPoly);
                this.nw.greyOrderPoly(0,boundingPoly);
                this.sw.greyOrderPoly(1,boundingPoly);
                break;
            }
        }
    }
};
