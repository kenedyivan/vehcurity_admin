var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var admin = require('./config/firebase_config.js');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cron = require('node-cron');
var passport = require('passport');
var flash = require('connect-flash');
const cookieSession = require('cookie-session');
var connection = require('./config/db_config');
//connection.connect();

//Socket io
io.on('connection', function (socket) {
    console.log('a user connected');

    var ref = admin.database().ref('Guards');
    ref.on('child_added', function (snap) {
        ref.on('value', function (guardsSnap) {
            var data = {};
            data.numOnline = guardsSnap.numChildren();
            data.guard = snap.key;

            io.emit('added', data);
        });


    });

    ref.on('child_removed', function (snap) {
        ref.on('value', function (guardsSnap) {
            var data = {};
            data.numOnline = guardsSnap.numChildren();
            data.guard = snap.key;

            io.emit('removed', data);
        });

    });
});

//Makes socket io object global to the whole app scope
app.locals.io = io;
//---End socket io

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: ['akenakenedynerd']
}));

app.use(flash());
require('./config/passport_config')(passport);
app.use(passport.initialize());
app.use(passport.session());


app.get('/fcm/:token', function (req, res) {
    // This registration token comes from the client FCM SDKs.
    var registrationToken = req.params.token;

    // See documentation on defining a message payload.
    var message = {
        notification: {
            title: "finish",
            body: "guard session complete"
        },
        token: registrationToken
    };


    admin.messaging().send(message).then(function (response) {
        console.log('Successfully sent message:', response);
        res.send("Message sent");
    }).catch(function (error) {
        console.log('Error sending message:', error);
        res.send("Sending failed");
    });

});

//Tasks object
var tasks = {};

