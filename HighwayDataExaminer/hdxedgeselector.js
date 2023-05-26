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

    const selid = id + "sel";
    let html = label + ' <input id="' + id +
        '" onfocus="hdxEdgeSelector.startSelection(\'' + id +
        '\')" type="number" min="0" max="' +
        (graphEdges.length-1) +
	'" size="6" style="width: 47px" name="quantity" ' +
        'onchange="edgeSelectorChanged(\'' + id + '\'")/>' +
	'<br />or <select id="' + selid + '">' +
	'<option value="exact">exact</option>' +
	'<option value="substring">substring</option>' +
	'<option value="starts">starts with</option>' +
	'<option value="route">has route</option>' +
	'</select> label match <input id="' + id + 'text" size="10" />';

    // only if the AV displays vertices will we also allow to match an
    // edge by its vertex endpoints
    if (hdxAV.currentAV.useV) {
	const vid = id + "end";
	html += '<br />ADD VERTEX ENDPOINT';
    }
	
    return html;
}

// event handler for egde selectors
function edgeSelectorChanged(id) {

    const label = document.getElementById(id + "Label");
    if (label != null) {
	const eNum = document.getElementById(id).value;
	label.innerHTML = graphEdges[eNum].label;
    }
}

// function to check if the given values from a CBP edge selector
// match the edge with the given number
function isCBPEdgeMatch(edgenum, matchedgenum, matchtype, matchtext) {

    console.log("isCBPEdgeMatch: considering edgenum " + edgenum);
    console.log("isCBPEdgeMatch: checking number match with " + matchedgenum);
    // first check for an edge number match
    if (edgenum == matchedgenum) {
	return true;
    }
    if (edgenum >= 0 && edgenum < graphEdges.length) {
	const elabel = graphEdges[edgenum].label;
	console.log("isCBPEdgeMatch: checking " + matchtype + " label match, edgelabel: " + elabel + " with " + matchtext);
	switch (matchtype) {
	case "exact":
	    if (elabel == matchtext) {
		return true;
	    }
	    break;
	case "substring":
	    if (elabel.includes(matchtext)) {
		return true;
	    }
	    break;
	case "starts":
	    if (elabel.startsWith(matchtext)) {
		return true;
	    }
	    break;
	case "route":
	    const routes = elabel.split(',');
	    for (route of routes) {
		if (route == matchtext) {
		    return true;
		}
	    }
	    break;
	}
    }
    if (hdxAV.currentAV.useV) {
	console.log("NOT YET CHECKING VERTEX ENDPOINT MATCHES");
    }
    
    // nothing matched
    return false;
}
