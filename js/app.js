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
    'storageService',
    'pusher-angular',
    'bookingsService'

]);

tandemApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'system.html',
                controller: 'SystemCtrl'
            })
            .when('/system', {
                templateUrl: 'system.html',
                controller: 'SystemCtrl'
            })
            .when('/login', {
                templateUrl: 'login.html'
            })
    }]);


/// Services

var storageService = angular.module('storageService', []);
storageService.factory('getLocalStorage', function ($rootScope, $http, $filter) {
    var arrayList = {};

    return {
        //////////////////////////////////////////////////////////////////////////////
        // JumpsTypeReq
        updateJumpsTypeReq: function (array) {
            if (window.localStorage && array) {
                //Local Storage to add Data
                localStorage.setItem("jumpstypereq", angular.toJson(array));
            }
            arrayList = array;
        },
        getJumpsTypeReqAll: function () {
            //Get data from Local Storage
            arrayList = angular.fromJson(localStorage.getItem("jumpstypereq"));
            return arrayList ? arrayList : [];
        },
        findJumpTypeReq: function (jumpid) {
            arrayList = angular.fromJson(localStorage.getItem("jumpstypereq"));
            var jumptype = $.grep(arrayList, function (item) {
                return item.id == jumpid;
            });
            return jumptype[0];
        },
        getJumpTypeReqID: function (jumptype) {
            if (jumptype.video == undefined) { jumptype.video = ''};
                arrayList = angular.fromJson(localStorage.getItem("jumpstypereq"));
                var id = $.grep(arrayList, function (item) {
                    return (item.jumptype == jumptype.jumptype && item.altitude == jumptype.altitude && item.video == jumptype.video);
                });
                if (id.length > 0) {
                    return id[0].id;
                }
                else {
                    return '';
                }
        },

        getJumpTypeReqList: function (jumptype) {
            if (jumptype.video == undefined) { jumptype.video = ''};
            var arrayList = angular.fromJson(localStorage.getItem("jumpstypereq"));
            var reqList = $.grep(arrayList, function (item) {
                return (item.jumptype == jumptype.jumptype && item.altitude == jumptype.altitude && item.video == jumptype.video);
            });
            return reqList;
        },

        //////////////////////////////////////////////////////////////////////////////
        // JumpsTpye
        updateJumpsType: function (array) {
            if (window.localStorage && array) {
                //Local Storage to add Data
                localStorage.setItem("jumpstype", angular.toJson(array));
            }
            arrayList = array;
        },
        getJumpsType: function () {
            //Get data from Local Storage
            arrayList = angular.fromJson(localStorage.getItem("jumpstype"));
            return arrayList ? arrayList : [];
        },

        //////////////////////////////////////////////////////////////////////////////
        // Altitudes
        updateAltitudes: function (array) {
            if (window.localStorage && array) {
                //Local Storage to add Data
                localStorage.setItem("altitudes", angular.toJson(array));
            }
            arrayList = array;
        },
        getAltitudes: function () {
            //Get data from Local Storage
            arrayList = angular.fromJson(localStorage.getItem("altitudes"));
            return arrayList ? arrayList : [];
        },


        //////////////////////////////////////////////////////////////////////////////
        // Videos Type
        updateVideosType: function (array) {
            if (window.localStorage && array) {
                //Local Storage to add Data
                localStorage.setItem("videostype", angular.toJson(array));
            }
            arrayList = array;
        },
        getVideosType: function () {
            //Get data from Local Storage
            arrayList = angular.fromJson(localStorage.getItem("videostype"));
            return arrayList ? arrayList : [];
        },

        //////////////////////////////////////////////////////////////////////////////
        // ManifestLoads

        updateManifestLoads: function updateManifest (scope) {
            if (angular.isArray(scope.manifestLoads)) {
                if (scope.manifestLoads.length > 0) {
                    localStorage.setItem("rManifest", angular.toJson(scope.manifestLoads));
                }
            }

            if ($rootScope.OnUpdateManifest != true && localStorage.getItem('rManifest') != null) {
                localStorage.removeItem("rManifest");

                $rootScope.OnUpdateManifest = true;

                // Save manifest
                var queryday = ($filter('date')(scope.dtdate, "yyyy/MM/dd"));
                var loads_skydivers_reg = scope.manifestLoads;
                var loads_skydivers_delete = scope.loads_skydivers_delete;
                var obj = {'date': queryday, 'loads_skydivers_reg': loads_skydivers_reg, 'loads_skydivers_delete': loads_skydivers_delete, 'creator': scope.creator};
                $http.post('/endpoints/rmanifest.php', obj).then(function (result)
                {
                    $rootScope.OnUpdateManifest = false;
                    $rootScope.internet = true;

                    if (result.data.error == 'error') {
                        alert('error');
                        console.log(result.data.dump);
                    };

                    var rManifestLoads  = angular.fromJson(localStorage.getItem("rManifest"));

                    if (!(rManifestLoads === null)) {
                        updateManifest(scope);
                    }
                    else
                    {
                        scope.loads_skydivers_delete = [];
                    }
                }, function errorCallback() {
                    $rootScope.internet = false;
                    $rootScope.OnUpdateManifest = false;
                    console.log('error on updateManifestLoads');
                });
            }
        },

        saveBooks: function saveBookLocal (scope, item) {
            var rBooks = angular.fromJson(localStorage.getItem("rBooks"));

            if (rBooks == undefined)
            {
                rBooks = [];
            }

            if (item != undefined) {
                rBooks.push(item);
                localStorage.setItem("rBooks", angular.toJson(rBooks));
            }

            if ($rootScope.OnUpdateBooks != true && rBooks.length > 0) {

                $rootScope.OnUpdateBooks = true;
                var info = {'querydate': ($filter('date')($rootScope.dtdate, "yyyy/MM/dd")), 'creator': $rootScope.creator};
                var rBooksCopy = angular.copy(rBooks);
                localStorage.removeItem("rBooks");
                var obj = {'info': info, 'books': rBooksCopy};
                $http.post('endpoints/books_save.php', obj).then(function (){
                    $rootScope.OnUpdateBooks = false;
                    $rootScope.internet = true;
                    rBooks = angular.fromJson(localStorage.getItem("rBooks"));
                    if (rBooks != null) {
                        saveBooksLocal();
                    }
                },function () {
                    $rootScope.internet = false;
                    $rootScope.OnUpdateBooks = false;
                    console.log('error on saveBooks');
                    var rBooksTemp = angular.fromJson(localStorage.getItem("rBooks"));
                    rBooks = rBooksCopy;
                    if (rBooksTemp != null)
                    {
                        rBooks = rBooksCopy.concat(rBooksTemp);
                    }
                    localStorage.setItem("rBooks", angular.toJson(rBooks));
                });
            }
        },

        saveSkydivers: function saveSkydiversLocal (scope, item) {
            var rSkydivers = angular.fromJson(localStorage.getItem("rSkydivers"));

            if (rSkydivers == undefined)
            {
                rSkydivers = [];
            }

            if (item != undefined) {
                rSkydivers.push(item);
                localStorage.setItem("rSkydivers", angular.toJson(rSkydivers));
            }

            if ($rootScope.OnUpdateSkydivers != true && rSkydivers.length > 0) {

                $rootScope.OnUpdateSkydivers = true;

                var info = {'querydate': ($filter('date')($rootScope.dtdate, "yyyy/MM/dd")), 'creator': $rootScope.creator};
                var rSkydiversCopy = angular.copy(rSkydivers);
                localStorage.removeItem("rSkydivers");
                var obj = {'info': info, 'skydivers': rSkydiversCopy};
                $http.post('endpoints/books_save.php', obj).then(function (){
                    $rootScope.OnUpdateSkydivers = false;
                    $rootScope.internet = true;
                    rSkydivers = angular.fromJson(localStorage.getItem("rSkydivers"));
                    if (rSkydivers != null) {
                        saveSkydiversLocal();
                    }
                },function () {
                    $rootScope.internet = false;
                    $rootScope.OnUpdateSkydivers = false;
                    console.log('error on saveSkydivers');
                    var rSkydiversTemp = angular.fromJson(localStorage.getItem("rSkydivers"));
                    rSkydivers = rSkydiversCopy;
                    if (rSkydiversTemp != null)
                    {
                        rSkydivers = rSkydiversCopy.concat(rSkydiversTemp);
                    }
                    localStorage.setItem("rSkydivers", angular.toJson(rSkydivers));
                });
            }
        },

        refreshCash: function (scope) {
            var obj = {'id_booking': scope.book.id};
            scope.promise = $http.post('endpoints/payments_get.php', obj).success(function (data) {
                scope.book.payments = [];
                scope.book.vdeposit = 0;
                if (data.length != 0) {
                    scope.book.payments = data;
                    var total = 0;
                    angular.forEach(scope.book.payments, function(value) {
                        if (value.deleted != 1) {
                            total = total + value.amount;
                        }
                    });
                    scope.book.vdeposit = total;
                };
            });
        },
        savePayments: function savePaymentsLocal (item) {
            var rPayments = angular.fromJson(localStorage.getItem("rPayments"));

            if (rPayments == undefined)
            {
                rPayments = [];
            };

            if (item != undefined) {
                rPayments.push(item);
                localStorage.setItem("rPayments", angular.toJson(rPayments));
            };

            if ($rootScope.OnUpdatePays != true && rPayments.length > 0) {
                $rootScope.OnUpdatePays = true;

                var info = {'querydate': ($filter('date')($rootScope.dtdate, "yyyy/MM/dd")), 'creator': $rootScope.creator};
                var rPaymentsCopy = angular.copy(rPayments);
                localStorage.removeItem("rPayments");
                var obj = {'info': info, 'payments': rPaymentsCopy};
                $http.post('endpoints/payments_save.php', obj).then(function (){
                    $rootScope.OnUpdatePays = false;
                    $rootScope.internet = true;
                    rPayments = angular.fromJson(localStorage.getItem("rPayments"));
                    if (rPayments != null) {
                        savePaymentsLocal();
                    }
                },function () {
                    $rootScope.internet = false;
                    $rootScope.OnUpdatePays = false;
                    console.log('error on savePayments');
                    var rPaymentsTemp = angular.fromJson(localStorage.getItem("rPayments"));
                    rPayments = rPaymentsCopy;
                    if (rPaymentsTemp != null)
                    {
                        rPayments = rPaymentsCopy.concat(rPaymentsTemp);
                    }
                    localStorage.setItem("rPayments", angular.toJson(rPayments));
                });
            };
        },

        ISODateString: function (d){
            function pad(n){return n<10 ? '0'+n : n}
            return d.getFullYear()+'-'
                + pad(d.getMonth()+1)+'-'
                + pad(d.getDate()) +' '
                + pad(d.getHours())+':'
                + pad(d.getMinutes())+':'
                + pad(d.getSeconds())
        },
        updateStaff: function updateStaffLocal (scope) {
            if (angular.isArray(scope.manifestTIs)) {
                if (scope.manifestTIs.length > 0) {
                    localStorage.setItem("rmanifestTIs", angular.toJson(scope.manifestTIs));
                }
            }

            if ($rootScope.OnUpdateManifestTIs != true && localStorage.getItem('rmanifestTIs') != null) {
                localStorage.removeItem("rmanifestTIs");

                $rootScope.OnUpdateManifestTIs = true;

                // Save manifest
                var queryday = ($filter('date')(scope.dtdate, "yyyy/MM/dd"));
                var obj = {'querydate': queryday, 'staffStatus': scope.manifestTIs, 'creator': scope.creator};
                $http.post('/endpoints/staffstatus.php', obj).then(function (result)
                {
                    $rootScope.OnUpdateManifestTIs = false;
                    $rootScope.internet = true;

                    if (result.data.error == 'error') {
                        alert('error');
                        console.log(result.data.dump);
                    };

                    var rmanifestTIs  = angular.fromJson(localStorage.getItem("rmanifestTIs"));

                    if (!(rmanifestTIs === null)) {
                        updateStaffLocal(scope);
                    }
                }, function errorCallback() {
                    $rootScope.internet = false;
                    $rootScope.OnUpdateManifestTIs = false;
                    console.log('error on updatemanifestTIs');
                });
            }
        },

        getSlotsAvailablesAll: function(scope) {
            var obj = { "date" : $filter('date')(scope.dtdate, "yyyy/MM/dd")};
            $http.post('endpoints/slotsavailablesall.php', obj)
                .success(function(result) {
                    if (result.error == 'error') {
                        scope.alert ();
                    }
                    else {
                        scope.TimeSlotsAll = result;
                    }
                })
        },
        saveBooksGroups: function saveBooksGroups (item)  {
            var rBooksGroups = angular.fromJson(localStorage.getItem("rBooksGroups"));

            if (rBooksGroups == undefined)
            {
                rBooksGroups = [];
            };

            if (item != undefined) {
                rBooksGroups.push(item);
                localStorage.setItem("rBooksGroups", angular.toJson(rBooksGroups));
            };

            if ($rootScope.OnUpdateBooksGroups != true && rBooksGroups.length > 0) {
                $rootScope.OnUpdateBooksGroups = true;

                var info = {'querydate': ($filter('date')($rootScope.dtdate, "yyyy/MM/dd")), 'creator': $rootScope.creator};
                var rBooksGroupsCopy = angular.copy(rBooksGroups);
                localStorage.removeItem("rBooksGroups");
                var obj = {'info': info, 'BooksGroups': rBooksGroupsCopy};
                $http.post('endpoints/booksgroups_save.php', obj).then(function (){
                    $rootScope.OnUpdateBooksGroups = false;
                    $rootScope.internet = true;
                    rBooksGroups = angular.fromJson(localStorage.getItem("rBooksGroups"));
                    if (rBooksGroups != null) {
                        saveBooksGroupsLocal();
                    }
                },function () {
                    $rootScope.internet = false;
                    $rootScope.OnUpdateBooksGroups = false;
                    console.log('error on savePayments');
                    var rBooksGroupsTemp = angular.fromJson(localStorage.getItem("rBooksGroups"));
                    rBooksGroups = rBooksGroupsCopy;
                    if (rBooksGroupsTemp != null)
                    {
                        rBooksGroups = rBooksGroupsCopy.concat(rBooksGroupsTemp);
                    }
                    localStorage.setItem("rBooksGroups", angular.toJson(rBooksGroups));
                });
            };
        }
}
});

var bookingsService = angular.module('bookingsService', []);
bookingsService.factory('getBookings', function (BookResource) {
    return {
        getBoookResource: function(querydate, querytype) {
            return BookResource.query({querydate: querydate, querytype: querytype}).$promise.then(function (result) {
                return result;
            });
        }
    }

});
