import classes from './Slider.module.css'

import pluralize from 'pluralize'
import React from 'react'

const Slider = ({ value, onChange, min, max, text, unit, step, className }) => {
  return (
    <div className={`${classes.wrapper} ${className || ''}`}>
      <h1 className={classes.textOverlay}>
        {`${text}: ${Math.round(value)} ${pluralize(unit, Math.round(value))}`}
      </h1>
      <input
        type="range"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className={classes.slider}
      />
    </div>
  )
}

export { Slider }
