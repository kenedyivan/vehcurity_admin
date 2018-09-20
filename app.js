let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let bodyParser = require('body-parser');
let admin = require('./config/firebase_config.js');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let cron = require('node-cron');
let passport = require('passport');
let flash = require('connect-flash');
const cookieSession = require('cookie-session');
let connection = require('./config/db_config');
//connection.connect();

//Socket io
io.on('connection', function (socket) {
    console.log('a user connected');

    let ref = admin.database().ref('Guards');
    ref.on('child_added', function (snap) {
        ref.on('value', function (guardsSnap) {
            let data = {};
            data.numOnline = guardsSnap.numChildren();
            data.guard = snap.key;

            io.emit('added', data);
        });


    });

    ref.on('child_removed', function (snap) {
        ref.on('value', function (guardsSnap) {
            let data = {};
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
    let registrationToken = req.params.token;

    // See documentation on defining a message payload.
    let message = {
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
let tasks = {};

//Begin cron tasks
function startGuardCounter(guardToken, duration) {
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
}

function startOwnerCounter(ownerToken, duration, guardId, totalCost) {
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
}

function logNotification(image, message) {
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

}

function activateGuard(guardId) {
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
}

function inkRandom() {
    let inkArray = ['sl-primary', 'sl-danger', 'sl-success', 'sl-warning', ''];
    return inkArray[Math.floor(Math.random() * inkArray.length)];
}

function logTaskToDB(taskId, agentId, message, status) {
    let ink = inkRandom();
    connection.query("INSERT INTO task_logs(fire_ID,created_by,message,ink) " +
        "VALUES('" + taskId + "','" + agentId + "','" + message + "','" + ink + "')",
        function (err, rows, fields) {
            if (err) throw err;
            console.log('Created task', rows);

            connection.query("SELECT * FROM task_logs WHERE id ='" + rows.insertId + "' ",
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

}

app.get('/create-guarding-session/:guardId/:ownerId/:duration/:startTime/:endTime/:totalCost/:' +
    'status/:minute/:hour/:day/:month/:requestKey/:paymentType', function (req, res) {
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
        submitCashPayment(guardSessionData, requestKey);
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

            startGuardCounter(guardToken, duration); //Starts guard counter
            startOwnerCounter(ownerToken, duration, guardId, totalCost); //Starts owner counter

            let guards = ref.child('GuardsInformation');
            guards.child(guardId).once('value')
                .then(function (snap) {
                    let timeInMinutes = parseInt(duration);
                    let hours = timeInMinutes / 60;
                    let minutes = timeInMinutes % 60;

                    logNotification(snap.val().avatar, snap.val().name +
                        " Started a guard session of " + Math.round(hours) + " hrs and " + minutes + " mins");
                });


            console.log("guard:: " + guardToken + " owner:: " + ownerToken);
        }).catch(function (error) {
            console.log("fcm tokens data error", error);
        });
    });

    activateGuard(guardId);

    let taskId = newGuardSessionKey;
    let task;
    let cronString = minute + ' ' + hour + ' ' + day + ' ' + month + ' *';
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

}

app.get('/end-session/:id', function (req, res) {
    destroyTask(req.params.id) //Destroys task
});

app.get('/send-message/', function (req, res) {
    endGuardCounter("fGpsCYU2R8I:APA91bF6yseSknhbERBzth0XoMa0d28DBeWRaqzyexGZZIQQPBUej33jOAQTCHgpjTZLpuoMbZ0auI2151qkcu6Zj8SE51owoRLeE9N0M5rVPygaWcXBnTwyoKBD31c_K1L3geqaNIVZo4ru1mxLSEw8zjg8HV4kTw");
});

function endGuardCounter(guardToken) {
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
}

function endOwnerCounter(ownerToken) {
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
}

function inactivateGuard(guardId) {
    let ref = admin.database().ref();
    let activeGuard = ref.child('ActiveGuards');
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

                    endGuardCounter(guardToken);//Ends guard counter
                    endOwnerCounter(ownerToken);//Ends owner counter
                    inactivateGuard(guardId);

                    let guards = ref.child('GuardsInformation');
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
let firebase = require('firebase');

//FirebaseAdmin
firebase.initializeApp({
    serviceAccount:"./vecurityapp-f29b6ae59a04.json",
    databaseURL: "https://vecurityapp.firebaseio.com/"
});
*/

/*let ref = firebase.database().ref('node-client');
let messageRef = ref.child('messages');

messageRef.push({
    name:'Akena',
    admin: true,
    count:1,
    text:'New admin'
});*/

/*let ref = firebase.database().ref('node-client');
let guards = ref.child('messages');

ref.once('value')
    .then(function (snap){
      console.log(snap.key, "\n\n");
      console.log(snap.ref.toString(), "\n\n");
      console.log(snap.val().messages);
});

*/

//.FirebaseAdmin

//Actual application routes
let guardRouter = require('./routes/guards.route');
let ownerRouter = require('./routes/owners.route');
let guardRequestsRouter = require('./routes/guard_requests.route');
let guardSessionsRouter = require('./routes/guard_sessions.route');
let guardOnlineRouter = require('./routes/guards_online.route');
let dashboardRouter = require('./routes/dashboard.route');
let authRouter = require('./routes/auth.route');
let notificationRouter = require('./routes/notifications.route');
let owners_payment_methods = require('./routes/owners_payment_method.route');


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
