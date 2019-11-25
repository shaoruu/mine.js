/**
 * F3 utilities
 */
import Helpers from '../../../utils/helpers'
import BlockDict from '../../../config/blockDict'

import classes from './debug.module.css'
import './fpsmeter'

function Debug(container, player, world) {
  let display = process.env.NODE_ENV === 'development'

  let maxFPS = null
  let minFPS = null

  let daysVal = 0

  /* -------------------------------------------------------------------------- */
  /*                                   GENERAL                                  */
  /* -------------------------------------------------------------------------- */
  const lineBreak = document.createElement('br')
  const wrapper = document.createElement('div')
  const leftPanel = document.createElement('div')
  const rightPanel = document.createElement('div')

  Helpers.applyStyle(wrapper, classes.wrapper)
  Helpers.applyStyle(leftPanel, classes.leftPanel)
  Helpers.applyStyle(rightPanel, classes.rightPanel)

  wrapper.appendChild(leftPanel)
  wrapper.appendChild(rightPanel)

  if (display) Helpers.applyStyle(wrapper, { display: 'flex' })

  const fpsMeter = new window.FPSMeter(wrapper, {
    interval: 100,
    display: 'none',
    maxFPS: 100
  })

  /* -------------------------------------------------------------------------- */
  /*                                 LEFT PANEL                                 */
  /* -------------------------------------------------------------------------- */
  const title = document.createElement('p')
  const fps = document.createElement('p')
  const xyz = document.createElement('p')
  const blockXYZ = document.createElement('p')
  const chunkXYZ = document.createElement('p')
  const days = document.createElement('p')

  title.innerHTML = 'mine.js (dev/beta/vanilla)'
  fps.innerHTML = '0 fps'
  xyz.innerHTML = 'XYZ: 0 / 0 / 0'
  blockXYZ.innerHTML = 'Block: 0 0 0'
  chunkXYZ.innerHTML = 'Chunk: 0 0 0 in 0 0 0'
  days.innerHTML = 'Day 0'

  leftPanel.appendChild(title)
  leftPanel.appendChild(fps)
  leftPanel.appendChild(lineBreak)
  leftPanel.appendChild(xyz)
  leftPanel.appendChild(blockXYZ)
  leftPanel.appendChild(chunkXYZ)
  leftPanel.appendChild(days)

  /* -------------------------------------------------------------------------- */
  /*                                 RIGHT PANEL                                */
  /* -------------------------------------------------------------------------- */
  const targetedBlockTitle = document.createElement('p')
  const targetedBlock = document.createElement('p')

  targetedBlockTitle.innerHTML = 'Targeted Block'
  targetedBlock.innerHTML = BlockDict['0'].tag

  Helpers.applyStyle(targetedBlockTitle, classes.subSectionTitle)

  rightPanel.appendChild(targetedBlockTitle)
  rightPanel.appendChild(targetedBlock)

  /* -------------------------------------------------------------------------- */
  /*                             GETTERS AND SETTERS                            */
  /* -------------------------------------------------------------------------- */
  this.getGui = () => wrapper

  this.getPlayer = () => player
  this.getWorld = () => world

  this.getDOM_FPS = () => fps
  this.getDOM_xyz = () => xyz
  this.getDOM_blockXYZ = () => blockXYZ
  this.getDOM_chunkXYZ = () => chunkXYZ
  this.getDOM_title = () => title
  this.getDOM_wrapper = () => wrapper
  this.getDOM_targetedBlock = () => targetedBlock
  this.getDOM_days = () => days

  this.setDisplay = bool => (display = bool)
  this.getDisplay = () => display

  this.setMaxFPS = f => (maxFPS = f)
  this.getMaxFPS = () => maxFPS

  this.setMinFPS = f => (minFPS = f)
  this.getMinFPS = () => minFPS

  this.getFPSMeter = () => fpsMeter

  this.setDaysVal = v => (daysVal = v)
  this.getDaysVal = () => daysVal

  container.appendChild(wrapper)
  player.controls.setDebugControl(this)
}

Debug.prototype.tickStart = function() {
  this.getFPSMeter().tickStart()
}

Debug.prototype.tick = function() {
  const fpsMeterRef = this.getFPSMeter()

  if (!this.getDisplay()) return

  const newFPS = Helpers.round(fpsMeterRef.fps, 0)
  const worldRef = this.getWorld()
  const playerRef = this.getPlayer()
  const playerPos = playerRef.getCoordinates()
  const playerChunk = playerRef.getChunkInfo()

  if (!this.getMaxFPS() || this.getMaxFPS() < newFPS) this.setMaxFPS(newFPS)
  if (!this.getMinFPS() || this.getMinFPS() > newFPS) this.setMinFPS(newFPS)

  // prettier-ignore
  this.getDOM_xyz().innerHTML = `XYZ: ${Helpers.round(playerPos.x, 3)} /
                                ${Helpers.round(playerPos.y, 3)} /
                                ${Helpers.round(playerPos.z, 3)}`

  // prettier-ignore
  this.getDOM_blockXYZ().innerHTML = `Block: ${Helpers.toFixed(playerPos.x, 0)} 
                                           ${Helpers.toFixed(playerPos.y, 0)} 
                                           ${Helpers.toFixed(playerPos.z, 0)}`

  // prettier-ignore
  this.getDOM_chunkXYZ().innerHTML = `Chunk: ${playerChunk.x} ${playerChunk.y} ${playerChunk.z} in ${playerChunk.coordx} ${playerChunk.coordy} ${playerChunk.coordz}`

  this.getDOM_FPS().innerHTML = `${newFPS} fps [${this.getMinFPS() ||
    0} - ${this.getMaxFPS() || 0}]`

  const targetedTag = BlockDict[worldRef.getTargetBlockType()]
  if (targetedTag) this.getDOM_targetedBlock().innerHTML = targetedTag.tag

  const worldDays = worldRef.getDays()
  if (worldDays !== this.getDaysVal()) {
    this.setDaysVal(worldDays)
    this.getDOM_days().innerHTML = `Day ${worldDays}`
  }

  fpsMeterRef.tick()
}

Debug.prototype.toggle = function() {
  const display = this.getDisplay()
  const wrapper = this.getDOM_wrapper()

  if (display) {
    this.setDisplay(false)
    wrapper.style.display = 'none'
  } else {
    this.setDisplay(true)
    wrapper.style.display = 'flex'
  }
}

export default Debug
