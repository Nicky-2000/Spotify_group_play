import React, { Component } from "react";
import { render } from "react-dom";
import HomePage from "./HomePage";
import RoomJoinPage from "./RoomJoinPage";
import CreatRoomPage from "./CreatRoomPage";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // state of the component
      // when state updates this component rerenders
    };
  }
  render() {
    return (
      <div>
        <HomePage />
      </div>
    );
  }
}

var appDiv = document.getElementById("app");
render(<App name="nicky" />, appDiv);
