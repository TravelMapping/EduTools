//
// HDX pseudocode support functions
//
// METAL Project
//
// Primary Author: Jim Teresco
//

// update a chunk of pseudocode with an id based on given visualsettings
// now also managing execution counts
function highlightPseudocode(id, vs) {

    let codeChunk = document.getElementById(id);
    if (codeChunk != null) {
        codeChunk.style.backgroundColor = vs.color;
        codeChunk.style.color = vs.textColor;
        hdxAV.previousHighlight = id;

        // execution counting
        if (id in hdxAV.execCounts) {
            hdxAV.execCounts[id]++;
        }
        else {
            hdxAV.execCounts[id] = 1;
        }

        // if we have a new largest count, we'll recolor
        if (hdxAV.execCounts[id] > hdxAV.maxExecCount) {
            hdxAV.maxExecCount = hdxAV.execCounts[id];
            hdxAV.execCountRecolor = true;
        }

	if (hdxAV.execCounts[id] == 1) {
            codeChunk.setAttribute("custom-title", "1 execution");
	}
	else {
            codeChunk.setAttribute("custom-title",
				   hdxAV.execCounts[id] + " executions");
	}
    }
}

// unhighlight previously-highlighted pseudocode
function unhighlightPseudocode() {

    if (hdxAV.previousHighlight != null) {
        let codeChunk = document.getElementById(hdxAV.previousHighlight);
        if (codeChunk != null) {
            codeChunk.style.backgroundColor =
                hdxAV.execCountColor(hdxAV.execCounts[hdxAV.previousHighlight]);
            // above was: visualSettings.pseudocodeDefault.color;
            codeChunk.style.color = visualSettings.pseudocodeDefault.textColor;
            hdxAV.previousHighlight = null;
        }
    }
    // did we trigger a recolor?  if so, recolor all
    if (hdxAV.execCountRecolor) {
        hdxAV.execCountRecolor = false;
        for (let key in hdxAV.execCounts) {
            let codeChunk = document.getElementById(key);
            codeChunk.style.backgroundColor =
                hdxAV.execCountColor(hdxAV.execCounts[key]);
        }
    }
}

// function to help build the table of pseudocode for highlighting
// indent: number of indentation levels
// code: line or array of code lines to place in block
// id: DOM id to give the enclosing td element
function pcEntry(indent, code, id) {

    let entry;
    if (id != "") {
        entry = '<tr class="codeRow" custom-title="0 executions"><td id="' + id + '">';
    }
    else {
        entry = '<tr class="codeRow"><td>';
    }
    if (Array.isArray(code)) {
        for (let i = 0; i < code.length; i++) {
            for (let j = 0; j < indent; j++) {
                entry += "&nbsp;&nbsp;";
            }
            entry += code[i] + "<br />";
        }
    }
    else {
        for (let i = 0; i < indent; i++) {
            entry += "&nbsp;&nbsp;";
        }
        entry += code;
    }
    entry += '</td></tr>';    
    return entry;
}

// Adds a click event to all rows with the codeRow class. This is used
// obtain the ID of the correct row to assign it to the
// currentBreakpoint variable

function addStop() {

    let elements = document.getElementsByClassName("codeRow");
    for (let element = 0; element < elements.length; element++) {
        let child = elements[element].childNodes[0];
        //child.setAttribute("variableValue", setInnerHTML(child.getAttribute("id")));
	// this listener sets and displays breakpoints when selected, and
	// displays conditional breakpoint info for actions that
	// support them
        elements[element].addEventListener("click", function (event) {
	    
            let target = event.target;
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
		
                //labelInnerHTML(target.getAttribute("variableValue"));
                codeRowHighlight();
                breakpointHighlight();
                //checkInnerHTML();
            }
        }, false);
    }
}

