<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>

<head>
    <!--
    Highway Data Examiner (HDX) page
    Load and view data files related to Travel Mapping (TM) related
    academic data sets. (Formerly used Clinched Highway Mapping (CHM)
    data.)
    Primary Author: Jim Teresco, Siena College, The College of Saint Rose
    Additional authors: Razie Fathi, Arjol Pengu, Maria Bamundo, Clarice Tarbay,
        Michael Dagostino, Abdul Samad, Eric Sauer, Spencer Moon
    (Pre-git) Modification History:
    2011-06-20 JDT  Initial implementation
    2011-06-21 JDT  Added .gra support and checkbox for hidden marker display
    2011-06-23 JDT  Added .nmp file styles
    2011-08-30 JDT  Renamed to HDX, added more styles
    2013-08-14 JDT  Completed update to Google Maps API V3
    2016-06-27 JDT  Code reorganization, page design updated based on TM
-->
<title>Highway Data Examiner</title>
<?php

  if (!file_exists("tmlib/tmphpfuncs.php")) {
    echo "<h1 style='color: red'>Could not find file <tt>".__DIR__."/tmlib/tmphpfuncs.php</tt> on server.  <tt>".__DIR__."/tmlib</tt> should contain or be a link to a directory that contains a Travel Mapping <tt>lib</tt> directory.</h1>";
    exit;
  }

 require "tmlib/tmphpfuncs.php";


?>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet">
<link rel="stylesheet" href="/leaflet/BeautifyMarker/leaflet-beautify-marker-icon.css">

<link rel="icon" type="image/png" href="MetalBetaLogoSmall.png">
<!-- bring in common JS libraries from TM for maps, etc. -->
<?php tm_common_js(); ?>
<script src="/leaflet/BeautifyMarker/leaflet-beautify-marker-icon.js"></script>
<!-- load in needed JS functions -->
<?php
  if (!file_exists("tmlib/tmjsfuncs.js")) {
    echo "<h1 style='color: red'>Could not find file <tt>".__DIR__."/tmlib/tmpjsfuncs.js</tt> on server.  <tt>".__DIR__."/tmlib</tt> should contain or be a link to a directory that contains a Travel Mapping <tt>lib</tt> directory.</h1>";
    exit;
  }

?>

<?php
$result = tmdb_query("SELECT * FROM graphTypes");

  echo '<script type="text/javascript">
  		var categoryOptions = [];
		var labels = [];
		';
  while ($row = $result->fetch_array()) {
	 echo 'categoryOptions.push("'.$row['category'].'");';
	 echo 'labels.push("'.$row['descr'].'");';
  }
  echo '</script>';

  $result->free();
?>

<script src="https://cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.11.1/typeahead.jquery.min.js"></script>
<script src="tmlib/tmjsfuncs.js" type="text/javascript"></script>
<script src="hdxjsfuncs.js" type="text/javascript"></script>
<script src="hdxqs.js" type="text/javascript"></script>
<script src="hdxinit.js" type="text/javascript"></script>
<script src="hdxmenufuncs.js" type="text/javascript"></script>
<script src="hdxav.js" type="text/javascript"></script>
<script src="hdxbreakpoints.js" type="text/javascript"></script>
<script src="hdxcallbacks.js" type="text/javascript"></script>
<script src="hdxvisualsettings.js" type="text/javascript"></script>
<script src="hdxcustomtitles.js" type="text/javascript"></script>
<script src="hdxavcp.js" type="text/javascript"></script>
<script src="hdxvertexselector.js" type="text/javascript"></script>
<script src="hdxhover.js" type="text/javascript"></script>
<script src="hdxpseudocode.js" type="text/javascript"></script>
<script src="hdxnoav.js" type="text/javascript"></script>
<script src="hdxvertexextremesav.js" type="text/javascript"></script>
<script src="hdxedgeextremesav.js" type="text/javascript"></script>
<script src="hdxextremepairsav.js" type="text/javascript"></script>
<script src="hdxtravspanavs.js" type="text/javascript"></script>
<script src="hdxbfchav.js" type="text/javascript"></script>
<script src="hdxlinear.js" type="text/javascript"></script>
<script src="hdxpresort.js" type="text/javascript"></script>
<script src="hdxgraphsearchbox.js" type="text/javascript"></script>
<script src="hdxapclosestpts.js" type="text/javascript"></script> <!-- Mark V's all pairs closest points-->
<script src="hdxkruskalav.js" type="text/javascript"></script>
<script src="hdxdegreeav.js" type="text/javascript"></script>
<script src="hdxdfsrecav.js" type="text/javascript"></script>
<script src="hdxclosestpairsrecav.js" type="text/javascript"></script>
<script src="hdxquadtreeav.js" type="text/javascript"></script>
<script src="rainbowvis.js" type="text/javascript"></script>
<script src="hdxorderingav.js" type="text/javascript"></script>
<script src="hdxbftravelav.js" type="text/javascript"></script>
<script src="hdxtwicearoundtreeav.js" type="text/javascript"></script>
<script src="hdxsimplebridgeav.js" type="text/javascript"></script>
<link rel="stylesheet" type="text/css" href="supplmentalTypeAhead.css"/>

