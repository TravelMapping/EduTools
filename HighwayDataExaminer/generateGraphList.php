<?
// read information about graphs from our DB
$params = json_decode($_POST['params'], true);

// need to buffer and clean output since tmphpfuncs generates
// some output that breaks the JSON output
ob_start();
require "tmlib/tmphpfuncs.php";
ob_end_clean();

// DB connection made, now make our request
$response = array('text'=>array(), 'values'=>array(), 'vertices'=>array(), 'edges'=>array());

$orderBy = "vertices DESC"; // when $params['order'] == "large"

if ($params['order'] == "alpha") {
    $orderBy = "descr ASC";
}
else if ($params['order'] == "small") {
    $orderBy = "vertices ASC";
}

if ($params['graphSet'] == "current") {
    $result = tmdb_query("SELECT * FROM graphs ORDER BY ".$orderBy);
}
else { // must be some other graphSet
    $result1 = tmdb_query("SELECT setName FROM graphArchiveSets");
    $matched = 0;
    while ($row = $result1->fetch_array()) {
        if ($row['setName'] == $params['graphSet']) {
	    $result = tmdb_query("SELECT * FROM graphArchives WHERE setName='".$params['graphSet']."' ORDER BY ".$orderBy);
	    $matched = 1;
	    break;
	}
    }
    $result1->free();
    if ($matched == 0) {
       // we didn't find a match, use current set
       $result = tmdb_query("SELECT * FROM graphs WHERE format='collapsed' ORDER BY ".$orderBy);
    }
}

while ($row = $result->fetch_array()) {
    // check format
    if (($params['restrict'] == "all") ||
        ($params['restrict'] == $row['format'])) {
        // check size
	if (($row['vertices'] >= $params['min']) &&
	    ($row['vertices'] <= $params['max'])) {
            // check category
	    if (($params['category'] == "all") ||
                ($params['category'] == $row['category'])) {
                array_push($response['text'], $row['descr']);
                array_push($response['values'], $row['filename']);
                array_push($response['vertices'], $row['vertices']);
                array_push($response['edges'], $row['edges']);
            }
	}
    }
}

$result->free();
$tmdb->close();
echo json_encode($response);
?>