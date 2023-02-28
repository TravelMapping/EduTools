//
// HDX implementation of presorting waypoints
//
// METAL Project
//
// Primary Author: Jim Teresco, Alissa Ronca
//

function HDXWaypointsSorter() {

    // default comparator function for ordering
    this.comesBefore = function(v1, v2) {
        return v1.lon > v2.lon;
    };

    // set custom comparator for ordering (currently unused)
    //this.setComparator = function(c) {
    //    this.comesBefore = c;
    //};

    // retrieve a copy of the global waypoints array that has been
    // sorted by the criteria in the comesBefore comparator function
    this.sortWaypoints = function() {
	let s = [];
	
	for (let index = 0; index < waypoints.length; index++) {
            //add to new array maintaining order
            let vertex = waypoints[index];
            if (s.length > 0) {
		// need to maintain in order
		// does e come first?
		let i = 0;
		while ((i < s.length) &&
                       this.comesBefore(vertex, s[i])) {
                    i++;
		}
		s.splice(i, 0, vertex);
            }
            else {
		s.push(vertex);
            }
	}
	return s;
    }
}

