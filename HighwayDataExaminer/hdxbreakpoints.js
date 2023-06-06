//
// HDX Functions related to breakpoints
//
// METAL Project
//
// Original Author: Tyler Gorman, Modified/redesigned by Jim Teresco
//

// types of conditional breakpoints supported
const hdxCBPTypes = {

    VARIABLE: 1,
    CONDITION: 2
};

// types of conditional breakpoint value selectors supported
const hdxCBPSelectors = {

    VERTEX: 1,
    EDGE: 2,
    INTEGER: 3,
    FLOAT: 4,
    STRING: 5
};

// Adds a click event to all rows with the codeRow class (the
// pseudocode display). This is used obtain the ID of the correct row
// to assign it to the currentBreakpoint variable
function addBreakpointListeners() {

    const elements = document.getElementsByClassName("codeRow");
    for (let element = 0; element < elements.length; element++) {
        const child = elements[element].childNodes[0];
	// this listener sets and displays breakpoints when selected, and
	// displays conditional breakpoint info for actions that
	// support them
        elements[element].addEventListener("click", function(event) {
	    
            const target = event.target;
            hdxAV.previousBreakpoint = hdxAV.currentBreakpoint;
            hdxAV.currentBreakpoint = target.getAttribute("id");

	    // clear any conditional breakpoint controls
	    breakpointClearCBPControls();	    

            // if the previous and current breakpoints are the same,
            // unselect it, and change the colors back else, deselect
            // the previous, and highlight current
            if (hdxAV.previousBreakpoint == hdxAV.currentBreakpoint) {
                codeRowHighlight();
                hdxAV.previousBreakpoint = "";
                hdxAV.currentBreakpoint = "";
            }
            else {
                hdxAV.setStatus(hdxStates.AV_PAUSED);
                if (hdxAV.delay == -1) {
                    hdxAV.startPause.innerHTML = "Next Step";
                }
                else {
                    hdxAV.startPause.innerHTML = "Resume";
                }

		// check if this action should set up conditional
		// breakpoint UI elements
		let breakpointAction = null;
		for (let i = 0; i < hdxAV.currentAV.avActions.length; i++) {
		    if (hdxAV.currentBreakpoint ==
			hdxAV.currentAV.avActions[i].label) {
			breakpointAction = hdxAV.currentAV.avActions[i];
			break;
		    }
		}

		if (breakpointAction != null &&
		    breakpointAction.hasOwnProperty("cbp")) {
		    breakpointShowCBPControls(breakpointAction.cbp);
		}
		
                codeRowHighlight();
                breakpointHighlight();
            }
        }, false);
    }
}

// clear the conditional breakpoint controls
function breakpointClearCBPControls() {

    document.getElementById("CBPConditions").innerHTML = "";
    document.getElementById("CBPWhole").style.display = "none";
}

// show the conditional breakpoint controls associated with an action, given
// by its cpb field passed in as the parameter
function breakpointShowCBPControls(cbp) {

    // if cbp is not already an array of objects, make it one so we
    // don't have to handle multiple controls as special cases below
    let controls = cbp;
    if (!Array.isArray(cbp)) {
	controls = [ cbp ];
    }

    // build an HTML string that will have our needed inputs for this CBP
    let html = "<hr />";
    for (control of controls) {
	// default control id unless one was specified
	let controlid = "HDXCBPControl";
	if (control.selector.hasOwnProperty("id")) {
	    controlid = control.selector.id;
	}

	// build the HTML for this one
	switch (control.selector.type) {
	case hdxCBPSelectors.VERTEX:
	    html += buildCBPWaypointSelector(controlid,
					     control.selector.vindexvar);
	    break;
	case hdxCBPSelectors.EDGE:
	    html += buildCBPEdgeSelector(controlid, control.selector.eindexvar);
	    break;
	case hdxCBPSelectors.FLOAT:
	    html += buildCBPFloatSelector(controlid,
					  control.selector.checkvar);
	    break;
	default:
	    console.log("UNHANDLED CBP SELECTOR TYPE!");
	}
	html += "<hr />";
    }

    // add the constructed HTML to the right element
    document.getElementById("CBPConditions").innerHTML = html;
    document.getElementById("CBPWhole").style.display = "block";
}

