<!DOCTYPE html>
<?php

session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: index.php");
}
?>
<html>
	<head>
		<title>Preference Settings</title>
		<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"></script>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
		<script type="text/javascript">
			function showInfo(str){
				var xmlhttp;
				if (window.XMLHttpRequest){
					xmlhttp = new XMLHttpRequest();
				} else{
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				}
				xmlhttp.onreadystatechange=function(){
					if(xmlhttp.readyState==4 && xmlhttp.status == 200){
						
						document.getElementById("listingdisplay").innerHTML=xmlhttp.responseText;		
					}
				};
				xmlhttp.open("GET","getListing.php?q=",true);
				xmlhttp.send();
			}
			showInfo();

			$(document).ready(function(){
				

				$("#courseinput").keyup(function(){
					var letterArray = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","","R","S","T","U","V","W","X","Y","Z"];
				    var numArray = ["0","1","2","3","4","5","6","7","8","9"];
				    var letters = $("#codevalue").text().slice(0,3);
				    var nums = $("#codevalue").text().slice(4,7);
				    var capLetters = letters.toUpperCase();
				    var letterValid = true;
				    var numValid = true;
				    for (var i=0; i < capLetters.length; i++) {
					    if (!letterArray.includes(capLetters[i])) {
						letterValid = false;
					    }
				    }

				    for (var i=0; i<nums.length; i++) {
					    if (!numArray.includes(nums[i])) {
						numValid = false;
					   }
				    }

					if($("#codevalue").text().length!=8 || !numValid || !letterValid) {
						$(".error").html("*Please enter a valid course code!");
					} else{
						$(".error").html("*");
					}

				});
			});


			

		</script>
		<style>
			.error{
				color: red;
			}

			#codevalue{
				display: none;
			}
		</style>
		
	</head>
	<body>
	    <button id="showEdit">Edit My Listings!</button>
	    <div id="listingdisplay"></div>
		<form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
		    <div ng-app="">
		    	<label>Course Code: </label>
			    <input type="text" name="course" id="courseinput" ng-model="code"><span class="error">*</span><br>
			    <p ng-bind="code" id="codevalue"></p>
		    </div>
			<label>Rate</label>
			<select name="maxRate">
			    <option value="N/A" selected>Maximum Hourly Rate</option>
				<option value="25$">25$</option>
				<option value="50$">50$</option>
				<option value="75$">75$</option>
				<option value="100$">100$</option>
				<option value="Any">Any</option>
			</select><br>
			<select name="gender">
				<option value="N/A" selected>Preferred Gender</option>
				<option value="Male">Male</option>
				<option value="Female">Female</option>
				<option value="Any">Any</option>
			</select><br>
			<select name="campus">
				<option value="N/A" selected>Campus</option>
				<option value="St Lucia">St Lucia</option>
				<option value="Gatton">Gatton</option>
				<option value="Herston">Herston</option>
			</select><br>
			<select name="type">
				<option value="N/A" selected>Session Type</option>
				<option></option>
			</select><br>
			<select name="sessionNo">
				<option value="N/A" selected>No. Weekly Seesions</option>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="More than 3">More Than 3</option>
				<option value="Any">Any</option>
			</select><br>
			<select name="length">
				<option value="N/A" selected>Session Duration</option>
				<option value="1h">1 Hour</option>
				<option value="2h">2 Hours</option>
				<option value=">2h">More than 2 hours</option>
				<option value="Any">Any</option>
			</select><br>
			<textarea rows="4" cols="50" name="notes" placeholder="Leave your notes here"></textarea><br>
			<input type="submit" value="Submit">
		</form>
	</body>
</html>
<?php
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");

if ($_SERVER["REQUEST_METHOD"] == "POST"){
	$courseCode = $_POST['course'].toUpperCase();
	$rate = $_POST['maxRate'];
	$gender = $_POST['gender'];
	$type = $_POST['type'];
	$sessionNo = $_POST['sessionNo'];
	$campus = $_POST['campus'];
	//echo $campus;
	$length = $_POST['length'];
	$notes = $_POST['notes'];

	$query = "insert into listing values('email','courseID','rate','gender','campus', 'type', 'sessionNo', 'length','notes')";

	$query = str_replace('email', $_SESSION['user'], $query);
	$query = str_replace('courseID',$courseCode, $query);
	$query = str_replace('rate', $rate, $query);
	$query = str_replace('gender', $gender, $query);
	$query = str_replace('type', $type, $query);
	$query = str_replace('sessionNo', $sessionNo, $query);
	$query = str_replace('campus', $campus, $query);
	$query = str_replace('length', $length, $query);
	$query = str_replace('notes', $notes, $query);
	//echo $query;


	$result = mysqli_query($db->link, $query);

	if(!$result){
        	//header("Location: index.php");
        	//die(sqli_error($db->link));
		    //echo "failed";
        } else{
        	//echo "Successful!";
        }
}
?>