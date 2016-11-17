'use strict';

var tandemApp = angular.module('tandemApp', [
    'ngRoute',
    'bookingService',
    'ngAnimate',
    'ui.bootstrap',
    'cgBusy',
    'ngMaterial',
    'ngMessages',
]);

tandemApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'booking.html',
            })
            .when('/api/id', {
                templateUrl: 'booking.html',
                controller: 'BookingCtrl'
                })
            .when('/booksucess/:groupid', {
                templateUrl: 'booking.html'
                //templateUrl: 'endpoints/mppayment.php'
            })
            .when('/system', {
                templateUrl: 'system.html',
                controller: 'SystemCtrl'
            })
            .when('/login', {
                templateUrl: 'login.html',
            })
            .when('/:groupid', {
                templateUrl: 'booking.html',
            })
    }]);
