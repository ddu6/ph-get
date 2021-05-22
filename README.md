# PKU Holes Getter
- Require mysql8, nodejs. 

## Prepare
```
sudo mysql
```
```sql
CREATE DATABASE `ph`;
```
```sql
USE `ph`;
```
```sql
CREATE TABLE `holes` (
  `cid` bigint unsigned NOT NULL DEFAULT '0',
  `etimestamp` bigint unsigned NOT NULL,
  `fulltext` mediumtext NOT NULL,
  `hidden` tinyint NOT NULL DEFAULT '0',
  `likenum` int NOT NULL DEFAULT '0',
  `pid` int unsigned NOT NULL,
  `reply` int unsigned NOT NULL DEFAULT '0',
  `span` bigint unsigned NOT NULL DEFAULT '0',
  `tag` varchar(100) NOT NULL DEFAULT '',
  `text` mediumtext NOT NULL,
  `timestamp` bigint unsigned NOT NULL,
  `type` varchar(10) NOT NULL DEFAULT 'text',
  `url` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`pid`),
  KEY `heat` (`reply`,`likenum`),
  KEY `liveness` (`etimestamp`,`cid`),
  KEY `span` (`span`),
  KEY `theat` (`timestamp`,`reply`,`likenum`),
  KEY `timestamp` (`timestamp`),
  KEY `tliveness` (`timestamp`,`etimestamp`,`cid`),
  KEY `tspan` (`timestamp`,`span`),
  FULLTEXT KEY `fulltext` (`fulltext`) /*!50100 WITH PARSER `ngram` */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```
```sql
CREATE TABLE `comments` (
  `cid` int unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `pid` int unsigned NOT NULL,
  `tag` varchar(100) NOT NULL DEFAULT '',
  `text` mediumtext NOT NULL,
  `timestamp` bigint unsigned NOT NULL,
  PRIMARY KEY (`cid`),
  KEY `pid` (`pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```
```sql
CREATE TABLE `oldComments` (
  `cid` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `pid` int unsigned NOT NULL,
  `tag` varchar(100) NOT NULL DEFAULT '',
  `text` mediumtext NOT NULL,
  `timestamp` bigint unsigned NOT NULL,
  PRIMARY KEY (`cid`),
  KEY `pid` (`pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```
```sql
exit
```

## Install
```
git clone https://github.com/ddu6/ph-get.git
```
```
cd ph-get
```
```
npm install
```
```
npm run init
```
```
sudo -s
```
```
cp /var/lib/mysql/*.pem secrets/mysql/
```
```
chmod 777 secrets/mysql/*
```
```
exit
```
Fill in `config.json`. 

## Start
```
nohup npm run start &
```
