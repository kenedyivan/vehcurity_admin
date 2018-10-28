let admin = require('../config/firebase_config.js');
let cron = require('node-cron');
let dbConnection = require('../config/db_config');
let io = require('../socketing/host_socket');
let payGuardFromCash = require('../business_logic/pay_guard_from_cash');
let payGuardFromCredit = require('../business_logic/pay_guard_from_credit');
const path = require('path');
let log = require('../logger/logger');


const moduleName = path.basename(__filename, '.js');

module.exports = {
    tasks: {},


    create_guard_session: function (req, res) {

        log(moduleName, 'info', `New Guard request data: ${req.params}`);

        let $this = this;
        let guardId = req.params.guardId;
        let ownerId = req.params.ownerId;
        let duration = req.params.duration;
        let startTime = req.params.startTime;
        let endTime = req.params.endTime;
        let totalCost = req.params.totalCost;
        let status = req.params.status;
        let minute = req.params.minute;
        let hour = req.params.hour;
        let day = req.params.day;
        let month = req.params.month;
        let requestKey = req.params.requestKey;
        let requestCommitKey = req.params.requestCommitKey;

        let guardSessionData = {
            guard: guardId,
            owner: ownerId,
            duration: duration,
            start_time: startTime,
            end_time: endTime,
            totalCost: totalCost,
            status: status
        };

        let time = {
            minute: minute,
            hour: hour,
            day: day,
            month: month,
        };

        /*console.log("PaymentType " + paymentType);
        if (paymentType === 'cash') {
            //$this.submitCashPayment(guardSessionData, requestKey);
            guardSessionData.paymentMethod = 'cash';
        } else if (paymentType === 'credit') {
            guardSessionData.paymentMethod = 'credit';
        }*/

        if (requestCommitKey === null || requestCommitKey === '') {

            log(moduleName, 'debug', 'No request commit key submitted');

            res.send("No request commit key submitted");

        } else {

            log(moduleName, 'info', `Got commit key:  ${requestCommitKey}`);

            guardSessionData.requestCommitKey = requestCommitKey;
            res.send(this.createGuardSession(guardSessionData, time));
        }


    },
    createGuardSession: function (guardSessionData, time) {
        log(moduleName, 'info', `Got new guard session data: ${JSON.stringify(guardSessionData)}`);

        let $this = this;
        let ref = admin.database().ref();
        let guardSession = ref.child('GuardSessions');

        let newGuardSessionKey = guardSession.push().key;
        log(moduleName, 'info', `Created new session key ${newGuardSessionKey}`);

        let updates = {};
        updates['/GuardSessions/' + newGuardSessionKey] = guardSessionData;
        ref.update(updates, function (a) {
            let fcmTokens = ref.child('FcmTokens');
            fcmTokens.once('value').then(function (snapshot) {
                let guardToken = snapshot.val()[guardSessionData.guard].token;
                let ownerToken = snapshot.val()[guardSessionData.owner].token;

                log(moduleName, 'debug', `Retrieved guard device token: ${guardToken} and owner device token: ${ownerToken}`);

                $this.startGuardCounter(guardToken, guardSessionData.duration); //Starts guard counter
                $this.startOwnerCounter(ownerToken, guardSessionData.duration,
                    guardSessionData.guard, guardSessionData.totalCost); //Starts owner counter

                let guards = ref.child('GuardsInformation');
                guards.child(guardSessionData.guard).once('value')
                    .then(function (snap) {
                        let timeInMinutes = parseInt(guardSessionData.duration);
                        let hours = timeInMinutes / 60;
                        let minutes = timeInMinutes % 60;

                        log(moduleName, 'info', `${snap.val().avatar} ${snap.val().name} Starting a guard session of ${Math.round(hours)} hrs and ${minutes} mins`);

                        $this.logNotification(snap.val().avatar, snap.val().name +
                            " Started a guard session of " + Math.round(hours) + " hrs and " + minutes + " mins");

                        log(moduleName, 'info', `${snap.val().avatar} ${snap.val().name} Started a guard session of ${Math.round(hours)} hrs and ${minutes} mins`);
                    });


                log(moduleName, 'info', `Guard device token ${guardToken}, Owner device token ${ownerToken}`);
            }).catch(function (error) {
                log(moduleName, 'error', `Fcm tokens data error: ${JSON.stringify(error)}`);
            });
        });

        this.activateGuard(guardSessionData.guard);

        let taskId = newGuardSessionKey;
        let task;
        let cronString = time.minute + ' ' + time.hour + ' ' +
            time.day + ' ' + time.month + ' *';

        log(moduleName, 'debug', `Cron string: ${cronString}`);

        task = cron.schedule(cronString, function () {
            ///todo Create the guarding object from here
            log(moduleName, 'warning', `Running a task for ${taskId}: Cron string ${cronString}`);
            $this.destroyTask(taskId) //Destroys task
        }, false);
        task.start();

        $this.tasks[taskId] = task;
        $this.logTaskToDB(taskId, guardSessionData.guard, "New task created", 0);
        //log(moduleName, 'warning', `Tasks ${JSON.stringify($this.tasks)}`);
        return "Task " + taskId + " started :" + cronString;
    },

    stopGuardSession: function (req, res) {
        let $this = this;
        let taskId = '';

        let requestCommitKey = req.params.requestCommitKey;

        let ref = admin.database().ref().child('GuardSessions')
            .orderByChild('requestCommitKey')
            .equalTo(requestCommitKey)
            //.limitToFirst(1)
            .once('value')
            .then(function (snap) {
                console.log('GuardSession', snap.val());
                console.log('Key', Object.keys(snap.val())[0]);

                taskId = Object.keys(snap.val())[0];

                log(moduleName, 'info', `Destorying task ${taskId}`);


                if ($this.tasks[taskId]) {
                    $this.tasks[taskId].destroy();
                    delete $this.tasks[taskId];

                    //getUserFcmTokens
                    let ref = admin.database().ref();
                    let guardSession = ref.child('GuardSessions');

                    guardSession.child(taskId).once('value')
                        .then(function (snap) {
                            let key = snap.key;
                            let session = snap.val();
                            let guardId = session.guard;
                            let ownerId = session.owner;
                            let status = session.status;

                            console.log('Session', session);

                            log(moduleName, 'info', `Delete key ${key}, Status ${status}`);

                            //Updates the session status to complete
                            let sessionStatusUpdate = {};
                            sessionStatusUpdate.status = "1";
                            guardSession.child(taskId).update(sessionStatusUpdate);

                            //update guard spent credit
                            $this.updateGuardSpentCredit(session);

                            log(moduleName, 'info', `Destroyed task ${taskId}`);

                            //Notify guard
                            let fcmTokens = ref.child('FcmTokens');
                            fcmTokens.once('value').then(function (snapshot) {
                                let guardToken = snapshot.val()[guardId].token;
                                let ownerToken = snapshot.val()[ownerId].token;

                                $this.endGuardCounter(guardToken);//Ends guard counter
                                $this.endOwnerCounter(ownerToken);//Ends owner counter
                                $this.inactivateGuard(guardId);

                                let guards = ref.child('GuardsInformation');
                                guards.child(guardId).once('value')
                                    .then(function (snap) {
                                        $this.logNotification("/vehc_images/shield.png", snap.val().name + " Ended a guard session");

                                        log(moduleName, 'info', `Notification: Guard session for ${snap.val().name}`);
                                    });

                                log(moduleName, 'info', `Guard device token: ${guardToken}, Owner device token ${ownerToken}`);
                            }).catch(function (error) {
                                log(moduleName, 'error', `Fcm tokens data error: ${error}`);
                            });

                            log(moduleName, 'warning', `Tasks ${$this.tasks}`);


                        });

                } else {
                    log(moduleName, 'error', `No such task created ${taskId}`);
                    console.log('task does not exist');
                }

            });

        res.send({ message: 'Task doesn\'t exist' });
    },

    submitCashPayment: function (guardSessionData, requestKey) {
        console.log("Guard session ", guardSessionData);
        let dateTime = new Date().getTime();
        let paymentData = {
            guard: guardSessionData.guard,
            owner: guardSessionData.owner,
            duration: guardSessionData.duration,
            startTime: guardSessionData.start_time,
            endTime: guardSessionData.end_time,
            totalCost: guardSessionData.totalCost,
            requestKey: requestKey,
            paymentMethod: "cash",
            createdAt: dateTime
        };

        console.log("payment ", paymentData);


        let ref = admin.database().ref();
        let payments = ref.child('Payments');

        let paymentKey = payments.push().key;
        console.log("New payments key: ", paymentKey);

        let updates = {};
        updates['/Payments/' + paymentKey] = paymentData;
        ref.update(updates, function (a) {
            let fcmTokens = ref.child('FcmTokens');
            fcmTokens.once('value').then(function (snapshot) {
                ///todo log info here
            }).catch(function (error) {
                ///todo log an error here
            });
        });

    },

    startGuardCounter: function (guardToken, duration) {

        let message = {
            notification: {
                title: "starting",
                body: "{\"duration\":" + "\"" + duration + "\",\"message\":\"guard session started\"}"
            },
            token: guardToken
        };

        log(moduleName, 'info', `Starting guard counter ${JSON.stringify(message)}`);


        admin.messaging().send(message).then(function (response) {
            log(moduleName, 'info', `Sent start guard counter message ${JSON.stringify(response)}`);
        }).catch(function (error) {
            log(moduleName, 'error', `Error sending start guard counter message: ${error}`);
        });
    },

    startOwnerCounter: function (ownerToken, duration, guardId, totalCost) {
        let message = {
            notification: {
                title: "starting",
                body: "{\"duration\":" + "\"" + duration + "\",\"guardId\":\"" + guardId + "\",\"totalCost\":\"" + totalCost + "\"," +
                    "\"message\":\"guard session started\"}"
            },
            token: ownerToken
        };

        log(moduleName, 'info', `Starting owner counter ${JSON.stringify(message)}`);


        admin.messaging().send(message).then(function (response) {
            log(moduleName, 'info', `Sent start owner counter message ${response}`);
        }).catch(function (error) {
            log(moduleName, 'error', `Error sending start owner counter message: ${error}`);
        });
    },

    logNotification: function (image, message) {
        let notificationData = {
            image: image,
            message: message,
            status: "0",
            createdAt: new Date().toLocaleString()
        };

        log(moduleName, 'info', `Creating session notification ${JSON.stringify(notificationData)}`);

        let ref = admin.database().ref();
        let notifications = ref.child('Notifications');

        let newNotificationKey = notifications.push().key;
        log(moduleName, 'debug', `New notification key: ${newNotificationKey}`);

        let updates = {};
        updates['/Notifications/' + newNotificationKey] = notificationData;
        updates['/NewNotifications/' + newNotificationKey] = notificationData;

        ref.update(updates);

    },

    activateGuard: function (guardId) {
        log(moduleName, 'info', `Activate guard ${guardId}`);
        let ref = admin.database().ref();

        let guards = ref.child('GuardsInformation');
        guards.child(guardId).once('value')
            .then(function (snap) {

                let activeGuardData = {
                    avatar: snap.val().avatar,
                    name: snap.val().name,
                    createdAt: new Date()
                };

                let aGuards = {};
                aGuards['/ActiveGuards/' + guardId] = activeGuardData;
                ref.update(aGuards).then(function (snap) {
                    log(moduleName, 'debug', `Activated guard ${guardId}`);
                });
            });
    },

    logTaskToDB: function (taskId, agentId, message, status) {
        let ink = this.inkRandom();
        let queryString = "INSERT INTO task_logs(fire_ID,created_by,message,ink) " +
            "VALUES('" + taskId + "','" + agentId + "','" + message + "','" + ink + "')";

        log(moduleName, 'info', `Creating task in database ${queryString}`);

        dbConnection.query(queryString,
            function (err, rows, fields) {
                if (err) throw err;
                log(moduleName, 'info', `Created task record in database ${JSON.stringify(rows)}`);

                dbConnection.query("SELECT * FROM task_logs WHERE id ='" + rows.insertId + "' ",
                    function (err, rows, fields) {
                        if (err) throw err;
                        let d = rows[0];
                        let data = {};
                        data.id = d.id;
                        data.fireId = d.fire_ID;
                        data.createdAt = d.created_at;
                        data.createdBy = d.created_by;
                        data.message = d.message;
                        data.status = d.status;
                        data.ink = d.ink;


                        log(moduleName, 'debug', `Fetching task from database ${JSON.stringify(d)}`);

                        //io.emit('task_created', data);
                    });

            });

    },

    inkRandom: function () {
        let inkArray = ['sl-primary', 'sl-danger', 'sl-success', 'sl-warning', ''];
        return inkArray[Math.floor(Math.random() * inkArray.length)];
    },

    //Credits guard account after guard session
    updateGuardSpentCredit: function (session) {

        log(moduleName, 'info', `Updating credit record ${JSON.stringify(session)}`);

        let ref = admin.database().ref();
        let requestCommits = ref.child('RequestCommits');
        requestCommits.child(session.requestCommitKey).once('value')
            .then(function (snap) {
                let key = snap.key;
                let commit = snap.val();
                let paymentMethod = commit.paymentMethod;

                if (paymentMethod === 'cash') {
                    payGuardFromCash.processUpdateGuardCredit(session);
                } else if (paymentMethod === 'credit') {
                    payGuardFromCredit.processUpdateGuardCredit(session);
                }
            });

    },

    destroyTask: function (taskId) {

        log(moduleName, 'info', `Destorying task ${taskId}`);
        let $this = this;
        if (this.tasks[taskId]) {
            this.tasks[taskId].destroy();
            delete this.tasks[taskId];

            //getUserFcmTokens
            let ref = admin.database().ref();
            let guardSession = ref.child('GuardSessions');

            guardSession.child(taskId).once('value')
                .then(function (snap) {
                    let key = snap.key;
                    let session = snap.val();
                    let guardId = session.guard;
                    let ownerId = session.owner;
                    let status = session.status;

                    log(moduleName, 'info', `Delete key ${key}, Status ${status}`);

                    //Updates the session status to complete
                    let sessionStatusUpdate = {};
                    sessionStatusUpdate.status = "1";
                    guardSession.child(taskId).update(sessionStatusUpdate);

                    //update guard spent credit
                    $this.updateGuardSpentCredit(session);

                    log(moduleName, 'info', `Destroyed task ${taskId}`);

                    //Notify guard and owner
                    let fcmTokens = ref.child('FcmTokens');
                    fcmTokens.once('value').then(function (snapshot) {
                        let guardToken = snapshot.val()[guardId].token;
                        let ownerToken = snapshot.val()[ownerId].token;

                        $this.endGuardCounter(guardToken);//Ends guard counter
                        $this.endOwnerCounter(ownerToken);//Ends owner counter
                        $this.inactivateGuard(guardId);

                        let guards = ref.child('GuardsInformation');
                        guards.child(guardId).once('value')
                            .then(function (snap) {
                                $this.logNotification("/vehc_images/shield.png", snap.val().name + " Ended a guard session");

                                log(moduleName, 'info', `Notification: Guard session for ${snap.val().name}`);
                            });

                        log(moduleName, 'info', `Guard device token: ${guardToken}, Owner device token ${ownerToken}`);
                    }).catch(function (error) {
                        log(moduleName, 'error', `Fcm tokens data error: ${error}`);
                    });

                    log(moduleName, 'warning', `Tasks ${$this.tasks}`);

                });

        } else {
            log(moduleName, 'error', `No such task created ${taskId}`);
        }

    },

    endGuardCounter: function (guardToken) {
        let message = {
            notification: {
                title: "ending",
                body: "{\"message\":\"guard session ended\"}"
            },
            token: guardToken
        };

        log(moduleName, 'info', `Sending end guard counter message: ${message}`);


        admin.messaging().send(message).then(function (response) {
            log(moduleName, 'info', `Successfully send message ${response}`);
        }).catch(function (error) {
            log(moduleName, 'error', `Error sending message: ${error}`);
        });
    },

    endOwnerCounter: function (ownerToken) {
        let message = {
            notification: {
                title: "ending",
                body: "{\"message\":\"guard session ended\"}"
            },
            token: ownerToken
        };

        log(moduleName, 'info', `Sending end owner counter message: ${message}`);


        admin.messaging().send(message).then(function (response) {
            log(moduleName, 'info', `Successfully sent message ${response}`);
        }).catch(function (error) {
            log(moduleName, 'error', `Error sending message: ${error}`);
        });
    },

    inactivateGuard: function (guardId) {
        log(moduleName, 'info', 'Making Guard available again');
        let ref = admin.database().ref();
        let activeGuard = ref.child('ActiveGuards');
        activeGuard.child(guardId)
            .remove().then(function (snap) {
                log(moduleName, 'info', 'Guard is available again');
            });
    }


};