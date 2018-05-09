<?php 
$digits = range(0,9);
$rand_digits = array_rand($digits, 5);
shuffle($rand_digits);
$veriCode = "";
for($i=0; $i<5; $i++){
	$veriCode .= $rand_digits[$i];
}
echo $veriCode;
session_start();
$_SESSION['veriCode'] = $veriCode;
?>