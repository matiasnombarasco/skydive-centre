<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 3/1/16
 * Time: 6:15 p.m.
 */

session_start();
include 'config.php';

$conn = new mysqli($servername, $username, $password, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$postdata = file_get_contents("php://input");
$request = json_decode($postdata, false);

$username = $request->username;
$password = $request->password;

$rawSql = "SELECT username, role FROM users WHERE username = '$username' AND password = '$password';";

$result = $conn->query($rawSql);
if (!empty($conn->error)) {
    die($conn->error);
}

$r = mysqli_fetch_assoc($result);

if (!empty($result->num_rows) && $result->num_rows > 0) {
    $data[] = array(
        'username' => $r['username'],
        'role' => $r['role']
    );

    $_SESSION['username'] = $r['username'];
    $_SESSION['role'] = $r['role'];

    print json_encode($data);
}

?>
