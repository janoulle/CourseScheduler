<?php
	require_once("Course.php");
	require_once("Section.php");
	require_once("Meeting.php");
	$csci = new Course("CSCI","1302");
	$mtg1 = new Meeting(12345, 'M', "0930A", "1045A");
	$csci1302 = new Section("Intro to Java", "CSCI","1302",12345,"Available",4.0,"Chris Plaue");
	$csci1302->addMeeting($mtg1);
	echo "Adding meeting to section: " . $mtg1->startTime . "\n";
	$csci->addSection($csci1302);
	echo "Adding section to course: " . $csci1302->coursePrefix . "\n";
	var_dump($csci);
	var_dump($mtg1);
	var_dump($csci1302);
?>
