(function(){
function stackedLineChart(
	width,
	height,  
	raw, 
	labels, 
	options, 
){
	function render_element(styles, el){
		for(const [kk, vv] of Object.entries(styles)){
			el.style[kk] = vv;
		}
	}

	// seperate array by index
	// [0, 1, 2, 3], 2 => [2, 3, 1, 0]
	function tail(arr, ind){
	    let mhs, lhs;
	    if(arr.length / 2 > ind){
	        mhs = arr.length - 1 - ind;
	        lhs = ind;
	    }else{
	        mhs = ind;
	        lhs = arr.length - 1 - ind;
	    }
	    let nd = [arr[ind]];
	    for(let i = 0; i < lhs; i++){
	        nd.push(arr[ind+i+1]);
	        nd.push(arr[ind-i-1]);
	    }
	    for(let i = 0; i < mhs - lhs; i++){
	        nd.push(arr[i]);
	    }
	    return nd;
	}

	// yield optimization
	// 6=>6 6=>3
	// 5=>5 5=>3
	// 4=>4 4=>2
	// 3=>3 3=>2
	// 2=>2 2=>1
	// 1=>1 1=>1
	// 21   12
	function dense(len, den){
	    let st = Math.ceil(len / den);
	    let nd = [];
	    for(let i = 0; i < st; i++){
	        for(let j = 0; j < den; j++){
	            nd.push(st - i);
	        }
	    }
	    if(len % 2 !== 0){
	        nd.shift();
	    }
	    return nd;
	}

	// shift the weight to certain part of array by index
	// de controls the rate of differing
	function shift_weight(arr, ind, de){
	    let ta = tail(arr, ind);
	    let nd = [];
	    let den = dense(arr.length, de)
	    for(let i = 0; i < ta.length; i++){
	        for(let j = 0; j < den[i]; j++){
	            nd.push(ta[i]);
	        }
	    }
	    return nd;
	}

	function parseDarkHex(den){
	  let hexcode = '0123456789abcdef';
	  let ocean = shift_weight(Array.from({length: 16}, (x, i) => hexcode[i]), 0, den);
	  return '#' + Array.from({length: 6}).map(ud=>ocean[Math.floor(Math.random() * ocean.length)]).join('');
	}

	function parseLightHex(den){
	  let hexcode = '0123456789abcdef';
	  let ocean = shift_weight(Array.from({length: 16}, (x, i) => hexcode[i]), 16, den);
	  return '#' + Array.from({length: 6}).map(ud=>ocean[Math.floor(Math.random() * ocean.length)]).join('');
	}

// 2~8, the smaller the more accurate, the larger the faster

	let canvas = document.createElement('canvas');
	let opt = Object.assign({
		lineTime: 300, 
		padW: 0.08, 
		padH: 0.2, 
		annotate: 1, 
		fontSize: '12px',
		fontFamily: 'Verdana',
		color: '#fff',
		lineColor: '#fff', 
		adjustX: 50,
		adjustY: 20,
		circleWidth: 2, 
		barHeight: 50,
		styles: {}, 
		labelWidth: 50,
		labelHeight: 20,
	}, options);
	// bar
	let container = document.createElement('div');
	container.appendChild(canvas);
	render_element(Object.assign({
		width: width.toString() + 'px',
		height: height.toString() + 'px',
		overflow: 'hidden',
		background: 'linear-gradient(45deg, #8c9adb, #db8c8c)',
		transition: 'all 250ms ease-out',
	}, opt.styles), container);
	container.addEventListener('mouseenter', function(){
		this.style.boxShadow = '0 0 15px #8c9adb';
	}.bind(container));
	container.addEventListener('mouseleave', function(){
		this.style.boxShadow = 'none';
	}.bind(container));
	let bar = document.createElement('div');
	render_element({
		width: '100%',
		height: opt.barHeight.toString() + 'px',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
	}, bar);
	container.appendChild(bar);
	// canavs
	canvas.width = width;
	canvas.height = height - opt.barHeight;
	height = height - opt.barHeight;
	function normalX(arr, w){
		let min = arr[0];
		let max = arr[0];
		for(let ii = 0; ii < arr.length; ii++){
			if(arr[ii] < min){
				min = arr[ii];
			}else if(arr[ii] > max){
				max = arr[ii];
			}
		}
		max -= min;
		return arr.map(ar=>(ar - min) / max * (w - w * opt.padW) + (w * opt.padW) / 2);
	}
	function stackY(arr){
		let brr = [arr[0]];
		for(let ii = 1; ii < arr.length; ii++){
			let ar = arr[ii];
			brr.push(brr[ii - 1].map((br, jj)=>br + ar[jj]));
		}
		return brr;
	}
	function normalY(arr, h){
		let min = arr[0][0];
		let max = arr[0][0];
		arr.forEach(ar=>{
			ar.forEach(a=>{
				if(a < min){
					min = a;
				}else if(a > max){
					max = a;
				}
			});
		})
		max -= min;
		return arr.map(brr=>brr.map(ar=>(ar - min) / max * (h - h * opt.padH) + (h * opt.padH) / 2));
	}

	function pair(arr){
		let brr = [];
		for(let ii = 1; ii < arr.length; ii++){
			brr.push([arr[ii - 1], arr[ii]])
		}
		return brr;
	}

	function getGradientByRGB(r, g, b, i, w, h){
		let gra = ctx.createLinearGradient(0, 0, w || width, h || height);
		gra.addColorStop(0, `rgb(${r - i}, ${g}, ${b + i})`);
		gra.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
		gra.addColorStop(1, `rgb(${r + i}, ${g}, ${b - i})`);
		return gra;
	}

	function random(min, max) {
	    return Math.floor((Math.random())*(max-min+1))+min;
	}

	function gradient(a, b, c, w, h){
		return getGradientByRGB(
			random(a, b),
			random(a, b),
			random(a, b),
			c,
			w, 
			h, 
		)
	}


	function gradient2(a, b, c, w, h){
		let r = random(a, b);
		let g = random(a, b);
		let b_ = random(a, b);
		return [getGradientByRGB(r, g, b_, c), `rgb(${r}, ${g}, ${b})`];
	}

	let data = {
		x: normalX(raw.x, width),
		y: normalY(stackY(raw.y), height),
	}
	data.y.reverse();

	let ctx = canvas.getContext('2d');
	const render = ()=>{
		let st = 70;
		let ic = data.y.length > 6 ? 15 : 30;
		let gradients = data.y.map((dd, ii)=>gradient2(st + ii * ic, (st + ic) + ii * ic, 20, opt.labelWidth, opt.labelHeight));
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = gradient(100, 130, 20);
		ctx.fillRect(0, 0, width, height);
		ctx.strokeStyle = opt.lineColor;
		data.y.forEach((yys, jj)=>{
			setTimeout(()=>{
				let ys = pair(yys)
				let xs = pair(data.x);
				ctx.beginPath();
				xs.forEach((xp, ii)=>{
					setTimeout(()=>{
						let yp = ys[ii];
						ctx.moveTo(xp[0], 0);
						ctx.lineTo(xp[0], yp[0]);
						ctx.lineTo(xp[1], yp[1]);
						ctx.lineTo(xp[1], 0);
						ctx.stroke();
						ctx.fillStyle = gradients[jj][0];
						ctx.fill();
					}, ii * opt.lineTime / xs.length);
				});
			}, jj * opt.lineTime);
		});

		if(opt.annotate){
			ctx.font = `${opt.fontSize} ${opt.fontFamily}`;
			setTimeout(()=>{
				data.y.forEach((yys, jj)=>{
					setTimeout(()=>{
						let ys = pair(yys)
						let xs = pair(data.x);
						ctx.beginPath();
						xs.forEach((xp, ii)=>{
							setTimeout(()=>{
								let yp = ys[ii];
								ctx.moveTo(xp[0], yp[0]);
								ctx.arc(xp[0], yp[0], opt.circleWidth, 0, 360);
								ctx.fillStyle = opt.color;
								ctx.fillText(raw.y[jj][ii], xp[0] - width / opt.adjustX, yp[0] + height / opt.adjustY);
								if(ii === xs.length - 1){
									// last one include the second in the pair
									ctx.moveTo(xp[1], yp[1]);
									ctx.arc(xp[1], yp[1], 2.5, 0, 360);
									ctx.fill();
									ctx.fillStyle = opt.color;
									ctx.fillText(raw.y[jj][ii], xp[1] - width / opt.adjustX, yp[1] + height / opt.adjustY);
								}
							}, ii * opt.lineTime / xs.length);
						});
					}, jj * opt.lineTime);
				})
			}, opt.lineTime * data.y.length);
		}

		bar.innerHTML = '';
		bar.style.backgroundColor = '#adb6c9';
		gradients.forEach((gra, ii)=>{
			let [
				wrapper,
				text, 
			] = Array.from({length: 2}, ()=>document.createElement('div'));
			let area = document.createElement('canvas');
			wrapper.appendChild(area);
			wrapper.appendChild(text);
			render_element({
				display: 'flex',
				flexDirection: 'row',
				padding: '3px', 
				backgroundColor: 'rgb(214, 214, 214)',
				color: '#523b00', 
				boxShadow: '0 0 2.5px #523b00',
			}, wrapper);
			render_element({
				fontFamily: 'Verdana',
				fontSize: '18px',
				marginLeft: '5px',
				marginRight: '5px',
			}, text);
			text.innerText = labels[ii];
			bar.appendChild(wrapper);
			let g = gra[1];
			let ctx = area.getContext('2d');
			area.width = opt.labelWidth;
			area.height = opt.labelHeight;
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, area.width, area.height);
		});
	}

	return {
		canvas: canvas, 
		container: container, 
		render: render, 
	};
}

window.stackedLineChart = stackedLineChart;
})()
