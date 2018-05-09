<?php
header('Content-Type: application/json');
session_start();
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");

if ($_SERVER["REQUEST_METHOD"] == "GET"){
	$srchTxt = $_GET['q'];
	//$query = "select * from (select C.email, C.FName, C.LName, L.courseID, L.campus, C.gender, C.user_type from client C, listing L where C.email=L.email) T";
	$query= "select * from client";
    $result = mysqli_query($db->link, $query);

    $course_list = array();


	if(!$result){
        	//header("Location: index.php");
        	//die(sqli_error($db->link));
		    //echo "failed";
    } else{
        while($row = mysqli_fetch_array($result)) {
            $course = $row['courseID'];
            $email = $row['email'];
            $fname = $row['FName'];
            $lname = $row['LName'];
            $name = $fname." ".$lname;
            $campus = $row['campus'];
            $gender = $row['gender'];
            $user_type = $row['user_type'];

            $query1 = "select * from listing where email = '".$email."'";
            $result1 = mysqli_query($db->link, $query1);

        }
        

        $srchResults = (object)array("srchTxt"=>$srchTxt, "fname"=>$fname_list, "lname"=>$lname_list,"name"=>$name_list, "gender"=>$gender_list, "campus"=>$campus_list, "user_type"=>$user_type_list, "course"=>$course_list);
        

        $srchJSON = json_encode($srchResults);
        /*$srchJSON = '{
            "srchTxt":'. '"'.$srchTxt.'",
            "fname": '.'"'.implode(',',$fname_list).'",
            "lname": '.'"'.implode(',',$lname_list).'",
            "name": '.'"'.implode(',',$name_list).'",
            "gender": '.'"'.implode(',',$gender_list).'",
            "campus": '.'"'.implode(',',$campus_list).'",
            "user_type": '.'"'.implode(',',$user_type_list).'",
            "course": '.'"'.implode(',',$course_list).'""
        }';*/


        echo $srchJSON;
    }
}


$db->disconnect();



//header("Location: search.php?q=".$_SESSION['user']);
