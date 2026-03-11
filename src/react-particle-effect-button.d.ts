declare module 'react-particle-effect-button' {
  import React from 'react'
  interface ParticleEffectButtonProps {
    hidden?: boolean
    color?: string
    children?: React.ReactNode
    className?: string
    duration?: number
    easing?: string | number[]
    type?: 'circle' | 'rectangle' | 'triangle'
    style?: 'fill' | 'stroke'
    direction?: 'left' | 'right' | 'top' | 'bottom'
    canvasPadding?: number
    size?: number | (() => number)
    speed?: number | (() => number)
    particlesAmountCoefficient?: number
    oscillationCoefficient?: number
    onBegin?: () => void
    onComplete?: () => void
  }
  export default class ParticleEffectButton extends React.Component<ParticleEffectButtonProps> {}
}
