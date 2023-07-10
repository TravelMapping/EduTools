<?
// read information about graphs from our DB
$params = json_decode($_POST['params'], true);

// need to buffer and clean output since tmphpfuncs generates
// some output that breaks the JSON output
ob_start();
require "tmlib/tmphpfuncs.php";
ob_end_clean();

// responses will go here
$response = array('filenames'=>array(), 'descriptions'=>array());

// make our request
if ($params['graphSet'] == "current") {
    $result = tmdb_query("SELECT * FROM graphs WHERE format='collapsed' ORDER BY descr ASC");
}
else { // must be some other graphSet, but make sure it's a valid one
    $result1 = tmdb_query("SELECT setName FROM graphArchiveSets");
    $matched = 0;
    while ($row = $result1->fetch_array()) {
        if ($row['setName'] == $params['graphSet']) {
	    $result = tmdb_query("SELECT * FROM graphArchives WHERE format='collapsed' AND setName='".$params['graphSet']."' ORDER BY vertices ASC");
	    $matched = 1;
	    break;
	}
    }
    $result1->free();
    if ($matched == 0) {
       // we didn't find a match, use current set
       $result = tmdb_query("SELECT * FROM graphs WHERE format='collapsed' ORDER BY descr ASC");
    }
}


while ($row = $result->fetch_array()) {

    array_push($response['filenames'], $row['filename']);
    $descr = $row['filename']." - ".$row['descr']." (".$row['vertices'].", ".$row['edges'].") ";
    array_push($response['descriptions'], $descr);
}

$result->free();
$tmdb->close();
echo json_encode($response);
?>