// check the action with a conditional breakpoint for a match that should
// pause execution
function breakpointCheckMatch(cbp) {

    // if cbp is not already an array of objects, make it one so we
    // don't have to handle multiple controls as special cases below
    let controls = cbp;
    if (!Array.isArray(cbp)) {
	controls = [ cbp ];
    }

    // check each for a match, if any matches, we return true
    for (control of controls) {
	// default control id unless one was specified
	let controlid = "HDXCBPControl";
	if (control.selector.hasOwnProperty("id")) {
	    controlid = control.selector.id;
	}

	const element = document.getElementById(controlid);
	
	switch (control.selector.type) {
	case hdxCBPSelectors.VERTEX:
	    let vnum = -1;
	    if (element.value.length > 0 && !isNaN(element.value)) {
		vnum = parseFloat(element.value);
	    }
	    const vselelement = document.getElementById(controlid + "sel");
	    const vtextelement = document.getElementById(controlid + "text");
	    if (control.f(hdxAV.currentAV, vnum, vselelement.value.trim(),
			  vtextelement.value.trim())) {
		return true;
	    }
	    break;
	case hdxCBPSelectors.EDGE:
	    let edgenum = -1;
	    if (element.value.length > 0 && !isNaN(element.value)) {
		edgenum = parseFloat(element.value);
	    }
	    const selelement = document.getElementById(controlid + "sel");
	    const textelement = document.getElementById(controlid + "text");
	    let evnum = -1;
	    const evelement = document.getElementById(controlid + "end");
	    if (evelement != null && evelement.value.length > 0 &&
		!isNaN(evelement.value)) {
		evnum = parseFloat(evelement.value);
	    }
	    if (control.f(hdxAV.currentAV, edgenum, selelement.value.trim(),
			  textelement.value.trim(), evnum)) {
		return true;
	    }
	    break;
	case hdxCBPSelectors.FLOAT:
	    let entered = -1;
	    if (element.value.length > 0 && !isNaN(element.value)) {
		entered = parseFloat(element.value);
	    }
	    const fselelement = document.getElementById(controlid + "sel");
	    if (control.f(hdxAV.currentAV, entered, fselelement.value.trim())) {
		return true;
	    }
	    break;
	default:
	    console.log("UNHANDLED CBP SELECTOR TYPE!");
	}
    }
    // we never returned true, no match, so no break
    return false;
}

// Highlight the current breakpoint
function breakpointHighlight() {

    if (hdxAV.currentBreakpoint == "") return;
    
    const element = document.getElementById(hdxAV.currentBreakpoint);
    if (element != null) {
        element.style.borderStyle = "dashed";
        element.style.borderColor = "Red";
        element.style.borderWidth = "2px";
    }
}

// Change the border back to a normal codeRow
function codeRowHighlight() {

    if (hdxAV.previousBreakpoint == "") return;
    
    const element = document.getElementById(hdxAV.previousBreakpoint);
    if (element != null) {
        element.style.borderStyle = "solid";
        element.style.borderColor = "Black";
        element.style.borderWidth = "1px";
    }
}

// Reset the breakpoint variables to avoid issues on reset
function cleanupBreakpoints() {
    
    hdxAV.currentBreakpoint = "";
    hdxAV.previousBreakpoint = "";
}

