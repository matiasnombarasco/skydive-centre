'use strict';

var tandemApp = angular.module('tandemApp', [
    'ngRoute',
    'bookingService',
    'ngAnimate',
    'ui.bootstrap',
    'cgBusy',
    'ngMaterial',
    'ngMessages',
    'angular.filter',
    'bookingService'

]);

tandemApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'booking.html',
                controller: 'BookingCtrl'
            })
            .when('/api/id', {
                templateUrl: 'booking.html',
                controller: 'BookingCtrl'
            })
            .when('/booksucess/:groupid', {
                templateUrl: 'booking.html',
                controller: 'BookingCtrl'
                //templateUrl: 'endpoints/mppayment.php'
            })
            .when('/regalo', {
                templateUrl: 'regalo.html',
                controller: 'BookingCtrl'
            })
            .when('/:groupid', {
                templateUrl: 'booking.html',
                controller: 'BookingCtrl'
            })
    }]);


var bookingService = angular.module('bookingService', ['ngResource']);

bookingService.factory('BookResource', ['$resource',
    function($resource) {
        return $resource('endpoints/bookings.php', { id: '@id' });
    }]);

bookingService.factory('BooksGroupsResource', ['$resource',
    function($resource) {
        return $resource('endpoints/booksgroups.php', { groupid: '@groupid' });
    }]);

