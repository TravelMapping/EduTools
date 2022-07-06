//
// HDX Algorithm Visualization Template File
//
// METAL Project
//
// Primary Authors: Michael Plekan
//

//this variable name is used to store the document containaing all the necessary fields, functions, and states for a given AV
//variable must be pushed to the this.avList in the hdxav.js file
//additionally, the file of this AV must be linked in the index.php file
var hdxPartitionerAV = {
    //entries for list of avs
    value: 'rcb',

    //name here is what is shown in the drop down menu when selecting from different algorithms
    name: "Recursive Coordinate Bisection Partitioner",

    //description is what is shown after the user selects the algorithm in the drop down 
    //but before they press the visualise button
    description: "This algorithm partitions graphs using the geometric (vertices only) recursive coordinate bisection algorithm.  The number of partitions must be a power of 2.",

    //here you list global fields that you want your av to have access to on a global level 
    partitionStrt:[],
    partitionEnd:[],
    waypointParts:[],
    callStack:[],
    numPartitions:[],
    currentCall:-1,
    median:-1,
    partitionSection:null,
    rnglat:0,
    rnglon:0,
    coloring:-1,
    
    //here are some common examples

    //list of polylines, any line you manually insert onto the HDX to aid the AV. 
    //often used in vertex only algorithms
    //these polylines must be removed during
    highlightPoly: [],
    highlightRect:[],
    //loop variable that tracks which point is currently being operated upon
    nextToCheck: -1,

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
                thisAV.partitionSection=thisAV.waypointParts;
                thisAV.highlightBoundingBox();
                thisAV.numPartitions=Math.pow(2,document.getElementById('parts').value);
                hdxPart.numParts=thisAV.numPartitions;
                thisAV.coloring=document.getElementById('ColoringMethod').value;
                console.time("t");
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
                for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                     thisAV.highlightPoly[i].setStyle(visualSettings.undiscovered);
                }
                if(thisAV.coloring=="Waypoints"){
                   for(var i=0;i<waypoints.length;i++){
                       updateMarkerAndTable(thisAV.waypointParts[i],visualSettings.undiscovered, 31, false);
                   }
                }
                thisAV.currentCall=thisAV.callStack.pop();
                
               if(thisAV.coloring=="Overlays"){
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
                thisAV.partitionSection=thisAV.waypointParts.slice(thisAV.currentCall.lowerBound, thisAV.currentCall.upperBound+1); 

                if(thisAV.coloring=="Waypoints"){
                   for(var i=thisAV.partitionStrt[thisAV.currentCall.currentPart];i<=thisAV.partitionEnd[thisAV.currentCall.currentPart];i++){
                        updateMarkerAndTable(thisAV.waypointParts[i], {color:"#F0F",scale:8,opacity:1, textColor: "white"} , 31, false);
                   }
                }
                
                thisAV.extremes();
                if(thisAV.coloring=="Overlays"){
                  thisAV.highlightRect.push(L.rectangle([[thisAV.currentCall.minLat, thisAV.currentCall.minLon], [thisAV.currentCall.maxLat, thisAV.currentCall.maxLon]], {color: "#F0F", weight: 0.5}) );
                  for (var i = 0; i < thisAV.highlightRect.length; i++) {
                    thisAV.highlightRect[i].addTo(map);
                  }
               }

                thisAV.rnglat=distanceInMiles(thisAV.minlat,0,thisAV.maxlat,0);
                thisAV.rnglon=distanceInMiles(0,thisAV.minlon,0,thisAV.maxlon);
                if(thisAV.rnglon>thisAV.rnglat){thisAV.partitionSection.sort(function(a, b){return waypoints[a].lon - waypoints[b].lon});}
                else{thisAV.partitionSection.sort(function(a, b){return waypoints[a].lat - waypoints[b].lat});}
               
                let i2=0
                for(let i =thisAV.currentCall.lowerBound;i<thisAV.currentCall.lowerBound+thisAV.partitionSection.length;i++){
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

                if(thisAV.partitionSection.length %2==0){
                  thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=mid;
                  thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=thisAV.currentCall.upperBound;
                 
                  thisAV.partitionStrt[thisAV.currentCall.currentPart]=thisAV.currentCall.lowerBound;
                  thisAV.partitionEnd[thisAV.currentCall.currentPart]=mid-1;
                  if(thisAV.rnglon>thisAV.rnglat){ thisAV.median= (waypoints[thisAV.waypointParts[mid]].lon+waypoints[thisAV.waypointParts[mid-1]].lon)/2;}
                  else{ thisAV.median= (waypoints[thisAV.waypointParts[mid]].lat+waypoints[thisAV.waypointParts[mid-1]].lat)/2;}

                }
                else{
                  thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=mid+1;
                  thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)]=thisAV.currentCall.upperBound;
                
                  thisAV.partitionStrt[thisAV.currentCall.currentPart]=thisAV.currentCall.lowerBound;
                  thisAV.partitionEnd[thisAV.currentCall.currentPart]=mid;
 
                  if(thisAV.rnglon>thisAV.rnglat){ thisAV.median= (waypoints[thisAV.waypointParts[mid]].lon+waypoints[thisAV.waypointParts[mid+1]].lon)/2;}
                  else{ thisAV.median= (waypoints[thisAV.waypointParts[mid]].lat+waypoints[thisAV.waypointParts[mid+1]].lat)/2;}
                  
                }
                if(thisAV.coloring=="Overlays"){
                    for (var i = 0; i < thisAV.highlightRect.length; i++) {
                        thisAV.highlightRect[i].remove();
                    }

                   thisAV.highlightRect.pop();
                }

                if(thisAV.rnglon>thisAV.rnglat){
                     thisAV.highlightPoly.push(
                     L.polyline([[thisAV.currentCall.maxLat,thisAV.median],[thisAV.currentCall.minLat,thisAV.median]], visualSettings.visiting)
                    );
                   if(thisAV.coloring=="Overlays"){
                        thisAV.highlightRect.push(L.rectangle([[thisAV.currentCall.minLat, thisAV.median], [thisAV.currentCall.maxLat, thisAV.currentCall.maxLon]], {color: "#F00", weight: 0.5}));
                        thisAV.highlightRect.push(L.rectangle([[thisAV.currentCall.minLat, thisAV.currentCall.minLon], [thisAV.currentCall.maxLat, thisAV.median]], {color: "#00F", weight: 0.5}));
                    }
               }
               else{
                   thisAV.highlightPoly.push(
                    L.polyline([[thisAV.median,thisAV.currentCall.maxLon],[thisAV.median,thisAV.currentCall.minLon]], visualSettings.visiting)
                   );
                  if(thisAV.coloring=="Overlays"){
                     thisAV.highlightRect.push(L.rectangle([[thisAV.median, thisAV.currentCall.minLon], [thisAV.currentCall.maxLat, thisAV.currentCall.maxLon]], {color: "#F00", weight: 0.5}));
                     thisAV.highlightRect.push(L.rectangle([[thisAV.currentCall.minLat, thisAV.currentCall.minLon], [thisAV.median, thisAV.currentCall.maxLon]], {color: "#00F", weight: 0.5}));
                  }
               }
                
               for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                     thisAV.highlightPoly[i].addTo(map);
                 }

            //coloring
            if(thisAV.coloring=="Overlays"){
                 for (var i = 0; i < thisAV.highlightRect.length; i++) {
                    thisAV.highlightRect[i].addTo(map);
                 }
             }
             if(thisAV.coloring=="Waypoints"){
                   for(var i=thisAV.partitionStrt[thisAV.currentCall.currentPart];i<=thisAV.partitionEnd[thisAV.currentCall.currentPart];i++){
                       updateMarkerAndTable(thisAV.waypointParts[i], {color:"#00F",scale:4,opacity:1, textColor: "white"} , 31, false);
                   }

                  for(var i=thisAV.partitionStrt[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)];i<=thisAV.partitionEnd[(thisAV.currentCall.currentPart+thisAV.currentCall.PartsLeft/2)];i++){
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
                if(thisAV.currentCall.PartsLeft > 2){ hdxAV.nextAction = "recursiveCall";}
                else{ hdxAV.nextAction = "end";}
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
                
                                
            
                if(thisAV.callStack.length==0){ console.timeEnd("t"); hdxAV.nextAction = "cleanup";}
                else{ hdxAV.nextAction = "methodCall";}
            },
            
            logMessage: function(thisAV){
                return "Ending the recursion this Partition";
            }
        },


        {
            //all avs need a cleanup state from which things such as additional polylines and global variables are reset
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                     hdxPart.parts=new Array(hdxPart.numParts);
                     for(var p=0;p<hdxPart.numParts;p++){
                            hdxPart.parts[p]=new Array();
                            for(var i=thisAV.partitionStrt[p];i<=thisAV.partitionEnd[p];i++){
                                 hdxPart.parts[p].push(thisAV.waypointParts[i]);
                          }
                    }
                    hdxPart.partitionAnalysis();
                    for(var i=0; i<graphEdges.length;i++){updatePolylineAndTable(i,visualSettings.undiscovered, false);}
                    //cleaning up graph for final coloring
                    for (var i = 0; i < thisAV.highlightRect.length; i++) {
                        thisAV.highlightRect[i].remove();
                    }
                    thisAV.highlightRect=[];
                    for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                     thisAV.highlightPoly[i].setStyle(visualSettings.undiscovered);
                    }
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
    
    //prepToStart is a necessary function for everyAV and is called when you hit visualize but before you hit start
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        //this function determines if you are using vertices (first param), edges (second param), and color (this gives black)
        initWaypointsAndConnections(true, true, visualSettings.undiscovered);
        for(var i=0; i<graphEdges.length;i++){updatePolylineAndTable(i,{color:"#000",scale:0,opacity:0, textColor: "white"}, false);}
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += '</td></tr>' + pcEntry(0,'Partition()','methodCall');
        this.code += '</td></tr>'+ pcEntry(1,'findCuttingAxis()<br/>'+pcIndent(2)+'sort(cuttingAxis)<br/>'+pcIndent(2)+'findMid','cutSort');
        this.code += '</td></tr>' + pcEntry(1,'setPartitions','setParts');
        this.code += '</td></tr>' + pcEntry(1,'if(number of Partitions > 2)','base');
        this.code += '</td></tr>' + pcEntry(2,'Partition(newPartion)<br/>'+pcIndent(4)+'Partition(newPartion2)','recursiveCall');
        this.code += '</td></tr>' + pcEntry(1,'else<br/>'+pcIndent(4)+'//do nothing','end');


     },
    //setup UI is called after you click the algorithm in algorithm selection but before you press the visualize button, required
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        let newAO = '<br />Number of Recursive Levels<input type="number" id="parts" min="1" max="' + (Math.trunc(Math.log2(waypoints.length))) + '" value="2">';
        newAO+=`<br/>Coloring Method: <select id="ColoringMethod">
        <option value="Overlays">Overlays</option>
        <option value="Waypoints">Waypoints</option>
        </select>`;
        newAO+=`<br/>`+hdxPart.colorHtml();
        hdxAV.algOptions.innerHTML = newAO;

        //here we insert the entries to control panels which allows us to update variables that the user sees on the sidebar
        //while the algorithms is being run
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting)
       
    },
    //cleanupUI is called when you select a new AV or map when after running an algorithm, required
    cleanupUI() {
        //remove all the polylines made by any global bounding box
        /*here is a loop where we remove all the polylines from the map
                        note this is not the same as popping the polylines
                        */
                    for (var i = 0; i < this.highlightPoly.length; i++) {
                          this.highlightPoly[i].remove();
                    }
                    this.highlightPoly = [];
                     for (var i = 0; i < this.highlightRect.length; i++) {
                        this.highlightRect[i].remove();
                    }
                    this.highlightRect=[];


    },

    //this is necessary for HDXAV to access the code inside our state machine, required
    idOfAction(action) {
	
        return action.label;
    },
    extremes(){
       this.maxlat=waypoints[this.partitionSection[0]].lat;
       this.minlat=waypoints[this.partitionSection[0]].lat;
       this.maxlon=waypoints[this.partitionSection[0]].lon;
       this.minlon=waypoints[this.partitionSection[0]].lon;
       for(i of this.partitionSection){
            if(waypoints[i].lat>this.maxlat){this.maxlat=waypoints[i].lat;}
            else if(waypoints[i].lat<this.minlat){this.minlat=waypoints[i].lat;}
            if(waypoints[i].lon>this.maxlon){this.maxlon=waypoints[i].lon;}
            else if(waypoints[i].lon<this.minlon){this.minlon=waypoints[i].lon;}
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
        let answer = HDXHasCommonConditionalBreakpoints(name);
        if (answer) {
            return true;
        }
        return false;
    }
    //here add any additional functions you may need to access in your AV

}
