//
// HDX Callback Functions and various hide/show methods used by them
//
// METAL Project
//
// Primary Author: Jim Teresco
//

// speedChanger dropdown callback
function speedChanged() {

    var speedChanger = document.getElementById("speedChanger");
    let temp = speedChanger.options[speedChanger.selectedIndex];
    hdxAV.delay = temp.value;
    hdxAV.speedName = temp.innerHTML;

    // for run options, set update time, should match the values
    // set in the speedChanged when created in index.php
    if (hdxAV.delay == 0) {
	if (hdxAV.speedName == "1 Update/sec") {
	    hdxAV.updateTime = 1000;
	}
	else if (hdxAV.speedName == "15 Updates/sec") {
	    hdxAV.updateTime = 67;
	}
	else { //if (hdxAV.speedName == "60 Updates/sec")
	    hdxAV.updateTime = 17;
	}
    }
    // this will hide the log message when running on faster speeds
    // when it is going by too fast to see anyway
    if (hdxAV.delay > 0 && hdxAV.delay < 500) {
        document.getElementById("algorithmStatus").style.display = "none";
    }
    else {
        document.getElementById("algorithmStatus").style.display = "";
    }
}


// special HDX version of the label click event handler that is
// called by the general TM addMarker, as it is registered
// by the registerMarkerClickListener call in updateMap
function labelClickHDX(i) {

    // handle vertex control selection
    hdxVertexSelector.select(i);

    // standard map center/infowindow display

   //build HTML string for popup
    markers[i].bindPopup('<p style="line-height:160%;"><span style="font-size:24pt;color:black;">' + waypoints[i].label + '</span><br><b>Waypoint ' + i + '<\/b><br><b><a target="_blank" href="http://www.openstreetmap.org/?lat='+waypoints[i].lat+'&lon='+waypoints[i].lon+'">Coords.:<\a><\/b> ' +
 waypoints[i].lat + '&deg;, ' + waypoints[i].lon + '&deg;<\/p><div id="intersections' + i + '"><\/div>');

    map.panTo([waypoints[i].lat, waypoints[i].lon]);

    markers[i].openPopup();
}


// get the selected algorithm from the AlgorithmSelection menu
// (factored out here to avoid repeated code)
function getSelectedAlgorithm() {

    var menuSelection = document.getElementById("AlgorithmSelection");
    var selectionIndex = menuSelection.selectedIndex;
    return menuSelection.options[selectionIndex].value;
}

// pseudocode display event handler
// function both sets the traceActions variable and shows/hides
// the actual code on the display as appropriate
function showHidePseudocode() {

    hdxAV.traceActions = document.getElementById("pseudoCheckbox").checked;
    document.getElementById("pseudoText").style.display =
        (hdxAV.traceActions ? "" : "none");
        document.getElementById("pscode").style.display =
        (hdxAV.traceActions ? "" : "none");

    document.getElementById("pseudo").parentNode.style.display =
        (hdxAV.traceActions ? "" : "none");
        document.getElementById("pscode").style.display =
        (hdxAV.traceActions ? "" : "none");
}

