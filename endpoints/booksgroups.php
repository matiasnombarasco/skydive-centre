<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 10/7/15
 * Time: 2:18 p.m.
 */

//here are you db data tronco
/*
$servername = "mysql.paracaidismorosario.com";
$username = "paracaidismo";
$password = "Mailg0syst3ms";
$db = "reservas_paracaidismo";
*/
$servername = "127.0.0.1";
$username = "root";
$password = "mailgo";
$db = "reservas_paracaidismo";

$requestParts = explode(':', $_GET['groupid']);

//if(count($requestParts) > 1)
//{
$groupid = $requestParts[0];

//}
// Create connection
$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case "POST":
        //hack para php para poder tener los datos del payload
        $postdata = file_get_contents("php://input");
        $request = json_decode($postdata);

        if (isset($request->bookdate)) {
            $bookdate = $request->email;
        }
        if (isset($request->time)) {
            $booktime = $request->time;
        }

        if (isset($request->groupid) && $request->groupid > 0) {
            $rawSql = "";
        } else {
            $rawSql = "";
        }
        break;
    case "DELETE":
        $rawSql = "DELETE FROM tandem_bookings where id = " . $groupid;
        break;
    default:
        if (isset($_GET["groupid"])) {
            $rawSql = "SELECT * FROM group_bookings WHERE groupid = '" . $groupid . "'";
        }
        break;
}

$result = $conn->query($rawSql);
if (!empty($conn->error)) {
    die($conn->error);
}
header('Content-Type: application/json');
if (!empty($result->num_rows) && $result->num_rows > 0) {
    // output the result object as an array and the make it json! and echo it, so u can see it in the screen.
    while ($r = mysqli_fetch_assoc($result)) {
        $rows[] = array(
            'groupid' => $r['groupid'],
            'bookdate' => $r['date'],
            'booktime' => $r['time']);
    }
    print json_encode($rows);
}
?>
