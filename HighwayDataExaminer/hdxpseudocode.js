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

        codeChunk.setAttribute("custom-title",
			       hdxAV.execCounts[id] + " executions"); 
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
    if (entry != "") {
        entry = '<tr class="codeRow"><td id="' + id + '">';
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
        child.setAttribute("variableValue", setInnerHTML(child.getAttribute("id")));
        elements[element].addEventListener("click", function (event) {

            let target = event.target;
            hdxAV.previousBreakpoint = hdxAV.currentBreakpoint;
            hdxAV.currentBreakpoint = target.getAttribute("id");
	    
            //if the previous and current breakpoints are the same,
            //unselect it, and change the colors back Else, deselect
            //the previous, and highlight current
            if (hdxAV.previousBreakpoint == hdxAV.currentBreakpoint) {
                codeRowHighlight();
                hdxAV.previousBreakpoint = "";
                hdxAV.currentBreakpoint = "";
                breakpointCheckerDisplay();
                hdxAV.useVariableForBreakpoint = false;
                //document.getElementById("useBreakpointVariable").checked = false;
            }
            else {
                hdxAV.useVariableForBreakpoint = true;
                //if (document.getElementById("breakpointText").innerHTML != "No innerHTML")
                
                hdxAV.setStatus(hdxStates.AV_PAUSED);
                if (hdxAV.delay == -1) {
                    hdxAV.startPause.innerHTML = "Next Step";
                }
                else {
                    hdxAV.startPause.innerHTML = "Resume";
                }
                
                labelInnerHTML(target.getAttribute("variableValue"));
                codeRowHighlight();
                breakpointHighlight();
                breakpointCheckerDisplay();
                checkInnerHTML();
            }
        }, false);
    }
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

//Enables the clickable function and window resize change for the selector
function showHideBreakpointVariableSelector() {

    /*let element = document.getElementById("showBreakpointVariable");
    element.addEventListener("click", function(event) {
        let target = event.target;
        let avPanel = document.getElementById("avStatusPanel");
        let parentContainer = target.parentElement;
        let rect = parentContainer.getBoundingClientRect();
        let rect2 = avPanel.getBoundingClientRect();
        
        if (hdxAV.breakpointVariableHidden) {
            parentContainer.style.left = rect2.right + "px";
            hdxAV.breakpointVariableHidden = false;
        }
        else {
            setDefaultVariableSelectorLocation();
            hdxAV.breakpointVariableHidden = true;
        }
    }, false);
    window.addEventListener("resize", setDefaultVariableSelectorLocation, false);*/
}

// JS implementation to create the html for the selector. This allows for
// the html to be dynamically created after the avPanel is shown.
function createVariableSelector() {
    
    let divBreakpoint = document.createElement("div");
    let divBreakpoint1 = document.createElement("div");
    let cbp = document.createElement("p");
    cbp.innerHTML = "Conditional Breakpoint";
    cbp.setAttribute("id", "cbp");
    //let divBreakpoint2 = document.createElement("div");
    /*let checkbox = document.createElement("input");
    
    checkbox.type = "checkbox";
    checkbox.id = "useBreakpointVariable";
    checkbox.onclick = function() {
	hdxAV.useVariableForBreakpoint = !hdxAV.useVariableForBreakpoint;
    }
    checkbox.style.backgroundColor = "Red";*/
    
    let breakpointID = document.createAttribute("id");
    let breakpoint1ID = document.createAttribute("id");
    //let breakpoint2ID = document.createAttribute("id");
    
    breakpointID.value = "breakpointVariableSelector";
    breakpoint1ID.value = "breakpointText";
    //breakpoint2ID.value = "showBreakpointVariable";
    
    divBreakpoint.setAttributeNode(breakpointID);
    divBreakpoint1.setAttributeNode(breakpoint1ID);
    //divBreakpoint2.setAttributeNode(breakpoint2ID);
    
    let breakpointClass = document.createAttribute("class");
    breakpointClass.value = "border border-primary rounded";
    divBreakpoint.setAttributeNode(breakpointClass);
    
    // This is where the variable selector goes
    divBreakpoint1.innerHTML = "This is where the innerHTML goes";
    //divBreakpoint2.innerHTML = "-->";
    //divBreakpoint2.style.backgroundColor = "Red";
    
    // append the smaller divs to the bigger one
    //divBreakpoint.appendChild(checkbox);
    divBreakpoint.appendChild(cbp);
    divBreakpoint.appendChild(divBreakpoint1);
    //divBreakpoint.appendChild(divBreakpoint2);
    
    // Set the main div under the document body
    let pcPanel = document.getElementById("pseudo");
    pcPanel.appendChild(divBreakpoint);
    // Set the default position, add click on/window resize events and hide it
    setDefaultVariableSelectorLocation();
    showHideBreakpointVariableSelector();
    divBreakpoint.style.display = "none";    
    hdxAV.useVariableForBreakpoint = true;
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

// Based on if a breakpoint is selected or not, display or hide the element.
// Also reset the posiiton.
function breakpointCheckerDisplay() {
    
    let element = document.getElementById("breakpointVariableSelector");
    //let checkbox = document.getElementById("useBreakpointVariable");
    if (hdxAV.currentBreakpoint == "") {
        element.style.display = "none";
        //checkbox.checked = false;
        //checkbox.style.display = "none";
    }
    else {
        element.style.display = "block";
        //checkbox.checked = false;
        //checkbox.style.display = "none";
    }
    setDefaultVariableSelectorLocation();
}

// Sets the innerHTML of the div tag w/ ID: breakpointText to the
// passed variable
function labelInnerHTML(text) {

    let element = document.getElementById("breakpointText");
    element.innerHTML = text;
    //let checkbox = document.getElementById("useBreakpointVariable");
    if (hasInnerHTML(hdxAV.currentBreakpoint)) {
       // checkbox.style.display = "block";
    }
    else {
        //checkbox.style.display = "none";
       // checkbox.checked = false;
        hdxAV.useVariableForBreakpoint = false;
    }
}

// Used to hide the breakpointVariableSelector if
// it doesnt have innerHTML that is useful
function checkInnerHTML() {
    
    let element = document.getElementById("breakpointText").innerHTML;
    if (element == "No innerHTML") {
        document.getElementById("breakpointVariableSelector").style.display = "none";
    }
}

// sets the custom attribute variableValue of each codeRow class
// This is so they can be used for setting the inner html
function setInnerHTML(label) {

    return hdxAV.currentAV.setConditionalBreakpoints(label);
}

// Does a label have a setInnerHTML with a return other than "No innerHTML"
function hasInnerHTML(label) {

    return hdxAV.currentAV.hasConditionalBreakpoints(label);
}

function deleteVariableSelector() {
    
    let element = document.getElementById("breakpointVariableSelector");
    if (element != null) element.parentNode.removeChild(element);
    hdxAV.useVariableForBreakpoint = false;
}

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

//returns a string of non breaking spaces
//please don't pass a negative
function pcIndent(i){
    let s = '';
    for(let k = 0; k < i; k++){
        s +=  '&nbsp;';
    }
    return s;
}
