//
// HDX-specific Javascript functions
//
// Load and view data files related to Travel Mapping (TM), formerly
// Clinched Highway Mapping (CHM), related academic data sets.
//
// Primary author: Jim Teresco, Siena College, The College of Saint Rose
//
// Additional authors: Razie Fathi, Arjol Pengu, Maria Bamundo, Clarice Tarbay,
// Michael Dagostino, Abdul Samad, Eric Sauer, Luke Jennings, Bailey Cross,
// Spencer Moon, Michael Plekan

// some globals used here (map, waypoints, markers, etc) come from tmjsfuncs.js

// most functionality has been moved to other JS files for easier
// code management

// Essentially an enum of possible states of the simulation, used to
// ensure that only things that should be done are permitted in a
// given state.  Any AV_ state implies that a graph is loaded.  
var hdxStates = {

    NO_DATA: 1,
    GRAPH_LOADED: 2,
    WPT_LOADED: 3,
    NMP_LOADED: 4,
    WPL_LOADED: 5,
    PTH_LOADED: 6,
    AV_SELECTED: 7,
    AV_RUNNING: 8,
    AV_PAUSED: 9,
    AV_COMPLETE: 10
};

// object to hold HDX global status info
var hdxGlobals = new Object();

// function to set the waypoint color, scale, and table entry
// using an entry passed in from the visualSettings
// optionally hide also by setting display to none
function updateMarkerAndTable(waypointNum, vs, zIndex, hideTableLine) {

    if (!vs.hasOwnProperty('icon')) {
        var options = {
            iconShape: 'circle-dot',
            iconSize: [vs.scale, vs.scale],
            iconAnchor: [vs.scale, vs.scale],
            borderWidth: vs.scale,
            borderColor: vs.color
        };

        vs.icon = L.BeautifyIcon.icon(options);
    }
    markers[waypointNum].setIcon(vs.icon);
    markers[waypointNum].setZIndexOffset(2000+zIndex);
    var row = document.getElementById("waypoint"+waypointNum);
    row.style.backgroundColor = vs.color;
    row.style.color = vs.textColor;
    if (row.style.backgroundColor == "rgb(60, 60, 60)")
    {
        row.style.backgroundColor = "white";
        row.style.color = "black";
    }
    if (hideTableLine) {
        row.style.display = "none";
    }
    else if (!hideTableLine) {
       row.style.display = "table-row";
   }
}

// function to set the edge color and table entry information
// based on the visual settings, optionally hide line
function updatePolylineAndTable(edgeNum, vs, hideTableLine) {

    connections[edgeNum].setStyle({
        color: vs.color,
        weight: vs.weight,
        opacity: vs.opacity});

    let row = document.getElementById("connection" + edgeNum);
    row.style.backgroundColor = vs.color;
    row.style.color = vs.textColor;
    if (row.style.backgroundColor == "rgb(60, 60, 60)")
    {
        row.style.backgroundColor = "white";
        row.style.color = "black";
    }

    if (hideTableLine) {
        row.style.display = "none";
    } 
}

// function to show/hide/reinitialize waypoints and connections
// at the initialization of an AV
//
// showW: boolean indicating whether to show waypoints on map and in table
// showC: boolean indicating whether to show connections on map and in table
// vs: a visualSettings object to use to color shown components
function initWaypointsAndConnections(showW, showC, vs) {

    if (showW) {
        // make sure waypoints table is displayed
        document.getElementById("waypoints").style.display = "";
        
        // show all existing markers on map and table
        for (var i = 0; i < waypoints.length; i++) {
            markers[i].remove();
            markers[i].addTo(map);
            updateMarkerAndTable(i, vs, 0, false);
        }

        // ensure individual table rows are shown
        var pointRows = document.getElementById("waypoints").getElementsByTagName("*");
        for (var i = 0; i < pointRows.length; i++) {
            pointRows[i].style.display = "";
        }
    }
    else {
        // undisplay the waypoints table
        document.getElementById("waypoints").style.display = "none";

        // remove all markers from the map
        for (var i = 0; i < waypoints.length; i++) {
            markers[i].remove();
        }
    }

    if (showC) {
        // display the connections table
        document.getElementById("connection").style.display = "";

        // ensure individual table rows are shown
        var pointRows = document.getElementById("connection").getElementsByTagName("*");
        for (var i = 0; i < pointRows.length; i++) {
            pointRows[i].style.display = "";
        }

        // show edges
        for (var i = 0; i < connections.length; i++) {
	    connections[i].remove();
	    connections[i].addTo(map);
            updatePolylineAndTable(i, vs, false);
        }
    }
    else {
        // undisplay the connections table
        document.getElementById("connection").style.display = "none";

        // remove each connection from the map
        for (var i = 0; i < connections.length; i++) {
            connections[i].remove();
        }
    }
}

// function to limit the given string to the given length, replacing
// characters in the middle with ".." if needed to shorten
function shortLabel(label, max) {
    
    if (label.length > max) {
        return label.substring(0,max/2-1) + ".." +
            label.substring(label.length - (max/2-1));
    }
    return label;
}

// get a list of adjacent vertices by index into waypoints array
function getAdjacentPoints(pointIndex) {
    var resultArray = [];
    var edgeList = waypoints[pointIndex].edgeList;
    for (var i = 0; i < edgeList.length; i++) {
        var adjacentIndex;
        if (edgeList[i].v1 == pointIndex) {
            adjacentIndex = edgeList[i].v2;
        }
        else {
            adjacentIndex = edgeList[i].v1;
        }
        resultArray.push(adjacentIndex);
    }
    
    return resultArray;
}

