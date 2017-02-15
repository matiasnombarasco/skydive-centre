'use strict';

/* Directives */

/* Controllers */

tandemApp.controller('SystemCtrl', ['$rootScope', '$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', 'ManifestShowResource', '$interval', '$timeout', 'getLocalStorage', 'orderByFilter', '$pusher', 'getBookings', '$q',
    function($rootScope, $scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, ManifestShowResource, $interval, $timeout, getLocalStorage, orderBy, $pusher, getBookings, $q) {

        $rootScope.internet = true;
        $scope.groupidview = false;
        $scope.manifestLoads = [];
        $scope.parent = {dt:''};
        $scope.checkboxs = {'biggerthandate': false, 'limbo': false, 'manifested':false, 'exFields': false, 'altField': false};
        $scope.creator = makeid();
        $rootScope.creator = $scope.creator

        $scope.loads_skydivers_delete = [];
        localStorage.removeItem("rBooks");
        localStorage.removeItem("rManifest");
        localStorage.removeItem("rPayments");
        localStorage.removeItem("rSkydivers");
        localStorage.removeItem("rBooksGroups");

        $scope.syncDB = function ()
        {
            $timeout(function ()
            {
                if ($rootScope.internet == false)
                {
                    getLocalStorage.saveBooks($scope);
                    getLocalStorage.saveSkydivers($scope);
                    getLocalStorage.savePayments();
                    getLocalStorage.saveBooksGroups();
                    getLocalStorage.updateManifestLoads($scope);
                };
                $scope.syncDB();
            },5000);
        };

        $scope.syncDB();
        // Pusher
        var username = localStorage.getItem("username");
        if (username != null) {

            Pusher.logToConsole = true;

            $scope.pusher = new Pusher('1e138a11b344a3de1454', {
                encrypted: true
            });

            $scope.channel = $scope.pusher.subscribe('paracaidismo');
            $scope.channel.bind('main', function (data) {
                if (data.date == $scope.dtdatefmt && data.creator != $scope.creator) {
                    if (data.manifest) {
                        $scope.refreshManifest();
                        console.log('manifest push');
                    }
                    if (data.bookings) {
                        $scope.updateBookList();
                        console.log('booking push');
                    }
                }
            });

        }
        ////////////////////////////////////////////////////////////////////////

        //$http.get('endpoints/pusher.php', { cache: 'true'});

        $http.get('endpoints/jumptypes.php', { cache: 'true'}).success(function(data){
            getLocalStorage.updateJumpsTypeReq(data[0][0]);
            getLocalStorage.updateJumpsType(data[0][1]);
            getLocalStorage.updateAltitudes(data[0][2]);
            getLocalStorage.updateVideosType(data[0][3]);
        });



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
                };
            });

        /*
         if (localStorage.getItem('username') == null) {
         $location.path('login');
         return;
         }
         */

        $scope.status = {opened: false};
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

        $scope.logoff = function () {
            localStorage.clear();
            $http.post('endpoints/logoff.php')
            $location.path('login');
        };


        $scope.TIavailables = function () {
            var querydate = ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
            var obj = {'querydate' : querydate};

            $http.post('endpoints/staffstatus.php', obj , { cache: 'true'})
            .success(function (data) {
                $scope.manifestTIs = data;
            });
        };

        $scope.updateStaffLoggedin = function (staff) {
            staff.start_jumps = 0;

            // set start jumps
            if ($scope.manifestLoads.length > 0)
            {
                var manifestTIsEnabledTemp = $scope.TItandemweight(staff.InstJumpStart + 1);

                var TIorderByPeso = orderBy($.grep(manifestTIsEnabledTemp, function (TItemp) {
                    return (TItemp.loggedin != 0 && TItemp.id != staff.id && TItemp.InstJumpStop == 0 && staff.InstJumpStart > TItemp.InstJumpStart);
                }), '[-saltos,peso]');
                if (TIorderByPeso.length > 0) {
                    staff.start_jumps = TIorderByPeso[0].saltos;
                }
            }

            console.log($scope.manifestTIs);

            getLocalStorage.updateStaff($scope);
        };


        $scope.refreshManifest = function () {
            return $q(function(resolve) {
                var queryday = ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
                ManifestShowResource.query({querydate: queryday}).$promise.then(function (result) {
                    if (result[0] != "") {
                        $scope.manifestLoads = result;
                        resolve();
                    }
                    else {
                        $scope.manifestLoads = [];
                        resolve();
                    };
                });
                $scope.LoadSkydivers();
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

        $http.get('endpoints/date.php')
            .success(function (data) {
                $scope.date = data[0].date;
                $scope.date = $scope.date.replace("-", "/").replace("-", "/")
                $scope.toggleDates();
            });

        $scope.isManifestable = function () {
            if ($scope.parent.dt == $scope.date) {
                return true;
            }
        };

        $scope.editBooking = function () {

            var book = $scope.selectedRowBook;

            var bookcopy = angular.copy(book);
            book.dob = new Date(book.dob);
            $scope.action = 'edit';

            $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'manifestEditCtrl',
                scope: $scope,
                resolve: {item: book}
            }).result.then(function (item) {
                    delete $scope.action;
                    if (angular.isDate(item.dob)) {
                        item.dob.setMinutes(item.dob.getMinutes() + item.dob.getTimezoneOffset());
                        item.dob = ($filter('date')(item.dob, "yyyy/MM/dd"));
                    }

                    // Search in manifest
                    var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                        return loaddata.skydiverid == item.id;
                    });

                    // If it's in manifest
                    if (loadreg.length > 0) {
                        var jumpstype = getLocalStorage.findJumpTypeReq(item.jumptypeid);
                        loadreg[0].jumptypeid = item.jumptypeid;
                        loadreg[0].altitude = item.altitude;
                        loadreg[0].video = item.video;
                        loadreg[0].priceslots = jumpstype.priceslots;
                        loadreg[0].price = jumpstype.price;

                        angular.forEach(item.jumpTypeReqList, function (reg) {

                            var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                                return loaddata.instructor == item.id;
                            });

                            if (loadreg.length > 0) {
                                loadreg[0].jumptypeid = reg.id;
                                loadreg[0].altitude = reg.altitude;
                                loadreg[0].video = reg.video
                                loadreg[0].priceslots = reg.priceslots;
                                loadreg[0].price = reg.price;
                            }
                        });

                        getLocalStorage.updateManifestLoads($scope);
                    }

                    getLocalStorage.saveBooks($scope,item);

                }, function (item) {
                    delete $scope.action;
                    //var index = $scope.Books.indexOf(book);
                    //$scope.Books[index] = bookcopy;
                });

        };

        $scope.updateManiestReg = function(item) {
            angular.forEach($scope.manifestLoads, function (loadreg)
            {

            });
        };

        $scope.sendToManifest = function (book) {

            var book = $scope.selectedRowBook;

            var bookcopy = angular.copy(book);
            book.dob = new Date(book.dob);
            $scope.action = 'manifest';

            var modalInstance = $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'manifestEditCtrl',
                scope: $scope,
                resolve: {item: function () {
                    return book;
                }}
            }).result.then(function (item)
                {
                    delete $scope.action;
                    if (angular.isDate(item.dob)) {
                        item.dob.setMinutes(item.dob.getMinutes() + item.dob.getTimezoneOffset());
                        item.dob = ($filter('date')(item.dob, "yyyy/MM/dd"));
                    }
                    if (!angular.equals(bookcopy, item))
                    {
                        getLocalStorage.saveBooks($scope, item);
                    }

                    if (item.pending > 0)
                    {
                        if (!confirm('Saldo pendiente, Desa continuar?')) {
                            return;
                        }
                    };

                    $scope.sendToManifestLocal(item);
                    $scope.selectFila(-1,'');
                }, function ()
                    {
                        delete $scope.action;
                        //var index = $scope.Books.indexOf(book);
                        //$scope.Books[index] = bookcopy;
                    });
        };

        $scope.sendToManifestLocal = function (item) {

            // Look for last load
            var arrayLoads = orderBy($scope.loadsList($scope.manifestLoads), 'loadnumber', true);

            var loaddate = ($filter('date')($scope.dtdate, "yyyyMMdd"));

            if (arrayLoads.length > 0)
            {
                var load = arrayLoads[0];
                var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                    return loaddata.loadnumber == load.loadnumber;
                });

                if ((4 - loadreg.length) < (item.jumpTypeReqList.length +1) ) {
                    // Generate loadid
                    var loadid = "" + loaddate + (load.loadnumber + 1);
                    // Create loadreg
                    load = {'loadnumber': (load.loadnumber +1), 'loadid': loadid};
                };
            }
            else
            {
                var loadid = "" + loaddate + '1';
                load = {'loadnumber': 1, 'loadid': loadid};
            }

            var jumpstype = getLocalStorage.findJumpTypeReq(item.jumptypeid);

            var autoid = "" + load.loadid + item.id;
            var newloadreg = {
                'autoid': autoid,
                'skydiverid': item.id,
                'skydiver': item.firstname,
                'weight': item.weight,
                'altitude': item.altitude,
                'jumptypeid': item.jumptypeid,
                'jumptype':  item.jumptype,
                'description':  jumpstype.description,
                'instructor': 0,
                'altitude': item.altitude,
                'video': item.video,
                'loadid': load.loadid,
                'loadnumber': load.loadnumber,
                'priceslots': jumpstype.priceslots,
                'price' : jumpstype.price
            };

            // Send to Manifest
            $scope.manifestLoads.push(newloadreg);

            // Clear null reg for empty loads
            var loadclean = $.grep($scope.manifestLoads, function (loaddata) {
                return loaddata.skydiverid == null;
            });

            angular.forEach(loadclean, function (value) {
                var index = $scope.manifestLoads.indexOf(value)
                $scope.manifestLoads.splice(index,1);
            });
            /// end clean

            angular.forEach(item.jumpTypeReqList, function(regJT) {
                if (regJT.skydiverid === undefined) {

                    var manifestTIsEnabled = $scope.TItandemweight(load.loadnumber);

                    // Look for TI
                    var TIs = orderBy($.grep(manifestTIsEnabled, function(TI)
                        {
                            var isInLoad = $.grep($scope.manifestLoads, function(loadreg){
                                return (loadreg.loadid == load.loadid && loadreg.skydiverid == TI.id);
                            });
                            return (TI.loggedin != 0 && !(isInLoad.length) && TI.InstJumpStop == 0);

                        }), '[saltos+Asc,loggedin+"Asc"]');
                    regJT.skydiverid = TIs[0].id;
                    regJT.name = TIs[0].name;
                    regJT.weight = TIs[0].weight;
                    regJT.TIlocked = false;
                }
                else
                {
                    var TI = $.grep($scope.manifestTIs, function (TI) {
                        return (TI.id == reg.skydiverid);
                    });
                    regJT.name = TI[0].name;
                    regJT.weight = TI[0].weight;
                    regJT.TIlocked = true;
                }

                var jumpstype = getLocalStorage.findJumpTypeReq(regJT.id);

                var autoid = "" + load.loadid + regJT.skydiverid;
                var newloadreg = {
                    'autoid': autoid,
                    'skydiverid': regJT.skydiverid,
                    'skydiver': regJT.name,
                    'weight': regJT.weight,
                    'altitude': regJT.altitude,
                    'jumptypeid': regJT.id,
                    'jumptype': regJT.jumptype,
                    'description': regJT.description,
                    'instructor': item.id,
                    'altitude': regJT.altitude,
                    'video': regJT.video,
                    'loadid': load.loadid,
                    'loadnumber': load.loadnumber,
                    'priceslots': jumpstype.priceslots,
                    'price' : jumpstype.price,
                    'TIlocked' : regJT.TIlocked
                };
                // Send to Manifest
                $scope.manifestLoads.push(newloadreg);
            });

            $scope.automanifestReOrderLocal(load.loadnumber);

            // save manifest to db
            getLocalStorage.updateManifestLoads($scope);

        };

        $scope.selectFila = function (index, book) {
            $scope.selectedrow = index;
            $scope.selectedRowBook = book;
        };

        $scope.selectFilaManifestMgnt = function(row, loadvalues) {
            $scope.selectedrowManifestMgntObj = loadvalues;
            $scope.selectedrowManifestMgnt = row;
        };

        $scope.selectFilaSkydiver = function (index, skydiver) {
            $scope.selectedRowSkydiver = index;
            $scope.selectedRowSkydiverObj = skydiver;
        };

        $scope.selectSkydiver = function (row) {
            $scope.selectedskydiver = row;
        };


        $scope.setWeightColor = function(book) {
            if (book.weight > 90)
            {
                return {"color": "red", "font-weight": "bold"};
            }
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
                resolve: {item: book}
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

        $scope.bookInsert = function () {

            var mid = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

            $scope.action = 'edit';

            for( var i=0; i < 5; i++ )
                mid += possible.charAt(Math.floor(Math.random() * possible.length));

            var book = {
                'groupid' : mid,
                'bookdate': $scope.dtdatefmt,
                'id': 0,
                'firstname' : '',
                'lastname' : '',
                'dni' : 0,
                'email' : '',
                'dob' : 0,
                'phone' : '',
                'weight' : 0,
                'pending': 0,
                'vdeposit': 0,
                'jumptypeid': 1,
                'bookinsert': true};

            var modalInstance = $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'manifestEditCtrl',
                scope: $scope,
                resolve: {item: book}
            }).result.then(function (item) {
                    delete $scope.action;
                    if (angular.isDate(item.dob)) {
                        item.dob.setMinutes(item.dob.getMinutes() + item.dob.getTimezoneOffset());
                        item.dob = ($filter('date')(item.dob, "yyyy-MM-dd"));
                    }

                    item.creator = 'XXXXX';
                    $http.post('/endpoints/newBookingSystem.php', item , { cache: 'true'});
                });


        };

        $scope.bookdelete = function () {

            var book = $scope.selectedRowBook;

            if (confirm('Desea eliminar el registro?')) {
                var index = $scope.Books.indexOf(book);

                book.deleted = 1;
                getLocalStorage.saveBooks($scope,  book);

                $scope.lastgroupid = $scope.Books[0].groupid;
                angular.forEach($scope.Books, function (value) {
                    value.color = undefined;
                });
                $scope.$apply;
                return false;
            }
        };

        $scope.Books = [];

        $scope.payments = [{id: 1, name: 'Efectivo'}, {id: 2, name: 'Tarjeta de Credito'}];

        $scope.editTimePayment = function () {

            var book = $scope.selectedRowBook;
            /*
            $scope.promise = BooksGroupsResource.query({groupid: book.groupid}).$promise.then(function (resultBooksGroups)
            {
                if (resultBooksGroups.length > 0) {
                    $scope.bookgroup = resultBooksGroups[0];
            */

            $scope.bookgroup = {groupid: book.groupid, bookdate: book.bookdate, notes: book.notes, selectedTime: book.selectedTime};

            if ($scope.bookgroup.bookdate != '')
            {
                $scope.bookgroup.bookdate = new Date($scope.bookgroup.bookdate);
                $scope.bookgroup.bookdate.setMinutes( $scope.bookgroup.bookdate.getMinutes() + $scope.bookgroup.bookdate.getTimezoneOffset());
            }

            var modalInstance = $uibModal.open({
                templateUrl: 'timepaymentEdit.html',
                controller: 'timepaymentEditCtrl',
                scope: $scope,
                resolve: {
                    item: function () { return $scope.bookgroup;}
                }
            }).result.then(function (item)
                {
                    item.bookdate = $filter('date')(item.bookdate, "yyyy-MM-dd");
                    angular.forEach($scope.Books, function(book) {
                        if (book.groupid == item.groupid) {
                            book.bookdate = item.bookdate;
                            book.notes = item.notes;
                            book.selectedTime = item.selectedTime;
                            var ST = {label: '00:00:00'};
                            if (item.selectedTime != 0) {
                                ST = $.grep($scope.TimeSlotsAll, function (ts) {
                                    return  ts.value == item.selectedTime;
                                });
                                ST = ST[0];
                            }
                            book.schtime = ST.label;
                        }
                    });
                    getLocalStorage.saveBooksGroups(item);
                });

            //});
        };

        $scope.updateBookList = function () {

            $scope.dtdate = $scope.parent.dt;
            $rootScope.dtdate = $scope.parent.dt;
            $scope.dtdatefmt = ($filter('date')($scope.dtdate, "yyyy-MM-dd"));

            $scope.querytype = '';

            if ($scope.checkboxs.biggerthandate) {
                $scope.querytype = 'AFTERDATE';
            }


            if ($scope.checkboxs.limbo) {
                $scope.querytype = 'LIMBO';
            }

            var querydate = ($filter('date')($scope.dtdate, "yyyy/MM/dd"));

            getLocalStorage.getSlotsAvailablesAll($scope);

            $scope.promise = getBookings.getBoookResource(querydate, $scope.querytype).then(function (result) {
                if (result.length != 0) {
                    $scope.lastgroupid = result[0].groupid;
                    $scope.Books = result;
                    $scope.selectFila(-1,'');
                }
                else {
                    $scope.Books = [];
                }
                $scope.TIavailables();
                $scope.refreshManifest();

            }, function (error) {
                console.log(error);
                $scope.Books = [];
            });

        };

        $scope.BooksFilter = function (book) {
            var bookadd = $.grep($scope.manifestLoads, function (item)
            {
                return book.id == item.skydiverid;
            });

            if ($scope.checkboxs.manifested == true) {
                return (book.deleted != 1 && (bookadd.length));
            }
            else
            {
                if ($scope.checkboxs.biggerthandate == true) {
                    return (book.deleted != 1 && !(bookadd.length));
                }
                else {
                    if ($scope.checkboxs.limbo == true) {
                        return (book.deleted != 1 && !(bookadd.length) && book.bookdate == '');
                    }
                    else {
                        return (book.deleted != 1 && !(bookadd.length) && book.bookdate == $scope.dtdatefmt);
                    }
                }
            }
        };


        /////////////////////////////////////////
        // Date Picker
        $scope.disabled = function (date, mode) {
            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 ) );
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
            $scope.parent.dt = new Date(year, month, day);
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
            $http.post("endpoints/getDailyPayments.php?date='" + queryday + "'").success(function (data) {
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

                $scope.getTandemSlotsTotal();
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
        };

        $scope.allToLimbo = function () {
            if (confirm('Desea enviar todos al limbo?')) {
                if (confirm('Se moveran y enviara correo. Seguro?')) {
                    var queryday = ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
                    $scope.promise = $http.post("endpoints/sorry.php?date='" + queryday + "'").success(function () {
                        $scope.updateBookList();
                    });
                };
            };
        };

        $scope.TIselect = function(jumper) {
            /*
            if (jumper.jumptype != undefined) {
                if (jumper.jumptype.substring(0, 2) == 'TI') {
                    return true;
                }
        }
            return false;
            */
        };

        $scope.NotCustomer = function(jumper) {
            if (jumper.instructor == 0 || jumper.autoid == null)
            {
                return true;
            }
            return false;
        };

        $scope.test = function (item) {
            console.log(item);
        };

        $scope.createNewLoad = function() {
            // Look for last load
            var arrayLoads = orderBy($scope.loadsList($scope.manifestLoads), 'loadnumber', true);

            if (arrayLoads.length > 0)
            {
                var load = arrayLoads[0];
            }
            else
            {
                load = {'loadnumber': 0};
            }

            var loaddate = ($filter('date')($scope.dtdate, "yyyyMMdd"));
            var loadid = "" + loaddate + (load.loadnumber + 1);

            var newloadreg = {
                'autoid': '',
                'skydiverid': null,
                'skydiver': null,
                'weight': null,
                'altitude': null,
                'jumptypeid': null,
                'jumptype':  null,
                'instructor': 0,
                'altitude': null,
                'video': null,
                'loadid': loadid,
                'loadnumber': load.loadnumber + 1
            };

            // Send to Manifest
            $scope.manifestLoads.push(newloadreg);

            // Save manifest
            getLocalStorage.updateManifestLoads($scope);
        };

        $scope.LoadSkydivers = function() {
            $http.get('/endpoints/skydivers.php').success(function (data) {
                $scope.Skydivers = data;
            });
        };

        $scope.LoadSkydivers();

        $scope.AddSkydiverToLoad = function (skydiver) {
            if (!(skydiver === undefined) && !($scope.selectedrowManifestMgntObj === undefined)) {

                // check if skydiver already in load
                var loadnumber = $scope.selectedrowManifestMgntObj[0].loadnumber;
                var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                    return loaddata.loadnumber == loadnumber;
                });

                var SkydiverInLoad = $.grep(loadreg, function (value) {
                    return (value.skydiverid == skydiver.id);
                });

                if (SkydiverInLoad.length == 0) {

                    var loadid = $scope.selectedrowManifestMgntObj[0].loadid;

                    var loadnumber = $scope.selectedrowManifestMgntObj[0].loadnumber;

                    var jumpstype = getLocalStorage.findJumpTypeReq(skydiver.jumptypeid);

                    var autoid = "" + loadid + skydiver.id;
                    var newloadreg = {
                        'autoid': autoid,
                        'skydiverid': skydiver.id,
                        'skydiver': skydiver.firstname,
                        'weight': skydiver.weight,
                        'altitude': skydiver.altitude,
                        'jumptypeid': skydiver.jumptypeid,
                        'jumptype':  jumpstype.jumptype,
                        'description':  jumpstype.description,
                        'instructor': 0,
                        'altitude': jumpstype.altitude,
                        'loadid': loadid,
                        'loadnumber': loadnumber,
                        'priceslots': jumpstype.priceslots,
                        'price': jumpstype.price
                    };

                    // Send to Manifest
                    $scope.manifestLoads.push(newloadreg);

                    // Clear null reg for empty loads
                    var loadclean = $.grep($scope.manifestLoads, function (loaddata) {
                        return loaddata.skydiverid == null;
                    });

                    angular.forEach(loadclean, function (value) {
                        var index = $scope.manifestLoads.indexOf(value)
                        $scope.manifestLoads.splice(index,1);
                    });
                    /// end clean

                    // Save manifest
                    getLocalStorage.updateManifestLoads($scope);
                }
                else
                {
                    $scope.question = "Paracaidista ya se encuentra en el vuelo";
                    $scope.questionModal = $uibModal.open({
                        templateUrl: 'question.html',
                        scope: $scope
                    });
                }
            }
            else {
                alert("Seleccione un paracaidista y un vuelo");
            }
        }

        $scope.moveUpLocal = function() {
            var loadfrom = $scope.selectedrowManifestMgntObj[0].loadnumber;
            var loadidfrom = $scope.selectedrowManifestMgntObj[0].loadid;

            var arrayList = $.grep($scope.manifestLoads, function (load) {
                return load.loadnumber < loadfrom;
            });

            var arrayListOrder = orderBy($scope.loadsList(arrayList), 'loadnumber', true);
            if (arrayListOrder.length > 0)
            {
                var loadto = arrayListOrder[0].loadnumber;
                var loadidto = arrayListOrder[0].loadid;

                var loadfromreg = $.grep($scope.manifestLoads, function (load) {
                    return load.loadnumber == loadfrom;
                });

                var loadtoreg = $.grep($scope.manifestLoads, function (load) {
                    return load.loadnumber == loadto;
                });

                angular.forEach(loadfromreg, function(value, key) {
                    value.loadnumber = loadto;
                    value.loadid = loadidto;
                    value.autoid = "" + value.loadid + value.skydiverid;
                });

                angular.forEach(loadtoreg, function(value, key) {
                    value.loadnumber = loadfrom;
                    value.loadid = loadidfrom;
                    value.autoid = "" + value.loadid + value.skydiverid;
                });

                $scope.selectedrowManifestMgnt = $scope.selectedrowManifestMgnt - 1;

                $scope.automanifestReOrderLocal(loadto);

                // Save manifest
                getLocalStorage.updateManifestLoads($scope);
            };
        };

        $scope.moveDownLocal = function() {
            var loadfrom = $scope.selectedrowManifestMgntObj[0].loadnumber;
            var loadidfrom = $scope.selectedrowManifestMgntObj[0].loadid;

            var arrayList = $.grep($scope.manifestLoads, function (load) {
                return load.loadnumber > loadfrom;
            });

            var arrayListOrder = orderBy($scope.loadsList(arrayList), 'loadnumber', false);
            if (arrayListOrder.length > 0)
            {
                var loadto = arrayListOrder[0].loadnumber;
                var loadidto = arrayListOrder[0].loadid;

                var loadfromreg = $.grep($scope.manifestLoads, function (load) {
                    return load.loadnumber == loadfrom;
                });

                var loadtoreg = $.grep($scope.manifestLoads, function (load) {
                    return load.loadnumber == loadto;
                });

                angular.forEach(loadfromreg, function(value, key) {
                    value.loadnumber = loadto;
                    value.loadid = loadidto;
                    value.autoid = "" + value.loadid + value.skydiverid;
                });

                angular.forEach(loadtoreg, function(value, key) {
                    value.loadnumber = loadfrom;
                    value.loadid = loadidfrom;
                    value.autoid = "" + value.loadid + value.skydiverid;
                });

                $scope.selectedrowManifestMgnt = $scope.selectedrowManifestMgnt + 1;

                $scope.automanifestReOrderLocal(loadfrom);

                // Save manifest
                getLocalStorage.updateManifestLoads($scope);
            }
        };

        $scope.manifestReorder = function () {
            $scope.question = "Desea reordernar el manifiesto?";
            $scope.questionModal = $uibModal.open({
                templateUrl: 'question.html',
                scope: $scope
            });
            $scope.questionModal.result.then(function () {
                $scope.automanifestReOrderLocal(1);
                getLocalStorage.updateManifestLoads($scope);
            });
        };


        $scope.TItandemweight = function(loadto){


            var manifestTIsEnable = $scope.TItandemweightExtension(loadto);
            var manifestTIsEnabledMain = angular.copy(manifestTIsEnable);

            angular.forEach(manifestTIsEnabledMain, function (TI) {
                TI.pesoavg = 0;
                if ((TI.saltos - TI.start_jumps) != 0) {
                    TI.pesoavg = (TI.peso - 1) / (TI.saltos - TI.start_jumps);
                }
            });

            return manifestTIsEnabledMain;
        };

        $scope.TItandemweightExtension = function (loadto) {
            var manifestTIsEnabled = orderBy($scope.manifestTIs, 'loggedin');

            angular.forEach(manifestTIsEnabled, function(TI) {
                TI.peso = 0; //TI.start_weight;
                TI.saltos = TI.start_jumps;
            });

            var arrayList = $.grep($scope.manifestLoads, function (load) {
                return load.loadnumber < loadto;
            });

            var arrayListOrder = orderBy($scope.loadsList(arrayList), 'loadnumber', false);

            angular.forEach(arrayListOrder, function (load) {
                var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                    return loaddata.loadnumber == load.loadnumber;
                });

                // Get Students
                var loadregStudents = orderBy($.grep(loadreg, function (loaddata) {
                    if (loaddata.autoid != null) {
                        return (loaddata.description.substr(0, 2) == "TL");
                    }
                }), '-weight');

                var weightcount = 1;
                angular.forEach(loadregStudents, function(regStudent) {
                    // Construct TI reg object
                    var TIforStudent = $.grep(loadreg, function (TI) {
                        return TI.instructor == regStudent.skydiverid;
                    });


                    if (TIforStudent.length > 0) {
                        var TIforManifestEnabled = $.grep(manifestTIsEnabled, function (TI) {
                            return TI.id == TIforStudent[0].skydiverid;
                        });

                        var index = manifestTIsEnabled.indexOf(TIforManifestEnabled[0]);
                        manifestTIsEnabled[index].saltos = manifestTIsEnabled[index].saltos + 1;

                        // Lo comente porque si se deberia computar. sino cuando divida x saltos va a dar mejor la cantidad.
                        // Esto solo se daba cuando contaba la cantidad de adelante y atraz y no contaba por ponderasion de peso.
                        // si llevo uno solo no se computa;
                        //if (loadregStudents.length > 1) {
                            manifestTIsEnabled[index].peso = manifestTIsEnabled[index].peso + weightcount;
                        //};
                        weightcount = weightcount - 1;
                    }
                });
            });

            return manifestTIsEnabled;
        };

        $scope.automanifestReOrderLocal = function (loadto) {

            var arrayList = $.grep($scope.manifestLoads, function (load) {
                return load.loadnumber >= loadto;
            });

            var arrayListOrder = orderBy($scope.loadsList(arrayList), 'loadnumber', false);

            angular.forEach(arrayListOrder, function (load) {

                var manifestTIsEnabled = $scope.TItandemweight(load.loadnumber);

                // Get Load information
                var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                    return loaddata.loadnumber == load.loadnumber;
                });

                // Get Students
                var loadregStudents = orderBy($.grep(loadreg, function (loaddata) {
                    if (loaddata.autoid != null) {
                        return (loaddata.description.substr(0, 2) == "TL");
                    }
                }), '-weight');

                if (loadregStudents.length > 0) {

                    // Delete Students from manifest
                    angular.forEach(loadregStudents, function(reg) {
                        var index = $scope.manifestLoads.indexOf(reg);
                        $scope.manifestLoads.splice(index,1);
                    });

                    // Get TIs from load
                    var loadregTI = $.grep(loadreg, function (loaddata) {
                        return (loaddata.description.substr(0, 2) == "TI");
                    });

                    // Delete TIs from loads
                    angular.forEach(loadregTI, function(valueTI){
                        var index = $scope.manifestLoads.indexOf(valueTI);
                        $scope.manifestLoads.splice(index,1);
                    });

                    // Remove instructor already in load. If funjump or AFF or other
                    var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                        return loaddata.loadnumber == load.loadnumber;
                    });

                    var manifestTIsEnabledTmp = angular.copy(manifestTIsEnabled);

                    angular.forEach(manifestTIsEnabledTmp, function (mTI){
                        var IsInLoad = $.grep(loadreg, function(reg)
                        {
                            return ((reg.skydiverid == mTI.id))
                        });

                        if (IsInLoad.length != 0)
                        {
                            var index = manifestTIsEnabledTmp.indexOf(mTI);
                            manifestTIsEnabledTmp.splice(index,1);
                        };
                    });

                    // Get instructor from list
                    var TIorderByAdelanteTemp = orderBy($.grep(manifestTIsEnabledTmp, function (TI) {
                        if (TI.InstJumpStop != 0)
                        {
                            return (TI.loggedin != 0 && load.loadnumber > TI.InstJumpStart && load.loadnumber <= TI.InstJumpStop);
                        }
                        return (TI.loggedin != 0 && load.loadnumber > TI.InstJumpStart);

                    }), '[saltos+Asc,loggedin+Asc]');


                    // Get instructor list for students length
                    var TIorderByAdelanteLoadTemp = [];

                    for (var i=0; i < loadregStudents.length; i++) {
                        TIorderByAdelanteLoadTemp.push(TIorderByAdelanteTemp[i]);
                    }

                    var TIorderByPeso = orderBy(TIorderByAdelanteLoadTemp, '[pesoavg]');

                    var ticounter = 0;

                    // Get instructors reg for each student and save on TIforStudents
                    angular.forEach(loadregStudents, function(regStudent) {
                        $scope.manifestLoads.push(regStudent);

                        // Construct TI reg object
                        var TIforStudent = $.grep(loadregTI, function(TIcopy){
                            return TIcopy.instructor == regStudent.skydiverid;
                        });

                        TIforStudent[0].autoid = '' + TIforStudent[0].loadid + TIorderByPeso[ticounter].id;
                        TIforStudent[0].skydiverid = TIorderByPeso[ticounter].id;
                        TIforStudent[0].skydiver = TIorderByPeso[ticounter].name;

                        $scope.manifestLoads.push(TIforStudent[0]);

                        ticounter = ticounter + 1;
                    });
                };
            });
        };

        $scope.loadsList = function (arrayList) {
            var result = [];
            if(angular.isArray(arrayList)) {
                var val = {loadnumber: 0};
                var arrayLoads = orderBy(arrayList, 'loadnumber', true);
                for(var i=0; i< arrayLoads.length; i++) {
                    if (val.loadnumber != arrayList[i].loadnumber) {
                        var val = {loadnumber: arrayList[i].loadnumber, loadid: arrayList[i].loadid};
                        result.push(val);
                    }
                }
            };

            return result;
        };


        $scope.removeJumperFromLoadLocal = function(jumper){
            var arrayList = $.grep($scope.manifestLoads, function (load) {
                return ((load.skydiverid == jumper.skydiverid || load.skydiverid == jumper.instructor || load.instructor == jumper.skydiverid) && load.loadnumber == jumper.loadnumber) ;
            });

            angular.forEach(arrayList, function(value) {
                var index = $scope.manifestLoads.indexOf(value);
                $scope.loads_skydivers_delete.push($scope.manifestLoads[index]);
                $scope.manifestLoads.splice(index,1);
            });

            $scope.question = "Desea reordernar el manifiesto?";
            $scope.questionModal = $uibModal.open({
                templateUrl: 'question.html',
                scope: $scope
            });
            $scope.questionModal.result.then(function () {
                $scope.automanifestReOrderLocal(jumper.loadnumber);
            });


            // Fix the last load. I thing =D
            var obj = $scope.manifestLoads;
            if (obj.length == 0) {
                obj.push({});
            }


            // Save manifest
            getLocalStorage.updateManifestLoads($scope);
            if ($scope.manifestLoads[0].loadid == undefined)
            {
                $scope.manifestLoads = [];
            }

        };

        $scope.getTandemSlotsTotal = function() {
            $scope.TandemSlotsTotal = 0;
            angular.forEach($scope.manifestLoads, function (loadreg) {
                if  (loadreg.description == "TL1")
                {
                    $scope.TandemSlotsTotal = $scope.TandemSlotsTotal + loadreg.priceslots;
                    console.log(loadreg.priceslots);
                };
            });
        };

        $scope.QuestionNo = function () {
            $scope.questionModal.dismiss('Close');
        };

        $scope.QuestionYes = function () {
            $scope.questionModal.close();
        };

        $scope.AlertOk = function () {
            $scope.alertModal.close();
        }


        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Slot Edit

        $scope.slotEdit = {};

        $scope.slotEditisTIdisabled = function (TI) {
            if (TI.InstJumpStart < $scope.slotEdit.slot.loadnumber && (TI.InstJumpStop == 0 || TI.InstJumpStop >= $scope.slotEdit.slot.loadnumber)) {
                return true;
            }
            return false;
        };

        $scope.slotEditCancel = function () {
            $scope.slotEditModal.dismiss('Close');
        };

        $scope.slotEditSave = function () {

            // get load records
            var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                return loaddata.loadnumber == $scope.slotEdit.slot.loadnumber;
            });

            // Check if is a not avaialable instructor
            $scope.slotEdit.exit = false;
            angular.forEach($scope.slotEdit.slot.jumpTypeReqList, function(req, key) {

                if (req.skydiverid == undefined) {
                    $scope.slotEdit.exit = true;
                    return;
                }
                var TI = $.grep($scope.manifestTIs, function (TItemp) {
                    return TItemp.id == req.skydiverid;
                });

                if (TI[0].notavailable) {
                    // look for instructor
                    var instructor = $.grep(loadreg, function (value) {
                        return (value.skydiverid == req.skydiverid);
                    });

                    if (instructor.length && $scope.slotEdit.slot.jumpTypeReqListOrig.length) {
                        instructor[0].weight = $scope.slotEdit.slot.jumpTypeReqListOrig[key].weight;
                        instructor[0].skydiverid = $scope.slotEdit.slot.jumpTypeReqListOrig[key].skydiverid;
                        instructor[0].skydiver = $scope.slotEdit.slot.jumpTypeReqListOrig[key].skydiver;
                        instructor[0].autoid = '' + $scope.slotEdit.slot.jumpTypeReqListOrig[key].loadid + instructor[0].skydiverid;
                    }
                    else
                    {
                        $scope.alertmsg = "El instructor ya se encuentra en el vuelo actual";
                        $scope.alertModal = $uibModal.open({
                            templateUrl: 'alert.html',
                            scope: $scope
                        });
                        $scope.slotEdit.exit = true
                    }
                };
            });

            if ($scope.slotEdit.exit) {return;}
            // Find and delete instructors

            // look for instructor
            var instructors = $.grep(loadreg, function (value) {
                return (value.instructor == $scope.slotEdit.slot.skydiverid);
            });

            // delete instructors
            angular.forEach(instructors, function(value){
                var index = $scope.manifestLoads.indexOf(value);
                $scope.loads_skydivers_delete.push($scope.manifestLoads[index]);
                $scope.manifestLoads.splice(index,1);
            });

            var loadreg = $.grep($scope.manifestLoads, function(loaddata){
                return (loaddata.autoid == $scope.slotEdit.slot.autoid)
            });

            var index = $scope.manifestLoads.indexOf(loadreg[0]);

            var jumpstype = getLocalStorage.findJumpTypeReq($scope.slotEdit.slot.jumptypeid);

            $scope.slotEdit.slot.priceslots = jumpstype.priceslots;
            $scope.slotEdit.slot.price = jumpstype.price;
            $scope.slotEdit.slot.description = jumpstype.description;
            $scope.slotEdit.slot.jumptype = jumpstype.description;
            $scope.slotEdit.slot.altitude = jumpstype.altitude;

            $scope.manifestLoads[index] = $scope.slotEdit.slot;

            // Add new instructors
            var indexpos = index;
            angular.forEach($scope.slotEdit.slot.jumpTypeReqList, function(req){

                // Check if is a not avaialable instructor
                var instructor = $.grep($scope.manifestTIs, function (value) {
                    return (value.id == req.skydiverid);
                });

                req.loadid = $scope.slotEdit.slot.loadid;
                req.loadnumber = $scope.slotEdit.slot.loadnumber;
                req.skydiverid = instructor[0].id;
                req.skydiver = instructor[0].name;
                req.weight = instructor[0].weight;
                req.autoid = "" + req.loadid + req.skydiverid;
                req.instructor = $scope.slotEdit.slot.skydiverid;
                if (req.jumptypeid == undefined) {
                    req.jumptypeid = req.id;
                };
                req.jumptype = req.description;
                $scope.manifestLoads.splice((indexpos+1),0,req);
                indexpos = indexpos + 1;
            });

            // Reorder manifest
            $scope.question = "Desea reordernar el manifiesto?";
            $scope.questionModal = $uibModal.open({
                templateUrl: 'question.html',
                scope: $scope
            });
            $scope.questionModal.result.then(function () {
                $scope.automanifestReOrderLocal($scope.slotEdit.slot.loadnumber + 1);
            });

            // Save manifest
            getLocalStorage.updateManifestLoads($scope);
            $scope.slotEditModal.close();
        };


        $scope.slotEditInstColor = function (req) {
            var TI = $.grep($scope.manifestTIs, function (TItemp) {
                return TItemp.id == req.skydiverid;
            });
            if (TI[0].notavailable == true) {
                return {"color": "red"}
            }
            return {};
        };

        $scope.slotEditF = function (slot) {
            if (slot.instructor == 0) {
                $scope.slotEdit = {};
                $scope.slotEdit.slot = angular.copy(slot);
                $scope.slotEdit.jumpstypeReq = getLocalStorage.getJumpsTypeReqAll();
                $scope.slotEdit.jumptype = getLocalStorage.findJumpTypeReq($scope.slotEdit.slot.jumptypeid);

                $scope.slotEdit.jumpstype = getLocalStorage.getJumpsType();
                $scope.slotEdit.altitudes = getLocalStorage.getAltitudes();

                var loadreg = $.grep($scope.manifestLoads, function (loaddata) {
                    return loaddata.loadnumber == $scope.slotEdit.slot.loadnumber;
                });

                var instructor = $.grep(loadreg, function (value) {
                    return (value.instructor == slot.skydiverid);
                });

                var instructor = angular.copy(instructor);

                angular.forEach($scope.manifestTIs, function (mTI){
                    var IsInLoad = $.grep(loadreg, function(reg)
                    {
                        return ((reg.skydiverid == mTI.id))
                    });

                    mTI.notavailable = false;
                    if (IsInLoad.length != 0 && IsInLoad[0].instructor != $scope.slotEdit.slot.skydiverid)
                    {
                        mTI.notavailable = true;
                    }
                });

                $scope.slotEdit.slot.jumpTypeReqList = [];
                angular.forEach(instructor,function(inst){
                    $scope.slotEdit.slot.jumpTypeReqList.push(inst);
                    $scope.slotEdit.slot.Instructors = true;
                });

                $scope.slotEdit.slot.jumpTypeReqListOrig = angular.copy($scope.slotEdit.slot.jumpTypeReqList);

                $scope.slotEditModal = $uibModal.open({
                    templateUrl: 'slotedit.html',
                    scope: $scope
                });
            };
        };

        $scope.slotEditJumptypeSelect = function (reg)
        {
            if (reg != undefined) {
                reg.jumptypeid = getLocalStorage.getJumpTypeReqID($scope.slotEdit.jumptype);

                var jumptype = {
                    'jumptype': $scope.slotEdit.jumptype.jumptype,
                    'altitude': $scope.slotEdit.jumptype.altitude,
                    'video': $scope.slotEdit.jumptype.video
                };

                $scope.slotEdit.slot.jumpTypeReqListTemp = $scope.slotEdit.slot.jumpTypeReqList;
                $scope.slotEdit.slot.jumpTypeReqList = getLocalStorage.getJumpTypeReqList(jumptype);
                $scope.slotEdit.slot.jumpTypeReqList.splice(0, 1);

                $scope.slotEdit.slot.Instructors = false;

                if ($scope.slotEdit.slot.jumpTypeReqList.length > 0)
                {
                    $scope.slotEdit.slot.Instructors = true;
                    if ($scope.slotEdit.slot.jumpTypeReqListTemp.length > 0) {
                        if ($scope.slotEdit.slot.jumpTypeReqList[0].description == $scope.slotEdit.slot.jumpTypeReqListTemp[0].description) {
                            $scope.slotEdit.slot.jumpTypeReqList[0].skydiverid = $scope.slotEdit.slot.jumpTypeReqListTemp[0].skydiverid;
                        }
                        ;
                    };
                };

            }
        };

        /*
        $scope.$watch('slotEdit.jumptype.jumptype', function () {
            $scope.slotEditJumptypeSelect($scope.slotEdit.slot);
        });

        $scope.$watch('slotEdit.jumptype.altitude', function () {
            $scope.slotEditJumptypeSelect($scope.slotEdit.slot);
        });
        */

        // Slot edit ends.
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Skydiver History
        $scope.SkydiverHistory = {};

        $scope.SkydiversEditBooking = function () {

            var book = $scope.selectedRowSkydiverObj;

            var bookcopy = angular.copy(book);
            book.dob = new Date(book.dob);
            book.video = '';

            var modalInstance = $uibModal.open({
                templateUrl: 'skydiveredit.html',
                controller: 'manifestEditCtrl',
                scope: $scope,
                resolve: {item: book}
            }).result.then(function (item) {
                    if (angular.isDate(item.dob)) {
                        item.dob.setMinutes(item.dob.getMinutes() + item.dob.getTimezoneOffset());
                        item.dob = ($filter('date')(item.dob, "yyyy/MM/dd"));
                    }
                    if (!angular.equals(bookcopy, item)) {
                        getLocalStorage.saveSkydivers($scope,item);
                    };
                }, function () {
                    delete $scope.action;
                    var index = $scope.Skydivers.indexOf(book);
                    $scope.Skydivers[index] = bookcopy;
                });


        };

        $scope.SkydiverHistoryRefresh = function ()
        {
            var obj = $scope.selectedRowSkydiverObj;
            $scope.promise = $http.post('endpoints/skydiverhistory.php', obj)
                .success(function(result) {
                    $scope.SkydiverHistory = {'data': result, 'Total': 0};
                    $scope.SkydiverHistoryRefreshLocal();
                });
            return $scope.promise;
        };

        $scope.SkydiverHistoryRefreshLocal = function() {
            $scope.SkydiverHistory.Total = 0;
            angular.forEach($scope.SkydiverHistory.data, function (value) {
                if (value.deleted != 1) {
                    $scope.SkydiverHistory.Total += value.amount
                }
            });
        }

        $scope.skydiverHistory = function () {

            var refresh = $scope.SkydiverHistoryRefresh();
            $scope.SkydiverHistory.cash = 0;
            refresh.success(function () {
                $scope.SkydiverHistoryModal = $uibModal.open({
                    templateUrl: 'skydiverhistory.html',
                    scope: $scope
                });
            });
        };

        $scope.SkydiverHistoryClose = function (){
            $scope.SkydiverHistoryModal.dismiss('Close');
        };

        $scope.SkydiverHistoryPAY = function (value) {
            if (value.description == 'PAYMENT')
            {
                return true;
            }
            return false;
        };

        $scope.SkydiverHistoryGetCash = function() {

            if ($scope.SkydiverHistory.cash === 0 && $scope.SkydiverHistory.Total < 0)
            {
                $scope.SkydiverHistory.cash = -$scope.SkydiverHistory.Total;
            }

            if ($scope.SkydiverHistory.cash > 0) {
                var obj = {};
                var date = new Date();

                obj.date = ($filter('date')(date, "yyyy-MM-dd"));
                obj.amount = $scope.SkydiverHistory.cash;
                obj.description = 'PAYMENT';
                obj.loadnumber = '99';

                obj.payment_date = getLocalStorage.ISODateString(date);
                obj.id_booking = $scope.selectedRowSkydiverObj.id;
                obj.type = 'CASH';
                obj.net_received_amount = $scope.SkydiverHistory.cash;
                obj.amount = $scope.SkydiverHistory.cash;
                obj.deleted = 0;

                $scope.SkydiverHistory.data.push(obj);

                getLocalStorage.savePayments(obj);

                $scope.SkydiverHistoryRefreshLocal();

                $scope.SkydiverHistory.cash = 0;
            }
            else
            {
                alert("Numero invalido");
            }
        };

        $scope.SkydiverHistoryRefreshCashInput = function() {
            $scope.SkydiverHistory.cash = -$scope.SkydiverHistory.Total;
        };

        $scope.$watch('SkydiverHistory.cash', function() {
            $scope.SkydiverHistory.mpcash = Math.trunc($scope.SkydiverHistory.cash * 1.1);
        });

        $scope.SkydiverHistorydeletePayment = function (item) {
            $scope.question = "Desea eleminar el registro?";
            $scope.questionModal = $uibModal.open({
                    templateUrl: 'question.html',
                    scope: $scope
                });
            $scope.questionModal.result.then(function () {

                item.deleted = 1;
                item.id_booking = $scope.selectedRowSkydiverObj.id;
                getLocalStorage.savePayments(item);

                var index = $scope.SkydiverHistory.data.indexOf(item);
                $scope.SkydiverHistory.data.splice(index,1);

                $scope.SkydiverHistoryRefreshLocal();

                return false;
            });
        };

        $scope.SkydiverHistoryPayMP = function() {
            if ($scope.SkydiverHistory.mpcash > 0) {
                var obj = {};
                var obj = new Object();
                var price = $scope.SkydiverHistory.mpcash;
                var mpName = $scope.selectedRowSkydiverObj.firstname + ' ' + $scope.selectedRowSkydiverObj.lastname;
                var obj = {
                    "bookid": $scope.selectedRowSkydiverObj.id,
                    "price": price,
                    "mpName": mpName,
                    "mpEmail": $scope.selectedRowSkydiverObj.email,
                    "mpDNI": $scope.selectedRowSkydiverObj.dni
                };

                $scope.promise = $http.post('endpoints/creatempurl.php', obj).success(function (mpurl) {
                    //win.location = mpurl;
                    $(".modal-body").html('<iframe width="100%" height="80%" frameborder="0" scrolling="no" allowtransparency="true" src="'+mpurl+'"></iframe>');
                });
            }
        };

        $scope.$watch('SkydiverHistory.Total', function () {
            if ($scope.selectedRowSkydiverObj != undefined) {
                $scope.selectedRowSkydiverObj.total = $scope.SkydiverHistory.Total;
            }
        });

            // Skydiver History ends.
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
]);

