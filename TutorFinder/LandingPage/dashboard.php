<!DOCTYPE html>
<?php
session_start();
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root", "", "infs3202");

$lnameErr = $fnameErr = "";

$fname = $lname = $gender = $program = $campus = $biography = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {


    if (empty($_POST["FName"])) {
        $fnameErr = "First Name is required";
    } else {
        $fname = $_POST["FName"];
    }

    if (empty($_POST["LName"])) {
        $lnameErr = "Last Name is required";
    } else {
        $lname = $_POST["LName"];
    }

    $campus = $_POST['campus'];
    $program = $_POST['program'];
    $bio = $_POST['biography'];
    $gender = $_POST['gender'];

    if ($lnameErr == "" && $fnameErr == "") {

        $query = "update client set FName = 'first name', LName = 'last name', gender = 'sex', campus = 'location', biography = 'intro', program = 'degree' where email = 'user'";
        $query = str_replace("first name", $fname, $query);
        $query = str_replace("last name", $lname, $query);
        $query = str_replace("sex", $gender, $query);
        $query = str_replace("degree", $program, $query);
        $query = str_replace("location", $campus, $query);
        $query = str_replace("intro", $bio, $query);
        $query = str_replace('user', $_SESSION['user'], $query);

        $result = mysqli_query($db->link, $query);
    }
}
$db->disconnect();
?>

<html>
<head>
    <title>Dashboard</title>
    <link href="style.css" type="text/css" rel="stylesheet">
    <link href="styles/dashboard.css" type="text/css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Tangerine">


    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css"
          integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
            integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo"
            crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.0/umd/popper.min.js"
            integrity="sha384-cs/chFZiN24E4KMATLdqdvsezGxaGsi4hLGOzlXwp5UZB1LY//20VyM2taTB4QvJ"
            crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js"
            integrity="sha384-uefMccjFJAIv6A+rW+L4AHf99KvxDjWSu1z9VI8SKNVmz4sk7buKt/6v9KI65qnm"
            crossorigin="anonymous"></script>

    <script type="text/javascript">
        function showInfo() {
            var xmlhttp;
            if (window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();
            } else {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            }
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var userJSON = JSON.parse(xmlhttp.responseText);
                    var user = userJSON.user;
                    var name = userJSON.name;
                    var program = userJSON.program;
                    var picSrc = userJSON.picSrc;
                    var bio = userJSON.bio;
                    var fname = userJSON.fname;
                    var lname = userJSON.lname;
                    var gender = userJSON.gender;
                    var user_type = userJSON.user_type;
                    var campus = userJSON.campus;
                    var courses = userJSON.courses;

                    document.getElementById("name").innerHTML = name;
                    if (user_type == "t") {
                        document.getElementById("userType").innerHTML = "The courses " + name + " teaches: ";
                    } else if (user_type == "s") {
                        document.getElementById("userType").innerHTML = name + " is looking for tutors for: ";
                    }

                    document.getElementById("program").innerHTML = program;
                    document.getElementById('myImg').setAttribute("src", picSrc);
                    document.getElementById('img01').setAttribute("src", picSrc);
                    document.getElementById("biography").innerHTML = bio;
                    document.getElementById("fname").setAttribute("value", fname);
                    document.getElementById("lname").setAttribute("value", lname);
                    document.getElementById("prog").setAttribute("value", program);
                    for (var i = 0; i < courses.length; i++) {
                        $("#displaycourses").append("<a href='https://my.uq.edu.au/programs-courses/course.html?course_code=" + courses[i] + "'>" + courses[i] + "</a><br>");
                    }
                    if (bio != "No biography available!") {
                        document.getElementById("intro").innerHTML = bio;
                    }

                    if (gender == "Male") {
                        document.getElementById("selectgender").selectedIndex = 1;
                    } else if (gender == "Female") {
                        document.getElementById("selectgender").selectedIndex = 2;
                    } else if (gender == "Other") {
                        document.getElementById("selectgender").selectedIndex = 3;
                    } else {
                        document.getElementById("selectgender").selectedIndex = 0;
                    }

                    if (campus == "St. Lucia") {
                        document.getElementById("selectcampus").selectedIndex = 1;
                    } else if (campus == "Gatton") {
                        document.getElementById("selectcampus").selectedIndex = 2;
                    } else if (campus == "Herston") {
                        document.getElementById("selectcampus").selectedIndex = 3;
                    } else {
                        document.getElementById("selectcampus").selectedIndex = 0;
                    }

                    $(document).ready(function () {
                        $("#toListings").attr("href", "listing.php");
                        $("#toSearch").attr("href", "search.php");
                        $("title").html(name);
                    });

                }
            };
            xmlhttp.open("GET", "getUserInfo.php", true);
            xmlhttp.send();
        }

        showInfo();

        function readFile(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById("img01").setAttribute('src', e.target.result);
                    $("#myModal input").attr("disabled", false);
                };
                reader.readAsDataURL(input.files[0]);
            }
        }

    </script>

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
                    <button type="submit" class="btn btn-danger btn-sm">
                        <span class="glyphicon glyphicon-log-out"></span> Log Out
                    </button>
                </form>
            </li>
    </div>
