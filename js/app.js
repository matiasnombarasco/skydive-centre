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
                controller: 'BookingCtrl'
            })
            .when('/api/id', {
                templateUrl: 'booking.html',
                controller: 'BookingCtrl'
                })
            .when('/booksucess', {
                templateUrl: 'booksucess.html'
            })

    }]);