// generic event handler for start/pause/resume button
function startPausePressed() {
    
    switch (hdxAV.status) {

    case hdxStates.AV_SELECTED:
        // if we have selected but not yet started an algorithm,
        // this is a start button
        hdxAV.setStatus(hdxStates.AV_RUNNING);
        if (hdxAV.delay == -1) {
            hdxAV.startPause.innerHTML = "Next Step";
        }
        else {
            hdxAV.startPause.innerHTML = "Pause";
        }
        hdxAV.currentAV.prepToStart();
        // set pseudocode
        document.getElementById("pseudoText").innerHTML = hdxAV.currentAV.code;
        document.getElementById("pseudo").parentNode.style.display = "";
      

        // reset all execution counts
        hdxAV.execCounts = [];
        hdxAV.maxExecCount = 0;

        showHidePseudocode();
        showEntries();

        // get the simulation going, always start with the "START"
        // action, then do it
        hdxAV.nextAction = "START";
        hdxAV.nextStep(hdxAV.currentAV);
        addStop();
        resizePanels();
        hideEntries();
        newMapTileSelected();
        break;
        
    case hdxStates.AV_RUNNING:
        // if we are in a running algorithm, this is a pause button
        // the running algorithm will pause when its next
        // timer event fires    
        hdxAV.setStatus(hdxStates.AV_PAUSED);
        if (hdxAV.delay == -1) {
            hdxAV.startPause.innerHTML = "Next Step";
        }
        else {
            hdxAV.startPause.innerHTML = "Resume";
        }
        break;
        
    case hdxStates.AV_PAUSED:

        // depending on whether we're stepping or not, button
        // will need different labels
        if (hdxAV.delay == -1) {
            hdxAV.startPause.innerHTML = "Next Step";
        }
        else {
            hdxAV.startPause.innerHTML = "Pause";
        }

        // in all cases, we set status to running and perform the next step
        hdxAV.setStatus(hdxStates.AV_RUNNING);
        hdxAV.nextStep(hdxAV.currentAV);
        break;

    default:
        alert("startPausePressed, unexpected status=" + hdxAV.status);
    }
}

// cancel was pressed on the Load Data panel
function loadDataPanelCancelPressed() {

    hideLoadDataPanel();
    showTopControlPanel();

    // if we're paused or completed in an AV, also put the status panel back up
    if (hdxAV.status == hdxStates.AV_PAUSED ||
	hdxAV.status == hdxStates.AV_COMPLETE) {
	showAVStatusPanel();
    }
}

// Event handler for state change on the algorithm selection select control
function algorithmSelectionChanged() {

    // cleanup anything from the previous algorithm
    if (hdxAV.currentAV != null) {
        cleanupAVControlPanel();
        hdxAV.currentAV.cleanupUI();
    }
    
    let value = getSelectedAlgorithm();

    // set the current algorithm
    for (let i = 0; i < hdxAV.avList.length; i++) {
        if (value == hdxAV.avList[i].value) {
            hdxAV.currentAV = hdxAV.avList[i];
            break;
        }
    }

    document.getElementById("currentAlgorithm").innerHTML = hdxAV.currentAV.name;

    // call its function to set up its status and options
    hdxAV.currentAV.setupUI();
}

// event handler for the "Done" button on the algorithm options panel
function algOptionsDonePressed() {

    // TODO: make sure no additional validation is needed to make sure
    // good options are chosen before we allow this to be dismissed.

    if (hdxAV.currentAV == null) {
        hdxAV.currentAV = hdxNoAV;
    }
    
    // set status depending on whether an AV was selected
    if (hdxAV.currentAV.value == hdxNoAV.value) {
        hdxAV.setStatus(hdxStates.GRAPH_LOADED);
    }
    else {
        hdxAV.setStatus(hdxStates.AV_SELECTED);
	// set all waypoints and connections to undiscovered to start
        initWaypointsAndConnections(true, true,
            visualSettings.undiscovered);
        showAVStatusPanel();
    }

    hideAlgorithmSelectionPanel();
    showTopControlPanel();
}

// event handler for "Reset AV" button press
function resetPressed() {

    // go back to the "graph loaded" status
    hdxAV.setStatus(hdxStates.GRAPH_LOADED);

    hdxAV.startPause.innerHTML = "Start";

    // show waypoints, show connections
    initWaypointsAndConnections(true, true,
                              visualSettings.undiscovered);

    hideTopControlPanel();
    cleanupAVControlPanel();
    algorithmSelectionChanged();
    //hideAVStatusPanel();
    showAlgorithmSelectionPanel();
    document.getElementById("pscode").style.display = "none";
    deleteVariableSelector();
    newMapTileSelected();
}

