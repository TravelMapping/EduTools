//
// HDX Vertex Selector
//
// METAL Project
//
// Primary Authors: Arjol Pengu, Jim Teresco
//

/* Support for selection of a vertex (such as a starting or ending
   vertex for a traversal or search) by clicking on a waypoint on
   the map or an entry in the waypoint table.  The startSelection
   method should be set as the onfocus event handler for a selector
   used to store vertex numbers for any purpose in an algorithm.

   Based on code originally developed by Arjol Pengu, Summer 2017. 
*/
const hdxVertexSelector = {

    // the string to find the selector to fill in with
    // a vertex number, if null, no selection is in process
    selector: "",

    // function to call to start the selection (when the
    // selector is clicked)
    startSelection(label) {
        //alert("startSelection: " + label);
        this.selector = label;
    },

    // the actual event handler function to set the value
    select(vNum) {
        //alert("select: " + vNum);
        if (this.selector != "") {
            const v = document.getElementById(this.selector);
            v.value = vNum;
            // and update the label
            waypointSelectorChanged(this.selector);
        }
        this.selector = "";
    }
};

// a function to build HTML to insert a vertex/waypoint selector
// component
// id is the HTML element id for the input
// label is the label for the control
// initVal is the waypoint number to use for initialization
function buildWaypointSelector(id,label,initVal) {
        
    return label + ' <input id="' + id +
        '" onfocus="hdxVertexSelector.startSelection(\'' + id +
        '\')" type="number" value="' + initVal + '" min="0" max="' +
        (waypoints.length-1) + '" size="6" style="width: 7em" ' +
        'onchange="waypointSelectorChanged(\'' + id + '\')"' +
        '/>';        
}

// Same as buildWaypointSelector but is used for conditional
// breakpoints
function buildCBPWaypointSelector(id,label) {

    const selid = id + "sel";
    return label + ' <input id="' + id +
        '" onfocus="hdxVertexSelector.startSelection(\'' + id +
        '\')" type="number" min="0" max="' +
        (waypoints.length-1) + '" size="6" style="width: 47px" name="quantity" ' +
        'onchange="waypointSelectorChanged(\'' + id + '\')"' +
        '/><br />or <select id="' + selid + '">' +
	'<option value="exact">exact</option>' +
	'<option value="substring">substring</option>' +
	'<option value="starts">starts with</option>' +
	'</select> label match <input id="' + id + 'text" size="10" />';
}

// event handler for waypoint selectors
function waypointSelectorChanged(id) {

    const label = document.getElementById(id + "Label");
    if (label != null) {
	const vNum = document.getElementById(id).value;
	label.innerHTML = waypoints[vNum].label;
    }
}

// function to check if the given values from a CBP vertex selector
// match the vertex with the given number or label
function isCBPVertexMatch(vnum, matchvnum, matchtype, matchtext) {

    // first check for a vertex number match
    if (vnum == matchvnum) {
	return true;
    }
    if (vnum >= 0 && vnum < waypoints.length) {
	const vlabel = waypoints[vnum].label;
	switch (matchtype) {
	case "exact":
	    if (vlabel == matchtext) {
		return true;
	    }
	    break;
	case "substring":
	    if (vlabel.includes(matchtext)) {
		return true;
	    }
	    break;
	case "starts":
	    if (vlabel.startsWith(matchtext)) {
		return true;
	    }
	    break;
	}
    }
    
    // nothing matched
    return false;
}