/* object to display the value of a variable (which should be
   a number or string) with a given label and in the given
   document element's innerHTML, beginning with the given
   initial value */
function HDXDisplayVariable(displayLabel,docElement,initVal) {

    this.value = initVal;
    this.label = displayLabel;
    this.docElement = docElement;

    // set to a new value
    this.set = function(newVal) {
        
        this.value = newVal;
        this.paint();
    };

    // increment
    this.increment = function() {

        this.value++;
        this.paint();
    };
    
    // redraw in the document element
    this.paint = function() {

        this.docElement.innerHTML = this.label + this.value;
    };

    this.paint();
    return this;
}

// shortcut function to display errors
function pointboxErrorMsg(msg) {
    pointbox = document.getElementById("pointbox");
    selected = document.getElementById("selected");
    
    pointbox.innerHTML = "<table class=\"gratable\"><thead><tr><th style=\"color: red\">" + msg + "</th></thead></table>";
    selected.innerHTML = pointbox.innerHTML;
    
}

// When a file is selected by a fileselector whose DOM id
// is provided by the parameter, this function will be called
// to start the loading process.
function HDXStartFileselectorRead(filesel) {

    // first, retrieve the selected file (as a File object)
    // which must be done before we toggle the table to force
    // the pointbox to be displayed
    let file = document.getElementById(filesel).files[0];
    hdxGlobals.loadingFile = file.name;
    
    // force data table to be displayed
    let datatable = document.getElementById("datatable");
    datatable.style.display = "";
    let checkbox = document.getElementById("datatablesCheckbox");
    checkbox.selected = false;

    if (file) {
        //DBG.write("file: " + file.name);
        document.getElementById('filename').innerHTML = hdxGlobals.loadingFile;
        if ((hdxGlobals.loadingFile.indexOf(".wpt") == -1) &&
            (hdxGlobals.loadingFile.indexOf(".pth") == -1) &&
            (hdxGlobals.loadingFile.indexOf(".nmp") == -1) &&
            (hdxGlobals.loadingFile.indexOf(".gra") == -1) &&
            (hdxGlobals.loadingFile.indexOf(".tmg") == -1) &&
            (hdxGlobals.loadingFile.indexOf(".wpl") == -1)) {
            pointboxErrorMsg("Unrecognized file type!");
            return;
        }
        // pointboxErrorMsg("Loading... (" + file.size + " bytes)");
        var reader;
        try {
            reader = new FileReader();
        }
        catch(e) {
            pointboxErrorMsg("Error: unable to access file (Perhaps no browser support?  Try recent Firefox or Chrome releases.).");
            return;
        }
        loadingMenu();
        reader.readAsText(file, "UTF-8");
        reader.onload = HDXFileLoadedCallback;
        //reader.onerror = fileLoadError;
    }
}

// read the graph chosen from the dropdown menu "graphList" in the Load Data
// panel, Option 2
function HDXReadSelectedGraphFromServer(event) {

    let index = document.getElementById("graphList").selectedIndex;
    let graphName = document.getElementById("graphList").options[index].value;
    
    if (graphName != "") {
	HDXReadFileFromWebServer(graphName);
    loadingMenu();
    }
}

// read a data file from the "graphdata" directory or an archive
// directory under "grapharchives" on the server
function HDXReadFileFromWebServer(graphName) {

    // set up and make the AJAX request
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState != 4) return;
	if (xmlhttp.status == 200) {
            let file = new Blob([xmlhttp.responseText], {type : "text/plain"});
	    if (file) {
		file.name = graphName;
                let reader;
                try {
                    reader = new FileReader();
                }
                catch(e) {
		    console.log("HDXReadFileFromWebServer, onreadystatechange exception " + e);
                    pointboxErrorMsg("Error: unable to access file (Perhaps no browser support?  Try recent Firefox or Chrome releases.).");
                    return;
                }
                reader.readAsText(file, "UTF-8");
                reader.onload = HDXFileLoadedCallback;
            }
	}
	else {
	    alert("Error " + xmlhttp.status + " loading " + graphName);
	}
    };

    hdxGlobals.loadingFile = graphName;
    // check what we're loading, to find the right location
    let urlPath = "https://courses.teresco.org/metal/graphdata/";
    if (hdxGlobals.graphSet != "current") {
	urlPath = "https://courses.teresco.org/metal/grapharchives/" +
	    hdxGlobals.graphSet + "/";
    }
    if (graphName == "tm-master.nmp") {
	urlPath = "https://courses.teresco.org/metal/tmlogs/";
    }
    else if (graphName.endsWith(".nmp")) {
	urlPath = "https://courses.teresco.org/metal/tmlogs/nmpbyregion/";
    }
    // open and send the AJAX request, on completion the HDXFileLoadedCallback
    // function will handle the results
    xmlhttp.open("GET", urlPath + graphName, true);
    xmlhttp.send(); 
}

// when the FileReader created in HDXReadFileFromWebServer or
// HDXStartFileselectorRead has finished, this will be called to
// process the contents of the file
function HDXFileLoadedCallback(event) {
    
    // file done loading, read the contents
    HDXProcessFileContents(event.target.result);
    HDXAddCustomTitles();
}

