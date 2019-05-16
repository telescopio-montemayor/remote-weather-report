import { Component, OnInit } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';

import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { Http } from '@angular/http';

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnInit{

  rootPage:any = HomePage;

  private path;
  private url;
  private serverUrl;
  private stompClient;
  sensors;
  readings;
  now = new Date();
  cloudConditions;
  rainConditions;
  brightnessConditions;
  windConditions;
  connection='Disconnect';
  
  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private http:Http) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  ngOnInit(): void {
    this.initialize();
    this.cloudConditions = localStorage.getItem('cloudConditions');
    this.rainConditions = localStorage.getItem('rainConditions');
    this.brightnessConditions = localStorage.getItem('brightnessConditions');
    this.windConditions = localStorage.getItem('windConditions');
    this.now = JSON.parse(localStorage.getItem('now'));
    this.sensors = JSON.parse(localStorage.getItem('sensors'));
    this.readings = JSON.parse(localStorage.getItem('readings'));
  }


  initialize(){
    /* this.path = localStorage.getItem('path')
    if (!this.path){
      var path = prompt("Controlar ruta del server", "http://192.168.0.10");
      if (path) {
          this.path = path;
          localStorage.setItem('path', path);
      }
    } */
    this.path = "http://163.10.87.226";
    this.url = this.path + ':8080/spring-boot-websockets';
    this.serverUrl = this.url + '/socket';
    this.initializeWebSocketConnection(this.serverUrl);
  }

  connectIndi(){
    this.http.get(this.url + '/connect-server').subscribe(
      success => {
        console.log('Connecting to indi server');
      },
      error =>  {
        console.log('Can not connect to indi server');
      });
  }

  connect(){
    this.http.get(this.url + '/connect-meteo').subscribe(
      success => {
        console.log('Connecting to meteorologic station');
      },
      error =>  {
        console.log('Can not connect to meteorologic station');
      });
  }

  disconnect(){
    this.http.get(this.url + '/disconnect-meteo').subscribe(
      success => {
        console.log('Connecting to meteorologic station');
      },
      error =>  {
        console.log('Can not disconnect to meteorologic station');
      }); 
  }

  initializeWebSocketConnection(serverUrl){
    let ws = new SockJS(serverUrl);
    this.stompClient = Stomp.over(ws);
    let that = this;
    this.stompClient.connect({}, function(frame) {
      that.stompClient.subscribe("/chat", (message) => {
        if(message.body) {
          let msjJson = JSON.parse(message.body);
          if (msjJson && msjJson.size === '8'){
            that.sensors = msjJson;
            localStorage.setItem('sensors', JSON.stringify(that.sensors));
            localStorage.setItem('now', JSON.stringify(that.now));
            if (that.sensors.value!='0') that.connection='Connect';
          };
          if (msjJson && msjJson.size === '11'){
            that.readings = msjJson;
            localStorage.setItem('readings', JSON.stringify(that.readings));
          };
          if (msjJson && msjJson.size === '1'){
            switch(msjJson.element){
              case 'cloudConditions':
                that.cloudConditions = msjJson.value;
                localStorage.setItem('cloudConditions', that.cloudConditions);
                break;
              case 'rainConditions':
                that.rainConditions = msjJson.value;
                localStorage.setItem('rainConditions', that.rainConditions);
                break;
              case 'brightnessConditions':
                that.brightnessConditions = msjJson.value;
                localStorage.setItem('brightnessConditions', that.brightnessConditions);
                break;
              case 'windConditions':
                that.windConditions = msjJson.value;
                localStorage.setItem('windConditions', that.windConditions);
                break;
              case 'CONNECTION':
                that.connection = msjJson.value;
                break;
              default:
                break;
            }
          }
          that.now = new Date();
        }
      });
    });
  }

}

