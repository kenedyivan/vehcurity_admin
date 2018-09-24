/*let config = {
    apiKey: "AIzaSyA15fgg0qZb1nzLUNPrzw8hgD32rd5Kp7M",
    authDomain: "vecurityapp.firebaseapp.com",
    databaseURL: "https://vecurityapp.firebaseio.com",
    projectId: "vecurityapp",
    storageBucket: "vecurityapp.appspot.com",
    messagingSenderId: "400920472071"
};*/
firebase.initializeApp(config);

//Db reference
let ref = firebase.database().ref();
//Guards
let guards = ref.child('GuardsInformation');
guards.once('value')
    .then(function (snap) {
        $('#num-guards').text(snap.numChildren());
    });

//Owners
let owners = ref.child('OwnersInformation');
owners.once('value')
    .then(function (snap) {
        $('#num-owners').text(snap.numChildren());
    });

//Online guards
let onlineGuards = ref.child('Guards');
onlineGuards.once('value')
    .then(function (snap) {
        $('#num-online').text(snap.numChildren());
    });

onlineGuards.on('child_added', function (snap) {
    onlineGuards.on('value', function (onlineSnap) {
        $('#num-online').text(onlineSnap.numChildren());
    });
});

onlineGuards.on('child_removed', function (snap) {
    onlineGuards.on('value', function (onlineSnap) {
        $('#num-online').text(onlineSnap.numChildren());
    });

});

//Active sessions
let activeSessions = ref.child('ActiveGuards');
activeSessions.on('value', function (snap) {
    $('#num-active-sessions').text(snap.numChildren());
});

activeSessions.on('child_added', function (snap) {
    activeSessions.on('value', function (snap) {
        $('#num-active-sessions').text(snap.numChildren());
    });
});
activeSessions.on('child_removed', function (snap) {
    activeSessions.on('value', function (snap) {
        $('#num-active-sessions').text(snap.numChildren());
    });
});
//--End active sessions

//session logs

//--End session logs

//Total requests
let requests = ref.child('Requests');
requests.on('value', function (requestSnap) {
    $('#num-requests').text(requestSnap.numChildren());
});

requests.on('child_added', function (requestSnap) {
    requests.on('value', function (requestSnap) {
        $('#num-requests').text(requestSnap.numChildren());
    });
});


//Notifications
let newNotifications = ref.child('NewNotifications');
newNotifications.on('child_added', function (snap) {
    newNotifications.on('value', function (snap) {
        let count = snap.numChildren();
        if (count > 0) {
            let count = $('<span class="notification-count badge blue"></span>').text(snap.numChildren());
            $('#notify').append(count)
            $('#notify-count').text("You have " + snap.numChildren() + " new notification");
        } else {
            $('#notify-count').text("You have 0 new notification");
        }
    });
});

$("#notify").on('click', function () {
    ref.child('NewNotifications')
        .remove(function (e) {
            $('.notification-count').remove();
            $('#notify-count').text("You have 0 new notification");
        });
});

let notifications = ref.child('Notifications');
let seenNotifications = 0;
notifications.orderByChild('createdAt').limitToLast(5).on('child_added', function (addedSnap) {
    seenNotifications++;
    let notifyList = $('#notifications');
    if (seenNotifications > 5) {
        console.log("Seen", "Seeing all the 5");
        notifyList.find('li:last-child').remove();
    }

    console.log("Count ", addedSnap.numChildren());
    let val = addedSnap.val();
    let listItem = '<li>' +
        '<a href="#">' +
        '<div class="user_img">' +
        '<img src="' + val.image + '" alt="">' +
        '</div>' +
        '<div class="notification_desc">' +
        '<p>' + val.message + '</p>' +
        '<p>' +
        '<span>' + val.createdAt + '</span>' +
        '</p>' +
        '</div>' +
        '<div class="clearfix"></div>' +
        '</a>' +
        '</li>';
    let notificationBody = $(listItem);
    notifyList.prepend(notificationBody);


});

//Active guards
let activeGuards = ref.child('ActiveGuards');
let seenActiveGuards = 0;
activeGuards.orderByChild('createdAt').limitToLast(5).on('child_added', function (snap) {
    seenActiveGuards++;
    if (seenActiveGuards > 5) {
        $(".list-group a").last().remove();
    }

    let listGroup = $('.list-group');
    let listItem = '<a id="' + snap.key + '" class="list-group-item media" href="">' +
        '<div class="pull-left">' +
        '<img class="lg-item-img" src="' + snap.val().avatar + '" alt="" width="50px" height="50px">' +
        '</div>' +
        '<div class="media-body">' +
        '<div class="pull-left">' +
        '<div class="lg-item-heading">' + snap.val().name + '</div>' +
        '<small class="lg-item-text">' + snap.val().createdAt + '</small>' +
        '</div>' +
        '<div class="pull-right">' +
        '<div class="lg-item-heading">Active</div>' +
        '</div>' +
        '</div>' +
        '</a>';

    let activeGuardBody = $(listItem);
    listGroup.prepend(activeGuardBody);

});

activeGuards.on('child_removed', function (snap) {
    let key = snap.key;
    let item = $('#' + key);
    item.remove();

});

activeGuards.on('value', function (snap) {
    let len = snap.numChildren();
    let listGroup = $('.list-group');
    let status = $('<p class="no-guards">No guards active!</p>');

    if (len < 1) {
        listGroup.append(status);
    } else {
        $('.no-guards').remove();
    }

});