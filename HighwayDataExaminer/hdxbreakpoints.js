//
// HDX Functions related to breakpoints
//
// METAL Project
//
// Primary Author: Tyler Gorman, Modified by Jim Teresco
//

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
