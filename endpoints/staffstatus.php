<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 3/4/16
 * Time: 10:03 p.m.
 */

session_start();

if (isset($_SESSION['username']))
{

include 'config.php';

$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


switch ($_SERVER['REQUEST_METHOD']) {
    case "POST":
        $postdata = file_get_contents("php://input");
        $request = json_decode($postdata, false);

        if ($request->loggedin)
            $loggedin = 1;
        else
        {
            $loggedin = 0;
        }

        $rawSql = "UPDATE tandem_bookings SET loggedin = " . $loggedin . " WHERE id = " . $request->id . ";";

        break;

    default:
        $rawSql = "SELECT * FROM tandem_bookings WHERE isTandemInstructor = 'Y';";
        $rows = array();
}

$result = $conn->query($rawSql);
if (!empty($conn->error)) {
    die($conn->error);
}

if (!empty($result->num_rows) && $result->num_rows > 0) {
    while ($r = mysqli_fetch_assoc($result)) {
        if ($r['loggedin'] == 0) {
            $loggedin = false;
        }
        else
        {
            $loggedin = true;
        }
        $rows[] = array(
            'id' => $r['id'],
            'firstname' => $r['firstname'],
            'lastname' => $r['lastname'],
            'loggedin' => $loggedin);
    }
    print json_encode($rows);
}



}

?>
