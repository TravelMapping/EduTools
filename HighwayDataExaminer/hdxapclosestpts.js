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


    ]


}

function ClosestToAll() {
    this.closest = points.length;

}