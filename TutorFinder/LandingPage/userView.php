<?php
session_start();
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
    header("Location: index.php");
} else{
    $userViewed = $_GET["q"];
    $query = 'select * from client where email = "USEREMAIL"';
    $query = str_replace("USEREMAIL", $userViewed, $query);
    $result = mysqli_query($db->link, $query);
    $courses = array();

    if ($result) {

        $query1 = "select courseID from listing where email = 'useremail'";
        $query1 = str_replace("useremail",$userViewed,$query1);
        $result1 = mysqli_query($db->link,$query1);
        if($result1){
            while($row1 = mysqli_fetch_array($result1)) {
                $course = $row1['courseID'];
                array_push($courses,$course);
            }
        } else{
            die(mysqli_error($db->link));
        }

        $row = mysqli_fetch_array($result);
        $name = $row["FName"] ." ". $row["LName"];
        $program = $row["program"];
        $biography = $row["biography"];
        $picSrc = $row["picSrc"];
        if ($row["user_type"] == "s") {
            $userType = "Student";
        } else if ($row["user_type"] == "t") {
            $userType = "Tutor";
        }
    } else {
        die(mysqli_error($db->link));
    }
}


$db->disconnect();
?>
<!DOCTYPE html>
<html>
	<head>
		<title id="hi"></title>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
		<script type="text/javascript">
            document.getElementById("hi").innerHTML = "User";
		</script>
	</head>
	<body>
		<img src=<?php echo $picSrc?>>
		<p><?php echo "Name: ".$name?></p>
        <p><?php echo "User Type: ".$userType?></p>
		<p><?php echo "Program: ".$program?></p>
		<p><?php echo "Biography: ".$biography?></p>
        <p>
            <?php
            if ($userType = 't') {
                echo $name." teaches the following courses:";
            } else if ($userType == 's') {
                echo $name." is looking for tutors for the following courses:";
            } ?>
        </p>
        <div>
            <?php
            for ($i=0; $i<sizeof($courses); $i++) {
                echo "<p>".$courses[$i]."</p>";
            }
            ?>
        </div>
        <a href="index.php">Back to Dashboard</a>
	</body>
</html>