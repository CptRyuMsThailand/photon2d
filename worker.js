let fbuff = [];
let W = 0;
let H = 0;
let channelCount = 0;
onmessage = function(e){
	let lineList = e.data[0]; //Line list contain array of {pos:<arr>,intensity:<value>,channel:<int>}
	W = e.data[1];
	H = e.data[2];
	let channelCount = e.data[3];

	fbuff = new Float32Array(W*H*channelCount);
	let len = lineList.length;
	for(let i=0;i<len;i++){
		drawLine(...lineList[i].pos,lineList[i].intensity/len,lineList.channel);
	}
	postMessage([fbuff,len/channelCount]);
}




function drawLine(x0,y0,x1,y1,c,ch){


	function plot(x,y,v){
		if(x >= 0 && x < W && y >= 0 && y < H)
		fbuff[(x+y*W)*(channelCount)+ch] += c*v;
	}
	function ipart(x){
		return Math.floor(x);
	}
	function round(x){
		return ipart(x+0.5);
	}
	function fpart(x){
		return x-Math.floor(x);
	}
	function rfpart(x){
		return 1 - fpart(x);
	}

	let steep = Math.abs(y1-y0) > Math.abs(x1-x0);
	if(steep ){
		let tmp = x0;
		x0 = y0;
		y0 = tmp;
		tmp = x1;
		x1 = y1;
		y1 = tmp;
	}
	if(x0 > x1){
		let tmp = x0;
		x0 = x1;
		x1 = tmp;
		tmp = y0;
		y0 = y1;
		y1 = tmp;
	}
	let dx = x1-x0;
	let dy = y1-y0;
	let gradient = dy / dx;
	if(dx == 0){
		gradient = 1.0;
	}
	let xend = round(x0);
	let yend = y0+gradient*(xend-x0);
	let xgap = rfpart(x0 + 0.5);
	let xpxl1 = xend;
	let ypxl1 = ipart(yend);

	if(steep){
		plot(ypxl1  ,xpxl1, rfpart(yend)*xgap);
		plot(ypxl1+1,xpxl1,  fpart(yend)*xgap);
	}else{
		plot(xpxl1, ypxl1 ,rfpart(yend)*xgap);
		plot(xpxl1, ypxl1+1,fpart(yend)*xgap);
	}
	let intery = yend + gradient;
	xend = round(x1);
	yend = y1 + gradient * (xend - x1);
	xgap = fpart(x1+0.5);
	let xpxl2 = xend;
	let ypxl2 = ipart(yend);
	if(steep ){
		plot(ypxl2 ,xpxl2,rfpart(yend)*xgap);
		plot(ypxl2+1,xpxl2,fpart(yend)*xgap);
	}else{
		plot(xpxl2,ypxl2 ,rfpart(yend)*xgap);
		plot(xpxl2,ypxl2+1,fpart(yend)*xgap);
	}
	if(steep ){
		for(let x=xpxl1+1; x < xpxl2; x++){
			plot(ipart(intery),x,rfpart(intery));
			plot(ipart(intery)+1,x,fpart(intery));
			intery = intery + gradient;
		}
	}else{
		for(let x=xpxl1+1; x < xpxl2; x++){
			plot(x,ipart(intery),rfpart(intery));
			plot(x,ipart(intery)+1,fpart(intery));
			intery = intery + gradient;
		}
	}
}