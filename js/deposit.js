'use strict';

/* Directives */


/* Controllers */



tandemApp.controller('DepositCtrl', ['$scope', 'BookResource', '$uibModal', 'BooksGroupsResource', '$http', '$location', '$routeParams',
    function($scope, BookResource, $uibModal, BooksGroupsResource, $http, $location, $routeParams) {


        var bookslength = $routeParams.book;

        $scope.price = bookslength * 100;

        switch(bookslength) {
            case "0":
                $scope.mercadopago = '';
            case "1":
                $scope.mercadopago = 'http://mpago.la/K0Na';
                break;
            case "2":
                $scope.mercadopago = 'http://mpago.la/GdkH';
                break;
            case "3":
                $scope.mercadopago = 'http://mpago.la/SEa2';
                break;
            case "4":
                $scope.mercadopago = 'http://mpago.la/qlQr';
                break;
            case "5":
                $scope.mercadopago = 'http://mpago.la/ayyS';
                break;
            default:
                $scope.mercadopago = 'http://mpago.la/1eVD';
                $scope.price = 600;
        }
    }
]);
