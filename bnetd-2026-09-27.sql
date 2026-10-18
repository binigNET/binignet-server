-- MySQL dump 10.13  Distrib 5.7.35, for Linux (x86_64)
--
-- Host: localhost    Database: bnetd
-- ------------------------------------------------------
-- Server version	5.7.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `pvpgn_BNET`
--

DROP TABLE IF EXISTS `pvpgn_BNET`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_BNET` (
  `uid` int(11) NOT NULL DEFAULT '0',
  `acct_username` varchar(32) DEFAULT NULL,
  `username` varchar(32) DEFAULT NULL,
  `acct_userid` int(11) DEFAULT NULL,
  `acct_passhash1` varchar(40) DEFAULT NULL,
  `acct_email` varchar(128) DEFAULT NULL,
  `acct_email_verified` varchar(6) DEFAULT 'false',
  `auth_admin` varchar(6) DEFAULT 'false',
  `auth_normallogin` varchar(6) DEFAULT 'true',
  `auth_changepass` varchar(6) DEFAULT 'true',
  `auth_changeprofile` varchar(6) DEFAULT 'true',
  `auth_botlogin` varchar(6) DEFAULT 'false',
  `auth_operator` varchar(6) DEFAULT 'false',
  `new_at_team_flag` int(11) DEFAULT '0',
  `auth_lock` varchar(6) DEFAULT 'false',
  `auth_locktime` int(11) DEFAULT '0',
  `auth_lockreason` varchar(128) DEFAULT NULL,
  `auth_mute` varchar(6) DEFAULT 'false',
  `auth_mutetime` int(11) DEFAULT '0',
  `auth_mutereason` varchar(128) DEFAULT NULL,
  `auth_command_groups` varchar(16) DEFAULT '1',
  `acct_lastlogin_time` int(11) DEFAULT '0',
  `acct_lastlogin_owner` varchar(128) DEFAULT NULL,
  `acct_lastlogin_clienttag` varchar(4) DEFAULT NULL,
  `acct_lastlogin_ip` varchar(16) DEFAULT NULL,
  `acct_ctime` varchar(128) DEFAULT NULL,
  `acct_verifier` varchar(128) DEFAULT NULL,
  `acct_salt` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `username2` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_BNET`
--

