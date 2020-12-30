import React, { Component } from "react";
import { Grid, Button, ButtonGroup, Typography } from "@material-ui/core";
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
import CreateRoomPage from "./CreateRoomPage";
import Room from "./Room";

export default class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomCode: null,
    };
    this.clearRoomCode = this.clearRoomCode.bind(this);
  }
  //Life cycle method. Things that can be hooked into to alter the behaviour of a method
  // componentDidMount means the component just rendered for the first time
  // async keyword means that an asynchronous operation in the function
  // without async the entire method has to happen before anything else can happen
  // async tells the program that it doesnt need to wait for this to finish before it can execute other stuff

  async componentDidMount() {
    fetch("/api/is~user~in~room")
      .then((response) => response.json())
      .then((data) => {
        this.setState({ roomCode: data.code });
      });
  }
  renderHomePage() {
    return (
      <Grid container spaacing={3}>
        <Grid item xs={12} align="center">
          <Typography variant="h3" component="h3">
            Spotify Group Play
          </Typography>
        </Grid>

        <Grid item xs={12} align="center">
          <ButtonGroup disableElevation variant="contained" color="primary">
            <Button color="primary" to="/join" component={Link}>
              Join a Room
            </Button>
            <Button color="secondary" to="/create" component={Link}>
              Create a Room
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    );
  }

  clearRoomCode() {
    this.setState({ roomCode: null });
  }
  render() {
    // Switch is like a switch statement in C++ or Javascript
    // Routes are like the cases
    // need the "exact keyword because both /join and /create are techincally matches '/'"
    return (
      <Router>
        <Switch>
          <Route
            exact
            path="/"
            render={() => {
              return this.state.roomCode ? (
                <Redirect to={`/room/${this.state.roomCode}`} />
              ) : (
                this.renderHomePage()
              );
            }}
          />
          <Route path="/join" component={RoomJoinPage} />
          <Route path="/create" component={CreateRoomPage} />

          <Route
            path="/room/:roomCode"
            render={(props) => {
              return <Room {...props} leaveRoomCallback={this.clearRoomCode} />;
            }}
          />
        </Switch>
      </Router>
    );
  }
}