tandemApp.controller('QuickReceptionCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource) {


    }]);


tandemApp.controller('timepaymentEditCtrl', function ($scope, $http, $modalInstance, item, $filter) {

    $scope.bookgroup = item;

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBookGroup = function() {
        if ($scope.parent.dttime != undefined) {
            $scope.bookgroup.bookdate = $scope.parent.dttime;
        }
        $modalInstance.close($scope.bookgroup);
    };

    $scope.saveToLimbo = function() {
        $scope.bookgroup.bookdate = '';
        $scope.bookgroup.selectedTime = 0;
        $modalInstance.close($scope.bookgroup);
    };

    /////////////////////////////////////////
    // Date Picker

    $scope.status = {opened: false};

    $scope.opencalendar = function ($event) {
        $scope.status.opened = true;
    };

    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };

    // Date Picker End/
    ////////////////////////////////////////

    $scope.updateTimeSlots = function(item) {

        var date = $filter('date')($scope.bookgroup.bookdate, "yyyy-MM-dd");
        $scope.TimeSlots = $.grep($scope.TimeSlotsAll, function(slots) {
            return slots.slot_date == date;
        });


        $scope.TimeSlots.push({ label:'S/HORARIO', value: 0});

        var TS = $.grep($scope.TimeSlots, function(TS) {
            return TS.value == item.selectedTime;
        });
        if (TS.length == 0) {
            item.selectedTime = 0;
        }
    };

    $scope.updateTimeSlots(item);

    $scope.$watch('parent.dttime', function () {
        if ($scope.parent.dttime != undefined) {
            $scope.bookgroup.bookdate = $scope.parent.dttime;
            $scope.bookgroup.bookdate.setMinutes($scope.bookgroup.bookdate.getMinutes() + $scope.bookgroup.bookdate.getTimezoneOffset());
            $scope.updateTimeSlots($scope.bookgroup);
        }
    });

});

