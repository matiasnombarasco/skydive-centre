<?php

include 'config.php';

$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    $error = array('error' => 'error');
    print json_encode($error);
    die();
}

$postdata = file_get_contents("php://input");
$request = json_decode($postdata, false);

$groupid = $request->groupid;
$bookdate = $request->bookdate;
$selectedTime = '0';
$booktime = '';

$rawSQL = "INSERT INTO group_bookings (groupid, date, booking_datetime, mpurl) VALUES ('" . $groupid . "','" . $bookdate . "',' " . date("Y-m-d H:i:s") . " ','');";
$rawSQL = $rawSQL . "INSERT INTO tandem_bookings VALUES ";



$id = '0';
$email = "";
$phone = "";
$dob = "NULL";
$weight = "NULL";
$deleted = '0';
$dni = '0';

if (isset($request->email)) {
    $email = $request->email;
}
if (isset($request->phone)) {
    $phone = $request->phone;
}

if (isset($request->dob)) {
    $dob = "'" . $request->dob . "'";
}

if ((isset($request->weight)) && ($request->weight) != '') {
    $weight = "'" . $request->weight . "'";
}

if ((isset($request->dni)) && ($request->dni) != '')  {
    $dni = $request->dni;
}

if (isset($request->jumptypeid))  {
    $jumptypeid = $request->jumptypeid;
}


$rawSQL = $rawSQL . "(0, '" .
    $request->firstname . "', '" .
    $request->lastname . "', '" .
    $email . "', '" .
    $phone . "', " .
    $dob . ", " .
    $weight . ", '" .
    $groupid . "', " .
    "0," . $deleted . ",'Y','N',0,'0','$dni',$jumptypeid)";

var_dump($rawSQL);
if (!$conn->multi_query($rawSQL)) {
    $error = array('error' => 'error',
        'dump' => $rawSQL);
    print json_encode($error);
    die();
};

$creator = $request->creator;
$pusher_date = isset($bookdate) ? $bookdate : '';
include('pusher.php');

