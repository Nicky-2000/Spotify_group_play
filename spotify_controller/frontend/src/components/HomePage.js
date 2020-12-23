import React, { Component } from "react";
// This is for react router which will be handled here
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
// These pages are going to be routed from here
import RoomJoinPage from "./RoomJoinPage";
import CreatRoomPage from "./CreatRoomPage";

export default class HomePage extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    // Switch is like a switch statement in C++ or Javascript
    // Routes are like the cases
    // need the "exact keyword because both /join and /create are techincally matches '/'"
    return (
      <Router>
        <Switch>
          <Route exact path="/">
            <p>This is the HomePage</p>
          </Route>
          <Route path="/join" component={RoomJoinPage} />
          <Route path="/create" component={CreatRoomPage} />
        </Switch>
      </Router>
    );
  }
}
