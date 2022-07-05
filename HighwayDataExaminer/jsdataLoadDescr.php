<?php
// PHP for loading the list of graph descriptions for the HDX search box
//
// Script written by Michael Dagostino
//connect to the db
$tmconffile = fopen($_SERVER['DOCUMENT_ROOT']."/metal/lib/tm.conf", "r");
$tmdbname = chop(fgets($tmconffile));
$tmdbuser = chop(fgets($tmconffile));
$tmdbpasswd = chop(fgets($tmconffile));
$tmdbhost = chop(fgets($tmconffile));
fclose($tmconffile);

// make the connection
//echo "<!-- mysqli connecting to database ".$tmdbname." on ".$tmdbhost." -->\n";
mysqli_report(MYSQLI_REPORT_STRICT);
try {
    $tmdb = new mysqli($tmdbhost, $tmdbuser, $tmdbpasswd, $tmdbname);
	
}
catch ( Exception $e ) {
   echo "<h1 style='color: red'>Failed to connect to database ".$tmdbname." on ".$tmdbhost." Please try again later.</h1>";
   exit;
}

$descr_query = "SELECT * FROM graphs WHERE format='collapsed' ORDER BY descr";
$result = mysqli_query($tmdb, $descr_query);
$descr = array();

	while($row = mysqli_fetch_array($result))
	{
		$descr[] = str_replace("''","","$row[1]")." ".$row[0];
	}
	$descr_objects = json_encode($descr);
	echo $descr_objects;




	
	
	
	
	

?>