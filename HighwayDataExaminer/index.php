<?php
require (dirname(__FILE__)."/dbConnect.php");

// function to generate the file load html
function hdx_load_file_entries() {
  global $tmdb;
  echo <<<ENDOFSTUFF
	  <tr><td id="selects" class="loadcollapse">
		Load METAL graph: (select filters then press "Get Graph List") <br>
		Sort criteria:
		<select id = "orderOptions">
			<option value = "alpha">Alphabetical</option>
			<option value = "small">Size (small)</option>
			<option value = "large">Size (large)</option>		
		</select>
		<br>
		Graph format:
		<select id = "restrictOptions">
			<option value = "collapsed">Collapsed (most likely you want this)</option>
			<option value = "simple">Simple</option>
			<option value = "all">All</option>		
		</select>
		<br>
		Graph category:
		<select id = "categoryOptions">
				<option value="all">All Graphs</option>
ENDOFSTUFF;
  $result = $tmdb->query("SELECT * FROM graphTypes");

  while ($row = $result->fetch_array()) {
     echo "<option value=\"".$row['category']."\">".$row['descr']."</option>\n";
  }
  $result->close();
  echo <<<ENDOFSTUFF
		</select>
		<br>
		Size from
		<input type="number" min="1" value="1" id="minVertices" style="width:6rem;">
		to 
		<input type="number" min="1" value="2000" id="maxVertices" style="width:6rem;">
		vertices
		<br>
		<input type="button" value="Get Graph List" onclick="fillGraphList(event)">
	  </td>
	  <td id="loadcollapsebtn" style="display:none;">
		<input type="button" onclick="undoCollapse(event)" value="Show Load Options">
	  </td>
	  </tr>	  
      <tr><td class="loadcollapse">
		or upload file:
        <input id="filesel" type="file"  value="Start" onchange="startRead()">
      </td></tr>
ENDOFSTUFF;
}
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>

<head>
    <!--
    Highway Data Examiner (HDX) page
    Load and view data files related to Travel Mapping (TM) related
    academic data sets. (Formerly used Clinched Highway Mapping (CHM)
    data.)
    Author: Jim Teresco, Siena College, The College of Saint Rose
    Modification History:
    2011-06-20 JDT  Initial implementation
    2011-06-21 JDT  Added .gra support and checkbox for hidden marker display
    2011-06-23 JDT  Added .nmp file styles
    2011-08-30 JDT  Renamed to HDX, added more styles
    2013-08-14 JDT  Completed update to Google Maps API V3
    2016-06-27 JDT  Code reorganization, page design updated based on TM
-->


<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link rel="stylesheet" type="text/css" href="http://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css"/>
<link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css"/>
<link rel="stylesheet" type="text/css" href="http://tm.teresco.org/css/travelMapping.css"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style type="text/css">
#controlbox {
  width: 25%;*/
  position: fixed;
  top:50px;
  bottom:100px;
  height:100%;
  left:400px;
  right:0px;
  overflow:auto;
  padding:5px;
}
#map {
  position: absolute;
  top:25px;
  bottom:0px;
  width: 100%;
  overflow:hidden;
}
#map * {
  cursor:crosshair;
}
#selected {
  position: relative;
  overflow: scroll;
  display: inline-block;
  max-width: 50%;
  max-height: 85%;
  width:auto;
  height:auto;
  opacity: .95;  /* also forces stacking order */
}
#pointbox {
  visibility: hidden;
  left: 0px;
  width: 1px;
  height: 1px;
}
#options {
  visibility: hidden;
  left: 0px;
  width: 1px;
  height: 1px;
}
#showHideMenu {
  position: fixed;
  right: 10px;
  opacity: .75;  /* also forces stacking order */
}
#AlgorithmVisualization{
visibility: hidden;
left: 0px;
width: 1px;
height: 1px;
}
#contents_table{
  display: inline-block;
  position: absolute;
  right: 42px;
  top: 70px;
  bottom: 10px;
  overflow: scroll;
  max-width: 50%;
  max-height: 85%;
  opacity: .95;
}
#pseudoTable{
  position: absolute;
  padding: 5px;
  bottom: 150px;
  overflow-y: scroll;
  max-width: 33%;
  opacity: .95;
}
#graphList{
width:150px;
}
table.dataTable tbody td{
padding:0px;
}
#menuIcon{
	padding: 0px;
	margin: 0px;
	top: 1px;
	position: fixed;
	display: inline-block;
	border: none;
	color: white;
}
#panelBtn {
	padding: 0px;
	margin: 0px;
	top: 3px;
	left: 10px;
	position: fixed;
	display: inline-block;
	text-align: center;
	border: none;
	text-decoration: none;
	z-index: 10;
}
#menuIcon:hover {
		color: lightgrey;
}
#sidePanel {
    height: 100%;
    width: 0;
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    background-color: #111;
    overflow-x: hidden;
    transition: 0.5s;
    padding-top: 60px;
}

#sidePanel a {
    padding: 8px 8px 8px 32px;
    text-decoration: none;
    font-size: 25px;
    color: #818181;
    display: block;
    transition: 0.3s;
}
#sidePanel a:hover, .offcanvas a:focus{
    color: #f1f1f1;
}

.sidePanel .closeButton {
    position: absolute;
    top: 0;
    right: 25px;
    font-size: 36px;
    margin-left: 50px;
}

@media screen and (max-height: 450px) {
  .sidePanel {padding-top: 15px;}
  .sidePanel a {font-size: 18px;}
}
#togglecontents_table{
	position: absolute;
	top: 35px;
}
#toggleselected{
	position: absolute;
	top: 35px;
}

