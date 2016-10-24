'use strict';

/* Directives */


/* Controllers */

tandemApp.controller('SystemCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', 'ManifestShowResource', '$interval', 'staffStatusResource', '$timeout',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, ManifestShowResource, $interval, $staffStatusResource, $timeout) {

        $http.get('endpoints/session.php')
            .success(function (data) {
                if (data.session == 'false') {
                    $location.path('login');
                }
                ;
            });

        /*
         if (localStorage.getItem('username') == null) {
         $location.path('login');
         return;
         }
         */

        $scope.status = {opened: false}

        $scope.alert = function () {

            //reset
            $scope.showError = false;
            $scope.doFade = false;

            $scope.showError = true;

            $scope.errorMessage = 'Error has ocurred!!!';

            $timeout(function () {
                $scope.doFade = true;
            }, 2500);
        };


        $scope.onUpdate = false;

        ManifestShowResource.query().$promise.then(function (result) {
            $scope.manifestLoads = result;
        }, function (error) {
            $scope.manifestLoads = [];

        });

        $scope.intervalManifestShow = false;
        $scope.intervalManifest = false;

        $interval(function () {
            if (!$scope.intervalManifestShow) {
                $scope.intervalManifestShow = true;
                ManifestShowResource.query().$promise.then(function (result) {
                    $scope.manifestLoads = result;
                    $scope.intervalManifestShow = false;
                }, function (error) {
                    console.log(error);
                    $scope.intervalManifestShow = false;
                });

            }
            // AutoUpdate Book list

            if ((!$scope.onUpdate) && (!$scope.intervalManifest)) {

                var queryday = '';
                if ($scope.biggerthandatelocal) {
                    queryday = '>'
                };

                if ($scope.limboon) {
                    queryday = 'LIMBO'
                };

                if ($scope.manifestedon) {
                    queryday = 'MANIFESTED';
                };


                queryday += ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
                if (!(queryday == "undefined")) {
                    $scope.intervalManifest = true;
                    BookResource.query({date: queryday}).$promise.then(function (result) {
                        if (!$scope.onUpdate) {
                            $scope.Books = result;
                        }
                        $scope.intervalManifest = false;
                    }, function (error) {
                        if (!$scope.onUpdate) {
                            $scope.Books = [];
                        }
                        $scope.intervalManifest = false;
                    });
                }
            }

        }, 3000);

        $scope.logoff = function () {
            localStorage.clear();
            $http.post('endpoints/logoff.php')
            $location.path('login');
        };

        $scope.staffStatus = $staffStatusResource.query();
        $scope.updateStaffLoggedin = function (staff) {
            var staffcopy = angular.copy(staff);
            staffcopy.$save();
        };


        $scope.refreshManifest = function () {

            //$scope.manifestLoads = ManifestShowResource.query();

            $scope.promise =
                ManifestShowResource.query().$promise.then(function (result) {
                    $scope.manifestLoads = result;
                });
        };

        $scope.setLoadColor = function (loadnumber) {
            if (loadnumber % 2 == 0) {
                return {"background-color": "ffcc66"}
            }
            else {
                return {"background-color": "ffff99"}
            }
        };


        /*
         $http.get('endpoints/dateenabled.php', { cache: 'true'})
         .success(function(data) {
         $scope.date = data;
         $scope.date = $scope.date.replace("-","/").replace("-","/")
         $scope.toggleDates();
         });
         */

        $http.get('endpoints/date.php', {cache: 'true'})
            .success(function (data) {
                $scope.date = data;
                $scope.date = $scope.date.replace("-", "/").replace("-", "/")
                $scope.toggleDates();
            });

        $scope.isManifestable = function () {
            if ($scope.dt == $scope.date) {
                return true;
            }
        };

        $scope.editBooking = function (book) {
            $scope.varindex = $scope.Books.indexOf(book);

            var bookcopy = angular.copy(book);
            //bookcopy.dob = new Date(book.dob + "T18:00:00");
            bookcopy.dob = book.dob;

            var modalInstance = $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'manifestEditCtrl',
                resolve: {
                    item: function () {
                        return bookcopy;
                    }
                }
            }).result.then(function (item) {
                    if (!angular.equals(bookcopy, item)) {
                        $scope.onUpdate = true;
                        $scope.Books[$scope.varindex] = item;
                        item.$save().then(function () {
                            $scope.onUpdate = false;
                        });
                    }
                });
        };

        $scope.sendToManifest = function (book) {
            $scope.varindex = $scope.Books.indexOf(book);

            var bookcopy = angular.copy(book);
            //bookcopy.dob = new Date(book.dob + "T18:00:00");
            bookcopy.dob = book.dob;

            var modalInstance = $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'manifestEditCtrl',
                //windowClass: 'app-modal-sentToManifest',
                resolve: {
                    item: function () {
                        return bookcopy;
                    }
                }
            }).result.then(function (item) {
                    if (!angular.equals(bookcopy, item)) {
                        item.$save();
                    }

                    $scope.Books.splice($scope.varindex, 1);

                    $scope.onUpdate = true;
                    $http.post('endpoints/automanifest.php', item).success(function (data) {
                        $scope.onUpdate = false;
                        if (data.error == 'error') {
                            $scope.alert();
                        };
                    });

                    /*
                     if (typeof(book) === "object") // update
                     {
                     var index = $scope.Books.indexOf(book);
                     $scope.Books.splice(index, 1, item);
                     }
                     else // add new
                     {
                     $scope.Books.push(item);
                     }
                     */
                });
        };

        $scope.selectFila = function (row) {
            $scope.selectedrow = row;
            $scope.indice = row;
        };

        $scope.showgroupid = function () {
            $scope.groupidview = true;
        }

        function makeid() {
            var mid = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

            for (var i = 0; i < 5; i++)
                mid += possible.charAt(Math.floor(Math.random() * possible.length));
            return mid;
        };


        $scope.open = function (book) {
            var bookcopy = angular.copy(book);
            var modalInstance = $uibModal.open({
                templateUrl: 'bookingEdit.html',
                controller: 'bookingEditCtrl',
                resolve: {
                    item: function () {
                        return book;
                    }
                }
            }).result.then(function (item) {
                    if (typeof(book) === "object") // update
                    {
                        var index = $scope.Books.indexOf(book);
                        $scope.Books.splice(index, 1, item);
                    }
                    else // add new
                    {
                        $scope.Books.push(item);
                    }
                });
        };

        $scope.bookdelete = function (book) {
            if (confirm('Desea eliminar el registro?')) {
                var index = $scope.Books.indexOf(book);

                // remove from database;
                if (typeof book === "object" && book.id > 0) {
                    $scope.onUpdate = true;
                    book.$remove().then(function () {
                        $scope.onUpdate = false;
                    });
                }

                $scope.Books.splice(index, 1);

                return false;
            }
        };

        $scope.Books = [];
        //$scope.Books = BookResource.query({makeid : $scope.groupid});


        $scope.selectFila = function (row) {
            $scope.selectedrow = row;
            $scope.indice = row;
        };

        $scope.payments = [{id: 1, name: 'Efectivo'}, {id: 2, name: 'Tarjeta de Credito'}];

        $scope.editTimePayment = function (book) {

            $scope.promise = BooksGroupsResource.query({groupid: book.groupid}).$promise.then(function (resultBooksGroups) {
                if (resultBooksGroups.length > 0) {
                    $scope.bookgroup = resultBooksGroups[0];
                    $scope.bookgroup.deposit = book.deposit;
                }
                ;
                var modalInstance = $uibModal.open({
                    templateUrl: 'timepaymentEdit.html',
                    controller: 'timepaymentEditCtrl',
                    resolve: {
                        item: function () {
                            return $scope.bookgroup;
                        }
                    }
                }).result.then(function () {
                        $scope.bookgroup.bookdate = $filter('date')($scope.bookgroup.bookdate, "yyyy/MM/dd");
                        $scope.bookgroup.$save();
                        book.deposit = $scope.bookgroup.deposit;
                        var bookcopy = angular.copy(book);
                        $scope.onUpdate = true;
                        $scope.Books[$scope.indice] = book;
                        bookcopy.$save().then(function () {
                            $scope.onUpdate = false;
                        });


                        /*
                         .then(function() {
                         $scope.updateBookList();
                         });
                         */

                        $scope.Books.forEach(function (scopebook) {
                            if (scopebook.groupid == book.groupid) {
                                scopebook.schtime = $scope.bookgroup.schtime;
                                scopebook.notes = $scope.bookgroup.notes;
                                scopebook.pending = 1700 - $scope.bookgroup.deposit;
                                if (!(angular.isUndefined($scope.bookgroup.bookdate))) {
                                    scopebook.bookdate = $scope.bookgroup.bookdate.replace("/", "-").replace("/", "-");
                                }
                            }
                        });


                    });
            });
        };


        $scope.updateBookList = function () {
            $scope.dtdate = this.dt;
            var queryday = '';
            if (this.biggerthandate) {
                $scope.biggerthandatelocal = this.biggerthandate;
                queryday = '>';
                queryday += ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
            }
            else {
                $scope.biggerthandatelocal = false;
            }

            if (this.limbo) {
                $scope.limboon = true;
                queryday = 'LIMBO';
            }
            else {
                $scope.limboon = false;
            }

            if (this.manifested) {
                $scope.manifestedon = true;
                queryday = 'MANIFESTED';
            }
            else {
                $scope.manifestedon = false;
            }

            if (queryday == '') {queryday = ($filter('date')($scope.dtdate, "yyyy/MM/dd"))};
            $scope.promise = BookResource.query({date: queryday}).$promise.then(function (result) {
                $scope.Books = result;
                $scope.selectFila(0);
            }, function (error) {
                console.log(error);
                $scope.Books = [];
                return false;
            });


        };

        /////////////////////////////////////////
        // Date Picker
        $scope.disabled = function (date, mode) {
            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 ) );
            /*
             if ("6" in )
             {
             return true;
             }
             else
             {
             return true;
             }
             */


        };

        $scope.toggleDates = function () {
            $scope.minDate = new Date($scope.date);  //$scope.minDate ? null :
            $scope.minDate.setDate($scope.minDate.getDate() + 1);
            $scope.maxDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
        };

        $scope.opencalendar = function ($event) {
            $scope.status.opened = true;
        };

        $scope.setDate = function (year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };


        // Date Picker End
        ////////////////////////////////////////


        // Available Instructors Select

        $scope.editLoads = function(){
            var modalInstance = $uibModal.open({
                templateUrl: 'editLoad.html',
                controller: 'loadEditCtrl',
                resolve: {
                    item: function () {
                        return "";
                    }
                }
            }).result.then(function (item) {

                });
        }
    }
]);

