//
// HDX General Algorithm Visualization Support
//
// METAL Project
//
// Primary Author: Jim Teresco
//

// group of variables used by many or all algorithm visualizations
var hdxAV = {
    //Used to get the name of the current speed
    speedName: "Fast",
    
    //Used to determine if it should jump to breakpoint
    //(pause)
    jumpToBreakpoint: false,
    
    // current state of HDX
    status: hdxStates.NO_DATA,
    
    //Global variable for what methods have conditonals
    hasAConditional: [],

    // when in a step-by-step mode, delay (in ms) between visualization steps
    // default delay 75 should match the selected option in the speedChanger
    // and delay should be used for the amount of time in the future to use
    // for setTimeout calls
    delay: 75,

    // when in a run mode (indicated by delay == 0), the amount of time
    // between screen updates, will be set by speedChanged if such a mode
    // is chosen
    updateTime: 0,

    // list of available AVs
    avList: [],
    
    // remember the currently-selected AV
    currentAV: null,
    
    // are we tracing at the action level rather than the iteration level
    traceActions: true,

    // track the end of an iteration defined by a series of actions
    iterationDone: false,

    // next action to be executed, must refer to labels in the current
    // AV's avActions array, set to the first before initial call
    // to nextStep, and each algorithm must set to "DONE" to
    // terminate
    nextAction: "UNDEFINED",
    
    // for pseudocode highlighting, id of element to unhighlight
    previousHighlight: null,

    // for counting pseudocode executions
    execCounts: [],
    maxExecCount: 0,
    execCountsRecolor: false,
    
    // some commonly-used document elements
    algStat: null,
    algOptions: null,
    startPause: null,

    // log message history for mouse-over of current log message in
    // the AV status panel
    logMessageArr: [],

    // used in hdxpseudocode for breakpoint functionality
    currentBreakpoint: "",
    previousBreakpoint: "",
    useVariableForBreakpoint: false,  // checkbox checked?
    breakpointVariableHidden: true,   // showing selector for conditional break?
    
    // set the status and do any needed cleanup for that change
    setStatus(newStatus) {
        
        if (this.status == newStatus) {
            return;
        }

        this.status = newStatus;
        switch (newStatus) {
        case hdxStates.GRAPH_LOADED:
        case hdxStates.WPT_LOADED:
        case hdxStates.PTH_LOADED:
        case hdxStates.NMP_LOADED:
        case hdxStates.WPL_LOADED:
            this.algStat.innerHTML = "";
            this.algOptions.innerHTML = "";
            break;

        case hdxStates.AV_COMPLETE:
            this.startPause.disabled = true;
            this.startPause.innerHTML = "Start";
            break;
        default:
            // other AV in progress states
            this.startPause.disabled = false;
            break;
        }
        //this is after the list of pseudo-code populates on screen with
        //the start button
    },
    
    // are we paused or otherwise not running?
    paused() {
        return this.status != hdxStates.AV_RUNNING;
    },

    // all setup that needs to happen on page load for HDX
    initOnLoad() {

	// group headers and starting positions
	let groupStarts = [];
	
        // populate the list of algorithms -- add new entries here, be sure
	// they end up under the correct category
        this.avList.push(hdxNoAV);
	groupStarts.push({
	    first: this.avList.length,
	    text: "Vertex-Only Algorithms"
	});
        this.avList.push(hdxVertexExtremesSearchAV);
        this.avList.push(hdxExtremePairsAV);
        this.avList.push(hdxBFConvexHullAV);
        this.avList.push(hdxClosestPairsRecAV);
        this.avList.push(hdxQuadtreeAV);
        this.avList.push(hdxOrderingAV);
	groupStarts.push({
	    first: this.avList.length,
	    text: "Edge-Only Algorithms"
	});
        this.avList.push(hdxEdgeExtremesSearchAV);
	groupStarts.push({
	    first: this.avList.length,
	    text: "Graph Algorithms"
	});
        this.avList.push(hdxDegreeAV);
        this.avList.push(hdxGraphTraversalsAV);
        this.avList.push(hdxDijkstraAV);
        this.avList.push(hdxPrimAV);
        this.avList.push(hdxKruskalAV);
        this.avList.push(hdxDFSRecAV);
        
        // populate the algorithm selection select with options
        // from the avList
        let s = document.getElementById("AlgorithmSelection");
        s.innerHTML = "";
	let nextGroup = 0;
        for (var i = 0; i < this.avList.length; i++) {
            let av = this.avList[i];
	    // start a new group?
	    if (nextGroup < groupStarts.length &&
		groupStarts[nextGroup].first == i) {
		if (nextGroup != 0) {
		    s.innerHTML += '</optgroup>';
		}
		s.innerHTML += '<optgroup label="' +
		    groupStarts[nextGroup].text + '">';
		nextGroup++;
	    }
            s.innerHTML += '<option value="' + av.value +
                '">' + av.name + '</option>';
        }
	s.innerHTML += '</optgroup>';

        // set up some references to commonly-used document elements

        // the algorithm status message bar on the algorithm
        // visualization information panel
        this.algStat = document.getElementById("algorithmStatus");

        this.algOptions = document.getElementById("algorithmOptions");
        this.startPause = document.getElementById("startPauseButton");

        // register the HDX-specific event handler for waypoint clicks
        registerMarkerClickListener(labelClickHDX);
    },

    // this will do an action, an iteration, or run to completion
    // for the AV passed in
    nextStep(thisAV) {

        // If we have reached a breakpoint with its conditions met, pause the
	// AV then return, so we are still on the current action and don't run
	// an extra action
        if (hdxAV.jumpToBreakpoint) {
            hdxAV.setStatus(hdxStates.AV_PAUSED);
            hdxAV.startPause.innerHTML = "Resume";
            hdxAV.jumpToBreakpoint = false;
            startPausePressed();
            return;
        }
	
        // if the simulation is paused, we can do nothing, as this function
        // will be called again when we restart
        if (hdxAV.paused()) {
            return;
        }
	
        // run mode (was: run to completion and jump to breakpoint)
        if (hdxAV.delay == 0) {
	    let startTime = Date.now();
            while (hdxAV.nextAction != "DONE" && !hdxAV.jumpToBreakpoint) {
		// After hdxAV.updateTime ms have passed, yield so the UI can
		// refresh and button presses can be processed, allowing
		// feedback to the user that progress is being made
		// and very importantly allowing the Pause button to
		// work during run modes
		if (Date.now() - startTime > hdxAV.updateTime) {
		    setTimeout(function() { hdxAV.nextStep(thisAV) }, 0);
		    return;
		}
                hdxAV.oneIteration(thisAV);
            }
	    // AV completely done?
	    if (hdxAV.nextAction == "DONE") {
		hdxAV.avDone();
	    }
            return;
        }

        // if delay has become -1, it means we took a single step and
        // should pause now rather than perform more work
        if (hdxAV.delay == -1) {
            hdxAV.setStatus(hdxStates.AV_PAUSED);
        }

        // we are supposed to do some work, either a single action or
        // a full iteration
        if (hdxAV.traceActions) {
            hdxAV.oneAction(thisAV);
        }
        else {
            //console.log("nextStep() calling oneIteration()");
            hdxAV.oneIteration(thisAV);
        }

        // in either case, we now set the timeout for the next one
        if (hdxAV.nextAction != "DONE") {
            //console.log("nextStep(): setting callback for " + hdxAV.delay);
            setTimeout(function() { hdxAV.nextStep(thisAV) }, hdxAV.delay);
        }
        else {
            hdxAV.avDone();
        }
    },

    // one iteration is defined as a series of actions ending with
    // one which sets hdxAV.iterationDone to true
    oneIteration(thisAV) {

        //console.log("oneIteration()");
        hdxAV.iterationDone = false;
        while (!hdxAV.iterationDone) {
            //console.log("oneIteration() calling oneAction(), nextAction=" + this.nextAction);
            if (hdxAV.jumpToBreakpoint) {
                hdxAV.iterationDone = true;
                return;
            }
            hdxAV.oneAction(thisAV);
        }
    },

    // do one action of thisAV's array of actions
    oneAction(thisAV) {
        // look up the action to execute next
        let currentAction = null;
        for (var i = 0; i < thisAV.avActions.length; i++) {
            if (hdxAV.nextAction == thisAV.avActions[i].label) {
                currentAction = thisAV.avActions[i];
                break;
            }
        }
        if (currentAction == null) {
            alert("HDX Internal error: bad AV action: " + hdxAV.nextAction);
            hdxAV.setStatus(hdxStates.AV_PAUSED);
        }

        // we have an action to execute
        
        // if the action is the current breakpoint, pause then, if
        // useVariableForBreakpoint = true compare the special break
        // instance to determine if you have to pause else just pause
        if (thisAV.idOfAction(currentAction) == hdxAV.currentBreakpoint) {
            // If more than one element is chosen, put them 
            // into an array - chosenPoints
            let chosenPoints; 
            let methodPicker = [];
            if (hdxAV.useVariableForBreakpoint) {
                let variable = "";
                let counter = 0;
                let length = document.getElementsByName("quantity").length;
                
                // Run through the elements with name quantity
                // If anything does have that, take its value
                // and seperate them with a space
                while (counter <= length) {
                    try {
                        if (variable == "") {
                            variable = document.getElementsByName("quantity")[counter].value;
                            // If it has an ID, push it onto the
                            // stack. Used for the method
                            // currentVariable to determine what to
                            // send back
                            if (document.getElementsByName("quantity")[counter].hasAttribute("id")) {
                                methodPicker.push(document.getElementsByName("quantity")[counter].id);
                            }  
                            counter++;
                        }
                        else {
                            variable += " " + document.getElementsByName("quantity")[counter].value;
                            if (document.getElementsByName("quantity")[counter].hasAttribute("id")) {
                                methodPicker.push(document.getElementsByName("quantity")[counter].id);
                            }
                            counter++;
                        }
                    }
                    // null value means to still continue, just add on
                    // to the counter, don't take that value
                    catch (error) {
                        counter++;
                    }
                }

                // If the value of your variable is null, set it to
                // -1, essentially ignoring it. If it doesn't include a
                // space, parse it as an Int(only if it has a number).
                // If it does include a space, any on the end should
                // be thrown away and now split the string by spaces
                if (variable == "") {
                    variable = -1;
                }
                else {
                    if (!variable.includes(" ")) {
                        let isThere2 = variable.search(/\d/);
                        variable = (isThere2 != -1) ? parseInt(variable) : variable;
                    }
                    else {
                        if (variable.substr(variable.length-1) == " ") {
                            variable = variable.substr(0,variable.length-1);
                        }
                        chosenPoints = variable.split(" ");
                    }
                }
		
                // Checks if the set variable has been met if the
                // array is null, just the variable, that is parsed,
                // else run through the entire array and parse any
                // numbers.  Use all of the indexs as values

		// ALL NUMBERS ARE PARSED CORRECTLY BEFORE GOING INTO
		// determineBreakOrContinue
                if (chosenPoints == null) {
                    hdxAV.determineBreakOrContinue(
			variable,
			currentAction.currentVariable(thisAV,
						      methodPicker.shift())
		    );
                }
                else {
                    for (let temp of chosenPoints) {
                        let temp2 = temp;
                        let isThere = temp2.search(/\d/);
                        temp2 = (isThere != -1) ? parseInt(temp2) : temp2;
                        hdxAV.determineBreakOrContinue(
			    temp2,
			    currentAction.currentVariable(thisAV,
							  methodPicker.shift())
			);
                    }
                }
            }
            else {
                hdxAV.setStatus(hdxStates.AV_PAUSED);
                hdxAV.startPause.innerHTML = "Resume";
		hdxAV.jumpToBreakpoint = true;
            }
        }
                
        // undo any previous highlighting
        unhighlightPseudocode();
        //console.log("ACTION: " + hdxAV.nextAction);
        
        // execute the JS to continue the AV
        currentAction.code(thisAV);

        // update status to this line of code's logMessage, after
        // code executes so any simulation variables updated through
        // this step can be reflected in the update
        // this also creates a past log message that appears when you
        // hover over the current action, this shows the last 5 messages
        //hdxAV.algStat.innerHTML = currentAction.logMessage(thisAV);

        hdxAV.logMessageArr.push(currentAction.logMessage(thisAV));
        if (hdxAV.logMessageArr.length == 8) {
             hdxAV.logMessageArr.splice(0, 1);
        }
        ans = '<span custom-title="Past Logs -  ';
        for (let j = 2; j <7; j++) {
            if (hdxAV.logMessageArr.length > j) {
                ans += '<br>' + (j-1) + "&nbsp;-&nbsp;" +
		    hdxAV.logMessageArr[hdxAV.logMessageArr.length-j];
            }
        }    
        ans += '">' + hdxAV.logMessageArr[hdxAV.logMessageArr.length-1] +
	    '</span>';
        hdxAV.algStat.innerHTML =  ans;
        if (hdxAV.delay != 0) {
            HDXAddCustomTitles();
        }
        
        //console.log("ACTION DONE: " + currentAction.logMessage(thisAV));
    },

    // housekeeping to do when an algorithm is complete
    avDone() {
        // if pseudocode is displayed, undisplay at the end to ensure
        // better visibility for results
        document.getElementById("pseudoCheckbox").checked = false;
        document.getElementById("pseudoText").style.display = "none";
        document.getElementById("pscode").style.display = "none";
        document.getElementById("pseudo").parentNode.style.display = "none";
            
        hdxAV.setStatus(hdxStates.AV_COMPLETE);
        HDXAddCustomTitles();
        cleanupBreakpoints();
            
    },
    
    // compute a color code to highlight based on code execution frequency
    // light blue is infrequent, pink is frequent
    execCountColor(count) {
        let rank = 75 * count/hdxAV.maxExecCount;
        let r = 180 + rank;
        let b = 255 - rank;
        return "rgb(" + r + ",210, " + b + ")";
    },
    
    // This is what determines whether a conditional breakpoint
    // has been met or not. If so, break. This will manipulate strings
    // aka multiple things to be checked against our own variable(s)
    determineBreakOrContinue(selectedStop, currentPoints) {
        let checker;//current values
        let selection;//your selected value
        let howToDeal = "Number";
        hdxAV.jumpToBreakpoint = false;
        //Obtain either a direct relation, or an array of the string deliminated by 
        //a space
        if ((currentPoints.constructor === String) &&
	    (selectedStop.constructor === String)) {
            selection = selectedStop;
            checker = currentPoints.split(" ");
            howToDeal = "String";
        }
        else if ((currentPoints.constructor === Number)
		 && (selectedStop.constructor === Number)) {
            selection = selectedStop;
            checker = currentPoints;
            howToDeal = "Number";
        }
        else if ((currentPoints.constructor === String) &&
		 (selectedStop.constructor === Number)) {
            selection = selectedStop;
            checker = currentPoints.split(' ');
            howToDeal = "StringNumber";
        }
        else if ((currentPoints.constructor === Number) &&
		 (selectedStop.constructor === String)) {
            selection = selectedStop.split(' ');
            checker = currentPoints;
            howToDeal = "NumberString";    
        }
        else if ((currentPoints.constructor === Boolean) &&
		 (selectedStop.constructor === Boolean)) {
            selection = selectedStop;
            checker = currentPoints;
            howToDeal = "Boolean";
        }
        else if ((currentPoints.constructor === Boolean) &&
		 (selectedStop.constructor === String)) {
            //Yours is a string
            //Actual is a boolean
            selection = selectedStop;
            checker = currentPoints.toString();
            howToDeal = "BooleanString";
        }
        else if ((currentPoints.constructor === String) &&
		 (selectedStop.constructor === Boolean)) {
            selection = selectedStop.toString();
            checker = currentPoints; 
            howToDeal = "StringBoolean";
        }
        else{
            console.log("Problem with currentPoints native type!");      
        }
        
        //Below will compare the selected value vs. the current ones
        //Both are strings
        if (howToDeal == "String") {
            try {
                for (let element of checker) {
                    if (selection == element) {
                        hdxAV.setStatus(hdxStates.AV_PAUSED);
                        hdxAV.startPause.innerHTML = "Resume";
                        if (hdxAV.speedName == "Jump To Breakpoint") {
                            hdxAV.jumpToBreakpoint = true;
                        }
                    }
                }
            }
            catch (error) {
                console.log("useVariableForBreakpoint has encountered errors parsing breakpointText howToDeal=NumberString ");
            }
        }
        // Both are numbers
        else if (howToDeal == "Number") {
            try {
                if (selection == checker) {
                    hdxAV.setStatus(hdxStates.AV_PAUSED);
                    hdxAV.startPause.innerHTML = "Resume";
                    if (hdxAV.speedName == "Jump To Breakpoint") {
                        hdxAV.jumpToBreakpoint = true;
                    }
                }
            }
            catch (error) {
                console.log("useVariableForBreakpoint has encountered errors parsing breakpointText - innerHTML - " +
			    "howToDeal=Number ");
            }
        }
        // This is when your values are a string, and the checked is a number
        else if (howToDeal == "NumberString") {
            try {
                for (let element of selection) {
                    if (checker == parseInt(element)) {
                        hdxAV.setStatus(hdxStates.AV_PAUSED);
                        hdxAV.startPause.innerHTML = "Resume";
                        if (hdxAV.speedName == "Jump To Breakpoint") {
                            hdxAV.jumpToBreakpoint = true;
                        }
                    }
                }
            }
            catch (error) {
                console.log("useVariableForBreakpoint has encountered errors parsing breakpointText howToDeal=StringNumber ");
            }
        }
        // This is when your values is a number, and the checked is a String
        else if (howToDeal == "StringNumber") {
            try {
                for (let element of checker) {
                    if (selection == parseInt(element)) {
                        hdxAV.setStatus(hdxStates.AV_PAUSED);
                        hdxAV.startPause.innerHTML = "Resume";
                        if (hdxAV.speedName == "Jump To Breakpoint") {
                            hdxAV.jumpToBreakpoint = true;
                        }
                    }
                }
            }
            catch (error) {
                console.log("useVariableForBreakpoint has encountered errors parsing breakpointText howToDeal=NumberString");
            }
        }
        // Manipulates boolean and string data
        else if (howToDeal == "Boolean" ||
		 howToDeal == "BooleanString" ||
		 howToDeal == "StringBoolean") {
            try {
                if (selection === checker) {
                    hdxAV.setStatus(hdxStates.AV_PAUSED);
                    hdxAV.startPause.innerHTML = "Resume";
                    if (hdxAV.speedName == "Jump To Breakpoint") {
                        hdxAV.jumpToBreakpoint = true;
                    }
                }
            }
            catch (error) {
                console.log("useVariableForBreakpoint has encountered errors parsing breakpointText - innerHTML - " +
			    "howToDeal=Boolean ");
            }
        }
        else {
            console.log("Something went wrong with currentPoints checking!");
        }
    }
};
