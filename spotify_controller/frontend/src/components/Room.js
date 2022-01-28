// This is the page that you see when you are in a room

import React, { Component } from "react";

import { Grid, Button, Typography } from "@material-ui/core";
import SettingsTwoToneIcon from "@material-ui/icons/SettingsTwoTone";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";
//import SearchBar from "./SearchBar";

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
      showSettings: false,
      spotifyAuthenticated: false,
      song: {},
      time: 0,
      volume: 0,
      isContent: false,
    };
    // Match stores the information about how we got to this page from the react router
    this.roomCode = this.props.match.params.roomCode;

    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSettings = this.updateShowSettings.bind(this);
    this.renderSettingsButton = this.renderSettingsButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.authenticateSpotify = this.authenticateSpotify.bind(this);
    this.getRoomDetails = this.getRoomDetails.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.getCurrentPlaybackState = this.getCurrentPlaybackState.bind(this);
    this.getInfo = this.getInfo.bind(this);
    this.renderMusicPlayer = this.renderMusicPlayer.bind(this);
    // Gets the information and rerender the component since the state was changed
    this.getRoomDetails();
  }
  componentDidMount() {
    // this calls the getCurrentSong function every 1000 ms
    // this is the polling technique (websockets are bettteerrr.. but dont know how to use yet)
    this.interval = setInterval(this.getInfo, 1000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
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
        if (this.state.isHost) {
          this.authenticateSpotify();
        }
      });
  }
  authenticateSpotify() {
    // send request to back end to verify if the host is authenticated
    fetch("/spotify/is-authenticated")
      .then((response) => response.json())
      .then((data) => {
        this.setState({ spotifyAuthenticated: data.status });
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((response) => response.json())
            .then((data) => {
              //redirects us to the spotify authentication page
              window.location.replace(data.url);
            });
        }
      });
  }

  getInfo() {
    this.getCurrentPlaybackState()
    this.getCurrentSong()
  }

  getCurrentSong() {
    fetch("/spotify/current-song")
      .then((response) => {
        if (response.status == 204) {
          this.setState({isContent: false})
          return null;
        } else {
            this.setState({isContent: true})
          return response.json();
        }
      })
      .then((data) => {
        if (data != null){
          //console.log(data)
        this.setState({ song: data, time: data.time});
        }
      });
  }

  getCurrentPlaybackState() {
    // this is so we do not call the api when
    // we know we would get an error because no song is playing
    // if (this.state.isContent){
    //   return null 
    // }
    fetch("/spotify/playback-state")
    .then((response) => {
      if (response.status == 200) {
        return response.json();
      }
    })
    .then((data) => {
      if (data != null){
        this.setState({volume: data.current_volume})
      }
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

  renderMusicPlayer(){
    if (this.state.isContent){
      return <MusicPlayer {...this.state.song} {...this.state} />
    }
    else{
      return(
        <Grid item xs={12} align="center">
          <Typography>
            Play a song on your spotify account.
          </Typography>
          </Grid >
      )
    }
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
        {this.renderMusicPlayer()}
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