tandemApp.controller('BookingCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', '$timeout',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, $timeout) {


        'use strict';
        $scope.changeMode = function (mode) {
            $scope.mode = mode;
        };

        $scope.today = function () {
            $scope.currentDate = new Date();
        };

        $scope.isToday = function () {
            var today = new Date(),
                currentCalendarDate = new Date($scope.currentDate);

            today.setHours(0, 0, 0, 0);
            currentCalendarDate.setHours(0, 0, 0, 0);
            return today.getTime() === currentCalendarDate.getTime();
        };

        $scope.loadEvents = function () {
            $scope.eventSource = createRandomEvents();
        };

        $scope.onEventSelected = function (event) {
            $scope.event = event;
        };

        $scope.onTimeSelected = function (selectedTime) {
            console.log('Selected time: ' + selectedTime);
        };

        function createRandomEvents() {
            var events = [];
            for (var i = 0; i < 20; i += 1) {
                var date = new Date();
                var eventType = Math.floor(Math.random() * 2);
                var startDay = Math.floor(Math.random() * 90) - 45;
                var endDay = Math.floor(Math.random() * 2) + startDay;
                var startTime;
                var endTime;
                if (eventType === 0) {
                    startTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + startDay));
                    if (endDay === startDay) {
                        endDay += 1;
                    }
                    endTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + endDay));
                    events.push({
                        title: 'All Day - ' + i,
                        startTime: startTime,
                        endTime: endTime,
                        allDay: true
                    });
                } else {
                    var startMinute = Math.floor(Math.random() * 24 * 60);
                    var endMinute = Math.floor(Math.random() * 180) + startMinute;
                    startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate() + startDay, 0, date.getMinutes() + startMinute);
                    endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate() + endDay, 0, date.getMinutes() + endMinute);
                    events.push({
                        title: 'Event - ' + i,
                        startTime: startTime,
                        endTime: endTime,
                        allDay: false
                    });
                }
            }
            return events;
        }

        $scope.alert = function(){

            //reset
            $scope.showError = false;
            $scope.doFade = false;

            $scope.showError = true;

            $scope.errorMessage = 'Error has ocurred!!!';

            $timeout(function(){
                $scope.doFade = true;
            }, 2500);
        };


        $scope.$watch('dt', function () {
            var querydate = ($filter('date')($scope.dt, "yyyy/MM/dd"));
            var objdate = {date: querydate};
            $http.post('endpoints/datesavailable.php', objdate)
                .success(function (data)
                {
                    $scope.bookingTime = data;
                    if (data.error == 'error') {
                        $scope.alert();
                    };
                });
            });

        $http.get('endpoints/date.php', { cache: 'true'})
            .success(function(data) {
                $scope.date = data;
                $scope.date = $scope.date.replace("-","/").replace("-","/")
                $scope.toggleDates();
            });

        $scope.selectFila = function(row)
        {
            $scope.selectedrow = row;
            $scope.indice = row;
        };

        $scope.showgroupid = function () {
            $scope.groupidview = true;
        }

        function makeid()
        {
            var mid = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

            for( var i=0; i < 5; i++ )
                mid += possible.charAt(Math.floor(Math.random() * possible.length));
            return mid;
        };


        $scope.open = function (book) {
            var bookcopy = angular.copy(book);
            var modalInstance = $uibModal.open({
                templateUrl: 'bookingEdit.html',
                controller: 'bookingEditCtrl',
                resolve: {
                    item: function () {
                        return book;
                    }
                }
            }).result.then(function (item) {
                    if ( typeof(book) === "object" ) // update
                    {
                        var index = $scope.Books.indexOf(book);
                        $scope.Books.splice(index,1,item);
                    }
                    else // add new
                    {
                        $scope.Books.push(item);
                    }
                });
        };

        $scope.bookdelete = function () {
            if (confirm('Desea eliminar el registro?')) {
                var index = $scope.Books.indexOf(this.book);

                // remove from database;
                this.book.deleted = true;

                if (typeof this.book === "object" && this.book.id > 0) {
                //    this.book.$remove();
                }

                //$scope.Books.splice(index, 1);

                return false;
            }
        };

        $scope.Books = [];

        $scope.refreshGroup = function() {
            if ($scope.groupid.length == 5) {
                $scope.groupid = $scope.groupid.toUpperCase();
                $scope.promise = BookResource.query({groupid: $scope.groupid}).$promise.then(function (resultBooks) {
                    $scope.Books = resultBooks;
                    $scope.bookslengthorig = $scope.Books.length;
                    if (resultBooks.length == 0) {
                        $scope.groupid = makeid();
                        $scope.invalidGroupID = true;
                    }
                    else {
                        BooksGroupsResource.query({groupid: $scope.groupid}).$promise.then(function(resultBooksGroups) {
                            if (resultBooksGroups.length > 0) {
                                $scope.dt = resultBooksGroups[0].bookdate;
                            }
                        });
                    }
                });

            }
            else {
                $scope.Books = [];
            };
        };

        // Select if new or edit
        $scope.groupid = $routeParams.groupid;
        if (typeof $scope.groupid === 'undefined') {
            $scope.groupid = makeid();
            $scope.groupidview=false;
            $scope.groupiddisabled = false;
            $scope.invalidGroupID = false;
            $scope.status = {opened: true};
            $scope.bookedit = false;

        }
        else
        {
            $scope.groupidview=true;
            $scope.refreshGroup();
            $scope.status = {opened: false};
            $scope.bookedit = true;

        }

        $scope.saveBooking = function() {
            // Waivers
            var email = false;
            var phone = false;
            angular.forEach($scope.Books, function(book)
            {
                if (!(book.deleted == true))
                {
                    if (!(book.email == undefined)) {
                        email = true;
                    }
                    if (!(book.phone == undefined)) {
                        phone = true;
                    }
                };

            });

            if (email && phone) {

                if (!(localStorage.getItem('username') == null)) {
                    $scope.Books[0].groupid = $scope.groupid;
                    $scope.Books[0].bookdate = $filter('date')($scope.dt, "yyyy/MM/dd");
                    $scope.Books[0].bookedit = $scope.bookedit;
                    var bookslength = $scope.Books.length;
                    if ($scope.bookedit == true) {
                        bookslength = bookslength - $scope.bookslengthorig;
                        if (bookslength <= 0) {
                            bookslength = 0;
                        }
                    }

                    switch (bookslength) {
                        case 0:

                        case 1:
                            $scope.Books[0].paymenturl = 'http://mpago.la/UiG1';
                            break;
                        case 2:
                            $scope.Books[0].paymenturl = 'http://mpago.la/foS9';
                            break;
                        case 3:
                            $scope.Books[0].paymenturl = 'http://mpago.la/60D1';
                            break;
                        case 4:
                            $scope.Books[0].paymenturl = 'http://mpago.la/HVT8';
                            break;
                        case 5:
                            $scope.Books[0].paymenturl = 'http://mpago.la/G3FL';
                            break;
                        default:
                            $scope.Books[0].paymenturl = 'http://mpago.la/1eVD';
                    }
                    //$http.post('endpoints/newBooking.php', $scope.Books);
                    $scope.promise = $http.post('endpoints/newBooking.php', $scope.Books).success(function (result) {
                        if (result.error == 'error') {
                            $scope.alert();
                        }
                        else {
                            $location.path('booksucess/' + bookslength);
                        }
                    });
                }
                else {
                    var modalInstance;
                    modalInstance = $uibModal.open({
                        templateUrl: 'waivers.html',
                        controller: 'termsCtrl',
                        resolve: {
                            item: function () {
                            }
                        }
                    }).result.then(function (item) {
                            // Save DB
                            $scope.Books[0].groupid = $scope.groupid;
                            $scope.Books[0].bookdate = $filter('date')($scope.dt, "yyyy/MM/dd");
                            $scope.Books[0].bookedit = $scope.bookedit;
                            var bookslength = $scope.Books.length;
                            if ($scope.bookedit == true) {
                                bookslength = bookslength - $scope.bookslengthorig;
                                if (bookslength <= 0) {
                                    bookslength = 0;
                                }
                            }

                            switch (bookslength) {
                                case 0:

                                case 1:
                                    $scope.Books[0].paymenturl = 'http://mpago.la/K0Na';
                                    break;
                                case 2:
                                    $scope.Books[0].paymenturl = 'http://mpago.la/GdkH';
                                    break;
                                case 3:
                                    $scope.Books[0].paymenturl = 'http://mpago.la/SEa2';
                                    break;
                                case 4:
                                    $scope.Books[0].paymenturl = 'http://mpago.la/qlQr';
                                    break;
                                case 5:
                                    $scope.Books[0].paymenturl = 'http://mpago.la/ayyS';
                                    break;
                                default:
                                    $scope.Books[0].paymenturl = 'http://mpago.la/1eVD';
                            }
                            //$http.post('endpoints/newBooking.php', $scope.Books);
                            $scope.promise = $http.post('endpoints/newBooking.php', $scope.Books).success(function (result) {
                                if (result.error == 'error') {
                                    $scope.alert();
                                }
                                else {
                                    $location.path('booksucess/' + bookslength);
                                }
                            });

                        });
                }
            }
            else
            {
                alert("Debe definir un email y telefono");
            };

        };


        /////////////////////////////////////////
        // Date Picker
        $scope.disabled = function (date, mode) {
            if (!(localStorage.getItem('username') == null)) {
                return (mode === 'day' && 0);
            }
//            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 ) );
//            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 || date.getDate() === 10 ) );
            return ( mode === 'day' && !( (date.getDay() === 0 && !(date.getDate() === 23)) || date.getDay() === 6  ) );
        };

        $scope.toggleDates = function () {
            if (localStorage.getItem('username') == null) {
                $scope.minDate = new Date($scope.date);  //$scope.minDate ? null :
                $scope.minDate.setDate($scope.minDate.getDate() + 1);
                $scope.maxDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
            }
        };

        $scope.opencalendar = function ($event) {
            $scope.status.opened = true;
        };

        $scope.setDate = function (year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };


        // Date Picker End
        ////////////////////////////////////////
    }
]);


