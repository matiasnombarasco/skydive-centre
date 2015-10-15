'use strict';

var tandemApp = angular.module('tandemApp', [
    'ngRoute',
    'pilotService',
    'tandemAppControllers',
    'uibootstrapdemo',
    'ui.bootstrap',
    'ngAnimate'
]);

tandemApp.config(['$routeProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'booking.html',
                controller: 'PilotListCtrl'
            })
            .when('/api/id', {
                templateUrl: 'index.html',
                controller: 'PilotListCtrl'
                })
    }]);
