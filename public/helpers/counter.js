function countdown(element, minutes, seconds) {
    // Fetch the display element
    var el = document.getElementById(element);

    // Set the timer
    var interval = setInterval(function () {
        if (seconds == 0) {
            if (minutes == 0) {
                (el.innerHTML = "STOP!");

                clearInterval(interval);
                return;
            } else {
                minutes--;
                seconds = 60;
            }
        }

        if (minutes > 0) {
            var minute_text = minutes + (minutes > 1 ? ' mins' : ' min');
        } else {
            var minute_text = '';
        }

        var second_text = seconds > 1 ? '' : '';
        el.innerHTML = minute_text + ' ' + seconds + ' ' + second_text + '';
        seconds--;
    }, 1000);
}

function countdownFormatted(element, time) {

    // Set the date we're counting down to
    var countDownDate = new Date(time).getTime();
    var el = document.getElementById(element);

// Update the count down every 1 second
    var x = setInterval(function () {

        // Get todays date and time
        var now = new Date().getTime();

        // Find the distance between now an the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if(days === 0){
            // Output the result in an element with id="demo"
            el.innerHTML = hours + "h "
                + minutes + "m " + seconds + "s ";
        }else{
            // Output the result in an element with id="demo"
            el.innerHTML = days + "d " + hours + "h "
                + minutes + "m " + seconds + "s ";
        }



        // If the count down is over, write some text
        if (distance < 0) {
            clearInterval(x);
            el.innerHTML = "EXPIRED";
        }
    }, 1000);

}