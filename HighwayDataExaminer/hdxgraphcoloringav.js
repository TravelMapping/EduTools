//
// HDX Welsh-Powell Graph Coloring Algorithm AV
//
// METAL Project
//
// Primary Authors: Luke Jennings
//

var hdxGraphColoringAV = {
    value: 'Welsh-Powell Graph Coloring',

    name: "Welsh-Powell Graph Coloring",

    description: "Greedy algorithm that provides a polynomial time approximation of the graph coloring problem. Although answers are unlikely to be minimal, no vertex will have the same color as any of its neighbors.",

    sortedV: [],

    nextToCheck: -1,

    currVertex: -1,

    color: null,

    avActions : [
        {
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                thisAV.currColor = 0;
                thisAV.color = null;
                thisAV.nextToCheck = -1;
                thisAV.sharesColor = false;
                thisAV.currVertex = -1;
            
                //setting up rainbow
                thisAV.rainbowGradiant = new Rainbow();
                thisAV.rainbowGradiant.setNumberRange(0,360);
                thisAV.rainbowGradiant.setSpectrum('ff0000','ffa000','00ff00','00ffff','0000ff','c700ff');
                
               

                //here we are sorting the waypoints from highest degree to lowest degree
                for(let i = 0; i < waypoints.length; i++){
                    thisAV.sortedV[i] = i;
                    waypoints[i].color = -1;
                }

                thisAV.sortedV.sort(thisAV.compareDegree);

                updateAVControlEntry("undiscovered","Colorless Verticies: " + thisAV.sortedV.length);

                hdxAV.iterationDone = true;
                hdxAV.nextAction = "topWhileLoop";
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },
        {
            label: "topWhileLoop",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
            

                thisAV.color = {
                    color:"#" + thisAV.rainbowGradiant.colorAt((thisAV.currColor * 223) % 360),
                        textColor: "white",
                        scale: 6,
                        weight: 5,
                        name: "color",
                        value: 0,
                        opacity: 0.8,

                    }

                thisAV.nextToCheck = 0;
                
                if(thisAV.sortedV.length > 0){
                    updateAVControlEntry("totalColors","Number of Colors: " + (thisAV.currColor + 1));
                    hdxAV.nextAction = "innerWhileLoop";
                } else {
                    hdxAV.nextAction = "cleanup";
                }
    
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },
        {
            label: "innerWhileLoop",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
    
                console.log(thisAV.nextToCheck + " " + thisAV.sortedV.length);
                if(thisAV.nextToCheck < thisAV.sortedV.length){
                    thisAV.sharesColor = false;
                    //this gives us the index of the vertex that we are currently checking
                    thisAV.currVertex = thisAV.sortedV[thisAV.nextToCheck];

                    updateMarkerAndTable(thisAV.sortedV[thisAV.nextToCheck],visualSettings.visiting,false);
                    updateAVControlEntry("visiting","Visiting: #" + thisAV.sortedV[thisAV.nextToCheck] + " " + waypoints[thisAV.sortedV[thisAV.nextToCheck]].label);

                    hdxAV.nextAction = "neighborCheck";
                } else {
                    hdxAV.nextAction = "incrementColor";
                }
    
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },
        {
            label: "neighborCheck",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
    
               
                let v1;
                let v2;
                for(let i = 0; i <waypoints[thisAV.currVertex].edgeList.length;i++){
                    updatePolylineAndTable(waypoints[thisAV.currVertex].edgeList[i].edgeListIndex,thisAV.color,false);
                }

                for(let i = 0; i < waypoints[thisAV.currVertex].edgeList.length;i++){
                    
                    v1 = waypoints[thisAV.currVertex].edgeList[i].v1;
                    v2 = waypoints[thisAV.currVertex].edgeList[i].v2;

                    if(v1 == thisAV.currVertex){
                        console.log(waypoints[v2].color);
                        console.log(thisAV.currColor);
                        if(waypoints[v2].color == thisAV.currColor){
                            thisAV.sharesColor = true;
                            break;
                        }
                    }else{
                        if(waypoints[v1].color == thisAV.currColor){
                            thisAV.sharesColor = true;
                            break;
                        }
                    }
                }


                if(thisAV.sharesColor){

                    hdxAV.nextAction = "incrementI";
                } else {
                    hdxAV.nextAction = 'setColor';
                }
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },

        {
            label: "setColor",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                for(let i = 0; i <waypoints[thisAV.currVertex].edgeList.length;i++){
                    updatePolylineAndTable(waypoints[thisAV.currVertex].edgeList[i].edgeListIndex,visualSettings.undiscovered,false);
                }
    
                waypoints[thisAV.currVertex].color = thisAV.currColor;

                //this pattern generates
                updateMarkerAndTable(thisAV.currVertex,thisAV.color,false);

                //set the color in the waypoints array
                waypoints[thisAV.currVertex].color = thisAV.currColor;
                //here we delete the resent
                thisAV.sortedV.splice(thisAV.nextToCheck,1);

                updateAVControlEntry("undiscovered","Colorless Vertices: " + thisAV.sortedV.length);

                hdxAV.nextAction = "innerWhileLoop";
    
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },

        {
            label: "incrementI",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
                for(let i = 0; i <waypoints[thisAV.currVertex].edgeList.length;i++){
                    updatePolylineAndTable(waypoints[thisAV.currVertex].edgeList[i].edgeListIndex,visualSettings.undiscovered,false);
                }
    
                updateMarkerAndTable(thisAV.sortedV[thisAV.nextToCheck],visualSettings.undiscovered,false);
                thisAV.nextToCheck++;
                hdxAV.nextAction = "innerWhileLoop";
    
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },
        
        {
            label: "incrementColor",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);
    
                thisAV.currColor++;
                hdxAV.nextAction = "topWhileLoop";
    
            },
            logMessage: function(thisAV){
                return "Doing some setup stuff";
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

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
        this.code += `color &larr; 0</br>`
        this.code += `sortedV[] &larr; sort(V,degree)</br>`
        this.code += `for i &larr 0 to |sortedV|</br>`
        this.code += pcIndent(2) + `sortedV[i].color &larr; -1 //colorless</br>`
        this.code += pcEntry(0,"while(sortedV is not empty)</br>" +
            pcIndent(2) + "i &larr; 0","topWhileLoop");
        this.code += pcEntry(1,"while(i < |sortedV|)","innerWhileLoop");
        this.code += pcEntry(2,"if(sortedV[i].neighbors not contain color)","neighborCheck");
        this.code += pcEntry(3,"sortedV[i].color &larr; color</br>" + 
            pcIndent(6) + "sortedV[i].remove()","setColor");
        this.code += pcEntry(2,"else","");
        this.code += pcEntry(3,"i++","incrementI");
        this.code += pcEntry(1,"color++","incrementColor");
     },
    //setup UI is called after you click the algorithm in algorithm selection but before you press the visualize button, required
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        hdxAV.algOptions.innerHTML = "";

        //here we insert the entries to control panels which allows us to update variables that the user sees on the sidebar
        //while the algorithms is being run
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting);
        addEntryToAVControlPanel("totalColors",visualSettings.leader);
        
    },
    //cleanupUI is called when you select a new AV or map when after running an algorithm, required
    cleanupUI() {
        //remove all the polylines made by any global bounding box
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
    },
    //comparator for the sorting function to sort waypoints by th
    compareDegree(a,b){
        return waypoints[b].edgeList.length - waypoints[a].edgeList.length ;
    }
}