<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css"/>
<link rel="stylesheet" type="text/css" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css"/>
<link rel="stylesheet" type="text/css" href="https://travelmapping.net/css/travelMapping.css"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="hdx.css" />
</head>

<body onload="HDXInit();" ondragover="allowdrop(event)" ondrop="drop(event)" style="background-color: rgb(47, 47, 47)" id="theBody">
<!-- 
If the window gets too small to be used reasonably, this div 
will display 
-->
<div id="sizeError">
  Window must be enlarged
</div>
<!-- Bar across the top -->
<div class="menubar">
  <div id="info">
    <button id="newGraph">New Graph</button><span id="filename"></span><br>
    <button id="newAlg">New Algorithm</button><span id="currentAlgorithm" onclick="resetPressed();cleanupBreakpoints();cleanupAVControlPanel()"></span>
  </div>
  <div id="topControlPanel">
    <table id="topControlPanelTable">
      <tbody>
	<tr>
	  <td id="topControlPanelAV1">
	    <button id="startPauseButton" type="button" onclick="startPausePressed()">Start</button>
	  </td><td id="topControlPanelAV2">
	    <select id="speedChanger" onchange="speedChanged()">
	      <optgroup label="Run Options">
		<!-- entries in this group must match conditional in
		     speedChanged -->
		<option value="0">1 Update/sec</option>
		<option value="0">15 Updates/sec</option>
		<option value="0">60 Updates/sec</option>
	      </optgroup>
	      <optgroup label="Step-By-Step Options">
		<option value="1">Max Step-by-Step Speed</option>		
		<option value="40">Very Fast</option>
		<option value="75" selected>Fast</option>
		<option value="225">Medium</option>
		<option value="675">Slow</option>
		<option value="2000">Very Slow</option>
		<option value="-1">Single Step</option>
	      </optgroup>
	    </select>
	  </td><td>
	    <div id="topControlPanelAV3">
	      <input id="showMarkers" type="checkbox" name="Show Markers" onclick="showMarkersClicked()" checked />&nbsp;Show Markers<br>
	      <span id="topControlPanelPseudo"><input id="pseudoCheckbox" type="checkbox" name="Pseudocode-level AV" checked onclick="showHidePseudocode();cleanupBreakpoints()" />&nbsp;Trace Pseudocode<br></span>
	      <input id="datatablesCheckbox" type="checkbox" name="Datatables" checked onclick="showHideDatatables()" />&nbsp;Show Data Tables
	    </div>	  
	  </td>
	</tr>
      </tbody>
    </table>
  </div>
  <div id="title">
    <p id="metalTitle">METAL&nbsp;HDX</p>
  </div>
</div>

<!-- The Leaflet map will go in this div -->
<div id="map"></div>

<!-- The number of vertices and edges will go in this div -->
<div id="graphInfo"></div>

<!-- This div will be used for the load data windows -->
<div id="loadDataPanel"></div>

<!-- Left-side panel that will appear when AV selection is active -->
<div id="algorithmSelectionPanel" style="display=none;">
  <table id="algorithmSelectionPanelTable" style="display=none;" class="gratable">
    <thead>
      <tr><th>Select Algorithm</th></tr>
    </thead>
    <tbody>
      <tr>
	<td>
	  <select id="AlgorithmSelection" onchange="algorithmSelectionChanged()">
	    <!-- filled in with options by JS code in hdxAV.initOnLoad() -->
	  </select>
	</td>
      </tr>
      <tr>
	<td id="algorithmOptions"></td>
      </tr>
      <tr>
	<td>
	  <p id="algDescription">
	    Insert description here.
	  </p>
	</td>
      </tr>
      <tr>
	<td>
	  <input type="button" value="Visualize" id="algOptionsDone" onClick="algOptionsDonePressed(); createVariableSelector();">
	</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Left-side AV status panel when an AV is selected -->
<div id="avStatusPanel">
  <table id="avStatusTable" class="gratable">
    <thead><tr><th>Algorithm Visualization Status</th></tr><thead>
      <tbody id="algorithmVars">
	<tr><td id="algorithmStatus"></td></tr>
	
	<tr>
	  <td id="pseudo">
	    <p id = "pscode" style="display:none;">Pseudocode</p>
	    <span id="pseudoText" style="display:none;">Select an algorithm to view pseudocode.</span>
	  </td>
	</tr>
      </tbody>
  </table>
</div>

</div>
<div id="datatable" draggable="false"  ondragstart="drag(event)">
</div>
</body>
</html>
<?php tmdb_close();?>