</nav>


<!-- Side Navigation -->
<div class="navigation">
    <ul class="nav flex-column">
        <li class="nav-item">
            <a class="nav-link active" href="dashboard.php">Dashboard</a>
            <ul class="submenu">
                <li><a href="listing.php">Listings</a></li>

            </ul>
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


<div class="container-fluid mytutor-section bg-mytutor-light content ">
    <div class="card-header" style="margin-bottom:10px"><h2>Dashboard</h2></div>
    <div class="row">
        <div class="col-sm-6">
            <div class="card">
                <div id="myModal" class="modal">
                    <span class="close" id="close1">&times;</span>
                    <div class="modal-content">
                        <div class="modal-header"><h5>Edit Profile Pic</h5></div>
                        <div class="modal-body">
                           <table>
                               <tr>
                                   <td><img id="img01" width = 90% ><td/>
                                   <td>  <form action="upload_file.php" method="post" enctype="multipart/form-data">
                                           <input type="file" name="userfile" id="file" onchange="readFile(this)"><br>
                                           <br><input type="submit" class="btn-success" name="submit" value="Save" disabled>
                                       </form></td>
                               </tr>
                           </table>

                        </div>
                        <div class="modal-footer">

                            <button class="btn-danger" id="closebutton">Cancel</button>
                        </div>
                    </div>
                </div>
                <div id="myModal2" class="modal">
                    <div class="modal-content">
                        <div class="modal-header"><h3>Edit Profile Details</h3></div>
                        <span class="close" id="close2">&times;</span>
                        <form id="editProfile" method="POST"
                              action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                            <label>First Name</label><br>
                            <input type="text" class="form-control" name="FName" placeholder="First Name"
                                   id="fname"><br>
                            <label>Last Name</label><br>
                            <input type="text" class="form-control" name="LName" placeholder="Last Name" id="lname"><br>
                            <label>Program</label><br>
                            <input type="text" class="form-control" name="program" placeholder="Program" id="prog"><br>
                            <label>Campus</label><br>
                            <select name="campus" id="selectcampus">
                                <option value="N/A">Select Your Campus</option>
                                <option value="St. Lucia">St. Lucia</option>
                                <option value="Gatton">Gatton</option>
                                <option value="Herston">Herston</option>
                            </select><br>
                            <label>Gender</label><br>
                            <select name="gender" id="selectgender">
                                <option value="N/A">Select Your Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select><br>
                            <label>Biography</label><br>
                            <textarea class="form-control" placeholder="Introduce yourself!" name="biography"
                                      id="intro"></textarea><br>
                            <div class="modal-foot"><input type="submit" class="btn btn-outline-primary" value="Save"
                                                           name="submit"></div>
                        </form>
                    </div>
                </div>
                <div class="card-header">

                    <h5><p id="name">Name</p></h5>

                </div>

                <div class="card-body text-center">
                    <table cellspacing="0" cellpadding="0">
                        <tr>
                            <td><img id="myImg" alt="Profile Picture" width="100%"></td>
                            <td style= "width: 80%">
                                <p id="program">Program</p>
                                <p id="biography">No biography available!</p>
                                <p id="userType"></p>
                                <div id="displaycourses"></div>
                            </td>
                        </tr>
                    </table>

                   <br> <button class="btn btn-secondary" id="showEdit">Edit</button>
                    <a class="btn btn-info" href="listing.php" role="button">View my lists</a>
                    <a class="btn btn-info" href="search.php" role="button">Search Tutors</a>
                    <p>
                    <form action="deleteaccount.php" method="POST">
                        <input class="btn btn-danger" type="submit" value="Delete Account">
                    </form>
                </div>
            </div>
        </div>

        <div class="col-sm-6">
            <div class="card">
                <h5 class="card-header">Notifications</h5>
                <div class="card-body">
                    <p class="card-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur in est
                        hendrerit, venenatis nunc vitae, varius arcu. Etiam elementum ut velit non dignissim. Fusce quis
                        eros vitae risus auctor egestas. Etiam tristique elementum porta. Nam dapibus velit non augue
                        condimentum faucibus. Vivamus in mattis lectus, id interdum orci. Praesent ultrices congue diam,
                        vitae rutrum neque volutpat at. Vestibulum in lorem id lorem ultrices placerat.</p>
                </div>
            </div>
        </div>
    </div>
    <div class="row" style="margin-top:15px">
        <div class="col-sm-6">
            <div class="card">
                <div class="card-header">Pairings</div>
                <div class="card-body">
                </div>
            </div>
        </div>
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

</body>

<script type="text/javascript">

    $(document).ready(function () {
        $("#myImg").click(function () {
            $("#myModal").css("display", "block");
        });

        $("#close1").click(function () {
            $("#myModal").css("display", "none");
        });

        $("#closebutton").click(function () {
            $("#myModal").css("display", "none");
        });

        $("#showEdit").click(function () {
            $("#myModal2").css("display", "block");
        });

        $("#close2").click(function () {
            $("#myModal2").css("display", "none");
        });


    });
</script>
</html>