//Begin cron tasks
function startGuardCounter(guardToken, duration) {
    var message = {
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
}

function startOwnerCounter(ownerToken, duration, guardId, totalCost) {
    var message = {
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
}

function logNotification(image, message) {
    var notificationData = {
        image: image,
        message: message,
        status: "0",
        createdAt: new Date().toLocaleString()
    };

    var ref = admin.database().ref();
    var notifications = ref.child('Notifications');

    var newNotificationKey = notifications.push().key;
    console.log("New notification key: ", newNotificationKey);

    var updates = {};
    updates['/Notifications/' + newNotificationKey] = notificationData;
    updates['/NewNotifications/' + newNotificationKey] = notificationData;

    ref.update(updates);

}

function activateGuard(guardId) {
    var ref = admin.database().ref();

    var guards = ref.child('GuardsInformation');
    guards.child(guardId).once('value')
        .then(function (snap) {

            var activeGuardData = {
                avatar: snap.val().avatar,
                name: snap.val().name,
                createdAt: new Date()
            };

            var aGuards = {};
            aGuards['/ActiveGuards/' + guardId] = activeGuardData;
            ref.update(aGuards).then(function (snap) {
                console.log("Active: ", snap);
            });
        });
}

function inkRandom() {
    var inkArray = ['sl-primary', 'sl-danger', 'sl-success', 'sl-warning', ''];
    return inkArray[Math.floor(Math.random() * inkArray.length)];
}

function logTaskToDB(taskId, agentId, message, status) {
    var ink = inkRandom();
    connection.query("INSERT INTO task_logs(fire_ID,created_by,message,ink) " +
        "VALUES('" + taskId + "','" + agentId + "','" + message + "','" + ink + "')",
        function (err, rows, fields) {
            if (err) throw err;
            console.log('Created task', rows);

            connection.query("SELECT * FROM task_logs WHERE id ='" + rows.insertId + "' ",
                function (err, rows, fields) {
                    if (err) throw err;
                    var d = rows[0];
                    var data = {};
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

}

app.get('/create-guarding-session/:guardId/:ownerId/:duration/:startTime/:endTime/:totalCost/:' +
    'status/:minute/:hour/:day/:month/:requestKey/:paymentType', function (req, res) {
    var guardId = req.params.guardId;
    var ownerId = req.params.ownerId;
    var duration = req.params.duration;
    var startTime = req.params.startTime;
    var endTime = req.params.endTime;
    var totalCost = req.params.totalCost;
    var status = req.params.status;
    var minute = req.params.minute;
    var hour = req.params.hour;
    var day = req.params.day;
    var month = req.params.month;
    var requestKey = req.params.requestKey;
    var paymentType = req.params.paymentType;


    var guardSessionData = {
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
        submitCashPayment(guardSessionData, requestKey);
    }

    var ref = admin.database().ref();
    var guardSession = ref.child('GuardSessions');

    var newGuardSessionKey = guardSession.push().key;
    console.log("New session key: ", newGuardSessionKey);

    var updates = {};
    updates['/GuardSessions/' + newGuardSessionKey] = guardSessionData;
    ref.update(updates, function (a) {
        var fcmTokens = ref.child('FcmTokens');
        fcmTokens.once('value').then(function (snapshot) {
            var guardToken = snapshot.val()[guardId].token;
            var ownerToken = snapshot.val()[ownerId].token;

            startGuardCounter(guardToken, duration); //Starts guard counter
            startOwnerCounter(ownerToken, duration, guardId, totalCost); //Starts owner counter

            var guards = ref.child('GuardsInformation');
            guards.child(guardId).once('value')
                .then(function (snap) {
                    var timeInMinutes = parseInt(duration);
                    var hours = timeInMinutes / 60;
                    var minutes = timeInMinutes % 60;

                    logNotification(snap.val().avatar, snap.val().name +
                        " Started a guard session of " + Math.round(hours) + " hrs and " + minutes + " mins");
                });


            console.log("guard:: " + guardToken + " owner:: " + ownerToken);
        }).catch(function (error) {
            console.log("fcm tokens data error", error);
        });
    });

    activateGuard(guardId);

    var taskId = newGuardSessionKey;
    var task;
    var cronString = minute + ' ' + hour + ' ' + day + ' ' + month + ' *';
    console.log('Cron: ', cronString);
    task = cron.schedule(cronString, function () {
        ///todo Create the guarding object from here
        console.log('running a task for ' + taskId + ' :' + cronString);
        destroyTask(taskId) //Destroys task
    }, false);
    task.start();

    tasks[taskId] = task;
    logTaskToDB(taskId, guardId, "New task created", 0);
    console.log("Tasks: ", tasks);
    res.send("Task " + taskId + " started :" + cronString);
});

function submitCashPayment(guardSessionData, requestKey) {
    console.log("Guard session ", guardSessionData);
    var dateTime = new Date().getTime();
    var paymentData = {
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


    var ref = admin.database().ref();
    var payments = ref.child('Payments');

    var paymentKey = payments.push().key;
    console.log("New payments key: ", paymentKey);

    var updates = {};
    updates['/Payments/' + paymentKey] = paymentData;
    ref.update(updates, function (a) {
        var fcmTokens = ref.child('FcmTokens');
        fcmTokens.once('value').then(function (snapshot) {
            ///todo log info here
        }).catch(function (error) {
            ///todo log an error here
        });
    });

}

app.get('/end-session/:id', function (req, res) {
    destroyTask(req.params.id) //Destroys task
});

app.get('/send-message/', function (req, res) {
    endGuardCounter("fGpsCYU2R8I:APA91bF6yseSknhbERBzth0XoMa0d28DBeWRaqzyexGZZIQQPBUej33jOAQTCHgpjTZLpuoMbZ0auI2151qkcu6Zj8SE51owoRLeE9N0M5rVPygaWcXBnTwyoKBD31c_K1L3geqaNIVZo4ru1mxLSEw8zjg8HV4kTw");
});

function endGuardCounter(guardToken) {
    var message = {
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
}

function endOwnerCounter(ownerToken) {
    var message = {
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
}

function inactivateGuard(guardId) {
    var ref = admin.database().ref();
    var activeGuard = ref.child('ActiveGuards');
    activeGuard.child(guardId)
        .remove().then(function (snap) {
        console.log("Guard inactivated: ", snap);
    });
}

function destroyTask(taskId) {
    if (tasks[taskId]) {
        tasks[taskId].destroy();
        delete tasks[taskId];

        //getUserFcmTokens
        var ref = admin.database().ref();
        var guardSession = ref.child('GuardSessions');

        guardSession.child(taskId).once('value')
            .then(function (snap) {
                var key = snap.key;
                var session = snap.val();
                var guardId = session.guard;
                var ownerId = session.owner;
                var status = session.status;

                console.log("Delete key: " + key + " Status " + status);

                var sessionStatusUpdate = {};
                sessionStatusUpdate.status = "1";

                guardSession.child(taskId).update(sessionStatusUpdate);

                console.log("Task " + taskId + " Destroyed");
                //Notify guard and owner
                var fcmTokens = ref.child('FcmTokens');
                fcmTokens.once('value').then(function (snapshot) {
                    var guardToken = snapshot.val()[guardId].token;
                    var ownerToken = snapshot.val()[ownerId].token;

                    endGuardCounter(guardToken);//Ends guard counter
                    endOwnerCounter(ownerToken);//Ends owner counter
                    inactivateGuard(guardId);

                    var guards = ref.child('GuardsInformation');
                    guards.child(guardId).once('value')
                        .then(function (snap) {
                            logNotification("/vehc_images/shield.png", snap.val().name + " Ended a guard session");
                        });


                    console.log("guard:: " + guardToken + " owner:: " + ownerToken);
                }).catch(function (error) {
                    console.log("fcm tokens data error", error);
                });

                console.log("Tasks: ", tasks);

            });

    } else {
        console.log("No such task created");
        console.log("Tasks: ", tasks);
    }

}

//--End cron task


/*
var firebase = require('firebase');

//FirebaseAdmin
firebase.initializeApp({
    serviceAccount:"./vecurityapp-f29b6ae59a04.json",
    databaseURL: "https://vecurityapp.firebaseio.com/"
});
*/

/*var ref = firebase.database().ref('node-client');
var messageRef = ref.child('messages');

messageRef.push({
    name:'Akena',
    admin: true,
    count:1,
    text:'New admin'
});*/

/*var ref = firebase.database().ref('node-client');
var guards = ref.child('messages');

ref.once('value')
    .then(function (snap){
      console.log(snap.key, "\n\n");
      console.log(snap.ref.toString(), "\n\n");
      console.log(snap.val().messages);
});

*/

//.FirebaseAdmin

//Actual application routes
var guardRouter = require('./routes/guards.route');
var ownerRouter = require('./routes/owners.route');
var guardRequestsRouter = require('./routes/guard_requests.route');
var guardSessionsRouter = require('./routes/guard_sessions.route');
var guardOnlineRouter = require('./routes/guards_online.route');
var dashboardRouter = require('./routes/dashboard.route');
var authRouter = require('./routes/auth.route');
var notificationRouter = require('./routes/notifications.route');
var owners_payment_methods = require('./routes/owners_payment_method.route');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

const authCheck = function (req, res, next) {
    //console.log("Fucing user ",req.user);
    if (req.user === undefined) {
        console.log('fuck me');
        res.redirect('/auth/login-form');
    } else {
        next();
    }


};

//Using actual application routes
app.use('/guards', authCheck, guardRouter);
app.use('/owners', authCheck, ownerRouter);
app.use('/guard-requests', authCheck, guardRequestsRouter);
app.use('/guard-sessions', authCheck, guardSessionsRouter);
app.use('/guards-online', authCheck, guardOnlineRouter);
app.use('/dashboard', authCheck, dashboardRouter);
app.use('/auth', authRouter);
app.use('/notifications', notificationRouter);
app.use('/payment_methods', owners_payment_methods);

app.get('/', function (req, res) {
    res.redirect('/dashboard');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    // next(createError(404));
    res.render('404');
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


/*app.use(function(req, res, next){
    res.io = io;
    next();
});*/

//module.exports = app;
module.exports = {app: app, server: server};
