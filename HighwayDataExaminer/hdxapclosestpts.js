//
// HDX All Pairs Closest Points AV
//
// METAL Project
//
// Primary Authors: Mark Verra
//

var hdxAPClosestPtsAV = {
    // entries for list of AVs
    value: "APClosestPts",
    name: "All Points Closest Pairs",
    description: "Search for the closest pair of vertices (waypoints).",

    // ***Most of my code and comments here will be based on my understanding of OOP from CS-225 in Java, 
    // please feel free to correct any misconceptions or incorrect assumptions I have made!***

    // points is the array of waypoint objects that are read from a TMG file
    points: null,

    // closest is the array of indexes which correspond to the closest points in the "points" array.
    closest: [],

    // the distance between the two closest points in the array of points.
    globalMinD: -1,

    // Loop index variables
    OutLoop: 0,
    InLoop: 0,


    avActions: [
        {
            label: "START",
            comment: "Initialize all points closest pairs variables",
            code: function (thisAV) {
                highlightPseudocode(this.label, visualSettings.visiting);

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
            pcEntry(1, 'v<sub>closest</sub> &larr; -1<br />', "InitVars") +
            pcEntry(1, 'd<sub>closest</sub> &larr; &infin;<br />', "InitVars") +
            pcEntry(1, 'for (v2 &larr; 0 to |V| - 1)', "v2ForLoopTop");
        this.code += '</td></tr>' +
            pcEntry(2,'if (v<sub>1</sub> &ne; v<sub>2</sub>)') +
            pcEntry(3, 'd &larr; dist(v<sub>1</sub>, v<sub>2</sub>)') +
            pcEntry(3, 'if(d < d<sub>closest</sub>)');
            

}


}

function ClosestToAll() {
    this.closest = points.length;

}