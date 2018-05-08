<!DOCTYPE html>
<?php 
session_start();
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");

$lnameErr = $fnameErr = "";

$fname = $lname = $gender = $program = $campus = $biography = "";

if ($_SERVER["REQUEST_METHOD"] == "POST"){

  
	if(empty($_POST["FName"])){
		$fnameErr = "First Name is required";
	} else{
		$fname = $_POST["FName"];
	}

	if(empty($_POST["LName"])){
		$lnameErr = "Last Name is required";
	} else{
		$lname = $_POST["LName"];
	}

	$campus = $_POST['campus'];
	$program = $_POST['program'];
	$bio = $_POST['biography'];
	$gender = $_POST['gender'];

	if($lnameErr == "" && $fnameErr == "" ){

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
		<link rel="stylesheet" type="text/css" href="styles/imgareaselect-default.css"">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
		<style>

			#myImg {
				border-radius: 50%;
				cursor: pointer;
				transition: 0.3s;
			}

			#myImg:hover {
				opacity: 0.6;
			}

			.modal {
				display: none;
				position: fixed;
				z-index: 1;
				padding-top: 15px;
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				overflow: auto;
				background-color: rgb(0,0,0);
				background-color: rgba(0,0,0,0.7);
			}

			.modal-content {
				margin: auto;
				padding-top: 10vh;
				display: block;
				width: 30%;
				max-width: 700px;
			}

			#img01{
				width: 70vw;
			}

			.modal-content { 
                animation-name: zoom;
                animation-duration: 0.6s;
            }

            @keyframes zoom {
            	from{transform: scale(0)}
            	to {transform: sclae(1)}
            }

            .close {
            	position: absolute;
            	top: 15px;
            	right: 35px;
            	color: #f1f1f1;
            	font-size: 40px;
            	font-weight: bold;
            	transition: 0.3s;
            }

            .close:hover, .close:focus {
            	color: #bbb;
            	text-decoration: none;
            	cursor: pointer;
            }
		</style>
		<script type="text/javascript">
			function showInfo(str){
				var xmlhttp;
				if(str == ""){
					document.getElementById("name").innerHTML = "";
					document.getElementById("program").innerHTML = "";
					return;
				}
				if (window.XMLHttpRequest){
					xmlhttp = new XMLHttpRequest();
				} else{
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				}
				xmlhttp.onreadystatechange=function(){
					if(xmlhttp.readyState==4 && xmlhttp.status == 200){
						
						var userJSON = JSON.parse(xmlhttp.responseText);
						var name = userJSON.name;
						var program = userJSON.program;
						var picSrc= userJSON.picSrc;
						var bio = userJSON.bio;
						var fname = userJSON.fname;
						var lname = userJSON.lname;
						var gender = userJSON.gender;
						var user_type = userJSON.user_type;
						var campus = userJSON.campus;
						console.log(campus);


						document.getElementById("name").innerHTML= name;
						document.getElementById("program").innerHTML = program;
						document.getElementById('myImg').setAttribute("src", picSrc);
						document.getElementById('img01').setAttribute("src", picSrc);
						document.getElementById("biography").innerHTML = bio;
						document.getElementById("fname").setAttribute("value", fname);
						document.getElementById("lname").setAttribute("value", lname);	
						document.getElementById("prog").setAttribute("value", program);
						if(bio !="No biography available!"){
							document.getElementById("intro").innerHTML = bio;
						}

						if(gender == "Male") {
							document.getElementById("selectgender").selectedIndex = 1;
						} else if (gender == "Female") {
							document.getElementById("selectgender").selectedIndex = 2;
						} else if (gender == "Other") {
							document.getElementById("selectgender").selectedIndex = 3;
						} else{
							document.getElementById("selectgender").selectedIndex = 0;
						}

						if(campus == "St. Lucia") {
							document.getElementById("selectcampus").selectedIndex = 1;
						} else if (campus == "Gatton") {
							document.getElementById("selectcampus").selectedIndex = 2;
						} else if (campus == "Herston") {
							document.getElementById("selectcampus").selectedIndex = 3;
						} else {
							document.getElementById("selectcampus").selectedIndex = 0;
						}
									
					}
				};
				xmlhttp.open("GET","getUserInfo.php?q=",true);
				xmlhttp.send();
			}
			showInfo();

			function readFile(input) {
				if (input.files && input.files[0]) {
					var reader = new FileReader();
					reader.onload = function(e) {
						document.getElementById("img01").setAttribute('src',e.target.result);
					};
					reader.readAsDataURL(input.files[0]);
				}
			}
		</script>
	</head>
	<body>
		<h2>Dashbaord</h2>
		<img id="myImg" alt="Profile Picture" width="15%" >
		<div id="myModal" class="modal">
			<span class="close" id="close1">&times;</span>
			<img class="modal-content" id="img01">
			<form class = "modal-content" action="upload_file.php" method="post" enctype="multipart/form-data">
			    <input type="file" name="userfile" id="file" onchange="readFile(this)"><br>
			    <input type="submit" name="submit" value="Save">
			</form>
			<button id="closebutton">Cancel</button>
		</div>
		<button id="showEdit">Edit</button>
		<div id="myModal2" class="modal">
			<div class="modal-content">
				<span class="close" id="close2">&times;</span>
				<form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
				    <label>First Name</label><br>
	                <input type="text" name="FName" placeholder="First Name" id="fname"><br>
	                <label>Last Name</label><br>
	                <input type="text" name="LName" placeholder="Last Name" id="lname"><br>
	                <label>Program</label><br>
	                <input type="text" name="program" placeholder="Program" id="prog"><br>
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
					<textarea placeholder="Introduce yourself!" name="biography" id="intro"></textarea><br>
					<input type="submit" value="Save" name="submit">
				</form>
			</div>
		</div>

		<p id="name">Name</p>
		<p id="program">Program</p>
		<p id="biography">No biography available!</p>
		<form action="logout.php" method="POST" >
			<input type="submit" value="Log Out">
		</form>
		<form action="deleteaccount.php" method="POST">
			<input type="submit" value="Delete Account">
		</form>
		<a href="listing.php">View my lists!</a>
	</body>
	<script type="text/javascript">

        $(document).ready(function(){
        	$("#myImg").click(function(){
        		$("#myModal").css("display","block");
        	});

        	$("#close1").click(function(){
        		$("#myModal").css("display","none");
        	});

        	$("#closebutton").click(function(){
        		$("#myModal").css("display","none");
        	});

        	$("#showEdit").click(function(){
        		$("#myModal2").css("display","block");
        	});

        	$("#close2").click(function(){
        		$("#myModal2").css("display","none");
        	});


        });
	</script>
</html>

