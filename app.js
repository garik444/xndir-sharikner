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


function separateInitial(){
  for(let k=0;k<300;k++){
    for(let i=0;i<circles.length;i++){
      for(let j=i+1;j<circles.length;j++){
        const a=circles[i], b=circles[j]
        const dx=b.x-a.x, dy=b.y-a.y
        const d=Math.hypot(dx,dy) || 0.0001
        const min=a.r+b.r+1
        if(d<min){
          const ux=dx/d, uy=dy/d
          const push=(min-d)*0.55
          a.x-=ux*push; a.y-=uy*push
          b.x+=ux*push; b.y+=uy*push
        }
      }
    }
    for(const c of circles){
      c.x=clamp(c.x,c.r,W-c.r)
      c.y=clamp(c.y,c.r,H-c.r)
    }
  }
}
separateInitial()

function resolveCircleCollisions(){
  for(let i=0;i<circles.length;i++){
    for(let j=i+1;j<circles.length;j++){
      const a=circles[i], b=circles[j]
      const dx=b.x-a.x, dy=b.y-a.y
      const d=Math.hypot(dx,dy) || 0.0001
      const min=a.r+b.r
      if(d<min){
        const nx=dx/d, ny=dy/d
        const overlap=min-d
        const invA=a.stopped?0:1/a.mass
        const invB=b.stopped?0:1/b.mass
        const invSum=invA+invB || 1
        if(!a.stopped){
          a.x-=nx*overlap*(invA/invSum)
          a.y-=ny*overlap*(invA/invSum)
        }
        if(!b.stopped){
          b.x+=nx*overlap*(invB/invSum)
          b.y+=ny*overlap*(invB/invSum)
        }
        const rvx=(b.stopped?0:b.vx)-(a.stopped?0:a.vx)
        const rvy=(b.stopped?0:b.vy)-(a.stopped?0:a.vy)
        const vn=rvx*nx + rvy*ny
        if(vn<0){
          const e=0.98
          const jimp=-(1+e)*vn/(invSum)
          const ix=jimp*nx, iy=jimp*ny
          if(!a.stopped){a.vx-=ix*invA; a.vy-=iy*invA}
          if(!b.stopped){b.vx+=ix*invB; b.vy+=iy*invB}
        }
      }
    }
  }
}

let currentValue = 1
let pendingOp = null
let expression = ["1"]

function renderHUD(){
  valueEl.textContent = String(currentValue)
  pendingEl.textContent = pendingOp ? pendingOp : "—"
  exprEl.textContent = expression.join(" ")
}

function applyOp(a, op, b){
  if(op==="+") return a + b
  if(op==="-") return a - b
  if(op==="*") return a * b
  if(op==="/") return b===0 ? a : a / b
  return a
}

function stopAll(){
  for(const c of circles) c.stopped=true
  for(const r of rects) r.stopped=true
}

function resumeAll(){
  for(const c of circles) c.stopped=false
  for(const r of rects) r.stopped=false
}

function reset(){
  currentValue = 1
  pendingOp = null
  expression = ["1"]
  for(const r of rects){ r.op=r.baseOp; r.stopped=false }
  for(const c of circles){ c.stopped=false }
  renderHUD()
}

renderHUD()

function handlePick(obj){
  obj.stopped = true

  if(obj.kind==="circle"){
    const num = obj.n
    if(pendingOp){
      currentValue = applyOp(currentValue, pendingOp, num)
      expression.push(String(num))
      pendingOp = null
    }else{
      expression.push(String(num))
      currentValue = num
    }
    renderHUD()
    return
  }

  if(obj.kind==="rect"){
    let op = obj.op

    if(op==="="){
      pendingOp = null
      expression.push("=")
      expression.push(String(currentValue))
      renderHUD()
      return
    }

    if(pendingOp==="/" && op==="*"){
      op="/"
      obj.op="/"
    }

    pendingOp = op
    expression.push(op)
    renderHUD()
    return
  }
}

canvas.addEventListener("pointerdown",(e)=>{
  const rect = canvas.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width)
  const my = (e.clientY - rect.top) * (canvas.height / rect.height)

  for(let i=rects.length-1;i>=0;i--){
    if(rects[i].hit(mx,my)){
      handlePick(rects[i])
      return
    }
  }
  for(let i=circles.length-1;i>=0;i--){
    if(circles[i].hit(mx,my)){
      handlePick(circles[i])
      return
    }
  }
})

resetBtn.addEventListener("click", reset)
resumeBtn.addEventListener("click", resumeAll)

function drawBackground(){
  ctx.clearRect(0,0,W,H)
  for(let i=0;i<70;i++){
    const x=(i*137)%W
    const y=(i*199)%H
    ctx.fillStyle="rgba(255,255,255,.03)"
    ctx.fillRect(x,y,2,2)
  }
}

function loop(){
  for(const r of rects) r.step()
  for(const c of circles) c.step()
  resolveCircleCollisions()


  drawBackground()
  for(const r of rects) r.draw()
  for(const c of circles) c.draw()

  requestAnimationFrame(loop)
}

loop()
