class vec2{
	constructor(x,y){
		this.x = x;
		this.y = y;
	}
	static dot(a,b){
		return a.x*b.x+a.y*b.y;
	}
	static add(a,b){
		return new vec2(a.x+b.x,a.y+b.y);
	}
	static sub(a,b){
		return new vec2(a.x-b.x,a.y-b.y);
	}
	static scale(a,s){
		return new vec2(a.x*s,a.y*s);
	}
	static mul(a,b){
		return new vec2(a.x*b.x,a.y*b.y);
	}
	length2(){
		return vec2.dot(this,this);
	}
	length(){
		return Math.sqrt(this.length2());
	}
	normalize(){
		return vec2.scale(this,1/this.length());
	}
	inverse(){
		let x = Math.abs(this.x) < 1e-5?1e-5:this.x;
		let y = Math.abs(this.y) < 1e-5?1e-5:this.y;
		

		return new vec2(1/x,1/y);
	}
	sign(){
		let x = Math.abs(this.x) < 1e-5?1e-5:this.x;
		let y = Math.abs(this.y) < 1e-5?1e-5:this.y;
		

		return new vec2(Math.sign(x),Math.sign(y));
	}
}
class Random{
	constructor(seed=1){
		this.seed = seed;
	}

	random(){
		return (this.seed = (this.seed * 1664525 + 1013904223)%(2**32))/2**32;
	}

}
let rngEngine = new Random();
/**
---------------------------------------
Scene Object
---------------------------------------

*/




class Scene{
	constructor(W,H){
		this.objectArr = [];
		this.lightArr = [];
		this.borderArr = [
			new lineObj(new vec2(-10,0),new vec2(W+10,0),sampleMirror),
			new lineObj(new vec2(W,-10),new vec2(W,H+10),sampleMirror),
			new lineObj(new vec2(W+10,H),new vec2(-10,H),sampleMirror),
			new lineObj(new vec2(0,H+10),new vec2(0,-10),sampleMirror)
			
		];
	}
	addObject(obj){
		this.objectArr.push(obj);
	}
	addLight(obj){
		this.lightArr.push(obj);
	}
	trace(ro,rd,nt=10000){
		let t = nt;
		let it = -1;
		let no;
		for(let i=0,len=this.objectArr.length;i<len;i++){
			let res = this.objectArr[i].trace(ro,rd);
			if(res[0] >= 1e-4 && res[0] < t){
				t = res[0];
				no = res[1];
				it = i;
			}
		}
		return [it,t,no];
	}
	border(ro,rd){
		let t = Infinity;
		let it = -1;

		for(let i=0;i<4;i++){
			let res = this.borderArr[i].trace(ro,rd);
			if(res[0] >= 0 && res[0] < t){
				t = res[0];

				it = i;
			}
		}
		return [it,t];
	}
	normal(ro,rd,t,i){
		return this.objectArr[i].normal(ro,rd,t);
	}
	sampleBRDF(pos,i,channel){
		return this.objectArr[i].brdfFnc(pos,
			sellmeierEquation([1.03961212,0.231792344,1.01046945],[0.006000699,0.020017914,103.560653],channel)
			);
	}
	sampleLight(i,channel){
		return this.lightArr[i].sample(channel);
	}
}
/****
-------------------------------------
Light
-------------------------------------
*/