// process the contents of a String which came from a file or elsewhere
function HDXProcessFileContents(fileContents) {
    
    let datatable = document.getElementById("datatable");
    let showAVSelection = false;
    // hide the graph info overlay, any file format that wants to
    // put meaningful information into it should do so and unhide
    let graphInfo = document.getElementById("graphInfo");
    graphInfo.style.display = "none";

    // in case we had set colors (for an NMP file) previously:
    waypointColors = new Array();

    // in case we had an AV already running or complete, we should
    // clean that up, and set the AV to be no AV
    if (hdxAV.status == hdxStates.AV_PAUSED ||
	hdxAV.status == hdxStates.AV_COMPLETE) {
	// no need to reset waypoints and connections, as they will be
	// overwritten by the loading
	cleanupAVControlPanel();
	hdxAV.currentAV.cleanupUI();
	deleteVariableSelector();
	hdxAV.currentAV = hdxAV.avList[0];
	document.getElementById("AlgorithmSelection").selectedIndex = 0;
	document.getElementById("currentAlgorithm").innerHTML =
            hdxAV.currentAV.name;
    }
    
    // parse the file and process as appropriate
    // its name should have been stored in hdxGlobals.loadingFile
    if (hdxGlobals.loadingFile.indexOf(".wpt") >= 0) {
        document.getElementById('filename').innerHTML =
	    hdxGlobals.loadingFile + " (Waypoint File)";
        datatable.innerHTML = parseWPTContents(fileContents);
    }
    else if (hdxGlobals.loadingFile.indexOf(".pth") >= 0) {
        document.getElementById('filename').innerHTML =
	    hdxGlobals.loadingFile + " (Waypoint Path File)";
        datatable.innerHTML = parsePTHContents(fileContents);
    }
    else if (hdxGlobals.loadingFile.indexOf(".nmp") >= 0) {
        document.getElementById('filename').innerHTML =
	    hdxGlobals.loadingFile + " (Near-Miss Point File)";
        datatable.innerHTML = parseNMPContents(fileContents);
    }
    else if (hdxGlobals.loadingFile.indexOf(".wpl") >= 0) {
        document.getElementById('filename').innerHTML =
	    hdxGlobals.loadingFile + " (Waypoint List File)";
        datatable.innerHTML = parseWPLContents(fileContents);
    }
    else if (hdxGlobals.loadingFile.indexOf(".gra") >= 0) {
        document.getElementById('filename').innerHTML =
	    hdxGlobals.loadingFile + " (Highway Graph File)";
        datatable.innerHTML = parseGRAContents(fileContents);
	// unless the "noav" QS parameter is specified, we need to go to
	// the AV Selection Panel
	if (!HDXQSIsSpecified("noav")) {
	    showAVSelection = true;
	}
    }
    else if (hdxGlobals.loadingFile.indexOf(".tmg") >= 0) {
        document.getElementById('filename').innerHTML = hdxGlobals.loadingFile;
        datatable.innerHTML = parseTMGContents(fileContents);
	// unless the "noav" QS parameter is specified, we need to go to
	// the AV Selection Panel
	if (!HDXQSIsSpecified("noav")) {
	    showAVSelection = true;
	}
    }    

    hideLoadDataPanel();
    mapStatus = mapStates.HDX;
    updateMap(null,null,null);

    //Updating custom colors and scales
   if(hdxGlobals.FileVersion=='3.0'&&hdxGlobals.FileType=="custom"){
    for (i in waypoints){
        updateMarkerAndTable(i, { color: waypoints[i].color, scale: waypoints[i].scale, opacity: waypoints[i].opacity, textColor: "white" }, 0, false);
     }
    for (i in graphEdges){
        updatePolylineAndTable(i, { color: graphEdges[i].color, weight: graphEdges[i].scale,opacity: graphEdges[i].opacity, textColor: "white" }, false);
     }
    }
    hdxGlobals.titleScreen = false;
    if (showAVSelection) {
	showAlgorithmSelectionPanel();
    }
    else {
	showTopControlPanel();
    }
}

