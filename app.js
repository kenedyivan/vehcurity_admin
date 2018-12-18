let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let passport = require('passport');
let flash = require('connect-flash');
const cookieSession = require('cookie-session');
let hotSocket = require('./socketing/host_socket');
let authCheck = require('./custom_middlewares/auth_check');
let logger = require('./logger/logger');
let fs = require('fs');

//Sets proper timezone to Morgan time stamp
morgan.token('date', function () {
    let p = new Date().toString().replace(/[A-Z]{3}\+/, '+').split(/ /);
    return (p[2] + '/' + p[1] + '/' + p[3] + ':' + p[4] + ' ' + p[5]);
});

// create a write stream (in append mode)
let accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});

let socketPool = [];
/*start: Socket messaging*/
io.sockets.on('connection', function (socket) {

    socket.on('user id', function (data) {
        socketPool[data] = {
            "socket": socket.id
        };

        /*console.log("socket size ", Object.keys(socketPool));
        console.log("socket data " + socketPool);*/
    });


    socket.on('make request', function (data) {
        console.log(`New guard request, User type = Owner, User id = ${data["user_id"]}, message = ${data["message"]}`);
        io.sockets.connected[socketPool[data["user_id"]].socket].emit("new request", data["message"]);
    });

    socket.on('accept request', function (data) {
        console.log(`Accepted guard request, User type = Guard, User id = ${data["user_id"]}, message = ${data["message"]}`);
        io.sockets.connected[socketPool[data["user_id"]].socket].emit("request accepted", data["message"]);

    });
});
/*end: Socket messaging*/
//hotSocket.setSocket(io);

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: ['akenakenedynerd']
}));

app.use(flash());


require('./config/passport_config')(passport);
app.use(passport.initialize());
app.use(passport.session());

//Actual application routes
let guardRouter = require('./routes/guards.route');
let ownerRouter = require('./routes/owners.route');
let guardRequestsRouter = require('./routes/guard_requests.route');
let guardSessionsRouter = require('./routes/guard_sessions.route');
let guardSessionApiRouter = require('./routes/api_guard_sessions.route');
let guardOnlineRouter = require('./routes/guards_online.route');
let dashboardRouter = require('./routes/dashboard.route');
let authRouter = require('./routes/auth.route');
let notificationRouter = require('./routes/notifications.route');
let owners_payment_methods = require('./routes/owners_payment_method.route');
let guardsCreditRouter = require('./routes/guards_credit.route');
let ownersCreditRouter = require('./routes/owners_credit.route');
let testRouter = require('./routes/test_route');
let cashPaymentRouter = require('./routes/cash_payment_test.route');
let creditPaymentRouter = require('./routes/credit_payment_test.route');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('view engine', 'pug');

app.use(morgan('combined', {stream: accessLogStream}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

//scripts
app.use('/scripts', express.static(__dirname + '/node_modules/mdbootstrap/'));

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
app.use('/credit', guardsCreditRouter);
app.use('/owner/credit', ownersCreditRouter);
app.use('/test', testRouter);
app.use('/guard-sessions-api', guardSessionApiRouter);
app.use('/pay-cash', cashPaymentRouter);
app.use('/pay-credit', creditPaymentRouter);

app.get('/', function (req, res) {
    res.redirect('/dashboard');
});

app.get('/logging', function (req, res) {
    logger.info("My awesome log", {label: "myLogger"});
    res.send("Logging nicely");
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

//module.exports = app;
module.exports = {app: app, server: server};