// event handler for "Load Data Options" button
function loadDataOptionsPressed() {

    switch (hdxAV.status) {

    case hdxStates.AV_RUNNING:
        // if there's an AV running, we need to pause it
        hdxAV.setStatus(hdxStates.AV_PAUSED);
        hdxAV.startPause.innerHTML = "Start";
        // break intentionally omitted

    case hdxStates.AV_PAUSED:
    case hdxStates.AV_COMPLETE:
    case hdxStates.GRAPH_LOADED:
        // show waypoints, show connections
        //initWaypointsAndConnections(true, true,
        //                            visualSettings.undiscovered);
        
        //cleanupAVControlPanel();
        //algorithmSelectionChanged();
	hideAVStatusPanel();
        break;
    }

    // in all cases, we hide the top panel, show the load panel
    hideTopControlPanel();
    showLoadDataPanel();
    
    //deleteVariableSelector();
}

// event handler for "Show Data Tables" checkbox
function showHideDatatables() {

    let checked = document.getElementById("datatablesCheckbox").checked;
    let datatable = document.getElementById("datatable");
    if (checked) {
        datatable.style.display = "inline-block";
    }
    else {
        datatable.style.display = "none";
    }

    resizePanels();
}

const PANEL_SEPARATION = 12;  // separation between panels

// event handler to resize the panels on a resize or display/undisplay
// of one of the panels
function resizePanels() {

    const STATUS_LEFT = 400;  // width of status panel
    const BORDER_THICKNESS = 0;  // border thickness
    let left = STATUS_LEFT + PANEL_SEPARATION + (3 * BORDER_THICKNESS);
    let dtWidth;
    let mapDOM = document.getElementById("map");
    let dtDOM = document.getElementById("datatable");

    // determine which panels are displayed
    let showDataTables = document.getElementById("datatablesCheckbox").checked;
    let showAvPanel = !hdxAV.dataOnly() && hdxAV.currentAV.value != "NONE";
    if (hdxGlobals.titleScreen) {
	// do nothing
    }
    else if (hdxGlobals.algSelectScreen) {
        mapDOM.style.left = (left + (1 * PANEL_SEPARATION) + (-1 * BORDER_THICKNESS)) + "px";
        mapDOM.style.width = (window.innerWidth - (left + (2 * PANEL_SEPARATION) + (1 * BORDER_THICKNESS))) + "px";
    }
    else if (showDataTables && showAvPanel) {
	// Datatables checked and an algorithm is selected
	
        dtWidth = dtDOM.clientWidth;
        
        mapDOM.style.left = (left + dtWidth + (2 * PANEL_SEPARATION) + (1 * BORDER_THICKNESS)) + "px";
        mapDOM.style.width = (window.innerWidth - (left + dtWidth + (3 * PANEL_SEPARATION) + (3 * BORDER_THICKNESS))) + "px";
	
        dtDOM.style.left = (left + (1 * PANEL_SEPARATION) + (-1 * BORDER_THICKNESS)) + "px";
        dtDOM.style.maxHeight = (window.innerHeight - (PANEL_SEPARATION * 1) - 67) + "px";
    }
    else if (!showDataTables && showAvPanel) {
	// Datatables not checked and an algorithm is selected
        
        mapDOM.style.left = (left + (1 * PANEL_SEPARATION) + (-1 * BORDER_THICKNESS)) + "px";
        mapDOM.style.width = (window.innerWidth - (left + (2 * PANEL_SEPARATION) + (1 * BORDER_THICKNESS))) + "px";
        
    }
    else if (showDataTables && !showAvPanel) {
	// Datatables checked and no algorithm selected
        dtWidth = dtDOM.clientWidth;
        var left2 = dtWidth + PANEL_SEPARATION + (3 * BORDER_THICKNESS);
        
        dtDOM.style.left = PANEL_SEPARATION + "px";
        mapDOM.style.left =  (left2 + (1 * PANEL_SEPARATION) + (-1 * BORDER_THICKNESS)) + "px"
        mapDOM.style.width = (window.innerWidth - (left2 + (2 * PANEL_SEPARATION) + (1 * BORDER_THICKNESS))) + "px";
    }
    else {
	// Datatables not checked and no algorithm selected
        
        mapDOM.style.left = ((1 * PANEL_SEPARATION) + (0 * BORDER_THICKNESS)) + "px";
        mapDOM.style.width = (window.innerWidth - ((2 * PANEL_SEPARATION) + (2 * BORDER_THICKNESS))) + "px";
    }
    
    if (!hdxGlobals.titleScreen) {
	mapDOM.style.height = (window.innerHeight - (PANEL_SEPARATION * 1) - 67) + "px";
	document.getElementById("avStatusPanel").style.maxHeight = (window.innerHeight - PANEL_SEPARATION - 67) + "px";
	dtDOM.style.maxHeight = (window.innerHeight - PANEL_SEPARATION - 67) + "px";
	document.getElementById("graphInfo").style.left = 60 + parseInt(mapDOM.style.left) + "px";
    }

    // this helped keep the map centered on resize
    map.invalidateSize();
}

