import { Injectable } from '@angular/core';
import { LoginFormComponent } from '../login-form/login-form.component';
import {ChatMessageDto} from "../models/chatMessageDto";
import {UserDto} from "../models/userDto";
import {ChatComponent} from "../chat/chat.component";

declare var SockJS: any

declare var Stomp: any;

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor() {
    this.initializeWebSocketConnection();
  }

  // @ts-ignore
  stompClient;

  chatMessages : ChatMessageDto[] = [];

  users: UserDto[] = [];

  userNames: string[] = [];

  userNamePairs: Map<string, string>[];


  initializeWebSocketConnection() {
    const serverUrl = 'http://localhost:8080/chat';
    console.log(serverUrl);
    const ws = new SockJS(serverUrl);
    this.stompClient = Stomp.over(ws);

    this.stompClient.connect({}, (frame:any) => {
      console.log(frame);


      this.stompClient.subscribe('/topic/users', (user: { body: any; }) => {
        if (user.body) {
          this.users = JSON.parse(user.body);
          console.log(this.users);
        }
      });

    });
  }

  sendMessage(message : ChatMessageDto) {
    this.stompClient.send('/app/send/message' , {}, JSON.stringify(message));
  }

  sendUser(user : UserDto) {
    this.stompClient.send('/app/send/user' , {}, JSON.stringify(user));
  }

  sendUsersChat(usersMap : string[]) {
    console.log(JSON.parse(JSON.stringify(usersMap)))
    this.stompClient.send('/app/send/chat' , {username: LoginFormComponent.userConnectionDto.name}, JSON.stringify(usersMap));
  }

  sendUsersChatAdmin(usersMap : string[]) {
    console.log(JSON.parse(JSON.stringify(usersMap)))
    this.stompClient.send('/app/send/chat/admin' , {username: LoginFormComponent.userConnectionDto.name}, JSON.stringify(usersMap));
  }

  subscribeMessages(){
      if(LoginFormComponent.userConnectionDto.name=="admin"){
        console.log(LoginFormComponent.userConnectionDto.name)
        this.stompClient.subscribe('/topic/message'+"-"+LoginFormComponent.userConnectionDto.name, (message: { body: any; }) => {
            this.chatMessages.push(JSON.parse(message.body));
            console.log("admin message")
        });
      }else{
        this.stompClient.subscribe('/topic/message'+"-"+LoginFormComponent.userConnectionDto.name, (message: { body: any; }) => {
        if (message.body && (ChatComponent.receiver.name == JSON.parse(message.body).user
          || LoginFormComponent.userConnectionDto.name == JSON.parse(message.body).user)) {
          this.chatMessages.push(JSON.parse(message.body));
        }
      });
  }}

  subscribeUsersChat(){
    this.stompClient.subscribe('/topic/chat'+"-"+LoginFormComponent.userConnectionDto.name, (chat: { body: any; },) => {
      if (chat.body) {
        this.chatMessages = JSON.parse(chat.body);
      }
    });
  }

  subscribeUsersAdmin(){
    this.stompClient.subscribe('/topic/users'+"-"+LoginFormComponent.userConnectionDto.name, (userChats: { body: any; },) => {
      if (userChats.body) {
        this.userNamePairs = JSON.parse(userChats.body);
      }
    });
  }

  /*sendDisconnected(user : UserDto){
    this.stompClient.send('/app/send/disconnected' , {}, JSON.stringify(user));
  }*/

}
