//
// HDX Brute-force convex hull AV
//
// METAL Project
//
// Primary Authors: Maria Bamundo and Jim Teresco
//

// Brute-force convex hull AV
// based on original code by Arjol Pengu and Maria Bamundo
const hdxBFConvexHullAV = {

    // entries for list of AVs
    value: "bfch",
    name: "Brute-Force Convex Hull",
    description: "Compute the convex hull of the vertices (waypoints) using a brute-force algorithm.",
    
    // vertices, no edges
    useV: true,
    useE: false,

    // pseudocode
    code:'<table class="pseudocode">' +
        pcEntry(0, "hull &larr; new list", "START") +
        pcEntry(0, "for (v<sub>1</sub> &larr; 0 to |V|-2)", "v1forLoopTop") +
        pcEntry(1, "for (v<sub>2</sub> &larr; v<sub>1</sub>+1 to |V|-1)", "v2forLoopTop") +
        pcEntry(2, [ "// find line through v<sub>1</sub> and v<sub>2</sub>",
                     "a &larr; v<sub>2</sub>.lat - v<sub>1</sub>.lat",
                     "b &larr; v<sub>1</sub>.lon - v<sub>2</sub>.lon",
                     "c &larr; v<sub>1</sub>.lon*v<sub>2</sub>.lat - v<sub>1</sub>.lat*v<sub>2</sub>.lon",
                     "eliminated &larr; false",
                     "lookingFor &larr; UNKNOWN" ],
                "calculateLine") +
        pcEntry(2, "for (v<sub>test</sub> &larr; 0 to |V|-1), skip v<sub>1</sub>, v<sub>2</sub>", "vtestforLoopTop") +
        pcEntry(3, "checkVal &larr; a*v<sub>test</sub>.lon + b*v<sub>test</sub>.lat - c",
                "computeCheckVal") +
        pcEntry(3, "if checkVal = 0", "isCheckVal0") +
        pcEntry(4, "if v<sub>test</sub> not between v<sub>1</sub> and v<sub>2</sub>", "checkBetween") +
        pcEntry(5, "eliminated &larr; true; break", "isColinearNotBetween") +
        pcEntry(3, "else", "") +
        pcEntry(4, "if lookingFor = UNKNOWN", "checkFirst") +
        pcEntry(5, "if checkVal < 0", "isCheckValNegative") +
        pcEntry(6, "lookingFor &larr; NEGATIVE", "setNegative") +
        pcEntry(5, "else if checkVal > 0", "isCheckValPositive") +
        pcEntry(6, "lookingFor &larr; POSITIVE", "setPositive") +
        pcEntry(4, "else", "") +
        pcEntry(5, "if lookingFor = POSITIVE and checkVal < 0 or lookingFor = NEGATIVE and checkVal > 0",
                "checkSameSide") +
        pcEntry(6, "eliminated &larr; true; break", "notSameSide") +
        pcEntry(3, "if not eliminated", "checkEliminated") +
        pcEntry(4, "hull.add(v<sub>1</sub>,v<sub>2</sub>)", "addToHull") +
        '</table>',

    // the list of points in the convex hull being computed
    hullPoints: [],

    // the list of Polylines that make up the hull so far
    hullSegments: [],

    // the list of segments by endpoints that make up the hull
    hullSegmentEndpoints: [],

    // the v1, v2, and btest loop indices for our deconstructed nested loop
    hullv1: 0,
    hullv1: 0,
    hullvtest: 0,
    
    convexLineHull: [],
    visitingLine: [],
    currentSegment: null,

    // coeffients for equation of the line connecting pairs of points
    a: 0,
    b: 0,
    c: 0,

    // algorithm statistics
    segmentsConsidered: 0,
    checkValThisSegment: 0,
    checkValComputations: 0,

    // additional variables needed for search to determine if a
    // segment is part of the hull
    eliminated: false,
    lookingFor: "UNKNOWN",
    
    visualSettings: {
        hullv1: visualSettings.startVertex,
        hullv2: visualSettings.endVertex,
        hullvtest: visualSettings.visiting,
        checkedPositive: {
            color: visualSettings.discovered.color,
            textColor: "white",
            scale: 6,
            name: "checkedPositive",
            value: 0
        },
        checkedNegative: {
            color: "rgb(241, 115, 255)",
            textColor: "white",
            scale: 6,
            name: "checkedNegative",
            value: 0
        },
        mismatch: visualSettings.mismatchFound,
        hullComponent: visualSettings.spanningTree
    },

    // helper function to draw and set the current segment, i to j
    mapCurrentSegment() {

        const visitingLine = [];
        visitingLine[0] = [waypoints[this.hullv1].lat, waypoints[this.hullv1].lon];
        visitingLine[1] = [waypoints[this.hullv2].lat, waypoints[this.hullv2].lon];
        this.currentSegment = L.polyline(visitingLine, {
            color: "rgb(30, 179, 238)",
            opacity: 1,
            weight: 4
        });
        this.currentSegment.addTo(map);
    },

    currentSegmentString() {

        return "segment connecting #" + this.hullv1 + " and #" +
            this.hullv2;
    },

    // update the stats panel entry with latest counts
    updateStatsEntry() {

        const avg = (this.checkValComputations*1.0/this.segmentsConsidered).toFixed(1);
        hdxAVCP.update("stats","Considered " + this.segmentsConsidered +
                       " segments<br />Checked " + this.checkValComputations +
                       " points, average of " + avg + " per segment");
        const segCheck = document.getElementById("segmentCheckValCount");
        if (this.checkValThisSegment == 1) {
            segCheck.innerHTML = "Checked 1 point";
        }
        else {
            segCheck.innerHTML = "Checked " + this.checkValThisSegment + " points";
        }
    },

    // format a table row with waypoint i for the display of entries
    // at the end
    hullTableRow(i) {

        return '<tr><td>' + i + '</td><td>' + waypoints[i].label +
            '</td><td>(' + waypoints[i].lat + ',' + waypoints[i].lon +
            ')</td></tr>';
    },

    // the actions that make up the brute-force convex hull
    avActions: [
        {
            label: "START",
            comment: "initialize brute-force convex hull variables",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                
                hdxAVCP.update("hullsegments", "No hull segments found yet");
                hdxAVCP.update("stats", "No segments considered yet");

                hdxAV.iterationDone = true;
                thisAV.hullv1 = -1;  // will increment to 0
                thisAV.segmentsConsidered = 0;
                thisAV.checkValComputations = 0;
                thisAV.hullSegments = [];
                thisAV.hullSegmentEndpoints = [];
                thisAV.hullPoints = [];
                
                hdxAV.nextAction = "v1forLoopTop";
            },
            logMessage: function(thisAV) {
                return "Initializing brute-force convex hull variables";
            }
        },
        {
            label: "v1forLoopTop",
            comment: "v1 loop, outer loop to visit all pairs",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullv1);
                thisAV.hullv1++;
                if (thisAV.hullv1 == waypoints.length-1) {
                    hdxAV.nextAction = "cleanup";
                }
                else {
                    hdxAV.nextAction = "v2forLoopTop";
                    thisAV.hullv2 = thisAV.hullv1;  // will increment to +1
                    updateMarkerAndTable(thisAV.hullv1, thisAV.visualSettings.hullv1,
                                         30, false);
                    hdxAVCP.update("hullv1", "v<sub>1</sub>: #" +
                                   thisAV.hullv1 + " " +
                                   waypoints[thisAV.hullv1].label);
                }
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Top of outer for loop over vertices, v<sub>1</sub>=" + thisAV.hullv1;
            },
            cbp: {
                type: hdxCBPTypes.VARIABLE,
                selector: {
                    type: hdxCBPSelectors.VERTEX,
                    vindexvar: "v<sub>1</sub>"
                },
                f: function(thisAV, matchvnum, matchtype, textval) {
                    return isCBPVertexMatch(thisAV.hullv1,
                                            matchvnum, matchtype, textval);
                }               
            }
        },
        {
            label: "v2forLoopTop",
            comment: "v2 loop, inner loop to visit all pairs",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullv2);
                thisAV.hullv2++;
                if (thisAV.hullv2 == waypoints.length) {
                    hdxAV.nextAction = "v1forLoopTop";
                }
                else {
                    hdxAV.nextAction = "calculateLine";
                    // make sure v1 is still highlighted appropriately
                    updateMarkerAndTable(thisAV.hullv1,
                                         thisAV.visualSettings.hullv1,
                                         30, false);
                    updateMarkerAndTable(thisAV.hullv2,
                                         thisAV.visualSettings.hullv2,
                                         30, false);
                    hdxAVCP.update("hullv2", "v<sub>2</sub>: #" +
                                   thisAV.hullv2 + " " +
                                   waypoints[thisAV.hullv2].label);
                    thisAV.mapCurrentSegment();
                }

                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Top of inner for loop over vertices, v<sub>2</sub>=" + thisAV.hullv2;
            },
            cbp: {
                type: hdxCBPTypes.VARIABLE,
                selector: {
                    type: hdxCBPSelectors.VERTEX,
                    vindexvar: "v<sub>2</sub>"
                },
                f: function(thisAV, matchvnum, matchtype, textval) {
                    return isCBPVertexMatch(thisAV.hullv2,
                                            matchvnum, matchtype, textval);
                }               
            }
        },
        {
            label: "calculateLine",
            comment: "Calculate the equation of the line between v1 and v2",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                const pointv1 = waypoints[thisAV.hullv1];
                const pointv2 = waypoints[thisAV.hullv2];
    
                // compute the coefficients for ax + by = c
                // of the line connecting v1 and v2
                thisAV.a = pointv2.lat - pointv1.lat;
                thisAV.b = pointv1.lon - pointv2.lon;
                thisAV.c = pointv1.lon * pointv2.lat - pointv1.lat * pointv2.lon;
                
                hdxAVCP.update("checkingLine", "Considering line: " +
                               thisAV.a.toFixed(3) + "*lat + " +
                               thisAV.b.toFixed(3) + "*lng = " +
                               thisAV.c.toFixed(3) +
                               '<br /><span id="segmentCheckValCount">Checked 0 points</span>');

                // record this segment being checked
                thisAV.segmentsConsidered++;
                thisAV.checkValThisSegment = 0;
                thisAV.updateStatsEntry();
                
                // additional search variables to help determine if
                // this pair is part of the hull
                thisAV.eliminated = false;
                thisAV.lookingFor = "UNKNOWN";

                // set up for innermost loop
                thisAV.hullvtest = -1;  // will increment to 0 to start

                // mark all as unvisited except v1 and v2
                for (let i = 0; i < waypoints.length; i++) {
                    if (i != thisAV.hullv1 && i != thisAV.hullv2) {
                        updateMarkerAndTable(i, visualSettings.undiscovered);
                    }
                }
                
                hdxAV.nextAction = "vtestforLoopTop";
            },
            logMessage: function(thisAV) {
                return "Computed coefficients of " +
                    thisAV.currentSegmentString();
            }
        },
        {
            label: "vtestforLoopTop",
            comment: "Top of loop over all vertices to check if the given segment is in the hull",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                thisAV.hullvtest++;
                // skip v1, v2
                while (thisAV.hullvtest == thisAV.hullv1 ||
                       thisAV.hullvtest == thisAV.hullv2) {
                    thisAV.hullvtest++;
                }
                if (thisAV.hullvtest == waypoints.length) {
                    hdxAV.nextAction = "checkEliminated";
                }
                else {
                    hdxAV.nextAction = "computeCheckVal";
                    updateMarkerAndTable(thisAV.hullvtest,
                                         thisAV.visualSettings.hullvtest,
                                         30, false);
                    hdxAVCP.update("hullvtest", "v<sub>test</sub>: #" +
                                   thisAV.hullvtest + " " +
                                   waypoints[thisAV.hullvtest].label);
                }
            },
            logMessage: function(thisAV) {
                return "Top of loop over vertices testing " +
                    thisAV.currentSegmentString();
            },
            cbp: {
                type: hdxCBPTypes.VARIABLE,
                selector: {
                    type: hdxCBPSelectors.VERTEX,
                    vindexvar: "v<sub>test</sub>"
                },
                f: function(thisAV, matchvnum, matchtype, textval) {
                    return isCBPVertexMatch(thisAV.hullvtest,
                                            matchvnum, matchtype, textval);
                }               
            }
        },
        {
            label: "computeCheckVal",
            comment: "Plug vertex into the equation of the candidate segment",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                const pointvtest = waypoints[thisAV.hullvtest];
                thisAV.checkVal = thisAV.a * pointvtest.lon +
                    thisAV.b * pointvtest.lat - thisAV.c;

                // count this checkVal computation
                thisAV.checkValComputations++;
                thisAV.checkValThisSegment++;
                thisAV.updateStatsEntry();
                
                hdxAV.nextAction = "isCheckVal0";
            },
            logMessage: function(thisAV) {
                return "Computed checkVal = " + thisAV.checkVal.toFixed(3);
            }
        },
        {
            label: "isCheckVal0",
            comment: "Test for checkVal=0",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                if (thisAV.checkVal == 0) {
                    hdxAV.nextAction = "checkBetween";
                }
                else {
                    hdxAV.nextAction = "checkFirst";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if checkVal=" +
                    thisAV.checkVal.toFixed(3) + " is 0";
            }
        },
        {
            label: "checkBetween",
            comment: "checkVal is 0, checking if colinear point is between candidate segment endpoints",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                if (isBetween(waypoints[thisAV.hullv1],
                              waypoints[thisAV.hullv2],
                              waypoints[thisAV.hullvtest])) {
                    hdxAV.nextAction = "checkFirst";
                }
                else {
                    hdxAV.nextAction = "isColinearNotBetween";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if colinear point is on " +
                    thisAV.currentSegmentString();
            }
        },
        {
            label: "isColinearNotBetween",
            comment: "point is colinear but not between, so eliminate the segment",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                thisAV.eliminated = true;
                hdxAV.nextAction = "checkEliminated";
            },
            logMessage: function(thisAV) {
                return "Eliminating " + thisAV.currentSegmentString() +
                    " because of colinear point between";
            }
        },
        {
            label: "checkFirst",
            comment: "checking if we are doing the first point for the segment",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                if (thisAV.lookingFor == "UNKNOWN") {
                    hdxAV.nextAction = "isCheckValNegative";
                }
                else {
                    hdxAV.nextAction = "checkSameSide";
                }
            },
            logMessage: function(thisAV) {
                return "checking if we are doing the first point for the segment";
            }
        },
        {
            label: "isCheckValNegative",
            comment: "test for a negative initial checkVal",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                if (thisAV.checkVal < 0) {
                    hdxAV.nextAction = "setNegative";
                }
                else {
                    hdxAV.nextAction = "isCheckValPositive";
                }
            },
            logMessage: function(thisAV) {
                return "Testing if checkVal=" + thisAV.checkVal +
                    " is negative";
            }
        },
        {
            label: "setNegative",
            comment: "set the lookingFor variable to indicate that the first checkVal was negative",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.checkedNegative);
                thisAV.lookingFor = "NEGATIVE";
                updateMarkerAndTable(thisAV.hullvtest,
                                     thisAV.visualSettings.checkedNegative,
                                     20, false);
                hdxAV.nextAction = "vtestforLoopTop";
            },
            logMessage: function(thisAV) {
                return "Setting to look for all negative checkVal values";
            }
        },
        {
            label: "isCheckValPositive",
            comment: "test for a positive initial checkVal",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                if (thisAV.checkVal > 0) {
                    hdxAV.nextAction = "setPositive";
                }
                else {
                    hdxAV.nextAction = "vtestforLoopTop";
                }
            },
            logMessage: function(thisAV) {
                return "Testing if checkVal=" + thisAV.checkVal +
                    " is positive";
            }
        },
        {
            label: "setPositive",
            comment: "set the lookingFor variable to indicate that the first checkVal was positive",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.checkedPositive);
                thisAV.lookingFor = "POSITIVE";
                updateMarkerAndTable(thisAV.hullvtest,
                                     thisAV.visualSettings.checkedPositive,
                                     20, false);
                hdxAV.nextAction = "vtestforLoopTop";
            },
            logMessage: function(thisAV) {
                return "Setting to look for all negative checkVal values";
            }
        },
        {
            label: "checkSameSide",
            comment: "check if the current point is on the same side of the candidate segment as all previous",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullvtest);
                if ((thisAV.lookingFor == "POSITIVE" &&
                     thisAV.checkVal < 0) ||
                    (thisAV.lookingFor == "NEGATIVE" &&
                     thisAV.checkVal > 0)) {
                    updateMarkerAndTable(thisAV.hullvtest,
                                         thisAV.visualSettings.mismatch,
                                         20, false);
                    hdxAV.nextAction = "notSameSide";
                }
                else {
                    // draw as the positive or negative color
                    if (thisAV.checkVal < 0) {
                        updateMarkerAndTable(thisAV.hullvtest,
                                             thisAV.visualSettings.checkedNegative,
                                             20, false);
                    }
                    else {
                        updateMarkerAndTable(thisAV.hullvtest,
                                             thisAV.visualSettings.checkedPositive,
                                             20, false);
                    }
                    hdxAV.nextAction = "vtestforLoopTop";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if " + thisAV.hullvtest +
                    " is on the same side as previously checked points";
            }
        },
        {
            label: "notSameSide",
            comment: "found a point on the opposite side of the line segment",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.mismatch);

                thisAV.eliminated = true;
                hdxAV.nextAction = "checkEliminated";
            },
            logMessage: function(thisAV) {
                return "Point #" + thisAV.hullvtest +
                    "is on the opposite side as previous point, discarding segment";
            }
        },
        {
            label: "checkEliminated",
            comment: "end of loop over all checks for this candidate segment",
            code: function(thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

                // restore coloring
                // mark all as unvisited except v1 and v2
                for (let i = 0; i < waypoints.length; i++) {
                    updateMarkerAndTable(i, visualSettings.undiscovered);
                }
                // restore coloring of hull segment endpoints
                for (let i = 0; i < thisAV.hullPoints.length; i++) {
                    updateMarkerAndTable(thisAV.hullPoints[i],
                                         thisAV.visualSettings.hullComponent);
                }

                if (thisAV.eliminated) {
                    // remove the current segment from the map
                    thisAV.currentSegment.remove();
                    hdxAV.nextAction = "v2forLoopTop";
                }
                else {
                    hdxAV.nextAction = "addToHull";
                }
            },
            logMessage: function(thisAV) {
                return "Checking if " + thisAV.currentSegmentString() +
                    " has been eliminated after " +
                    thisAV.checkValThisSegment + " points";
            }
        },
        {
            label: "addToHull",
            comment: "add current segment to the convex hull",
            code: function(thisAV) {
                highlightPseudocode(this.label, thisAV.visualSettings.hullComponent);
                // add to hull
                if (!thisAV.hullPoints.includes(thisAV.hullv1)) {
                    updateMarkerAndTable(thisAV.hullv1,
                                         thisAV.visualSettings.hullComponent,
                                         20, false);
                    thisAV.hullPoints.push(thisAV.hullv1);
                }
                if (!thisAV.hullPoints.includes(thisAV.hullv2)) {
                    updateMarkerAndTable(thisAV.hullv2,
                                         thisAV.visualSettings.hullComponent,
                                         20, false);
                    thisAV.hullPoints.push(thisAV.hullv2);
                }

                // color current segment and remember as part of the hull
                thisAV.hullSegmentEndpoints.push([thisAV.hullv1,
                                                  thisAV.hullv2]);
                thisAV.hullSegments.push(thisAV.currentSegment);
                thisAV.currentSegment.setStyle({
                    color: thisAV.visualSettings.hullComponent.color
                });
                hdxAVCP.update("hullsegments", thisAV.hullSegments.length +
                               " hull segments found");
                hdxAV.nextAction = "v2forLoopTop";
            },
            logMessage: function(thisAV) {
                return "Added " + thisAV.currentSegmentString() +
                    " to hull";
            },
            cbp: {
                type: hdxCBPTypes.VARIABLE,
                selector: {
                    type: hdxCBPSelectors.VERTEX,
                    vindexvar: "v<sub>1</sub> <i>or</i> v<sub>2</sub>"
                },
                f: function(thisAV, matchvnum, matchtype, textval) {
                    return isCBPVertexMatch(thisAV.hullv1,
                                            matchvnum, matchtype, textval) ||
                        isCBPVertexMatch(thisAV.hullv2,
                                         matchvnum, matchtype, textval);
                }
            }
        },
        {
            label: "cleanup",
            comment: "Clean up and finalize visualization",
            code: function(thisAV) {

                hdxAVCP.update("hullv1", "");
                hdxAVCP.update("hullv2", "");
                hdxAVCP.update("hullvtest", "");
                hdxAVCP.update("checkingLine", "");

                // build table of points in order along the hull
                let table = '<table class="gratable"><thead>' +
                    '<tr style="text-align:center"><th>#</th><th>Label</th><th>Coordinates</th></tr></thead><tbody>';

                // grab the two endpoints from the last segment that
                // was added to get started
                const lastSegment = thisAV.hullSegmentEndpoints.pop();
                table += thisAV.hullTableRow(lastSegment[0]) +
                    thisAV.hullTableRow(lastSegment[1]);
                let connectTo = lastSegment[1];
                
                // now search for ones connected around the loop
                while (thisAV.hullSegmentEndpoints.length > 0) {
                    for (let i = thisAV.hullSegmentEndpoints.length-1;
                         i >= 0; i--) {
                        const segment = thisAV.hullSegmentEndpoints[i];
                        if (segment[0] == connectTo) {
                            // we want to add segment[1]
                            table += thisAV.hullTableRow(segment[1]);
                            connectTo = segment[1];
                            thisAV.hullSegmentEndpoints.splice(i, 1);
                        }
                        else if (segment[1] == connectTo) {
                            // we want to add segment[0]
                            table += thisAV.hullTableRow(segment[0]);
                            connectTo = segment[0];
                            thisAV.hullSegmentEndpoints.splice(i, 1);
                        }
                    }
                }

                table += '</tbody></table>';
                hdxAVCP.update("hullsegments", thisAV.hullSegments.length +
                               " hull segments found<br />" + table);

                hdxAV.nextAction = "DONE";
                hdxAV.iterationDone = true;
            },
            logMessage: function(thisAV) {
                return "Clean up and finalize visualization";
            }
        },
    ],

    // required prepToStart method for brute force convex hull
    prepToStart() {

    },

    // set up UI for convex hull
    setupUI() {
        
        //if (waypoints.length > 100) {
        //    alert("This is an O(n^3) algorithm in the worst case, so you might wish to choose a smaller graph.");
        //}

        hdxAV.algOptions.innerHTML = '';
        
        hdxAVCP.add("hullsegments", this.visualSettings.hullComponent);
        hdxAVCP.add("stats", visualSettings.pseudocodeDefault);
        hdxAVCP.add("hullv1", this.visualSettings.hullv1);
        hdxAVCP.add("hullv2", this.visualSettings.hullv2);
        hdxAVCP.add("hullvtest", this.visualSettings.hullvtest);
        hdxAVCP.add("checkingLine", visualSettings.visiting);
    },

    // clean up convex hull UI
    cleanupUI() {

        // the convex hull segments
        for (let i = 0; i < this.hullSegments.length; i++) {
            this.hullSegments[i].remove();
        }

        // if there's a current segment still on display, remove it
        if (this.currentSegment != null) {
            this.currentSegment.remove();
        }
    },
    
    idOfAction(action) {
        return action.label;
    }    
};

/**
    Check if this point is directly in between the two given
    points.  Note: the assumption is that they are colinear.

    @param o1 one of the points
    @param o2 the other point
    @return whether this point is between the two given points
*/
function isBetween(o1, o2, o3) {
    const sqDisto1o2 = squaredDistance(o1,o2);
    //alert("isBetween" + (squaredDistance(o3,o2) < sqDisto1o2) &&
    //      (squaredDistance(o3,o2) < sqDisto1o2));
    return (squaredDistance(o3,o2) < sqDisto1o2) &&
        (squaredDistance(o3,o2) < sqDisto1o2);
}