tandemApp.controller('manifestEditCtrl', function ($scope, $modalInstance, $http, $timeout, $filter, getLocalStorage, $uibModal, item) {

    $scope.book = item;
    $scope.bookcopy = angular.copy(item);
    $scope.book.cash = 0;

    $scope.refreshCashInput = function () {
        $scope.book.cash = $scope.book.pending;
    };

    $scope.jumpstypeReq = getLocalStorage.getJumpsTypeReqAll();
    $scope.jumptype = getLocalStorage.findJumpTypeReq($scope.book.jumptypeid);

    $scope.jumpstype = getLocalStorage.getJumpsType();
    $scope.altitudes = getLocalStorage.getAltitudes();
    $scope.videostype = getLocalStorage.getVideosType();

    $scope.fpending = function () {
        var extraweight = 0;
        if ($scope.book.weight > 90) {
            extraweight = 200;
        }
        ;
        var pending = $scope.jumptype.price - $scope.book.vdeposit + extraweight;
        if (pending < 0) {
            pending = 0
        }
        ;
        return (pending);
    };

    $scope.$watch('book.weight', function () {
        $scope.book.pending = $scope.fpending();
    });

    $scope.$watch('book.vdeposit', function () {
        $scope.book.pending = $scope.fpending();
    });

    $scope.$watch('book.cash', function () {
        $scope.mpcash = Math.trunc($scope.book.cash * 1.1);
    });

    $scope.$watch('jumptype.jumptype', function () {
        $scope.jumptypeSelect($scope.book);

    });

    $scope.$watch('jumptype.altitude', function () {
        $scope.jumptypeSelect($scope.book);
    });

    $scope.$watch('jumptype.video', function () {
        $scope.jumptypeSelect($scope.book);
    });

    $scope.jumptypeSelect = function (reg) {
        reg.jumptypeid = getLocalStorage.getJumpTypeReqID($scope.jumptype);
        if (reg.jumptypeid == "") {
            $scope.jumptype.video = "";
            reg.jumptypeid = getLocalStorage.getJumpTypeReqID($scope.jumptype);
        }


        var jumptype = {
            'jumptype': $scope.jumptype.jumptype,
            'altitude': $scope.jumptype.altitude,
            'video': $scope.jumptype.video
        };
        $scope.book.jumpTypeReqList = getLocalStorage.getJumpTypeReqList(jumptype);
        $scope.book.jumpTypeReqList.splice(0, 1);

        if (reg.jumptypeid) {
            $scope.jumptype = getLocalStorage.findJumpTypeReq($scope.book.jumptypeid);
            $scope.book.pending = $scope.fpending();
        }
    };

    $scope.jumptypeSelect(item);

    var obj = {};
    var obj = new Object();
    var obj = {"id": $scope.book.id};

    $scope.cancel = function () {
        var booktemp = $scope.book;
        $scope.book = $scope.bookcopy;
        $scope.book.vdeposit = booktemp.vdeposit;
        $scope.book.pending = booktemp.pending;
        $modalInstance.dismiss('Close');
    };

    $scope.saveBook = function () {
        $scope.book.altitude = $scope.jumptype.altitude;
        $scope.book.video = $scope.jumptype.video;
        $modalInstance.close($scope.book);
    };

    $scope.getCash = function () {

        if ($scope.book.cash === 0) {
            $scope.book.cash = $scope.book.pending;
        }

        if ($scope.book.cash > 0) {

            obj = {};
            obj.type = 'CASH';
            obj.net_received_amount = $scope.book.cash;
            obj.amount = $scope.book.cash;
            obj.payment_date = getLocalStorage.ISODateString(new Date());
            obj.id_booking = $scope.book.id;
            obj.deleted = 0;
            $scope.book.payments.push(obj);

            getLocalStorage.savePayments(obj);

            $scope.refreshCashLocal();

            $scope.book.cash = 0;
        }
        else {
            alert("Numero invalido");
        }
    };

    $scope.payMP = function () {
        if ($scope.mpcash > 0) {
            var price = $scope.mpcash;
            var obj = {};
            var obj = new Object();
            var mpName = $scope.book.firstname + ' ' + $scope.book.lastname;
            var obj = {
                "bookid": $scope.book.id,
                "price": price,
                "mpName": mpName,
                "mpEmail": $scope.book.email,
                "mpDNI": $scope.book.dni
            };

            $scope.promise = $http.post('endpoints/creatempurl.php', obj).success(function (mpurl) {
                //win.location = mpurl;
                $(".modal-body").html('<iframe width="100%" height="80%" frameborder="0" scrolling="no" allowtransparency="true" src="' + mpurl + '"></iframe>');

            });
        }
        else {
            alert("Debe asignar un numero mayor a 0");
        }
    };

    $scope.deletePayment = function (item) {
        if (confirm('Desea eliminar el registro?')) {
            item.deleted = 1;
            getLocalStorage.savePayments(item);
            $scope.refreshCashLocal();
        }
    };

    $scope.refreshCashLocal = function () {

        $scope.book.vdeposit = 0;
        var total = 0;
        angular.forEach($scope.book.payments, function (value) {
            if (value.deleted != 1) {
                total = total + value.amount;
            }
        });
        $scope.book.vdeposit = total;
    };

    $scope.refreshCashLocal();

    $scope.refreshCash = function () {
        getLocalStorage.refreshCash($scope);
    };

    $scope.OtherPayment = function () {
        $uibModal.open({
            templateUrl: 'newpayment.html',
            controller: 'newPayCtrl'
        }).result.then(function (pay) {

                obj.payment_date = getLocalStorage.ISODateString(new Date());
                pay.id_booking = $scope.book.id;
                pay.amount = pay.net_received_amount;
                pay.creator = $scope.creator;
                pay.deleted = 0;

                $scope.book.payments.push(obj);

                getLocalStorage.savePayments(obj);

                $scope.refreshCashLocal();
            })
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


tandemApp.controller('newPayCtrl', function ($scope, $modalInstance) {

    $scope.cancel = function () {
        $modalInstance.dismiss('close');
    };

    $scope.saveNewPayment = function () {
        if (!($scope.pay.type == "MP" || $scope.pay.type == "CASH"))
        {
            $modalInstance.close($scope.pay)
        }
        else
        {
            alert('Descripcion incorrecta');
        }

    };
});