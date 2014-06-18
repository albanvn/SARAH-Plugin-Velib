/*************************
  SARAH-Plugin-Velib
  Author: Alban Vidal-Naquet
  Date: 18/06/2014
  Description:
    Velib Plugin for SARAH project (see http://encausse.wordpress.com/s-a-r-a-h/)
	
**************************/

/*****************************
  TODO LIST:
    -
******************************/

var g_debug=0;
var loc=require("./customloc.js").init(__dirname);
var bf=require("./basicfunctions.js");

const VELIBURL="https://api.jcdecaux.com/vls/v1/stations/";
const DEFAULTAPIKEY="d4de78823168d93174b45ec5911d2f682f2aac9e";

exports.init = function(SARAH)
{
	var config=SARAH.ConfigManager.getConfig();
	config=config.modules.Velib;
	
	url="https://api.jcdecaux.com/vls/v1/contracts?apiKey="+ DEFAULTAPIKEY;
	var request = require('request');
	request({ 'uri' : url }, 
			function (err, response, body)
			{
				var result = JSON.parse(body);
				for (var i in result)
					console.log("Ville connue:"+result[i].name);
			});

}

exports.release = function(SARAH)
{
   loc.release();
}

function sendVelibRequest(apiKey, city, station, parseResult, SARAH)
{
	var url=VELIBURL+station+"?apiKey="+apiKey+"&contract="+city;
  
	var request = require('request');
	request({ 'uri' : url }, 
			function (err, response, body)
			{
  				if (err || response.statusCode != 200) 
					SARAH.speak(loc.getLocalString("URLERROR"));
				else
				  parseResult(body, SARAH);
			});

}

function parseResultPark(content, SARAH)
{
	var result = JSON.parse(content);
	var text="";
	var name=result.name;
	var i=result.name.indexOf("-");
	if (i!=-1)
		name=result.name.substring(i+1);
	loc.addDictEntry("STATION_NAME", name);
	if (result.available_bike_stands>0)
	{
		loc.addDictEntry("NUMBER", result.available_bike_stands);
		text=loc.getLocalString("PARKLEFT");
	}
	else
		text=loc.getLocalString("NOPARKLEFT");	   
	SARAH.speak(text);
}

function parseResultGet(content, SARAH)
{
	var result = JSON.parse(content);
	var text="";
	var name=result.name;
	var i=result.name.indexOf("-");
	if (i!=-1)
		name=result.name.substring(i+1);
	loc.addDictEntry("STATION_NAME", name);
console.log(result);
	if (result.available_bikes>0)
	{
		loc.addDictEntry("NUMBER", result.available_bikes);
		text=loc.getLocalString("BIKELEFT");
	}
	else
		text=loc.getLocalString("NOBIKELEFT");	   
	SARAH.speak(text);
}

var action = function(data, callback, config, SARAH)
{
	var config=config.modules.Velib;
	if ((g_debug&2)!=0)
		console.log(data);
		
	var apiKey=DEFAULTAPIKEY;
	
	if (config.stations=="" || config.city=="")
	  SARAH.speak(loc.getLocalString("NOTCONFIGURED"));
	else
	{ 
		if (config.apiKey!="")
			apiKey=config.apiKey;

		var stations=config.stations.split(",");
		switch(data.type)
		{
			case "park":
				SARAH.speak(loc.getLocalString("OKLETSGO"));
				for (var i in stations)
				sendVelibRequest(apiKey, config.city, stations[i], parseResultPark, SARAH);
				break;
			case "get":
				SARAH.speak(loc.getLocalString("OKLETSGO"));
				for (var i in stations)
				sendVelibRequest(apiKey, config.city, stations[i], parseResultGet, SARAH);
				break;
			default:
				SARAH.speak(loc.getLocalString("UNKNOWCMD"));
				break;
		}
	}
	callback({'tts': ''});
	return 0;
}

exports.action=action;