LOCK TABLES `pvpgn_BNET` WRITE;
/*!40000 ALTER TABLE `pvpgn_BNET` DISABLE KEYS */;
INSERT INTO `pvpgn_BNET` VALUES (0,NULL,NULL,NULL,NULL,NULL,'false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',0,NULL,NULL,NULL,NULL,NULL,NULL),(1,'yes','yes',1,'0664ecf7fc68f66ea02723e9b4e213a39e2d544a','y@e.s','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1790255983,'shinhwa','W3XP','138.84.110.247','1786349860','C2 52 6E 62 AF FF 17 5E E7 E5 C3 96 90 78 0C 2C 2A 9D 8C 2B 67 25 D9 25 42 01 E7 BE 49 35 84 9C ','5E B3 13 28 D2 20 D0 5B 33 C8 F0 E5 8A 54 30 9C 60 1B F6 D1 0B 75 2F 26 72 72 3A 8E 5A 07 13 93 '),(2,'binignet_bot','binignet_bot',2,'ad7205beab4902ee8442500d3f402c8d10108e02','b@g.n','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1786349944,'GHost','W3XP','172.19.0.5','1786349925','F8 43 3B FE 08 AA 4A 0B 9F 0F 6A E9 86 1A 05 C5 F0 65 CB B5 EC 3B 49 3B B4 FA EA C3 A0 86 CE 27 ','23 AF C5 08 51 C1 BD 65 B2 39 4F B6 97 E1 EE 66 C4 F7 67 33 B7 92 EC AF 01 7F 47 67 46 25 CD 75 '),(3,'busing','busing',3,'428891933fca67b26c5e8df2b1949b9df6758fab','busing@gmail.com','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1790255975,'pooch','W3XP','138.84.113.87','1786452117','85 B1 F3 DC 79 D2 17 AF E4 01 72 37 A2 3B BE 8D 09 B2 94 A8 C1 38 F0 AF A2 68 64 E7 49 EC 69 F8 ','83 BF E9 E5 80 0F 85 5A BA BC 7F 9E 6E AB 2E CA 11 42 90 10 E4 53 65 05 7D 30 11 FC 84 01 E1 3E '),(4,'tawtaw','tawtaw',4,'7b1720d76076b8661e8cbdbbed79049d22ab1d89','test@mail.com','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1787320318,'shinhwa','W3XP','180.191.150.107','1786452731','55 9F 91 E2 49 5D F0 F9 A9 40 E5 47 85 BB EE 06 93 9B BA 69 84 86 1C 5C 8C 10 35 7B 61 66 CB A6 ','A4 9F 64 C7 23 8D E5 35 F5 E5 74 A0 97 31 32 21 F3 06 03 97 2C 7E 1A DB 30 10 41 6B 31 C5 04 50 '),(5,'Respect','respect',5,'428891933fca67b26c5e8df2b1949b9df6758fab','rylleanuber@umindanao.edu.ph','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1790255971,'shinhwa','W3XP','138.84.113.174','1786452754','F8 AC 72 94 9B CE 1D 04 A1 CC 70 FD 3E 5D D6 5F 94 50 30 34 38 6F A0 FA 60 59 46 AA 0C 20 1A A5 ','27 FC 3F 77 A8 64 A7 C0 2E 73 8F CF D7 AF 5A 17 FB A6 8E 6A 15 86 F0 DC D8 AF 0D 6C 94 68 62 35 '),(6,'six','six',6,'428891933fca67b26c5e8df2b1949b9df6758fab','sfakasf@gmail.com','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1788685770,'shinhwa','W3XP','119.92.114.186','1786453430','83 AB 17 79 90 0F AD F8 68 6A E7 2D 9E 5F A1 6B 83 27 9D FD E7 B4 A6 B4 A8 EE AA 08 AD 9F 87 36 ','A9 EB 1A 94 5F 8C F1 3E 89 7E 87 93 60 44 3F DD 93 54 23 D4 B5 80 B7 AE 46 4A F1 B4 69 E0 0F 69 '),(7,'kneegrow','kneegrow',7,'6ebf6496a9b17983b2dc1f89842425310c2d0e52','gruntingspace15@gmail.com','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1790251833,'shinhwa','W3XP','138.84.108.88','1786457518','74 F0 7C 47 59 A9 5A 60 9E 0B 7B 21 15 92 75 C8 86 2D 60 B9 ED 2F 89 EE 40 63 EC 26 55 E6 ED 00 ','FA EB 34 22 E0 E9 C7 78 2E 72 2C 96 47 3F 2B B8 8B 6D 12 6B 7B 8F B7 28 F2 37 13 26 35 05 30 91 '),(8,'FreeFrancisJay','freefrancisjay',8,'428891933fca67b26c5e8df2b1949b9df6758fab','vallar@gmail.com','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1789301508,'shinhwa','W3XP','64.226.56.92','1786971812','CB F1 9A 14 D2 6C 5A EC 29 A8 65 58 87 57 16 84 EF 46 74 3E 2E 45 32 52 5C F9 2A 7E 54 A3 73 D9 ','BF 38 A0 C6 A0 8A F5 37 25 AE 9A 24 A0 A0 5D D8 02 96 BA FA A3 0D C3 A5 C2 61 38 40 F1 74 44 97 '),(9,'Chief_Bigman','chief_bigman',9,'8c54b648a3354790514f102528b3ed4b10d5afa5','chief_bigman@gmail.com','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1787492682,'shinhwa','W3XP','60.139.146.204','1787426840','0F A5 C9 E9 BB 67 88 0C 69 1F 0F B4 99 05 FC CD 6C 7E AE AF 8F 61 BC 4C A7 AD DD F8 F5 27 61 E6 ','DE AF DD 82 39 1A D8 9A D1 D5 E0 DC BE C4 DC 70 54 19 41 DF 5A 72 FB 73 B3 0E 38 4A E6 FF AA 40 '),(10,'hekhok','hekhok',10,'32ca0c40cb0f719794d628dc318d6a4662e87a4a','okaynawajapan@gmail.com','false','false','true','true','true','false','false',0,'false',0,NULL,'false',0,NULL,'1',1787494131,'shinhwa','W3XP','138.84.108.241','1787438820','87 9E A7 D9 3D 2D 0B 0C FE 05 4B 83 CE 03 3A 70 D5 77 74 C2 C2 62 61 8C 1B DC B9 BB 6C B9 52 C9 ','86 A9 17 F2 67 6B 42 53 15 D0 26 19 A2 41 11 F7 9E 6B 36 DB F2 D1 77 68 58 2F 08 FC 3B B9 0E B0 ');
/*!40000 ALTER TABLE `pvpgn_BNET` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_Record`
--

DROP TABLE IF EXISTS `pvpgn_Record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_Record` (
  `uid` int(11) NOT NULL DEFAULT '0',
  `WAR3_solo_xp` int(11) DEFAULT '0',
  `WAR3_solo_level` int(11) DEFAULT '0',
  `WAR3_solo_wins` int(11) DEFAULT '0',
  `WAR3_solo_rank` int(11) DEFAULT '0',
  `WAR3_solo_losses` int(11) DEFAULT '0',
  `WAR3_team_xp` int(11) DEFAULT '0',
  `WAR3_team_level` int(11) DEFAULT '0',
  `WAR3_team_rank` int(11) DEFAULT '0',
  `WAR3_team_wins` int(11) DEFAULT '0',
  `WAR3_team_losses` int(11) DEFAULT '0',
  `WAR3_ffa_xp` int(11) DEFAULT '0',
  `WAR3_ffa_rank` int(11) DEFAULT '0',
  `WAR3_ffa_level` int(11) DEFAULT '0',
  `WAR3_ffa_wins` int(11) DEFAULT '0',
  `WAR3_ffa_losses` int(11) DEFAULT '0',
  `WAR3_orcs_wins` int(11) DEFAULT '0',
  `WAR3_orcs_losses` int(11) DEFAULT '0',
  `WAR3_humans_wins` int(11) DEFAULT '0',
  `WAR3_humans_losses` int(11) DEFAULT '0',
  `WAR3_undead_wins` int(11) DEFAULT '0',
  `WAR3_undead_losses` int(11) DEFAULT '0',
  `WAR3_nightelves_wins` int(11) DEFAULT '0',
  `WAR3_nightelves_losses` int(11) DEFAULT '0',
  `WAR3_random_wins` int(11) DEFAULT '0',
  `WAR3_random_losses` int(11) DEFAULT '0',
  `WAR3_teamcount` int(11) DEFAULT '0',
  `W3XP_solo_xp` int(11) DEFAULT '0',
  `W3XP_solo_level` int(11) DEFAULT '0',
  `W3XP_solo_wins` int(11) DEFAULT '0',
  `W3XP_solo_rank` int(11) DEFAULT '0',
  `W3XP_solo_losses` int(11) DEFAULT '0',
  `W3XP_team_xp` int(11) DEFAULT '0',
  `W3XP_team_level` int(11) DEFAULT '0',
  `W3XP_team_rank` int(11) DEFAULT '0',
  `W3XP_team_wins` int(11) DEFAULT '0',
  `W3XP_team_losses` int(11) DEFAULT '0',
  `W3XP_ffa_xp` int(11) DEFAULT '0',
  `W3XP_ffa_rank` int(11) DEFAULT '0',
  `W3XP_ffa_level` int(11) DEFAULT '0',
  `W3XP_ffa_wins` int(11) DEFAULT '0',
  `W3XP_ffa_losses` int(11) DEFAULT '0',
  `W3XP_orcs_wins` int(11) DEFAULT '0',
  `W3XP_orcs_losses` int(11) DEFAULT '0',
  `W3XP_humans_wins` int(11) DEFAULT '0',
  `W3XP_humans_losses` int(11) DEFAULT '0',
  `W3XP_undead_wins` int(11) DEFAULT '0',
  `W3XP_undead_losses` int(11) DEFAULT '0',
  `W3XP_nightelves_wins` int(11) DEFAULT '0',
  `W3XP_nightelves_losses` int(11) DEFAULT '0',
  `W3XP_random_wins` int(11) DEFAULT '0',
  `W3XP_random_losses` int(11) DEFAULT '0',
  `W3XP_teamcount` int(11) DEFAULT '0',
  `W3XP_userselected_icon` varchar(4) DEFAULT NULL,
  `W3XP_iconstash` varchar(1024) DEFAULT NULL,
  `STAR_0_wins` int(11) DEFAULT '0',
  `STAR_0_losses` int(11) DEFAULT '0',
  `STAR_0_disconnects` int(11) DEFAULT '0',
  `STAR_1_wins` int(11) DEFAULT '0',
  `STAR_1_losses` int(11) DEFAULT '0',
  `STAR_1_disconnects` int(11) DEFAULT '0',
  `STAR_0_last_game` int(11) DEFAULT '0',
  `STAR_0_last_game_result` varchar(128) DEFAULT NULL,
  `STAR_1_last_game` int(11) DEFAULT '0',
  `STAR_1_last_game_result` varchar(128) DEFAULT NULL,
  `STAR_1_rating` int(11) DEFAULT '0',
  `STAR_1_high_rating` int(11) DEFAULT '0',
  `STAR_1_rank` int(11) DEFAULT '0',
  `STAR_1_high_rank` int(11) DEFAULT '0',
  `SEXP_0_wins` int(11) DEFAULT '0',
  `SEXP_0_losses` int(11) DEFAULT '0',
  `SEXP_0_disconnects` int(11) DEFAULT '0',
  `SEXP_1_wins` int(11) DEFAULT '0',
  `SEXP_1_losses` int(11) DEFAULT '0',
  `SEXP_1_disconnects` int(11) DEFAULT '0',
  `SEXP_0_last_game` int(11) DEFAULT '0',
  `SEXP_0_last_game_result` varchar(128) DEFAULT NULL,
  `SEXP_1_last_game` int(11) DEFAULT '0',
  `SEXP_1_last_game_result` varchar(128) DEFAULT NULL,
  `SEXP_1_rating` int(11) DEFAULT '0',
  `SEXP_1_high_rating` int(11) DEFAULT '0',
  `SEXP_1_rank` int(11) DEFAULT '0',
  `SEXP_1_high_rank` int(11) DEFAULT '0',
  `SEXP_userselected_icon` varchar(4) DEFAULT NULL,
  `SEXP_iconstash` varchar(1024) DEFAULT NULL,
  `TSUN_solo_rank` int(11) DEFAULT '0',
  `TSUN_solo_points` int(11) DEFAULT '0',
  `TSUN_solo_wins` int(11) DEFAULT '0',
  `TSUN_solo_losses` int(11) DEFAULT '0',
  `TSUN_solo_disconnects` int(11) DEFAULT '0',
  `TSXP_solo_rank` int(11) DEFAULT '0',
  `TSXP_solo_points` int(11) DEFAULT '0',
  `TSXP_solo_wins` int(11) DEFAULT '0',
  `TSXP_solo_losses` int(11) DEFAULT '0',
  `TSXP_solo_disconnects` int(11) DEFAULT '0',
  `RAL2_solo_rank` int(11) DEFAULT '0',
  `RAL2_solo_points` int(11) DEFAULT '0',
  `RAL2_solo_wins` int(11) DEFAULT '0',
  `RAL2_solo_losses` int(11) DEFAULT '0',
  `RAL2_solo_disconnects` int(11) DEFAULT '0',
  `YURI_solo_rank` int(11) DEFAULT '0',
  `YURI_solo_points` int(11) DEFAULT '0',
  `YURI_solo_wins` int(11) DEFAULT '0',
  `YURI_solo_losses` int(11) DEFAULT '0',
  `YURI_solo_disconnects` int(11) DEFAULT '0',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_Record`
--

LOCK TABLES `pvpgn_Record` WRITE;
/*!40000 ALTER TABLE `pvpgn_Record` DISABLE KEYS */;
INSERT INTO `pvpgn_Record` VALUES (0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),(10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,0,0,0,0,0,0,0,NULL,0,NULL,0,0,0,0,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
/*!40000 ALTER TABLE `pvpgn_Record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_WOL`
--

DROP TABLE IF EXISTS `pvpgn_WOL`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_WOL` (
  `uid` int(11) NOT NULL DEFAULT '0',
  `auth_apgar` varchar(8) DEFAULT NULL,
  `acct_locale` int(11) DEFAULT '0',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_WOL`
--

LOCK TABLES `pvpgn_WOL` WRITE;
/*!40000 ALTER TABLE `pvpgn_WOL` DISABLE KEYS */;
INSERT INTO `pvpgn_WOL` VALUES (0,NULL,0);
/*!40000 ALTER TABLE `pvpgn_WOL` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_arrangedteam`
--

DROP TABLE IF EXISTS `pvpgn_arrangedteam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_arrangedteam` (
  `teamid` int(11) NOT NULL DEFAULT '0',
  `size` int(11) DEFAULT '0',
  `clienttag` varchar(8) DEFAULT NULL,
  `lastgame` int(11) DEFAULT '0',
  `member1` int(11) DEFAULT '0',
  `member2` int(11) DEFAULT '0',
  `member3` int(11) DEFAULT '0',
  `member4` int(11) DEFAULT '0',
  `wins` int(11) DEFAULT '0',
  `losses` int(11) DEFAULT '0',
  `xp` int(11) DEFAULT '0',
  `level` int(11) DEFAULT '0',
  `rank` int(11) DEFAULT '0',
  PRIMARY KEY (`teamid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_arrangedteam`
--

LOCK TABLES `pvpgn_arrangedteam` WRITE;
/*!40000 ALTER TABLE `pvpgn_arrangedteam` DISABLE KEYS */;
INSERT INTO `pvpgn_arrangedteam` VALUES (0,0,NULL,0,0,0,0,0,0,0,0,0,0);
/*!40000 ALTER TABLE `pvpgn_arrangedteam` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_clan`
--

DROP TABLE IF EXISTS `pvpgn_clan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_clan` (
  `cid` int(11) NOT NULL DEFAULT '0',
  `short` int(11) DEFAULT '0',
  `name` varchar(32) DEFAULT NULL,
  `motd` varchar(255) DEFAULT NULL,
  `creation_time` int(11) DEFAULT '0',
  PRIMARY KEY (`cid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_clan`
--

LOCK TABLES `pvpgn_clan` WRITE;
/*!40000 ALTER TABLE `pvpgn_clan` DISABLE KEYS */;
INSERT INTO `pvpgn_clan` VALUES (0,0,NULL,NULL,0);
/*!40000 ALTER TABLE `pvpgn_clan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_clanmember`
--

DROP TABLE IF EXISTS `pvpgn_clanmember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_clanmember` (
  `uid` int(11) NOT NULL DEFAULT '0',
  `cid` int(11) DEFAULT '0',
  `status` int(11) DEFAULT '0',
  `join_time` int(11) DEFAULT '0',
  PRIMARY KEY (`uid`),
  KEY `cid` (`cid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_clanmember`
--

LOCK TABLES `pvpgn_clanmember` WRITE;
/*!40000 ALTER TABLE `pvpgn_clanmember` DISABLE KEYS */;
INSERT INTO `pvpgn_clanmember` VALUES (0,0,0,0);
/*!40000 ALTER TABLE `pvpgn_clanmember` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_emailverification`
--

DROP TABLE IF EXISTS `pvpgn_emailverification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_emailverification` (
  `uid` int(11) NOT NULL DEFAULT '0',
  `code` varchar(64) DEFAULT NULL,
  `expiration` int(11) DEFAULT '0',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_emailverification`
--

LOCK TABLES `pvpgn_emailverification` WRITE;
/*!40000 ALTER TABLE `pvpgn_emailverification` DISABLE KEYS */;
INSERT INTO `pvpgn_emailverification` VALUES (0,NULL,0);
/*!40000 ALTER TABLE `pvpgn_emailverification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_friend`
--

DROP TABLE IF EXISTS `pvpgn_friend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_friend` (
  `uid` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_friend`
--

LOCK TABLES `pvpgn_friend` WRITE;
/*!40000 ALTER TABLE `pvpgn_friend` DISABLE KEYS */;
INSERT INTO `pvpgn_friend` VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10);
/*!40000 ALTER TABLE `pvpgn_friend` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pvpgn_profile`
--

DROP TABLE IF EXISTS `pvpgn_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pvpgn_profile` (
  `uid` int(11) NOT NULL DEFAULT '0',
  `sex` varchar(8) DEFAULT NULL,
  `location` varchar(128) DEFAULT NULL,
  `description` varchar(256) DEFAULT NULL,
  `age` varchar(16) DEFAULT NULL,
  `clanname` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pvpgn_profile`
--

LOCK TABLES `pvpgn_profile` WRITE;
/*!40000 ALTER TABLE `pvpgn_profile` DISABLE KEYS */;
INSERT INTO `pvpgn_profile` VALUES (0,NULL,NULL,NULL,NULL,NULL),(1,NULL,NULL,NULL,NULL,NULL),(2,NULL,NULL,NULL,NULL,NULL),(3,NULL,NULL,NULL,NULL,NULL),(4,NULL,NULL,NULL,NULL,NULL),(5,NULL,NULL,NULL,NULL,NULL),(6,NULL,NULL,NULL,NULL,NULL),(7,NULL,NULL,NULL,NULL,NULL),(8,NULL,NULL,NULL,NULL,NULL),(9,NULL,NULL,NULL,NULL,NULL),(10,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `pvpgn_profile` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-27  4:46:13
