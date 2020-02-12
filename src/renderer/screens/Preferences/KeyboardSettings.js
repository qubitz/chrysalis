// -*- mode: js-jsx -*-
/* Chrysalis -- Kaleidoscope Command Center
 * Copyright (C) 2018, 2019  Keyboardio, Inc.
 * Copyright (C) 2020  DygmaLab SE.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import PropTypes from "prop-types";

import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Divider from "@material-ui/core/Divider";
import FilledInput from "@material-ui/core/FilledInput";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import LinearProgress from "@material-ui/core/LinearProgress";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Slider from "@material-ui/lab/Slider";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

import Focus from "@chrysalis-api/focus";

import ConfirmationDialog from "../../components/ConfirmationDialog";
import SaveChangesButton from "../../components/SaveChangesButton";
import i18n from "../../i18n";

import settings from "electron-settings";

const styles = theme => ({
  title: {
    marginTop: theme.spacing.unit * 4,
    marginBottom: theme.spacing.unit
  },
  control: {
    display: "flex",
    marginRight: theme.spacing.unit * 2
  },
  group: {
    display: "block"
  },
  grow: {
    flexGrow: 1
  },
  flex: {
    display: "flex"
  },
  select: {
    paddingTop: theme.spacing.unit * 1,
    width: 200
  },
  slider: {
    width: 300
  },
  sliderContainer: {
    marginTop: theme.spacing.unit * 2
  },
  advanced: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing.unit * 4,
    "& button": {
      textTransform: "none",
      "& span svg": {
        marginLeft: "1.5em"
      }
    }
  }
});

class KeyboardSettings extends React.Component {
  state = {
    keymap: {
      custom: [],
      default: [],
      onlyCustom: false
    },
    ledBrightness: 255,
    defaultLayer: 126,
    modified: false,
    showDefaults: false,
    working: false
  };

  componentDidMount() {
    const focus = new Focus();
    focus.command("keymap").then(keymap => {
      this.setState({ keymap: keymap });
    });
    focus.command("settings.defaultLayer").then(layer => {
      layer = layer ? parseInt(layer) : 126;
      this.setState({ defaultLayer: layer <= 126 ? layer : 126 });
    });
    focus.command("led.brightness").then(brightness => {
      brightness = brightness ? parseInt(brightness) : -1;
      this.setState({ ledBrightness: brightness });
    });

    this.setState({
      showDefaults: settings.get("keymap.showDefaults")
    });
  }

  UNSAFE_componentWillReceiveProps = nextProps => {
    if (this.props.inContext && !nextProps.inContext) {
      this.componentDidMount();
      this.setState({ modified: false });
    }
  };

  setOnlyCustom = event => {
    const checked = event.target.checked;
    this.setState(state => ({
      modified: true,
      keymap: {
        custom: state.keymap.custom,
        default: state.keymap.default,
        onlyCustom: checked
      }
    }));
    this.props.startContext();
  };

  selectDefaultLayer = event => {
    this.setState({
      defaultLayer: event.target.value,
      modified: true
    });
    this.props.startContext();
  };

  setShowDefaults = event => {
    this.setState({
      showDefaults: event.target.checked,
      modified: true
    });
    this.props.startContext();
  };

  setBrightness = (event, value) => {
    this.setState({
      ledBrightness: value,
      modified: true
    });
    this.props.startContext();
  };

  saveKeymapChanges = async () => {
    const focus = new Focus();

    const { keymap, defaultLayer, showDefaults, ledBrightness } = this.state;

    await focus.command("keymap.onlyCustom", keymap.onlyCustom);
    await focus.command("settings.defaultLayer", defaultLayer);
    await focus.command("led.brightness", ledBrightness);
    settings.set("keymap.showDefaults", showDefaults);
    this.setState({ modified: false });
    this.props.cancelContext();
  };

  render() {
    const { classes } = this.props;
    const {
      keymap,
      defaultLayer,
      modified,
      showDefaults,
      ledBrightness
    } = this.state;

    const onlyCustomSwitch = (
      <Switch
        checked={keymap.onlyCustom}
        value="onlyCustom"
        onClick={this.setOnlyCustom}
      />
    );
    const showDefaultLayersSwitch = (
      <Switch
        checked={showDefaults}
        value="showDefaults"
        onClick={this.setShowDefaults}
      />
    );
    let layers;
    if (keymap.onlyCustom) {
      layers = keymap.custom.map((_, index) => {
        return (
          <MenuItem value={index} key={index}>
            {i18n.formatString(i18n.components.layer, index)}
          </MenuItem>
        );
      });
    } else {
      layers = keymap.default.concat(keymap.custom).map((_, index) => {
        return (
          <MenuItem value={index} key={index}>
            {i18n.formatString(i18n.components.layer, index)}
          </MenuItem>
        );
      });
    }
    const defaultLayerSelect = (
      <Select
        onChange={this.selectDefaultLayer}
        value={defaultLayer}
        variant="filled"
        input={<FilledInput classes={{ input: classes.select }} />}
      >
        <MenuItem value={126}>
          {i18n.keyboardSettings.keymap.noDefault}
        </MenuItem>
        {layers}
      </Select>
    );
    const brightnessControl = (
      <Slider
        max={255}
        value={ledBrightness}
        className={classes.slider}
        onChange={this.setBrightness}
      />
    );

    return (
      <React.Fragment>
        {this.state.working && <LinearProgress variant="query" />}
        <Typography
          variant="subtitle1"
          component="h2"
          className={classes.title}
        >
          {i18n.keyboardSettings.keymap.title}
        </Typography>
        <Card>
          <CardContent>
            <FormControl className={classes.group}>
              <FormControlLabel
                className={classes.control}
                control={showDefaultLayersSwitch}
                classes={{ label: classes.grow }}
                labelPlacement="start"
                label={i18n.keyboardSettings.keymap.showHardcoded}
              />
              <Divider />
              <FormControlLabel
                className={classes.control}
                control={onlyCustomSwitch}
                classes={{ label: classes.grow }}
                labelPlacement="start"
                label={i18n.keyboardSettings.keymap.onlyCustom}
              />
              <FormControlLabel
                className={classes.control}
                classes={{ label: classes.grow }}
                control={defaultLayerSelect}
                labelPlacement="start"
                label={i18n.keyboardSettings.keymap.defaultLayer}
              />
              {ledBrightness >= 0 && (
                <FormControlLabel
                  className={classes.control}
                  classes={{
                    label: classes.grow,
                    root: classes.sliderContainer
                  }}
                  control={brightnessControl}
                  labelPlacement="start"
                  label={i18n.keyboardSettings.led.brightness}
                />
              )}
            </FormControl>
          </CardContent>
          <CardActions className={classes.flex}>
            <span className={classes.grow} />
            <SaveChangesButton
              onClick={this.saveKeymapChanges}
              disabled={!modified}
            >
              {i18n.components.save.saveChanges}
            </SaveChangesButton>
          </CardActions>
        </Card>
      </React.Fragment>
    );
  }
}

KeyboardSettings.propTypes = {
  classes: PropTypes.object.isRequired
};

class AdvancedKeyboardSettings extends React.Component {
  state = {
    EEPROMClearConfirmationOpen: false
  };

  clearEEPROM = async () => {
    const focus = new Focus();

    await this.setState({ working: true });
    this.closeEEPROMClearConfirmation();

    let eeprom = await focus.command("eeprom.contents");
    eeprom = eeprom
      .split(" ")
      .filter(v => v.length > 0)
      .map(() => 255)
      .join(" ");
    await focus.command("eeprom.contents", eeprom);
    this.setState({ working: false });
  };
  openEEPROMClearConfirmation = () => {
    this.setState({ EEPROMClearConfirmationOpen: true });
  };
  closeEEPROMClearConfirmation = () => {
    this.setState({ EEPROMClearConfirmationOpen: false });
  };

  render() {
    const { classes } = this.props;

    return (
      <React.Fragment>
        {this.state.working && <LinearProgress variant="query" />}
        <Typography
          variant="subtitle1"
          component="h2"
          className={classes.title}
        >
          {i18n.keyboardSettings.advancedOps}
        </Typography>
        <Card>
          <CardActions>
            <Button
              disabled={this.state.working}
              variant="contained"
              color="secondary"
              onClick={this.openEEPROMClearConfirmation}
            >
              {i18n.keyboardSettings.resetEEPROM.button}
            </Button>
          </CardActions>
        </Card>
        <ConfirmationDialog
          title={i18n.keyboardSettings.resetEEPROM.dialogTitle}
          open={this.state.EEPROMClearConfirmationOpen}
          onConfirm={this.clearEEPROM}
          onCancel={this.closeEEPROMClearConfirmation}
        >
          {i18n.keyboardSettings.resetEEPROM.dialogContents}
        </ConfirmationDialog>
      </React.Fragment>
    );
  }
}

AdvancedKeyboardSettings.propTypes = {
  classes: PropTypes.object.isRequired
};

const StyledKeyboardSettings = withStyles(styles)(KeyboardSettings);
const StyledAdvancedKeyboardSettings = withStyles(styles)(
  AdvancedKeyboardSettings
);

export {
  StyledKeyboardSettings as KeyboardSettings,
  StyledAdvancedKeyboardSettings as AdvancedKeyboardSettings
};