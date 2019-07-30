/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/require-default-props */
import React, { PureComponent } from 'react'

import '../Pannellum/css/pannellum.css'
import '../Pannellum/js/libpannellum'
import '../Pannellum/js/pannellum'
import '../Pannellum/js/RequestAnimationFrame'

class Pannellum extends PureComponent {
  static defaultProps = {
    type: 'cubemap',
    children: [],
    width: '100%',
    height: '400px',
    image: '',
    haov: 360,
    vaov: 180,
    vOffset: 0,
    yaw: 0,
    pitch: 0,
    hfov: 100,
    minHfov: 50,
    maxHfov: 150,
    minPitch: -90,
    maxPitch: 90,
    minYaw: -180,
    maxYaw: 180,
    autoRotate: 0,
    compass: false,
    preview: '',
    previewTitle: '',
    previewAuthor: '',
    title: '',
    author: '',
    autoLoad: true,
    orientationOnByDefault: false,
    showZoomCtrl: false,
    keyboardZoom: false,
    mouseZoom: false,
    doubleClickZoom: false,
    draggable: false,
    disableKeyboardCtrl: false,
    showFullscreenCtrl: false,
    showControls: false,
    onLoad: () => {},
    onScenechange: () => {},
    onScenechangefadedone: () => {},
    onError: () => {},
    onErrorcleared: () => {},
    onMousedown: () => {},
    onMouseup: () => {},
    onTouchstart: () => {},
    onTouchend: () => {},
    onRender: null,
    cubeMap: [],
    dynamic: true
  }

  constructor(props) {
    super(props)
    this.state = {
      id: Math.random()
        .toString(36)
        .substr(2, 9)
    }
  }

  componentDidMount = () => {
    this.renderImage('mount')
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.image !== this.props.image ||
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height ||
      prevProps.compass !== this.props.compass ||
      prevProps.title !== this.props.title ||
      prevProps.author !== this.props.author ||
      prevProps.preview !== this.props.preview ||
      prevProps.previewTitle !== this.props.previewTitle ||
      prevProps.previewAuthor !== this.props.previewAuthor ||
      prevProps.showZoomCtrl !== this.props.showZoomCtrl ||
      prevProps.showFullscreenCtrl !== this.props.showFullscreenCtrl ||
      prevProps.showControls !== this.props.showControls ||
      prevProps.children.length !== this.props.children.length
    ) {
      this.renderImage('update')
    }
    if (
      prevProps.maxYaw !== this.props.maxYaw ||
      prevProps.minYaw !== this.props.minYaw ||
      prevProps.maxPitch !== this.props.maxPitch ||
      prevProps.minPitch !== this.props.minPitch ||
      prevProps.maxHfov !== this.props.maxHfov ||
      prevProps.minHfov !== this.props.minHfov
    ) {
      this.panorama.setYawBounds([this.props.minYaw, this.props.maxYaw])
      this.panorama.setPitchBounds([this.props.minPitch, this.props.maxPitch])
      this.panorama.setHfovBounds([this.props.minHfov, this.props.maxHfov])
    }
    if (prevProps.yaw !== this.props.yaw) {
      this.panorama.setYaw(this.props.yaw)
    }
    if (prevProps.pitch !== this.props.pitch) {
      this.panorama.setPitch(this.props.pitch)
    }
    if (prevProps.hfov !== this.props.hfov) {
      this.panorama.setHfov(this.props.hfov)
    }
  }

  renderImage = state => {
    const jsonConfig = {
      type: this.props.type,
      panorama: this.props.image,
      haov: this.props.haov,
      vaov: this.props.vaov,
      vOffset: this.props.vOffset,
      yaw: this.props.yaw,
      pitch: this.props.pitch,
      hfov: this.props.hfov,
      minHfov: this.props.minHfov,
      maxHfov: this.props.maxHfov,
      minPitch: this.props.minPitch,
      maxPitch: this.props.maxPitch,
      minYaw: this.props.minYaw,
      maxYaw: this.props.maxYaw,
      autoRotate: this.props.autoRotate,
      compass: this.props.compass,
      preview: this.props.preview,
      previewTitle: this.props.previewTitle,
      previewAuthor: this.props.previewAuthor,
      author: this.props.author,
      title: this.props.title,
      autoLoad: this.props.autoLoad,
      orientationOnByDefault: this.props.orientationOnByDefault,
      showZoomCtrl: this.props.showZoomCtrl,
      keyboardZoom: this.props.keyboardZoom,
      mouseZoom: this.props.mouseZoom,
      doubleClickZoom: this.props.doubleClickZoom,
      draggable: this.props.draggable,
      disableKeyboardCtrl: this.props.disableKeyboardCtrl,
      showFullscreenCtrl: this.props.showFullscreenCtrl,
      showControls: this.props.showControls,
      onRender: this.props.onRender,
      cubeMap: this.props.cubeMap,
      dynamic: this.props.dynamic
    }

    Object.keys(jsonConfig).forEach(key => jsonConfig[key] === '' && delete jsonConfig[key])
    // this.setState({ jsonConfig });

    if (state === 'update') {
      this.panorama.destroy()
    }
    this.panorama = window.pannellum.viewer(
      this.props.id ? this.props.id : this.state.id,
      jsonConfig
    )

    this.panorama.on('load', this.props.onLoad)
    this.panorama.on('scenechange', this.props.onScenechange)
    this.panorama.on('scenechangefadedone', this.props.onScenechangefadedone)
    this.panorama.on('error', this.props.onError)
    this.panorama.on('errorcleared', this.props.onErrorcleared)
  }

  getViewer = () => {
    return this.panorama
  }

  forceRender = () => {
    this.renderImage('update')
  }

  render() {
    const { width, height, className } = this.props
    const divStyle = {
      width,
      height
    }
    return (
      <div
        id={this.props.id ? this.props.id : this.state.id}
        style={divStyle}
        className={className}
        ref={node => (this.imageNode = node)}
      />
    )
  }
}
export default Pannellum
