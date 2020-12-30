// This is the page that you see when you are in a room

import React, { Component } from "react";

import { Grid, Button, Typography } from "@material-ui/core";
import SettingsTwoToneIcon from "@material-ui/icons/SettingsTwoTone";
import CreateRoomPage from "./CreateRoomPage";

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
      showSettings: false,
    };
    // Match stores the information about how we got to this page from the react router
    this.roomCode = this.props.match.params.roomCode;

    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSettings = this.updateShowSettings.bind(this);
    this.renderSettingsButton = this.renderSettingsButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.getRoomDetails = this.getRoomDetails.bind(this);

    // Gets the information and rerender the component since the state was changed
    this.getRoomDetails();
  }
  getRoomDetails() {
    fetch("/api/get~room" + "?code=" + this.roomCode)
      .then((response) => {
        if (!response.ok) {
          // make sure we do not enter a room that does not exist
          this.props.leaveRoomCallback();
          this.props.history.push("/");
        }
        return response.json();
      })
      .then((data) => {
        this.setState({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
      });
  }
  leaveButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/leave~room", requestOptions).then((_response) => {
      // Set state of hoompage roomcode so that we do not try to re enter room
      this.props.leaveRoomCallback();
      this.props.history.push("/");
    });
  }
  updateShowSettings(value) {
    this.setState({
      showSettings: value,
    });
  }
  renderSettings() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <CreateRoomPage
            update={true}
            votesToSkip={this.state.votesToSkip}
            guestCanPause={this.state.guestCanPause}
            roomCode={this.roomCode}
            updateCallback={this.getRoomDetails}
          ></CreateRoomPage>
        </Grid>
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => this.updateShowSettings(false)}
          >
            Close Settings
          </Button>
        </Grid>
      </Grid>
    );
  }
  // This is here so we can use logic to only render this button
  // if the user is a host
  renderSettingsButton() {
    return (
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          colour="primary"
          onClick={() => this.updateShowSettings(true)}
          startIcon={<SettingsTwoToneIcon />}
        >
          Settings
        </Button>
      </Grid>
    );
  }
  render() {
    if (this.state.showSettings) {
      return this.renderSettings();
    }
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography variant="h4" component={"h4"}>
            Code: {this.roomCode}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography variant="h6" component={"h6"}>
            Votes: {this.state.votesToSkip}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography variant="h6" component={"h6"}>
            Guests can pause: {this.state.guestCanPause.toString()}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography variant="h6" component={"h6"}>
            Host: {this.state.isHost.toString()}
          </Typography>
        </Grid>
        {/* Conditionally show the settings button if the user
        is the host */}
        {this.state.isHost ? this.renderSettingsButton() : null}
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
          >
            Leave Room
          </Button>
        </Grid>
      </Grid>
    );
  }
}