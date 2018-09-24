$(function () {
    let socket = io();

    socket.on('added', function (msg) {
        $('.online-count').text(msg.numOnline);
        $('#' + msg.guard).text('Online');

    });

    socket.on('removed', function (msg) {
        $('.online-count').text(msg.numOnline);
        $('#' + msg.guard).text('Offline');

    });

    socket.on('task_created', function (msg) {
        console.log("Message", msg);
        let taskList = $('.streamline');
        let totalCount = taskList.data("tasks");
        console.log("Tasks counter", totalCount);
        if (totalCount === 5) {
            $(".streamline .sl-item").last().remove();
        }
        let taskItem = '<div class="sl-item ' + msg.ink + '">' +
            '<div class="sl-content">' +
            '<small class="text-muted">' + msg.createdAt + '</small>' +
            '<p>' + msg.message + '</p>' +
            '</div>' +
            '</div>';

        taskList.prepend(taskItem);
        if (totalCount < 5) {
            totalCount++;
            taskList.data("tasks", totalCount);
        } else {
            console.log("Task count: ", totalCount);
        }

    });
});
