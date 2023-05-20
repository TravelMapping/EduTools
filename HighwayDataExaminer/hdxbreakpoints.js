//
// HDX Functions related to breakpoints
//
// METAL Project
//
// Original Author: Tyler Gorman, Modified/redesigned by Jim Teresco
//

// types of conditional breakpoints supported
var hdxCBPTypes = {

    VARIABLE: 1,
    CONDITION: 2
};

// types of conditional breakpoint value selectors supported
var hdxCBPSelectors = {

    VERTEX: 1,
    EDGE: 2,
    INTEGER: 3,
    FLOAT: 4,
    STRING: 5
};

// Inserts innerHTML of code lines for conditionals
function HDXCommonConditionalBreakpoints(name) {
    
    let html = "No innerHTML"
    switch (name) {
        case "vtestforLoopTop":
        case "v2forLoopTop":
        case "v1forLoopTop":
        case "forLoopTop":
        //case "topForLoop":
        html = buildWaypointSelector2("generic2", "Stop at vertex #", 0);
        return html;
    }
    return html;
}

// Used with each algorithms method to check if a method
// has a conditional
function HDXHasCommonConditionalBreakpoints(name) {
    
    switch (name) {
    case "vtestforLoopTop":
    case "v2forLoopTop":
    case "v1forLoopTop":
    case "forLoopTop":
    //case "topForLoop":
        return true;
    }
    return false;
}
