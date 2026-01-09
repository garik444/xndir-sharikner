const canvas = document.getElementById("stage")
const ctx = canvas.getContext("2d")

const valueEl = document.getElementById("value")
const pendingEl = document.getElementById("pending")
const exprEl = document.getElementById("expr")
const resetBtn = document.getElementById("reset")
const resumeBtn = document.getElementById("resume")

const W = canvas.width
const H = canvas.height

const rand = (a,b)=>a+Math.random()*(b-a)
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))
const dist2 = (ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy}

const hsl = (h,s,l)=>`hsl(${h} ${s}% ${l}%)`

class Circle {
  constructor(n){
    this.kind="circle"
    this.n=n
    this.r=rand(20,45)
    this.x=rand(this.r+20, W-this.r-20)
    this.y=rand(this.r+20, H-this.r-20)
    const sp=rand(1.2,2.6)
    const ang=rand(0,Math.PI*2)
    this.vx=Math.cos(ang)*sp
    this.vy=Math.sin(ang)*sp
    this.color=hsl(Math.floor(rand(0,360)), 85, 55)
    this.stopped=false
    this.mass=this.r*this.r
  }
  step(){
    if(this.stopped) return
    this.x+=this.vx
    this.y+=this.vy
    if(this.x-this.r<0){this.x=this.r;this.vx*=-1}
    if(this.x+this.r>W){this.x=W-this.r;this.vx*=-1}
    if(this.y-this.r<0){this.y=this.r;this.vy*=-1}
    if(this.y+this.r>H){this.y=H-this.r;this.vy*=-1}
  }
  draw(){
    ctx.beginPath()
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2)
    ctx.fillStyle=this.color
    ctx.fill()
    ctx.lineWidth=2
    ctx.strokeStyle="rgba(255,255,255,.22)"
    ctx.stroke()
    ctx.fillStyle="rgba(0,0,0,.55)"
    ctx.font=`700 ${Math.max(14, this.r*0.70)}px system-ui, sans-serif`
    ctx.textAlign="center"
    ctx.textBaseline="middle"
    ctx.fillText(String(this.n), this.x, this.y)
    if(this.stopped){
      ctx.beginPath()
      ctx.arc(this.x,this.y,this.r+4,0,Math.PI*2)
      ctx.lineWidth=3
      ctx.strokeStyle="rgba(255,255,255,.7)"
      ctx.stroke()
    }
  }
  hit(mx,my){
    return dist2(mx,my,this.x,this.y) <= this.r*this.r
  }
}

class RectOp {
  constructor(op){
    this.kind="rect"
    this.baseOp=op
    this.op=op
    this.w=rand(54,78)
    this.h=rand(40,56)
    this.x=rand(20, W-this.w-20)
    this.y=rand(20, H-this.h-20)
    const sp=rand(1.1,2.2)
    const ang=rand(0,Math.PI*2)
    this.vx=Math.cos(ang)*sp
    this.vy=Math.sin(ang)*sp
    this.color="rgba(255,255,255,.10)"
    this.stroke="rgba(255,255,255,.26)"
    this.stopped=false
  }
  step(){
    if(this.stopped) return
    this.x+=this.vx
    this.y+=this.vy
    if(this.x<0){this.x=0;this.vx*=-1}
    if(this.x+this.w>W){this.x=W-this.w;this.vx*=-1}
    if(this.y<0){this.y=0;this.vy*=-1}
    if(this.y+this.h>H){this.y=H-this.h;this.vy*=-1}
  }
  draw(){
    const r=14
    ctx.beginPath()
    ctx.moveTo(this.x+r,this.y)
    ctx.arcTo(this.x+this.w,this.y,this.x+this.w,this.y+this.h,r)
    ctx.arcTo(this.x+this.w,this.y+this.h,this.x,this.y+this.h,r)
    ctx.arcTo(this.x,this.y+this.h,this.x,this.y,r)
    ctx.arcTo(this.x,this.y,this.x+this.w,this.y,r)
    ctx.closePath()
    ctx.fillStyle=this.color
    ctx.fill()
    ctx.lineWidth=2
    ctx.strokeStyle=this.stroke
    ctx.stroke()
    ctx.fillStyle="rgba(255,255,255,.92)"
    ctx.font=`800 ${Math.max(18, this.h*0.55)}px system-ui, sans-serif`
    ctx.textAlign="center"
    ctx.textBaseline="middle"
    ctx.fillText(this.op, this.x+this.w/2, this.y+this.h/2)
    if(this.stopped){
      ctx.lineWidth=3
      ctx.strokeStyle="rgba(255,255,255,.75)"
      ctx.stroke()
    }
  }
  hit(mx,my){
    return mx>=this.x && mx<=this.x+this.w && my>=this.y && my<=this.y+this.h
  }
}

const circles=[]
const rects=[]
for(let i=1;i<=10;i++) circles.push(new Circle(i))
;["+","-","*","/","="].forEach(op=>rects.push(new RectOp(op)))
