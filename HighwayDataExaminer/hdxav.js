//
// HDX General Algorithm Visualization Support
//
// METAL Project
//
// Primary Author: Jim Teresco
//

// group of variables used by many or all algorithm visualizations
var hdxAV = {
    // Name of the current execution speed
    speedName: "Fast",
    
    // Have we encountered a breakpoint at which we must stop in nextStep?
    stopAtBreakpoint: false,
    
    // current state of HDX
    status: hdxStates.NO_DATA,
    
    //Global variable for what methods have conditonals
    hasAConditional: [],

    // when in a step-by-step mode, delay (in ms) between visualization steps
    // default delay 75 should match the selected option in the speedChanger
    // and delay should be used for the amount of time in the future to use
    // for setTimeout calls
    delay: 75,

    // when in a run mode (indicated by delay < -1), the amount of time
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
    useConditionalBreakpoint: false,  // conditional breakpoint selected?
    
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

    // is data loaded but no AV selected or running?
    dataOnly() {
	return this.status == hdxStates.GRAPH_LOADED ||
	    this.status == hdxStates.WPT_LOADED ||
	    this.status == hdxStates.NMP_LOADED ||
	    this.status == hdxStates.WPL_LOADED ||
	    this.status == hdxStates.PTH_LOADED;
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
        this.avList.push(hdxVertexPairsAV);
        this.avList.push(hdxBFConvexHullAV);
        this.avList.push(hdxAPClosestPointAV);
        this.avList.push(hdxClosestPairsRecAV);
        this.avList.push(hdxQuadtreeAV);
        this.avList.push(hdxOrderingAV);
        this.avList.push(hdxBFTravelingSalesmanAV);
        this.avList.push(hdxTwiceAroundTreeAV);
        this.avList.push(hdxPartitionerAV);
        this.avList.push(hdxComputePartStats);
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
        this.avList.push(hdxTarjanAV);
        this.avList.push(hdxWPGraphColoringAV);
        
        // populate the algorithm selection select with options
        // from the avList
        let s = document.getElementById("AlgorithmSelection");
        s.innerHTML = "";
	let nextGroup = 0;
        for (let i = 0; i < this.avList.length; i++) {
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
        if (hdxAV.stopAtBreakpoint) {
            hdxAV.setStatus(hdxStates.AV_PAUSED);
            hdxAV.startPause.innerHTML = "Resume";
            hdxAV.stopAtBreakpoint = false;
            return;
        }
	
        // if the simulation is paused, we can do nothing, as this function
        // will be called again when we restart
        if (hdxAV.paused()) {
            return;
        }
	
        // run mode
        if (hdxAV.delay == 0) {
	    let startTime = Date.now();
            while (hdxAV.nextAction != "DONE" && !hdxAV.stopAtBreakpoint) {
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
            if (hdxAV.stopAtBreakpoint) {
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
        for (let i = 0; i < thisAV.avActions.length; i++) {
            if (hdxAV.nextAction == thisAV.avActions[i].label) {
                currentAction = thisAV.avActions[i];
                break;
            }
        }
        if (currentAction == null) {
            alert("HDX Internal error: bad AV action: " + hdxAV.nextAction);
            hdxAV.setStatus(hdxStates.AV_PAUSED);
        }

	// save the idOfAction in case we're in a case where it might
	// change with the execution of the action
	let idOfCurrentAction = thisAV.idOfAction(currentAction);

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
        hdxAV.algStat.innerHTML = ans;
        if (hdxAV.delay != 0) {
            HDXAddCustomTitles();
        }

        // finally check if a breakpoint should pause execution following
	// the just-completed action
	hdxAV.stopAtBreakpoint = false;
        if (idOfCurrentAction == hdxAV.currentBreakpoint) {

	    // does this action have a conditional breakpoint associated and
	    // is the conditional breakpoint option selected?
	    if (currentAction.hasOwnProperty("cbp") &&
		hdxAV.useConditionalBreakpoint) {

		hdxAV.stopAtBreakpoint = breakpointCheckMatch(currentAction.cbp);
	    }
	    else {
		// it's an unconditional breakpoint
		hdxAV.stopAtBreakpoint = true;
	    }
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
    }
};
