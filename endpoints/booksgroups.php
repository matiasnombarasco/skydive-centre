<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 10/7/15
 * Time: 2:18 p.m.
 */

//session_start();

//if (isset($_SESSION['username'])) {


    include 'config.php';

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

            $fieldupdate = '';

            if (isset($request->notes)) {
                $fieldupdate .= "notes='" . $request->notes . "',";
            }

            if (isset($request->bookdate)) {
                $fieldupdate .= "date ='" . $request->bookdate . "',";
            }

            if (isset($request->selectedTime)) {
                $fieldupdate .= "booking_datetime_id = " . $request->selectedTime . ",";
                //var_dump($request->selectedTime);
            }

            $fieldupdate = rtrim($fieldupdate, ',');

            $rawSql = "UPDATE group_bookings SET " . $fieldupdate . " WHERE groupid='" . $groupid . "';";

            $result = $conn->query($rawSql);
            if (!empty($conn->error)) {
                die($conn->error);
            }

            $pusher_date = isset($request->bookdate) ? $request->bookdate : '';
            include('pusher.php');

            break;
        default:
            if (isset($_GET["groupid"])) {
                $rawSql = "SELECT * FROM group_bookings WHERE groupid = '" . $groupid . "'";
            }

            $result = $conn->query($rawSql);
            if (!empty($conn->error))
            {
                die($conn->error);
            };

            if (!empty($result->num_rows) && $result->num_rows > 0)
            {
                // output the result object as an array and the make it json! and echo it, so u can see it in the screen.
                while ($r = mysqli_fetch_assoc($result))
                {
                    $bookdate = isset($r['date']) ? $r['date'] : '';
                    $bookdate = ($bookdate == '0000-00-00') ? '' : $bookdate;

                    $rows[] = array(
                        'groupid' => $r['groupid'],
                        'bookdate' => $bookdate,
                        'schtime' => isset($r['schtime']) ? $r['schtime'] : '',
                        'selectedTime' => isset($r['booking_datetime_id']) ? $r['booking_datetime_id'] : '0',
                        'notes' => isset($r['notes']) ? $r['notes'] : '',
                        'booking_datetime' => isset($r['booking_datetime']) ? $r['booking_datetime'] : '',
                        'mpurl' => isset($r['mpurl']) ? $r['mpurl'] : ''
                    );

                };
                print json_encode($rows, JSON_NUMERIC_CHECK);
            };
            break;
    }




//}

?>
