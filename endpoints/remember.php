<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/10/16
 * Time: 9:35 a.m.
 */

if (isset($argv)) {
    if ($argv[1] == 'remembercron' || isset($_COOKIE["easymanifest"])) {

include 'config.php';
require('class.phpmailer.php');
include('class.smtp.php');



$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    $error = array('error' => 'error');
    print json_encode($error);
    die();
}

// Selelct bookings with NO deposit
$rawSQL = "SELECT
            (CONCAT(UCASE(LEFT(firstname, 1)), LCASE(SUBSTRING(firstname, 2)))) as firstname,
            email,
            date,
            slots_booking_date.slot_time
          FROM tandem_bookings
          RIGHT JOIN group_bookings ON tandem_bookings.groupid = group_bookings.groupid
          LEFT JOIN slots_booking_date ON group_bookings.booking_datetime_id = slots_booking_date.slot_id
          WHERE group_bookings.date = (current_date() +3) and group_bookings.booking_datetime_id <> 0 AND email <> '' AND deleted = 0;
         ";

$result = $conn->query($rawSQL);

if ($conn->connect_error) {
    $error = array('error' => 'error');
    print json_encode($error);
    die();
}

while ($r = mysqli_fetch_assoc($result)) {

    $name = $r['firstname'];
    $bookdate = $r['date'];
    $booktime = $r['slot_time'];
    $email = $r['email'];
    //$email = 'saresca@gmail.com';
    sendMail($email, $bookdate, $booktime, $name);
}

exit;
}
}

function sendMail($email, $bookdate, $booktime, $name)
{
    $subject = "Paracaidismo Rosario - Estas preparado?";
    $textmail = '
        <html>
          <head>

            <meta http-equiv="content-type" content="text/html; charset=windows-1252">
          </head>
          <body link="#0B6CDA" text="#000000" vlink="#551A8B" alink="#EE0000"
            bgcolor="#FFFFFF">
            <meta http-equiv="content-type" content="text/html;
              charset=windows-1252">
            <p style="margin-bottom: 0cm; line-height: 100%" align="center"><br>
            </p>
            <table width="800" border="0" cellpadding="2" cellspacing="2"
              align="center" height="537">
              <tbody>
                <tr>
                  <td valign="top">
                    <div align="center" style="font-size: xx-large ; font-weight: bold; color: #ff6600;">'. $name .',</div>
	            <br>
		    <div align="center" style="font-size: xx-large ; font-weight: bold; color: #ff6600;"> ya falta poco para tu gran salto!!!</div>
                    <br>
                    <br>
                    <div align="center"><img alt="" src="http://booking.paracaidismorosario.com/images/Cartel2015-500.jpg" width="500" align="middle" height="473"><br>
                    </div>
                    <br>
                    <div align="center" style="font-size: larger; font-weight: bold; color: #ff6600;">Te esperamos el ' . $bookdate . ' a las ' . $booktime . ' en el Aerodromo de Victoria</div>
                    <br>
                  </td>
                </tr>
              </tbody>
            </table>
            <div align="center"><br>
              <p style="margin-bottom: 0cm; line-height: 100%; font-size: larger; font-weight: bold; color: black; text-decoration:underline;">RECORDA</p>

              <table width="750" border="0" cellpadding="2" cellspacing="2"
                height="756" style="color: black; font-weight: bold">
                <tbody>
                  <tr align="center">
                    <td valign="top">Llegar en el
                        horario establecido. Para evitar espera no llegues
                        demasiado antes. <br>
                        (10 minutos antes como maximo). <br>
                        Y para no perder tu lugar no llegues
                        muy tarde.</td>
                  </tr>
                  <tr align="center">
                    <td valign="top">Traer ropa
                        deportiva comoda</td>
                  </tr>
                  <tr align="center">
                    <td valign="top"><div style="color: black; font-weight: bold"> El horario del salto puede ser desde el horario establecido hasta +1hora despues del mismo.<div>
			<div style="color: black; font-weight: bold">Por esto te recomendamos venir con tiempo (2horas aprox)<div>
                    </td>
                  </tr>
                  <tr align="center">
                    <td valign="top">El pago con tarjeta de credito/debito tiene un 10% de recargo</td>
                  </tr>
                  <tr align="center">
                    <td valign="top">Se perdera la reserva si al dia del salto alguno de los participantes no se presenta</td>
                  </tr>
                  <tr align="center">
                    <td valign="top"><b>En caso de mal tiempo te enviaremos un email para reprogramar tu salto para otro dia</td>
                  </tr>
                  <tr align="center">
                    <td valign="top"><b>Al llegar podes elegir entre las diferentes alturas:</td>
                  </tr>
                  <tr align="center">
                    <td valign="top" style="color: #ffcc66; font-weight: bold;">NORMAL 30-35 segundos de caida libre</td>
                  </tr>
                  <tr align="center">
                    <td valign="top" style="color: #ff6600; font-weight: bold;">MAS ALTO 35-40 segundos de caida libre</td>
                  </tr>
                  <tr align="center">
                    <td valign="top" style="color: #ff0000; font-weight: bold;">EXTREMO 40-45 segundos de caida libre</td>
                  </tr>
                  <tr align="center">
                    <td valign="top"><br>
                    </td>
                  </tr>
                  <tr align="center">
                    <td valign="top" style="font-size: larger; font-weight: bold; color: black; text-decoration:underline;">COMO LLEGAR</td>
                  </tr>

                  <tr align="center">
                    <td valign="top"><a
        href="https://www.google.com.ar/maps/place/Paracaidismo+Rosario/@-32.5869435,-60.1811567,17z/data=%213m1%214b1%214m5%213m4%211s0x95b62ccb3c2eda0d:0x2668cad8b5e83103%218m2%213d-32.586948%214d-60.178968?hl=en"><img
                          alt=""
        src="http://booking.paracaidismorosario.com/images/googlemaps.png"
                          width="605" border="0" height="357"></a><br>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <p style="margin-bottom: 0cm; line-height: 100%"> </p>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <br>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <br>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <br>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <br>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <p style="margin-bottom: 0cm; line-height: 100%"><br>
              </p>
              <title></title>
              <meta name="generator" content="LibreOffice 5.1.4.2 (Linux)">
              <style type="text/css">
                @page { margin: 2cm }
                p { margin-bottom: 0.25cm; line-height: 120% }
            </style></div>
            <title></title>
            <meta name="generator" content="LibreOffice 5.1.4.2 (Linux)">
            <style type="text/css">
                @page { margin: 2cm }
                p { margin-bottom: 0.25cm; line-height: 120% }
            </style>
          </body>
        </html>
';

    $mail = new PHPMailer();

    $message = $textmail;

    $mail->IsSMTP();
    $mail->Host = "mail.paracaidismorosario.com";
    $mail->SMTPAuth = true;
//$mail->SMTPDebug = 4;
    $mail->SMTPOptions = array('ssl' => array('verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true));
    $mail->SMTPSecure = "ssl";
    $mail->Username = "info@paracaidismorosario.com";
    $mail->Password = "Paracaidismo1234";
    $mail->Port = "465";

    $mail->SetFrom('info@paracaidismorosario.com', 'Paracaidismo Rosario');
    $mail->Subject = $subject;
    $mail->MsgHTML($message);
    $address = $email;
    $mail->AddAddress($address);
    $mail->AddBCC('reservas@paracaidismorosario.com', 'Paracaidismo Rosario');

    if (!$mail->Send()) {
        echo "Mailer Error: " . $mail->ErrorInfo;
    } else {
        echo "Message sent to $email!";
    }
}

?>
