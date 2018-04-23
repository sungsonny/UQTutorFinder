<?php 
class MySQLDatabase{
	public $link = null;

	function connect($user, $password, $database){
		$this->link = mysqli_connect('localhost', $user, $password);
		if(!$this->link){
			die("not Connected: ".mysqli_connect_error());
		}
		$db = mysqli_select_db($this->link, $database);
		if(!$db){
			die("Canoot use: ".$database);
		}
		return $this->link;
	}

	function disconnect(){
		mysqli_close($this->link);
	}
}
?>