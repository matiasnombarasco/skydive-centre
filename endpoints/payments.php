<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 1/26/16
 * Time: 2:33 p.m.
 */

require('class.phpmailer.php');
include('class.smtp.php');


$postdata = file_get_contents("php://input");
$request = json_decode($postdata, false);

require_once "mercadopago.php";
include 'config.php';


if (!isset($_GET["id"]) || !ctype_digit($_GET["id"])) {
    http_response_code(400);
    return;
}

$mp = new MP("5179497693280373", "Q1Gk3Xg5qaUaN3lamxdncuC8pPPffyV4");

//$mp->sandbox_mode(TRUE);

if ($_GET["topic"] == 'payment') {

    $todo = date('Y-m-d H:i:s') .$_SERVER['REQUEST_URI'];

    $conn = new mysqli($servername, $username, $password, $db);

// Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $mp_id = $_GET["id"];

    $rawSQL = "SELECT * FROM payments WHERE mp_id = " . $mp_id . ";";
    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if ((!empty($result->num_rows) && $result->num_rows > 0)) {
        var_dump('ya ingresado');
        exit;
    }


    $rawSQL = "INSERT INTO mp_payments (mp_id, log) VALUES ('" . $mp_id . "','" . $todo . " ');";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    $searchResult = $mp->get_payment_info($mp_id);

    if (isset($searchResult['response']['collection']['status']))
    {

        if ($searchResult['response']['collection']['status'] == 'approved'
            && $searchResult['response']['collection']["status_detail"] == 'accredited'
        ) {
            date_default_timezone_set('America/Buenos_Aires');
            $pdate = date("Y-m-d H:i:s");

            $external_ref = $searchResult['response']['collection']['external_reference'];
            if ($external_ref != '') {
                $pos = strpos($external_ref, '-') + 1;
                $bookid = substr($external_ref, $pos, (strlen($external_ref) - $pos));
                $groupid = substr($external_ref, 0, $pos - 1);
            } else {
                exit;
            }

            $date_approved = '0000/00/00';
            $mercadopago_fee = '0';
            $net_received_amount = '0';
            $total_paid_amount = '0';

            if (isset($searchResult['response']['collection']['date_approved'])) {
                date_default_timezone_set('America/Buenos_Aires');
                $date_approved = date('Y-m-d H:i:s', strtotime($searchResult['response']['collection']['date_approved']));
            };

            if (isset($searchResult['response']['collection']['net_received_amount'])) {
                $net_received_amount = $searchResult['response']['collection']['net_received_amount'];
            }

            if (isset($searchResult['response']['collection']['transaction_amount'])) {
                $total_paid_amount = $searchResult['response']['collection']['transaction_amount'];
                if ($groupid == "XXXXX") {
                    $total_paid_amount = round($net_received_amount / 1.0341);
                    if ($net_received_amount > $total_paid_amount) {
                        $net_received_amount = $total_paid_amount;
                    }
                }
            }

            $mercadopago_fee = $total_paid_amount - $net_received_amount;

            $rawSQL = "INSERT INTO payments (type, mp_id, date_approved, mercadopago_fee, net_received_amount, amount, payment_date, id_booking)
                               VALUES ('MP', $mp_id, '" .
                $date_approved . "'," .
                $mercadopago_fee . "," .
                $net_received_amount . "," .
                $total_paid_amount . ",
                                       '" . $pdate . "',
                                       " . $bookid . ");";

            $result = $conn->query($rawSQL);
            if (!empty($conn->error)) {
                die($conn->error);
            }

            ////////////////////////////////// Enviar correo

            /* Get bookdate */
            $rawSQL = "SELECT * FROM group_bookings WHERE groupid = '" . $groupid . "';";

            $resultDATE = $conn->query($rawSQL);
            if (!empty($conn->error)) {
                die($conn->error);
            }

            if ((!empty($resultDATE->num_rows) && $resultDATE->num_rows > 0)) {
                $r = mysqli_fetch_assoc($resultDATE);
                $bookdate = $r['date'];
            }

            /* bookdate end */

            $rawSQL = "SELECT 	tandem_bookings.id,
                        tandem_bookings.firstname,
                        tandem_bookings.lastname,
                        tandem_bookings.email,
                        tandem_bookings.dni,
                        tandem_bookings.phone,
                        DATE_FORMAT(tandem_bookings.dob, '%Y-%m-%d') as dob,
                        tandem_bookings.weight,
                        tandem_bookings.groupid as groupid,
                        tandem_bookings.deposit,
                        (tandem_bookings.deposit +  coalesce(vpayments.amount, 0)) as vdeposit,
                        tandem_bookings.groupid,
                        tandem_bookings.DNI

                FROM tandem_bookings LEFT JOIN
                     (SELECT id_booking, SUM(payments.amount) AS amount FROM payments GROUP BY id_booking) as vpayments
                        ON tandem_bookings.id = vpayments.id_booking

                WHERE tandem_bookings.deleted = 0 AND
                      tandem_bookings.groupid = '" . $groupid . "'

                ORDER BY id;";

            $result = $conn->query($rawSQL);

            if ($conn->connect_error) {
                $error = array('error' => 'error');
                print json_encode($error);
                die();
            }

            $pasajeros = '';
            $count = 0;
            $vdeposit = 0;


            while ($r = mysqli_fetch_assoc($result)) {
                $pasajeros .= '<tr><td style="font-weight:bold">' . $r['firstname'] . ', ' . $r['lastname'] . '</td><td style="padding:1px 4px 7px"><b>|</b></td><td>' . $r['email'] . '</td></tr>';
                if ($r['vdeposit'] >= $vdeposit) {
                    $vdeposit = $r['vdeposit'];
                }
                $count = $count + 1;
            }

            $rawSQL = "SELECT * FROM tandem_bookings WHERE deleted = 0 AND groupid = '" . $groupid . "' ORDER BY id;";

            $result = $conn->query($rawSQL);

            while ($r = mysqli_fetch_assoc($result)) {
                if ($r['email'] != '') {
                    sendMail($r['email'], $count, $pasajeros, $groupid, $bookdate, $vdeposit);
                }
            }

            exit;
            //////////////////////////////////
        };
    }
    else
    {
        smtpsend('saresca@gmail.com','Error en: ' . $mp_id, 'Error en: ' . $mp_id);
    }

}