/** Psudocode CSS */
.highlight {
    background-color: yellow;
}
.for1{}
.for2{}
.for3{}
.if1{}
.if2{}

.box {
  	display: inline-block;
  	height: 20px;
  	width: 20px;
	border: 2px solid;
}
#contentArea_legend{
	background-color: white;
}
#boxContainer{
	padding-left: 30px;
}
</style>
  <link rel="stylesheet" href="/leaflet/leaflet.css" />
  <script src="/leaflet/leaflet.js"></script>
  <script src="/leaflet/leaflet-providers.js"></script>
  <script type="text/javascript" src="http://maps.stamen.com/js/tile.stamen.js?v1.3.0"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
<script
 src="http://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"
  type="text/javascript"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet">
<link rel="stylesheet" href="/leaflet/BeautifyMarker/leaflet-beautify-marker-icon.css">
<script src="/leaflet/BeautifyMarker/leaflet-beautify-marker-icon.js"></script>
<!-- config file to find libs from a TM installation -->
<?php
  $hdxconffile = fopen("hdx.conf", "r");
  $tmliburl = chop(fgets($hdxconffile));
  echo "<script type=\"application/javascript\">";
  echo "var tmliburl = \"$tmliburl\";";
  echo "</script>\n";
  fclose($hdxconffile);
?>
<!-- load in needed JS functions -->
<?php
  echo "<script src=\"".$tmliburl."tmjsfuncs.js\" type=\"text/javascript\"></script>\n";
?>
<script src="hdxjsfuncs.js" type="text/javascript"></script>
<title>Highway Data Examiner</title>
</head>
<body onload="loadmap(); hdxAV.initOnLoad();" ondragover="allowdrop(event)" ondrop="drop(event)">
<p class="menubar">
  <span id="panelBtn" title="Menu" onclick="openSidePanel()">
     <i id="menuIcon" class="material-icons">menu</i>
  </span>
  HDX: <span id="filename">Select a file to display</span>
  <span id="status"></span>
</p>
<div id="map">
</div>
<input type="button" id="togglecontents_table" value="Hide Table" style="left:100px; top:25px; opacity:.75; position:absolute; z-index:2000; padding:0;" onclick="toggleUI(event)">
<input type="button" id="toggleselected" value="Hide Panel" style="left:180px; top:25px; opacity:.75; position:absolute; z-index:2000; padding:0;" onclick="toggleUI(event)">
<!-- commented out until this system can be reworked
<select id="distUnits" style="position:absolute; left:100px; top:48px; width: 7rem; z-index:2;" onchange="changeUnits(event)">
	<option value="miles">Miles</option>
	<option value="km">Kilometers</option>
	<option value="feet">Feet</option>
	<option value="meters">Meters</option>
</select>
-->
<div id="selected" draggable="true"  ondragstart="drag(event)" style="left:10px; top:70px; position:absolute; z-index:2000;">

</div>
<div id="options">
  <table id="optionsTable" class="gratable">
    <thead>
      <tr><th>Load/Map Options</th></tr>
    </thead>
    <tbody>
      <?php hdx_load_file_entries(); ?>
      <tr><td>
        <input id="showHidden" type="checkbox" name="Show Hidden Markers" onclick="showHiddenClicked()" checked="false">&nbsp;Show Hidden Markers
      </td></tr>
    </tbody>
  </table>
</div>
<div id="pointbox">
  No data loaded....
</div>
<div id="AlgorithmVisualization" position: absolute; z-index:9999;>
    <form name="algVis" action="#">
  <table class="gratable">
    <thead>
      <tr><th>Algorithm Vizualization Control Panel</th></tr>
    </thead>
    <tbody id="AVControlPanel">
      <?php hdx_load_file_entries(); ?>
      <tr><td>
        Algorithm to Visualize:
        <select id="AlgorithmSelection" onchange="algorithmSelected()" disabled>
	<!-- filled in with options by JS code in hdxAV.initOnLoad() -->
        </select>

      </td></tr>
      <tr><td id="algorithmOptions"></td></tr>
      <tr id="speedtr"><td>
        <button id="startPauseButton" type="button" onclick="startPausePressed()" disabled>Start</button>
        <select id="speedChanger" onchange="speedChanged()">
		<option value="0">Run To Completion</option>
          <option value="1">Fastest possible</option>
          <option value="5">Extremely fast</option>
          <option value="20">Very fast</option>
          <option value="50" selected>Fast</option>
          <option value="100">Medium speed</option>
          <option value="250">Pretty slow</option>
          <option value="500">Slow</option>
          <option value="1000">Painfully slow</option>
		  <option value="-1">Step</option>
        </select>

      </td></tr>
      <tr><td id="pseudo"><input id="pseudoCheckbox" type="checkbox" name="Show selected algorithm pseudocode" onclick="showHidePseudocode()" >&nbsp;Pseudocode<br><span id="pseudoText" style="display:none;">Select an algorithm to view pseudocode.</span></td></tr>
      <tr><td id="algorithmStatus"></td></tr>
      </tbody>
      </table>
        <input type="button" value="Reset AV" onClick="clearForm(this.form)"/>
    </form>
    </div>

    <div id="controlbox" style="z-index:2000;">
        <select id="showHideMenu" onchange="toggleTable();">
           <!-- <option value="maponly">Map Only</option>-->
            <option value="options" >Show/Load Map Options</option>
            <option value="pointbox">Show Highway Data</option>
            <option value= "AlgorithmVisualization" selected="selected">Show Algorithm Visualization</option>
          </select>

        </div>
        <div id="contents_table" draggable="true"  ondragstart="drag(event)" style="top:70px; left:70%; position: absolute; z-index:9999;">
        </div>
        </body>
</html>
<?php $tmdb->close(); ?>
