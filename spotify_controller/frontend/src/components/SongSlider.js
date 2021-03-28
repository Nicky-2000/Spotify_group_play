import React from "react";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";

const useStyles = makeStyles({
  root: {
    width: 200,
  },
});

export default function SongSlider(props) {
  const classes = useStyles;
  var songProgress = (props.time / props.duration) * 100;
  const [handleChangeFlag, setFlag] = React.useState(false)
  const [value, setValue] = React.useState(songProgress);

  const handleChange = (event, value) => {
    setFlag(true);
    setValue(value);
  }

  const commitedChange = (event, newValue) => {
    console.log(`CHANGE COMMITTED ${value}`);
    const miliseconds = (value * props.duration) / 100;
    console.log(`ms: ${miliseconds}`);
    console.log(`Duration: ${props.duration}`)
    console.log(`Time: ${props.time}`)
    seekInSong(miliseconds);
    sleep(1000).then(() => {
      if (props.time >=miliseconds){
        setFlag(false)
      }else {
        sleep(1000);
        setFlag(false);
      }
    });
    

  };
  const sleep = (time) => {
    return new Promise((resolve)=>setTimeout(resolve,time));
  }

  const seekInSong = (miliseconds) => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/seek" + "?miliseconds=" + `${miliseconds}`, requestOptions)
  };
  
  return (
    
    <div className={classes.root}>
      <Slider value={handleChangeFlag ? value: props.progress} onChangeCommitted={commitedChange} onChange={handleChange}></Slider>
    </div>
  );
}
