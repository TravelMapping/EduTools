<?php
// PHP for loading the list of graphs for the HDX search box

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

$filename_descr_query = "SELECT * FROM graphs where format='collapsed' ORDER BY descr";
$result2 = mysqli_query($tmdb, $filename_descr_query);
$graphs = array();

while($row = mysqli_fetch_array($result2)) {
    $graphs[str_replace("''","","$row[1]")." ".$row[0]] = $row[0];
}
$graphs_objects = json_encode($graphs);
echo $graphs_objects;
?>