class basicLight{
	constructor(color){
		this.color = color;
	}
	sample(){
		throw "Must implement";
	}
}
class pointLight extends basicLight{
	constructor(pos,color){
		super(color);
		this.pos = pos;
	}
	sample(channel){
		let xi = rngEngine.random()*2-1;
		return [
			new vec2(this.pos.x,this.pos.y),
			new vec2(Math.cos(xi*Math.PI),Math.sin(xi*Math.PI))
		];
	}
}
class planeLight extends basicLight{
	constructor(pos1,pos2,color){
		super(color);
		this.pos1 = pos1;
		this.pos2 = pos2;
		let d = vec2.sub(pos1,pos2);
		this.nor = (new vec2(-d.y,d.x)).normalize();
	}
	sample(channel){
		let xi = Math.random();
		return [
			vec2.add(vec2.scale(this.pos1,1-xi),vec2.scale(this.pos2,xi)),
			new vec2(this.nor.x,this.nor.y)
		];
	}
}
/*********
-------------------------------
	Primitive Object
-------------------------------

*/
class basicObject{
	constructor(brdfFnc){
		this.brdfFnc = brdfFnc;
	}
	trace(){
		throw "Must implement";
	}
	normal(){
		throw "Must implement";
	}
}
class lineObj extends basicObject{
	constructor(pa,pb,brdfFnc){
		super(brdfFnc);
		this.pa = pa;
		this.pb = pb;
	}
	trace(ro,rd){
		
		return intersectLine(ro,rd,this.pa,this.pb);
		
	}
	
}
class sphereObject extends basicObject{
	constructor(center,radius,brdfFnc){
		super(brdfFnc);
		this.center = center;
		this.radius = radius;
	}
	trace(ro,rd){
		
		return intersectSphere(ro,rd,this.center,this.radius);
	}
}
class prismObject extends basicObject{
	constructor(center,radius,brdfFnc){
		super(brdfFnc);
		this.center = center;
		this.radius = radius;
	}
	trace(ro,rd){
		let minV = Infinity;
		let isFound = false;
		let minN;
		for(let i=0;i<3;i++){
			let radian0 = i / 3 * Math.PI*2;
			let radian1 = (i+1) / 3 * Math.PI*2;
			let pos1 = vec2.add(this.center,
				vec2.scale(new vec2(Math.cos(radian0),Math.sin(radian0)),this.radius));
			let pos2 = vec2.add(this.center,
				vec2.scale(new vec2(Math.cos(radian1),Math.sin(radian1)),this.radius));
			let res = intersectLine(ro,rd,pos1,pos2);
			if(res[0] >= 1e-4 && res[0] < minV){
				minV = res[0];
				minN = res[1];
				isFound = true;
			}
		}
		if(isFound){
			return [minV,minN];
		}else{
			return [-1];
		}
	}
}
/**
----------------------------------
Intersector function
----------------------------------
*/
function intersectSphere(ro,rd,center,radius){
		let p = vec2.sub(ro,center);
		let B = vec2.dot(p,rd);
		let C = vec2.dot(p,p) - radius**2;
		let detSq = B*B-C;
		if(detSq >= 0){
			let det = Math.sqrt(detSq);
			let t = -B - det;
			if(t <= 1e-3 )
				t = -B + det;
			if(t > 1e-3)
				return [t,vec2.add(p,vec2.scale(rd,t)).normalize()];
			
		}
		return [-1];
	}

function intersectLine(ro,rd,pa,pb){
		let sT = vec2.sub(pb,pa);
		let sN = new vec2(-sT.y,sT.x);
		let t = vec2.dot(sN,vec2.sub(pa,ro))/vec2.dot(sN,rd);
		let u = vec2.dot(sT,vec2.sub(vec2.add(ro,vec2.scale(rd,t)),pa));
		if(t < 1e-3 || u < 0 || u > vec2.dot(sT,sT)){
			return [-1];
		}
		return [t,sN.normalize()];
		
	}
/**
---------------------------------------------------
BRDF
---------------------------------------------------
*/




function sampleMirror(rd){
	return new vec2(-rd.x,rd.y);
}
function sampleDiffuse(rd){
	let xi = rngEngine.random();
	let sinT = 2*xi - 1;
	let cosT = Math.sqrt(1 - sinT*sinT);
	return new vec2(sinT,cosT*Math.sign(rd.y));
}
function sampleDielectric(rd,ior=1.5){
	let eta = rd.y < 0.0 ? ior : 1/ior;
	let fr =  fresnel(rd,Math.abs(eta));
	
	if(rngEngine.random() < fr){
		return new vec2(-rd.x,rd.y);
	}else{
		return new vec2(-rd.x*eta,
			Math.sqrt(1-eta*eta*rd.x*rd.x)*(-Math.sign(rd.y))
			).normalize();
	}
}
function fresnel(rd,ior){
	let cosi = Math.abs(Math.min(Math.max(rd.y,-1),1));
	
	let sint = ior*ior *(1-cosi*cosi);
	if(sint > 1){
		return 1;
	}else{
		let cost = Math.sqrt(Math.max(0,1-sint));
		let Rs = ((ior * cosi) - cost)/((ior * cosi) + (cost));
		let Rp = ((ior * cost) - cosi)/((ior * cost) + (cosi));
		return (Rs * Rs + Rp * Rp)/2;
	}
}

function sellmeierEquation(B,C,lambda){
	lambda = (1-lambda)*0.038 + lambda * 0.078;
	lambda2 = (lambda)*(lambda);
	return Math.sqrt(
		1+(lambda2*B[0])/(lambda2-C[0]*C[0])+
		(lambda2*B[1])/(lambda2-C[1]*C[1])+
		(lambda2*B[2])/(lambda2-C[2]*C[2])
		);

}
