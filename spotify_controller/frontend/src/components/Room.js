// This is the page that you see when you are in a room

import React, { Component } from "react";

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
    };
    // Match stores the information about how we got to this page from the react router
    this.roomCode = this.props.match.params.roomCode;
    // Gets the information and rerender the component since the state was changed
    this.getRoomDetails();
  }
  getRoomDetails() {
    fetch("/api/get~room" + "?code=" + this.roomCode)
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
      });
  }
  render() {
    return (
      <div>
        <p>{this.roomCode}</p>
        <p>Votes: {this.state.votesToSkip}</p>
        <p>Guests can pause: {this.state.guestCanPause.toString()}</p>
        <p>Host: {this.state.isHost.toString()}</p>
      </div>
    );
  }
}
