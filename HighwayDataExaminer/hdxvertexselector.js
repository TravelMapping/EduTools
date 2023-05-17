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
var hdxVertexSelector = {

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
            let v = document.getElementById(this.selector);
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

// Same as buildWaypointSelector but is used for
// conditional breakpoints
function buildWaypointSelector2(id,label) {

    return label + ' <input id="' + id +
        '" onfocus="hdxVertexSelector.startSelection(\'' + id +
        '\')" type="number" min="0" max="' +
        (waypoints.length-1) + '" size="6" style="width: 47px" name="quantity" ' +
        'onchange="waypointSelectorChanged(\'' + id + '\')"' +
        '/>';
}

// event handler for waypoint selectors
function waypointSelectorChanged(id) {

    let label = document.getElementById(id + "Label");
    if (label != null) {
	let vNum = document.getElementById(id).value;
	label.innerHTML = waypoints[vNum].label;
    }
}
