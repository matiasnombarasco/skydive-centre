'use strict';
/* Controllers */

var tandemAppControllers = angular.module('tandemAppControllers', []);

tandemAppControllers.controller('PilotListCtrl', ['$scope', 'Pilot',
    function($scope, Pilot) {
        //esta va en castellano, en el callback de la funncion donde definis el controller, le pasamos una funcion
        //anonima, que tiene la llamada query del servicio Pilot, angular se maneja todo en base a nombres.

        $scope.agregar = function() {
            var nuevaReserva = new Pilot({});
            nuevaReserva.nombre = $scope.nombre;
            nuevaReserva.telefono = $scope.telefono;
            nuevaReserva.email = $scope.email;
            //lo guardamos, el save llama al pilotService que ya hace todo solito
            nuevaReserva.$save();

            //ponemos los campos en cero y traemos los nuevos
            //$scope.pilots = Pilot.query();
            $scope.fecha = "";
            $scope.nombre = "";
            $scope.telefono = "";
            $scope.email = "";
            //$('#skydiveinfo').modal('hide');
            //$('.modal-backdrop').remove();

            $scope.pilots = Pilot.query();

            return false;
        };

        $scope.borrar = function() {
            var index = $scope.pilots.indexOf(this.pilot);
            $scope.pilots.splice(index, 1);    

                        this.pilot.$remove();
 
             // $scope.pilots = Pilot.query();
            return false;
        };

        $scope.pilots = Pilot.query();

    }]);

var uibootstrapdemo = angular.module('uibootstrapdemo', ['ngAnimate', 'ui.bootstrap']);

uibootstrapdemo.controller('ModalDemoCtrl', function ($scope, $uibModal) {

    $scope.open = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            size: ''
        });

    };
});

uibootstrapdemo.controller('ModalInstanceCtrl', function ($scope, $modalInstance) {

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});
