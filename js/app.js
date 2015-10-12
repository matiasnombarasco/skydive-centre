'use strict';

var tandemApp = angular.module('tandemApp', [
    'ngRoute',
    'pilotService',
    'tandemAppControllers',
    'uibootstrapdemo'
]);

tandemApp.config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'index.html',
                controller: 'PilotListCtrl'
            })
            .when('/api/id', {
                templateUrl: 'index.html',
                controller: 'PilotListCtrl'
                })
    });
