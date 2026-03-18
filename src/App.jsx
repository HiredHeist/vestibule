import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// ── Audio ─────────────────────────────────────────────────────────────────────
function mkCtx(){return new(window.AudioContext||window.webkitAudioContext)()}
function playTone(freq,dur,wave,distort,vol){
  wave=wave||'sawtooth';distort=distort||false;vol=vol||0.5
  try{var ctx=mkCtx(),osc=ctx.createOscillator(),gain=ctx.createGain()
  osc.type=wave;osc.frequency.setValueAtTime(freq,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*0.25,ctx.currentTime+dur)
  gain.gain.setValueAtTime(vol,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur)
  if(distort){var d=ctx.createWaveShaper(),c=new Float32Array(256);for(var i=0;i<256;i++){var x=(i*2)/256-1;c[i]=((Math.PI+300)*x)/(Math.PI+300*Math.abs(x))}d.curve=c;osc.connect(d);d.connect(gain)}else osc.connect(gain)
  gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+dur)}catch(e){}}