// parse the contents of a .tmg file
//
// supports version 1.0, 2.0, and 3.0 "simple", "collapsed", "traveled","custom", or "partitioned".
// see https://courses.teresco.org/metal/graph-formats.shtml
//
function parseTMGContents(fileContents) {
    
    var lines = fileContents.replace(/\r\n/g,"\n").split('\n');
    var header = lines[0].split(' ');
    if (header[0] != "TMG") {
        return '<table class="table"><thead class = "thead-dark"><tr><th scope="col">Invalid TMG file (missing TMG marker on first line)</th></tr></table>';
    }
    if ((header[1] != "1.0") && (header[1] != "2.0")&&(header[1]!="3.0")) {
        return '<table class="table"><thead class = "thead-dark"><tr><th scope="col">Unsupported TMG file version (' + header[1] + ')</th></tr></table>';
    }
    if ((header[2] != "simple") && (header[2] != "collapsed")
        && (header[2] != "traveled")&&(header[2]!="custom")&&(header[2]!="partitioned")) {
        return '<table class="table"><thead class = "thead-dark"><tr><th scope="col">Unsupported TMG graph format (' + header[2] + ')</th></tr></table>';
    }

    //setting variables
    hdxGlobals.FileVersion=header[1];
    hdxGlobals.FileType=header[2];
    var counts = lines[1].split(' ');// normally has Vertice and edge count,but may have partition count
    var numV = parseInt(counts[0]);
    var numE = parseInt(counts[1]);
    var offset=2;
    var numTravelers = 0;
    var Vcolspan=3;
    var Ecolspan=3;

    //HTML strings for table
    var Vstring='';
    var Estring='';

   //extra fields for each vertex/edges
    var Vfields='';
    var Efields='';
    hdxGlobals.keywords=["color","scale","opacity","partition"];
    if(hdxGlobals.FileVersion=='3.0'&& hdxGlobals.FileType!="partitioned"){
         Vfields=lines[2].split(' ');
         Efields=lines[3].split(' ');
         
         for (x of Vfields){
             if(!hdxGlobals.keywords.includes(x.toLowerCase())){
                  Vstring=Vstring+'<th scope="col" class="dtHeader">'+x+'</th>';
                  Vcolspan++;
             }
        }
       for (x of Efields){
             if(!hdxGlobals.keywords.includes(x.toLowerCase())){
                  Estring=Estring+'<th scope="col" class="dtHeader">'+x+'</th>';
                  Ecolspan++;
             }
        }

         offset=4;   
    }
    else if(hdxGlobals.FileVersion=='3.0'&& hdxGlobals.FileType=="partitioned"){
        Vfields=["partition"];
        //setting up numbers and arrays for the hdxPart support file
        hdxPart.numParts=parseFloat(counts[2]);
        hdxPart.parts=new Array(hdxPart.numParts);
        for(var x=0;x<hdxPart.numParts;x++){
            hdxPart.parts[x]=new Array();
        }
    }
    let graphInfo = document.getElementById("graphInfo");
    graphInfo.style.display = "block";
    graphInfo.innerHTML = numV + " vertices, " + numE + " edges";
    
    // is this a traveled format graph?
    if (hdxGlobals.FileType == "traveled") {
        haveTravelers = true;
        numTravelers = parseInt(counts[2]);
    }
    else {
        haveTravelers = false;
        numTravelers = 0;
    }
    
    /*var summaryInfo = '<table class="table-sm"><thead class = "thead-dark"><tr><th scope="col">' + numV + " waypoints, " + numE + " connections"

    if (haveTravelers) {
        summaryInfo += ", " + numTravelers + " travelers";
    }
    
    summaryInfo += ".</th></tr></table>";*/
    
    var vTable = '<table id="waypoints" class="table table-light table-bordered"><thead class = "thead-dark"><tr><th scope="col" colspan="'+Vcolspan+'" id="wp">Waypoints</th></tr><tr><th class="dtHeader">#</th><th scope="col" class="dtHeader">Coordinates</th><th scope="col" class="dtHeader">Waypoint Name</th>'+Vstring+'</tr></thead><tbody>';
    waypoints = new Array(numV);
    for (var i = 0; i < numV; i++) {
        var vertexInfo = lines[i+offset].split(' ');
        waypoints[i] = new Waypoint(vertexInfo[0], vertexInfo[1], vertexInfo[2], "", new Array());
        waypoints[i].lat=Number(parseFloat(waypoints[i].lat));
        waypoints[i].lon=Number(parseFloat(waypoints[i].lon));
        
       if(hdxGlobals.FileVersion=='3.0'){
          //setting default to be the same as undiscovered from visual settings
          waypoints[i].color="rgb(60, 60, 60)";
          waypoints[i].scale= 4;
          waypoints[i].opacity=0.6;
          var c=1;
          if(hdxGlobals.FileType!="partitioned"){
              for (x of Vfields){
                  waypoints[i][x]=vertexInfo[2+c];
                  c++;
             }
          }
          else{
             if(vertexInfo[3]>=hdxPart.numParts){
                   console.log("File Error:Partition value of"+waypoints[i].label+" is higher than the number of Partitions");
             }
             else{
                  hdxPart.parts[vertexInfo[3]].push(Number(i));
             }
       }
      }
        var e = "...";
        var Vinfo='';
        var coord='<td style ="word-break:break-all;">'+parseFloat(vertexInfo[1]).toFixed(3) + ',' +parseFloat(vertexInfo[2]).toFixed(3) +'</td>';
        var Vlabel='';
        if (((waypoints[i]).label).length > 10) {
            Vlabel = '<td style ="word-break:break-all;">' + (waypoints[i].label).substring(0,10) + e+'</td>';
        }
       else{
            Vlabel = '<td style ="word-break:break-all;">' + (waypoints[i].label).substring(0,10)+'</td>';
        }
        if(hdxGlobals.FileVersion=='3.0'&&hdxGlobals.FileType=="custom"){
          for (x of Vfields){
             if(!hdxGlobals.keywords.includes(x.toLowerCase())){
                  Vinfo += '<td style ="word-break:break-all;">' +waypoints[i][x]+'</td>'
             }
          }
        }
        var vsubstrL =  parseFloat(vertexInfo[1]).toFixed(3) + ',' +
            parseFloat(vertexInfo[2]).toFixed(3) 
            + waypoints[i].label;
        
        vTable += '<tr id="waypoint' + i + '" custom-title = "' + vsubstrL +'" onmouseover = "hoverV('+i+', false)" onmouseout = "hoverEndV('+i+', false)" onclick = "labelClickHDX('+i+')" ><td style ="word-break:break-all;">' + i +'</td>';
         
        vTable += coord + Vlabel +Vinfo+ '</tr>';
    }

    vTable += '</tbody></table>';

    var Einfo='';
    var eTable = '<table  id="connection" class="table table-light"><thead class = "thead-dark"><tr><th scope="col" colspan="'+Ecolspan+'" id="cn">Connections</th></tr><tr><th scope="col" class="dtHeader">#</th><th scope="col" class="dtHeader">Route Name(s)</th><th scope="col" class="dtHeader">Endpoints</th>'+Estring+'</tr></thead><tbody>';
    graphEdges = new Array(numE);
    for (var i = 0; i < numE; i++) {
        var edgeInfo = lines[i+numV+offset].split(' ');
        var newEdge;
        if (haveTravelers) {
            if (edgeInfo.length > 4) {
                newEdge = new GraphEdge(edgeInfo[0], edgeInfo[1],
                                        edgeInfo[2], edgeInfo[3],
                                        edgeInfo.slice(4));
            }
            else {
                newEdge = new GraphEdge(edgeInfo[0], edgeInfo[1],
                                        edgeInfo[2], edgeInfo[3], null);
            }
            if (newEdge.travelerList.length > maxEdgeTravelers) {
                maxEdgeTravelers = newEdge.travelerList.length;
            }
        }
        else {
            if (edgeInfo.length > 3) {
                newEdge = new GraphEdge(edgeInfo[0], edgeInfo[1],
                                        edgeInfo[2], null,
                                        edgeInfo.slice(3+Efields.length));
            }
            else {
                newEdge = new GraphEdge(edgeInfo[0], edgeInfo[1],
                                        edgeInfo[2], null, null);
            }
            if(hdxGlobals.FileVersion=='3.0'&&hdxGlobals.FileType=="custom"){
              var c=1;
              //setting default to be the same as undiscovered from visual settings
              newEdge.color="rgb(60, 60, 60)";
              newEdge.scale= 4;
              newEdge.opacity=0.6;

              for (x of Efields){
                 newEdge[x]=edgeInfo[2+c];
                 c++;
              }
            }

        }
        var firstNode = Math.min(parseInt(newEdge.v1), parseInt(newEdge.v2));
        var secondNode = Math.max(parseInt(newEdge.v1), parseInt(newEdge.v2));
        // add this new edge to my endpoint vertex adjacency lists
        waypoints[newEdge.v1].edgeList.push(newEdge);
        waypoints[newEdge.v2].edgeList.push(newEdge);
        var EhoverText = edgeInfo[0] + ':&nbsp;' + waypoints[newEdge.v1].label +
            ' &harr; ' + edgeInfo[1] + ':&nbsp;'
            + waypoints[newEdge.v2].label;
        var subst = '<td style ="word-break:break-all;">'
            + edgeInfo[0] + '&nbsp;'  +
            ' &harr;&nbsp; ' + edgeInfo[1] + '&nbsp;'
             + '</td>';

        eTable += '<tr custom-title = "' + EhoverText + '"' + 'onmouseover="hoverE(event,'+i+')" onmouseout="hoverEndE(event,'+i+')" onclick="connectionClick({ connIndex: '+i+'})" id="connection' + i + '" class="v_' + firstNode + '_' + secondNode + '"><td id = "connectname" style ="word-break:break-all;" >' + i + '</td>';
        if(hdxGlobals.FileVersion=='3.0'&&hdxGlobals.FileType=="custom"){
        Einfo='';//resetting Einfo
          for (x of Efields){
             if(!hdxGlobals.keywords.includes(x.toLowerCase())){
                  Einfo += '<td style ="word-break:break-all;">' +newEdge[x]+'</td>'
             }
          }
        }
        var subst3 = '<td style ="word-break:break-all;">' + edgeInfo[2] + subst+Einfo;
        eTable += subst3;
        
        graphEdges[i] = newEdge;
        // record edge index in GraphEdge structure
        newEdge.edgeListIndex = i;
    }
    
    eTable += '</tbody></table>';
    genEdges = false;
    usingAdjacencyLists = true;

    // if we have travelers, read those in too
    if (haveTravelers) {
        travelerNames = lines[lines.length-2].split(' ');
    }
    hdxAV.setStatus(hdxStates.GRAPH_LOADED);
    return vTable + eTable;
}

