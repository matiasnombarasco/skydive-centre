<?php

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';
    $conn = new mysqli($servername, $username, $password, $db);
    if ($conn->connect_error) {die("Connection failed: " . $conn->connect_error);}
    $postdata = file_get_contents("php://input");
    $requestArray = json_decode($postdata, false);

    $info = $requestArray->info;

    $rawSql = '';
    foreach($requestArray->BooksGroups as $request) {
        $groupid = $request->groupid;
        $bookdate = $request->bookdate;
        $notes = isset($request->notes) ? $request->notes : '';
        $selectedTime = isset($request->selectedTime) ? $request->selectedTime : 0;

        $rawSql .= "UPDATE group_bookings SET date = '$bookdate', notes = '$notes', booking_datetime_id = $selectedTime  WHERE groupid='" . $groupid . "';";
    };

    $result = $conn->multi_query($rawSql);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (isset($info->querydate))
    {
        $creator = $info->creator;
        $pusher_date = $info->querydate;
        include('pusher.php');
    };

}
?>
