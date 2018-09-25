$(function () {
    let el = $("#message-pod");
    let error_el = $("#error-message-pod");
    let error_message = error_el.text();
    let message = el.text();
    if (el.text() === '') {
        //No flash message set
    } else {
        toastr["info"](message)
        el.html('');
    }

    if (error_el.text() === '') {
        //No flash error message set
    } else {
        toastr["error"](error_message)
        error_el.html('');
    }

    //delete_cookie('messages')

});

toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": 300,
    "hideDuration": 1000,
    "timeOut": 5000,
    "extendedTimeOut": 1000,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}