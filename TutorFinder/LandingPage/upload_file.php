<?php
session_start();
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");
//$picSrc = "";

    $dir = "uploads";
    $fileType = $_FILES['userfile']['type'];
    $allowedType = array('jpg','jpeg','png');
    $tmp = explode('.',$_FILES['userfile']['name']);
    $fileExtension = strtolower(end($tmp));
    $file_to_upload = $dir."/".basename($_FILES['userfile']['name']);
    $picSrc = "images/defaultprofile.png";
    $query = "update client set picSrc = 'source' where email = 'user'";
    $query = str_replace("source",$file_to_upload, $query);
    $query = str_replace("user",$_SESSION['user'],$query);
    $result = mysqli_query($db->link, $query);

    if(!$result){
        die(sqli_error($db->link));
    }

    if(move_uploaded_file($_FILES['userfile']['tmp_name'],$file_to_upload) && in_array($fileExtension,$allowedType)) {
        echo "File is valid, and was successfully uploaded.";
        header('Location: dashboard.php');
    } else {
        echo "<script>alert('No picture selected!');</script>";
        $picSrc = "images/defaultprofile.png";
        echo "Cannot upload the file";
        echo "Here is some more debugging information: '";
        print_r($_FILES['userfile']['error']);
    }