// Functions to show or hide panels that are displayed only
// in certain modes of HDX operation

// top control panel (algorithm controls, reset/load buttons)
function showTopControlPanel() {    

    document.getElementById("map").style.filter = "none";
    document.getElementById("map").style.borderRadius = "10px";
    document.getElementById("map").style.top = "67px";
    document.getElementById("map").style.height = (window.innerHeight - PANEL_SEPARATION - 73) + "px";
    document.getElementById("avStatusPanel").style.maxHeight = (window.innerHeight - PANEL_SEPARATION - 73) + "px";
    document.getElementById("newGraph").style.display = "";
    document.getElementById("newAlg").style.display = "";
    document.getElementById("filename").style.marginTop = "0";
    document.getElementById("currentAlgorithm").style.marginTop = "0";
    document.getElementById("filename").style.fontSize = "12px";
    document.getElementById("currentAlgorithm").style.display = "inline";
    document.getElementById("metalTitle").style.display = "inline";
    if (document.getElementById("pseudo") != null)
    {
        document.getElementById("pseudo").parentNode.style.display = "none";
    }
    if (document.getElementById("foundAVCPEntry") != null)
    {
        document.getElementById("foundAVCPEntry").parentNode.style.display = "none";
    }
    
    resizePanels();

    let av1 = document.getElementById("topControlPanelAV1");
    let av2 = document.getElementById("topControlPanelAV2");
    let av3 = document.getElementById("topControlPanelAV3");
    let pseudocheck = document.getElementById("topControlPanelPseudo");
    // show only the relevant components given the current
    // state of HDX
    switch (hdxAV.status) {
    case hdxStates.WPT_LOADED:
    case hdxStates.NMP_LOADED:
    case hdxStates.WPL_LOADED:
    case hdxStates.PTH_LOADED:
        // undisplay the AV-related controls
        av1.style.display = "none";
        av2.style.display = "none";
	// show the checkboxes
        av3.style.display = "";
	// but the pseudocode checkbox doesn't make sense
	pseudocheck.style.display = "none";
        break;

    case hdxStates.GRAPH_LOADED:
        // only display the "Reset AV" button (but relabel it
        // as "Select AV" since this means no AV is currently
        // selected
        av1.style.display = "none";
        av2.style.display = "none";
        av2.style.display = "";
        document.getElementById("newGraph").addEventListener("click", newGraphMenu);
        document.getElementById("newAlg").addEventListener("click", resetPressed);
        document.getElementById("newAlg").addEventListener("click", cleanupBreakpoints());
        
        document.getElementById("datatablesCheckbox").checked = false;
        break;

    default:
        // An AV is selected and possibly running, paused, or complete
        // so show all AV-related controls and make sure the "Reset AV"
        // button is labeled that way, and reset default values
        av1.style.display = "";
        av2.style.display = "";
        av3.style.display = "";
	pseudocheck.style.display = "";
        speedChanged();
        document.getElementById("pseudoCheckbox").checked = true;
        document.getElementById("datatablesCheckbox").checked = false;
        break;
    }
    
    document.getElementById("topControlPanel").style.display="table";
    showHideDatatables();
}

function hideTopControlPanel() {
    
    document.getElementById("topControlPanel").style.display="none";
}

