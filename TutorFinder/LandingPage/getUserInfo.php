<?php 
session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: index.php");
} else {
    include('connectMySQL.php');
    $db = new MySQLDatabase();
    $db->connect("root","","infs3202");
    $query = "select * from client where email = \"useremail\"";
    $query = str_replace("useremail",$_SESSION['user'],$query);
    $result = mysqli_query($db->link,$query);
    $courses = array();

    if($result){

        $query1 = "select courseID from listing where email = 'useremail'";
        $query1 = str_replace("useremail",$_SESSION['user'],$query1);
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
        $user = $row['email'];
    	$fname = $row['FName'];
    	$lname = $row["LName"];
    	$program = $row['program'];
        $picSrc = $row['picSrc'];
        $bio = $row['biography'];
        $gender = $row['gender'];
        $campus = $row['campus'];
        $user_type = $row['user_type'];

        $user = (object)array("user"=>$user, "fname"=>$fname, "lname"=>$lname,"name"=>$fname." ".$lname, "program"=>$program, "picSrc"=>$picSrc, "bio"=>$bio, "gender"=>$gender, "campus"=>$campus, "user_type"=>$user_type, "courses"=>$courses);

        $userJSON = json_encode($user);

        echo $userJSON;
    } else{
    	die(mysqli_error($db->link));
    }

}

$db->disconnect();
