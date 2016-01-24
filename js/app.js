'use strict';

var tandemApp = angular.module('tandemApp', [
    'ngRoute',
    'bookingService',
    'ngAnimate',
    'ui.bootstrap'
]);

tandemApp.config(['$routeProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'booking.html',
            })
            .when('/api/id', {
                templateUrl: 'booking.html',
                controller: 'BookingCtrl'
                })
            .when('/booksucess/:book', {
                templateUrl: 'booksucess.html'
            })
            .when('/system', {
                templateUrl: 'system.html',
            })
            .when('/:groupid', {
                templateUrl: 'booking.html',
            })


    }]);