// the load data panel, where graphs and other data are specified
// to be loaded into HDX
function showLoadDataPanel() {
    
    document.getElementById("loadDataPanel").style.display = "table";
    document.getElementById("hideLoadDataPanel").disabled=false;
    document.getElementById("map").style.filter = "blur(6px)";
}

function hideLoadDataPanel() {

    document.getElementById("loadDataPanel").style.display ="none";
    document.getElementById("map").style.filter = "none";
}

// the algorithm selection panel, where an algorithm is selected
// and its parameters are specified
function hideAlgorithmSelectionPanel() {

    document.getElementById("algorithmSelectionPanel").style.display="none";
    hdxGlobals.algSelectScreen = false;
}

function showAlgorithmSelectionPanel() {
 
    document.getElementById("algorithmSelectionPanel").style.display="table";
    document.getElementById("map").style.filter = "none";
    document.getElementById("map").style.borderRadius = "10px";
   // document.getElementById("map").style.border = "2px solid white";
    document.getElementById("map").style.top = "67px";
    document.getElementById("graphInfo").style.top = "79px";
    
    document.getElementById("map").style.height = (window.innerHeight - PANEL_SEPARATION - 73) + "px";
    document.getElementById("topControlPanelAV3").style.display = "";
    //document.getElementById("currentAlgorithm").innerHTML = "";
    document.getElementById("datatable").style.display = "none";
    document.getElementById("newGraph").style.display = "none";
    document.getElementById("newAlg").style.display = "none";
    document.getElementById("filename").style.marginTop = "12px";
    document.getElementById("currentAlgorithm").style.marginTop = "12px";
    document.getElementById("filename").style.fontSize = "21px";
    document.getElementById("currentAlgorithm").style.display = "none";
    document.getElementById("topControlPanel").style.display = "none";
    document.getElementById("pscode").style.display = "none";
    document.getElementById("metalTitle").style.display = "inline";
    document.getElementById("info").style.display = "block";
    hdxGlobals.titleScreen = false;
    hdxGlobals.algSelectScreen = true;
    hdxAV.currentAV = null;
    resizePanels();
    algorithmSelectionChanged();
    hideAVStatusPanel();
}

// the algorithm status panel, including messages, code, data, and
// other information showing the status of an AV
function showAVStatusPanel() {

    document.getElementById("newGraph").addEventListener("click", newGraphMenu);
    document.getElementById("newAlg").addEventListener("click", resetPressed);
    document.getElementById("newAlg").addEventListener("click", cleanupBreakpoints());
    
    document.getElementById("avStatusPanel").style.display="block";
    document.getElementById("avStatusPanel").style.left = "12px";
    document.getElementById("avStatusPanel").style.top = "67px";    
}

function hideAVStatusPanel() {

    document.getElementById("avStatusPanel").style.display="none";
}

