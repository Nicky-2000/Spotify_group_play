import React from "react";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { useEffect } from 'react';
//import VolumeDown from '@mui/icons-material/VolumeDown';
//import VolumeUp from '@mui/icons-material/VolumeUp';

const useStyles = makeStyles({
  root: {
    width: 20,
  },
});

export default function VolumeSlider(props) {
  const classes = useStyles;
  const [handleChangeFlag, setFlag] = React.useState(false)
  const [value, setValue] = React.useState();

  const handleChange = (event, value) => {
    setFlag(true);
    setValue(value);
  }

  const commitedChange = (event, newValue) => {
    setValue(newValue);
    changeVolume(newValue);
    setTimeout(setFlag(false), 3000)
    // setFlag(false);
    // sleep(1000).then(() => {
    //   if (props.volume == newValue){
    //     console.log("here")
    //     setFlag(false)
    //   }else {
    //     sleep(1000);
    //     console.log(props.volume)
    //     console.log(value)
    //     setFlag(false);
    //   }
    // });

    };

  const sleep = (time) => {
    return new Promise((resolve)=>setTimeout(resolve,time));
  }

  // calls api to change the volue
  const changeVolume = (volume) => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/change-volume" + "?volume=" + `${volume}`, requestOptions)
  };

  return (
    
    <div className={classes.root}>
      <Slider aria-label="Volume" value={handleChangeFlag ? value: props.volume} onChange={handleChange} onChangeCommitted={commitedChange} />
    </div>

  );
}
