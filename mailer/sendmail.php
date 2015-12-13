<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/20/15
 * Time: 3:34 p.m.
 */

require('class.phpmailer.php');
include('class.smtp.php');
$mail = new PHPMailer();

//$name = $_POST["name"];
//$guests = $_POST["guests"];
//$time = $_POST["time"];

$message = "hola"; //"<h1>".$name." has booked a table for ".$guests." at ".$time."</h1>";

$mail->IsSMTP();
$mail->Host = "mail.paracaidismorosario.com";
$mail->SMTPAuth = true;
//$mail->SMTPDebug = 4;
$mail->SMTPOptions =  array('ssl' => array('verify_peer' => false,'verify_peer_name' => false,'allow_self_signed' => true));
$mail->SMTPSecure = "ssl";
$mail->Username = "info@paracaidismorosario.com";
$mail->Password = "Paracaidismo1234";
$mail->Port = "465";

$mail->SetFrom('info@paracaidismorosario.com', 'Paracaidismo Rosario');
$mail->Subject    = "Reserva en Paracaidismo Rosario";
$mail->AltBody    = "To view the message, please use an HTML compatible email viewer!";
$mail->MsgHTML($message);
    $address = "sebastian@aresca.com.ar";
    $mail->AddAddress($address);

    if(!$mail->Send()) {
        echo "Mailer Error: " . $mail->ErrorInfo;
    } else {
        echo "Message sent!";
    }
?>
