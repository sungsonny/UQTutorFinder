<html lang="en">
<head>
    <title> calendar </title>

    <link href="style.css" type="text/css" , rel="stylesheet">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.4.0/fullcalendar.css"/>
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-alpha.6/css/bootstrap.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.4.0/fullcalendar.min.js"></script>
    <meta charset="utf-8">
    <script>

        $('#calendar').fullCalendar('option', 'height', 700);
    </script>

    <script>

        $(document).ready(function () {
            var calendar = $('#calendar').fullCalendar({
                editable: true,
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay'
                },
                events: 'load.php',
                selectable: true,
                selectHelper: true,
                select: function (start, end, allDay) {
                    var title = prompt("Enter Event Title");
                    if (title) {
                        var start = $.fullCalendar.formatDate(start, "Y-MM-DD HH:mm:ss");
                        var end = $.fullCalendar.formatDate(end, "Y-MM-DD HH:mm:ss");
                        $.ajax({
                            url: "insert.php",
                            type: "POST",
                            data: {title: title, start: start, end: end},
                            success: function () {
                                calendar.fullCalendar('refetchEvents');
                                alert("Added Successfully");
                            }
                        })
                    }
                },
                editable: true,
                eventResize: function (event) {
                    var start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
                    var end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
                    var title = event.title;
                    var id = event.id;
                    $.ajax({
                        url: "update.php",
                        type: "POST",
                        data: {title: title, start: start, end: end, id: id},
                        success: function () {
                            calendar.fullCalendar('refetchEvents');
                            alert('Event Update');
                        }
                    })
                },

                eventDrop: function (event) {
                    var start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
                    var end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
                    var title = event.title;
                    var id = event.id;
                    $.ajax({
                        url: "update.php",
                        type: "POST",
                        data: {title: title, start: start, end: end, id: id},
                        success: function () {
                            calendar.fullCalendar('refetchEvents');
                            alert("Event Updated");
                        }
                    });
                },

                eventClick: function (event) {
                    if (confirm("Are you sure you want to remove it?")) {
                        var id = event.id;
                        $.ajax({
                            url: "delete.php",
                            type: "POST",
                            data: {id: id},
                            success: function () {
                                calendar.fullCalendar('refetchEvents');
                                alert("Event Removed");
                            }
                        })
                    }
                },

            });
        });

    </script>
</head>
<body id="bootstrap-override-body" class="container-fluid">
<!--top header -->
<nav id="bootstrap-override-navbar" class="navbar navbar-inverse w3-theme-d3">
    <div class="container-fluid">
        <div class="navbar-header">
            <a class="navbar-brand" href="#">UQ Tutor Finder</a>
        </div>

        <ul class="nav navbar-nav navbar-right">
            <li>
                <form action="logout.php" method="POST">

                    <button type="submit" class="btn btn-primary btn-sm">
                        <span class="glyphicon glyphicon-log-out"></span> Log Out
                    </button>
                </form>

            </li>

            <li class="dropdown">
                <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                    <span id="userImage"> <img src="myImg" alt="Profile Pic"></span>
                    <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="#">Account Name</a></li>
                    <li><a href="#">View Profile</a></li>
                    <li><a href="#">Account Settings</a></li>
                </ul>
            </li>
        </ul>
    </div>
</nav>


<!-- Side Navigation -->
<div class="navigation">
    <ul class="nav flex-column">
        <li class="nav-item">
            <a class="nav-link active" href="">Dashboard</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href=""> Tutors </a>
            <ul class="submenu">
                <li><a href="">Find Tutors</a></li>
                <li><a href="">My Tutors</a></li>
            </ul>

        </li>
        <li class="nav-item">
            <a class="nav-link" href="#">Calendar</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#">Payment Order</a>
        </li>
    </ul>
</div>


<div class="container-fluid mytutor-section bg-mytutor-light">
    <div id = "boostrap-override-light" class="container-fluid mytutor-section bg-mytutor-light" >
        <div id="calendar"></div>


    </div>

</div>
<!-- Footer -->
<footer class="footer mytutor-footer text-center w3-theme-l3">
    <div class="container">
        <p class="text-muted">
            <small>&copy; MyTutor.com</small>
        </p>
        <p class="text-muted">
            <small>Terms &amp; Conditions</small>
        </p>
        <p class="text-muted">
            <small>About Us</small>
        </p>
    </div>

</footer>
</footer>
</body>
</html>