// JS implementation to create the html for the conditional breakpoint
// selector. This allows for the html to be dynamically created after
// the avPanel is shown.
function createCBPSelector() {

    // cbpWholeDiv is the whole CBP selection area, including the
    // conditional/unconditional selector as well as the controls that
    // select vertices, edges, etc.
    const cbpWholeDiv = document.createElement("div");
    cbpWholeDiv.setAttribute("id", "CBPWhole");
    cbpWholeDiv.setAttribute("class", "border border-primary rounded");
    
    // This is where the variable selector controls are placed
    const cbpConditionsDiv = document.createElement("div");
    cbpConditionsDiv.setAttribute("id", "CBPConditions");
    cbpConditionsDiv.innerHTML = "Replace with selector controls";

    // label and selector to choose conditional/unconditional
    const bp = document.createElement("span");
    bp.innerHTML = "Breakpoint: ";
    const cbp = document.createElement("select");
    cbp.setAttribute("id", "CBPOnOff");
    const opton = document.createElement("option");
    opton.value = "on";
    opton.innerHTML = "Conditional";
    opton.selected = true;
    const optoff = document.createElement("option");
    optoff.value = "off";
    optoff.innerHTML = "Unconditional";
    cbp.appendChild(opton);
    cbp.appendChild(optoff);
    // when the user selects unconditional for an action that supports
    // conditional breakpoints, hide the conditional breakpoint selector
    cbp.onchange = function() {
	hdxAV.useConditionalBreakpoint =
	    document.getElementById("CBPOnOff").value == "on";
	if (hdxAV.useConditionalBreakpoint) {
	    document.getElementById("CBPConditions").style.display = "block";
	}
	else {
	    document.getElementById("CBPConditions").style.display = "none";
	}
    };

    // append the smaller divs to the bigger one
    cbpWholeDiv.appendChild(bp);
    cbpWholeDiv.appendChild(cbp);
    cbpWholeDiv.appendChild(cbpConditionsDiv);
    
    // Set the main div under the pseudocode
    const pcPanel = document.getElementById("pseudo");
    pcPanel.appendChild(cbpWholeDiv);
    // Set the default position, add click on/window resize events and hide it
    setDefaultCBPSelectorLocation();
    cbpWholeDiv.style.display = "none";    
    hdxAV.useConditionalBreakpoint = true;
}


// Sets the popout back to where it should be. Used to avoid 
// issues when resizing and turning it off via breakpoint selector
function setDefaultCBPSelectorLocation() {
    
    const avPanel = document.getElementById("avStatusPanel");
    const rect2 = avPanel.getBoundingClientRect();
    // avCP right side - left side
    const difference2 = rect2.right-rect2.left;
    const element = document.getElementById("CBPWhole");
    const rect = element.getBoundingClientRect();
    // right side - left side
    const difference = rect.right - rect.left;
    // Width of the CP - the width of the selector + 25 offset to get
    // it to stick out
    const trueDifference = difference2 - difference + 25;
    element.style.left = trueDifference + "px";
}

function deleteCBPSelector() {
    
    const element = document.getElementById("CBPWhole");
    if (element != null) element.parentNode.removeChild(element);
    hdxAV.useConditionalBreakpoint = false;
}

/* keeping commented out for now in case new CBP code needs something similar
function createInnerHTMLChoice(choice, id, firstText, secondText) {

    switch (choice) {
    case "boolean":
        html = 'Stop when: <br><select name="quantity" id="';
        html+= id + '"><option value="true">' + firstText + '</option>';
        html+= '<option value="false">' + secondText + '</option></select>';
        return html;   
    case "number":
        html = 'Stop when ' + firstText + '<br \><input type="number" name="quantity" id"';
        html += id + '" min="1" max="100">';
        return html;
    }
}
*/


// build a selector for a generic floating-point value match
function buildCBPFloatSelector(id, matchvar) {

    const selid = id + "sel";
    return "Stop when <tt>" + matchvar + '</tt>' +
        ' <select id="' + selid + '">' +
	'<option value="lt">&lt;</option>' +
	'<option value="gt">&gt;</option>' +
	'</select> <input id="' + id + '" type="number" size="6" />';
}

// function to check if the given values from a CBP float selector
// match the variable's value
function isCBPFloatMatch(varvalue, matchval, matchtype) {

    switch (matchtype) {
    case "lt":
	if (varvalue < matchval) {
	    return true;
	}
	break;
    case "gt":
	if (varvalue > matchval) {
	    return true;
	}
	break;
    }
    
    // nothing matched
    return false;
}
