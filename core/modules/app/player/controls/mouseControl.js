// import Config from '../../../../config/config'
// import Helpers from '../../../../utils/helpers'

class MouseControl {
  constructor(player, world, status, threeControls) {
    this.player = player
    this.world = world
    this.status = status
    this.threeControls = threeControls

    this.mouseKey = null

    this.canBreakBlock = false
    this.canPlaceBlock = true
    this.initListeners()
  }

  initListeners = () => {
    document.addEventListener('mousedown', this.handleMouseDown, false)
    document.addEventListener('mouseup', this.handleMouseUp, false)
  }

  tick = () => {
    this.handleMouseInputs()
  }

  handleMouseInputs = () => {
    if (typeof this.mouseKey === 'number') {
      switch (this.mouseKey) {
        case 0: {
          console.log('MOUSE 1')
          // Left Key
          // if (this.status.isCreative && this.canBreakBlock) {
          //     this.world.breakBlock(false)
          //     this.canBreakBlock = false
          //     const canBreakBlockTimeout = window.requestTimeout(() => {
          //         this.canBreakBlock = true
          //         window.clearRequestTimeout(canBreakBlockTimeout)
          //     }, 200)
          // } else if (this.status.isSurvival && !this.breakBlockCountdown)
          //     this._startBreakingBlock()
          break
        }
        case 2: {
          console.log('MOUSE 2')
          // Right Key
          //   if (!this.canPlaceBlock) break

          //   const type = this.player.inventory.getHand()
          //   console.log(type)
          //   if (!type) return

          //   // TODO: CHECK IF BLOCK IS PLACABLE
          //   if (this.status.isCreative) this.world.placeBlock(type, false)
          //   else if (this.status.isSurvival) this.world.placeBlock(type)

          //   this.canPlaceBlock = false
          //   const canPlaceBlockTimeout = window.requestTimeout(() => {
          //     this.canPlaceBlock = true
          //     window.clearRequestTimeout(canPlaceBlockTimeout)
          //   }, 200)

          break
        }
        default:
          break
      }
    }
  }

  handleMouseDown = e => {
    if (!this.world.getChat().enabled && this.threeControls.isLocked)
      this.mouseKey = e.button
  }

  handleMouseUp = e => {
    if (!this.world.getChat().enabled && this.threeControls.isLocked) {
      this.mouseKey = null
      if (e.button === 0) {
        // this.stopBreakingBlock()
      }
      if (this.status.isCreative) {
        this.canBreakBlock = true
        this.canPlaceBlock = true
      }
    }
  }

  // _startBreakingBlock = () => {
  //     const info = this.world.getTargetBlockInfo()

  //     if (!info) return

  //     const { type } = info

  //     if (type === 0) return
  //     // TODO: TOOLS
  //     const interval = (BLOCK_DICTIONARY[type].break.hand * 1000) / 9

  //     this.viewport.addBB2Scene()

  //     let counter = 9

  //     this.breakBlockCountdown = window.requestInterval(() => {
  //         counter--
  //         if (counter === 0) {
  //             this.world.breakBlock()
  //             this.stopBreakingBlock()
  //             return
  //         } else this.viewport.incrementBBStage()

  //         // CHANGE TEXTURE
  //     }, interval)
  // }
}
export default MouseControl
