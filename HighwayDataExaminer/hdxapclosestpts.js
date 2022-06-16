//
// HDX All Pairs Closest Points AV
//
// METAL Project
//
// Primary Authors: Mark Verra
// Version: Summer 2022
//
//

var hdxAPClosestPtsAV = {
    // entries for list of AVs
    value: "APClosestPts",
    name: "All Points Closest Pairs",
    description: "Search for the closest pair of vertices (waypoints).",

    // ***Most of my code and comments here will be based on my understanding of OOP from CS-225 in Java, 
    // please feel free to correct any misconceptions or incorrect assumptions I have made!***

    // points is the array of waypoint objects that are read from a TMG file
    // points: [],

    // closest is the array of indexes which correspond to the closest points in the "points" array.
    closestVertices: Array(waypoints.length).fill(0),

    // the distance between the two closest points in the array of points.
    globalMinD: -1,

    v: 0,
    vClosest: -1,
    
    d: 0,
    dClosest: Number.MAX_SAFE_INTEGER,
    

    vert1: null,
    vert2: null,

    // Loop index variables
    outLoop: 0,
    inLoop: 0,

    boundingPoly: [],

    highlightPoly: [],


    avActions: [
        {
            label: "START",
            comment: "Initialize all points closest pairs variables",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.nextAction = "v1ForLoopTop";
            }
        },

        {
            label: "v1ForLoopTop",
            comment: "Start of loop which traverses array of vertices",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.nextAction = "resetClosest";
            }

        },

        {
            label: "resetClosest",
            comment: "Reset v<sub>closest</sub> and d<sub>closest</sub> to their default values",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                hdxAV.nextAction = "v2ForLoopTop";
            }
        },

        {
            label: "v2ForLoopTop",
            comment: "Looping through array of vertices to determine which vertex" +
             " from the first loop pairs with second loop vertex",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                if(inLoop = waypoints.length - 1) hdxAV.nextAction = "checkEquals";
                else hdxAV.nextAction = "setPair";
            }
        },

        {
            label: "checkEquals",
            comment: "Check that we are not visiting the same vertex in both for loops",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                if(null) {
                    hdxAV.nextAction = "ifClosest";
                } else {
                    hdxAV.nextAction = "setPair";
                }
                
            }
        },

        {
            label: "ifClosest",
            comment: "Set distance var to the distance between v<sub>1</sub> and v<sub>2</sub>, then check" +
            " to see if this new distance should become the smallest distance between the two vertices.",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);
                if(d < dClosest) hdxAV.nextAction = "setClosest";
                else hdxAV.nextAction = "setClosest";
            }
        },

        {
            label: "setPair",
            comment: "Set index of closest array to index of closest vertex",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.discovered)
                hdxAV.nextAction = "v2ForLoopTop";
            }
        }


    ],

    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        
        //we want only vertices for this algorithm
        initWaypointsAndConnections(true, false, visualSettings.undiscovered);

        

        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';

        //pseudocode for the start state
        this.code += `closestVertex &larr; []`;
    

        //pseudocode for the top of the for loop
        this.code += '</td></tr>' +
            pcEntry(0, 'for (v<sub>1</sub> &larr; 0 to |V| - 1)',"v1ForLoopTop");
        this.code += '</td></tr>' +
            pcEntry(1, 'v<sub>closest</sub> &larr; -1<br />', "resetClosest") +
            pcEntry(1, 'd<sub>closest</sub> &larr; &infin;<br />', "resetClosest");
        this.code += '</td></tr>' +
            pcEntry(1, 'for (v2 &larr; 0 to |V| - 1)', "v2ForLoopTop");
        this.code += '</td></tr>' +
            pcEntry(2, 'if (v<sub>1</sub> &ne; v<sub>2</sub>)', "CheckEquals");
        this.code += '</td></tr>' +
            pcEntry(3, 'd &larr; dist(v<sub>1</sub>, v<sub>2</sub>)', "ifClosest") +
            pcEntry(3, 'if(d < d<sub>closest</sub>)<br />', "ifClosest");
        this.code += '</td></tr>' +
            pcEntry(4, 'v<sub>closest</sub> &larr; v<sub>2</sub>', "setClosest") +
            pcEntry(4, 'd<sub>closest</sub> &larr; d', "setClosest");
        this.code += '</td></tr>' +
            pcEntry(1, 'closestVertex[v<sub>1</sub>] &larr; v<sub>closest</sub', "setPair");

            

},

setupUI() {
    var algDescription = document.getElementById("algDescription");
    algDescription.innerHTML = this.description;
    hdxAV.algStat.style.display = "";
    hdxAV.algStat.innerHTML = "Setting up";
    hdxAV.logMessageArr = [];
    hdxAV.logMessageArr.push("Setting up");


    //let newAO = 'Refinement Threshold <input type="number" id="refinement" min="2" max="' 
    //+ (waypoints.length) + '" value="3">';

    //newAO += `<br /><input id="squareBB" type="checkbox" name="Square Bounding Box"/>&nbsp;
    //Square Bounding Box<br />`;

    //hdxAV.algOptions.innerHTML = newAO;
    addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
    addEntryToAVControlPanel("visiting",visualSettings.visiting)
    addEntryToAVControlPanel("numLeaves",visualSettings.discovered);
    addEntryToAVControlPanel("maxDepth",visualSettings.highlightBounding);
   
},

cleanupUI() {
    //remove all the polylines made by the bounding box and the quadtree
    for (var i = 0; i < this.boundingPoly.length; i++) {
        this.boundingPoly[i].remove();
    }
    for(var i = 0; i < this.highlightPoly.length; i++){
        this.highlightPoly[i].remove();
    }
    this.boundingPoly = [];
    this.highlightPoly = [];
},


}

function ClosestToAll() {
    this.closest = points.length;

}