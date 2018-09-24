let admin = require('../config/firebase_config.js');
let cron = require('node-cron');
let dbConnection = require('../config/db_config');

module.exports = {

    tasks: {},

    create_guard_session: function (req, res) {
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
        let paymentType = req.params.paymentType;


        let guardSessionData = {
            guard: guardId,
            owner: ownerId,
            duration: duration,
            start_time: startTime,
            end_time: endTime,
            totalCost: totalCost,
            status: status
        };

        console.log("PaymentType " + paymentType);
        if (paymentType === "cash") {
            this.submitCashPayment(guardSessionData, requestKey);
        }

        let ref = admin.database().ref();
        let guardSession = ref.child('GuardSessions');

        let newGuardSessionKey = guardSession.push().key;
        console.log("New session key: ", newGuardSessionKey);

        let updates = {};
        updates['/GuardSessions/' + newGuardSessionKey] = guardSessionData;
        ref.update(updates, function (a) {
            let fcmTokens = ref.child('FcmTokens');
            fcmTokens.once('value').then(function (snapshot) {
                let guardToken = snapshot.val()[guardId].token;
                let ownerToken = snapshot.val()[ownerId].token;

                this.startGuardCounter(guardToken, duration); //Starts guard counter
                this.startOwnerCounter(ownerToken, duration, guardId, totalCost); //Starts owner counter

                let guards = ref.child('GuardsInformation');
                guards.child(guardId).once('value')
                    .then(function (snap) {
                        let timeInMinutes = parseInt(duration);
                        let hours = timeInMinutes / 60;
                        let minutes = timeInMinutes % 60;

                        this.logNotification(snap.val().avatar, snap.val().name +
                            " Started a guard session of " + Math.round(hours) + " hrs and " + minutes + " mins");
                    });


                console.log("guard:: " + guardToken + " owner:: " + ownerToken);
            }).catch(function (error) {
                console.log("fcm tokens data error", error);
            });
        });

        this.activateGuard(guardId);

        let taskId = newGuardSessionKey;
        let task;
        let cronString = minute + ' ' + hour + ' ' + day + ' ' + month + ' *';
        console.log('Cron: ', cronString);
        task = cron.schedule(cronString, function () {
            ///todo Create the guarding object from here
            console.log('running a task for ' + taskId + ' :' + cronString);
            this.destroyTask(taskId) //Destroys task
        }, false);
        task.start();

        this.tasks[taskId] = task;
        this.logTaskToDB(taskId, guardId, "New task created", 0);
        console.log("Tasks: ", this.tasks);
        res.send("Task " + taskId + " started :" + cronString);
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


        admin.messaging().send(message).then(function (response) {
            console.log('Successfully sent message:', response);
        }).catch(function (error) {
            console.log('Error sending message:', error);
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


        admin.messaging().send(message).then(function (response) {
            console.log('Successfully sent message:', response);
        }).catch(function (error) {
            console.log('Error sending message:', error);
        });
    },

    logNotification: function (image, message) {
        let notificationData = {
            image: image,
            message: message,
            status: "0",
            createdAt: new Date().toLocaleString()
        };

        let ref = admin.database().ref();
        let notifications = ref.child('Notifications');

        let newNotificationKey = notifications.push().key;
        console.log("New notification key: ", newNotificationKey);

        let updates = {};
        updates['/Notifications/' + newNotificationKey] = notificationData;
        updates['/NewNotifications/' + newNotificationKey] = notificationData;

        ref.update(updates);

    },

    activateGuard: function (guardId) {
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
                    console.log("Active: ", snap);
                });
            });
    },

    logTaskToDB: function (taskId, agentId, message, status) {
        let ink = this.inkRandom();
        dbConnection.query("INSERT INTO task_logs(fire_ID,created_by,message,ink) " +
            "VALUES('" + taskId + "','" + agentId + "','" + message + "','" + ink + "')",
            function (err, rows, fields) {
                if (err) throw err;
                console.log('Created task', rows);

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

                        io.emit('task_created', data);
                    });

            });

    },

    inkRandom: function () {
        let inkArray = ['sl-primary', 'sl-danger', 'sl-success', 'sl-warning', ''];
        return inkArray[Math.floor(Math.random() * inkArray.length)];
    },

    destroyTask: function (taskId) {
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

                    console.log("Delete key: " + key + " Status " + status);

                    let sessionStatusUpdate = {};
                    sessionStatusUpdate.status = "1";

                    guardSession.child(taskId).update(sessionStatusUpdate);

                    console.log("Task " + taskId + " Destroyed");
                    //Notify guard and owner
                    let fcmTokens = ref.child('FcmTokens');
                    fcmTokens.once('value').then(function (snapshot) {
                        let guardToken = snapshot.val()[guardId].token;
                        let ownerToken = snapshot.val()[ownerId].token;

                        this.endGuardCounter(guardToken);//Ends guard counter
                        this.endOwnerCounter(ownerToken);//Ends owner counter
                        this.inactivateGuard(guardId);

                        let guards = ref.child('GuardsInformation');
                        guards.child(guardId).once('value')
                            .then(function (snap) {
                                this.logNotification("/vehc_images/shield.png", snap.val().name + " Ended a guard session");
                            });


                        console.log("guard:: " + guardToken + " owner:: " + ownerToken);
                    }).catch(function (error) {
                        console.log("fcm tokens data error", error);
                    });

                    console.log("Tasks: ", this.tasks);

                });

        } else {
            console.log("No such task created");
            console.log("Tasks: ", this.tasks);
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


        admin.messaging().send(message).then(function (response) {
            console.log('Successfully sent message:', response);
        }).catch(function (error) {
            console.log('Error sending message:', error);
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


        admin.messaging().send(message).then(function (response) {
            console.log('Successfully sent message:', response);
        }).catch(function (error) {
            console.log('Error sending message:', error);
        });
    },

    inactivateGuard: function (guardId) {
        let ref = admin.database().ref();
        let activeGuard = ref.child('ActiveGuards');
        activeGuard.child(guardId)
            .remove().then(function (snap) {
            console.log("Guard inactivated: ", snap);
        });
    }


};