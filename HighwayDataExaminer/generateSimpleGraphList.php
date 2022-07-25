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
else { // must be some other graphSet
    $result = tmdb_query("SELECT * FROM graphArchives WHERE format='collapsed' AND setName='".$params['graphSet']."' ORDER BY vertices ASC");
}


while ($row = $result->fetch_array()) {

    array_push($response['filenames'], $row['filename']);
    $descr = $row['filename']." - ".$row['descr']." (".$row['vertices'].", ".$row['edges'].") ".$tmdbname;
    array_push($response['descriptions'], $descr);
}

$result->free();
$tmdb->close();
echo json_encode($response);
?>