// parse the contents of a .gra file
//
// First line specifies the number of vertices, numV, and the number
// of edges, numE
// Next numV lines are a waypoint name (a String) followed by two
// floating point numbers specifying the latitude and longitude
// Next numE lines are vertex numbers (based on order in the file)
// that are connected by an edge followed by a String listing the
// highway names that connect those points
function parseGRAContents(fileContents) {

    var lines = fileContents.replace(/\r\n/g,"\n").split('\n');
    var counts = lines[0].split(' ');
    var numV = parseInt(counts[0]);
    var numE = parseInt(counts[1]);
    var sideInfo = '<table  class="gratable"><thead><tr><th>' + numV + " waypoints, " + numE + " connections.</th></tr></table>";

    var vTable = '<table class="gratable"><thead><tr><th colspan="3">Waypoints</th></tr><tr><th>#</th><th>Coordinates</th><th>Waypoint Name</th></tr></thead><tbody>';

    waypoints = new Array(numV);
    for (var i = 0; i < numV; i++) {
        var vertexInfo = lines[i+1].split(' ');
        waypoints[i] = new Waypoint(vertexInfo[0], vertexInfo[1], vertexInfo[2], "", "");
        vTable += '<tr><td>' + i +
            '</td><td>(' + parseFloat(vertexInfo[1]).toFixed(3) + ',' +
            parseFloat(vertexInfo[2]).toFixed(3) + ')</td><td>'
            + "<a onclick=\"javascript:labelClickHDX(" + i + ");\">"
            + waypoints[i].label + "</a></td></tr>"
    }
    vTable += '</tbody></table>';

    var eTable = '<table class="gratable"><thead><tr><th colspan="3">Connections</th></tr><tr><th>#</th><th>Route Name(s)</th><th>Endpoints</th></tr></thead><tbody>';
    graphEdges = new Array(numE);
    for (var i = 0; i < numE; i++) {
        var edgeInfo = lines[i+numV+1].split(' ');
        graphEdges[i] = new GraphEdge(edgeInfo[0], edgeInfo[1], edgeInfo[2], null);
        eTable += '<tr><td>' + i + '</td><td>' + edgeInfo[2] + '</td><td>'
            + edgeInfo[0] + ':&nbsp;' + waypoints[graphEdges[i].v1].label +
            ' &harr; ' + edgeInfo[1] + ':&nbsp;'
            + waypoints[graphEdges[i].v2].label + '</td></tr>';
    }
    eTable += '</tbody></table>';
    let graphInfo = document.getElementById("graphInfo");
    graphInfo.style.display = "block";
    graphInfo.innerHTML = numV + " vertices, " + numE + " edges";
    genEdges = false;
    hdxAV.setStatus(hdxStates.GRAPH_LOADED);
    return sideInfo + '<p />' + vTable + '<p />' + eTable;
}

