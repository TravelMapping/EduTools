//
// HDX implementation of presorting waypoints
//
// METAL Project
//
// Primary Author: Jim Teresco, Alissa Ronca
//

function HDXPresort() {

    // default comparator function for priority queue
    this.comesBefore = function(v1, v2) {
        return v1.lon > v2.lon;
    };

    // set custom comparator for priority queue
    this.setComparator = function(c) {
        this.comesBefore = c;
    };
    
    // the actual array representing this linear structure
    this.sortedWaypoints = [];
    
    for (let index = 0; index < waypoints.length; index++) {
        //add to new array maintaining order
        let vertex = waypoints[index];
        if (this.sortedWaypoints.length > 0) {
            // need to maintain in order
            // does e come first?
            let i = 0;
            while ((i < this.sortedWaypoints.length) &&
                   this.comesBefore(vertex, this.sortedWaypoints[i])) {
                i++;
            }
            this.sortedWaypoints.splice(i, 0, vertex);
        }
        else {
            this.sortedWaypoints.push(vertex);
        }
    }
    
    // for (let index = 0; index < this.sortedWaypoints.length; index++) {
    //     this.sortedWaypoints[index].newIndex = index;
    // }
    //
    // for (let i = 0; i < graphEdges.length; i++) {
    //     graphEdges[i].v1 = waypoints[graphEdges[i].v1].newIndex;
    //     graphEdges[i].v2 = waypoints[graphEdges[i].v2].newIndex;
    // }
        
    return this;    
}

