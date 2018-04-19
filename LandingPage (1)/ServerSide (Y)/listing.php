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
	</head>
	<body>
		<form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
		    <label>Course Code: </label>
			<input type="text" name="course"><br>
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
	$courseCode = $_POST['course'];
	$rate = $_POST['maxRate'];
	$gender = $_POST['gender'];
	$type = $_POST['type'];
	$sessionNo = $_POST['sessionNo'];
	$campus = $_POST['campus'];
	$length = $_POST['length'];
	$notes = $_POST['notes'];

	$query = "insert into listing values('email','courseID','rate','gender','type','sessionNo','campus','length','notes')";

	$query = str_replace('email', $_SESSION['user'], $query);
	$query = str_replace('courseID',$courseCode, $query);
	$query = str_replace('rate', $rate, $query);
	$query = str_replace('gender', $gender, $query);
	$query = str_replace('type', $type, $query);
	$query = str_replace('sessionNo', $sessionNo, $query);
	$query = str_replace('campus', $campus, $query);
	$query = str_replace('length', $length, $query);
	$query = str_replace('notes', $notes, $query);


	$result = mysqli_query($db->link, $query);

	if(!$result){
        	//header("Location: index.php");
        	//die(sqli_error($db->link));
		    echo "failed";
        } else{
        	echo "Successful!";
        }
}
?>