// parse the contents of a .wpt file
//
// Consists of a series of lines each containing a waypoint name
// and an OSM URL for that point's location:
//
/*
YT1_S http://www.openstreetmap.org/?lat=60.684924&lon=-135.059652
MilCanRd http://www.openstreetmap.org/?lat=60.697199&lon=-135.047250
+5 http://www.openstreetmap.org/?lat=60.705383&lon=-135.054932
4thAve http://www.openstreetmap.org/?lat=60.712623&lon=-135.050619
*/
function parseWPTContents(fileContents) {

    var lines = fileContents.replace(/\r\n/g,"\n").split('\n');
    graphEdges = new Array();
    waypoints = new Array();
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
            waypoints[waypoints.length] = WPTLine2Waypoint(lines[i]);
        }
    }
    let graphInfo = document.getElementById("graphInfo");
    graphInfo.style.display = "block";
    graphInfo.innerHTML = waypoints.length + " waypoints";
    genEdges = true;
    usingAdjacencyLists = false;
    hdxAV.setStatus(hdxStates.WPT_LOADED);
    return "<h2>wpt file contents:</h2><pre>" + fileContents + "</pre>";
}

// parse the contents of a .pth file
//
// Consists of a series of lines each containing a route name, zero or
// more intermediate points (latitude, longitude pairs), then a
// waypoint name and a latitude and a longitude, all space-separated,
// or a line containing a route name and waypoint name followed by a
// lat,lng pair in parens
//
/*
START YT2@BorRd (60.862343,-135.196595)
YT2 YT2@TakHSRd (60.85705,-135.202029)
YT2 (60.849881,-135.203934) (60.844649,-135.187111) (60.830141,-135.187454) YT1_N/YT2_N (60.810264,-135.205286)
YT1,YT2 (60.79662,-135.170288) YT1/YT2@KatRd (60.788579,-135.166302)
YT1,YT2 YT1/YT2@WannRd (60.772479,-135.15044)
YT1,YT2 YT1/YT2@CenSt (60.759893,-135.141191)
or
START YT2@BorRd 60.862343 -135.196595
YT2 YT2@TakHSRd 60.85705 -135.202029
YT2 60.849881 -135.203934 60.844649 -135.187111 60.830141 -135.187454 YT1_N/YT2_N 60.810264 -135.205286
YT1,YT2 60.79662 -135.170288 YT1/YT2@KatRd 60.788579 -135.166302
YT1,YT2 YT1/YT2@WannRd 60.772479 -135.15044
YT1,YT2 YT1/YT2@CenSt 60.759893 -135.141191
*/
function parsePTHContents(fileContents) {

    var table = '<table class="pthtable"><thead><tr><th>Route</th><th>To Point</th><th>Seg.<br>' + distanceUnits + '</th><th>Cumul.<br>' + distanceUnits + '</th></tr></thead><tbody>';
    var lines = fileContents.replace(/\r\n/g,"\n").split('\n');
    graphEdges = new Array();
    waypoints = new Array();
    var totalMiles = 0.0;
    var segmentMiles = 0.0;
    var previousWaypoint = null;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
            // standardize first
            var line = standardizePTHLine(lines[i]);
            var info = PTHLineInfo(line, previousWaypoint);
            waypoints[waypoints.length] = info.waypoint;
            totalMiles += info.mileage;
            // this will display as a graph, so create and assign the
            // graph edges
            if (previousWaypoint != null) {
                var newEdge = new GraphEdge(i-1, i, info.waypoint.elabel,
                                            null, info.via);
                previousWaypoint.edgeList[previousWaypoint.edgeList.length] = newEdge;
                info.waypoint.edgeList[0] = newEdge;
            }
            previousWaypoint = info.waypoint;
            table += '<tr><td>' + waypoints[waypoints.length-1].elabel +
                "</td><td><a onclick=\"javascript:labelClickHDX(0);\">" +
		waypoints[waypoints.length-1].label +
                '</a></td><td style="text-align:right">' +
		convertToCurrentUnits(info.mileage).toFixed(2) +
                '</td><td style="text-align:right">' +
		convertToCurrentUnits(totalMiles).toFixed(2) + '</td></tr>';
        }
    }
    table += '</tbody></table>';
    let graphInfo = document.getElementById("graphInfo");
    graphInfo.style.display = "block";
    graphInfo.innerHTML = (waypoints.length-1) + "  edges in path";
    genEdges = false;
    usingAdjacencyLists = true;
    hdxAV.setStatus(hdxStates.PTH_LOADED);
    return table;
}

