<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 10/24/16
 * Time: 6:49 p.m.
 */

$mpurl = $_GET['mpurl'];
$booklength = $_GET['booklength'];
if ($booklength > 2) {
    $booklength = 2;
}

$payment = 300 * $booklength;
?>

<div class="modal-header" style="text-align: center;">
    <h3 class="modal-title">Confirmar reserva</h3>
</div>

<div class="modal-body">
    <form name="MPForm" style="text-align: center;">
        <div class="form-group">
            <label>Para completar la reserva debe realizar un pago de $<?php echo $payment ?></label>
            <label>Luego de abonar el mismo podra elegir el horario.</label>
            <label>Si realiza el pago con tarjeta de credito lo podra realizar inmediatamente.</label>
        </div>

        <div class="alert alert-success alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <strong>IMPORTANTE PARA TERMINAR LA TRANSACCION,</strong> recuerde hacer click en continuar (o ir a Paracaidismo Rosario) luego de realizar el pago en Mercado Pago
        </div>

        <div style="display: block; padding-bottom: 30px;"><a href="<?php echo $mpurl ?>" name="MP-Checkout" ng-click="acceptMP()" class="btn btn-primary">Pagar Reserva</a></div>

        <script type="text/javascript" src="https://www.mercadopago.com/org-img/jsapi/mptools/buttons/render.js"></script>

        <img src="images/mediospagos.jpg">
    </form>
</div>


