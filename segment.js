class Segment{
	constructor(tNear,tFar,nNear,nFar){
		this.tNear = tNear;
		this.tFar = tFar;
		this.nNear = nNear;
		this.nFar = nFar;
	}

	static intersection(a,b){
		return new Segment(
			Math.max(a.tNear,b.tNear),
			Math.min(a.tFar,b.tFar),
			(a.tNear > b.tNear) ? a.nNear : b.nNear,
			(a.tFar > b.tFar) ? a.nFar : b.nFar
		);
	}
	static subtraction(a,b,tMin){
		if (a.tNear >= a.tFar || b.tNear >= b.tFar || a.tFar <= b.tNear || a.tNear >= b.tFar)
        	return new Segment(a.tNear,a.tFar,a.nNear,a.nFar);
        let s1 = new Segment(a.tNear, b.tNear, a.nNear, vec2.scale(b.nNear,-1));
    	let s2 = new Segment(b.tFar,  a.tFar, vec2.scale(b.nFar,-1),   a.nFar);
		let valid1 = s1.tNear <= s1.tFar;
		let valid2 = s2.tNear <= s2.tFar;
		if(valid1 && valid2){
			if(s1.tFar >= tMin)return s1; else return s2;
		}else{
			if(valid1)return s1; else return s2;
		}
	}
	static collapse(segment){
		let tnear = Math.max(segment.tNear,1e-4);

		if(segment.tNear <= segment.tFar){
			if(segment.tNear > 1e-4){
				return [segment.tNear,segment.nNear];
			}else if(segment.tFar < 10000){
				return [segment.tFar,segment.nFar];
			}else{
				return [-1];
			}
		}
		return [-1];

	}
	static horzSpanIntersect(ro,rd,y,rad){

		let dc = (y-ro.y)*rd.inverse().y;
		let dt = rd.sign().y*rad*rd.inverse().y;
		return new Segment(dc-dt,dc+dt,new vec2(0,-rd.sign().y),new vec2(0,rd.sign().y));
	}
	static vertSpanIntersect(ro,rd,x,rad){
		let dc = (x-ro.x)*rd.inverse().x;
		let dt = rd.sign().x*rad*rd.inverse().x;
		return new Segment(dc-dt,dc+dt,new vec2(-rd.sign().x,0),new vec2(rd.sign().x,0));
	}
	static boxSegmentIntersect(ro,rd,center,rad){
		return Segment.intersection(
			Segment.horzSpanIntersect(ro,rd,center.x,rad.x),
			Segment.vertSpanIntersect(ro,rd,center.y,rad.y)
		);
	}
	static sphereSegmentIntersect(ro,rd,center,rad){
		let res = new Segment();
		let p = vec2.sub(ro,center);
		let B = vec2.dot(p,rd);
		let C = vec2.dot(p,p)-rad*rad;
		let detSq = B*B - C;
		if(detSq >= 0){
			let det = Math.sqrt(detSq);
			res.tNear = -B - det;
			res.tFar = -B + det;
			res.nNear = vec2.add(p,vec2.scale(rd,res.tNear)).normalize();
			res.nFar = vec2.add(p,vec2.scale(rd,res.tFar)).normalize();
		}else{
			res.tNear = 1e30;
			res.tFar = -1e30;
		}
		return res;
	}
}
class biConvexLens extends basicObject{
	constructor(center,h,d,r1,r2,brdfFnc){
		super(brdfFnc);
		this.center = center;
		this.h = h;
		this.d = d;
		this.r1 = r1;
		this.r2 = r2;
	}
	trace(ro,rd){
		return Segment.collapse(
			Segment.intersection(
			Segment.intersection(

				Segment.sphereSegmentIntersect(ro,rd,vec2.add(this.center,new vec2(this.r1 - this.d,0.0)),this.r1),
				Segment.sphereSegmentIntersect(ro,rd,vec2.sub(this.center,new vec2(this.r2 - this.d,0.0)),this.r2)
			),Segment.horzSpanIntersect(ro,rd,this.center.y,this.h)
			)
			);
	}
}
class biConcaveLens extends basicObject{
	constructor(center,h,d,r1,r2,brdfFnc){
		super(brdfFnc);
		this.center = center;
		this.h = h;
		this.d = d;
		this.r1 = r1;
		this.r2 = r2;
	}
	trace(ro,rd){
		return Segment.collapse(
			Segment.subtraction(Segment.subtraction(
					Segment.intersection(
						Segment.horzSpanIntersect(ro,rd,this.center.y,this.h),
						Segment.vertSpanIntersect(ro,rd,this.center.x+0.5*(this.r2-this.r1),0.5*(Math.abs(this.r1)+Math.abs(this.r2))+this.d)
					),Segment.sphereSegmentIntersect(ro,rd,vec2.add(this.center,new vec2(this.r2+this.d,0)),this.r2),1e-4),
					Segment.sphereSegmentIntersect(ro,rd,vec2.sub(this.center,new vec2(this.r1+this.d,0)),this.r1),1e-4)
		);
	}
}
class meniscusLens extends basicObject{
	constructor(center,h,d,r1,r2,brdfFnc){
		super(brdfFnc);
		this.center = center;
		this.h = h;
		this.d = d;
		this.r1 = r1;
		this.r2 = r2;
	}
	trace(ro,rd){
		return Segment.collapse(
			Segment.subtraction(
				Segment.intersection(
					Segment.intersection(
						Segment.horzSpanIntersect(ro,rd,this.center.y,this.h),
						Segment.vertSpanIntersect(ro,rd,this.center.x+0.5*this.r2,0.5*Math.abs(this.r2)+this.d)),
						Segment.sphereSegmentIntersect(ro,rd,vec2.add(this.center,new vec2(this.r1-Math.sign(this.r1)*this.d,0)),Math.abs(this.r1))),
					Segment.sphereSegmentIntersect(ro,rd,vec2.add(this.center,new vec2(this.r2+Math.sign(this.r2)*this.d,0)),Math.abs(this.r2)),1e-4)
				);

	}
}