// parse the contents of a .nmp file
//
// Consists of a series of lines, each containing a waypoint name
// followed by two floating point numbers representing the point's
// latitude and longitude
//
// Entries are paired as "near-miss" points, and a graph edge is
// added between each pair for viewing.
//
function parseNMPContents(fileContents) {

    const unmarkedColor = "crimson";
    const fpColor = "#00a000";
    const liColor = "gold";
    var table = '<table class="nmptable"><thead /><tbody>';
    // all lines describe waypoints
    var lines = fileContents.replace(/\r\n/g,"\n").split('\n');
    waypoints = new Array();
    waypointColors = new Array();
    
    let unmarkedCount = 0;
    let fpCount = 0;
    let liCount = 0;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
            var xline = lines[i].split(' ');
            if (xline.length == 3 || xline.length == 4) {
                waypoints[waypoints.length] = new Waypoint(xline[0], xline[1], xline[2], "", "");
                if (xline.length == 3) {
                    waypointColors[waypointColors.length] = unmarkedColor;
		    unmarkedCount++;
                }
                else {
                    if (xline[3] == "FP" || xline[3] == "FPLI") {
                        waypointColors[waypointColors.length] = fpColor;
			fpCount++;
                    }
                    else { // must be "LI"
                        waypointColors[waypointColors.length] = liColor;
			liCount++;
                    }
                }
            }
        }
    }
    // graph edges between pairs, will be drawn as connections
    var numE = waypoints.length/2;
    graphEdges = new Array(numE);
    for (var i = 0; i < numE; i++) {
        // add the edge
        graphEdges[i] = new GraphEdge(2*i, 2*i+1, "", null, null);

        // add an entry to the table to be drawn in the pointbox
        var miles = distanceInMiles(waypoints[2*i].lat, waypoints[2*i].lon,
                                    waypoints[2*i+1].lat,
                                    waypoints[2*i+1].lon).toFixed(4);
        var feet = distanceInFeet(waypoints[2*i].lat, waypoints[2*i].lon,
                                  waypoints[2*i+1].lat,
                                  waypoints[2*i+1].lon).toFixed(2);
        table += "<tr style=\"background-color:" + waypointColors[2*i] +
            ";color:white\"><td><table class=\"nmptable2\"><thead /><tbody><tr><td>"
            + "<a onclick=\"javascript:labelClickHDX(" + 2*i + ");\">"
            + waypoints[2*i].label + "</a></td><td>("
            + waypoints[2*i].lat + ","
            + waypoints[2*i].lon + ")</td></tr><tr><td>"
            + "<a onclick=\"javascript:labelClickHDX(" + (2*i+1) + ");\">"
            + waypoints[2*i+1].label + "</a></td><td>("
            + waypoints[2*i+1].lat + ","
            + waypoints[2*i+1].lon + ")</td></tr>"
            + "</tbody></table></td><td>"
            + miles  + " mi/"
            + feet + " ft</td></tr>";
    }

    table += "</tbody></table>";
    genEdges = false;
    usingAdjacencyLists = true;
    let graphInfo = document.getElementById("graphInfo");
    graphInfo.style.display = "block";
    graphInfo.innerHTML = "# Pairs <span style='color: " + unmarkedColor +
	"'>unmarked: " + unmarkedCount + "</span>, <span style='color: " +
	fpColor + "'>FP: " +
	fpCount + "</span>, <span style='color: " + liColor +
	"'>LI: " + liCount + "</span>";
    hdxAV.setStatus(hdxStates.NMP_LOADED);
    // register the HDX-specific event handler for waypoint clicks
    registerMarkerClickListener(labelClickHDX);
    return table;
}

// parse the contents of a .wpl file
//
// Consists of a series of lines, each containing a waypoint name
// followed by two floating point numbers representing the point's
// latitude and longitude
//
function parseWPLContents(fileContents) {

    var vTable = '<table class="gratable"><thead><tr><th colspan="2">Waypoints</th></tr><tr><th>Coordinates</th><th>Waypoint Name</th></tr></thead><tbody>';

    // all lines describe waypoints
    var lines = fileContents.replace(/\r\n/g,"\n").split('\n');
    waypoints = new Array();
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
            var vertexInfo = lines[i].split(' ');
            if (vertexInfo.length == 3) {
                var w = new Waypoint(vertexInfo[0], vertexInfo[1], vertexInfo[2], "", "");
                waypoints[waypoints.length] = w;
                vTable += '<tr><td>(' + parseFloat(vertexInfo[1]).toFixed(3) + ',' +
                    parseFloat(vertexInfo[2]).toFixed(3) + ')</td><td>'
                    + "<a onclick=\"javascript:labelClickHDX(" + i + ");\">"
                    + w.label + "</a></td></tr>"
            }
        }
    }
    vTable += '</tbody></table>';
    // no edges here
    graphEdges = new Array();
    genEdges = false;
    usingAdjacencyLists = true;
    var summaryInfo = '<table class="gratable"><thead><tr><th>' + waypoints.length + " waypoints.</th></tr></table>";
    let graphInfo = document.getElementById("graphInfo");
    graphInfo.style.display = "block";
    graphInfo.innerHTML = waypoints.length + " points";
    hdxAV.setStatus(hdxStates.WPL_LOADED);
    return summaryInfo + '<p />' + vTable;
}

function WPTLine2Waypoint(line) {

    // remove extraneous spaces in the line
    line = line.replace('  ', ' ');
    line = line.replace('  ', ' ');
    line = line.replace('  ', ' ');
    line = line.replace('  ', ' ');

    var xline = line.split(' ');
    if (xline.length < 2) {
        return Waypoint('bad-line', 0, 0);
    }
    var label = xline[0];
    var url = xline[xline.length-1];
    var latlon = Url2LatLon(url);
    return new Waypoint(label, latlon[0], latlon[1], 0, "");
}

// convert an openstreetmap URL to a latitude/longitude
function Url2LatLon(url) {

    var latlon = new Array(0., 0.);
    var floatpattern = '([-+]?[0-9]*\.?[0-9]+)';
    var latpattern = 'lat=' + floatpattern;
    var lonpattern = 'lon=' + floatpattern;

    //search for lat
    var matches = url.match(latpattern);
    if (matches != null) {
        latlon[0] = parseFloat(matches[1]).toFixed(6);
    }

    //search for lon
    matches = url.match(lonpattern);
    if (matches != null) {
        latlon[1] = parseFloat(matches[1]).toFixed(6);
    }

    return latlon;
}

