class colorBlindness{
	constructor(blindMtx){
		this.matrix = [0.313,0.639,0.046,0.155,0.757,0.086,0.017,0.109,0.872];
		this.imtx = [5.472,-4.641,0.169,-1.125,2.293,-0.167,0.029,-0.193,1.163];
		this.blindMtx = blindMtx;
	}
	RGBtoLMS(r,g,b){
		return [
			r*this.matrix[0]+g*this.matrix[1]+b*this.matrix[2],
			r*this.matrix[3]+g*this.matrix[4]+b*this.matrix[5],
			r*this.matrix[6]+g*this.matrix[7]+b*this.matrix[8]
		];
	}
	LMStoRGB(L,M,S){
		return [
			L*this.imtx[0]+M*this.imtx[1]+S*this.imtx[2],
			L*this.imtx[3]+M*this.imtx[4]+S*this.imtx[5],
			L*this.imtx[6]+M*this.imtx[7]+S*this.imtx[8]
		];
	}
	blindnessSim(L,M,S){
		return [
			L*this.blindMtx[0]+M*this.blindMtx[1]+S*this.blindMtx[2],
			L*this.blindMtx[3]+M*this.blindMtx[4]+S*this.blindMtx[5],
			L*this.blindMtx[6]+M*this.blindMtx[7]+S*this.blindMtx[8]
		];
	}
	simulate(r,g,b){
		let c1 = this.RGBtoLMS(r,g,b);
		let c2 = this.blindnessSim(...c1);
		return this.LMStoRGB(...c2);

	}

}