<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 2/25/16
 * Time: 11:51 a.m.
 */

session_start();

if (isset($_SESSION['username'])) {

    include 'config.php';

    //$requestParts = explode(':', $_GET['id']);

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

//$date = $request->date;
    if (isset($_GET["date"]))
    {
        $date = $_GET["date"];
    }

    $rawSQL = "SELECT LoadsCustomers.loadnumber, LoadsCustomers.customerName, TIname, LoadsCustomers.date, LoadsCustomers.altitude
FROM
(SELECT vloads.id, vloads.loadnumber, CONCAT_WS(' ', tandem_bookings.firstname, tandem_bookings.lastname ) AS customerName, vloads.date, vloads.altitude FROM
(SELECT CustomerTI.id, loads.date, loads.loadnumber, CustomerTI.customer, CustomerTI.TI, loads.altitude FROM
(SELECT TLtable.id, loadid, customer, TI FROM
(SELECT skydiverid as TI, loads_skydivers.id as id, loadid FROM loads_skydivers WHERE LEFT(jumptype,2) = 'TI') AS TItable,
(SELECT skydiverid as customer, loads_skydivers.id as id FROM loads_skydivers WHERE LEFT(jumptype,2) = 'TL') AS TLtable
WHERE TItable.id = TLtable.id) AS CustomerTI, loads
WHERE CustomerTI.loadid = loads.loadid) as vloads, tandem_bookings
WHERE tandem_bookings.id = vloads.customer) AS LoadsCustomers
,
(SELECT vloads.id, vloads.loadnumber, CONCAT_WS(' - ',tandem_bookings.firstname,jumptype) as TIname,  vloads.date FROM
(SELECT CustomerTI.id, loads.date, loads.loadnumber, CustomerTI.customer, CustomerTI.TI, CustomerTI.jumptype, loads.altitude FROM
(SELECT TLtable.id, loadid, customer, TI, jumptype FROM
(SELECT skydiverid as TI, loads_skydivers.id as id, loadid, jumptype FROM loads_skydivers WHERE LEFT(jumptype,2) = 'TI') AS TItable,
(SELECT skydiverid as customer, loads_skydivers.id as id FROM loads_skydivers WHERE LEFT(jumptype,2) = 'TL') AS TLtable
WHERE TItable.id = TLtable.id) AS CustomerTI, loads
WHERE CustomerTI.loadid = loads.loadid) as vloads, tandem_bookings
WHERE tandem_bookings.id = vloads.TI) AS LoadsTI

WHERE LoadsCustomers.id = LoadsTI.id AND LoadsCustomers.date = '$date' ORDER BY LoadsCustomers.loadnumber, LoadsCustomers.customerName";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    $rows[] = array();
    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rows[] = array(
                'loadnumber' => $r['loadnumber'],
                'customerName' => $r['customerName'],
                'TIname' => $r['TIname'],
                'altitude' => $r['altitude']
            );
        }
    }
    print json_encode($rows);
}

?>