// clear the conditional breakpoint controls
function breakpointClearCBPControls() {

    document.getElementById("breakpointText").innerHTML = "";
    document.getElementById("breakpointVariableSelector").style.display = "none";
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
    let html = "";
    for (control of controls) {
	// default control id unless one was specified
	let controlid = "HDXCBPControl";
	if (control.selector.hasOwnProperty("id")) {
	    controlid = control.selector.id;
	}

	// build the HTML for this one
	switch (control.selector.type) {
	case hdxCBPSelectors.VERTEX:
	    html += buildCBPWaypointSelector(controlid, control.selector.label);
	    break;
	default:
	    console.log("UNHANDLED CBP SELECTOR TYPE!");
	}
    }

    // add the constructed HTML to the right element
    document.getElementById("breakpointText").innerHTML = html;
    document.getElementById("breakpointVariableSelector").style.display = "block";
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

	let element = document.getElementById(controlid);
	
	switch (control.selector.type) {
	case hdxCBPSelectors.VERTEX:
	    let rawval = element.value;
	    if (!isNaN(rawval) &&
		control.f(hdxAV.currentAV, parseFloat(rawval))) {
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
    
    let element = document.getElementById(hdxAV.currentBreakpoint);
    if (element != null) {
        element.style.borderStyle = "dashed";
        element.style.borderColor = "Red";
        element.style.borderWidth = "2px";
    }
}

// Change the border back to a normal codeRow
function codeRowHighlight() {

    if (hdxAV.previousBreakpoint == "") return;
    
    let element = document.getElementById(hdxAV.previousBreakpoint);
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

// JS implementation to create the html for the selector. This allows for
// the html to be dynamically created after the avPanel is shown.
function createVariableSelector() {
    
    let divBreakpoint = document.createElement("div");
    let divBreakpoint1 = document.createElement("div");
    let bp = document.createElement("span");
    bp.innerHTML = "Breakpoint: ";
    let cbp = document.createElement("select");
    cbp.setAttribute("id", "cbp");
    let opton = document.createElement("option");
    opton.value = "on";
    opton.innerHTML = "Conditional";
    opton.selected = true;
    let optoff = document.createElement("option");
    optoff.value = "off";
    optoff.innerHTML = "Unconditional";
    cbp.appendChild(opton);
    cbp.appendChild(optoff);
    cbp.onchange = function() {
	hdxAV.useConditionalBreakpoint =
	    document.getElementById("cbp").value == "on";
	if (hdxAV.useConditionalBreakpoint) {
	    document.getElementById("breakpointText").style.display = "block";
	}
	else {
	    document.getElementById("breakpointText").style.display = "none";
	}
	    
    };
	
    let breakpointID = document.createAttribute("id");
    let breakpoint1ID = document.createAttribute("id");
    
    breakpointID.value = "breakpointVariableSelector";
    breakpoint1ID.value = "breakpointText";
    
    divBreakpoint.setAttributeNode(breakpointID);
    divBreakpoint1.setAttributeNode(breakpoint1ID);
    
    let breakpointClass = document.createAttribute("class");
    breakpointClass.value = "border border-primary rounded";
    divBreakpoint.setAttributeNode(breakpointClass);
    
    // This is where the variable selector goes
    divBreakpoint1.innerHTML = "Replace with selector controls";
    
    // append the smaller divs to the bigger one
    divBreakpoint.appendChild(bp);
    divBreakpoint.appendChild(cbp);
    divBreakpoint.appendChild(divBreakpoint1);
    
    // Set the main div under the pseudocode
    let pcPanel = document.getElementById("pseudo");
    pcPanel.appendChild(divBreakpoint);
    // Set the default position, add click on/window resize events and hide it
    setDefaultVariableSelectorLocation();
    divBreakpoint.style.display = "none";    
    hdxAV.useConditionalBreakpoint = true;
}

// Sets the popout back to where it should be. Used to avoid 
// issues when resizing and turning it off via breakpoint selector
function setDefaultVariableSelectorLocation() {
    
    let avPanel = document.getElementById("avStatusPanel");
    let rect2 = avPanel.getBoundingClientRect();
    // avCP right side - left side
    let difference2 = rect2.right-rect2.left;
    let element = document.getElementById("breakpointVariableSelector");
    let rect = element.getBoundingClientRect();
    // variableSelector right side - left side
    let difference = rect.right - rect.left;
    // Width of the CP - the width of the selector + 25 offset to get
    // it to stick out
    let trueDifference = difference2 - difference + 25;
    element.style.left = trueDifference + "px";
    hdxAV.breakpointVariableHidden = true;
}

function deleteVariableSelector() {
    
    let element = document.getElementById("breakpointVariableSelector");
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

// returns a string of i non breaking spaces
function pcIndent(i) {
    let s = '';
    for (let k = 0; k < i; k++) {
        s += '&nbsp;';
    }
    return s;
}
