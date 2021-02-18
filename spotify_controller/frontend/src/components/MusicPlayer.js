import React, { Component } from "react";
import {
  Grid,
  Typography,
  Card,
  IconButton,
  LinearProgress,
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import { red, blue, green } from "@material-ui/core/colors";

export default class MusicPlayer extends Component {
  constructor(props) {
    super(props);
    this.getButtonColor = this.getButtonColor.bind(this);
    this.colourOfCounter = this.colourOfCounter.bind(this);
  }
  colourOfCounter(back) {
    var decimal = 0;
    if (back) {
      decimal = this.props.votes_back / this.props.votes_required;
    } else {
      decimal = this.props.votes / this.props.votes_required;
    }

    if (decimal < 0.25) {
      return green[100];
    } else if (decimal < 0.5) {
      return green[500];
    } else if (decimal < 0.75) {
      return green["A700"];
    }
    return green["A200"];
  }

  skipToPreviousSong() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/skip-to-previous-song", requestOptions);
  }

  skipSong() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/skip-song", requestOptions);
  }
  pauseSong() {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/pause-song", requestOptions);
  }
  playSong() {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/play-song", requestOptions);
  }
  getButtonColor() {
    if (this.props.isHost) {
      return "secondary";
    } else {
      return this.props.guestCanPause ? "secondary" : "disabled";
    }
  }

  render() {
    // need a value out of 100(percentage) for the linear progress of the song
    const songProgress = (this.props.time / this.props.duration) * 100;
    return (
      <Card>
        <Grid container alignItems="center">
          <Grid item align="center" xs={4}>
            <img src={this.props.image_url} height="100%" width="100%" />
          </Grid>
          <Grid item align="center" xs={8}>
            <Typography component="h5" variant="h5">
              {this.props.title}
            </Typography>
            <Typography color="textSecondary" variant="subtitle1">
              {this.props.artist}
            </Typography>
            <div>
              <IconButton onClick={() => this.skipToPreviousSong()}>
                <Typography
                  style={{
                    color: this.colourOfCounter(true),
                  }}
                  variant="subtitle1"
                >
                  {this.props.votes_back} / {this.props.votes_required}
                </Typography>
                <SkipPreviousIcon color={this.getButtonColor()} />
              </IconButton>
              <IconButton
                onClick={() => {
                  this.props.is_playing ? this.pauseSong() : this.playSong();
                }}
              >
                {this.props.is_playing ? (
                  <PauseIcon color={this.getButtonColor()} />
                ) : (
                  <PlayArrowIcon color={this.getButtonColor()} />
                )}
              </IconButton>
              <IconButton onClick={() => this.skipSong()}>
                <SkipNextIcon color={this.getButtonColor()} />
                <Typography
                  style={{
                    color: this.colourOfCounter(false),
                  }}
                  variant="subtitle1"
                >
                  {this.props.votes} / {this.props.votes_required}
                </Typography>
              </IconButton>
            </div>
          </Grid>
        </Grid>
        <LinearProgress variant="determinate" value={songProgress} />
      </Card>
    );
  }
}