// "standardize" a PTH line so it has coordinates separated by a space
// instead of in parens and with any extraneous spaces removed
function standardizePTHLine(line) {

    // remove extraneous spaces
    var newline = line;
    do {
        line = newline;
        newline = line.replace('  ',' ');
    } while (line != newline);


    // if this doesn't end in a paren, we should be good
    if (!line.endsWith(')')) {
        return line;
    }

    // this ends in a paren, so we convert each "(lat,lng)" group to
    // simply "lat lng"
    var xline = line.split(' ');
    line = xline[0];
    for (var pos = 1; pos < xline.length; pos++) {
        var newlatlng = xline[pos];
        if ((xline[pos].charAt(0) == '(') &&
            (xline[pos].indexOf(',') > 0) &&
            (xline[pos].charAt(xline[pos].length-1) == ')')) {
            newlatlng = xline[pos].replace('(', '');
            newlatlng = newlatlng.replace(',', ' ');
            newlatlng = newlatlng.replace(')', '');
        }
        line += " " + newlatlng;
    }
    return line;
}

// convert a "standardized" PTH line to a Waypoint object with support
// for intermediate points along a segment
function PTHLine2Waypoint(line) {

    var xline = line.split(' ');
    if (xline.length < 4) {
        return Waypoint('bad-line', 0, 0);
    }
    return new Waypoint(xline[xline.length-3], xline[xline.length-2], xline[xline.length-1], 0, xline[0]);

}

// mileage with a "standardized" PTH line that could have intermediate points
// to include
function mileageWithPTHLine(from, to, line) {

    var xline = line.split(' ');
    if (xline.length == 4) {
        // no intermediate points, so just compute mileage
        return distanceInMiles(from.lat, from.lon, to.lat, to.lon);
    }

    // we have more points, compute sum of segments
    var total = 0.0;
    var last_lat = from.lat;
    var last_lon = from.lon;
    var num_points = (xline.length - 4) / 2;
    for (var i = 0; i < num_points; i++) {
        var this_lat = parseFloat(xline[2*i+1]).toFixed(6);
        var this_lon = parseFloat(xline[2*i+2]).toFixed(6);
        total += distanceInMiles(last_lat, last_lon, this_lat, this_lon);
        last_lat = this_lat;
        last_lon = this_lon;
    }
    total += distanceInMiles(last_lat, last_lon, to.lat, to.lon);
    return total;
}

// parse all useful info from a "standardized" PTH file line and
// return in an object with fields for waypoint (a Waypoint object),
// mileage (a number), and via, an array of lat/lng values the
// path passes through that will be used to construct the edge
// that this line represents in the path
// extra parameter is the previous waypoint for mileage computation
function PTHLineInfo(line, from) {

    var xline = line.split(' ');
    if (xline.length < 4) {
        return {
            waypoint: Waypoint('bad-line', 0, 0),
            mileage: 0.0,
            via: null};
    }
    var result = {
        waypoint: new Waypoint(xline[xline.length-3], xline[xline.length-2],
                               xline[xline.length-1], xline[0], new Array()),
        mileage: 0.0,
        via: null
    };

    if (xline.length == 4) {
        // no intermediate points, so just compute mileage and have a
        // null "via" list
        if (from != null) {
            result.mileage = distanceInMiles(from.lat, from.lon,
                                             result.waypoint.lat,
                                             result.waypoint.lon);
        }
        result.via = null;
    }
    else {
        // we have more points, compute sum of segments
        // and remember our list of lat/lng points in via
        var total = 0.0;
        var last_lat = from.lat;
        var last_lon = from.lon;
        var num_points = (xline.length - 4) / 2;
        for (var i = 0; i < num_points; i++) {
            var this_lat = parseFloat(xline[2*i+1]).toFixed(6);
            var this_lon = parseFloat(xline[2*i+2]).toFixed(6);
            total += distanceInMiles(last_lat, last_lon, this_lat, this_lon);
            last_lat = this_lat;
            last_lon = this_lon;
        }
        total += distanceInMiles(last_lat, last_lon,
                                 result.waypoint.lat, result.waypoint.lon);
        result.mileage = total;
        result.via = xline.slice(1,xline.length-3);
    }
    return result;
}

/**********************************************************************
 * General utility functions
 **********************************************************************/

// print a list to the console
function printList(items) {

    console.log(listToVIndexString(items));
}

// return a String containing the objects in a list
function listToVIndexString(items) {
    if (items.length == 0) {
        return "[]";
    }
    else {
        var line = `[`;
        for (var i = 0; i < items.length; i++) {
            if (i == items.length - 1) {
                line += items[i].vIndex;
            } else {
                line += items[i].vIndex + `, `;
            }       
        }
        line += ` ]`;
        return line;
    }
}

// Compute Squared Distance 
function squaredDistance(o1, o2) {
    var dx, dy;
    dx = o1.lon - o2.lon;
    dy = o1.lat - o2.lat;
    return dx * dx + dy * dy;
}

// these are based on some code by John D. Cook at
// https://www.johndcook.com/blog/2009/04/27/converting-miles-to-degrees-longitude-or-latitude/
// given a distance north, return the change in latitude
function changeInLatitude(miles) {
    return miles / 3963.0 * 180.0 / Math.PI;
}

// given a latitude and a distance west, return the change in longitude
function changeInLongitude(latitude, miles) {

    let r = 3963.0 * Math.cos(latitude * Math.PI / 180.0);
    return (miles/r)*180/Math.PI;
}
