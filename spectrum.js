class Spectrum{
	constructor()
	{
		this.allocArr = [];
	}
	wavefnc(x,alpha,mu,sigma1,sigma2){
		x = (1-x)*380+x*780;
		let squareRoot = (x-mu)/(x < mu ? sigma1:sigma2);
		return alpha * Math.exp(-(squareRoot*squareRoot)/2);
	}
	getXYZnormal(lambda){
		let xyz = [
			this.wavefnc(lambda,1.056,599.8,37.9,31.0)+
			this.wavefnc(lambda,0.362, 442, 16.0, 26.7)+
        	this.wavefnc(lambda,-0.065, 501.1, 20.4, 26.2),
        	this.wavefnc(lambda,0.821, 568.8, 46.9, 40.5)+
            this.wavefnc(lambda,0.286, 530.9, 16.3, 31.1),
            this.wavefnc(lambda,1.217, 437, 11.8, 36.0)+
            this.wavefnc(lambda, 0.681, 459, 26.0, 13.8)
		];
		return xyz;
		/*return [
			Math.min(Math.max( xyz[0]*2.745-xyz[1]*1.136-xyz[2]*0.435,0),1),
			Math.min(Math.max(-xyz[0]*0.969+xyz[1]*1.876+xyz[2]*0.041,0),1),
			Math.min(Math.max( xyz[0]*0.011-xyz[1]*0.114+xyz[2]*1.013,0),1)
			
		];*/

	}
	preallocate(sampleCount){
		this.allocArr= new Float32Array(sampleCount*3);
		for(let i=0;i<sampleCount;i++){
			let val = this.getXYZnormal(i/sampleCount);
			this.allocArr[i*3] =  val[0];
			this.allocArr[i*3+1] =  val[1];
			this.allocArr[i*3+2] =  val[2];
			
		}
	}
	getRGBnormal(xyz){
		let tx = xyz[0]*0.95047;
		let ty = xyz[1];
		let tz = xyz[2]*1.08883;

		return [
			this.gammaC( tx*2.745-ty*1.136-tz*0.435),
			this.gammaC(-tx*0.969+ty*1.876+tz*0.041),
			this.gammaC( tx*0.011-ty*0.114+tz*1.013)
			
		];

	}
	gammaC(x){
		if(x <= 0.0031308){
			return x * 12.92;
		}else{
			return (1.055*x**(1/2.4)-0.055);
		}
	}
	tonemapping(x){
		const a = 2.51;
		const b = 0.03;
		const c = 2.43;
		const d = 0.59;
		const e = 0.14;
		return Math.min(Math.max(
			(x * (a*x+b))/(x*(c*x+d)+e)
			,0),1);
	}
}