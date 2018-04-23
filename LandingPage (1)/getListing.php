<?php 
session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: listing.php");
} else{
    include('connectMySQL.php');
    $db = new MySQLDatabase();
    $db->connect("root","","infs3202");
    $query = "select * from listing where email = \"useremail\"";
    $query = str_replace("useremail",$_SESSION['user'],$query);
    $result = mysqli_query($db->link,$query);

    if($result){
    	echo "<table border='1'>
            <tr>
                <th>Courses</th>
                <th>Rate</th>
                <th>Preferred Gender</th>
                <th>Campus</th>
                <th>Type</th>
                <th>No. Sessions</th>
                <th>Length</th>
                <th>Notes</th>
            </tr>";

        while($row = mysqli_fetch_array($result)) {
            echo "<tr>";
            echo "<td>".$row["courseID"]."</td>";
            echo "<td>".$row["rate"]."</td>";
            echo "<td>".$row["gender"]."</td>";
            echo "<td>".$row["campus"]."</td>";
            echo "<td>".$row["type"]."</td>";
            echo "<td>".$row["NoSessons"]."</td>";
            echo "<td>".$row["length"]."</td>";
            echo "<td>".$row["notes"]."</td>";
        }
    } else{
    	die(mysqli_error($db->link));
    }
}

$db->disconnect();
?>