tandemApp.controller('bookingEditCtrl', function ($scope, $modalInstance, item) {

    if ( item == 0 )
    {
        $scope.first = true;
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBook = function() {
        if ($scope.book.dobyear && $scope.book.dobmonth && $scope.book.dobday) {
            $scope.book.dobdate = $scope.book.dobyear + "/" + $scope.book.dobmonth + "/" + $scope.book.dobday;
        }
        if ($scope.book.areacode && $scope.book.phonenumber) {
            $scope.book.phone = '+54' + $scope.book.areacode + $scope.book.phonenumber;
        }
        $modalInstance.close($scope.book);
    };

// Select Date

    $scope.days = function() {

            var daysList = [];
            for( var i = 1; i <= 31 ; i++){
                var iS = i.toString();
                daysList.push( (iS.length < 2) ? '0' + iS : iS ); // Adds a leading 0 if single digit
            }
            return daysList;
        };
    $scope.months = function() {
            var monthList = [];
            for( var i = 1; i <= 12 ; i++){
                var iS = i.toString();
                monthList.push( (iS.length < 2) ? '0' + iS : iS ); // Adds a leading 0 if single digit
            }
            return monthList;
        };

    $scope.years = function() {
            var yearsList = [];
            for( var i = 2000; i >= 1940 ; i--){
                yearsList.push( i.toString() );
            }
            return yearsList;
        };

// End Select Date

});


tandemApp.controller('termsCtrl', function ($scope, $modalInstance, item) {
    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.acceptTerms = function() {
        $modalInstance.close(item);
    };
});


tandemApp.controller('QuickReceptionCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource) {


    }]);



