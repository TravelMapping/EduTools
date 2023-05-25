//
// HDX Edge Selector, based on vertex selector
//
// METAL Project
//
// Author: Jim Teresco, May 2023
//

/* Support for selection of an edge by clicking on a connection on
   the map or an entry in the edge table.  The startSelection
   method should be set as the onfocus event handler for a selector
   used to store edge numbers for any purpose in an algorithm.

*/
const hdxEdgeSelector = {

    // the string to find the selector to fill in with
    // an edge number, if null, no selection is in process
    selector: "",

    // function to call to start the selection (when the
    // selector is clicked)
    startSelection(label) {
        this.selector = label;
    },

    // the actual event handler function to set the value
    select(eNum) {

        if (this.selector != "") {
            const e = document.getElementById(this.selector);
            e.value = eNum;
            // and update the label
            edgeSelectorChanged(this.selector);
        }
        this.selector = "";
    }
};

// a function to build HTML to insert a edge/connection selector
// component
// id is the HTML element id for the input
// label is the label for the control
// initVal is the edge number to use for initialization
function buildEdgeSelector(id,label,initVal) {
        
    return label + ' <input id="' + id +
        '" onfocus="hdxEdgeSelector.startSelection(\'' + id +
        '\')" type="number" value="' + initVal + '" min="0" max="' +
        (graphEdges.length-1) + '" size="6" style="width: 7em" ' +
        'onchange="edgeSelectorChanged(\'' + id + '\')"' +
        '/>';        
}

// Same as buildEdgeSelector but is used for conditional
// breakpoints and has no initVal
function buildCBPEdgeSelector(id,label) {

    return label + ' <input id="' + id +
        '" onfocus="hdxEdgeSelector.startSelection(\'' + id +
        '\')" type="number" min="0" max="' +
        (graphEdges.length-1) + '" size="6" style="width: 47px" name="quantity" ' +
        'onchange="edgeSelectorChanged(\'' + id + '\')"' +
        '/>';
}

// event handler for egde selectors
function edgeSelectorChanged(id) {

    const label = document.getElementById(id + "Label");
    if (label != null) {
	const eNum = document.getElementById(id).value;
	label.innerHTML = graphEdges[eNum].label;
    }
}