// Populate the dropdown menu of selected graphs based on the filters
// and other criteria in the Advanced Graph Data Search panel.  Called when
// the "Get Graph List" button is pressed.
function HDXFillGraphList(e) {

    hdxGlobals.graphSet = document.getElementById("graphArchive").value;
    var sels = document.getElementById("selects");
    var orderSel = document.getElementById("orderOptions").value;
    var resSel = document.getElementById("restrictOptions").value;
    var cateSel = document.getElementById("categoryOptions").value;
    var min = parseInt(document.getElementById("minVertices").value);
    var max = parseInt(document.getElementById("maxVertices").value);
    if (max < 0 || min < 0 || min > max) {
        console.log("Out of range.  min: " + min + " max: " + max);
        return;
    }
    if ($("#graphList").length != 0) {
        sels.removeChild(document.getElementById("graphList"));
    }
    var mapSel = document.createElement("select");
    mapSel.setAttribute("id", "graphList");
    // initially put "Loading..." into the dropdown, to be replaced
    // when the AJAX request is complete
    var loadingEntry = document.createElement("option");
    loadingEntry.innerHTML = "Loading...";
    loadingEntry.setAttribute("id", "loadingEntry");
    loadingEntry.value = "loadingEntry";
    mapSel.appendChild(loadingEntry);
    sels.appendChild(mapSel);
    var params = {
        graphSet:hdxGlobals.graphSet,
        order:orderSel,
        restrict:resSel,
        category:cateSel,
        min:min,
        max:max
    };
    var jsonParams = JSON.stringify(params);
    $.ajax({
        type: "POST",
        url: "./generateGraphList.php",
        datatype: "json",
        data: {"params":jsonParams},
        success: function(data) {
	    var mapSel = document.getElementById("graphList");
	    
            var opts = $.parseJSON(data);
            var txt = opts['text'];
            var values = opts['values'];
            var vertices = opts['vertices'];
            var edges = opts['edges'];
            var opt;
            var str = "";
            if (txt.length == 0) {
		// remove the dropdown until the button is pressed
		// again with valid entries
		var sels = document.getElementById("selects");
		sels.removeChild(mapSel);
                alert("No graphs matched!  Please choose less restrictive filters.");
		return;
            }
	    // replace "loading" message with "choose" message
	    var loadingEntry = document.getElementById("loadingEntry");
	    loadingEntry.innerHTML = "Choose a Graph";
            for (var i = 0; i < txt.length; i++) {
                opt = document.createElement("option");
                if (values[i].indexOf("simple") != -1) {
                    str = txt[i] + " (simple), size: (" + vertices[i] + ", " + edges[i] + ")";
                }
                else if (values[i].indexOf("traveled") != -1) {
                    str = txt[i] + " (traveled), size: (" + vertices[i] + ", " + edges[i] + ")";
                }
                else {
                    str = txt[i] + " (collapsed), size: (" + vertices[i] + ", " + edges[i] + ")" ;
                }
                opt.innerHTML = str;
                opt.value = values[i];
                mapSel.appendChild(opt);
            }
	    // now that the list is populated, add the listener
	    mapSel.setAttribute("onchange", "HDXReadSelectedGraphFromServer(event)");
        
        }
    });
}

var darkMap = false;
function newMapTileSelected(e) {

    let selectedMap = "NOT FOUND";
    for (var mapname in baseLayers) {
	if (map.hasLayer(baseLayers[mapname])) {
	    selectedMap = mapname;
	    break;
	}
    }
    if (selectedMap.includes("Dark") || selectedMap.includes("Matrix") || selectedMap.includes("/Topo") || selectedMap.includes("HERE Hybrid Day") || selectedMap.includes("Esri WorldImagery") || selectedMap.includes("Esri Nat") || selectedMap.includes("Black") || selectedMap.includes("Spinal")) {
        visualSettings.undiscovered.color = "white";
        visualSettings.undiscovered.textColor = "black";
	if (visualSettings.undiscovered.hasOwnProperty("icon")) {
            visualSettings.undiscovered.icon.borderColor = "white";
	}
        darkMap = true;

        markerList = document.querySelectorAll(".circle-dot");

        for (let i = 0; i < markerList.length; i++) {
            if (markerList[i].style.borderColor == "rgb(60, 60, 60)") {
                markerList[i].style.borderColor = "white";
            }
        }
        for (let i = 0; i < connections.length; i++) {
            if (connections[i].options.color == "rgb(60, 60, 60)") {
                connections[i].setStyle({
                    color: "white",
                });
            }
        }
    }
    else {
        visualSettings.undiscovered.color = "rgb(60, 60, 60)";
        visualSettings.undiscovered.textColor = "white";
	if (visualSettings.undiscovered.hasOwnProperty("icon")) {
            visualSettings.undiscovered.icon.borderColor = "rgb(60, 60, 60)";
	}
        darkMap = false;

        markerList = document.querySelectorAll(".circle-dot");

        for (let i = 0; i < markerList.length; i++) {
            if (markerList[i].style.borderColor == "white") {
                markerList[i].style.borderColor = "rgb(60, 60, 60)";
            }
        }
        for (let i = 0; i < connections.length; i++) {
            if (connections[i].options.color == "white") {
                connections[i].setStyle({
                    color: "rgb(60, 60, 60)",
                    });
            }
        }
    }
}
