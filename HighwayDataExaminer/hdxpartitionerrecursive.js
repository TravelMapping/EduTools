//
// HDX Algorithm Visualization of Recursive Coordinate Bisection Partitioner
//
// METAL Project
//
// Primary Authors: Michael Plekan
//

var hdxPartitionerAV = {
    value: 'rcb',
    name: "Recursive Coordinate Bisection Partitioner",
    description: "This algorithm partitions graphs using the geometric (vertices only) recursive coordinate bisection algorithm.  The number of partitions must be a power of 2.",

    //making global variables
    partitionStrt:[],
    partitionEnd:[],
    waypointParts:[],
    callStack:[],
    numPartitions:4,
    currentCall:-1,
    median:-1,
    partitionSection:null,
    rnglat:0,
    rnglon:0,
    coloring:-1,
    highlightPoly: [],
    highlightRect:[],

    avActions : [
        {
            //label represents the current state in state machine you are accessing
            //if you want the psuedocode to highlight when 
            label: "START",
            comment: "creates bounding box and initializes fields",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                for (let x=0;x<waypoints.length;x++){
                       thisAV.waypointParts[x]=x;
                } 
                //setting up the needed variables
                thisAV.partitionSection=thisAV.waypointParts;
                thisAV.highlightBoundingBox();
                thisAV.numPartitions=Math.pow(2,document.getElementById('parts').value);
                hdxPart.numParts=thisAV.numPartitions;
                thisAV.coloring=document.getElementById('ColoringMethod').value;
                thisAV.partitionStrt=Array(thisAV.numPartitions).fill(0);
                thisAV.partitionEnd=Array(thisAV.numPartitions).fill(0);
                thisAV.callStack.push({currentPart:0,lowerBound:0,upperBound:waypoints.length-1,PartsLeft:thisAV.numPartitions, maxLat:thisAV.maxlat , maxLon:thisAV.maxlon, minLat:thisAV.minlat , minLon:thisAV.minlon});
                hdxAV.nextAction = "methodCall";
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },
         { 
            label: "methodCall",
            comment: "Calls the method",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                //setting polyline colors
                for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                     thisAV.highlightPoly[i].setStyle(visualSettings.undiscovered);
                }
                //coloring points dark gray
                if (thisAV.coloring == "Waypoints") {
                   for (var i = 0;i<waypoints.length;i++) {
                       updateMarkerAndTable(thisAV.waypointParts[i],visualSettings.undiscovered, 31, false);
                   }
                }
                //popping new call of call stack
                thisAV.currentCall=thisAV.callStack.pop();
                
               //removing old overlays
               if (thisAV.coloring == "Overlays") {
                    for (var i = 0; i < thisAV.highlightRect.length; i++) {
                         thisAV.highlightRect[i].remove();
                    }

                  thisAV.highlightRect.pop();
                  thisAV.highlightRect.pop();
              }

                hdxAV.nextAction = "cutSort";
            },
            
            logMessage: function(thisAV){
                return "Calling the Method";
            }
        },
{ 
            label: "cutSort",
            comment: "Finds the Cutting Axis, Median, and sorts",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                //taking the part of the array I need for the current partition being split
                thisAV.partitionSection=thisAV.waypointParts.slice(thisAV.currentCall.lowerBound, thisAV.currentCall.upperBound+1); 

                //coloring
                if (thisAV.coloring == "Waypoints") {
                   for (var i=thisAV.partitionStrt[thisAV.currentCall.currentPart];i <= thisAV.partitionEnd[thisAV.currentCall.currentPart];i++) {
                        updateMarkerAndTable(thisAV.waypointParts[i], {color:"#F0F",scale:8,opacity:1, textColor: "white"} , 31, false);
                   }
                }
                
                //finding extremes
                thisAV.extremes();
                //coloring
                if (thisAV.coloring == "Overlays") {
                  thisAV.highlightRect.push (L.rectangle([[thisAV.currentCall.minLat, thisAV.currentCall.minLon], [thisAV.currentCall.maxLat, thisAV.currentCall.maxLon]], {color: "#F0F", weight: 0.5}) );
                  for (var i = 0; i < thisAV.highlightRect.length; i++) {
                    thisAV.highlightRect[i].addTo(map);
                  }
               }
                //determine which axis to cut and sorting it along the orthonal axis
                thisAV.rnglat=distanceInMiles(thisAV.minlat,0,thisAV.maxlat,0);
                thisAV.rnglon=distanceInMiles(0,thisAV.minlon,0,thisAV.maxlon);
                if (thisAV.rnglon > thisAV.rnglat) {thisAV.partitionSection.sort(function(a, b){return waypoints[a].lon - waypoints[b].lon});}
                else {thisAV.partitionSection.sort(function(a, b){return waypoints[a].lat - waypoints[b].lat});}
               
                let i2=0
                //updating the overall array with the new sorted array for the partition being worked on
                for (let i =thisAV.currentCall.lowerBound;i < thisAV.currentCall.lowerBound+thisAV.partitionSection.length;i++) {
                    thisAV.waypointParts[i]=thisAV.partitionSection[i2];
                    i2++;
                }
                hdxAV.nextAction = "setParts";
            },
            
            logMessage: function(thisAV){
                return "Finding the Cutting Axis and sorting. Then finding the Median";
            }
        },
{ 
            label: "setParts",
            comment: "Sets the Partitions based on mid point",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                let mid=Math.trunc(thisAV.partitionSection.length/2)+thisAV.currentCall.lowerBound;                

                //setting the partitions based on cutting axis
                if (thisAV.partitionSection.length %2 == 0) {
                  thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=mid;
                  thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=thisAV.currentCall.upperBound;
                 
                  thisAV.partitionStrt[thisAV.currentCall.currentPart]=thisAV.currentCall.lowerBound;
                  thisAV.partitionEnd[thisAV.currentCall.currentPart]=mid-1;
                  if (thisAV.rnglon > thisAV.rnglat) { thisAV.median= (waypoints[thisAV.waypointParts[mid]].lon+waypoints[thisAV.waypointParts[mid-1]].lon)/2;}
                  else { thisAV.median= (waypoints[thisAV.waypointParts[mid]].lat+waypoints[thisAV.waypointParts[mid-1]].lat)/2;}

                }
                else{
                  thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=mid+1;
                  thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=thisAV.currentCall.upperBound;
                
                  thisAV.partitionStrt[thisAV.currentCall.currentPart]=thisAV.currentCall.lowerBound;
                  thisAV.partitionEnd[thisAV.currentCall.currentPart]=mid;
 
                  if (thisAV.rnglon > thisAV.rnglat) { thisAV.median= (waypoints[thisAV.waypointParts[mid]].lon+waypoints[thisAV.waypointParts[mid+1]].lon)/2;}
                  else{ thisAV.median= (waypoints[thisAV.waypointParts[mid]].lat+waypoints[thisAV.waypointParts[mid+1]].lat)/2;}
                  
                }
                //coloring
                if (thisAV.coloring == "Overlays") {
                    for (var i = 0; i < thisAV.highlightRect.length; i++) {
                        thisAV.highlightRect[i].remove();
                    }

                   thisAV.highlightRect.pop();
                }

                if (thisAV.rnglon > thisAV.rnglat) {
                     thisAV.highlightPoly.push(
                     L.polyline([[thisAV.currentCall.maxLat,thisAV.median],[thisAV.currentCall.minLat,thisAV.median]], visualSettings.visiting)
                    );
                   if (thisAV.coloring == "Overlays") {
                        thisAV.highlightRect.push(L.rectangle([[thisAV.currentCall.minLat, thisAV.median], [thisAV.currentCall.maxLat, thisAV.currentCall.maxLon]], {color: "#F00", weight: 0.5}));
                        thisAV.highlightRect.push(L.rectangle([[thisAV.currentCall.minLat, thisAV.currentCall.minLon], [thisAV.currentCall.maxLat, thisAV.median]], {color: "#00F", weight: 0.5}));
                    }
               }
               else {
                   thisAV.highlightPoly.push(
                    L.polyline([[thisAV.median,thisAV.currentCall.maxLon],[thisAV.median,thisAV.currentCall.minLon]], visualSettings.visiting)
                   );
                  if (thisAV.coloring == "Overlays") {
                     thisAV.highlightRect.push(L.rectangle([[thisAV.median, thisAV.currentCall.minLon], [thisAV.currentCall.maxLat, thisAV.currentCall.maxLon]], {color: "#F00", weight: 0.5}));
                     thisAV.highlightRect.push(L.rectangle([[thisAV.currentCall.minLat, thisAV.currentCall.minLon], [thisAV.median, thisAV.currentCall.maxLon]], {color: "#00F", weight: 0.5}));
                  }
               }
                //drawing lines
               for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                     thisAV.highlightPoly[i].addTo(map);
                 }

            //coloring
            if (thisAV.coloring == "Overlays") {
                 for (var i = 0; i < thisAV.highlightRect.length; i++) {
                    thisAV.highlightRect[i].addTo(map);
                 }
             }
             if (thisAV.coloring == "Waypoints") {
                   for (var i=thisAV.partitionStrt[thisAV.currentCall.currentPart];i <= thisAV.partitionEnd[thisAV.currentCall.currentPart];i++) {
                       updateMarkerAndTable(thisAV.waypointParts[i], {color:"#00F",scale:4,opacity:1, textColor: "white"} , 31, false);
                   }

                  for (var i=thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)];i <= thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)];i++) {
                       updateMarkerAndTable(thisAV.waypointParts[i], {color:"#F00",scale:4,opacity:1, textColor: "white"} , 31, false);
                  }
               }


                hdxAV.nextAction = "base";
            },
            
            logMessage: function(thisAV){
                return "Setting Partitions";
            }
        },
{ 
            label: "base",
            comment: "Checks whether the base case has been hit",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.iterationDone = true;
                
                //checking to see if the base case is hit and if there is anything left on the call stack
                if (thisAV.currentCall.PartsLeft > 2) { hdxAV.nextAction = "recursiveCall";}
                else { hdxAV.nextAction = "end";}
            },
            
            logMessage: function(thisAV){
                return "Checking whether the base case is hit";
            }
        },
{ 
            label: "recursiveCall",
            comment: "Calls the method recursively",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                if(thisAV.rnglon>thisAV.rnglat){
                 thisAV.callStack.push({
                     currentPart:(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2), 
                     lowerBound:thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)], 
                     upperBound:thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)], 
                     PartsLeft: thisAV.currentCall.PartsLeft/2, 
                     maxLat:thisAV.currentCall.maxLat,
                     maxLon:thisAV.currentCall.maxLon,
                     minLat:thisAV.currentCall.minLat, 
                     minLon:thisAV.median});
                thisAV.callStack.push({
                     currentPart:thisAV.currentCall.currentPart, 
                     lowerBound:thisAV.partitionStrt[thisAV.currentCall.currentPart], 
                     upperBound:thisAV.partitionEnd[thisAV.currentCall.currentPart], 
                     PartsLeft: thisAV.currentCall.PartsLeft/2,
                     maxLat:thisAV.currentCall.maxLat, 
                     maxLon:thisAV.median, 
                     minLat:thisAV.currentCall.minLat,
                     minLon:thisAV.currentCall.minLon});                    
              } 
              else{
                 thisAV.callStack.push({
                     currentPart:(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2), 
                     lowerBound:thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)], 
                     upperBound:thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)], 
                     PartsLeft: thisAV.currentCall.PartsLeft/2, 
                     maxLat:thisAV.currentCall.maxLat,
                     maxLon:thisAV.currentCall.maxLon,
                     minLat:thisAV.median, 
                     minLon:thisAV.currentCall.minLon});
                 thisAV.callStack.push({
                     currentPart:thisAV.currentCall.currentPart, 
                     lowerBound:thisAV.partitionStrt[thisAV.currentCall.currentPart], 
                     upperBound:thisAV.partitionEnd[thisAV.currentCall.currentPart], 
                     PartsLeft: thisAV.currentCall.PartsLeft/2,
                     maxLat:thisAV.median, 
                     maxLon:thisAV.currentCall.maxLon, 
                     minLat:thisAV.currentCall.minLat,
                     minLon:thisAV.currentCall.minLon}); 
              }


                hdxAV.nextAction = "methodCall";
            },
            
            logMessage: function(thisAV){
                return "Calling the Method recursively";
            }
        },
{ 
            label: "end",
            comment: "Ends the recursion on this Partition",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                
                                
                //determine if call stack is empty
                if (thisAV.callStack.length == 0) { hdxAV.nextAction = "cleanup";}
                else { hdxAV.nextAction = "methodCall";}
            },
            
            logMessage: function(thisAV){
                return "Ending the recursion this Partition";
            }
        },


        {
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                     //filling 2d array with nessacary data for hdxPart
                     hdxPart.parts=new Array(hdxPart.numParts);
                     for (var p=0;p < hdxPart.numParts;p++) {
                            hdxPart.parts[p]=new Array();
                            for (var i=thisAV.partitionStrt[p];i <= thisAV.partitionEnd[p];i++) {
                                 hdxPart.parts[p].push(thisAV.waypointParts[i]);
                          }
                    }
                    //coloring
                    for (var i=0; i < graphEdges.length;i++) {updatePolylineAndTable(i,visualSettings.undiscovered, false);}
                    //cleaning up graph for final coloring
                    for (var i = 0; i < thisAV.highlightRect.length; i++) {
                        thisAV.highlightRect[i].remove();
                    }
                    thisAV.highlightRect=[];
                    for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                     thisAV.highlightPoly[i].setStyle(visualSettings.undiscovered);
                    }
                    //adding data table
                    hdxPart.partitionAnalysis();
                    addEntryToAVControlPanel("stats", visualSettings.pseudocodeDefault);
                    updateAVControlEntry("stats", hdxPart.styling());

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
        for (var i=0; i < graphEdges.length;i++) {updatePolylineAndTable(i,{color:"#000",scale:0,opacity:0, textColor: "white"}, false);}
        
        //building pseudocode HTML
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += '</td></tr>' + pcEntry(0,'Partition()','methodCall');
        this.code += '</td></tr>'+ pcEntry(1,'findCuttingAxis()<br/>'+pcIndent(2)+'sort(cuttingAxis)<br/>'+pcIndent(2)+'findMid','cutSort');
        this.code += '</td></tr>' + pcEntry(1,'setPartitions','setParts');
        this.code += '</td></tr>' + pcEntry(1,'if(number of Partitions > 2)','base');
        this.code += '</td></tr>' + pcEntry(2,'Partition(newPartion)<br/>'+pcIndent(4)+'Partition(newPartion2)','recursiveCall');
        this.code += '</td></tr>' + pcEntry(1,'else<br/>'+pcIndent(4)+'//do nothing','end');


     },
 
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        //building HTML options
        let newAO = '<br />Number of Recursive Levels: 2<sup><input type="number" id="parts" onchange="hdxPartitionerAV.rcbCallback()"min="1" max="' + (Math.trunc(Math.log2(waypoints.length))) + '" value="2"></sup><span id="rcbnumParts">='+this.numPartitions+'</span>';
        newAO+=`<br/>Coloring Method: <select id="ColoringMethod">
        <option value="Overlays">Overlays</option>
        <option value="Waypoints">Waypoints</option>
        </select>`;
        newAO+=`<br/>`+hdxPart.colorHtml();
        hdxAV.algOptions.innerHTML = newAO;

        addEntryToAVControlPanel ("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel ("visiting",visualSettings.visiting)
       
    },
    //cleans up lines and overlays
    cleanupUI() {
        //remove all the polylines made by any global bounding box
                    for (var i = 0; i < this.highlightPoly.length; i++) {
                          this.highlightPoly[i].remove();
                    }
                    this.highlightPoly = [];
                     for (var i = 0; i < this.highlightRect.length; i++) {
                        this.highlightRect[i].remove();
                    }
                    this.highlightRect=[];


    },

    idOfAction(action) {
	
        return action.label;
    },
    rcbCallback(){
        this.numPartitions=Math.pow(2,document.getElementById('parts').value);
        document.getElementById('rcbnumParts').innerHTML='<span id="rcbnumParts">='+this.numPartitions+'</span>';
    },
    extremes(){
       this.maxlat = waypoints[this.partitionSection[0]].lat;
       this.minlat = waypoints[this.partitionSection[0]].lat;
       this.maxlon = waypoints[this.partitionSection[0]].lon;
       this.minlon = waypoints[this.partitionSection[0]].lon;
       for (i of this.partitionSection) {
            if (waypoints[i].lat > this.maxlat) {this.maxlat=waypoints[i].lat;}
            else if (waypoints[i].lat < this.minlat) {this.minlat=waypoints[i].lat;}
            if (waypoints[i].lon > this.maxlon) {this.maxlon=waypoints[i].lon;}
            else if (waypoints[i].lon < this.minlon) {this.minlon=waypoints[i].lon;}
        }
},
    highlightBoundingBox(){
        this.extremes();
        let nEnds = [[this.maxlat,this.minlon],[this.maxlat,this.maxlon]];
        let sEnds = [[this.minlat,this.minlon],[this.minlat,this.maxlon]];
        let eEnds = [[this.maxlat,this.maxlon],[this.minlat,this.maxlon]];
        let wEnds = [[this.maxlat,this.minlon],[this.minlat,this.minlon]];

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

        for (var i = 0; i < this.highlightPoly.length; i++) {
            this.highlightPoly[i].addTo(map);
        }

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
}
