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

if ($params['order'] == "alpha") {
    $result = tmdb_query("SELECT * FROM graphs ORDER BY descr ASC");
}
else if ($params['order'] == "small") {
    $result = tmdb_query("SELECT * FROM graphs ORDER BY vertices ASC");
}
else {  // $params['order'] == "large"
    $result = tmdb_query("SELECT * FROM graphs ORDER BY vertices DESC");
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