exit;

function sendMail($email, $count, $pasajeros, $groupid, $bookdate,  $deposit)
{
    $price = $count * 1900;

    $horario = '<span style="font-family:Arial,Helvetica,sans-serif,Tahoma;color:#006;font-size:18px;line-height:130%;font-weight:bold;padding:0 5px;" id="ctl00_ContentTitle_labelHeadingInfo" class="pageHeadingInfo">Hemos recibido su pago.<br> Ya puede elegir su horario clickeando MODIFICAR RESERVA debajo</span>';
    $gracias = '<span id="ctl00_ContentTitle_labelHeadingInfo" class="pageHeadingInfo">Gracias por elegirnos. <br> Si desea modificar su reserva utilize el link debajo.</span>';
    $pagar = '';

    $total = $price - $deposit;
    $textmail = '<html>
<style type="text/css">
    * {
    margin: 0;
}

    table {
    border-collapse: collapse;
        border-spacing: 0;
    }

    img, table {
    border: 0
    }

    .co-message-content p {
    margin: 0 0 12px
    }

    .co-message-content, .co-message-content td, .co-message-content th {
    font-family: Arial, Helvetica, sans-serif, Tahoma;
        font-size: 12px;
        color: #333
    }

    .co-message-content ul, .co-message-content ol {
    margin: 12px 0
    }

    .co-message-content li {
    margin: 3px 0 3px 24px
    }

    .co-message-content h4 {
    color: #039;
    margin: 0 0 10px;
        font-size: 16px
    }

    .co-message-content h5 {
    color: #000;
    margin: 0;
    font-size: 100%
    }
</style>
<div class="container center" style="width: 780; display: inline-block !important; margin-left: 10% !important; margin-right: 10% !important;">
    <table border="0" cellspacing="0" cellpadding="0" style="width:100%">
        <tbody>
        <tr>
            <td style="border:solid 1px #b8b8b8;border-bottom:none;background-color:#36c;height:8px;font-size:6px">
                &nbsp;</td>
        </tr>
        <!--Logo y Fecha-->
        <tr>
            <td style="border:solid 1px #b8b8b8;border-top:none;border-bottom:none;background-color:#fff;padding:12px 10px">
                <table cellspacing="0" cellpadding="0" border="0" style="width:100%">
                    <tbody>
                    <tr>
                        <td><a target="_blank" href="https://www.paracaidismorosario.com/"><img src="http://booking.paracaidismorosario.com/images/pr.png" alt="Paracaidismo Rosario" width="191" height="33"></a></td>
                        ' . $pagar . '
                        <td style="font-family:Arial,Helvetica,sans-serif,Tahoma;color:#333;font-size:10px;text-align:right;vertical-align:bottom"><div id="fecha">' . date("d/m/Y") . '</div></td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        <!--// Grcias por elegir-->
        <tr>
            <td id="ctl00_contentTopPadding" style="border:solid 1px #b8b8b8;border-top:none;border-bottom:none;background-color:#fff;padding:5px 10px 0">
                <table cellspacing="0" cellpadding="0" border="0" style="width:100%">
                    <tbody>
                    <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif,Tahoma;color:#006;font-size:18px;line-height:130%;font-weight:bold;padding:0 5px">
                    ' . $gracias . '
                    </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>

        <tr>
            <td id="ctl00_contentBorder" style="border:solid 1px #b8b8b8;border-top:none;border-bottom:none;background-color:#fff;padding:0 10px">
                <table cellspacing="0" cellpadding="0" border="0" style="width:100%">
                    <tbody>
                    <tr>
                        <td id="ctl00_contentContainerBorder" style="font-family:Arial,Helvetica,sans-serif,Tahoma;font-size:12px;line-height:130%;padding-left:5px;color:#333" class="co-message-content">
                            <table border="0" cellspacing="0" cellpadding="0" style="width:100%">
                                <tbody>
                                <!--// Estamos procesando-->
                                <tr>
                                    <td colspan="2" style="padding:6px 0">
                                        <table cellspacing="0" cellpadding="0" style="width:100%;border:solid 4px #fc6">
                                            <tbody>
                                            <tr>
                                                <td colspan="2"><img src="http://booking.paracaidismorosario.com/images/YellowTop.gif" width="611" height="20" alt="" style="width:100%"></td>
                                            </tr>
                                            <tr>
                                                <td style="vertical-align:middle;padding:0 20px"><img src="http://booking.paracaidismorosario.com/images/advisory.gif" border="0" style="width:32px;height:32px"></td>
                                                <td style="vertical-align:middle;padding:0 20px 0 0">
                                                ' . $horario . '
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2"><img src="http://booking.paracaidismorosario.com/images/YellowBottom.gif" width="611" height="20" alt="" style="width:100%"></td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <!--// Le recordamos-->
                                <tr>
                                    <td colspan="2" style="padding:6px 0">
                                        <p>Le recordamos que puede <a href="http://booking.paracaidismorosario.com/#/' . $groupid . '"><strong>MODIFICAR SU RESERVA</strong></a> en booking.paracaidismorosario.com, incluyendo:</p>
                                        <ul>
                                            <li>Agregar/eliminar participantes</li>
                                            <li>Ver o modificar el dia de la reserva</li>
                                            <li>Ver estado de la reserva</li>
                                            <li>Imprimir recibos</li>
                                        </ul>
                                    </td>
                                </tr>

                                <tr>
                                    <td colspan="2" style="padding:6px 0">
                                        <table style="background-color:#fff;width:100%" cellpadding="0" cellspacing="0">
                                            <tbody>
                                            <tr>
                                                <td style="border:1px solid #666">
                                                    <table style="width:100%" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                        <tr>
                                                            <td style="width:42px;text-align:center;padding:0.15em 0"><img src="http://booking.paracaidismorosario.com/images/planeUp.gif" border="0"></td>
                                                            <td style="text-transform:none;color:#039;font-size:1.0em;background-color:#ccc;display:block;padding:0.15em;font-weight:bold;border-left:1px solid #666">Reserva</td>
                                                            <td style="text-align:right;text-transform:none;color:#039;background-color:#ccc;display:block;padding:0.15em;font-weight:bold">Codigo de confirmacion:</td>
                                                            <td style="width:5%;text-align:left;background-color:#fff;font-size:0.8em;font-weight:bold;padding:0.2em 1.5em;border-left:1px solid #666"><span>' . $groupid . '</span></td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="border:1px solid #87b7d3;border-top:none">
                                                    <table style="width:100%" cellpadding="0"
                                                           cellspacing="0">
                                                        <tbody>
                                                        <tr><td style="font-size:1px;line-height:100%"><img src="http://booking.paracaidismorosario.com/images/bgGradLtBlue630x20Top.gif" width="630" height="20" alt="" style="width:100%"></td></tr>
                                                        <tr>
                                                            <td style="padding:0 20px">
                                                                <table style="width:100%" cellpadding="0" cellspacing="0">

                                                                    <tbody>
                                                                    <tr style="vertical-align:top">
                                                                        <td style="padding:1px 4px 7px;width:18px">
                                                                            <img src="http://booking.paracaidismorosario.com/images/bgPlaneDark.gif" border="0"></td>
                                                                        <td style="padding:1px 4px 7px;width:110px"><b>' . $bookdate . '</b></td>
                                                                        <td style="padding:1px 4px 7px"><b>|</b></td>
                                                                        <td style="padding:1px 4px 7px"><div style="padding-bottom:1px"><b>Salto Bautismo de Paracaidismo / Lugar: Aeroclub Victoria</b></div></td>
                                                                    </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>

                                                        <tr><td style="font-size:1px;line-height:100%"><img src="http://booking.paracaidismorosario.com/images/bgGradLtBlue630x20Btm.gif" width="630" height="20" alt="" style="width:100%"></td></tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding:6px 0">
                                        <table style="background-color:#fff;width:100%" cellpadding="0" cellspacing="0">
                                            <tbody>
                                            <tr>
                                                <td style="border:1px solid #666">
                                                    <table style="width:100%" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                        <tr>
                                                            <td style="width:42px;text-align:center;padding:0.15em 0"><img src="http://booking.paracaidismorosario.com/images/traveler.gif" border="0"></td>
                                                            <td style="text-transform:none;color:#039;font-size:1.0em;background-color:#ccc;display:block;padding:0.15em;font-weight:bold;border-left:1px solid #666">Detalle de participantes</td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="border:1px solid #87b7d3;border-top:none">
                                                    <table style="width:100%" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                        <tr>
                                                            <td style="font-size:1px;line-height:100%">
                                                                <img src="http://booking.paracaidismorosario.com/images/bgGradLtBlue630x20Top.gif" width="630" height="20" alt="" style="width:100%"></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:1px 20px">
                                                                <table style="width:100%"
                                                                       cellpadding="0"
                                                                       cellspacing="0">
                                                                    <tbody>
                                                                    <tr style="vertical-align:top">
                                                                        <td style="width:50%">

                                                                            <table>
                                                                                <tbody>' .
        $pasajeros
        . '</tbody>
                                                                            </table>

                                                                        </td>
                                                                        <td style="width:50%">

                                                                        </td>
                                                                    </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-size:1px;line-height:100%">
                                                                <img src="http://booking.paracaidismorosario.com/images/bgGradLtBlue630x20Btm.gif" width="630" height="20" alt="" style="width:100%"></td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>

                                    </td>
                                </tr>

                                <tr style="vertical-align:top">
                                    <td style="padding:6px 0;min-width:302px">
                                        <table style="background-color:#fff;width:300px; float: right;"
                                               cellpadding="0" cellspacing="0">
                                            <tbody>
                                            <tr>
                                                <td style="border:1px solid #666">
                                                    <table style="width:100%" cellpadding="0"
                                                           cellspacing="0">
                                                        <tbody>
                                                        <tr>
                                                            <td style="width:42px;text-align:center;padding:0.15em 0">
                                                                <img src="http://booking.paracaidismorosario.com/images/dollarCircle.gif" border="0"></td>
                                                            <td style="text-transform:none;color:#039;font-size:1.0em;background-color:#ccc;border-left:1px solid #666;display:block;padding:0.15em;font-weight:bold">Detalle del precio</td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="border:1px solid #87b7d3;border-top:none">
                                                    <table style="width:100%" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                        <tr><td style="font-size:1px;line-height:100%"><img src="http://booking.paracaidismorosario.com/images/bgGradLtBlue630x20Top.gif" width="300" height="20" alt="" style="width:100%"></td></tr>
                                                        <tr>
                                                            <td style="padding:0 20px">
                                                                <table style="width:100%" cellpadding="0" cellspacing="0">

                                                                    <tbody>
                                                                    <tr><td colspan="2" class="seatSummary"></td></tr>
                                                                    <tr><td colspan="2"></td></tr>


                                                                    <tr id="ctl00_ContentEmail_TicketPriceDetails1_rptrPrice_ctl00_trDisplay">
                                                                        <td style="padding-top:6px">Total ' . $count . ' pariticapantes:</td>
                                                                        <td align="right" style="padding-top:6px;font-weight:bold;text-align:right!important">$' . $price . ' AR$</td>
                                                                    </tr>


                                                                    <tr><td colspan="2" class="seatSummary"></td></tr>
                                                                    <tr><td colspan="2"></td></tr>


                                                                    <tr>
                                                                        <td style="padding-top:6px">Adelanto reserva:</td>
                                                                        <td align="right" style="padding-top:6px;font-weight:bold;text-align:right!important">$' . $deposit . ' AR$</td>
                                                                    </tr>


                                                                    <tr><td colspan="2" class="seatSummary"></td></tr>
                                                                    <tr><td colspan="2"></td></tr>

                                                                    <tr><td colspan="2" style="font-size:6px">&nbsp;</td></tr>

                                                                    <tr>
                                                                        <td style="border-top:solid 1px #666;font-size:100%;padding:10px 0;font-weight:bold;text-align:right!important;vertical-align:top">Total Fare</td>
                                                                        <td align="right" style="border-top:solid 1px #666;color:#080;font-size:100%;padding:10px 0;font-weight:bold;text-align:right!important;vertical-align:top">$' . $total . ' AR$</td>
                                                                    </tr>

                                                                    <tr><td colspan="2"></td></tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr><td style="font-size:1px;line-height:100%"><img src="http://booking.paracaidismorosario.com/images/bgGradLtBlue630x20Btm.gif" width="300" height="20" alt="" style="width:100%"></td></tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding:6px 0">
                                        <table style="background-color:#fff;width:100%" cellpadding="0" cellspacing="0">
                                            <tbody>
                                            <p style="text-align: justify; font-size: 10px;"><strong>Terminos y condiciones:</strong>
Todos los pagos realizados antes de la fecha de su reserva, incluyendo los depositos, no son reembolsables, pero pueden ser transferidos a cualquier otra persona.
En caso de no realizar el pago completo del salto, la tarifa a abonar sera la vigente al dia de la fecha del salto. Su seguridad y la de todas las personas involucradas
son prioritarias para Paracaidismo Rosario, es por esto que podremos negarle el servicio por cualquier motivo que se considerade peligroso o amenazante para usted y / o
cualquier otra persona. Esto incluye, pero no se limita a, estar bajo la influencia de sustancias toxicas, incluyendo el alcohol y/o drogas / narcoticos (tanto, legales e ilegales),
condiciones meteorologicas peligrosas, forma del cuerpo insegura, tamano, altura y / o peso , condiciones de salud peligrosas, y cuestiones relacionadas con la aeronave / equipos.
No se hacen reembolsos por el servicio a aquella persona que se le halla negado por alguna de estas razones. Sin embargo, puede reprogramar para otra fecha o transferir cualquier
cantidad pagada a otra persona. Debera proporcionar por lo menos 24 horas de antelacion con el fin de cancelar o cambiar por cualquier razon. Si no se presenta para su cita programada,
sin previo aviso, pierde todos los pagos realizados. Debe pesar menos de 90kg, esto incluye ropa, calzado, etc; y debe poseer una altura/peso proporcional. En caso de pesar mas de 90kg
y hasta 100kg se cobrara un costo extra. Recomendamos utilizar vestimenta comoda/atletico en el dia de su salto. No se permiten sandalias, zapatos de tacos alto, zapatos de vestir y botas
de ningun tipo. Cualquier calzado que contenga lo siguiente tampoco estan permitidos: cuero, cuero sintetico, correas elasticas, correas de velcro, ganchos, o hebillas. Cualquier
persona que lleve cualquier atuendo determinado a ser inapropiado para el paracaidismo no le sera permitido saltar. No se hacen reembolsos si se le niega el servicio por usar vestimenta
inapropiada. Normalmente la actividad dura entre una y dos horas, pero le recomendamos planear una espera de al menos tres a cuatro horas de su dia en caso de que haya retrasos inesperados.
Con el fin de participar en cualquier actividad relacionada con paracaidismo, primero debe firmar y ejecutar un acuerdo de contrato legal que exime de ciertos DERECHOS antes de su
participacion en cualquier actividad relacionada con paracaidismo. Usted debe tener al menos 18 anos o mas el dia en que usted realizara el salto. Debera presentar carnet de identidad
legal al momento del check-in. Si usted esta realizando esta reserva en nombre de otras personas, queda entendido que las misma tienen en conocimiento todos los terminos establecidos
en este docuemnto. PARACAIDISMO ROSARIO se encuentra solamente en el Aeroclub Victoria, Ruta 11 Km 111 - Victoria, Entre Rios.</p>
                                            </tbody>
                                        </table>

                                    </td>
                                </tr>

                                </tbody>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
    </tbody>
    </table>
</div>
</html>';

    $subject = "Paracaidismo Rosario - Recibimos tu pago";

    smtpsend($email,$textmail, $subject);
}

function smtpsend($email,$textmail, $subject) {

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
        //echo "Message sent to $email";
    }
}

?>
