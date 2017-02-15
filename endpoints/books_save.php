<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 10/7/15
 * Time: 2:18 p.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $requestArray = json_decode($postdata, true);

    $info = $requestArray['info'];

    $rawSQL = '';
    foreach($requestArray['books'] as $request) {
        $firstname = isset($request['firstname']) ? "firstname = '" . $request['firstname'] . "', " : '';
        $lastname = isset($request['lastname']) ? "lastname = '" . $request['lastname'] . "', " : '';
        $email = isset($request['email']) ? "email = '" . $request['email'] . "', " : '';
        $phone = isset($request['phone']) ? "phone = '" . $request['phone'] . "', " : '';

        $dob = '';
        if (isset($request['dob'])) {
            $dobdate = new DateTime($request['dob']);
            $dob = $dobdate->format('Y-m-d');
            $dob = "dob = '$dob', ";
        }

        $weight = isset($request['weight']) ? "weight = '" . $request['weight'] . "', " : '0';
        $groupid = isset($request['groupid']) ? "groupid = '" . $request['groupid'] . "', " : '';
        $deposit = isset($request['deposit']) ? "deposit = " . $request['deposit'] . ", " : '';
        $dni = isset($request['dni']) ? "dni = '" . $request['dni'] . "', " : '';
        $deleted = isset($request['deleted']) ? $deleted = "deleted = " . $request['deleted'] . ", " : '';
        $jumptypeid = isset($request['jumptypeid']) ? "jumptypeid = " . $request['jumptypeid'] . ", " : '';

        $toUpdate = rtrim($firstname . $lastname . $email . $phone . $dob . $weight . $groupid . $deposit . $dni . $deleted . $jumptypeid, ', ');
        $rawSQL .= "UPDATE tandem_bookings SET " . $toUpdate . " WHERE id = " . $request['id'] . ";";
    }

    mysqli_set_charset($conn, "utf8");
    $result = $conn->multi_query($rawSQL);
    if (!empty($conn->error)) {
        $error = array('error' => 'error',
            'dump' => $rawSQL);
        print json_encode($error);
        die();
    };

    $creator = $info['creator'];
    $pusher_date = isset($info['querydate']) ? $info['querydate'] : '';
    include('pusher.php');

};

?>