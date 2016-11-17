'use strict';

/* Directives */


/* Controllers */

tandemApp.controller('SystemCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', 'ManifestShowResource', '$interval', 'staffStatusResource', '$timeout', '$mdDialog', 'PaymentResource',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, ManifestShowResource, $interval, $staffStatusResource, $timeout, $mdDialog, $PaymentResource) {

        $scope.groupidview = false;


        $scope.mpTest = function () {
            $http.get('endpoints/mpsearch1.php')
                .success(function (data) {
                    $scope.mpayment = data;
                });
        };

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
        $scope.orderByField = "['schtime','groupid']";

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

        $scope.refreshManifestInt = function() {
            if (!($scope.dtdate === undefined)) {
                var queryday = ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
                ManifestShowResource.query({date: queryday}).$promise.then(function (result) {
                    $scope.manifestLoads = result;
                    $timeout(function(){
                        $scope.refreshManifestInt();
                    },3000)
                }, function (error) {
                    console.log(error);
                    $timeout(function(){
                        $scope.refreshManifestInt();
                    },6000)
                });
            }
            else {
                $timeout(function(){
                    $scope.refreshManifestInt();
                },6000)
            }
        }

        $scope.refreshManifestInt();

        $scope.refreshReception = function(){

            if ((!$scope.onUpdate) && !($scope.dtdate === undefined)) {
                var queryday = '';
                if ($scope.biggerthandatelocal) {
                    queryday = '>'
                }
                ;

                if ($scope.limboon) {
                    queryday = 'LIMBO'
                }
                ;

                if ($scope.manifestedon) {
                    queryday = 'MANIFESTED';
                }
                ;

                queryday += ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
                if (!(queryday == "undefined")) {
                    BookResource.query({date: queryday}).$promise.then(function (result) {
                        if (!$scope.onUpdate) {
                            if (result.length > 0) {
                                $scope.lastgroupid = result[0].groupid;
                                $scope.Books = result;
                            }
                        };
                        $timeout(function(){
                            $scope.refreshReception();
                        },10000)
                    }, function (error) {
                        if (!$scope.onUpdate) {
                            $scope.Books = [];
                        };
                        $timeout(function(){
                            $scope.refreshReception();
                        },6000)
                    });
                }
            }
            else {
                $timeout(function(){
                    $scope.refreshReception();
                },6000)
            }


        };

        $scope.refreshReception();

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
                $scope.date = data[0].date;
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
            bookcopy.dob = new Date(book.dob);

            var modalInstance = $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'manifestEditCtrl',
                resolve: {
                    item: function () {
                        return bookcopy;
                    }
                }
            }).result.then(function (item) {
                    if (!angular.equals(book, item)) {
                        $scope.onUpdate = true;
                        item.dob = (item.dob, "yyyy/MM/dd");
                        $scope.Books[$scope.Books.indexOf(book)] = item;
                        item.$save().then(function () {
                            $scope.onUpdate = false;
                        });
                    }
                });
        };


        $scope.sendToManifest = function (book) {
            $scope.varindex = $scope.Books.indexOf(book);

            var bookcopy = angular.copy(book);
            bookcopy.dob = new Date(book.dob);

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
                        }
                        ;
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

        $scope.selectFila = function (row, book) {
            $scope.selectedrow = row;
            $scope.indice = row;
            $scope.selectedbook = book;
        };


        $scope.setGroupColor = function (book) {
            if (this.$first) {
                $scope.colorGroup = "ffcc66"
            }
            if (!(angular.isUndefined(book.color))) {
                return {"background-color": book.color};
            }
            else {
                if (book.groupid != $scope.lastgroupid) {
                    $scope.lastgroupid = book.groupid;
                    if ($scope.colorGroup === "ffcc66") {
                        $scope.colorGroup = "ffff99";
                    }
                    else {
                        $scope.colorGroup = "ffcc66";
                    }
                    ;
                }
                ;
                book.color = $scope.colorGroup;
                return {"background-color": $scope.colorGroup};
            }
            ;
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

        $scope.payments = [{id: 1, name: 'Efectivo'}, {id: 2, name: 'Tarjeta de Credito'}];

        $scope.editTimePayment = function (book) {

            $scope.promise = BooksGroupsResource.query({groupid: book.groupid}).$promise.then(function (resultBooksGroups) {
                if (resultBooksGroups.length > 0) {
                    $scope.bookgroup = resultBooksGroups[0];
                    /* Agragado para solucionar el tema del deposito por mano y el vdeposito*/
                    if (book.vdeposit > 0) {
                        $scope.bookgroup.deposit = 0;
                    }
                    $scope.bookgroup.cant = ($scope.Books.filter(function (book) {
                        return book.groupid === $scope.bookgroup.groupid
                    })).length;
                };

                var modalInstance = $uibModal.open({
                    templateUrl: 'timepaymentEdit.html',
                    controller: 'timepaymentEditCtrl',
                    resolve: {
                        item: function () {
                            return $scope.bookgroup;
                        }
                    }
                }).result.then(function (item) {
                        if (item.bookdate != '0000-00-00') {
                            item.bookdate = $filter('date')(item.bookdate, "yyyy/MM/dd");
                        }
                        item.$save();
                        book.deposit = item.deposit;
                        var bookcopy = angular.copy(book);
                        $scope.onUpdate = true;
                        bookcopy.$save().then(function () {
                            $scope.onUpdate = false;
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

            queryday += ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
            $scope.promise = BookResource.query({date: queryday}).$promise.then(function (result) {
                if (result.length != 0) {
                    $scope.lastgroupid = result[0].groupid;
                    $scope.selectFila(0);
                }
                else {
                    $scope.Books = [];
                }
                $scope.Books = result;

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

        $scope.editLoads = function () {
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

        $scope.refreshPays = function () {
            var queryday = ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
            $http.post("endpoints/getpayments.php?date='" + queryday + "'").success(function (data) {
                $scope.pagos = data;

                $scope.deposittotal = function () {
                    var total = 0;
                    for (var i = 0; i < $scope.pagos.length; i++) {
                        total += parseInt($scope.pagos[i].deposit);
                    }
                    return total;
                };

                $scope.cashtotal = function () {
                    var total = 0;
                    for (var i = 0; i < $scope.pagos.length; i++) {
                        total += parseInt($scope.pagos[i].cash);
                    }
                    return total;
                };

                $scope.transfer = 300;
                $scope.otrosgastos = 0;
                $scope.avion = $scope.pagos.length * 800;



            });
        };


        $scope.startClock = function (starttime) {
            countdown(starttime.getHours(), starttime.getMinutes())
        };

        function countdown(minutes, seconds) {
            var endTime, hours, mins, msLeft, time;

            function twoDigits(n) {
                return (n <= 9 ? "0" + n : n);
            }

            $scope.updateTimer = '';
            $scope.updateTimer = function () {
                msLeft = endTime - (+new Date);
                if (msLeft < 1000) {
                    $scope.countdowntimer = "A SALTAR!!";
                    var audio = document.getElementById("audio1");
                    var audio2 = document.getElementById("audio2");
                    audio.play();
                    $timeout(function(){audio.play();}, 1000);
                    $timeout(function(){audio2.play();}, 2000);

                } else {
                    time = new Date(msLeft);
                    hours = time.getUTCHours();
                    mins = time.getUTCMinutes();
                    $scope.countdowntimer = (hours ? hours + ':' + twoDigits(mins) : mins) + ':' + twoDigits(time.getUTCSeconds());

                    $timeout(function () {
                        $scope.updateTimer();
                    }, 1000);
                    //setTimeout(updateTimer, time.getUTCMilliseconds() + 500);
                }
            }

            endTime = (+new Date) + 1000 * (60 * minutes + seconds) + 500;
            $scope.updateTimer();
        }

        $scope.smtpAlert = function(item) {
            alert('se envio alerta');
            $http.post('endpoints/emailalerts.php?groupid=' + item.groupid, { cache: 'true'})
                .success(function(result) {
                    if (result.error == 'error') {
                        $scope.alert('error');
                    }})
        }

    }

]);

tandemApp.controller('BookingCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', '$timeout', '$mdDialog',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, $timeout, $mdDialog) {


        'use strict';

        $scope.TimeSlots = [];

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
                $scope.updateTimeSlots($scope.selectedTime);
            });


        $http.get('endpoints/date.php', { cache: 'true'})
            .success(function(data) {
                $scope.date = data[0].date;
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
        };

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
                    if ($scope.bookedit) {
                        $scope.updateTimeSlots('0');
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
                if ($scope.bookedit) {
                    $scope.updateTimeSlots('0');
                }

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
                        $scope.depositpayed = false;
                            angular.forEach($scope.Books, function(value, key) {
                                if (value.vdeposit > 0) {
                                    $scope.depositpayed = true;
                                }
                            });

                        BooksGroupsResource.query({groupid: $scope.groupid}).$promise.then(function(resultBooksGroups) {
                            if (resultBooksGroups.length > 0) {
                                $scope.selectedTime = resultBooksGroups[0].selectedTime;
                                $scope.dt = resultBooksGroups[0].bookdate;
                                var bookenddate = new Date(resultBooksGroups[0].bookdate + " 00:00:00");
                                var nextday = new Date($scope.date);
                                nextday.setDate(nextday.getDate() + 1);

                                if (bookenddate <= nextday) {
                                    $scope.dtdisabled = true;
                                }
                                //$scope.updateTimeSlots(resultBooksGroups[0].selectedTime);
                            }
                        });
                    }
                });

            }
            else {
                $scope.Books = [];
            };
        };

        $scope.updateTimeSlots = function(selectedTime) {
            var obj = {};
            var obj = new Object();
            var fecha = $filter('date')($scope.dt, "yyyy/MM/dd");
            var obj = { "date": fecha, "count":$scope.Books.length, "groupid":$scope.groupid, "length": $scope.Books.length};

            $http.post('endpoints/slotsavailables.php', obj , { cache: 'true'})
                .success(function(result) {
                    if (result.error == 'error') {
                        $scope.alert();
                    }
                    else {
                        if (angular.isArray(result)) {
                            result.push({ label:'00:00:00', value: '0'});
                            $scope.TimeSlots = result;
                            $scope.selectedTime = selectedTime;
                        }

                    }
                });
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

                if (!(localStorage.getItem('username') == null) || $scope.bookedit)  {
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

                    $scope.Books[0].bookslength = bookslength;
                    $scope.Books[0].selectedTime = $scope.selectedTime;

                    $scope.promise = $http.post('endpoints/newBooking.php', $scope.Books).success(function (result) {
                        if (result.error == 'error') {
                            $scope.alert();
                        }
                        else {
                            if (angular.isUndefined(result[0].duplicated)) {
                                //$location.path('booksucess/' + bookslength);
                                if (!(bookslength === 0)) {
                                    modalInstance = $uibModal.open({
                                        templateUrl: 'mppayment.php?mpurl=' + result[0].mpurl  + '&booklength=' + bookslength,
                                        controller: 'MPpaymentCtrl',
                                        resolve: {
                                            item: function () {
                                            }
                                        }
                                    }).result.then(function (item) {

                                        }, function () {
                                            $location.path('/booksucess/' + $scope.groupid);
                                        });
                                }
                                else {
                                    $scope.bookupdated = true;
                                }
                            }
                            else
                            {

                                $mdDialog.show(
                                    $mdDialog.alert()
                                        .parent(angular.element(document.querySelector('#popupContainer')))
                                        .clickOutsideToClose(true)
                                        .title('Reserva duplicada')
                                        .textContent('Hemos encontrado una reserva bajo su nombre. Lo redirigiremos a la misma para su edicion.')
                                        .ok('Entendido')
                                );

                                $location.path('/booksucess/' + result[0].duplicated);
                            }
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

                            $scope.Books[0].bookslength = bookslength;
                            $scope.Books[0].selectedTime = $scope.selectedTime;

                            $scope.promise = $http.post('endpoints/newBooking.php', $scope.Books).success(function (result) {
                                if (result.error == 'error') {
                                    $scope.alert();
                                }
                                else {
                                    if (angular.isUndefined(result[0].duplicated)) {
                                        //$location.path('booksucess/' + bookslength);
                                        if (!(bookslength === 0)) {
                                            modalInstance = $uibModal.open({
                                                templateUrl: 'mppayment.php?mpurl=' + result[0].mpurl + '&booklength=' + bookslength,
                                                controller: 'MPpaymentCtrl',
                                                resolve: {
                                                    item: function () {
                                                    }
                                                }
                                            }).result.then(function (item) {

                                                }, function () {
                                                    $location.path('/booksucess/' + $scope.groupid);
                                                });
                                        }
                                        else {
                                            $scope.bookupdated = true;
                                        }
                                    }
                                    else
                                    {
                                        $location.path('/booksucess/' + result[0].duplicated);
                                    }
                                }
                            });
                        })
                };
            }
            else {
                alert("Debe definir un email y telefono");
            };

            };


        /////////////////////////////////////////
        // Date Picker
        $scope.disabled = function (date, mode) {
            if (!(localStorage.getItem('username') == null)) {
                return (mode === 'day' && 0);
            }
            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 ) );
//            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 || date.getDate() === 10 ) );
//            return ( mode === 'day' && !( (date.getDay() === 0 && !(date.getDate() === 23)) || date.getDay() === 6  ) );
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


tandemApp.controller('MPpaymentCtrl', function ($scope, $modalInstance, item) {

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.acceptMP = function() {
        $modalInstance.close(item);
    };

});



tandemApp.controller('QuickReceptionCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource) {


    }]);


tandemApp.controller('timepaymentEditCtrl', function ($scope, $http, $modalInstance, item) {

    $scope.bookgroup = item;
    $scope.dt = item.bookdate;

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

    $scope.updateTimeSlots = function(item) {
        var obj = {};
        var obj = new Object();
        var obj = { "date":item.bookdate, "count":item.cant, "groupid":item.groupid, "admin":true};
        $http.post('endpoints/slotsavailables.php', obj , { cache: 'true'})
            .success(function(result) {
                if (result.error == 'error') {
                    $scope.alert ();
                }
                else {
                    if (angular.isArray(result)) {
                        result.push({label: '00:00:00', value: '0'});
                        $scope.TimeSlots = result;
                        $scope.bookgroup.schtime = item.selectedTime;
                    }
                }
            });
    };

    $scope.updateTimeSlots(item);


});

tandemApp.controller('manifestEditCtrl', function ($scope, $modalInstance, item, $http, $interval) {

    $scope.book = angular.copy(item);
    $scope.cash = $scope.book.pending;

    var obj = {};
    var obj = new Object();
    var obj = {"id": $scope.book.id};
    $http.post('endpoints/paymentsresource.php', obj , { cache: 'true'}).success(function(data){
        if (data.length != 0) {
            $scope.showpayments = data;
        }
    });

    $scope.cashinterval = true;
    $scope.showpaymentsinterval = true;
    $scope.onDeleteUpdate = false;

    $scope.cancel = function () {
        $scope.cashinterval = false;
        $scope.showpaymentsinterval = false;
        $modalInstance.dismiss('Close');
    };

    $scope.saveBook = function() {
        $scope.cashinterval = false;
        $scope.showpaymentsinterval = false;
        $modalInstance.close($scope.book);
    };


   $scope.getCash = function() {

       var objcash = {};
       var objcash = new Object();
       var objcash = {"id": $scope.book.id, "type": "CASH", "net_received_amount": $scope.cash};
       $http.post('endpoints/paymentsresource.php', objcash , { cache: 'true'});
       $scope.mdselected="0";
    };


    $scope.payMP = function() {
        var price = $scope.book.pending * 1.1;
        var obj = {};
        var obj = new Object();
        var mpName =  $scope.book.firstname + ' ' + $scope.book.lastname;
        var obj = {"bookid": $scope.book.id, "price": price, "mpName": mpName, "mpEmail": $scope.book.email, "mpDNI": $scope.book.dni};

        var win = window.open()
        $http.post('endpoints/creatempurl.php', obj).success(function(mpurl){
            win.location = mpurl;
        });
        $scope.mdselected="0";

    };

    $scope.deletePayment = function (item) {
        if (confirm('Desea eliminar el registro?')) {
            var index = $scope.showpayments.indexOf(item);
            var obj = {};
            var obj = new Object();
            var obj = {"id": item.id, "delete": "yes"};

            // remove from database;
            $scope.onDeleteUpdate = true;
            $http.post('endpoints/paymentsresource.php', obj , { cache: 'true'}).success(function()
            {
                $scope.onDeleteUpdate = false;
            });

            $scope.showpayments.splice(index, 1);

            return false;
        }
    }

    var cashpromise = $interval(function () {
            if (($scope.cashinterval) && (!$scope.onDeleteUpdate)) {
                $scope.cashinterval = false;
                $http.get('endpoints/bookings.php?where=id=' + $scope.book.id + "&id=0").success(function (data) {
                    if (data.length != 0) {
                        $scope.book.vdeposit = data[0].vdeposit;
                        $scope.book.pending = data[0].pending;
                    }
                    $scope.cashinterval = true;
            })}
            if (($scope.showpaymentsinterval) && (!$scope.onDeleteUpdate)) {
                $scope.showpaymentsinterval = false;
                var obj = {};
                var obj = new Object();
                var obj = {"id": $scope.book.id};
                $http.post('endpoints/paymentsresource.php', obj , { cache: 'true'}).success(function(data){
                    if (data.length != 0) {
                        $scope.showpayments = data;
                    }
                    $scope.showpaymentsinterval = true;
                });
            }
            }
    , 3000);

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