tandemApp.controller('timepaymentEditCtrl', function ($scope, $modalInstance, item) {

    $scope.bookgroup = item;

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBookGroup = function() {
        $modalInstance.close($scope.bookgroup);
    };

    $scope.saveToLimbo = function() {
        $scope.bookgroup.bookdate = '0000-00-00';
        $modalInstance.close($scope.bookgroup);
    };

    /////////////////////////////////////////
    // Date Picker

    $scope.status = {opened: false};

    $scope.disabled = function (date, mode) {
        //return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6  ) );
    };

    $scope.toggleDates = function () {
        $scope.minDate = new Date($scope.date);  //$scope.minDate ? null :
        $scope.minDate.setDate($scope.minDate.getDate() +1 );
        $scope.maxDate = new Date(new Date().setMonth(new Date().getMonth()+1));
    };


    $scope.opencalendar = function ($event) {
        $scope.status.opened = true;
    };

    $scope.setDate = function (year, month, day) {
        $scope.dt = new Date(year, month, day);
    };

    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };

    // Date Picker End
    ////////////////////////////////////////

    $scope.dt = $scope.bookgroup.bookdate;

});

tandemApp.controller('manifestEditCtrl', function ($scope, $modalInstance, item) {

    $scope.book = angular.copy(item);

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBook = function() {
        $modalInstance.close($scope.book);
    };

});


tandemApp.controller('loadEditCtrl', function ($scope, $modalInstance, item, $http) {

    //$scope.book = angular.copy(item);

    $scope.editLoadTIs =  availableTI();

    $scope.cancel = function () {
        //$modalInstance.dismiss('Close');
        var a = 1;
    };

    $scope.saveBook = function() {
        $scope.editLoadTIs =  availableTI();
    };


    function availableTI() {
        return [{"id":"970","firstname":"Sebastian"},{"id":"971","firstname":"Mariano"}];
        /*
        $http.get('endpoints/availableTI.php').success(function (result) {
            if (!(result.error == 'error')) {
                return result;
            }
        });
        */
    }
});
